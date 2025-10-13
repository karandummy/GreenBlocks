// controllers/marketplaceController.js
const Marketplace = require('../models/Marketplace');
const CreditClaim = require('../models/CreditClaim');
const Project = require('../models/Project');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { ethers } = require('ethers');
const CreditOwnership = require('../models/CreditOwnership');

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

const TOKEN_ADDRESS = "0x555ab359988f83854eB2A89B1841E4fA5A6592b2";

// List credits for sale
exports.listCredits = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { claimId, creditsToSell } = req.body;

    

    // Find the credit claim
    const claim = await CreditClaim.findById(claimId)
      .populate('project')
      .populate('developer');

    if (!claim) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit claim not found' 
      });
    }

    // if (claim.isSold) {
    //   return res.status(400).json({ error: 'This claim has already been sold and cannot be listed again' });
    // }

    // Verify ownership
    if (claim.developer._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to sell these credits' 
      });
    }

    // Verify claim is approved
    if (claim.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved credits can be listed' 
      });
    }

    // Verify credits are issued
    if (!claim.creditIssuance.creditsIssued) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credits must be issued before listing' 
      });
    }

    // Validate amount
    if (creditsToSell <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credits to sell must be greater than zero' 
      });
    }

    if (creditsToSell > claim.creditIssuance.approvedCredits) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot sell more credits than approved' 
      });
    }

    // Check if already listed
    const existingListing = await Marketplace.findOne({
      creditClaim: claimId,
      status: { $in: ['active', 'partial'] }
    });

    if (existingListing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credits already listed in marketplace' 
      });
    }

    // Verify seller has wallet address and tokens in blockchain
    const seller = await User.findById(req.user.userId);
    if (!seller.walletAddress || !ethers.isAddress(seller.walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid wallet address required to list credits' 
      });
    }

    // Check blockchain balance
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(seller.walletAddress);
    const balanceInTokens = parseFloat(ethers.formatUnits(balance, decimals));

    if (balanceInTokens < creditsToSell) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient token balance. You have ${balanceInTokens} credits but trying to sell ${creditsToSell}` 
      });
    }

    // Create marketplace listing
    const listing = new Marketplace({
      seller: req.user.userId,
      project: claim.project._id,
      creditClaim: claimId,
      creditsAvailable: creditsToSell,
      creditsListed: creditsToSell,
      pricePerCredit: 0.001
    });

    await listing.save();

    await listing.populate('seller', 'name organization email walletAddress');
    await listing.populate('project', 'name projectId type location');

    res.status(201).json({
      success: true,
      message: 'Credits listed successfully',
      listing
    });
  } catch (error) {
    console.error('List credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while listing credits',
      error: error.message 
    });
  }
};

// Get all marketplace listings
exports.getMarketplaceListings = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status === 'active' ? { $in: ['active', 'partial'] } : status;
    }

    const listings = await Marketplace.find(query)
      .populate('seller', 'name organization email walletAddress')
      .populate('project', 'name projectId type location projectDetails')
      .populate('creditClaim', 'claimId creditIssuance')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Marketplace.countDocuments(query);

    res.json({
      success: true,
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching listings' 
    });
  }
};

// Get my listings
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Marketplace.find({ seller: req.user.userId })
      .populate('project', 'name projectId type location')
      .populate('creditClaim', 'claimId creditIssuance')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching listings' 
    });
  }
};

// Buy credits
// exports.buyCredits = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Validation errors', 
//         errors: errors.array() 
//       });
//     }

//     const { listingId, creditsToBuy, transactionHash } = req.body;

//     const listing = await Marketplace.findById(listingId)
//       .populate('seller', 'walletAddress name')
//       .populate('project', 'name');

//     if (!listing) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Listing not found' 
//       });
//     }

//     if (listing.status !== 'active' && listing.status !== 'partial') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Listing is not available for purchase' 
//       });
//     }

//     if (creditsToBuy <= 0 || creditsToBuy > listing.creditsAvailable) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid credit amount' 
//       });
//     }

//     // Get buyer info
//     const buyer = await User.findById(req.user.userId);
//     if (!buyer.walletAddress || !ethers.isAddress(buyer.walletAddress)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Valid wallet address required to purchase credits' 
//       });
//     }

//     // Calculate total price in ETH
//     const totalPrice = creditsToBuy * listing.pricePerCredit;

//     // Verify the transaction hash if provided
//     if (transactionHash) {
//       const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
//       try {
//         const receipt = await provider.getTransactionReceipt(transactionHash);
//         if (!receipt) {
//           return res.status(400).json({ 
//             success: false, 
//             message: 'Transaction not found or not confirmed' 
//           });
//         }
//       } catch (error) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Invalid transaction hash' 
//         });
//       }
//     }

//     // Transfer tokens from seller to buyer
//     const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
//     const sellerSigner = new ethers.Wallet(process.env.REGULATOR_PRIVATE_KEY, provider);
//     const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, sellerSigner);
//     const decimals = await tokenContract.decimals();

//     // Transfer tokens
//     const tx = await tokenContract.transfer(
//       buyer.walletAddress,
//       ethers.parseUnits(creditsToBuy.toString(), decimals)
//     );

//     console.log(`✅ Token transfer submitted: ${tx.hash}`);
//     await tx.wait();
//     console.log(`✅ Token transfer confirmed`);



//     // Update listing
//     listing.creditsAvailable -= creditsToBuy;
//     listing.sales.push({
//       buyer: req.user.userId,
//       amount: creditsToBuy,
//       price: totalPrice,
//       transactionHash: tx.hash,
//       soldAt: new Date()
//     });

//     await listing.save();


//     res.json({
//       success: true,
//       message: 'Credits purchased successfully',
//       tokenTransferHash: tx.hash,
//       paymentHash: transactionHash,
//       creditsPurchased: creditsToBuy,
//       totalPrice: totalPrice,
//       listing
//     });
//   } catch (error) {
//     console.error('Buy credits error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error while purchasing credits',
//       error: error.message 
//     });
//   }
// };

// Buy credits
exports.buyCredits = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { listingId, creditsToBuy, transactionHash } = req.body;

    const listing = await Marketplace.findById(listingId)
      .populate('seller', 'walletAddress name')
      .populate('project', 'name')
      .populate('creditClaim', 'claimId');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.status !== 'active' && listing.status !== 'partial') {
      return res.status(400).json({ success: false, message: 'Listing is not available for purchase' });
    }

    if (creditsToBuy <= 0 || creditsToBuy > listing.creditsAvailable) {
      return res.status(400).json({ success: false, message: 'Invalid credit amount' });
    }

    const buyer = await User.findById(req.user.userId);
    if (!buyer.walletAddress || !ethers.isAddress(buyer.walletAddress)) {
      return res.status(400).json({ success: false, message: 'Valid wallet address required to purchase credits' });
    }

    const totalPrice = creditsToBuy * listing.pricePerCredit;

    // Optional blockchain verification
    if (transactionHash) {
      const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
      const receipt = await provider.getTransactionReceipt(transactionHash);
      if (!receipt) {
        return res.status(400).json({ success: false, message: 'Transaction not found or not confirmed' });
      }
    }

    // Transfer tokens (simulate or real)
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const sellerSigner = new ethers.Wallet(process.env.REGULATOR_PRIVATE_KEY, provider);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, sellerSigner);
    const decimals = await tokenContract.decimals();

    const tx = await tokenContract.transfer(
      buyer.walletAddress,
      ethers.parseUnits(creditsToBuy.toString(), decimals)
    );

    await tx.wait();

    // Update marketplace listing
    listing.creditsAvailable -= creditsToBuy;
    listing.sales.push({
      buyer: req.user.userId,
      amount: creditsToBuy,
      price: totalPrice,
      transactionHash: tx.hash,
      soldAt: new Date()
    });

    if (listing.creditsAvailable === 0) {
      listing.status = 'sold';
    } else {
      listing.status = 'partial';
    }

    await listing.save();

    // const claim = await CreditClaim.findById(listing.creditClaim._id);
    // claim.isSold = true;
    // await claim.save();

    // ✅ NEW: Update or create CreditOwnership record
    let ownership = await CreditOwnership.findOne({
      buyer: req.user.userId,
      creditClaim: listing.creditClaim._id,
      status: 'active'
    });

    if (ownership) {
      // Update existing ownership
      ownership.creditsOwned += creditsToBuy;
      ownership.totalCost += totalPrice;
      ownership.blockchain = {
        paymentTxHash: transactionHash,
        tokenTransferTxHash: tx.hash,
        blockNumber: (await provider.getTransactionReceipt(tx.hash)).blockNumber
      };
      await ownership.save();
    } else {
      // Create new ownership record
      ownership = new CreditOwnership({
        buyer: req.user.userId,
        seller: listing.seller._id,
        listing: listing._id,
        project: listing.project._id,
        creditClaim: listing.creditClaim._id,
        creditsOwned: creditsToBuy,
        purchasePrice: listing.pricePerCredit,
        totalCost: totalPrice,
        blockchain: {
          paymentTxHash: transactionHash,
          tokenTransferTxHash: tx.hash,
          blockNumber: (await provider.getTransactionReceipt(tx.hash)).blockNumber
        }
      });
      await ownership.save();
    }

    res.json({
      success: true,
      message: 'Credits purchased successfully',
      tokenTransferHash: tx.hash,
      paymentHash: transactionHash,
      creditsPurchased: creditsToBuy,
      totalPrice: totalPrice,
      listing,
      ownership
    });

  } catch (error) {
    console.error('Buy credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while purchasing credits',
      error: error.message 
    });
  }
};



// Cancel listing
exports.cancelListing = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found' 
      });
    }

    // Verify ownership
    if (listing.seller.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to cancel this listing' 
      });
    }

    if (listing.status === 'sold' || listing.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel this listing' 
      });
    }

    listing.status = 'cancelled';
    await listing.save();

    res.json({
      success: true,
      message: 'Listing cancelled successfully',
      listing
    });
  } catch (error) {
    console.error('Cancel listing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while cancelling listing' 
    });
  }
};

// Get single listing by ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id)
      .populate('seller', 'name organization email walletAddress')
      .populate('project', 'name projectId type location projectDetails')
      .populate('creditClaim', 'claimId creditIssuance');

    if (!listing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found' 
      });
    }

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching listing' 
    });
  }
};

// Update listing price (optional feature)
exports.updateListingPrice = async (req, res) => {
  try {
    const { pricePerCredit } = req.body;
    
    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found' 
      });
    }

    // Verify ownership
    if (listing.seller.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this listing' 
      });
    }

    if (listing.status !== 'active' && listing.status !== 'partial') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only update price for active listings' 
      });
    }

    listing.pricePerCredit = pricePerCredit;
    await listing.save();

    res.json({
      success: true,
      message: 'Price updated successfully',
      listing
    });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating price' 
    });
  }
};