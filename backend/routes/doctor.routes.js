const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyDoctorToken } = require('../middleware/authDoctor');

const router = express.Router();

// ─── Helper: fetch full doctor row ───────────────────────────────────────────
async function getDoctor(doctorId) {
  const { data, error } = await supabase
    .from('doctors').select('*').eq('doctor_id', doctorId).limit(1);
  if (error) throw error;
  return data?.[0];
}

async function touchUpdatedAt(doctorId) {
  await supabase.from('doctors')
    .update({ updated_at: new Date().toISOString() })
    .eq('doctor_id', doctorId);
}

// ─── GET /api/doctors/:doctorId ───────────────────────────────────────────────
// Fetch full profile — used by ProfilePage on load
router.get('/:doctorId', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    res.json({
      success: true,
      doctor: {
        doctor_id:         doctor.doctor_id,
        name:              doctor.name,
        demographics:      doctor.demographics      || {},
        license_id:        doctor.license_id        || '',
        specializations:   doctor.specializations   || [],
        credentials:       doctor.credentials       || [],
        consultation_hours: doctor.consultation_hours || {},
        created_at:        doctor.created_at,
        updated_at:        doctor.updated_at,
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── PUT /api/doctors/:doctorId/demographics ──────────────────────────────────
// Update personal info: full_name, phone_number, date_of_birth, address, hospital_name
router.put('/:doctorId/demographics', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const { full_name, phone_number, date_of_birth, address } = req.body;

    // Merge with existing demographics — email is never changed here
    const updatedDemographics = {
      ...doctor.demographics,
      ...(full_name     && { full_name }),
      ...(phone_number  && { phone_number }),
      ...(date_of_birth && { date_of_birth }),
      ...(address       && { address: { ...doctor.demographics.address, ...address } }),
    };

    // Keep top-level name in sync
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
    if (!license_id || !license_id.trim())
      return res.status(400).json({ success: false, message: 'License ID is required' });

    // Check uniqueness (excluding current doctor)
    const { data: existing } = await supabase.from('doctors')
      .select('doctor_id').eq('license_id', license_id).neq('doctor_id', req.params.doctorId).limit(1);
    if (existing && existing.length > 0)
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

// ─── SPECIALIZATIONS ─────────────────────────────────────────────────────────

// GET /api/doctors/:doctorId/specializations
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

// PUT /api/doctors/:doctorId/specializations
// Replaces entire specializations array
router.put('/:doctorId/specializations', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const { specializations } = req.body;
    if (!Array.isArray(specializations))
      return res.status(400).json({ success: false, message: 'specializations must be an array' });
    if (specializations.length === 0)
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

// POST /api/doctors/:doctorId/specializations
// Add a single specialization
router.post('/:doctorId/specializations', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const { specialization } = req.body;
    if (!specialization || !specialization.trim())
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

// DELETE /api/doctors/:doctorId/specializations
// Remove a single specialization by value
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

// ─── CREDENTIALS ─────────────────────────────────────────────────────────────

// GET /api/doctors/:doctorId/credentials
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

// POST /api/doctors/:doctorId/credentials
// Add a new credential  { title, institution, year }
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

// PUT /api/doctors/:doctorId/credentials/:credId
// Update a credential by its id
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

    creds[idx] = {
      ...creds[idx],
      ...(title       && { title }),
      ...(institution && { institution }),
      ...(year        && { year: String(year) }),
    };

    const { error } = await supabase.from('doctors')
      .update({ credentials: creds, updated_at: new Date().toISOString() })
      .eq('doctor_id', req.params.doctorId);
    if (error) throw error;

    res.json({ success: true, message: 'Credential updated', credential: creds[idx], credentials: creds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/doctors/:doctorId/credentials/:credId
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

// GET /api/doctors/:doctorId/consultation-hours
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

// PUT /api/doctors/:doctorId/consultation-hours
// Body: { weekdays: "09:00 AM - 05:00 PM", saturdays: "09:00 AM - 01:00 PM", sundays: "Closed" }
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