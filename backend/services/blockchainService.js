// const Web3 = require('web3');
// const contractABI = require('../blockchain/contracts/CarbonCredit.json');

// class BlockchainService {
//   constructor() {
//     // Initialize Web3
//     this.web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    
//     // Contract configuration
//     this.contractAddress = process.env.CARBON_CREDIT_CONTRACT_ADDRESS;
//     this.contract = new this.web3.eth.Contract(contractABI.abi, this.contractAddress);
    
//     // Default account setup
//     this.account = this.web3.eth.accounts.privateKeyToAccount(
//       process.env.BLOCKCHAIN_PRIVATE_KEY || '0x' + '0'.repeat(64)
//     );
//     this.web3.eth.accounts.wallet.add(this.account);
//   }

//   async deployContract(name, symbol) {
//     try {
//       const contract = new this.web3.eth.Contract(contractABI.abi);
      
//       const deployTx = contract.deploy({
//         data: contractABI.bytecode,
//         arguments: [name, symbol]
//       });

//       const gas = await deployTx.estimateGas({ from: this.account.address });
//       const gasPrice = await this.web3.eth.getGasPrice();

//       const deployed = await deployTx.send({
//         from: this.account.address,
//         gas: gas,
//         gasPrice: gasPrice
//       });

//       return {
//         contractAddress: deployed.options.address,
//         transactionHash: deployed.transactionHash,
//         blockNumber: deployed.blockNumber
//       };
//     } catch (error) {
//       throw new Error(`Contract deployment failed: ${error.message}`);
//     }
//   }

//   async mintTokens(to, tokenId, amount, metadata) {
//     try {
//       // Upload metadata to IPFS first
//       const ipfsService = require('./ipfsService');
//       const metadataHash = await ipfsService.uploadJSON(metadata);

//       const tx = this.contract.methods.mint(to, tokenId, amount, metadataHash.hash);
      
//       const gas = await tx.estimateGas({ from: this.account.address });
//       const gasPrice = await this.web3.eth.getGasPrice();

//       const result = await tx.send({
//         from: this.account.address,
//         gas: gas,
//         gasPrice: gasPrice
//       });

//       return {
//         transactionHash: result.transactionHash,
//         blockNumber: result.blockNumber,
//         tokenId: tokenId,
//         amount: amount,
//         metadataHash: metadataHash.hash
//       };
//     } catch (error) {
//       throw new Error(`Token minting failed: ${error.message}`);
//     }
//   }

//   async transferTokens(from, to, tokenId, amount) {
//     try {
//       const tx = this.contract.methods.safeTransferFrom(from, to, tokenId, amount, '0x');
      
//       const gas = await tx.estimateGas({ from: this.account.address });
//       const gasPrice = await this.web3.eth.getGasPrice();

//       const result = await tx.send({
//         from: this.account.address,
//         gas: gas,
//         gasPrice: gasPrice
//       });

//       return {
//         transactionHash: result.transactionHash,
//         blockNumber: result.blockNumber,
//         from: from,
//         to: to,
//         tokenId: tokenId,
//         amount: amount
//       };
//     } catch (error) {
//       throw new Error(`Token transfer failed: ${error.message}`);
//     }
//   }

//   async burnTokens(from, tokenId, amount) {
//     try {
//       const tx = this.contract.methods.burn(from, tokenId, amount);
      
//       const gas = await tx.estimateGas({ from: this.account.address });
//       const gasPrice = await this.web3.eth.getGasPrice();

//       const result = await tx.send({
//         from: this.account.address,
//         gas: gas,
//         gasPrice: gasPrice
//       });

//       return {
//         transactionHash: result.transactionHash,
//         blockNumber: result.blockNumber,
//         burnedFrom: from,
//         tokenId: tokenId,
//         amount: amount
//       };
//     } catch (error) {
//       throw new Error(`Token burning failed: ${error.message}`);
//     }
//   }

