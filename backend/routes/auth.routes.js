const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { verifyPatientToken } = require('../middleware/authPatient');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production_12345';

// Helper functions
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .limit(1);
  if (error) throw error;
  return data?.[0];
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .limit(1);
  if (error) throw error;
  return data?.[0];
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;
    if (!name || !email || !mobileNumber || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber))
      return res.status(400).json({ success: false, message: 'Mobile number must be 10 digits' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });

    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email.toLowerCase()},mobilenumber.eq.${mobileNumber}`)
      .limit(1);

    if (checkError) throw checkError;
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: existingUsers[0].email === email.toLowerCase()
          ? 'Email already registered'
          : 'Mobile number already registered'
      });
    }

    const { data: lastPatient, error: lastPatientError } = await supabase
      .from('patients')
      .select('patient_id')
      .order('id', { ascending: false })
      .limit(1);

    if (lastPatientError) throw lastPatientError;

    let newPatientId = 'P0001';
    if (lastPatient && lastPatient.length > 0 && lastPatient[0].patient_id) {
      const lp = lastPatient[0].patient_id;
      const lastId = parseInt(lp.substring(1)) || 0;
      newPatientId = `P${String(lastId + 1).padStart(4, '0')}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertUserError } = await supabase
      .from('users')
      .insert([{
        patient_id: newPatientId,
        name,
        email: email.toLowerCase(),
        mobilenumber: mobileNumber,
        password: hashedPassword,
        isverified: false,
        createdat: new Date().toISOString(),
        logincount: 0
      }])
      .select('id');

    if (insertUserError) throw insertUserError;

    const { error: insertPatientError } = await supabase
      .from('patients')
      .insert([{
        patient_id: newPatientId,
        name,
        medications: JSON.stringify([]),
        vaccination_records: JSON.stringify([])
      }]);

    if (insertPatientError) throw insertPatientError;

    const newUserId = newUser[0].id;
    const token = jwt.sign(
      { userId: newUserId, email: email.toLowerCase(), patientId: newPatientId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('New user registered: ' + email.toLowerCase() + ' | Patient ID: ' + newPatientId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: newUserId, patient_id: newPatientId, name, email: email.toLowerCase(), mobileNumber, isVerified: false }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during sign up', error: error.message });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    console.log('Signin request received - Email: ' + req.body.email);
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .limit(1);

    if (userError) throw userError;

    const user = users?.[0];
    if (!user) return res.status(404).json({ success: false, message: 'Account not found with this email' });
    if (!user.password) return res.status(400).json({ success: false, message: 'Password not set for this account' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user.id, email: user.email, patientId: user.patient_id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({ lastlogin: new Date().toISOString(), logincount: (user.logincount || 0) + 1 })
      .eq('id', user.id);

    if (updateError) throw updateError;

    console.log('Login successful for: ' + user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        patient_id: user.patient_id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobilenumber,
        isVerified: user.isverified,
        createdAt: user.createdat,
        requiresPasswordChange: user.requirespasswordchange || false
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, message: 'Server error during sign in', error: error.message });
  }
});

// GET /api/auth/user/email/:email
router.get('/user/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, patient_id: user.patient_id, name: user.name, email: user.email, mobileNumber: user.mobilenumber, isVerified: user.isverified });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/auth/user/profile
router.get('/user/profile', verifyPatientToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({
      success: true,
      user: {
        id: user.id, patient_id: user.patient_id, name: user.name, email: user.email,
        mobileNumber: user.mobilenumber, isVerified: user.isverified, createdAt: user.createdat,
        lastLogin: user.lastlogin, loginCount: user.logincount || 0
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/user/profile
router.put('/user/profile', verifyPatientToken, async (req, res) => {
  try {
    const { name, mobileNumber } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (mobileNumber) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileNumber))
        return res.status(400).json({ success: false, message: 'Mobile number must be 10 digits' });
      updateFields.mobilenumber = mobileNumber;
    }
    if (Object.keys(updateFields).length === 0)
      return res.status(400).json({ success: false, message: 'No fields to update' });

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', req.userId)
      .select('id, patient_id, name, email, mobilenumber, isverified, createdat');

    if (updateError) throw updateError;
    if (!updated || updated.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Profile updated successfully', user: updated[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
