const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['project_developer', 'credit_buyer', 'regulatory_body']
  },
  organization: {
    type: String,
    required: true
  },
  walletAddress: {
    type: String,
    default: null
  },
  profile: {
    avatar: String,
    bio: String,
    contact: {
      phone: String,
      address: String,
      website: String
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output

// userSchema.methods.toJSON = function() {
//   const userObject = this.toObject();
//   delete userObject.password;
//   delete userObject.verification.verificationToken;
//   return userObject;
// };
userSchema.methods.toJSON = function() {
  const userObject = this.toObject ? this.toObject() : this;

  if (!userObject) return {};

  // Always strip sensitive fields safely
  if ("password" in userObject) {
    delete userObject.password;
  }

  if (userObject.verification && "verificationToken" in userObject.verification) {
    delete userObject.verification.verificationToken;
  }

  return userObject;
};


module.exports = mongoose.model('User', userSchema);