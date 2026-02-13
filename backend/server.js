const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
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
const HOST_IP = process.env.HOST_IP || '10.185.77.5';

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function connectToDatabase() {
  try {
    await pool.query('SELECT 1');
    console.log('Postgres connected');
    console.log('Connection: ' + (process.env.DATABASE_URL || 'PGHOST...'));
  } catch (err) {
    console.error('Postgres connection error:', err);
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
  const res = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
  return res.rows[0];
}

async function getUserById(id) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return res.rows[0];
}

async function getPatient(patient_id) {
  const res = await pool.query('SELECT * FROM patients WHERE patient_id = $1 LIMIT 1', [patient_id]);
  return res.rows[0];
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

    const client = await pool.connect();
    try {
      // Check for existing user
      const existingRes = await client.query('SELECT * FROM users WHERE email = $1 OR mobilenumber = $2 LIMIT 1', [email.toLowerCase(), mobileNumber]);
      if (existingRes.rows[0]) return res.status(409).json({ success: false, message: existingRes.rows[0].email === email.toLowerCase() ? 'Email already registered' : 'Mobile number already registered' });

      // Generate new patient ID
      const lastPatientRes = await client.query('SELECT patient_id FROM patients ORDER BY id DESC LIMIT 1');
      let newPatientId = 'P0001';
      if (lastPatientRes.rows[0] && lastPatientRes.rows[0].patient_id) {
        const lp = lastPatientRes.rows[0].patient_id;
        const lastId = parseInt(lp.substring(1)) || 0;
        newPatientId = `P${String(lastId + 1).padStart(4, '0')}`;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUser = await client.query(
        `INSERT INTO users (patient_id, name, email, mobilenumber, password, isverified, createdat, logincount)
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),0) RETURNING id`,
        [newPatientId, name, email.toLowerCase(), mobileNumber, hashedPassword, false]
      );

      await client.query(
        `INSERT INTO patients (patient_id, name, medications, vaccination_records)
         VALUES ($1,$2,$3,$4)`,
        [newPatientId, name, JSON.stringify([]), JSON.stringify([])]
      );

      const newUserId = insertUser.rows[0].id;
      const token = jwt.sign({ userId: newUserId, email: email.toLowerCase(), patientId: newPatientId }, JWT_SECRET, { expiresIn: '30d' });

      console.log('New user registered: ' + email.toLowerCase() + ' | Patient ID: ' + newPatientId);

      res.status(201).json({ success: true, message: 'Account created successfully', token, user: { id: newUserId, patient_id: newPatientId, name, email: email.toLowerCase(), mobileNumber, isVerified: false } });
    } finally {
      client.release();
    }
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

    const client = await pool.connect();
    try {
      const userRes = await client.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
      const user = userRes.rows[0];
      if (!user) return res.status(404).json({ success: false, message: 'Account not found with this email' });
      if (!user.password) return res.status(400).json({ success: false, message: 'Password not set for this account' });

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const token = jwt.sign({ userId: user.id, email: user.email, patientId: user.patient_id }, JWT_SECRET, { expiresIn: '30d' });

      await client.query('UPDATE users SET lastlogin = NOW(), logincount = COALESCE(logincount,0) + 1 WHERE id = $1', [user.id]);

      console.log('Login successful for: ' + user.email);

      res.json({ success: true, message: 'Login successful', token, user: { id: user.id, patient_id: user.patient_id, name: user.name, email: user.email, mobileNumber: user.mobilenumber, isVerified: user.isverified, createdAt: user.createdat, requiresPasswordChange: user.requirespasswordchange || false } });
    } finally {
      client.release();
    }
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
    const client = await pool.connect();
    try {
      const patientRes = await client.query('SELECT medications FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
      if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
      const meds = patientRes.rows[0].medications || [];
      const newMedication = { id: Date.now(), name, reason: purpose, dosage, frequency, time: time || '', start_date: startDate || '' };
      meds.push(newMedication);
      await client.query('UPDATE patients SET medications = $1 WHERE patient_id = $2', [JSON.stringify(meds), patientId]);
      res.json({ success: true, message: 'Medication added successfully', medication: { id: newMedication.id, name: newMedication.name, purpose: newMedication.reason, dosage: newMedication.dosage, frequency: newMedication.frequency, time: newMedication.time, startDate: newMedication.start_date } });
    } finally { client.release(); }
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
    const client = await pool.connect();
    try {
      const patientRes = await client.query('SELECT medications FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
      if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
      const meds = patientRes.rows[0].medications || [];
      const idx = meds.findIndex(m => String(m.id) === String(medicationId));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Medication not found' });
      meds[idx] = { ...meds[idx], name, reason: purpose, dosage, frequency, time: time || '', start_date: startDate || '' };
      await client.query('UPDATE patients SET medications = $1 WHERE patient_id = $2', [JSON.stringify(meds), patientId]);
      res.json({ success: true, message: 'Medication updated successfully' });
    } finally { client.release(); }
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
    const client = await pool.connect();
    try {
      const patientRes = await client.query('SELECT medications FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
      if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
      const meds = (patientRes.rows[0].medications || []).filter(m => String(m.id) !== String(medicationId));
      await client.query('UPDATE patients SET medications = $1 WHERE patient_id = $2', [JSON.stringify(meds), patientId]);
      res.json({ success: true, message: 'Medication deleted successfully' });
    } finally { client.release(); }
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
    const client = await pool.connect();
    try {
      const patientRes = await client.query('SELECT vaccination_records FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
      if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
      const vacs = patientRes.rows[0].vaccination_records || [];
      const newVaccination = { id: Date.now(), name, date, hospital: location || '', dose: doseNumber || '', next_due: nextDue || 'N/A' };
      vacs.push(newVaccination);
      await client.query('UPDATE patients SET vaccination_records = $1 WHERE patient_id = $2', [JSON.stringify(vacs), patientId]);
      res.json({ success: true, message: 'Vaccination added successfully', vaccination: { id: newVaccination.id, name: newVaccination.name, date: newVaccination.date, location: newVaccination.hospital, doseNumber: newVaccination.dose, nextDue: newVaccination.next_due } });
    } finally { client.release(); }
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
    const client = await pool.connect();
    try {
      const patientRes = await client.query('SELECT vaccination_records FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
      if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
      const vacs = patientRes.rows[0].vaccination_records || [];
      const idx = vacs.findIndex(v => String(v.id) === String(vaccinationId));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Vaccination not found' });
      vacs[idx] = { ...vacs[idx], name, date, hospital: location || '', dose: doseNumber || '', next_due: nextDue || 'N/A' };
      await client.query('UPDATE patients SET vaccination_records = $1 WHERE patient_id = $2', [JSON.stringify(vacs), patientId]);
      res.json({ success: true, message: 'Vaccination updated successfully' });
    } finally { client.release(); }
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
    const client = await pool.connect();
    try {
      const patientRes = await client.query('SELECT vaccination_records FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
      if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
      const vacs = (patientRes.rows[0].vaccination_records || []).filter(v => String(v.id) !== String(vaccinationId));
      await client.query('UPDATE patients SET vaccination_records = $1 WHERE patient_id = $2', [JSON.stringify(vacs), patientId]);
      res.json({ success: true, message: 'Vaccination deleted successfully' });
    } finally { client.release(); }
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
    const setClauses = [];
    const values = [];
    let i = 1;
    for (const k in updateFields) { setClauses.push(`${k} = $${i}`); values.push(updateFields[k]); i++; }
    values.push(req.userId);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING id, patient_id, name, email, mobilenumber, isverified, createdat`;
    const updated = await pool.query(query, values);
    if (!updated.rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated successfully', user: updated.rows[0] });
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

    const client = await pool.connect();
    try {
      // Get patient_id from users table using email
      const userRes = await client.query('SELECT patient_id FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
      if (!userRes.rows[0]) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const patientId = userRes.rows[0].patient_id;

      // Update patient demographics and related fields
      const demographicsData = {
        dob,
        gender,
        bloodType,
        height: parseFloat(height),
        weight: parseFloat(weight),
        chronicConditions: chronicConditions ? (typeof chronicConditions === 'string' ? chronicConditions.split(',').map(c => c.trim()) : chronicConditions) : []
      };

      const updateRes = await client.query(
        `UPDATE patients 
         SET demographics = $1, 
             name = $2,
             allergies = $3,
             emergency_contacts = $4
         WHERE patient_id = $5 
         RETURNING patient_id, name, demographics, allergies, emergency_contacts`,
        [
          JSON.stringify(demographicsData),
          name,
          allergies ? JSON.stringify(allergies) : JSON.stringify([]),
          JSON.stringify([]),
          patientId
        ]
      );

      if (!updateRes.rows[0]) {
        return res.status(404).json({ success: false, message: 'Patient record not found' });
      }

      console.log('Demographics saved for patient: ' + patientId);

      res.json({
        success: true,
        message: 'Demographics saved successfully',
        patient_id: patientId,
        demographics: demographicsData,
        allergies: updateRes.rows[0].allergies || [],
        emergency_contacts: updateRes.rows[0].emergency_contacts || []
      });
    } finally {
      client.release();
    }
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

    const client = await pool.connect();

    try {
      // Get patient_id using email (email exists ONLY in users table)
      const userRes = await client.query(
        'SELECT patient_id FROM users WHERE email = $1 LIMIT 1',
        [email.toLowerCase()]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const patientId = userRes.rows[0].patient_id;

      // Build demographics JSON (only allowed fields)
      const demographicsData = {
        dob,
        gender,
        bloodType,
        height: Number(height),
        weight: Number(weight)
      };

      // Update patients table (NO email column here)
      const updateRes = await client.query(
        `UPDATE patients
         SET name = $1,
             demographics = $2
         WHERE patient_id = $3
         RETURNING patient_id, name, demographics`,
        [
          name,
          JSON.stringify(demographicsData),
          patientId
        ]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient record not found'
        });
      }

      console.log('Demographics saved for patient:', patientId);

      res.json({
        success: true,
        message: 'Demographics saved successfully',
        patient_id: updateRes.rows[0].patient_id,
        name: updateRes.rows[0].name,
        demographics: updateRes.rows[0].demographics
      });

    } finally {
      client.release();
    }

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
    const client = await pool.connect();
    try {
      const patientRes = await client.query(
        'SELECT demographics, allergies, emergency_contacts FROM patients WHERE patient_id = $1 LIMIT 1',
        [patientId]
      );

      if (!patientRes.rows[0]) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      const patient = patientRes.rows[0];
      res.json({
        success: true,
        demographics: patient.demographics || {},
        allergies: patient.allergies || [],
        emergency_contacts: patient.emergency_contacts || []
      });
    } finally {
      client.release();
    }
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
    
    const client = await pool.connect();
    try {
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

      const updateRes = await client.query(
        `UPDATE patients 
         SET demographics = jsonb_set(COALESCE(demographics, '{}'::jsonb), '{}', $1::jsonb),
             allergies = $2,
             emergency_contacts = $3
         WHERE patient_id = $4 
         RETURNING demographics, allergies, emergency_contacts`,
        [
          JSON.stringify(demographicsData),
          allergies ? JSON.stringify(allergies) : JSON.stringify([]),
          emergency_contacts ? JSON.stringify(emergency_contacts) : JSON.stringify([]),
          patientId
        ]
      );

      if (!updateRes.rows[0]) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      console.log('Demographics updated for patient: ' + patientId);

      res.json({
        success: true,
        message: 'Demographics updated successfully',
        demographics: updateRes.rows[0].demographics || {},
        allergies: updateRes.rows[0].allergies || [],
        emergency_contacts: updateRes.rows[0].emergency_contacts || []
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


// GET allergies
app.get('/api/patients/:patientId/allergies', async (req, res) => {
  const { patientId } = req.params;
  const result = await pool.query(
    'SELECT allergies FROM patients WHERE patient_id = $1',
    [patientId]
  );
  res.json({ success: true, allergies: result.rows[0]?.allergies || [] });
});

// POST allergies
app.post('/api/patients/:patientId/allergies', async (req, res) => {
  const { patientId } = req.params;
  const { allergies } = req.body;

  await pool.query(
    'UPDATE patients SET allergies = $1 WHERE patient_id = $2',
    [JSON.stringify(allergies || []), patientId]
  );

  res.json({ success: true });
});

// GET conditions
app.get('/api/patients/:patientId/conditions', async (req, res) => {
  const { patientId } = req.params;
  const result = await pool.query(
    'SELECT conditions FROM patients WHERE patient_id = $1',
    [patientId]
  );
  res.json({ success: true, conditions: result.rows[0]?.conditions || [] });
});

// POST conditions
app.post('/api/patients/:patientId/conditions', async (req, res) => {
  const { patientId } = req.params;
  const { conditions } = req.body;

  await pool.query(
    'UPDATE patients SET conditions = $1 WHERE patient_id = $2',
    [JSON.stringify(conditions || []), patientId]
  );

  res.json({ success: true });
});


// GET emergency contacts
app.get('/api/patients/:patientId/emergency-contacts', async (req, res) => {
  const { patientId } = req.params;
  const result = await pool.query(
    'SELECT emergency_contacts FROM patients WHERE patient_id = $1',
    [patientId]
  );
  res.json({ success: true, emergency_contacts: result.rows[0]?.emergency_contacts || [] });
});

// POST emergency contacts
app.post('/api/patients/:patientId/emergency-contacts', async (req, res) => {
  const { patientId } = req.params;
  const { emergency_contacts } = req.body;

  await pool.query(
    'UPDATE patients SET emergency_contacts = $1 WHERE patient_id = $2',
    [JSON.stringify(emergency_contacts || []), patientId]
  );

  res.json({ success: true });
});

// ============ QR CODE ENDPOINTS ============

// POST /api/qr-codes/:patientId - Generate and store QR code
app.post('/api/qr-codes/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Generating QR code for patient: ' + patientId);

    const client = await pool.connect();
    try {
      // Fetch patient data
      const patientRes = await client.query(
        'SELECT * FROM patients WHERE patient_id = $1 LIMIT 1',
        [patientId]
      );

      if (!patientRes.rows[0]) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      const patient = patientRes.rows[0];
      const demographics = patient.demographics || {};
      const emergencyContacts = patient.emergency_contacts || [];

      // Build QR code data with patient information
      const qrData = {
        patient_id: patientId,
        name: patient.name,
        dob: demographics.dob || null,
        gender: demographics.gender || null,
        blood_group: demographics.bloodType || null,
        height: demographics.height || null,
        weight: demographics.weight || null,
        allergies: patient.allergies || [],
        conditions: patient.conditions || [],
        emergency_contact: emergencyContacts.length > 0 ? emergencyContacts[0].phone || emergencyContacts[0].number : null,
        generated_at: new Date().toISOString()
      };

      // Check if QR code already exists for this patient
      const existingQR = await client.query(
        'SELECT id FROM qr_codes WHERE patient_id = $1',
        [patientId]
      );

      if (existingQR.rows[0]) {
        // Update existing QR code
        await client.query(
          'UPDATE qr_codes SET qr_data = $1, updated_at = NOW() WHERE patient_id = $2',
          [JSON.stringify(qrData), patientId]
        );
      } else {
        // Insert new QR code
        await client.query(
          'INSERT INTO qr_codes (patient_id, qr_data) VALUES ($1, $2)',
          [patientId, JSON.stringify(qrData)]
        );
      }

      console.log('QR code generated for patient: ' + patientId);

      res.json({
        success: true,
        message: 'QR code generated successfully',
        patient_id: patientId,
        qr_data: qrData
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/qr-codes/:patientId - Retrieve QR code data
app.get('/api/qr-codes/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Fetching QR code for patient: ' + patientId);

    const client = await pool.connect();
    try {
      const qrRes = await client.query(
        'SELECT qr_data, created_at, updated_at FROM qr_codes WHERE patient_id = $1 LIMIT 1',
        [patientId]
      );

      if (!qrRes.rows[0]) {
        return res.status(404).json({ success: false, message: 'QR code not found for this patient' });
      }

      const qrCode = qrRes.rows[0];

      res.json({
        success: true,
        patient_id: patientId,
        qr_data: qrCode.qr_data,
        created_at: qrCode.created_at,
        updated_at: qrCode.updated_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/qr-codes/:patientId - Delete QR code
app.delete('/api/qr-codes/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Deleting QR code for patient: ' + patientId);

    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM qr_codes WHERE patient_id = $1',
        [patientId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'QR code not found' });
      }

      res.json({ success: true, message: 'QR code deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/health
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
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