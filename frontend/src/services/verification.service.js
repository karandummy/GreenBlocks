// src/services/verification.service.js
import api from './api';

const API_URL = 'http://localhost:5000/api/verification';

export const verificationService = {
  // Get all pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await api.get(`${API_URL}/pending`);
      return response.data;
    } catch (error) {
      console.error('Get pending verifications error:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch pending verifications' };
    }
  },

  // Get all completed verifications
  getCompletedVerifications: async () => {
    try {
      const response = await api.get(`${API_URL}/completed`);
      return response.data;
    } catch (error) {
      console.error('Get completed verifications error:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch completed verifications' };
    }
  },

  // Get project verification details
  getProjectVerification: async (projectId) => {
    try {
      const response = await api.get(`${API_URL}/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Get project verification error:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch project verification' };
    }
  },

  // Review a project (mark as under review)
  reviewProject: async (projectId, data) => {
    try {
      const response = await api.post(`${API_URL}/projects/${projectId}/review`, data);
      return response.data;
    } catch (error) {
      console.error('Review project error:', error);
      throw error.response?.data || { success: false, message: 'Failed to review project' };
    }
  },

  // Approve a project
  approveProject: async (projectId, data) => {
    try {
      const response = await api.post(`${API_URL}/projects/${projectId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('Approve project error:', error);
      throw error.response?.data || { success: false, message: 'Failed to approve project' };
    }
  },

  // Reject a project
  rejectProject: async (projectId, data) => {
    try {
      const response = await api.post(`${API_URL}/projects/${projectId}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('Reject project error:', error);
      throw error.response?.data || { success: false, message: 'Failed to reject project' };
    }
  },

  // Schedule an inspection
  scheduleInspection: async (data) => {
    try {
      const response = await api.post(`${API_URL}/inspections`, data);
      return response.data;
    } catch (error) {
      console.error('Schedule inspection error:', error);
      throw error.response?.data || { success: false, message: 'Failed to schedule inspection' };
    }
  },

  // Update an inspection
  updateInspection: async (inspectionId, data) => {
    try {
      const response = await api.put(`${API_URL}/inspections/${inspectionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update inspection error:', error);
      throw error.response?.data || { success: false, message: 'Failed to update inspection' };
    }
  },

  // Get inspection details
  getInspection: async (inspectionId) => {
    try {
      const response = await api.get(`${API_URL}/inspections/${inspectionId}`);
      return response.data;
    } catch (error) {
      console.error('Get inspection error:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch inspection details' };
    }
  },

  // Get all inspections
  getAllInspections: async () => {
    try {
      const response = await api.get(`${API_URL}/inspections`);
      return response.data;
    } catch (error) {
      console.error('Get all inspections error:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch inspections' };
    }
  }
};