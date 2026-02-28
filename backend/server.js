const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectToDatabase } = require('./config/supabase');
const { supabase } = require('./config/supabase');

const authRoutes    = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes  = require('./routes/doctor.routes');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);    // signup, signin, user profile
app.use('/api/patients', patientRoutes); // medications, vaccinations, demographics, etc.
app.use('/api/doctors', doctorRoutes);  // doctor dashboard, consultations

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ status: 'OK', message: 'SafeMed API is running', timestamp: new Date().toISOString(), database: 'Connected', environment: process.env.NODE_ENV || 'development' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error: err.message });
  }
});

// ─── 404 & Error handlers ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT    = process.env.PORT || 5000;
const HOST_IP = process.env.HOST_IP;

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\nSafeMed Backend API');
    console.log('================================');
    console.log('Server running on port ' + PORT);
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('Local:   http://localhost:' + PORT + '/api');
    console.log('Network: http://' + HOST_IP + ':' + PORT + '/api');
    console.log('Health:  http://localhost:' + PORT + '/api/health');
    console.log('================================\n');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
