const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyPatientToken } = require('../middleware/authPatient');

const router = express.Router();

// Helper — extract readable doctor info from jsonb columns
function parseDoctorInfo(doctor) {
  const demo = doctor.demographics || {};
  const specs = Array.isArray(doctor.specializations)
    ? doctor.specializations
    : [];

  return {
    name:           doctor.name               || 'Unknown',
    email:          demo.email                || null,
    phone:          demo.phone_number         || null,
    specialization: specs[0]                  || null,
    hospital:       demo.address?.hospital_name || null,
  };
}

// GET /api/access-requests/patient/:patientId
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

// PUT /api/access-requests/:requestId/approve
router.put('/:requestId/approve', verifyPatientToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    const { data, error } = await supabase
      .from('access_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .select();
    if (error) throw error;
    if (!data?.length)
      return res.status(404).json({ success: false, message: 'Request not found' });

    console.log(`Access request ${requestId} approved`);
    res.json({ success: true, message: 'Request approved', request: data[0] });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/access-requests/:requestId/reject
router.put('/:requestId/reject', verifyPatientToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    const { data, error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .select();
    if (error) throw error;
    if (!data?.length)
      return res.status(404).json({ success: false, message: 'Request not found' });

    console.log(`Access request ${requestId} rejected`);
    res.json({ success: true, message: 'Request rejected', request: data[0] });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;