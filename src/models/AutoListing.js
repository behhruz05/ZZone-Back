const mongoose = require('mongoose');

const autoListingSchema = new mongoose.Schema(
  {
    olxId: {
      type:     Number,
      unique:   true,
      required: true,
      index:    true,
    },
    title:       { type: String, default: '' },
    url:         { type: String, default: '' },
    description: { type: String, default: '' },

    price: {
      value:      { type: Number, default: 0 },
      currency:   { type: String, default: 'UZS' },
      negotiable: { type: Boolean, default: false },
      label:      { type: String, default: '' },
    },

    params: {
      model:        { type: String, default: '' },
      year:         { type: Number, default: null },
      mileage:      { type: Number, default: null },
      transmission: { type: String, default: '' },
      color:        { type: String, default: '' },
      fuelType:     { type: String, default: '' },
      bodyType:     { type: String, default: '' },
      condition:    { type: String, default: '' },
    },

    photos: [{ url: { type: String } }],

    location: {
      city:     { type: String, default: '' },
      district: { type: String, default: '' },
      region:   { type: String, default: '' },
    },

    sellerName:    { type: String, default: '' },
    olxCreatedAt:  { type: Date,   default: null },
    fetchedAt:     { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for common filter queries
autoListingSchema.index({ 'price.value': 1 });
autoListingSchema.index({ 'params.year': 1 });
autoListingSchema.index({ 'params.bodyType': 1 });
autoListingSchema.index({ 'params.transmission': 1 });
autoListingSchema.index({ olxCreatedAt: -1 });

module.exports = mongoose.model('AutoListing', autoListingSchema);
