// controllers/creditClaimController.js
const CreditClaim = require('../models/CreditClaim');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const { ethers } = require("ethers");

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Create a new credit claim
exports.createClaim = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { projectId, creditsRequested, reportingPeriod, mrvDataRefs } = req.body;

    // Verify project exists and is approved
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved projects can claim credits' 
      });
    }

    // Check if user owns the project
    if (project.developer.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to claim credits for this project' 
      });
    }

    // Verify project has MRV data
    if (!project.mrvData || project.mrvData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project must have MRV data before claiming credits' 
      });
    }

    // Check for existing pending claims
    const existingClaim = await CreditClaim.findOne({
      project: projectId,
      status: { $in: ['pending', 'under_review', 'inspection_scheduled', 'inspection_completed'] }
    });

    if (existingClaim) {
      return res.status(400).json({ 
        success: false, 
        message: 'A claim is already pending for this project' 
      });
    }

    // Validate credits requested
    if (creditsRequested <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credits requested must be greater than zero' 
      });
    }

    if (creditsRequested > project.projectDetails.expectedCredits) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credits requested cannot exceed expected credits' 
      });
    }

    // Create the claim
    const claim = new CreditClaim({
      project: projectId,
      developer: req.user.userId,
      claimDetails: {
        creditsRequested,
        reportingPeriod,
        mrvDataRefs: mrvDataRefs || []
      }
    });

    await claim.save();

    // Populate the claim with project and developer details
    await claim.populate('project', 'name projectId type');
    await claim.populate('developer', 'name organization email');

    res.status(201).json({
      success: true,
      message: 'Credit claim submitted successfully',
      claim
    });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating claim' 
    });
  }
};

// Get all claims (for regulatory body)
exports.getAllClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const claims = await CreditClaim.find(query)
      .populate('project', 'name projectId type location')
      .populate('developer', 'name organization email')
      .populate('inspection.inspector', 'name organization')
      .populate('review.reviewedBy', 'name organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CreditClaim.countDocuments(query);

    res.json({
      success: true,
      claims,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching claims' 
    });
  }
};

// Get developer's claims
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await CreditClaim.find({ developer: req.user.userId })
      .populate('project', 'name projectId type location')
      .populate('inspection.inspector', 'name organization')
      .populate('review.reviewedBy', 'name organization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      claims
    });
  } catch (error) {
    console.error('Get my claims error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching claims' 
    });
  }
};

// Get single claim details
exports.getClaimById = async (req, res) => {
  try {
    const claim = await CreditClaim.findById(req.params.id)
      .populate('project')
      .populate('developer', 'name organization email')
      .populate('inspection.inspector', 'name organization')
      .populate('review.reviewedBy', 'name organization');

    if (!claim) {
      return res.status(404).json({ 
        success: false, 
        message: 'Claim not found' 
      });
    }

    // Check authorization - only claim owner or regulatory body can view
    const isOwner = claim.developer._id.toString() === req.user.userId.toString();
    const isRegulatory = req.user.role === 'regulatory_body';

    if (!isOwner && !isRegulatory) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this claim' 
      });
    }

    res.json({
      success: true,
      claim
    });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching claim' 
    });
  }
};

// Schedule inspection (Regulatory body)
exports.scheduleInspection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { inspectionDate } = req.body;

    const claim = await CreditClaim.findById(req.params.id)
      .populate('project', 'name projectId')
      .populate('developer', 'name email');

    if (!claim) {
      return res.status(404).json({ 
        success: false, 
        message: 'Claim not found' 
      });
    }

    if (claim.status !== 'pending' && claim.status !== 'under_review') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot schedule inspection for claim in current status' 
      });
    }

    // Validate inspection date is in the future
    const inspectionDateTime = new Date(inspectionDate);
    if (inspectionDateTime < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Inspection date must be in the future' 
      });
    }

    claim.status = 'inspection_scheduled';
    claim.inspection.scheduledDate = inspectionDate;
    claim.inspection.inspector = req.user.userId;

    await claim.save();

    res.json({
      success: true,
      message: 'Inspection scheduled successfully',
      claim
    });
  } catch (error) {
    console.error('Schedule inspection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while scheduling inspection' 
    });
  }
};

// Mark inspection as completed
exports.completeInspection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { findings, inspectionResult } = req.body;

    const claim = await CreditClaim.findById(req.params.id)
      .populate('project', 'name projectId')
      .populate('developer', 'name email');

    if (!claim) {
      return res.status(404).json({ 
        success: false, 
        message: 'Claim not found' 
      });
    }

    if (claim.status !== 'inspection_scheduled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Inspection not scheduled for this claim' 
      });
    }

    // Verify the inspector is completing their own inspection
    if (claim.inspection.inspector.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the assigned inspector can complete this inspection' 
      });
    }

    claim.status = 'inspection_completed';
    claim.inspection.completedDate = new Date();
    claim.inspection.findings = findings;
    claim.inspection.inspectionResult = inspectionResult;

    await claim.save();

    res.json({
      success: true,
      message: 'Inspection completed successfully',
      claim
    });
  } catch (error) {
    console.error('Complete inspection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while completing inspection' 
    });
  }
};

