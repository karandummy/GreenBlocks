const { create } = require('ipfs-http-client');

class IPFSConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Create IPFS client
      this.client = create({
        host: process.env.IPFS_HOST || 'localhost',
        port: process.env.IPFS_PORT || 5001,
        protocol: process.env.IPFS_PROTOCOL || 'http'
      });

      // Test connection
      const version = await this.client.version();
      console.log(`Connected to IPFS node version: ${version.version}`);
      this.isConnected = true;
      
      return true;
    } catch (error) {
      console.warn('IPFS connection failed, running without IPFS:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  getClient() {
    return this.client;
  }

  isClientConnected() {
    return this.isConnected;
  }
}

module.exports = new IPFSConfig();