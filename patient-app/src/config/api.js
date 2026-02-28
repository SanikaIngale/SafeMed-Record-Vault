// config/api.js
// Central API configuration file


// Change this to your computer's IP address

const LOCAL_IP = '192.168.0.104';
const PORT = '5001';

export const API_URL = `http://${LOCAL_IP}:${PORT}`;

// API endpoints
export const API_ENDPOINTS = {
  SIGNUP: `${API_URL}/api/auth/signup`,
  SIGNIN: `${API_URL}/api/auth/signin`,
  HEALTH: `${API_URL}/api/health`,
  PROFILE: `${API_URL}/api/auth/user/profile`,
  SAVE_DEMOGRAPHICS: `${API_URL}/api/auth/patient/demographics`,
  GET_PATIENT: `${API_URL}/api/patients`,

  MEDICATIONS: (patientId) => `${API_URL}/api/patients/${patientId}/medications`,
  VACCINATIONS: (patientId) => `${API_URL}/api/patients/${patientId}/vaccinations`,
  DEMOGRAPHICS: (patientId) => `${API_URL}/api/patients/${patientId}/demographics`,
  ALLERGIES: (patientId) => `${API_URL}/api/patients/${patientId}/allergies`,
  CONDITIONS: (patientId) => `${API_URL}/api/patients/${patientId}/conditions`,
  EMERGENCY_CONTACTS: (patientId) => `${API_URL}/api/patients/${patientId}/emergency-contacts`,

};

// Helper function for making API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    console.log(`🔗 API Call: ${endpoint}`);
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    const data = await response.json();
    console.log(`📦 Response Data:`, data);
    
    return { response, data };
  } catch (error) {
    console.error(`❌ API Error:`, error);
    throw error;
  }
};