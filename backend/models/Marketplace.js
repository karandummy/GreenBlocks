// models/Marketplace.js
const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
  listingId: {
    type: String,
    unique: true,
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  creditsAvailable: {
    type: Number,
    required: true,
    min: 0
  },
  creditsListed: {
    type: Number,
    required: true
  },
  pricePerCredit: {
    type: Number,
    default: 0.001, // 0.001 Sepolia ETH per credit
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled', 'partial'],
    default: 'active'
  },
  blockchain: {
    transactionHash: String,
    blockNumber: Number
  },
  sales: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    price: Number,
    transactionHash: String,
    soldAt: Date
  }]
}, {
  timestamps: true
});

// Generate unique listing ID
marketplaceSchema.pre('validate', async function (next) {
  if (!this.listingId) {
    const count = await mongoose.model('Marketplace').countDocuments();
    this.listingId = `MKT-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Update status based on available credits
marketplaceSchema.pre('save', function(next) {
  if (this.creditsAvailable === 0) {
    this.status = 'sold';
  } else if (this.creditsAvailable < this.creditsListed) {
    this.status = 'partial';
  }
  next();
});

module.exports = mongoose.model('Marketplace', marketplaceSchema);