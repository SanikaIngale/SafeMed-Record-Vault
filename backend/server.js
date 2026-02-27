const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware - Allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Add logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production_12345';
const PORT = process.env.PORT || 5000;
const HOST_IP = process.env.HOST_IP;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function connectToDatabase() {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connected');
    console.log('Connection: ' + (process.env.SUPABASE_URL || 'Not configured'));
  } catch (err) {
    console.error('Supabase connection error:', err);
    process.exit(1);
  }
}

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.patientId = decoded.patientId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Utilities
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
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

async function getPatient(patient_id) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_id', patient_id)
    .limit(1);
  if (error) throw error;
  
  const patient = data?.[0];
  if (patient) {
    // Parse JSON fields if they're strings
    if (typeof patient.medications === 'string') {
      try {
        patient.medications = JSON.parse(patient.medications);
      } catch (e) {
        patient.medications = [];
      }
    }
    if (typeof patient.vaccination_records === 'string') {
      try {
        patient.vaccination_records = JSON.parse(patient.vaccination_records);
      } catch (e) {
        patient.vaccination_records = [];
      }
    }
    if (typeof patient.demographics === 'string') {
      try {
        patient.demographics = JSON.parse(patient.demographics);
      } catch (e) {
        patient.demographics = {};
      }
    }
    if (typeof patient.allergies === 'string') {
      try {
        patient.allergies = JSON.parse(patient.allergies);
      } catch (e) {
        patient.allergies = [];
      }
    }
    if (typeof patient.conditions === 'string') {
      try {
        patient.conditions = JSON.parse(patient.conditions);
      } catch (e) {
        patient.conditions = [];
      }
    }
    if (typeof patient.emergency_contacts === 'string') {
      try {
        patient.emergency_contacts = JSON.parse(patient.emergency_contacts);
      } catch (e) {
        patient.emergency_contacts = [];
      }
    }
  }
  return patient;
}

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;
    if (!name || !email || !mobileNumber || !password) return res.status(400).json({ success: false, message: 'All fields are required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) return res.status(400).json({ success: false, message: 'Mobile number must be 10 digits' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });

    // Check for existing user
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email.toLowerCase()},mobilenumber.eq.${mobileNumber}`)
      .limit(1);
    
    if (checkError) throw checkError;
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: existingUsers[0].email === email.toLowerCase() ? 'Email already registered' : 'Mobile number already registered' });
    }

    // Generate new patient ID
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

    // Insert user
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

    // Insert patient
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
    const token = jwt.sign({ userId: newUserId, email: email.toLowerCase(), patientId: newPatientId }, JWT_SECRET, { expiresIn: '30d' });

    console.log('New user registered: ' + email.toLowerCase() + ' | Patient ID: ' + newPatientId);

    res.status(201).json({ success: true, message: 'Account created successfully', token, user: { id: newUserId, patient_id: newPatientId, name, email: email.toLowerCase(), mobileNumber, isVerified: false } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during sign up', error: error.message });
  }
});

// POST /api/signin
app.post('/api/signin', async (req, res) => {
  try {
    console.log('Signin request received - Email: ' + req.body.email);
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (userError) throw userError;
    
    const user = users?.[0];
    if (!user) return res.status(404).json({ success: false, message: 'Account not found with this email' });
    if (!user.password) return res.status(400).json({ success: false, message: 'Password not set for this account' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, email: user.email, patientId: user.patient_id }, JWT_SECRET, { expiresIn: '30d' });

    // Update last login and login count
    const { error: updateError } = await supabase
      .from('users')
      .update({
        lastlogin: new Date().toISOString(),
        logincount: (user.logincount || 0) + 1
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;

    console.log('Login successful for: ' + user.email);

    res.json({ success: true, message: 'Login successful', token, user: { id: user.id, patient_id: user.patient_id, name: user.name, email: user.email, mobileNumber: user.mobilenumber, isVerified: user.isverified, createdAt: user.createdat, requiresPasswordChange: user.requirespasswordchange || false } });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, message: 'Server error during sign in', error: error.message });
  }
});

// GET /api/user/email/:email
app.get('/api/user/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching user by email: ' + email);
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, patient_id: user.patient_id, name: user.name, email: user.email, mobileNumber: user.mobilenumber, isVerified: user.isverified });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/patients/:patientId
app.get('/api/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Fetching patient data for: ' + patientId);
    const patient = await getPatient(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient data not found' });
    res.json({ success: true, ...patient });
  } catch (error) {
    console.error('Error fetching patient data:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============ MEDICATION ENDPOINTS ============

// GET /api/medications/:patientId
app.get('/api/medications/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Fetching medications for patient: ' + patientId);
    const patient = await getPatient(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const meds = patient.medications || [];
    const medications = meds.map((med, index) => ({ id: med.id || Date.now() + index, name: med.name, purpose: med.reason || '', dosage: med.dosage, frequency: med.frequency, time: med.time || '', startDate: med.start_date || '' }));
    res.json({ success: true, medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/medications/:patientId
app.post('/api/medications/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, purpose, dosage, frequency, time, startDate } = req.body;
    console.log('Adding medication for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('medications')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (patientError) throw patientError;
    if (!patients || patients.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    // Parse medications if it's a string
    let meds = patients[0].medications;
    if (typeof meds === 'string') {
      try {
        meds = JSON.parse(meds || '[]');
      } catch (e) {
        meds = [];
      }
    }
    if (!Array.isArray(meds)) meds = [];
    
    const newMedication = { id: Date.now(), name, reason: purpose, dosage, frequency, time: time || '', start_date: startDate || '' };
    meds.push(newMedication);
    
    const { error: updateError } = await supabase
      .from('patients')
      .update({ medications: JSON.stringify(meds) })
      .eq('patient_id', patientId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Medication added successfully', medication: { id: newMedication.id, name: newMedication.name, purpose: newMedication.reason, dosage: newMedication.dosage, frequency: newMedication.frequency, time: newMedication.time, startDate: newMedication.start_date } });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/medications/:patientId/:medicationId
app.put('/api/medications/:patientId/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;
    const { name, purpose, dosage, frequency, time, startDate } = req.body;
    console.log('Updating medication: ' + medicationId + ' for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('medications')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (patientError) throw patientError;
    if (!patients || patients.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    // Parse medications if it's a string
    let meds = patients[0].medications;
    if (typeof meds === 'string') {
      try {
        meds = JSON.parse(meds || '[]');
      } catch (e) {
        meds = [];
      }
    }
    if (!Array.isArray(meds)) meds = [];
    
    const idx = meds.findIndex(m => String(m.id) === String(medicationId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Medication not found' });
    
    meds[idx] = { ...meds[idx], name, reason: purpose, dosage, frequency, time: time || '', start_date: startDate || '' };
    
    const { error: updateError } = await supabase
      .from('patients')
      .update({ medications: JSON.stringify(meds) })
      .eq('patient_id', patientId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Medication updated successfully' });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/medications/:patientId/:medicationId
app.delete('/api/medications/:patientId/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;
    console.log('Deleting medication: ' + medicationId + ' for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('medications')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (patientError) throw patientError;
    if (!patients || patients.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    // Parse medications if it's a string
    let meds = patients[0].medications;
    if (typeof meds === 'string') {
      try {
        meds = JSON.parse(meds || '[]');
      } catch (e) {
        meds = [];
      }
    }
    if (!Array.isArray(meds)) meds = [];
    
    const filtered = meds.filter(m => String(m.id) !== String(medicationId));
    
    const { error: updateError } = await supabase
      .from('patients')
      .update({ medications: JSON.stringify(filtered) })
      .eq('patient_id', patientId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============ VACCINATION ENDPOINTS ============

// GET /api/vaccinations/:patientId
app.get('/api/vaccinations/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Fetching vaccinations for patient: ' + patientId);
    const patient = await getPatient(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const vacs = patient.vaccination_records || [];
    const vaccinations = vacs.map((vac, index) => ({ id: vac.id || Date.now() + index, name: vac.name, date: vac.date, location: vac.hospital || '', doseNumber: vac.dose || '', nextDue: vac.next_due || 'N/A' }));
    res.json({ success: true, vaccinations });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/vaccinations/:patientId
app.post('/api/vaccinations/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, date, location, doseNumber, nextDue } = req.body;
    console.log('Adding vaccination for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('vaccination_records')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (patientError) throw patientError;
    if (!patients || patients.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    // Parse vaccination_records if it's a string
    let vacs = patients[0].vaccination_records;
    if (typeof vacs === 'string') {
      try {
        vacs = JSON.parse(vacs || '[]');
      } catch (e) {
        vacs = [];
      }
    }
    if (!Array.isArray(vacs)) vacs = [];
    
    const newVaccination = { id: Date.now(), name, date, hospital: location || '', dose: doseNumber || '', next_due: nextDue || 'N/A' };
    vacs.push(newVaccination);
    
    const { error: updateError } = await supabase
      .from('patients')
      .update({ vaccination_records: JSON.stringify(vacs) })
      .eq('patient_id', patientId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Vaccination added successfully', vaccination: { id: newVaccination.id, name: newVaccination.name, date: newVaccination.date, location: newVaccination.hospital, doseNumber: newVaccination.dose, nextDue: newVaccination.next_due } });
  } catch (error) {
    console.error('Error adding vaccination:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/vaccinations/:patientId/:vaccinationId
app.put('/api/vaccinations/:patientId/:vaccinationId', async (req, res) => {
  try {
    const { patientId, vaccinationId } = req.params;
    const { name, date, location, doseNumber, nextDue } = req.body;
    console.log('Updating vaccination: ' + vaccinationId + ' for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('vaccination_records')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (patientError) throw patientError;
    if (!patients || patients.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    // Parse vaccination_records if it's a string
    let vacs = patients[0].vaccination_records;
    if (typeof vacs === 'string') {
      try {
        vacs = JSON.parse(vacs || '[]');
      } catch (e) {
        vacs = [];
      }
    }
    if (!Array.isArray(vacs)) vacs = [];
    
    const idx = vacs.findIndex(v => String(v.id) === String(vaccinationId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Vaccination not found' });
    
    vacs[idx] = { ...vacs[idx], name, date, hospital: location || '', dose: doseNumber || '', next_due: nextDue || 'N/A' };
    
    const { error: updateError } = await supabase
      .from('patients')
      .update({ vaccination_records: JSON.stringify(vacs) })
      .eq('patient_id', patientId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Vaccination updated successfully' });
  } catch (error) {
    console.error('Error updating vaccination:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/vaccinations/:patientId/:vaccinationId
app.delete('/api/vaccinations/:patientId/:vaccinationId', async (req, res) => {
  try {
    const { patientId, vaccinationId } = req.params;
    console.log('Deleting vaccination: ' + vaccinationId + ' for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('vaccination_records')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (patientError) throw patientError;
    if (!patients || patients.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    // Parse vaccination_records if it's a string
    let vacs = patients[0].vaccination_records;
    if (typeof vacs === 'string') {
      try {
        vacs = JSON.parse(vacs || '[]');
      } catch (e) {
        vacs = [];
      }
    }
    if (!Array.isArray(vacs)) vacs = [];
    
    const filteredVacs = vacs.filter(v => String(v.id) !== String(vaccinationId));
    
    const { error: updateError } = await supabase
      .from('patients')
      .update({ vaccination_records: JSON.stringify(filteredVacs) })
      .eq('patient_id', patientId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Vaccination deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/user/profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user: { id: user.id, patient_id: user.patient_id, name: user.name, email: user.email, mobileNumber: user.mobilenumber, isVerified: user.isverified, createdAt: user.createdat, lastLogin: user.lastlogin, loginCount: user.logincount || 0 } });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/user/profile
app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { name, mobileNumber } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (mobileNumber) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileNumber)) return res.status(400).json({ success: false, message: 'Mobile number must be 10 digits' });
      updateFields.mobilenumber = mobileNumber;
    }
    if (Object.keys(updateFields).length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', req.userId)
      .select('id, patient_id, name, email, mobilenumber, isverified, createdat');
    
    if (updateError) throw updateError;
    if (!updated || updated.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, message: 'Profile updated successfully', user: updated[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/patients/demographics - Save user demographics after profile completion
app.post('/api/patients/demographics', async (req, res) => {
  try {
    const { userId, email, name, dob, gender, bloodType, height, weight, chronicConditions, allergies } = req.body;
    console.log('Saving demographics for: ' + email);

    if (!email || !gender || !bloodType || !height || !weight) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get patient_id from users table using email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('patient_id')
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (userError) throw userError;
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const patientId = users[0].patient_id;

    // Update patient demographics and related fields
    const demographicsData = {
      dob,
      gender,
      bloodType,
      height: parseFloat(height),
      weight: parseFloat(weight),
      chronicConditions: chronicConditions ? (typeof chronicConditions === 'string' ? chronicConditions.split(',').map(c => c.trim()) : chronicConditions) : []
    };

    const { data: updated, error: updateError } = await supabase
      .from('patients')
      .update({
        demographics: JSON.stringify(demographicsData),
        name,
        allergies: allergies ? JSON.stringify(allergies) : JSON.stringify([]),
        emergency_contacts: JSON.stringify([])
      })
      .eq('patient_id', patientId)
      .select('patient_id, name, demographics, allergies, emergency_contacts');

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    console.log('Demographics saved for patient: ' + patientId);

    res.json({
      success: true,
      message: 'Demographics saved successfully',
      patient_id: patientId,
      demographics: demographicsData,
      allergies: updated[0].allergies || [],
      emergency_contacts: updated[0].emergency_contacts || []
    });
  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.post('/api/patient/demographics', async (req, res) => {
  try {
    const { email, name, dob, gender, bloodType, height, weight } = req.body;

    console.log('Saving demographics for:', email);

    // Required field validation
    if (!email || !gender || !bloodType || height == null || weight == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get patient_id using email (email exists ONLY in users table)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('patient_id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const patientId = users[0].patient_id;

    // Build demographics JSON (only allowed fields)
    const demographicsData = {
      dob,
      gender,
      bloodType,
      height: Number(height),
      weight: Number(weight)
    };

    // Update patients table (NO email column here)
    const { data: updated, error: updateError } = await supabase
      .from('patients')
      .update({
        name,
        demographics: JSON.stringify(demographicsData)
      })
      .eq('patient_id', patientId)
      .select('patient_id, name, demographics');

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found'
      });
    }

    console.log('Demographics saved for patient:', patientId);

    res.json({
      success: true,
      message: 'Demographics saved successfully',
      patient_id: updated[0].patient_id,
      name: updated[0].name,
      demographics: updated[0].demographics
    });

  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


// GET /api/patients/:patientId/demographics - Fetch patient demographics
app.get('/api/patients/:patientId/demographics', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Fetching demographics for patient: ' + patientId);
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('demographics, allergies, emergency_contacts')
      .eq('patient_id', patientId)
      .limit(1);

    if (patientError) throw patientError;
    if (!patients || patients.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patient = patients[0];
    
    // Parse JSON fields if they're strings
    const demographics = typeof patient.demographics === 'string' ? JSON.parse(patient.demographics || '{}') : (patient.demographics || {});
    const allergies = typeof patient.allergies === 'string' ? JSON.parse(patient.allergies || '[]') : (patient.allergies || []);
    const emergency_contacts = typeof patient.emergency_contacts === 'string' ? JSON.parse(patient.emergency_contacts || '[]') : (patient.emergency_contacts || []);
    
    res.json({
      success: true,
      demographics,
      allergies,
      emergency_contacts
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/patients/:patientId/demographics - Update patient demographics
app.put('/api/patients/:patientId/demographics', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { dob, gender, bloodType, height, weight, chronicConditions, allergies, emergency_contacts } = req.body;
    console.log('Updating demographics for patient: ' + patientId);
    
    const demographicsData = {
      dob: dob || undefined,
      gender: gender || undefined,
      bloodType: bloodType || undefined,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      chronicConditions: chronicConditions ? (typeof chronicConditions === 'string' ? chronicConditions.split(',').map(c => c.trim()) : chronicConditions) : undefined
    };

    // Remove undefined values
    Object.keys(demographicsData).forEach(key => demographicsData[key] === undefined && delete demographicsData[key]);

    const { data: patients, error: getError } = await supabase
      .from('patients')
      .select('demographics')
      .eq('patient_id', patientId)
      .limit(1);
    
    if (getError) throw getError;
    if (!patients || patients.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Merge with existing demographics, handling string parsing
    let existingDemographics = {};
    try {
      const raw = patients[0].demographics;
      existingDemographics = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
    } catch (e) {
      existingDemographics = {};
    }
    const mergedDemographics = { ...existingDemographics, ...demographicsData };

    const { data: updated, error: updateError } = await supabase
      .from('patients')
      .update({
        demographics: JSON.stringify(mergedDemographics),
        allergies: allergies ? JSON.stringify(allergies) : JSON.stringify([]),
        emergency_contacts: emergency_contacts ? JSON.stringify(emergency_contacts) : JSON.stringify([])
      })
      .eq('patient_id', patientId)
      .select('demographics, allergies, emergency_contacts');

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    console.log('Demographics updated for patient: ' + patientId);

    // Parse response
    const demographics = typeof updated[0].demographics === 'string' ? JSON.parse(updated[0].demographics || '{}') : (updated[0].demographics || {});
    const allergiesResp = typeof updated[0].allergies === 'string' ? JSON.parse(updated[0].allergies || '[]') : (updated[0].allergies || []);
    const emergency_contactsResp = typeof updated[0].emergency_contacts === 'string' ? JSON.parse(updated[0].emergency_contacts || '[]') : (updated[0].emergency_contacts || []);

    res.json({
      success: true,
      message: 'Demographics updated successfully',
      demographics,
      allergies: allergiesResp,
      emergency_contacts: emergency_contactsResp
    });
  } catch (error) {
    console.error('Error updating demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


// GET allergies
app.get('/api/patients/:patientId/allergies', async (req, res) => {
  const { patientId } = req.params;
  const { data: result, error } = await supabase
    .from('patients')
    .select('allergies')
    .eq('patient_id', patientId)
    .limit(1);
  
  if (error) {
    console.error('Error fetching allergies:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
  const allergies = result?.[0]?.allergies;
  const parsed = typeof allergies === 'string' ? JSON.parse(allergies || '[]') : (allergies || []);
  res.json({ success: true, allergies: parsed });
});

// POST allergies
app.post('/api/patients/:patientId/allergies', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { allergies } = req.body;
    console.log('Updating allergies for patient: ' + patientId);

    // Validate input
    let allergiesToSave = allergies;
    if (typeof allergiesToSave === 'string') {
      try {
        allergiesToSave = JSON.parse(allergiesToSave || '[]');
      } catch (e) {
        allergiesToSave = [];
      }
    }
    if (!Array.isArray(allergiesToSave)) allergiesToSave = [];

    const { error } = await supabase
      .from('patients')
      .update({ allergies: JSON.stringify(allergiesToSave) })
      .eq('patient_id', patientId);
    
    if (error) {
      console.error('Error updating allergies:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in allergies endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET conditions
app.get('/api/patients/:patientId/conditions', async (req, res) => {
  const { patientId } = req.params;
  const { data: result, error } = await supabase
    .from('patients')
    .select('conditions')
    .eq('patient_id', patientId)
    .limit(1);
  
  if (error) {
    console.error('Error fetching conditions:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
  const conditions = result?.[0]?.conditions;
  const parsed = typeof conditions === 'string' ? JSON.parse(conditions || '[]') : (conditions || []);
  res.json({ success: true, conditions: parsed });
});

// POST conditions
app.post('/api/patients/:patientId/conditions', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { conditions } = req.body;
    console.log('Updating conditions for patient: ' + patientId);

    // Validate input
    let conditionsToSave = conditions;
    if (typeof conditionsToSave === 'string') {
      try {
        conditionsToSave = JSON.parse(conditionsToSave || '[]');
      } catch (e) {
        conditionsToSave = [];
      }
    }
    if (!Array.isArray(conditionsToSave)) conditionsToSave = [];

    const { error } = await supabase
      .from('patients')
      .update({ conditions: JSON.stringify(conditionsToSave) })
      .eq('patient_id', patientId);
    
    if (error) {
      console.error('Error updating conditions:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in conditions endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


// GET emergency contacts
app.get('/api/patients/:patientId/emergency-contacts', async (req, res) => {
  const { patientId } = req.params;
  const { data: result, error } = await supabase
    .from('patients')
    .select('emergency_contacts')
    .eq('patient_id', patientId)
    .limit(1);
  
  if (error) {
    console.error('Error fetching emergency contacts:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
  const emergency_contacts = result?.[0]?.emergency_contacts;
  const parsed = typeof emergency_contacts === 'string' ? JSON.parse(emergency_contacts || '[]') : (emergency_contacts || []);
  res.json({ success: true, emergency_contacts: parsed });
});

// POST emergency contacts
app.post('/api/patients/:patientId/emergency-contacts', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { emergency_contacts } = req.body;
    console.log('Updating emergency contacts for patient: ' + patientId);

    // Validate input
    let contactsToSave = emergency_contacts;
    if (typeof contactsToSave === 'string') {
      try {
        contactsToSave = JSON.parse(contactsToSave || '[]');
      } catch (e) {
        contactsToSave = [];
      }
    }
    if (!Array.isArray(contactsToSave)) contactsToSave = [];

    const { error } = await supabase
      .from('patients')
      .update({ emergency_contacts: JSON.stringify(contactsToSave) })
      .eq('patient_id', patientId);
    
    if (error) {
      console.error('Error updating emergency contacts:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in emergency contacts endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/health
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ status: 'OK', message: 'Medical Wallet API is running', timestamp: new Date().toISOString(), database: 'Connected', environment: process.env.NODE_ENV || 'development' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Start server
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\nMedical Wallet Backend API');
    console.log('================================');
    console.log('Server running on port ' + PORT);
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('Local: http://localhost:' + PORT + '/api');
    console.log('Network: http://' + HOST_IP + ':' + PORT + '/api');
    console.log('Health Check: http://localhost:' + PORT + '/api/health');
    console.log('================================\n');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});