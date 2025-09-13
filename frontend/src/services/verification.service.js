import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
);

export const verificationService = {
  // Get pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await api.get('/verification/pending');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get completed verifications
  getCompletedVerifications: async () => {
    try {
      const response = await api.get('/verification/completed');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get project verification details
  getProjectVerification: async (projectId) => {
    try {
      const response = await api.get(`/verification/projects/${projectId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Review project
  reviewProject: async (projectId, data) => {
    try {
      const response = await api.post(`/verification/projects/${projectId}/review`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Approve project
  approveProject: async (projectId, data) => {
    try {
      const response = await api.post(`/verification/projects/${projectId}/approve`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reject project
  rejectProject: async (projectId, data) => {
    try {
      const response = await api.post(`/verification/projects/${projectId}/reject`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Schedule inspection
  scheduleInspection: async (data) => {
    try {
      const response = await api.post('/verification/inspections', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update inspection
  updateInspection: async (inspectionId, data) => {
    try {
      const response = await api.put(`/verification/inspections/${inspectionId}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }
};