const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyDoctorToken } = require('../middleware/authDoctor');

const router = express.Router();

// ─── DOCTOR AUTH ───────────────────────────────────────────────────────────
// TODO: Add doctor signup/signin here
// Doctor signup will insert into a 'doctors' table (separate from 'users')
// Doctor token will have { role: 'doctor', doctorId, email } payload

// POST /api/doctor/signup  → to be built
// POST /api/doctor/signin  → to be built

// ─── DOCTOR DASHBOARD ─────────────────────────────────────────────────────

// GET /api/doctor/patients
// Returns list of patients assigned to this doctor
router.get('/patients', verifyDoctorToken, async (req, res) => {
  try {
    // TODO: Filter by doctor_id once doctor-patient assignment table is set up
    const { data, error } = await supabase
      .from('patients')
      .select('patient_id, name, demographics');

    if (error) throw error;
    res.json({ success: true, patients: data });
  } catch (error) {
    console.error('Error fetching patients for doctor:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/doctor/patients/:patientId
// Doctor views a specific patient's full record
router.get('/patients/:patientId', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .limit(1);

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.json({ success: true, patient: data[0] });
  } catch (error) {
    console.error('Error fetching patient for doctor:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/doctor/patients/:patientId/consultation
// Doctor adds a consultation/visit note for a patient
router.post('/patients/:patientId/consultation', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, notes, diagnosis, prescription } = req.body;

    if (!date || !notes) {
      return res.status(400).json({ success: false, message: 'Date and notes are required' });
    }

    // TODO: Insert into a 'consultations' table once created in Supabase
    // The consultations table should have: id, patient_id, doctor_id, date, notes, diagnosis, prescription, created_at
    const { data, error } = await supabase
      .from('consultations')
      .insert([{
        patient_id: patientId,
        doctor_id: req.doctorId,
        date,
        notes,
        diagnosis: diagnosis || '',
        prescription: prescription || '',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Consultation added successfully', consultation: data[0] });
  } catch (error) {
    console.error('Error adding consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
