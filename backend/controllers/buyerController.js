// controllers/buyerController.js
const CreditOwnership = require('../models/CreditOwnership');
const Marketplace = require('../models/Marketplace');
const User = require('../models/User');
const { ethers } = require('ethers');

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)"
];

const TOKEN_ADDRESS = "0x555ab359988f83854eB2A89B1841E4fA5A6592b2";

// Get buyer statistics
exports.getBuyerStats = async (req, res) => {
  try {
    const buyerId = req.user.userId;

    // Get all purchases
    const purchases = await CreditOwnership.find({ 
      buyer: buyerId,
      status: 'active'
    });

    // Calculate statistics
    const totalPurchased = purchases.reduce((sum, p) => sum + p.creditsOwned, 0);
    const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);

    // Get current blockchain balance
    const buyer = await User.findById(buyerId);
    let currentBalance = 0;

    if (buyer.walletAddress && ethers.isAddress(buyer.walletAddress)) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(buyer.walletAddress);
        currentBalance = parseFloat(ethers.formatUnits(balance, decimals));
      } catch (error) {
        console.error('Error fetching blockchain balance:', error);
      }
    }

    // Calculate offset (assuming 1 credit = 1 ton CO2)
    const offsetEmissions = currentBalance;

    res.json({
      success: true,
      stats: {
        totalPurchased,
        currentBalance,
        offsetEmissions,
        totalSpent: parseFloat(totalSpent.toFixed(4))
      }
    });
  } catch (error) {
    console.error('Get buyer stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching statistics' 
    });
  }
};

// Get buyer's credit holdings
exports.getMyHoldings = async (req, res) => {
  try {
    const holdings = await CreditOwnership.find({ 
      buyer: req.user.userId,
      status: 'active'
    })
      .populate('project', 'name type location projectId')
      .populate('seller', 'name organization')
      .populate('listing', 'listingId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      holdings
    });
  } catch (error) {
    console.error('Get holdings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching holdings' 
    });
  }
};

// Get buyer's transaction history
exports.getMyTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await CreditOwnership.find({ 
      buyer: req.user.userId 
    })
      .populate('project', 'name type location')
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CreditOwnership.countDocuments({ 
      buyer: req.user.userId 
    });

    // Format transactions for display
    const formattedTransactions = transactions.map(tx => ({
      _id: tx._id,
      type: 'purchase',
      amount: tx.creditsOwned,
      price: tx.totalCost,
      project: tx.project?.name || 'Unknown Project',
      seller: tx.seller?.name || 'Unknown Seller',
      date: tx.createdAt.toISOString().split('T')[0],
      txHash: tx.blockchain?.tokenTransferTxHash,
      paymentHash: tx.blockchain?.paymentTxHash
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
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

// Get wallet balance from blockchain
exports.getWalletBalance = async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid wallet address required' 
      });
    }

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
    
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(walletAddress);
    const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));

    res.json({
      success: true,
      balance: formattedBalance,
      walletAddress
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wallet balance',
      error: error.message 
    });
  }
};

// Get holdings by project (grouped)
exports.getHoldingsByProject = async (req, res) => {
  try {
    const holdings = await CreditOwnership.aggregate([
      { 
        $match: { 
          buyer: req.user.userId,
          status: 'active'
        } 
      },
      {
        $group: {
          _id: '$project',
          totalCredits: { $sum: '$creditsOwned' },
          totalSpent: { $sum: '$totalCost' },
          purchases: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'projectDetails'
        }
      },
      {
        $unwind: '$projectDetails'
      },
      {
        $sort: { totalCredits: -1 }
      }
    ]);

    res.json({
      success: true,
      holdings
    });
  } catch (error) {
    console.error('Get holdings by project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching grouped holdings' 
    });
  }
};