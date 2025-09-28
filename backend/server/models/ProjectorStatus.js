const mongoose = require('mongoose');

const projectorStatusSchema = new mongoose.Schema({
  // Projector reference
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
  serialNumber: {
    type: String,
    required: true,
    trim: true
  },

  // Status information
  status: {
    type: String,
    enum: ['Active', 'Under Service', 'Inactive', 'Needs Repair', 'In Storage', 'Disposed', 'Maintenance', 'Testing'],
    required: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair', 'Critical'],
    required: true
  },

  // Location information
  currentLocation: {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site'
    },
    siteName: {
      type: String,
      trim: true
    },
    siteCode: {
      type: String,
      trim: true
    },
    auditoriumId: {
      type: String,
      trim: true
    },
    auditoriumName: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    rackPosition: {
      type: String,
      trim: true
    }
  },

  // Status change details
  previousStatus: {
    type: String,
    enum: ['Active', 'Under Service', 'Inactive', 'Needs Repair', 'In Storage', 'Disposed', 'Maintenance', 'Testing']
  },
  statusChangeDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },

  // Personnel
  changedBy: {
    type: String,
    required: true,
    trim: true
  },
  technician: {
    type: String,
    trim: true
  },
  authorizedBy: {
    type: String,
    trim: true
  },

  // Expected duration for temporary statuses
  expectedDuration: {
    type: Number, // in hours
    default: null
  },
  expectedEndDate: {
    type: Date,
    default: null
  },

  // Service details (if status is service-related)
  serviceDetails: {
    serviceType: {
      type: String,
      enum: ['Routine Maintenance', 'Repair', 'Upgrade', 'Inspection', 'Calibration', 'Cleaning']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    serviceProvider: {
      type: String,
      trim: true
    },
    serviceTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceTicket'
    }
  },

  // Performance metrics at time of status change
  performanceMetrics: {
    hoursUsed: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastMaintenanceDate: {
      type: Date
    },
    nextMaintenanceDate: {
      type: Date
    }
  },

  // Documentation
  documentation: [{
    type: {
      type: String,
      enum: ['Photo', 'Video', 'Report', 'Certificate', 'Test Result']
    },
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['Email', 'SMS', 'System', 'Dashboard']
    },
    recipient: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Failed', 'Read'],
      default: 'Sent'
    }
  }],

  // Resolution tracking
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String,
    trim: true
  },
  resolutionNotes: {
    type: String,
    trim: true
  },

  // System tracking
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date
  },
  deactivatedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectorStatusSchema.index({ projectorId: 1, statusChangeDate: -1 });
projectorStatusSchema.index({ status: 1 });
projectorStatusSchema.index({ condition: 1 });
projectorStatusSchema.index({ 'currentLocation.siteId': 1 });
projectorStatusSchema.index({ isActive: 1, statusChangeDate: -1 });

// Virtual for status summary
projectorStatusSchema.virtual('statusSummary').get(function() {
  const location = this.currentLocation.siteName ? 
    `${this.currentLocation.siteName} - ${this.currentLocation.auditoriumName}` : 
    'Unknown Location';
  
  return `${this.status} (${this.condition}) at ${location}`;
});

// Static method to get current status of a projector
projectorStatusSchema.statics.getCurrentStatus = function(projectorId) {
  return this.findOne({ 
    projectorId, 
    isActive: true 
  })
  .sort({ statusChangeDate: -1 })
  .populate('projectorId', 'projectorNumber serialNumber model brand')
  .populate('currentLocation.siteId', 'name siteCode');
};

// Static method to get status history for a projector
projectorStatusSchema.statics.getStatusHistory = function(projectorId, limit = 50) {
  return this.find({ projectorId })
    .sort({ statusChangeDate: -1 })
    .limit(limit)
    .populate('projectorId', 'projectorNumber serialNumber model brand')
    .populate('currentLocation.siteId', 'name siteCode');
};

// Static method to get projectors by status
projectorStatusSchema.statics.getProjectorsByStatus = function(status, limit = 100) {
  return this.find({ 
    status, 
    isActive: true 
  })
  .sort({ statusChangeDate: -1 })
  .limit(limit)
  .populate('projectorId', 'projectorNumber serialNumber model brand')
  .populate('currentLocation.siteId', 'name siteCode');
};

// Method to resolve status
projectorStatusSchema.methods.resolve = function(resolvedBy, resolutionNotes) {
  this.isResolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolutionNotes = resolutionNotes;
  return this.save();
};

// Method to deactivate status
projectorStatusSchema.methods.deactivate = function(deactivatedBy) {
  this.isActive = false;
  this.deactivatedAt = new Date();
  this.deactivatedBy = deactivatedBy;
  return this.save();
};

module.exports = mongoose.model('ProjectorStatus', projectorStatusSchema);


