const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyDoctorToken } = require('../middleware/authDoctor');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getDoctor(doctorId) {
  const { data, error } = await supabase
    .from('doctors').select('*').eq('doctor_id', doctorId).limit(1);
  if (error) throw error;
  return data?.[0];
}

// ─── ACCESS REQUESTS (doctor side) ───────────────────────────────────────────
// NOTE: These MUST come before /:doctorId to avoid wildcard interception

// GET /api/doctors/access-requests
// All requests this doctor has sent — shown on dashboard
router.get('/access-requests', verifyDoctorToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('doctor_id', req.doctorId)
      .order('requested_at', { ascending: false });
    if (error) throw error;

    // Enrich with patient name
    const enriched = await Promise.all(data.map(async (r) => {
      const { data: pt } = await supabase
        .from('patients').select('name').eq('patient_id', r.patient_id).limit(1);
      return { ...r, patient_name: pt?.[0]?.name || 'Unknown' };
    }));

    res.json({ success: true, requests: enriched });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/doctors/access-requests
// Doctor sends an access request to a patient
router.post('/access-requests', verifyDoctorToken, async (req, res) => {
  try {
    let { patient_id, message } = req.body;
    if (!patient_id)
      return res.status(400).json({ success: false, message: 'patient_id is required' });

    // Normalize: uppercase and zero-pad to 4 digits (e.g. P9 → P0009, P009 → P0009)
    patient_id = patient_id.trim().toUpperCase();
    const numPart = patient_id.replace(/^[A-Z]+/, '');
    const prefix  = patient_id.replace(/[0-9]+$/, '');
    if (numPart) patient_id = prefix + numPart.padStart(4, '0');

    // Check patient exists in patients table
    const { data: patient, error: pe } = await supabase
      .from('patients').select('patient_id').eq('patient_id', patient_id).limit(1);
    if (pe) throw pe;
    if (!patient?.length)
      return res.status(404).json({ success: false, message: 'Patient not found' });

    // Block duplicate pending requests
    const { data: existing, error: ee } = await supabase
      .from('access_requests').select('id')
      .eq('doctor_id', req.doctorId).eq('patient_id', patient_id).eq('status', 'pending').limit(1);
    if (ee) throw ee;
    if (existing?.length > 0)
      return res.status(409).json({ success: false, message: 'You already have a pending request for this patient' });

    const { data: newReq, error: ie } = await supabase
      .from('access_requests')
      .insert([{
        doctor_id:    req.doctorId,
        patient_id,
        status:       'pending',
        message:      message || '',
        requested_at: new Date().toISOString()
      }])
      .select();
    if (ie) throw ie;

    console.log(`Access request: Doctor ${req.doctorId} → Patient ${patient_id}`);
    res.status(201).json({ success: true, message: 'Access request sent. Patient will be notified.', request: newReq[0] });
  } catch (error) {
    console.error('Error sending access request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── PATIENT SEARCH (before requesting access) ────────────────────────────────

// GET /api/doctors/patients/search?patient_id=P0001
router.get('/patients/search', verifyDoctorToken, async (req, res) => {
  try {
    let { patient_id } = req.query;
    if (!patient_id)
      return res.status(400).json({ success: false, message: 'patient_id is required' });

    // Normalize: uppercase and zero-pad to 4 digits (e.g. P9 → P0009, P009 → P0009)
    patient_id = patient_id.trim().toUpperCase();
    const numPart = patient_id.replace(/^[A-Z]+/, '');
    const prefix  = patient_id.replace(/[0-9]+$/, '');
    if (numPart) patient_id = prefix + numPart.padStart(4, '0');

    const { data, error } = await supabase
      .from('patients')
      .select('patient_id, name, demographics')
      .eq('patient_id', patient_id)
      .limit(1);
    if (error) throw error;
    if (!data?.length)
      return res.status(404).json({ success: false, message: 'Patient not found' });

    const p = data[0];
    const demo = typeof p.demographics === 'string'
      ? JSON.parse(p.demographics || '{}') : (p.demographics || {});

    res.json({
      success: true,
      patient: { patient_id: p.patient_id, name: p.name, gender: demo.gender || null, bloodType: demo.bloodType || null }
    });
  } catch (error) {
    console.error('Error searching patient:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── MY PATIENTS (approved) ───────────────────────────────────────────────────

// GET /api/doctors/my-patients
router.get('/my-patients', verifyDoctorToken, async (req, res) => {
  try {
    const { data: approved, error } = await supabase
      .from('access_requests')
      .select('patient_id, responded_at')
      .eq('doctor_id', req.doctorId)
      .eq('status', 'approved')
      .order('responded_at', { ascending: false });
    if (error) throw error;
    if (!approved?.length) return res.json({ success: true, patients: [] });

    const ids = approved.map(r => r.patient_id);
    const { data: patients, error: pe } = await supabase
      .from('patients').select('patient_id, name, demographics, conditions').in('patient_id', ids);
    if (pe) throw pe;

    const result = patients.map(p => {
      const demo  = typeof p.demographics === 'string' ? JSON.parse(p.demographics || '{}') : (p.demographics || {});
      const conds = typeof p.conditions   === 'string' ? JSON.parse(p.conditions   || '[]') : (p.conditions   || []);
      return {
        patient_id: p.patient_id, name: p.name,
        age:       demo.dob ? Math.floor((new Date() - new Date(demo.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        gender:    demo.gender    || null,
        bloodType: demo.bloodType || null,
        condition: (typeof conds[0] === "object" ? conds[0]?.name : conds[0]) || null,
      };
    });

    res.json({ success: true, patients: result });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── FULL PATIENT RECORDS (approved only) ─────────────────────────────────────

// GET /api/doctors/patients/:patientId/records
router.get('/patients/:patientId/records', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data: approval } = await supabase
      .from('access_requests').select('id')
      .eq('doctor_id', req.doctorId).eq('patient_id', patientId).eq('status', 'approved').limit(1);
    if (!approval?.length)
      return res.status(403).json({ success: false, message: 'Access not approved by patient' });

    const { data, error } = await supabase.from('patients').select('*').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.json({ success: true, patient: data[0] });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── ADD CONSULTATION ─────────────────────────────────────────────────────────

// POST /api/doctors/patients/:patientId/consultation
router.post('/patients/:patientId/consultation', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, notes, diagnosis, prescription } = req.body;
    if (!date || !notes)
      return res.status(400).json({ success: false, message: 'Date and notes are required' });

    const { data: approval } = await supabase
      .from('access_requests').select('id')
      .eq('doctor_id', req.doctorId).eq('patient_id', patientId).eq('status', 'approved').limit(1);
    if (!approval?.length)
      return res.status(403).json({ success: false, message: 'Access not approved by patient' });

    const { data, error } = await supabase
      .from('consultations')
      .insert([{ patient_id: patientId, doctor_id: req.doctorId, date, notes, diagnosis: diagnosis || '', prescription: prescription || '', created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;

    res.status(201).json({ success: true, message: 'Consultation added', consultation: data[0] });
  } catch (error) {
    console.error('Error adding consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── GET /api/doctors/:doctorId ───────────────────────────────────────────────
router.get('/:doctorId', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    res.json({
      success: true,
      doctor: {
        doctor_id:          doctor.doctor_id,
        name:               doctor.name,
        demographics:       doctor.demographics       || {},
        license_id:         doctor.license_id         || '',
        specializations:    doctor.specializations    || [],
        credentials:        doctor.credentials        || [],
        consultation_hours: doctor.consultation_hours || {},
        created_at:         doctor.created_at,
        updated_at:         doctor.updated_at,
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── PUT /api/doctors/:doctorId/demographics ──────────────────────────────────
router.put('/:doctorId/demographics', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const { full_name, phone_number, date_of_birth, address } = req.body;

    const updatedDemographics = {
      ...doctor.demographics,
      ...(full_name     && { full_name }),
      ...(phone_number  && { phone_number }),
      ...(date_of_birth && { date_of_birth }),
      ...(address       && { address: { ...doctor.demographics?.address, ...address } }),
    };

    const updatePayload = { demographics: updatedDemographics, updated_at: new Date().toISOString() };
    if (full_name) updatePayload.name = full_name;

    const { error } = await supabase.from('doctors')
      .update(updatePayload).eq('doctor_id', req.params.doctorId);
    if (error) throw error;

    res.json({ success: true, message: 'Demographics updated', demographics: updatedDemographics });
  } catch (error) {
    console.error('Update demographics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── PUT /api/doctors/:doctorId/license ───────────────────────────────────────
router.put('/:doctorId/license', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const { license_id } = req.body;
    if (!license_id?.trim())
      return res.status(400).json({ success: false, message: 'License ID is required' });

    const { data: existing } = await supabase.from('doctors')
      .select('doctor_id').eq('license_id', license_id).neq('doctor_id', req.params.doctorId).limit(1);
    if (existing?.length > 0)
      return res.status(409).json({ success: false, message: 'License ID already in use' });

    const { error } = await supabase.from('doctors')
      .update({ license_id, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;

    res.json({ success: true, message: 'License ID updated', license_id });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── SPECIALIZATIONS ──────────────────────────────────────────────────────────

router.get('/:doctorId/specializations', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, specializations: doctor.specializations || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:doctorId/specializations', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { specializations } = req.body;
    if (!Array.isArray(specializations) || specializations.length === 0)
      return res.status(400).json({ success: false, message: 'At least one specialization is required' });
    const { error } = await supabase.from('doctors')
      .update({ specializations, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Specializations updated', specializations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/:doctorId/specializations', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { specialization } = req.body;
    if (!specialization?.trim())
      return res.status(400).json({ success: false, message: 'Specialization is required' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const current = doctor.specializations || [];
    if (current.includes(specialization.trim()))
      return res.status(409).json({ success: false, message: 'Specialization already exists' });
    const updated = [...current, specialization.trim()];
    const { error } = await supabase.from('doctors')
      .update({ specializations: updated, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Specialization added', specializations: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:doctorId/specializations', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { specialization } = req.body;
    if (!specialization)
      return res.status(400).json({ success: false, message: 'Specialization value is required' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const updated = (doctor.specializations || []).filter(s => s !== specialization);
    if (updated.length === 0)
      return res.status(400).json({ success: false, message: 'Cannot remove the last specialization' });
    const { error } = await supabase.from('doctors')
      .update({ specializations: updated, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Specialization removed', specializations: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── CREDENTIALS ──────────────────────────────────────────────────────────────

router.get('/:doctorId/credentials', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, credentials: doctor.credentials || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/:doctorId/credentials', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { title, institution, year } = req.body;
    if (!title || !institution || !year)
      return res.status(400).json({ success: false, message: 'title, institution and year are required' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const newCred = { id: Date.now(), title, institution, year: String(year) };
    const updated = [...(doctor.credentials || []), newCred];
    const { error } = await supabase.from('doctors')
      .update({ credentials: updated, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Credential added', credential: newCred, credentials: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:doctorId/credentials/:credId', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { title, institution, year } = req.body;
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const creds = doctor.credentials || [];
    const idx = creds.findIndex(c => String(c.id) === String(req.params.credId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Credential not found' });
    creds[idx] = { ...creds[idx], ...(title && { title }), ...(institution && { institution }), ...(year && { year: String(year) }) };
    const { error } = await supabase.from('doctors')
      .update({ credentials: creds, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Credential updated', credential: creds[idx], credentials: creds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:doctorId/credentials/:credId', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const updated = (doctor.credentials || []).filter(c => String(c.id) !== String(req.params.credId));
    const { error } = await supabase.from('doctors')
      .update({ credentials: updated, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Credential deleted', credentials: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── CONSULTATION HOURS ───────────────────────────────────────────────────────

router.get('/:doctorId/consultation-hours', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, consultation_hours: doctor.consultation_hours || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:doctorId/consultation-hours', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { weekdays, saturdays, sundays } = req.body;
    if (weekdays === undefined && saturdays === undefined && sundays === undefined)
      return res.status(400).json({ success: false, message: 'At least one day schedule is required' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const updated = {
      ...doctor.consultation_hours,
      ...(weekdays  !== undefined && { weekdays }),
      ...(saturdays !== undefined && { saturdays }),
      ...(sundays   !== undefined && { sundays }),
    };
    const { error } = await supabase.from('doctors')
      .update({ consultation_hours: updated, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Consultation hours updated', consultation_hours: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;