const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false, // Never returned in queries by default
    },
    role: {
      type:    String,
      enum:    ['ADMIN', 'SELLER', 'CLIENT'],
      default: 'CLIENT',
    },
    // Used for purchasing subscription plans
    balance: {
      type:    Number,
      default: 0,
      min:     [0, 'Balance cannot be negative'],
    },
    // Free trial can only be used once per seller
    trialUsed: {
      type:    Boolean,
      default: false,
    },
    isBlocked: {
      type:    Boolean,
      default: false,
    },
    refreshToken: {
      type:    String,
      default: null,
      select:  false,
    },
  },
  { timestamps: true }
);

// Hash password before save (only when modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare plain password with hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Note: email index is already created by unique:true in schema definition above

module.exports = mongoose.model('User', userSchema);
