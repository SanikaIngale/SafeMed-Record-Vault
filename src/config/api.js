// config/api.js
// Central API configuration file


// Change this to your computer's IP address
const LOCAL_IP = '10.185.77.5';
const PORT = '5000';

export const API_URL = `http://${LOCAL_IP}:${PORT}`;

// API endpoints
export const API_ENDPOINTS = {
  SIGNUP: `${API_URL}/api/signup`,
  SIGNIN: `${API_URL}/api/signin`,
  HEALTH: `${API_URL}/api/health`,
  PROFILE: `${API_URL}/api/user/profile`,
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