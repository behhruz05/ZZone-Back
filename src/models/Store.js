const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
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
      type:    String,
      default: null,
    },
    // Social/contact links
    contacts: {
      phone:     { type: String, trim: true, default: null }, // e.g. +998901234567
      telegram:  { type: String, trim: true, default: null }, // username without @
      instagram: { type: String, trim: true, default: null }, // username without @
      whatsapp:  { type: String, trim: true, default: null }, // phone number
    },
    subscriptionPlan: {
      type:    String,
      enum:    ['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'],
      default: null,
    },
    subscriptionExpiresAt: {
      type:    Date,
      default: null,
    },
    isActive: {
      type:    Boolean,
      default: false,
    },
    location: {
      lat:     { type: Number, default: null },
      lng:     { type: Number, default: null },
      address: { type: String, trim: true, default: null },
    },
  },
  { timestamps: true }
);

storeSchema.index({ isActive: 1 });
storeSchema.index({ subscriptionExpiresAt: 1 });

module.exports = mongoose.model('Store', storeSchema);
