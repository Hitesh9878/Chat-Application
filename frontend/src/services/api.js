// ===== 1. UPDATED api.js (Frontend) =====
// src/utils/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://chat-application-fj04.onrender.com/api';

console.log('🔧 API Configuration:', {
  baseURL: API_URL,
  environment: process.env.NODE_ENV
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    console.log(`✅ API Response: ${response.config.url}`, response.status);
    return response;
  },
  error => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    // Handle unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
