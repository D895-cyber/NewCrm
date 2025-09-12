const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  callLogNumber: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  siteName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  issueDescription: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },
  assignedTo: {
    type: String,
    trim: true
  },
  openedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolvedDate: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true
  },
  
  // RMA Integration
  rmaGenerated: {
    type: Boolean,
    default: false
  },
  rmaNumber: {
    type: String,
    ref: 'RMA',
    trim: true
  },
  
  // Enhanced tracking
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'Service', 'Hardware', 'Software', 'Other'],
    default: 'Technical'
  },
  
  // SLA tracking
  slaTarget: {
    type: Number, // hours
    default: 24
  },
  slaBreached: {
    type: Boolean,
    default: false
  },
  
  // Escalation
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  escalatedTo: {
    name: String,
    designation: String,
    contact: String
  },
  
  // Customer feedback
  customerSatisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: {
    type: String,
    trim: true
  },
  
  // Related entities
  relatedProjectors: [{
    serialNumber: String,
    model: String,
    brand: String
  }],
  
  attachments: {
    type: [String],
    default: [] // URLs to uploaded files
  },
  
  // Workflow tracking
  workflow: {
    openedBy: {
      name: String,
      designation: String,
      contact: String
    },
    closedBy: {
      name: String,
      designation: String,
      contact: String
    },
    transferredTo: {
      name: String,
      designation: String,
      contact: String,
      date: Date,
      reason: String
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
callLogSchema.index({ callLogNumber: 1 });
callLogSchema.index({ siteName: 1 });
callLogSchema.index({ customerName: 1 });
callLogSchema.index({ status: 1 });
callLogSchema.index({ priority: 1 });
callLogSchema.index({ openedDate: -1 });
callLogSchema.index({ assignedTo: 1 });
callLogSchema.index({ category: 1 });
callLogSchema.index({ rmaGenerated: 1 });
callLogSchema.index({ 'workflow.openedBy.name': 1 });
callLogSchema.index({ 'workflow.closedBy.name': 1 });

// Auto-generate call log number
callLogSchema.pre('save', async function(next) {
  if (!this.callLogNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('CallLog').countDocuments({
      callLogNumber: new RegExp(`^CL-${year}-`)
    });
    this.callLogNumber = `CL-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate SLA breach
callLogSchema.pre('save', function(next) {
  if (this.status === 'Closed' && this.resolvedDate) {
    const opened = new Date(this.openedDate);
    const resolved = new Date(this.resolvedDate);
    const hoursDiff = (resolved - opened) / (1000 * 60 * 60);
    this.slaBreached = hoursDiff > this.slaTarget;
  }
  next();
});

// Virtual for resolution time
callLogSchema.virtual('resolutionTime').get(function() {
  if (this.resolvedDate && this.openedDate) {
    return Math.ceil((this.resolvedDate - this.openedDate) / (1000 * 60 * 60));
  }
  return null;
});

module.exports = mongoose.model('CallLog', callLogSchema);
