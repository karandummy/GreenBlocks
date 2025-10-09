// services/marketplace.service.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const marketplaceService = {
  // List credits for sale
  async listCredits(data) {
    try {
      const response = await axios.post(
        `${API_URL}/marketplace/list`,
        data,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all marketplace listings
  async getMarketplaceListings(params = {}) {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/listings`,
        {
          params,
          ...getAuthHeader()
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get my listings
  async getMyListings() {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/my-listings`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buy credits
  async buyCredits(data) {
    try {
      const response = await axios.post(
        `${API_URL}/marketplace/buy`,
        data,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel listing
  async cancelListing(listingId) {
    try {
      const response = await axios.patch(
        `${API_URL}/marketplace/${listingId}/cancel`,
        {},
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check token balance (blockchain)
  async checkTokenBalance(walletAddress) {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      const tokenAddress = "0x555ab359988f83854eB2A89B1841E4fA5A6592b2";
      const balanceOfABI = [
        {
          "constant": true,
          "inputs": [{"name": "_owner", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "balance", "type": "uint256"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "decimals",
          "outputs": [{"name": "", "type": "uint8"}],
          "type": "function"
        }
      ];

      const provider = new window.ethers.BrowserProvider(window.ethereum);
      const contract = new window.ethers.Contract(tokenAddress, balanceOfABI, provider);
      
      const balance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();
      const formattedBalance = parseFloat(window.ethers.formatUnits(balance, decimals));
      
      return formattedBalance;
    } catch (error) {
      console.error('Balance check error:', error);
      throw error;
    }
  },

  // Connect wallet
  async connectWallet() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      return accounts[0];
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }
};