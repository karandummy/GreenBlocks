const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['mint', 'transfer', 'burn', 'approve', 'marketplace']
  },
  from: {
    type: String,
    default: null
  },
  to: {
    type: String,
    default: null
  },
  tokenId: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  gasUsed: {
    type: Number,
    default: 0
  },
  gasPrice: {
    type: String,
    default: '0'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  relatedCredit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CarbonCredit'
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ transactionHash: 1 });
transactionSchema.index({ from: 1, to: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);