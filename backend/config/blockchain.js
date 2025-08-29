const Web3 = require('web3');

class BlockchainConfig {
  constructor() {
    this.web3 = null;
    this.networkId = null;
    this.accounts = [];
    this.defaultAccount = null;
  }

  async initialize() {
    try {
      // Connect to blockchain
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
      this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

      // Test connection
      const isConnected = await this.web3.eth.net.isListening();
      if (!isConnected) {
        console.warn('Blockchain connection failed, running in mock mode');
        return false;
      }

      // Get network ID
      this.networkId = await this.web3.eth.net.getId();
      console.log(`Connected to blockchain network: ${this.networkId}`);

      // Set up default account if private key provided
      if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
        const account = this.web3.eth.accounts.privateKeyToAccount(
          process.env.BLOCKCHAIN_PRIVATE_KEY
        );
        this.web3.eth.accounts.wallet.add(account);
        this.defaultAccount = account.address;
        console.log(`Default account set: ${this.defaultAccount}`);
      }

      return true;
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      return false;
    }
  }

  getWeb3() {
    return this.web3;
  }

  getNetworkId() {
    return this.networkId;
  }

  getDefaultAccount() {
    return this.defaultAccount;
  }

  isConnected() {
    return this.web3 !== null;
  }
}

module.exports = new BlockchainConfig();