// Issue credits (Regulatory body - final approval)
// exports.issueCredits = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Validation errors', 
//         errors: errors.array() 
//       });
//     }

//     const { approvedCredits, comments  } = req.body;

//     // console.log(project_id);

//     const claim = await CreditClaim.findById(req.params.id)
//       .populate('project')
//       .populate('developer', 'name email organization');
    
//     if (!claim) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Claim not found' 
//       });
//     }

//     if (claim.status !== 'inspection_completed') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Inspection must be completed before issuing credits' 
//       });
//     }

//     if (claim.inspection.inspectionResult !== 'passed' && claim.inspection.inspectionResult !== 'partial') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Cannot issue credits for failed inspection' 
//       });
//     }

//     // Validate approved credits
//     if (approvedCredits <= 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Approved credits must be greater than zero' 
//       });
//     }

//     if (approvedCredits > claim.claimDetails.creditsRequested) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Approved credits cannot exceed requested credits' 
//       });
//     }

//     claim.status = 'approved';
//     claim.creditIssuance.approvedCredits = approvedCredits;
//     claim.creditIssuance.issuedAt = new Date();
//     claim.creditIssuance.creditsIssued = true;
//     claim.review.reviewedAt = new Date();
//     claim.review.reviewedBy = req.user.userId;
//     claim.review.comments = comments || 'Credits issued successfully';

//     await claim.save();

//     const project = await Project.findById(claim.project._id);
//     if (project) {
//       project.status = 'completed';
//       await project.save();
//     }

//     // const project = await Project.findById(project_id);
//     // project.status='completed';
//     // await project.save();


//     res.json({
//       success: true,
//       message: 'Credits issued successfully',
//       claim
//     });
//   } catch (error) {
//     console.error('Issue credits error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error while issuing credits' 
//     });
//   }
// };



// Issue credits (Regulatory body - final approval)
exports.issueCredits = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { approvedCredits, comments } = req.body;

    const claim = await CreditClaim.findById(req.params.id)
      .populate('project')
      .populate('developer', 'name email organization walletAddress');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.status !== 'inspection_completed') {
      return res.status(400).json({ success: false, message: 'Inspection must be completed before issuing credits' });
    }

    if (claim.inspection.inspectionResult !== 'passed' && claim.inspection.inspectionResult !== 'partial') {
      return res.status(400).json({ success: false, message: 'Cannot issue credits for failed inspection' });
    }

    if (approvedCredits <= 0) {
      return res.status(400).json({ success: false, message: 'Approved credits must be greater than zero' });
    }

    if (approvedCredits > claim.claimDetails.creditsRequested) {
      return res.status(400).json({ success: false, message: 'Approved credits cannot exceed requested credits' });
    }

  // ✅ --- BLOCKCHAIN TRANSFER SECTION ---
const developerWallet = claim.developer.walletAddress;
if (!developerWallet || !ethers.isAddress(developerWallet)) {
  return res.status(400).json({ success: false, message: 'Invalid or missing developer wallet address' });
}

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.REGULATOR_PRIVATE_KEY, provider);

const tokenAddress = "0x555ab359988f83854eB2A89B1841E4fA5A6592b2"; // your ERC20 token
const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

const decimals = await tokenContract.decimals();
const tx = await tokenContract.transfer(
  developerWallet,
  ethers.parseUnits(approvedCredits.toString(), decimals)
);

console.log(`✅ Token transfer submitted: ${tx.hash}`);
await tx.wait();
console.log(`✅ Token transfer confirmed`);


    // ✅ --- UPDATE CLAIM & PROJECT ---
    claim.status = 'approved';
    claim.creditIssuance.approvedCredits = approvedCredits;
    claim.creditIssuance.issuedAt = new Date();
    claim.creditIssuance.creditsIssued = true;
    claim.creditIssuance.txHash = tx.hash; // store tx hash
    claim.review.reviewedAt = new Date();
    claim.review.reviewedBy = req.user.userId;
    claim.review.comments = comments || 'Credits issued and tokens transferred successfully';

    await claim.save();

    const project = await Project.findById(claim.project._id);
    if (project) {
      project.status = 'completed';
      await project.save();
    }

    res.json({
      success: true,
      message: 'Credits issued and tokens transferred successfully',
      txHash: tx.hash,
      claim
    });

  } catch (error) {
    console.error('Issue credits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while issuing credits', 
      error: error.message 
    });
  }
};



// Reject claim
exports.rejectClaim = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { reason } = req.body;

    const claim = await CreditClaim.findById(req.params.id)
      .populate('project', 'name projectId')
      .populate('developer', 'name email');

    if (!claim) {
      return res.status(404).json({ 
        success: false, 
        message: 'Claim not found' 
      });
    }

    // Can only reject claims that are not already approved
    if (claim.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reject an already approved claim' 
      });
    }

    claim.status = 'rejected';
    claim.review.reviewedAt = new Date();
    claim.review.reviewedBy = req.user.userId;
    claim.review.comments = reason;

    await claim.save();

    res.json({
      success: true,
      message: 'Claim rejected successfully',
      claim
    });
  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting claim' 
    });
  }
};