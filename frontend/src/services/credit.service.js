import api from './api';

export const creditService = {
  async getAllCredits(params = {}) {
    try {
      const response = await api.get('/credits', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch credits');
    }
  },

  async getMarketplaceCredits() {
    try {
      const response = await api.get('/credits/marketplace');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch marketplace credits');
    }
  },

  async getMyCredits() {
    try {
      const response = await api.get('/credits/my-credits');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your credits');
    }
  },

  async getCreditById(id) {
    try {
      const response = await api.get(`/credits/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch credit details');
    }
  },

  async claimCredits(claimData) {
    try {
      const response = await api.post('/credits/claim', claimData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to claim credits');
    }
  },

  async purchaseCredits(purchaseData) {
    try {
      const response = await api.post('/credits/purchase', purchaseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to purchase credits');
    }
  },

  async retireCredits(retireData) {
    try {
      const response = await api.post('/credits/retire', retireData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to retire credits');
    }
  },

  async verifyCredits(id) {
    try {
      const response = await api.post(`/credits/${id}/verify`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify credits');
    }
  },

  async approveCredits(id) {
    try {
      const response = await api.post(`/credits/${id}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve credits');
    }
  },

  async rejectCredits(id, reason) {
    try {
      const response = await api.post(`/credits/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject credits');
    }
  }
};