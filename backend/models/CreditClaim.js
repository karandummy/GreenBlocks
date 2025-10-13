// models/CreditClaim.js
const mongoose = require('mongoose');

const creditClaimSchema = new mongoose.Schema({
  claimId: {
    type: String,
    unique: true,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimDetails: {
    mrvDataRefs: [String], // Array of IPFS hashes or MRV data IDs
    creditsRequested: {
      type: Number,
      required: true
    },
    reportingPeriod: {
      startDate: Date,
      endDate: Date
    },
    supportingDocuments: [{
      fileName: String,
      fileHash: String,
      uploadDate: { type: Date, default: Date.now }
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'inspection_scheduled', 'inspection_completed', 'approved', 'rejected'],
    default: 'pending'
  },
  inspection: {
    scheduledDate: Date,
    completedDate: Date,
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    findings: String,
    report: String,
    inspectionResult: {
      type: String,
      enum: ['passed', 'failed', 'partial','not started'],
      default: 'not started'
    }
  },
  review: {
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String
  },
  isSold:{
    type:Boolean,
    default:false
  },
  creditIssuance: {
  approvedCredits: { type: Number },
  issuedAt: { type: Date },
  transactionHash: { type: String },
  creditsIssued: { type: Boolean, default: false }
}

}, {
  timestamps: true
});

// Generate unique claim ID
creditClaimSchema.pre('validate', async function (next) {
  if (!this.claimId) {
    const count = await mongoose.model('CreditClaim').countDocuments();
    this.claimId = `CLM-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CreditClaim', creditClaimSchema);