//   async getTokenBalance(account, tokenId) {
//     try {
//       const balance = await this.contract.methods.balanceOf(account, tokenId).call();
//       return parseInt(balance);
//     } catch (error) {
//       throw new Error(`Balance check failed: ${error.message}`);
//     }
//   }

//   async getTokenMetadata(tokenId) {
//     try {
//       const uri = await this.contract.methods.uri(tokenId).call();
      
//       // Fetch metadata from IPFS
//       const ipfsService = require('./ipfsService');
//       const metadataBuffer = await ipfsService.getFile(uri);
//       return JSON.parse(metadataBuffer.toString());
//     } catch (error) {
//       throw new Error(`Metadata retrieval failed: ${error.message}`);
//     }
//   }

//   async getTransactionReceipt(txHash) {
//     try {
//       return await this.web3.eth.getTransactionReceipt(txHash);
//     } catch (error) {
//       throw new Error(`Transaction receipt fetch failed: ${error.message}`);
//     }
//   }

//   async getBlockInfo(blockNumber) {
//     try {
//       return await this.web3.eth.getBlock(blockNumber);
//     } catch (error) {
//       throw new Error(`Block info fetch failed: ${error.message}`);
//     }
//   }
// }

// module.exports = new BlockchainService();





const Web3 = require('web3');
// Temporarily comment out contract import to fix the error
// const contractABI = require('../blockchain/contracts/CarbonCredit.json');

class BlockchainService {
  constructor() {
    // Initialize Web3
    this.web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    
    // Contract configuration - will be set when contract is deployed
    this.contractAddress = process.env.CARBON_CREDIT_CONTRACT_ADDRESS;
    this.contract = null; // Will initialize when ABI is available
    
    // Default account setup
    if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
      this.account = this.web3.eth.accounts.privateKeyToAccount(
        process.env.BLOCKCHAIN_PRIVATE_KEY
      );
      this.web3.eth.accounts.wallet.add(this.account);
    }
  }

  // Mock implementations for development
  async deployContract(name, symbol) {
    console.log('Mock: Contract deployment called');
    return {
      contractAddress: '0x742d35Cc6634C0532925a3b8D46644C7d3EF8E7b',
      transactionHash: '0x1234567890abcdef',
      blockNumber: 12345
    };
  }

  async mintTokens(to, tokenId, amount, metadata) {
    console.log('Mock: Token minting called', { to, tokenId, amount });
    return {
      transactionHash: '0x1234567890abcdef',
      blockNumber: 12345,
      tokenId: tokenId,
      amount: amount,
      metadataHash: 'QmMockHashForTesting'
    };
  }

  async transferTokens(from, to, tokenId, amount) {
    console.log('Mock: Token transfer called', { from, to, tokenId, amount });
    return {
      transactionHash: '0x1234567890abcdef',
      blockNumber: 12345,
      from: from,
      to: to,
      tokenId: tokenId,
      amount: amount
    };
  }

  async burnTokens(from, tokenId, amount) {
    console.log('Mock: Token burning called', { from, tokenId, amount });
    return {
      transactionHash: '0x1234567890abcdef',
      blockNumber: 12345,
      burnedFrom: from,
      tokenId: tokenId,
      amount: amount
    };
  }

  async getTokenBalance(account, tokenId) {
    console.log('Mock: Getting token balance', { account, tokenId });
    return 1000; // Mock balance
  }

  async getTokenMetadata(tokenId) {
    console.log('Mock: Getting token metadata', { tokenId });
    return {
      name: 'Mock Carbon Credit',
      description: 'Mock carbon credit for testing',
      image: 'mock-image-url'
    };
  }

  async getTransactionReceipt(txHash) {
    console.log('Mock: Getting transaction receipt', { txHash });
    return {
      status: true,
      blockNumber: 12345,
      gasUsed: 21000
    };
  }

  async getBlockInfo(blockNumber) {
    console.log('Mock: Getting block info', { blockNumber });
    return {
      number: blockNumber,
      timestamp: Date.now(),
      transactions: []
    };
  }
}

module.exports = new BlockchainService();

