const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyDoctorToken } = require('../middleware/authDoctor');

const router = express.Router();

// ── Helper: fetch a doctor row ────────────────────────────────────────────────
async function getDoctor(doctorId) {
  const { data, error } = await supabase
    .from('doctors').select('*').eq('doctor_id', doctorId).limit(1);
  if (error) throw error;
  return data?.[0];
}

// ── Helper: check if a doctor has a valid, non-expired grant for a patient ────
// Returns the grant row if valid, null otherwise.
// Every route that touches patient data calls this instead of a raw query.
async function getValidGrant(doctorId, patientId) {
  const { data, error } = await supabase
    .from('access_requests')
    .select('id, expires_at')
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString())   // ⭐ live time check
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

// ── GET /api/doctors/access-requests ─────────────────────────────────────────
router.get('/access-requests', verifyDoctorToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('doctor_id', req.doctorId)
      .order('requested_at', { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all(data.map(async (r) => {
      const { data: pt } = await supabase
        .from('patients').select('name').eq('patient_id', r.patient_id).limit(1);
      const rawName = pt?.[0]?.name;
      const patient_name = typeof rawName === 'object'
        ? (rawName?.name || rawName?.full_name || 'Unknown')
        : (rawName || 'Unknown');
      return { ...r, patient_name };
    }));

    res.json({ success: true, requests: enriched });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── POST /api/doctors/access-requests ────────────────────────────────────────
router.post('/access-requests', verifyDoctorToken, async (req, res) => {
  try {
    let { patient_id, message } = req.body;
    if (!patient_id)
      return res.status(400).json({ success: false, message: 'patient_id is required' });

    patient_id = patient_id.trim().toUpperCase();
    const numPart = patient_id.replace(/^[A-Z]+/, '');
    const prefix  = patient_id.replace(/[0-9]+$/, '');
    if (numPart) patient_id = prefix + numPart.padStart(4, '0');

    const { data: patient, error: pe } = await supabase
      .from('patients').select('patient_id').eq('patient_id', patient_id).limit(1);
    if (pe) throw pe;
    if (!patient?.length)
      return res.status(404).json({ success: false, message: 'Patient not found' });

    const { data: existing, error: ee } = await supabase
      .from('access_requests').select('id')
      .eq('doctor_id', req.doctorId).eq('patient_id', patient_id).eq('status', 'pending').limit(1);
    if (ee) throw ee;
    if (existing?.length > 0)
      return res.status(409).json({ success: false, message: 'You already have a pending request for this patient' });

    const { data: newReq, error: ie } = await supabase
      .from('access_requests')
      .insert([{ doctor_id: req.doctorId, patient_id, status: 'pending', message: message || '', requested_at: new Date().toISOString() }])
      .select();
    if (ie) throw ie;

    console.log(`Access request: Doctor ${req.doctorId} → Patient ${patient_id}`);
    res.status(201).json({ success: true, message: 'Access request sent. Patient will be notified.', request: newReq[0] });
  } catch (error) {
    console.error('Error sending access request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── POST /api/doctors/emergency-access/:patientId ────────────────────────────
// Break-glass: bypasses consent, returns critical data, logs the access
router.post('/emergency-access/:patientId', verifyDoctorToken, async (req, res) => {
  try {
    const { reason } = req.body;
    let { patientId } = req.params;

    if (!reason?.trim())
      return res.status(400).json({ success: false, message: 'Reason is required for emergency access' });

    patientId = patientId.trim().toUpperCase();
    const numPart = patientId.replace(/^[A-Z]+/, '');
    const prefix  = patientId.replace(/[0-9]+$/, '');
    if (numPart) patientId = prefix + numPart.padStart(4, '0');

    const { data, error } = await supabase
      .from('patients')
      .select('patient_id, name, demographics, allergies, conditions, medications, vaccination_records')
      .eq('patient_id', patientId)
      .limit(1);
    if (error) throw error;
    if (!data?.length)
      return res.status(404).json({ success: false, message: `Patient ${patientId} not found in the system.` });

    const p = data[0];
    const name = typeof p.name === 'object'
      ? (p.name?.name || p.name?.full_name || 'Unknown')
      : (p.name || 'Unknown');

    try {
      await supabase.from('access_requests').insert([{
        doctor_id: req.doctorId, patient_id: patientId,
        status: 'emergency', message: `[EMERGENCY] ${reason.trim()}`,
        requested_at: new Date().toISOString(),
      }]);
    } catch (logErr) {
      console.warn('Emergency audit log failed (non-fatal):', logErr.message);
    }

    console.log(`🚨 EMERGENCY ACCESS: Doctor ${req.doctorId} → Patient ${patientId} | Reason: ${reason}`);
    res.json({ success: true, patient: { name, patient_id: p.patient_id, demographics: p.demographics, allergies: p.allergies, conditions: p.conditions, medications: p.medications, vaccination_records: p.vaccination_records } });
  } catch (error) {
    console.error('Emergency access error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── GET /api/doctors/patients/search ─────────────────────────────────────────
router.get('/patients/search', verifyDoctorToken, async (req, res) => {
  try {
    let { patient_id } = req.query;
    if (!patient_id)
      return res.status(400).json({ success: false, message: 'patient_id is required' });

    patient_id = patient_id.trim().toUpperCase();
    const numPart = patient_id.replace(/^[A-Z]+/, '');
    const prefix  = patient_id.replace(/[0-9]+$/, '');
    if (numPart) patient_id = prefix + numPart.padStart(4, '0');

    const { data, error } = await supabase
      .from('patients').select('patient_id, name, demographics').eq('patient_id', patient_id).limit(1);
    if (error) throw error;
    if (!data?.length)
      return res.status(404).json({ success: false, message: 'Patient not found' });

    const p = data[0];
    const demo = typeof p.demographics === 'string' ? JSON.parse(p.demographics || '{}') : (p.demographics || {});
    const name = typeof p.name === 'object' ? (p.name?.name || p.name?.full_name || 'Unknown') : (p.name || 'Unknown');

    res.json({ success: true, patient: { patient_id: p.patient_id, name, gender: demo.gender || null, bloodType: demo.bloodType || null } });
  } catch (error) {
    console.error('Error searching patient:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── GET /api/doctors/my-patients ─────────────────────────────────────────────
// ⭐ Only returns patients with an approved, non-expired grant
router.get('/my-patients', verifyDoctorToken, async (req, res) => {
  try {
    const { data: approved, error } = await supabase
      .from('access_requests')
      .select('patient_id, responded_at, expires_at')
      .eq('doctor_id', req.doctorId)
      .eq('status', 'approved')
      .gt('expires_at', new Date().toISOString())   // ⭐ filter out expired grants
      .order('responded_at', { ascending: false });
    if (error) throw error;
    if (!approved?.length) return res.json({ success: true, patients: [] });

    const ids = approved.map(r => r.patient_id);

    // Build a quick lookup for expires_at so we can attach it to each patient
    const expiryMap = {};
    approved.forEach(r => { expiryMap[r.patient_id] = r.expires_at; });

    const { data: patients, error: pe } = await supabase
      .from('patients').select('patient_id, name, demographics, conditions').in('patient_id', ids);
    if (pe) throw pe;

    const result = patients.map(p => {
      const demo  = typeof p.demographics === 'string' ? JSON.parse(p.demographics || '{}') : (p.demographics || {});
      const conds = typeof p.conditions   === 'string' ? JSON.parse(p.conditions   || '[]') : (p.conditions   || []);
      const name  = typeof p.name === 'object' ? (p.name?.name || p.name?.full_name || 'Unknown') : (p.name || 'Unknown');
      const condition = (() => {
        const c = conds[0];
        if (!c) return null;
        if (typeof c === 'object') return c.name || c.condition || c.label || null;
        return c;
      })();
      return {
        patient_id: p.patient_id,
        name,
        age:        demo.dob ? Math.floor((new Date() - new Date(demo.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        gender:     demo.gender    || null,
        bloodType:  demo.bloodType || null,
        condition,
        expires_at: expiryMap[p.patient_id] || null,  // ⭐ sent to frontend for countdown
      };
    });

    res.json({ success: true, patients: result });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── GET /api/doctors/patients/:patientId/records ──────────────────────────────
// ⭐ Checks both status AND expires_at via getValidGrant
router.get('/patients/:patientId/records', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const grant = await getValidGrant(req.doctorId, patientId);
    if (!grant)
      return res.status(403).json({ success: false, message: 'Access not approved or has expired' });

    const { data, error } = await supabase.from('patients').select('*').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const patient = data[0];

    const { data: userData } = await supabase
      .from('users').select('mobilenumber').eq('patient_id', patientId).limit(1);
    const phone = userData?.[0]?.mobilenumber || null;

    const demo = typeof patient.demographics === 'string'
      ? JSON.parse(patient.demographics || '{}') : (patient.demographics || {});
    if (phone && !demo.phone_number) demo.phone_number = phone;

    res.json({
      success: true,
      patient: { ...patient, demographics: demo },
      access_expires_at: grant.expires_at,   // ⭐ frontend can show a countdown
    });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── POST /api/doctors/patients/:patientId/consultation ────────────────────────
// ⭐ Uses getValidGrant — blocked automatically when grant expires
router.post('/patients/:patientId/consultation', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, notes, diagnosis, prescription, reason_for_visit, severity, icd_code, doctor_notes } = req.body;

    if (!date || !notes)
      return res.status(400).json({ success: false, message: 'Date and notes are required' });

    const grant = await getValidGrant(req.doctorId, patientId);
    if (!grant)
      return res.status(403).json({ success: false, message: 'Access not approved or has expired' });

    const { data: doctorRows, error: doctorError } = await supabase
      .from('doctors').select('name, demographics').eq('doctor_id', req.doctorId).limit(1);
    if (doctorError) throw doctorError;

    const doctor     = doctorRows?.[0] || {};
    const doctorName = typeof doctor.name === 'object'
      ? (doctor.name?.name || doctor.name?.full_name || 'Doctor') : (doctor.name || 'Doctor');
    const doctorDemo = typeof doctor.demographics === 'string'
      ? JSON.parse(doctor.demographics || '{}') : (doctor.demographics || {});
    const hospital   = doctorDemo.hospital || doctorDemo.clinic || doctorDemo.workplace || 'Hospital';

    const consultationId  = `CONS-${Date.now()}`;
    const newConsultation = {
      consultation_id:  consultationId,
      date,
      hospital,
      doctor:           `Dr. ${doctorName}`,
      reason_for_visit: reason_for_visit || notes,
      diagnosis:        diagnosis        || '',
      doctor_notes:     doctor_notes     || '',
      icd_code:         icd_code         || '',
      severity:         severity         || '',
      prescription:     prescription     || '',
      clinical_findings: notes,
      created_at:       new Date().toISOString(),
    };

    const { data: patientRows, error: fetchError } = await supabase
      .from('patients').select('consultations').eq('patient_id', patientId).limit(1);
    if (fetchError) throw fetchError;
    if (!patientRows?.length)
      return res.status(404).json({ success: false, message: 'Patient not found' });

    const existing = (() => {
      const v = patientRows[0].consultations;
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    })();

    const { error: updateError } = await supabase
      .from('patients')
      .update({ consultations: JSON.stringify([newConsultation, ...existing]) })
      .eq('patient_id', patientId);
    if (updateError) throw updateError;

    console.log(`✅ Consultation saved for patient ${patientId} by doctor ${req.doctorId}`);
    res.status(201).json({ success: true, message: 'Consultation saved successfully', consultation: newConsultation });
  } catch (error) {
    console.error('Error adding consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── PUT /api/doctors/patients/:patientId/consultation/:consultationId ─────────
// ⭐ Uses getValidGrant — blocked automatically when grant expires
router.put('/patients/:patientId/consultation/:consultationId', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId, consultationId } = req.params;
    const { date, notes, diagnosis, prescription, reason_for_visit, severity, icd_code, doctor_notes } = req.body;

    const grant = await getValidGrant(req.doctorId, patientId);
    if (!grant)
      return res.status(403).json({ success: false, message: 'Access not approved or has expired' });

    const { data: patientRows, error: fetchError } = await supabase
      .from('patients').select('consultations').eq('patient_id', patientId).limit(1);
    if (fetchError) throw fetchError;
    if (!patientRows?.length)
      return res.status(404).json({ success: false, message: 'Patient not found' });

    const existing = (() => {
      const v = patientRows[0].consultations;
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    })();

    const idx = existing.findIndex(c => c.consultation_id === consultationId);
    if (idx === -1)
      return res.status(404).json({ success: false, message: 'Consultation not found' });

    existing[idx] = {
      ...existing[idx],
      ...(date             !== undefined && { date }),
      ...(notes            !== undefined && { clinical_findings: notes }),
      ...(diagnosis        !== undefined && { diagnosis }),
      ...(prescription     !== undefined && { prescription }),
      ...(reason_for_visit !== undefined && { reason_for_visit }),
      ...(severity         !== undefined && { severity }),
      ...(icd_code         !== undefined && { icd_code }),
      ...(doctor_notes     !== undefined && { doctor_notes }),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('patients').update({ consultations: JSON.stringify(existing) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    console.log(`✅ Consultation ${consultationId} updated for patient ${patientId}`);
    res.json({ success: true, message: 'Consultation updated', consultation: existing[idx] });
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── POST /api/doctors/patients/:patientId/reports/upload ─────────────────────
// ⭐ Uses getValidGrant — blocked automatically when grant expires
router.post('/patients/:patientId/reports/upload', verifyDoctorToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { fileBase64, fileName, mimeType, title, lab, type, date } = req.body;

    if (!fileBase64 || !title || !fileName)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const grant = await getValidGrant(req.doctorId, patientId);
    if (!grant)
      return res.status(403).json({ success: false, message: 'You do not have active access to this patient' });

    const { data: patients, error: patientError } = await supabase
      .from('patients').select('pdfs').eq('patient_id', patientId).limit(1);
    if (patientError) throw patientError;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const safeName  = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const id        = Date.now();
    const filePath  = `${patientId}/${id}_${safeName}`;
    const buffer    = Buffer.from(fileBase64, 'base64');

    const { error: storageError } = await supabase.storage
      .from('medical-records').upload(filePath, buffer, { contentType: mimeType || 'application/pdf', upsert: false });
    if (storageError) throw storageError;

    const { data: doctorData } = await supabase
      .from('doctors').select('name').eq('doctor_id', req.doctorId).limit(1);
    const doctorName = doctorData?.[0]?.name || 'Unknown';

    const existingPdfs = (typeof patients[0].pdfs === 'string'
      ? JSON.parse(patients[0].pdfs || '[]') : (patients[0].pdfs || []));

    const newPdf = {
      id, title, lab: lab || '', type: type || 'Other', date,
      file_path: filePath, file_name: fileName,
      uploaded_at: new Date().toISOString(),
      uploaded_by: req.doctorId, uploaded_by_name: doctorName,
      is_doctor_upload: true,
    };
    existingPdfs.unshift(newPdf);

    const { error: updateError } = await supabase
      .from('patients').update({ pdfs: JSON.stringify(existingPdfs) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    console.log(`Doctor ${req.doctorId} uploaded report for patient ${patientId}`);
    res.status(201).json({ success: true, pdf: newPdf });
  } catch (error) {
    console.error('Doctor report upload error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── GET /api/doctors/:doctorId ────────────────────────────────────────────────
router.get('/:doctorId', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const name = typeof doctor.name === 'object'
      ? (doctor.name?.name || doctor.name?.full_name || 'Doctor') : (doctor.name || 'Doctor');
    res.json({ success: true, doctor: { doctor_id: doctor.doctor_id, name, demographics: doctor.demographics || {}, license_id: doctor.license_id || '', specializations: doctor.specializations || [], credentials: doctor.credentials || [], consultation_hours: doctor.consultation_hours || {}, created_at: doctor.created_at, updated_at: doctor.updated_at } });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── PUT /api/doctors/:doctorId/demographics ───────────────────────────────────
router.put('/:doctorId/demographics', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const { full_name, phone_number, date_of_birth, address } = req.body;
    const updatedDemographics = { ...doctor.demographics, ...(full_name && { full_name }), ...(phone_number && { phone_number }), ...(date_of_birth && { date_of_birth }), ...(address && { address: { ...doctor.demographics?.address, ...address } }) };
    const updatePayload = { demographics: updatedDemographics, updated_at: new Date().toISOString() };
    if (full_name) updatePayload.name = full_name;
    const { error } = await supabase.from('doctors').update(updatePayload).eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Demographics updated', demographics: updatedDemographics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── POST /api/doctors/:doctorId/credentials ───────────────────────────────────
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
    const { error } = await supabase.from('doctors').update({ credentials: updated, updated_at: new Date().toISOString() }).eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Credential added', credential: newCred, credentials: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── PUT /api/doctors/:doctorId/credentials/:credId ────────────────────────────
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
    const { error } = await supabase.from('doctors').update({ credentials: creds, updated_at: new Date().toISOString() }).eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Credential updated', credential: creds[idx], credentials: creds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── DELETE /api/doctors/:doctorId/credentials/:credId ────────────────────────
router.delete('/:doctorId/credentials/:credId', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const updated = (doctor.credentials || []).filter(c => String(c.id) !== String(req.params.credId));
    const { error } = await supabase.from('doctors').update({ credentials: updated, updated_at: new Date().toISOString() }).eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Credential deleted', credentials: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── GET /api/doctors/:doctorId/consultation-hours ─────────────────────────────
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

// ── PUT /api/doctors/:doctorId/consultation-hours ─────────────────────────────
router.put('/:doctorId/consultation-hours', verifyDoctorToken, async (req, res) => {
  try {
    if (req.doctorId !== req.params.doctorId)
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const { weekdays, saturdays, sundays } = req.body;
    if (weekdays === undefined && saturdays === undefined && sundays === undefined)
      return res.status(400).json({ success: false, message: 'At least one day schedule is required' });
    const doctor = await getDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const updated = { ...doctor.consultation_hours, ...(weekdays !== undefined && { weekdays }), ...(saturdays !== undefined && { saturdays }), ...(sundays !== undefined && { sundays }) };
    const { error } = await supabase.from('doctors').update({ consultation_hours: updated, updated_at: new Date().toISOString() }).eq('doctor_id', req.params.doctorId);
    if (error) throw error;
    res.json({ success: true, message: 'Consultation hours updated', consultation_hours: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;