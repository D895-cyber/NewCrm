const mongoose = require('mongoose');

const rmaSchema = new mongoose.Schema({
  // Core RMA Information
  rmaNumber: {
    type: String,
    unique: true,
    trim: true
  },
  callLogNumber: {
    type: String,
    trim: true,
    index: true
  },
  rmaOrderNumber: {
    type: String,
    trim: true,
    index: true
  },
  
  // Date Fields
  ascompRaisedDate: {
    type: Date,
    required: true
  },
  customerErrorDate: {
    type: Date,
    required: true
  },
  
  // Site and Product Information
  siteName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productPartNumber: {
    type: String,
    trim: true,
    index: true
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true,
    index: true,
    ref: 'Projector'
  },
  
  // Defective Part Details
  defectivePartNumber: {
    type: String,
    trim: true,
    index: true
  },
  defectivePartName: {
    type: String,
    trim: true
  },
  defectiveSerialNumber: {
    type: String,
    trim: true
  },
  symptoms: {
    type: String,
    trim: true
  },
  
  // Replacement Part Details
  replacedPartNumber: {
    type: String,
    trim: true
  },
  replacedPartName: {
    type: String,
    trim: true
  },
  replacedPartSerialNumber: {
    type: String,
    trim: true
  },
  replacementNotes: {
    type: String,
    trim: true
  },
  
  // Shipping Information
  shippedDate: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  shippedThru: {
    type: String,
    trim: true
  },
  
  // Additional Information
  remarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  
  // Status and Workflow
  caseStatus: {
    type: String,
    enum: [
      'Under Review',
      'Sent to CDS',
      'CDS Approved', 
      'Replacement Shipped',
      'Replacement Received',
      'Installation Complete',
      'Faulty Part Returned',
      'CDS Confirmed Return',
      'Completed',
      'Rejected'
    ],
    default: 'Under Review',
    index: true
  },
  
  approvalStatus: {
    type: String,
    enum: ['Pending Review', 'Approved', 'Rejected', 'Under Investigation'],
    default: 'Pending Review',
    index: true
  },
  
  // Return Shipping Information
  rmaReturnShippedDate: {
    type: Date
  },
  rmaReturnTrackingNumber: {
    type: String,
    trim: true
  },
  rmaReturnShippedThru: {
    type: String,
    trim: true
  },
  
  // Time Tracking
  daysCountShippedToSite: {
    type: Number,
    default: 0,
    min: 0
  },
  daysCountReturnToCDS: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Legacy fields for backward compatibility
  projectorSerial: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  projectorModel: {
    type: String,
    trim: true
  },
  customerSite: {
    type: String,
    trim: true
  },
  
  // Enhanced workflow tracking
  cdsWorkflow: {
    sentToCDS: {
      date: Date,
      sentBy: String,
      referenceNumber: String,
      notes: String
    },
    cdsApproval: {
      date: Date,
      approvedBy: String,
      approvalNotes: String
    },
    replacementTracking: {
      trackingNumber: String,
      carrier: String,
      shippedDate: Date,
      estimatedDelivery: Date,
      actualDelivery: Date
    }
  },
  
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true
  },
  
  warrantyStatus: {
    type: String,
    enum: ['In Warranty', 'Extended Warranty', 'Out of Warranty', 'Expired'],
    required: true
  },
  
  estimatedCost: {
    type: Number,
    min: 0
  },
  
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Enhanced Indexes for better performance
rmaSchema.index({ callLogNumber: 1 });
rmaSchema.index({ rmaOrderNumber: 1 });
rmaSchema.index({ ascompRaisedDate: -1 });
rmaSchema.index({ customerErrorDate: -1 });
rmaSchema.index({ siteName: 1 });
rmaSchema.index({ productName: 1 });
rmaSchema.index({ caseStatus: 1 });
rmaSchema.index({ createdBy: 1 });
rmaSchema.index({ 'cdsWorkflow.sentToCDS.date': -1 });
rmaSchema.index({ 'cdsWorkflow.cdsApproval.date': -1 });
rmaSchema.index({ 'cdsWorkflow.replacementTracking.trackingNumber': 1 });
rmaSchema.index({ defectivePartNumber: 1 });
rmaSchema.index({ replacedPartNumber: 1 });

// Auto-generate RMA number
rmaSchema.pre('save', async function(next) {
  if (!this.rmaNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('RMA').countDocuments({
      rmaNumber: new RegExp(`^RMA-${year}-`)
    });
    this.rmaNumber = `RMA-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate days count when dates change
rmaSchema.pre('save', function(next) {
  if (this.shippedDate) {
    const shipped = new Date(this.shippedDate);
    const raised = new Date(this.ascompRaisedDate);
    this.daysCountShippedToSite = Math.ceil((shipped - raised) / (1000 * 60 * 60 * 24));
  }
  
  if (this.rmaReturnShippedDate) {
    const returned = new Date(this.rmaReturnShippedDate);
    const shipped = new Date(this.shippedDate);
    this.daysCountReturnToCDS = Math.ceil((returned - shipped) / (1000 * 60 * 60 * 24));
  }
  next();
});

module.exports = mongoose.model('RMA', rmaSchema);