const mongoose = require('mongoose');

const proformaInvoiceSchema = new mongoose.Schema({
  // PI Information
  piNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Link to Purchase Order
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true,
    index: true
  },
  poNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Client Information
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientSite: {
    type: String,
    required: true,
    trim: true
  },
  clientAddress: {
    type: String,
    trim: true
  },
  clientContact: {
    name: String,
    phone: String,
    email: String
  },
  
  // Invoice Details
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
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
  
  // Payment Terms
  paymentTerms: {
    type: String,
    default: 'Net 30',
    trim: true
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted to Invoice'],
    default: 'Draft',
    index: true
  },
  
  // Approval and Workflow
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvedAt: Date,
  
  // Notes and Remarks
  notes: String,
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
      enum: ['Created', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired', 'Converted'],
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

// Indexes for better performance
proformaInvoiceSchema.index({ piNumber: 1 });
proformaInvoiceSchema.index({ clientName: 1 });
proformaInvoiceSchema.index({ issueDate: -1 });
proformaInvoiceSchema.index({ dueDate: 1 });
proformaInvoiceSchema.index({ status: 1 });
proformaInvoiceSchema.index({ approvalStatus: 1 });

// Auto-generate PI number
proformaInvoiceSchema.pre('save', async function(next) {
  if (!this.piNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ProformaInvoice').countDocuments({
      piNumber: new RegExp(`^PI-${year}-`)
    });
    this.piNumber = `PI-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Auto-calculate totals
  this.subtotal = this.lineItems.reduce((sum, item) => sum + item.total, 0);
  this.taxAmount = (this.subtotal - this.discount) * (this.taxRate / 100);
  this.totalAmount = this.subtotal + this.taxAmount - this.discount;
  
  // Auto-set due date if not provided
  if (!this.dueDate) {
    this.dueDate = new Date(this.issueDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30); // Default 30 days
  }
  
  // Auto-set validity if not provided
  if (!this.validUntil) {
    this.validUntil = new Date(this.issueDate);
    this.validUntil.setDate(this.validUntil.getDate() + 90); // Default 90 days
  }
  
  next();
});

// Virtual for PI status
proformaInvoiceSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

proformaInvoiceSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status === 'Sent';
});

proformaInvoiceSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

proformaInvoiceSchema.set('toJSON', { virtuals: true });
proformaInvoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProformaInvoice', proformaInvoiceSchema);
