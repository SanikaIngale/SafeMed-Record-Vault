const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────

function parseJson(value, fallback) {
  if (typeof value === 'string') {
    try { return JSON.parse(value || JSON.stringify(fallback)); }
    catch (e) { return fallback; }
  }
  return value || fallback;
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
    patient.medications       = parseJson(patient.medications, []);
    patient.vaccination_records = parseJson(patient.vaccination_records, []);
    patient.demographics      = parseJson(patient.demographics, {});
    patient.allergies         = parseJson(patient.allergies, []);
    patient.conditions        = parseJson(patient.conditions, []);
    patient.emergency_contacts = parseJson(patient.emergency_contacts, []);
  }
  return patient;
}

// ─── GET /api/patients/:patientId ──────────────────────────────────────────
router.get('/:patientId', async (req, res) => {
  try {
    const patient = await getPatient(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient data not found' });
    res.json({ success: true, ...patient });
  } catch (error) {
    console.error('Error fetching patient data:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── MEDICATIONS ───────────────────────────────────────────────────────────

router.get('/:patientId/medications', async (req, res) => {
  try {
    const patient = await getPatient(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const medications = patient.medications.map((med, i) => ({
      id: med.id || Date.now() + i,
      name: med.name,
      purpose: med.reason || '',
      dosage: med.dosage,
      frequency: med.frequency,
      time: med.time || '',
      startDate: med.start_date || ''
    }));
    res.json({ success: true, medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/:patientId/medications', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, purpose, dosage, frequency, time, startDate } = req.body;

    const { data: patients, error } = await supabase.from('patients').select('medications').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const meds = parseJson(patients[0].medications, []);
    const newMed = { id: Date.now(), name, reason: purpose, dosage, frequency, time: time || '', start_date: startDate || '' };
    meds.push(newMed);

    const { error: updateError } = await supabase.from('patients').update({ medications: JSON.stringify(meds) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Medication added successfully', medication: { id: newMed.id, name, purpose, dosage, frequency, time: newMed.time, startDate: newMed.start_date } });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:patientId/medications/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;
    const { name, purpose, dosage, frequency, time, startDate } = req.body;

    const { data: patients, error } = await supabase.from('patients').select('medications').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const meds = parseJson(patients[0].medications, []);
    const idx = meds.findIndex(m => String(m.id) === String(medicationId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Medication not found' });

    meds[idx] = { ...meds[idx], name, reason: purpose, dosage, frequency, time: time || '', start_date: startDate || '' };

    const { error: updateError } = await supabase.from('patients').update({ medications: JSON.stringify(meds) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Medication updated successfully' });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:patientId/medications/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;

    const { data: patients, error } = await supabase.from('patients').select('medications').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const meds = parseJson(patients[0].medications, []).filter(m => String(m.id) !== String(medicationId));

    const { error: updateError } = await supabase.from('patients').update({ medications: JSON.stringify(meds) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── VACCINATIONS ──────────────────────────────────────────────────────────

router.get('/:patientId/vaccinations', async (req, res) => {
  try {
    const patient = await getPatient(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const vaccinations = patient.vaccination_records.map((v, i) => ({
      id: v.id || Date.now() + i,
      name: v.name,
      date: v.date,
      location: v.hospital || '',
      doseNumber: v.dose || '',
      nextDue: v.next_due || 'N/A'
    }));
    res.json({ success: true, vaccinations });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/:patientId/vaccinations', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, date, location, doseNumber, nextDue } = req.body;

    const { data: patients, error } = await supabase.from('patients').select('vaccination_records').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const vacs = parseJson(patients[0].vaccination_records, []);
    const newVac = { id: Date.now(), name, date, hospital: location || '', dose: doseNumber || '', next_due: nextDue || 'N/A' };
    vacs.push(newVac);

    const { error: updateError } = await supabase.from('patients').update({ vaccination_records: JSON.stringify(vacs) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Vaccination added successfully', vaccination: { id: newVac.id, name, date, location: newVac.hospital, doseNumber: newVac.dose, nextDue: newVac.next_due } });
  } catch (error) {
    console.error('Error adding vaccination:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:patientId/vaccinations/:vaccinationId', async (req, res) => {
  try {
    const { patientId, vaccinationId } = req.params;
    const { name, date, location, doseNumber, nextDue } = req.body;

    const { data: patients, error } = await supabase.from('patients').select('vaccination_records').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const vacs = parseJson(patients[0].vaccination_records, []);
    const idx = vacs.findIndex(v => String(v.id) === String(vaccinationId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Vaccination not found' });

    vacs[idx] = { ...vacs[idx], name, date, hospital: location || '', dose: doseNumber || '', next_due: nextDue || 'N/A' };

    const { error: updateError } = await supabase.from('patients').update({ vaccination_records: JSON.stringify(vacs) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Vaccination updated successfully' });
  } catch (error) {
    console.error('Error updating vaccination:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:patientId/vaccinations/:vaccinationId', async (req, res) => {
  try {
    const { patientId, vaccinationId } = req.params;

    const { data: patients, error } = await supabase.from('patients').select('vaccination_records').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const vacs = parseJson(patients[0].vaccination_records, []).filter(v => String(v.id) !== String(vaccinationId));

    const { error: updateError } = await supabase.from('patients').update({ vaccination_records: JSON.stringify(vacs) }).eq('patient_id', patientId);
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Vaccination deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── DEMOGRAPHICS ──────────────────────────────────────────────────────────

router.post('/demographics', async (req, res) => {
  try {
    const { userId, email, name, dob, gender, bloodType, height, weight, chronicConditions, allergies } = req.body;
    console.log('Saving demographics for: ' + email);

    if (!email || !gender || !bloodType || !height || !weight)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const { data: users, error: userError } = await supabase.from('users').select('patient_id').eq('email', email.toLowerCase()).limit(1);
    if (userError) throw userError;
    if (!users?.length) return res.status(404).json({ success: false, message: 'User not found' });

    const patientId = users[0].patient_id;
    const demographicsData = {
      dob, gender, bloodType,
      height: parseFloat(height),
      weight: parseFloat(weight),
      chronicConditions: chronicConditions
        ? (typeof chronicConditions === 'string' ? chronicConditions.split(',').map(c => c.trim()) : chronicConditions)
        : []
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
    if (!updated?.length) return res.status(404).json({ success: false, message: 'Patient record not found' });

    res.json({ success: true, message: 'Demographics saved successfully', patient_id: patientId, demographics: demographicsData, allergies: updated[0].allergies || [], emergency_contacts: updated[0].emergency_contacts || [] });
  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/:patientId/demographics', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { data: patients, error } = await supabase.from('patients').select('demographics, allergies, emergency_contacts').eq('patient_id', patientId).limit(1);
    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const p = patients[0];
    res.json({
      success: true,
      demographics: parseJson(p.demographics, {}),
      allergies: parseJson(p.allergies, []),
      emergency_contacts: parseJson(p.emergency_contacts, [])
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:patientId/demographics', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { dob, gender, bloodType, height, weight, chronicConditions, allergies, emergency_contacts } = req.body;

    const demographicsData = {};
    if (dob) demographicsData.dob = dob;
    if (gender) demographicsData.gender = gender;
    if (bloodType) demographicsData.bloodType = bloodType;
    if (height) demographicsData.height = parseFloat(height);
    if (weight) demographicsData.weight = parseFloat(weight);
    if (chronicConditions) demographicsData.chronicConditions = typeof chronicConditions === 'string'
      ? chronicConditions.split(',').map(c => c.trim())
      : chronicConditions;

    const { data: patients, error: getError } = await supabase.from('patients').select('demographics').eq('patient_id', patientId).limit(1);
    if (getError) throw getError;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const existingDemographics = parseJson(patients[0].demographics, {});
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
    if (!updated?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.json({
      success: true,
      message: 'Demographics updated successfully',
      demographics: parseJson(updated[0].demographics, {}),
      allergies: parseJson(updated[0].allergies, []),
      emergency_contacts: parseJson(updated[0].emergency_contacts, [])
    });
  } catch (error) {
    console.error('Error updating demographics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── ALLERGIES ─────────────────────────────────────────────────────────────

router.get('/:patientId/allergies', async (req, res) => {
  const { data: result, error } = await supabase.from('patients').select('allergies').eq('patient_id', req.params.patientId).limit(1);
  if (error) return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  res.json({ success: true, allergies: parseJson(result?.[0]?.allergies, []) });
});

router.post('/:patientId/allergies', async (req, res) => {
  try {
    const { patientId } = req.params;
    const allergiesToSave = Array.isArray(req.body.allergies) ? req.body.allergies : parseJson(req.body.allergies, []);
    const { error } = await supabase.from('patients').update({ allergies: JSON.stringify(allergiesToSave) }).eq('patient_id', patientId);
    if (error) return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── CONDITIONS ────────────────────────────────────────────────────────────

router.get('/:patientId/conditions', async (req, res) => {
  const { data: result, error } = await supabase.from('patients').select('conditions').eq('patient_id', req.params.patientId).limit(1);
  if (error) return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  res.json({ success: true, conditions: parseJson(result?.[0]?.conditions, []) });
});

router.post('/:patientId/conditions', async (req, res) => {
  try {
    const { patientId } = req.params;
    const conditionsToSave = Array.isArray(req.body.conditions) ? req.body.conditions : parseJson(req.body.conditions, []);
    const { error } = await supabase.from('patients').update({ conditions: JSON.stringify(conditionsToSave) }).eq('patient_id', patientId);
    if (error) return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── EMERGENCY CONTACTS ────────────────────────────────────────────────────

router.get('/:patientId/emergency-contacts', async (req, res) => {
  const { data: result, error } = await supabase.from('patients').select('emergency_contacts').eq('patient_id', req.params.patientId).limit(1);
  if (error) return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  res.json({ success: true, emergency_contacts: parseJson(result?.[0]?.emergency_contacts, []) });
});

router.post('/:patientId/emergency-contacts', async (req, res) => {
  try {
    const { patientId } = req.params;
    const contactsToSave = Array.isArray(req.body.emergency_contacts) ? req.body.emergency_contacts : parseJson(req.body.emergency_contacts, []);
    const { error } = await supabase.from('patients').update({ emergency_contacts: JSON.stringify(contactsToSave) }).eq('patient_id', patientId);
    if (error) return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
// ─── REPORTS / PDFs ────────────────────────────────────────────────────────

// GET all PDFs for a patient (reads from pdfs column in patients table)
router.get('/:patientId/pdfs', async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data: patients, error } = await supabase
      .from('patients')
      .select('pdfs')
      .eq('patient_id', patientId)
      .limit(1);

    if (error) throw error;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const pdfs = parseJson(patients[0].pdfs, []);
    res.json({ success: true, pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET signed URL for a PDF
router.get('/:patientId/pdfs/:pdfId/signed-url', async (req, res) => {
  try {
    const { patientId, pdfId } = req.params;

    // Fetch pdfs array to find the file_path
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('pdfs')
      .eq('patient_id', patientId)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const pdfs = parseJson(patients[0].pdfs, []);
    const target = pdfs.find(p => String(p.id) === String(pdfId));

    if (!target) return res.status(404).json({ success: false, message: 'PDF not found' });

    // Generate signed URL (valid for 60 minutes)
    const { data, error: signError } = await supabase.storage
      .from('medical-records')
      .createSignedUrl(target.file_path, 3600);

    if (signError) throw signError;

    res.json({ success: true, signedUrl: data.signedUrl });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST upload PDF → storage bucket → save metadata in patients.pdfs column
router.post('/:patientId/pdfs/upload', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { fileBase64, fileName, mimeType, title, lab, type, date } = req.body;

    if (!fileBase64 || !title || !fileName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Sanitise filename (spaces → underscores, remove special chars except dot/dash/underscore)
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const id = Date.now();
    const filePath = `${patientId}/${id}_${safeName}`;

    // Upload to Supabase Storage bucket "medical-records"
    const buffer = Buffer.from(fileBase64, 'base64');
    const { error: storageError } = await supabase.storage
      .from('medical-records')
      .upload(filePath, buffer, {
        contentType: mimeType || 'application/pdf',
        upsert: false,
      });

    if (storageError) throw storageError;

    // Fetch existing pdfs array from patients table
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('pdfs')
      .eq('patient_id', patientId)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const existingPdfs = parseJson(patients[0].pdfs, []);

    // Build new PDF metadata entry (matches your JSON schema exactly)
    const newPdf = {
      id,
      title,
      lab: lab || '',
      type: type || 'Other',
      date,
      file_path: filePath,
      file_name: fileName,
      uploaded_at: new Date().toISOString(),
    };

    existingPdfs.unshift(newPdf); // newest first

    // Save updated array back to patients.pdfs column
    const { error: updateError } = await supabase
      .from('patients')
      .update({ pdfs: JSON.stringify(existingPdfs) })
      .eq('patient_id', patientId);

    if (updateError) throw updateError;

    res.json({ success: true, pdf: newPdf });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE a PDF → remove from storage + remove from patients.pdfs column
router.delete('/:patientId/pdfs/:pdfId', async (req, res) => {
  try {
    const { patientId, pdfId } = req.params;

    // Fetch current pdfs array
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('pdfs')
      .eq('patient_id', patientId)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!patients?.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const pdfs = parseJson(patients[0].pdfs, []);
    const target = pdfs.find(p => String(p.id) === String(pdfId));

    if (!target) return res.status(404).json({ success: false, message: 'PDF not found' });

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-records')
      .remove([target.file_path]);

    if (storageError) throw storageError;

    // Remove from array and save back
    const updatedPdfs = pdfs.filter(p => String(p.id) !== String(pdfId));
    const { error: updateError } = await supabase
      .from('patients')
      .update({ pdfs: JSON.stringify(updatedPdfs) })
      .eq('patient_id', patientId);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
