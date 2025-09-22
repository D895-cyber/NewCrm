const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: String,
    required: true,
    trim: true
  },
  customerSite: {
    type: String,
    required: true,
    trim: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  customerContact: {
    name: String,
    phone: String,
    email: String
  },
  
  // PO Details
  dateRaised: {
    type: Date,
    default: Date.now
  },
  expectedDelivery: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Line Items
  lineItems: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    partNumber: String,
    serviceType: String
  }],
  
  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Cancelled'],
    default: 'Draft'
  },
  
  // Approval
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: String,
  approvedAt: Date,
  
  // PI Generation
  proformaInvoice: {
    piId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProformaInvoice'
    },
    piNumber: String,
    status: {
      type: String,
      enum: ['Not Generated', 'Generated', 'Sent', 'Accepted', 'Rejected'],
      default: 'Not Generated'
    }
  },
  
  // OEM PO (for spare parts/service needs)
  oemPO: {
    oemPoNumber: String,
    oemName: {
      type: String,
      default: 'Christie'
    },
    oemPoDate: Date,
    oemPoStatus: {
      type: String,
      enum: ['Not Created', 'Created', 'Sent', 'Confirmed', 'Shipped', 'Received'],
      default: 'Not Created'
    },
    oemPoAmount: Number,
    trackingNumber: String,
    expectedDelivery: Date
  },
  
  // Projector Information
  projectors: [{
    model: String,
    location: String,
    service: String,
    serialNumber: String
  }],
  
  // Notes and Instructions
  description: String,
  specialInstructions: String,
  termsAndConditions: String,
  
  // Files and Attachments
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    cloudUrl: String,
    description: String
  }],
  
  // History
  history: [{
    action: {
      type: String,
      enum: ['Created', 'Submitted', 'Approved', 'Rejected', 'PI Generated', 'OEM PO Created', 'Completed'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ customer: 1 });
purchaseOrderSchema.index({ dateRaised: 1 });
purchaseOrderSchema.index({ approvalStatus: 1 });
purchaseOrderSchema.index({ 'proformaInvoice.status': 1 });
purchaseOrderSchema.index({ 'oemPO.oemPoStatus': 1 });

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function(next) {
  if (!this.poNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PurchaseOrder').countDocuments({
      poNumber: new RegExp(`^PO-${year}-`)
    });
    this.poNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Auto-calculate totals
  this.subtotal = this.lineItems.reduce((sum, item) => sum + item.total, 0);
  this.taxAmount = (this.subtotal - this.discount) * (this.taxRate / 100);
  this.totalAmount = this.subtotal + this.taxAmount - this.discount;
  
  next();
});

// Virtual for PO status
purchaseOrderSchema.virtual('isOverdue').get(function() {
  if (this.expectedDelivery && this.status === 'Approved') {
    const now = new Date();
    const expected = new Date(this.expectedDelivery);
    return now > expected;
  }
  return false;
});

purchaseOrderSchema.virtual('daysUntilDelivery').get(function() {
  if (this.expectedDelivery) {
    const now = new Date();
    const expected = new Date(this.expectedDelivery);
    return Math.ceil((expected - now) / (1000 * 60 * 60 * 24));
  }
  return null;
});

purchaseOrderSchema.set('toJSON', { virtuals: true });
purchaseOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema); 