const mongoose = require('mongoose');

const serviceScheduleSchema = new mongoose.Schema({
  serviceNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  actualDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'],
    default: 'Scheduled'
  },
  serviceVisitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceVisit'
  },
  technician: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const amcContractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Core relationships - Site, Auditorium, and Projector
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  siteName: {
    type: String,
    required: true,
    trim: true
  },
  siteCode: {
    type: String,
    required: true,
    trim: true
  },
  
  auditoriumId: {
    type: String,
    required: true,
    trim: true
  },
  auditoriumName: {
    type: String,
    required: true,
    trim: true
  },
  
  projectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Projector',
    required: true
  },
  projectorNumber: {
    type: String,
    required: true,
    trim: true
  },
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
  
  // Contract Period
  contractStartDate: {
    type: Date,
    required: true
  },
  contractEndDate: {
    type: Date,
    required: true
  },
  contractDuration: {
    type: Number, // in months
    required: true,
    default: 12
  },
  
  // Service Schedule (4 services per year)
  serviceSchedule: [serviceScheduleSchema],
  
  // Contract Status
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Suspended', 'Terminated'],
    default: 'Active'
  },
  
  // Financial Details
  contractValue: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partial', 'Pending', 'Overdue'],
    default: 'Pending'
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  
  // Service Coverage
  coveredServices: [{
    type: String,
    enum: [
      'Preventive Maintenance',
      'Emergency Repairs',
      'Spare Parts (Limited)',
      'RMA Processing',
      'Technical Support',
      'Calibration',
      'Filter Cleaning',
      'Lamp Replacement (Limited)'
    ]
  }],
  
  // Exclusions
  exclusions: [{
    type: String,
    trim: true
  }],
  
  // Terms and Conditions
  terms: {
    type: String,
    trim: true
  },
  
  // Contract Manager
  contractManager: {
    type: String,
    required: true,
    trim: true
  },
  
  // FSE Assignment
  assignedFSE: {
    fseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FSE'
    },
    fseName: {
      type: String,
      trim: true
    }
  },
  
  // Auto-renewal settings
  autoRenewal: {
    enabled: {
      type: Boolean,
      default: false
    },
    renewalPeriod: {
      type: Number, // in months
      default: 12
    },
    renewalDate: Date
  },
  
  // Contract History
  contractHistory: [{
    action: {
      type: String,
      enum: ['Created', 'Activated', 'Service Completed', 'Renewed', 'Terminated', 'Suspended'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: String,
      required: true
    },
    notes: String
  }],
  
  // Notifications
  notifications: {
    serviceReminder: {
      type: Boolean,
      default: true
    },
    contractExpiry: {
      type: Boolean,
      default: true
    },
    paymentReminder: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
amcContractSchema.index({ siteId: 1 });
amcContractSchema.index({ auditoriumId: 1 });
amcContractSchema.index({ projectorId: 1 });
amcContractSchema.index({ status: 1 });
amcContractSchema.index({ contractStartDate: -1 });
amcContractSchema.index({ contractEndDate: -1 });
amcContractSchema.index({ siteName: 1 });
amcContractSchema.index({ projectorSerial: 1 });
amcContractSchema.index({ 'assignedFSE.fseId': 1 });

// Auto-generate contract number and populate details
amcContractSchema.pre('save', async function(next) {
  if (!this.contractNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('AMCContract').countDocuments({
      contractNumber: new RegExp(`^AMC-${year}-`)
    });
    this.contractNumber = `AMC-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Auto-populate projector details if projector reference is provided
  if (this.projectorId && (!this.projectorSerial || !this.projectorModel || !this.projectorBrand)) {
    try {
      const Projector = mongoose.model('Projector');
      const projectorDoc = await Projector.findById(this.projectorId);
      if (projectorDoc) {
        this.projectorNumber = projectorDoc.projectorNumber;
        this.projectorSerial = projectorDoc.serialNumber;
        this.projectorModel = projectorDoc.model;
        this.projectorBrand = projectorDoc.brand;
        this.auditoriumId = projectorDoc.auditoriumId;
        this.auditoriumName = projectorDoc.auditoriumName;
        this.siteId = projectorDoc.siteId;
        this.siteName = projectorDoc.siteName;
        this.siteCode = projectorDoc.siteCode;
      }
    } catch (error) {
      console.error('Error populating projector details:', error);
    }
  }
  
  // Auto-populate site details if site reference is provided
  if (this.siteId && (!this.siteName || !this.siteCode)) {
    try {
      const Site = mongoose.model('Site');
      const siteDoc = await Site.findById(this.siteId);
      if (siteDoc) {
        this.siteName = siteDoc.name;
        this.siteCode = siteDoc.siteCode;
      }
    } catch (error) {
      console.error('Error populating site details:', error);
    }
  }
  
  // Auto-generate service schedule if not set
  if (this.contractStartDate && this.serviceSchedule.length === 0) {
    const serviceInterval = Math.floor(this.contractDuration / 4); // 4 services per contract
    
    for (let i = 1; i <= 4; i++) {
      const serviceDate = new Date(this.contractStartDate);
      serviceDate.setMonth(serviceDate.getMonth() + (i * serviceInterval));
      
      this.serviceSchedule.push({
        serviceNumber: i,
        scheduledDate: serviceDate,
        status: 'Scheduled'
      });
    }
  }
  
  next();
});

// Virtual for contract status
amcContractSchema.virtual('contractStatus').get(function() {
  const now = new Date();
  
  if (this.status === 'Terminated' || this.status === 'Suspended') {
    return this.status;
  }
  
  if (this.contractEndDate < now) {
    return 'Expired';
  }
  
  if (this.contractStartDate > now) {
    return 'Pending Start';
  }
  
  return 'Active';
});

// Virtual for next service due
amcContractSchema.virtual('nextServiceDue').get(function() {
  const now = new Date();
  
  const nextService = this.serviceSchedule.find(service => 
    service.status === 'Scheduled' && service.scheduledDate > now
  );
  
  if (nextService) {
    return {
      service: `Service ${nextService.serviceNumber}`,
      date: nextService.scheduledDate,
      daysUntil: Math.ceil((nextService.scheduledDate - now) / (1000 * 60 * 60 * 24))
    };
  }
  
  return null;
});

// Virtual for overdue services
amcContractSchema.virtual('overdueServices').get(function() {
  const now = new Date();
  const overdue = [];
  
  this.serviceSchedule.forEach(service => {
    if (service.status === 'Scheduled' && service.scheduledDate < now) {
      overdue.push({
        service: `Service ${service.serviceNumber}`,
        scheduledDate: service.scheduledDate,
        daysOverdue: Math.ceil((now - service.scheduledDate) / (1000 * 60 * 60 * 24))
      });
    }
  });
  
  return overdue;
});

// Virtual for completed services
amcContractSchema.virtual('completedServices').get(function() {
  return this.serviceSchedule.filter(service => service.status === 'Completed').length;
});

// Virtual for pending services
amcContractSchema.virtual('pendingServices').get(function() {
  return this.serviceSchedule.filter(service => service.status === 'Scheduled').length;
});

amcContractSchema.set('toJSON', { virtuals: true });
amcContractSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AMCContract', amcContractSchema);
