const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    // One store per seller (enforced by unique index)
    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },
    name: {
      type:      String,
      required:  [true, 'Store name is required'],
      trim:      true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      type:    String, // local upload URL e.g. /uploads/logos/logo-<hex>.jpg
      default: null,
    },
    // Active plan: null = no plan yet
    subscriptionPlan: {
      type:    String,
      enum:    ['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'],
      default: null,
    },
    // When current subscription expires
    subscriptionExpiresAt: {
      type:    Date,
      default: null,
    },
    // Only active stores can have visible products
    isActive: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for cron job and filtering
// Note: seller index is already created by unique:true in schema definition above
storeSchema.index({ isActive: 1 });
storeSchema.index({ subscriptionExpiresAt: 1 }); // Used by cron deactivation query

module.exports = mongoose.model('Store', storeSchema);
