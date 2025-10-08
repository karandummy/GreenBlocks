// services/creditClaim.service.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const creditClaimService = {
  // Create a new credit claim
  createClaim: async (claimData) => {
    try {
      const response = await axios.post(
        `${API_URL}/claims`,
        claimData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create claim' };
    }
  },

  // Get all claims (for regulatory body)
  getAllClaims: async (params = {}) => {
    try {
      const response = await axios.get(
        `${API_URL}/claims`,
        {
          headers: getAuthHeader(),
          params
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch claims' };
    }
  },

  // Get developer's claims
  getMyClaims: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/claims/my-claims`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch my claims' };
    }
  },

  // Get single claim by ID
  getClaimById: async (claimId) => {
    try {
      const response = await axios.get(
        `${API_URL}/claims/${claimId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch claim' };
    }
  },

  // Schedule inspection (Regulatory body)
  scheduleInspection: async (claimId, data) => {
    try {
      const response = await axios.post(
        `${API_URL}/claims/${claimId}/schedule-inspection`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to schedule inspection' };
    }
  },

  // Complete inspection (Regulatory body)
  completeInspection: async (claimId, data) => {
    try {
      const response = await axios.post(
        `${API_URL}/claims/${claimId}/complete-inspection`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete inspection' };
    }
  },

  // Issue credits (Regulatory body)
  issueCredits: async (claimId, data) => {
    try {
      const response = await axios.post(
        `${API_URL}/claims/${claimId}/issue-credits`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to issue credits' };
    }
  },

  // Reject claim (Regulatory body)
  rejectClaim: async (claimId, data) => {
    try {
      const response = await axios.post(
        `${API_URL}/claims/${claimId}/reject`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject claim' };
    }
  }
};