const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    store: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Store',
      required: true,
    },
    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    name: {
      type:      String,
      required:  [true, 'Product name is required'],
      trim:      true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      trim:     true,
    },
    // local upload URLs e.g. /uploads/products/product-<hex>.jpg (max 10)
    images: {
      type:     [String],
      default:  [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message:   'Cannot upload more than 10 images per product',
      },
    },
    // Admin moderation status
    status: {
      type:    String,
      enum:    ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    // Only set when status = REJECTED
    rejectionReason: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for public browsing filters
productSchema.index({ status: 1 });
productSchema.index({ store: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
// Compound index for the most common public query (approved + category + price)
productSchema.index({ status: 1, category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
