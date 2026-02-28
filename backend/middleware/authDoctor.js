const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production_12345';

const verifyDoctorToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Make sure this token belongs to a doctor
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor access only.' });
    }
    req.doctorId = decoded.doctorId;
    req.doctorEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { verifyDoctorToken };
