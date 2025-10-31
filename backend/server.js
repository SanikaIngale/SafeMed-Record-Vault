const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
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
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production_12345';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medicalwallet';
const DB_NAME = 'medicalwallet';
const ADMIN_DB_NAME = 'admin';
const PORT = process.env.PORT || 5000;
const HOST_IP = '10.185.77.5';

// Global database connections
let db;
let adminDb;

// Initialize MongoDB Connection
async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(MONGO_URI, {
      useUnifiedTopology: true
    });
    db = client.db(DB_NAME);
    adminDb = client.db(ADMIN_DB_NAME);
    console.log('✅ MongoDB connected to medicalwallet database');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`📊 Admin Database: ${ADMIN_DB_NAME}`);
    console.log(`🔗 Connection: ${MONGO_URI}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Helper function to get database
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function getAdminDatabase() {
  if (!adminDb) {
    throw new Error('Admin database not initialized');
  }
  return adminDb;
}

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.patientId = decoded.patientId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// POST /api/signup - Create new user
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;

    if (!name || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be 10 digits'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobileNumber }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Mobile number already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lastPatient = await usersCollection
      .find({})
      .sort({ patient_id: -1 })
      .limit(1)
      .toArray();
    
    let newPatientId = 'P0001';
    if (lastPatient.length > 0 && lastPatient[0].patient_id) {
      const lastId = parseInt(lastPatient[0].patient_id.substring(1));
      newPatientId = `P${String(lastId + 1).padStart(4, '0')}`;
    }

    const newUser = {
      patient_id: newPatientId,
      name,
      email: email.toLowerCase(),
      mobileNumber,
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date(),
      loginCount: 0
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { 
        userId: result.insertedId,
        email: newUser.email,
        patientId: newUser.patient_id
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ New user registered:', newUser.email, '| Patient ID:', newPatientId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: result.insertedId,
        patient_id: newUser.patient_id,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        isVerified: newUser.isVerified
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sign up',
      error: error.message
    });
  }
});

// POST /api/signin - Sign in existing user
app.post('/api/signin', async (req, res) => {
  try {
    console.log('🔍 Signin request received:', { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ 
      email: email.toLowerCase() 
    });

    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found with this email'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Password not set for this account'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        patientId: user.patient_id
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { lastLogin: new Date() },
        $inc: { loginCount: 1 }
      }
    );

    console.log('✅ Login successful for:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        patient_id: user.patient_id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        requiresPasswordChange: user.requiresPasswordChange || false
      }
    });

  } catch (error) {
    console.error('❌ Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sign in',
      error: error.message
    });
  }
});

// GET /api/user/email/:email - Get user by email
app.get('/api/user/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔍 Fetching user by email:', email);

    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { email: email.toLowerCase() },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user.email, '| Patient ID:', user.patient_id);

    res.json({
      success: true,
      patient_id: user.patient_id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      isVerified: user.isVerified
    });

  } catch (error) {
    console.error('❌ Error fetching user by email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/patients/:patientId - Get full patient data
app.get('/api/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('🔍 Fetching patient data for:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const patient = await patientsCollection.findOne({ patient_id: patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient data not found'
      });
    }

    console.log('✅ Patient data found:', patient.name);

    res.json({
      success: true,
      ...patient
    });

  } catch (error) {
    console.error('❌ Error fetching patient data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ MEDICATION ENDPOINTS ============

// GET /api/medications/:patientId - Get all medications
app.get('/api/medications/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('🔍 Fetching medications for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const patient = await patientsCollection.findOne({ patient_id: patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Transform medications to match frontend format
    const medications = (patient.medications || []).map((med, index) => ({
      id: med.id || Date.now() + index,
      name: med.name,
      purpose: med.reason || '',
      dosage: med.dosage,
      frequency: med.frequency,
      time: med.time || '',
      startDate: med.start_date || ''
    }));

    res.json({
      success: true,
      medications
    });

  } catch (error) {
    console.error('❌ Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/medications/:patientId - Add new medication
app.post('/api/medications/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, purpose, dosage, frequency, time, startDate } = req.body;

    console.log('➕ Adding medication for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    // Create medication object matching database schema
    const newMedication = {
      id: Date.now(),
      name,
      reason: purpose,
      dosage,
      frequency,
      time: time || '',
      start_date: startDate || ''
    };

    const result = await patientsCollection.updateOne(
      { patient_id: patientId },
      { 
        $push: { medications: newMedication }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('✅ Medication added successfully');

    // Return in frontend format
    res.json({
      success: true,
      message: 'Medication added successfully',
      medication: {
        id: newMedication.id,
        name: newMedication.name,
        purpose: newMedication.reason,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        time: newMedication.time,
        startDate: newMedication.start_date
      }
    });

  } catch (error) {
    console.error('❌ Error adding medication:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/medications/:patientId/:medicationId - Update medication
app.put('/api/medications/:patientId/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;
    const { name, purpose, dosage, frequency, time, startDate } = req.body;

    console.log('✏️ Updating medication:', medicationId, 'for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const result = await patientsCollection.updateOne(
      { 
        patient_id: patientId,
        'medications.id': parseInt(medicationId)
      },
      {
        $set: {
          'medications.$.name': name,
          'medications.$.reason': purpose,
          'medications.$.dosage': dosage,
          'medications.$.frequency': frequency,
          'medications.$.time': time || '',
          'medications.$.start_date': startDate || ''
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    console.log('✅ Medication updated successfully');

    res.json({
      success: true,
      message: 'Medication updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/medications/:patientId/:medicationId - Delete medication
app.delete('/api/medications/:patientId/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;

    console.log('🗑️ Deleting medication:', medicationId, 'for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const result = await patientsCollection.updateOne(
      { patient_id: patientId },
      {
        $pull: {
          medications: { id: parseInt(medicationId) }
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('✅ Medication deleted successfully');

    res.json({
      success: true,
      message: 'Medication deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ VACCINATION ENDPOINTS ============

// GET /api/vaccinations/:patientId - Get all vaccinations
app.get('/api/vaccinations/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('🔍 Fetching vaccinations for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const patient = await patientsCollection.findOne({ patient_id: patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Transform vaccination_records to match frontend format
    const vaccinations = (patient.vaccination_records || []).map((vac, index) => ({
      id: vac.id || Date.now() + index,
      name: vac.name,
      date: vac.date,
      location: vac.hospital || '',
      doseNumber: vac.dose || '',
      nextDue: vac.next_due || 'N/A'
    }));

    res.json({
      success: true,
      vaccinations
    });

  } catch (error) {
    console.error('❌ Error fetching vaccinations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/vaccinations/:patientId - Add new vaccination
app.post('/api/vaccinations/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, date, location, doseNumber, nextDue } = req.body;

    console.log('💉 Adding vaccination for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    // Create vaccination object matching database schema
    const newVaccination = {
      id: Date.now(),
      name,
      date,
      hospital: location || '',
      dose: doseNumber || '',
      next_due: nextDue || 'N/A'
    };

    const result = await patientsCollection.updateOne(
      { patient_id: patientId },
      { 
        $push: { vaccination_records: newVaccination }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('✅ Vaccination added successfully');

    // Return in frontend format
    res.json({
      success: true,
      message: 'Vaccination added successfully',
      vaccination: {
        id: newVaccination.id,
        name: newVaccination.name,
        date: newVaccination.date,
        location: newVaccination.hospital,
        doseNumber: newVaccination.dose,
        nextDue: newVaccination.next_due
      }
    });

  } catch (error) {
    console.error('❌ Error adding vaccination:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/vaccinations/:patientId/:vaccinationId - Update vaccination
app.put('/api/vaccinations/:patientId/:vaccinationId', async (req, res) => {
  try {
    const { patientId, vaccinationId } = req.params;
    const { name, date, location, doseNumber, nextDue } = req.body;

    console.log('✏️ Updating vaccination:', vaccinationId, 'for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const result = await patientsCollection.updateOne(
      { 
        patient_id: patientId,
        'vaccination_records.id': parseInt(vaccinationId)
      },
      {
        $set: {
          'vaccination_records.$.name': name,
          'vaccination_records.$.date': date,
          'vaccination_records.$.hospital': location || '',
          'vaccination_records.$.dose': doseNumber || '',
          'vaccination_records.$.next_due': nextDue || 'N/A'
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vaccination not found'
      });
    }

    console.log('✅ Vaccination updated successfully');

    res.json({
      success: true,
      message: 'Vaccination updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating vaccination:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/vaccinations/:patientId/:vaccinationId - Delete vaccination
app.delete('/api/vaccinations/:patientId/:vaccinationId', async (req, res) => {
  try {
    const { patientId, vaccinationId } = req.params;

    console.log('🗑️ Deleting vaccination:', vaccinationId, 'for patient:', patientId);

    const adminDb = getAdminDatabase();
    const patientsCollection = adminDb.collection('patients');

    const result = await patientsCollection.updateOne(
      { patient_id: patientId },
      {
        $pull: {
          vaccination_records: { id: parseInt(vaccinationId) }
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('✅ Vaccination deleted successfully');

    res.json({
      success: true,
      message: 'Vaccination deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting vaccination:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/user/profile - Get User Profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        patient_id: user.patient_id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount || 0
      }
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT /api/user/profile - Update User Profile
app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { name, mobileNumber } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (mobileNumber) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must be 10 digits'
        });
      }
      updateFields.mobileNumber = mobileNumber;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $set: updateFields },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.value
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Medical Wallet API is running',
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected',
    adminDatabase: adminDb ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🏥 Medical Wallet Backend API');
    console.log('================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Local: http://localhost:${PORT}/api`);
    console.log(`🌐 Network: http://${HOST_IP}:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log('================================\n');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});