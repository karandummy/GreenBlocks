import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // adjust to your backend URL

export const authService = {
  async register(userData) {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  },

  async login(data) {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data;
  },

  async verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) return { success: false };

    const response = await axios.get(`${API_URL}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async verifyWallet(walletAddress) {
    const response = await axios.post(`${API_URL}/verify-wallet`, { walletAddress });
    return response.data;
  }
};
