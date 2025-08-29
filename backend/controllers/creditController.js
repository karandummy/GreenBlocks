const CarbonCredit = require('../models/CarbonCredit');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const blockchainService = require('../services/blockchainService');

exports.getAllCredits = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vintage, type } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (vintage) query.vintage = vintage;
    if (type) {
      const projects = await Project.find({ type }).select('_id');
      query.project = { $in: projects.map(p => p._id) };
    }

    const credits = await CarbonCredit.find(query)
      .populate('project', 'name type location')
      .populate('currentOwner', 'name organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CarbonCredit.countDocuments(query);

    res.json({
      success: true,
      credits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching credits' 
    });
  }
};

exports.getMarketplaceCredits = async (req, res) => {
  try {
    const credits = await CarbonCredit.find({ 
      'marketplace.isListed': true,
      status: 'issued'
    })
    .populate('project', 'name type location developer')
    .populate('currentOwner', 'name organization')
    .sort({ 'marketplace.listedAt': -1 });

    res.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('Get marketplace credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching marketplace credits' 
    });
  }
};

exports.getMyCredits = async (req, res) => {
  try {
    const credits = await CarbonCredit.find({ currentOwner: req.user.userId })
      .populate('project', 'name type location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('Get my credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching credits' 
    });
  }
};

exports.getCreditById = async (req, res) => {
  try {
    const credit = await CarbonCredit.findById(req.params.id)
      .populate('project')
      .populate('currentOwner', 'name organization')
      .populate('issuer', 'name organization')
      .populate('transfers.from', 'name organization')
      .populate('transfers.to', 'name organization');

    if (!credit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit not found' 
      });
    }

    res.json({
      success: true,
      credit
    });
  } catch (error) {
    console.error('Get credit error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching credit' 
    });
  }
};

exports.claimCredits = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { projectId, amount, vintage } = req.body;

    // Verify project exists and belongs to user
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    if (project.developer.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to claim credits for this project' 
      });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project must be approved before claiming credits' 
      });
    }

    const credit = new CarbonCredit({
      project: projectId,
      amount,
      vintage,
      issuer: req.user.userId,
      currentOwner: req.user.userId
    });

    await credit.save();

    res.status(201).json({
      success: true,
      message: 'Credits claimed successfully',
      credit
    });
  } catch (error) {
    console.error('Claim credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while claiming credits' 
    });
  }
};

exports.purchaseCredits = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { creditId, amount } = req.body;

    const credit = await CarbonCredit.findById(creditId);
    if (!credit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit not found' 
      });
    }

    if (!credit.marketplace.isListed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credit is not listed for sale' 
      });
    }

    if (credit.amount < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient credits available' 
      });
    }

    // Create transfer record
    const transfer = {
      from: credit.currentOwner,
      to: req.user.userId,
      amount,
      price: credit.price.amount,
      timestamp: new Date()
    };

    credit.transfers.push(transfer);

    // Update credit ownership
    if (credit.amount === amount) {
      // Transfer entire credit
      credit.currentOwner = req.user.userId;
      credit.marketplace.isListed = false;
      credit.status = 'sold';
    } else {
      // Partial transfer - create new credit for buyer
      const newCredit = new CarbonCredit({
        project: credit.project,
        amount,
        vintage: credit.vintage,
        issuer: credit.issuer,
        currentOwner: req.user.userId,
        status: 'sold',
        transfers: [transfer]
      });
      await newCredit.save();

      // Update original credit
      credit.amount -= amount;
    }

    await credit.save();

    res.json({
      success: true,
      message: 'Credits purchased successfully'
    });
  } catch (error) {
    console.error('Purchase credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while purchasing credits' 
    });
  }
};

exports.retireCredits = async (req, res) => {
  try {
    const { creditId, amount, reason } = req.body;

    const credit = await CarbonCredit.findById(creditId);
    if (!credit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit not found' 
      });
    }

    if (credit.currentOwner.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to retire these credits' 
      });
    }

    if (credit.amount < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient credits to retire' 
      });
    }

    // Update credit status
    if (credit.amount === amount) {
      credit.status = 'retired';
      credit.amount = 0;
    } else {
      credit.amount -= amount;
    }

    await credit.save();

    res.json({
      success: true,
      message: 'Credits retired successfully'
    });
  } catch (error) {
    console.error('Retire credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while retiring credits' 
    });
  }
};

exports.verifyCredits = async (req, res) => {
  try {
    const credit = await CarbonCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit not found' 
      });
    }

    credit.verification = {
      verifiedBy: req.user.userId,
      verificationDate: new Date()
    };

    await credit.save();

    res.json({
      success: true,
      message: 'Credits verified successfully',
      credit
    });
  } catch (error) {
    console.error('Verify credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while verifying credits' 
    });
  }
};

exports.approveCredits = async (req, res) => {
  try {
    const credit = await CarbonCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit not found' 
      });
    }

    credit.status = 'issued';
    credit.verification.verifiedBy = req.user.userId;
    credit.verification.verificationDate = new Date();

    await credit.save();

    res.json({
      success: true,
      message: 'Credits approved successfully',
      credit
    });
  } catch (error) {
    console.error('Approve credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while approving credits' 
    });
  }
};

exports.rejectCredits = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const credit = await CarbonCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit not found' 
      });
    }

    credit.status = 'rejected';
    credit.verification.verifiedBy = req.user.userId;
    credit.verification.verificationDate = new Date();
    credit.verification.comments = reason;

    await credit.save();

    res.json({
      success: true,
      message: 'Credits rejected successfully',
      credit
    });
  } catch (error) {
    console.error('Reject credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting credits' 
    });
  }
};