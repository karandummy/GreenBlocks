const blockchainService = require('../services/blockchainService');
const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, address, type } = req.query;
    
    let query = {};
    if (address) query.$or = [{ from: address }, { to: address }];
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('initiatedBy', 'name organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching transactions' 
    });
  }
};

exports.getTransactionByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    
    const transaction = await Transaction.findOne({ transactionHash: hash })
      .populate('initiatedBy', 'name organization');

    if (!transaction) {
      // Try to get from blockchain
      try {
        const receipt = await blockchainService.getTransactionReceipt(hash);
        return res.json({
          success: true,
          transaction: {
            hash: hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            status: receipt.status ? 'success' : 'failed'
          }
        });
      } catch (blockchainError) {
        return res.status(404).json({ 
          success: false, 
          message: 'Transaction not found' 
        });
      }
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching transaction' 
    });
  }
};

exports.getBlockInfo = async (req, res) => {
  try {
    const { blockNumber } = req.params;
    
    const blockInfo = await blockchainService.getBlockInfo(parseInt(blockNumber));
    
    res.json({
      success: true,
      block: blockInfo
    });
  } catch (error) {
    console.error('Get block info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching block info' 
    });
  }
};

exports.getCarbonCreditContract = async (req, res) => {
  try {
    res.json({
      success: true,
      contract: {
        address: process.env.CARBON_CREDIT_CONTRACT_ADDRESS,
        network: process.env.BLOCKCHAIN_RPC_URL,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Get contract info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching contract info' 
    });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const { address } = req.params;
    
    const balance = await blockchainService.getTokenBalance(address, 1);
    
    res.json({
      success: true,
      balance: balance.toString()
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching wallet balance' 
    });
  }
};

exports.deployContract = async (req, res) => {
  try {
    const { name, symbol } = req.body;
    
    const result = await blockchainService.deployContract(name || 'CarbonCredit', symbol || 'CC');
    
    res.json({
      success: true,
      message: 'Contract deployed successfully',
      contract: result
    });
  } catch (error) {
    console.error('Deploy contract error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deploying contract' 
    });
  }
};

exports.mintTokens = async (req, res) => {
  try {
    const { to, tokenId, amount, metadata } = req.body;
    
    const result = await blockchainService.mintTokens(to, tokenId, amount, metadata);
    
    // Save transaction record
    const transaction = new Transaction({
      type: 'mint',
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      from: null,
      to: to,
      tokenId: tokenId,
      amount: amount,
      initiatedBy: req.user.userId
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Tokens minted successfully',
      result
    });
  } catch (error) {
    console.error('Mint tokens error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while minting tokens' 
    });
  }
};

exports.transferTokens = async (req, res) => {
  try {
    const { from, to, tokenId, amount } = req.body;
    
    const result = await blockchainService.transferTokens(from, to, tokenId, amount);
    
    // Save transaction record
    const transaction = new Transaction({
      type: 'transfer',
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      from: from,
      to: to,
      tokenId: tokenId,
      amount: amount,
      initiatedBy: req.user.userId
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Tokens transferred successfully',
      result
    });
  } catch (error) {
    console.error('Transfer tokens error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while transferring tokens' 
    });
  }
};

exports.burnTokens = async (req, res) => {
  try {
    const { from, tokenId, amount, reason } = req.body;
    
    const result = await blockchainService.burnTokens(from, tokenId, amount);
    
    // Save transaction record
    const transaction = new Transaction({
      type: 'burn',
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      from: from,
      to: null,
      tokenId: tokenId,
      amount: amount,
      metadata: { reason: reason },
      initiatedBy: req.user.userId
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Tokens burned successfully',
      result
    });
  } catch (error) {
    console.error('Burn tokens error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while burning tokens' 
    });
  }
};