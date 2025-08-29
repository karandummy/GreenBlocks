const mongoose = require('mongoose');

const mrvDataSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reportingPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  measurements: [{
    parameter: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    measurementDate: { type: Date, required: true },
    methodology: String,
    equipment: String,
    accuracy: String
  }],
  emissionReductions: {
    baseline: { type: Number, required: true },
    actual: { type: Number, required: true },
    reduction: { type: Number, required: true },
    methodology: { type: String, required: true }
  },
  verification: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationReport: String,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    comments: String
  },
  documentation: [{
    fileName: String,
    fileHash: String,
    fileType: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    ipfsHash: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MRVData', mrvDataSchema);