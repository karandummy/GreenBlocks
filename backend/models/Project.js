const mongoose = require('mongoose');

const mrvSchema = new mongoose.Schema({
  reportName: String,
  description: String,
  ipfsHash: String,          // Metadata JSON CID
  files: [String],           // Array of file CIDs
  uploadedBy: String,        // Wallet address
  uploadedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['renewable_energy', 'afforestation', 'energy_efficiency', 'waste_management', 'transportation', 'industrial']
  },
  location: {
    country: { type: String, required: true },
    state: { type: String, required: true },
    address: {type:String , required: true},
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  projectDetails: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    expectedCredits: { type: Number, required: true },
    methodology: { type: String, required: true },
    baseline: { type: String, required: true }
  },
  documentation: [{
    fileName: String,
    fileHash: String,
    uploadDate: { type: Date, default: Date.now },
    fileType: String
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'completed'],
    default: 'draft'
  },
  verification: {
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    inspectionDate: Date,
    inspectionReport: String
  },
  blockchain: {
    contractAddress: String,
    transactionHash: String,
    blockNumber: Number
  },
  mrvData: [mrvSchema]
}, {
  timestamps: true
});

// Generate unique project ID
// projectSchema.pre('save', async function(next) {
//   if (!this.projectId) {
//     const count = await mongoose.model('Project').countDocuments();
//     this.projectId = `PRJ-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
//   }
//   next();
// });
projectSchema.pre('validate', async function (next) {
  if (!this.projectId) {
    const count = await mongoose.model('Project').countDocuments();
    this.projectId = `PRJ-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);