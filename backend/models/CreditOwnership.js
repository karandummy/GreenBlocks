// models/CreditOwnership.js
const mongoose = require('mongoose');

const creditOwnershipSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marketplace',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  creditClaim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditClaim',
    required: true
  },
  creditsOwned: {
    type: Number,
    required: true,
    min: 0
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockchain: {
    paymentTxHash: String,      // ETH payment transaction
    tokenTransferTxHash: String,  // Carbon credit token transfer
    blockNumber: Number
  },
  status: {
    type: String,
    enum: ['active', 'transferred'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
creditOwnershipSchema.index({ buyer: 1, status: 1 });
creditOwnershipSchema.index({ buyer: 1, project: 1 });

module.exports = mongoose.model('CreditOwnership', creditOwnershipSchema);