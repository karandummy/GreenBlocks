const mongoose = require('mongoose');

const carbonCreditSchema = new mongoose.Schema({
  creditId: {
    type: String,
    unique: true,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  vintage: {
    type: Number,
    required: true
  },
  issuer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['issued', 'listed', 'sold', 'retired'],
    default: 'issued'
  },
  price: {
    amount: Number,
    currency: { type: String, default: 'USD' }
  },
  marketplace: {
    isListed: { type: Boolean, default: false },
    listedAt: Date,
    reservePrice: Number
  },
  verification: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    certificate: {
      hash: String,
      ipfsHash: String
    }
  },
  blockchain: {
    tokenId: String,
    contractAddress: String,
    transactionHash: String,
    blockNumber: Number
  },
  transfers: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    price: Number,
    transactionHash: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Generate unique credit ID
carbonCreditSchema.pre('save', async function(next) {
  if (!this.creditId) {
    const count = await mongoose.model('CarbonCredit').countDocuments();
    this.creditId = `CC-${this.vintage}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);