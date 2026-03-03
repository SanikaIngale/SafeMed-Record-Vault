const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyPatientToken } = require('../middleware/authPatient');

const router = express.Router();

// ── Helper: extract readable doctor info from jsonb columns ───────────────────
function parseDoctorInfo(doctor) {
  const demo = doctor.demographics || {};
  const specs = Array.isArray(doctor.specializations) ? doctor.specializations : [];
  return {
    name:           doctor.name                   || 'Unknown',
    email:          demo.email                    || null,
    phone:          demo.phone_number             || null,
    specialization: specs[0]                      || null,
    hospital:       demo.address?.hospital_name   || null,
  };
}

// ── GET /api/access-requests/patient/:patientId ───────────────────────────────
// Patient fetches all incoming access requests
router.get('/patient/:patientId', verifyPatientToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('patient_id', patientId)
      .order('requested_at', { ascending: false });
    if (error) throw error;

    // Enrich each request with doctor info
    const enriched = await Promise.all(data.map(async (r) => {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('name, demographics, specializations')
        .eq('doctor_id', r.doctor_id)
        .limit(1);

      const info = doctorData?.[0] ? parseDoctorInfo(doctorData[0]) : {};

      return {
        ...r,
        doctor_name:           info.name           || 'Unknown',
        doctor_specialization: info.specialization || '',
        doctor_hospital:       info.hospital       || '',
        doctor_email:          info.email          || '',
      };
    }));

    res.json({ success: true, requests: enriched });
  } catch (error) {
    console.error('Error fetching patient access requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── PUT /api/access-requests/:requestId/approve ───────────────────────────────
// Patient approves a request and sets how long the doctor can access records.
// Body: { expires_at: ISO string }  ← set by the patient's duration picker
router.put('/:requestId/approve', verifyPatientToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { expires_at } = req.body;

    // expires_at is required — the patient must choose a duration
    if (!expires_at)
      return res.status(400).json({ success: false, message: 'expires_at is required. Patient must select an access duration.' });

    // Reject obviously bad timestamps (e.g. patient sends a past date)
    if (new Date(expires_at) <= new Date())
      return res.status(400).json({ success: false, message: 'expires_at must be a future timestamp.' });

    // Verify the request exists and belongs to this patient
    const { data: existing, error: fetchError } = await supabase
      .from('access_requests')
      .select('id, patient_id, status')
      .eq('id', requestId)
      .limit(1);
    if (fetchError) throw fetchError;
    if (!existing?.length)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (existing[0].patient_id !== req.patientId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    if (existing[0].status !== 'pending')
      return res.status(409).json({ success: false, message: `Request is already ${existing[0].status}` });

    const { data, error } = await supabase
      .from('access_requests')
      .update({
        status:       'approved',
        responded_at: new Date().toISOString(),
        expires_at,                               // ⭐ stored in the row
      })
      .eq('id', requestId)
      .select();
    if (error) throw error;

    console.log(`✅ Request ${requestId} approved. Expires: ${expires_at}`);
    res.json({ success: true, message: 'Request approved', request: data[0] });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── PUT /api/access-requests/:requestId/reject ────────────────────────────────
router.put('/:requestId/reject', verifyPatientToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify the request belongs to this patient
    const { data: existing, error: fetchError } = await supabase
      .from('access_requests')
      .select('id, patient_id, status')
      .eq('id', requestId)
      .limit(1);
    if (fetchError) throw fetchError;
    if (!existing?.length)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (existing[0].patient_id !== req.patientId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    if (existing[0].status !== 'pending')
      return res.status(409).json({ success: false, message: `Request is already ${existing[0].status}` });

    const { data, error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .select();
    if (error) throw error;

    console.log(`❌ Request ${requestId} rejected`);
    res.json({ success: true, message: 'Request rejected', request: data[0] });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── PUT /api/access-requests/:requestId/revoke ────────────────────────────────
// Patient immediately cancels a previously approved grant before it expires
router.put('/:requestId/revoke', verifyPatientToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('access_requests')
      .select('id, patient_id, status')
      .eq('id', requestId)
      .limit(1);
    if (fetchError) throw fetchError;
    if (!existing?.length)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (existing[0].patient_id !== req.patientId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    if (existing[0].status !== 'approved')
      return res.status(409).json({ success: false, message: 'Only approved grants can be revoked' });

    // Set expires_at to now so all backend time checks instantly block the doctor
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected', expires_at: now })
      .eq('id', requestId)
      .select();
    if (error) throw error;

    console.log(`🚫 Request ${requestId} revoked by patient`);
    res.json({ success: true, message: 'Access revoked', request: data[0] });
  } catch (error) {
    console.error('Error revoking request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;