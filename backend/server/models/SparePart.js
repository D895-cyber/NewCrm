const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  partNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  partName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Spare Parts', 'RMA'],
    default: 'Spare Parts'
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  projectorModel: {
    type: String,
    required: true,
    trim: true
  },
  // Link to specific projector serial number
  projectorSerial: {
    type: String,
    ref: 'Projector',
    trim: true
  },
  // Service recommendation details
  recommendedBy: {
    serviceId: String,
    technician: String,
    date: Date,
    reason: String,
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    }
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'RMA Pending', 'RMA Approved'],
    default: 'In Stock'
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
sparePartSchema.index({ category: 1 });
sparePartSchema.index({ status: 1 });
sparePartSchema.index({ brand: 1 });
sparePartSchema.index({ projectorSerial: 1 });
sparePartSchema.index({ 'recommendedBy.serviceId': 1 });

// Auto-update status based on stock quantity
sparePartSchema.pre('save', function(next) {
  if (this.stockQuantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.stockQuantity <= this.reorderLevel && this.category !== 'RMA') {
    this.status = 'Low Stock';
  } else if (this.category === 'Spare Parts' && this.stockQuantity > this.reorderLevel) {
    this.status = 'In Stock';
  }
  next();
});

module.exports = mongoose.model('SparePart', sparePartSchema);