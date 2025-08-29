import api from './api';

export const blockchainService = {
  async getTransactions(params = {}) {
    try {
      const response = await api.get('/blockchain/transactions', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
    }
  },

  async getTransactionByHash(hash) {
    try {
      const response = await api.get(`/blockchain/transactions/${hash}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transaction');
    }
  },

  async getBlockInfo(blockNumber) {
    try {
      const response = await api.get(`/blockchain/blocks/${blockNumber}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch block info');
    }
  },

  async getWalletBalance(address) {
    try {
      const response = await api.get(`/blockchain/wallet/${address}/balance`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get wallet balance');
    }
  },

  async deployContract(contractData) {
    try {
      const response = await api.post('/blockchain/deploy-contract', contractData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to deploy contract');
    }
  },

  async mintTokens(mintData) {
    try {
      const response = await api.post('/blockchain/mint-tokens', mintData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mint tokens');
    }
  },

  async transferTokens(transferData) {
    try {
      const response = await api.post('/blockchain/transfer-tokens', transferData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to transfer tokens');
    }
  },

  async burnTokens(burnData) {
    try {
      const response = await api.post('/blockchain/burn-tokens', burnData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to burn tokens');
    }
  }
};