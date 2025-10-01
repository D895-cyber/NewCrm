const mongoose = require('mongoose');

const serviceTicketSchema = new mongoose.Schema({
  // Ticket Information
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Link to AMC Contract
  amcContractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AMCContract',
    required: true
  },
  contractNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Client and Site Information
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  siteName: {
    type: String,
    required: true,
    trim: true
  },
  siteAddress: {
    type: String,
    trim: true
  },
  
  // Projector Information
  projectorSerial: {
    type: String,
    required: true,
    trim: true
  },
  projectorModel: {
    type: String,
    required: true,
    trim: true
  },
  projectorBrand: {
    type: String,
    required: true,
    trim: true
  },
  
  // Service Details
  serviceType: {
    type: String,
    enum: ['Preventive Maintenance', 'Emergency Repair', 'Installation', 'Calibration', 'RMA Replacement'],
    required: true
  },
  serviceSchedule: {
    type: String,
    enum: ['First Service', 'Second Service', 'Emergency', 'Custom'],
    required: true
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    trim: true
  },
  estimatedDuration: {
    type: Number, // in hours
    default: 2
  },
  
  // FSE Assignment
  assignedFSE: {
    fseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FSE',
      required: true
    },
    fseName: {
      type: String,
      required: true,
      trim: true
    },
    fsePhone: String,
    fseEmail: String
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Scheduled', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Service Requirements
  serviceRequirements: [{
    description: String,
    partNumber: String,
    quantity: Number,
    isRMA: {
      type: Boolean,
      default: false
    }
  }],
  
  // Spare Parts
  sparePartsUsed: [{
    partNumber: {
      type: String,
      required: true,
      trim: true
    },
    partName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    isRMA: {
      type: Boolean,
      default: false
    },
    rmaNumber: String
  }],
  
  sparePartsRequired: [{
    partNumber: {
      type: String,
      required: true,
      trim: true
    },
    partName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    }
  }],
  
  // Service Report Link
  serviceReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceReport'
  },
  
  // Customer Communication
  customerContact: {
    name: String,
    phone: String,
    email: String
  },
  
  // Notes and Instructions
  specialInstructions: String,
  customerNotes: String,
  
  // Actual Service Details
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number, // in hours
  
  // Completion Details
  completionNotes: String,
  customerSignature: {
    name: String,
    signedAt: Date,
    dataURI: String
  },
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Notifications
  notifications: {
    customerReminder: {
      type: Boolean,
      default: true
    },
    fseReminder: {
      type: Boolean,
      default: true
    },
    completionNotification: {
      type: Boolean,
      default: true
    }
  },
  
  // History
  history: [{
    action: {
      type: String,
      enum: ['Created', 'Assigned', 'Started', 'Completed', 'Cancelled', 'Rescheduled'],
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
// ticketNumber already has unique: true, so no need for explicit index
serviceTicketSchema.index({ amcContractId: 1 });
serviceTicketSchema.index({ status: 1 });
serviceTicketSchema.index({ scheduledDate: 1 });
serviceTicketSchema.index({ 'assignedFSE.fseId': 1 });
serviceTicketSchema.index({ projectorSerial: 1 });
serviceTicketSchema.index({ priority: 1 });

// Auto-generate ticket number
serviceTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ServiceTicket').countDocuments({
      ticketNumber: new RegExp(`^ST-${year}-`)
    });
    this.ticketNumber = `ST-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Auto-populate contract details if AMC contract reference is provided
  if (this.amcContractId && (!this.contractNumber || !this.clientName || !this.siteName)) {
    try {
      const AMCContract = mongoose.model('AMCContract');
      const contractDoc = await AMCContract.findById(this.amcContractId);
      if (contractDoc) {
        this.contractNumber = contractDoc.contractNumber;
        this.clientName = contractDoc.customerName;
        this.siteName = contractDoc.siteName;
        this.projectorSerial = contractDoc.projectorSerial;
        this.projectorModel = contractDoc.projectorModel;
        this.projectorBrand = contractDoc.projectorBrand;
      }
    } catch (error) {
      console.error('Error populating contract details:', error);
    }
  }
  
  // Auto-populate FSE details if FSE reference is provided
  if (this.assignedFSE.fseId && (!this.assignedFSE.fseName || !this.assignedFSE.fsePhone || !this.assignedFSE.fseEmail)) {
    try {
      const FSE = mongoose.model('FSE');
      const fseDoc = await FSE.findById(this.assignedFSE.fseId);
      if (fseDoc) {
        this.assignedFSE.fseName = fseDoc.name;
        this.assignedFSE.fsePhone = fseDoc.phone;
        this.assignedFSE.fseEmail = fseDoc.email;
      }
    } catch (error) {
      console.error('Error populating FSE details:', error);
    }
  }
  
  next();
});

// Virtual for ticket status
serviceTicketSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Scheduled' || this.status === 'Assigned') {
    const now = new Date();
    const scheduled = new Date(this.scheduledDate);
    return now > scheduled;
  }
  return false;
});

serviceTicketSchema.virtual('daysUntilScheduled').get(function() {
  const now = new Date();
  const scheduled = new Date(this.scheduledDate);
  return Math.ceil((scheduled - now) / (1000 * 60 * 60 * 24));
});

serviceTicketSchema.virtual('isToday').get(function() {
  const today = new Date();
  const scheduled = new Date(this.scheduledDate);
  return today.toDateString() === scheduled.toDateString();
});

serviceTicketSchema.set('toJSON', { virtuals: true });
serviceTicketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ServiceTicket', serviceTicketSchema);
