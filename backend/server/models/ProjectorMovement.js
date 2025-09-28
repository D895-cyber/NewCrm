const mongoose = require('mongoose');

const projectorMovementSchema = new mongoose.Schema({
  // Projector being moved
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

  // Movement type
  movementType: {
    type: String,
    enum: ['Move', 'Swap', 'Status Change', 'Installation', 'Removal', 'Maintenance Transfer'],
    required: true
  },

  // Previous location
  previousLocation: {
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

  // New location
  newLocation: {
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

  // Status changes
  previousStatus: {
    type: String,
    enum: ['Active', 'Under Service', 'Inactive', 'Needs Repair', 'In Storage', 'Disposed']
  },
  newStatus: {
    type: String,
    enum: ['Active', 'Under Service', 'Inactive', 'Needs Repair', 'In Storage', 'Disposed']
  },

  // Swap details (if movement type is 'Swap')
  swapWithProjector: {
    projectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Projector'
    },
    projectorNumber: {
      type: String,
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true
    }
  },

  // Movement details
  movementDate: {
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

  // Personnel involved
  performedBy: {
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

  // Approval and documentation
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date
  },
  documentation: [{
    type: {
      type: String,
      enum: ['Photo', 'Video', 'Document', 'Certificate']
    },
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Cost tracking
  movementCost: {
    type: Number,
    default: 0
  },
  laborCost: {
    type: Number,
    default: 0
  },
  transportationCost: {
    type: Number,
    default: 0
  },

  // System tracking
  isReversible: {
    type: Boolean,
    default: true
  },
  reversalMovementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectorMovement'
  },

  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['Email', 'SMS', 'System']
    },
    recipient: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Failed'],
      default: 'Sent'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
projectorMovementSchema.index({ projectorId: 1, movementDate: -1 });
projectorMovementSchema.index({ movementType: 1 });
projectorMovementSchema.index({ 'previousLocation.siteId': 1 });
projectorMovementSchema.index({ 'newLocation.siteId': 1 });
projectorMovementSchema.index({ movementDate: -1 });

// Virtual for movement summary
projectorMovementSchema.virtual('movementSummary').get(function() {
  const from = this.previousLocation.siteName ? 
    `${this.previousLocation.siteName} - ${this.previousLocation.auditoriumName}` : 
    'Unknown Location';
  const to = this.newLocation.siteName ? 
    `${this.newLocation.siteName} - ${this.newLocation.auditoriumName}` : 
    'Unknown Location';
  
  return `${this.movementType}: ${from} → ${to}`;
});

// Static method to get movement history for a projector
projectorMovementSchema.statics.getProjectorHistory = function(projectorId, limit = 50) {
  return this.find({ projectorId })
    .sort({ movementDate: -1 })
    .limit(limit)
    .populate('projectorId', 'projectorNumber serialNumber model brand')
    .populate('previousLocation.siteId', 'name siteCode')
    .populate('newLocation.siteId', 'name siteCode');
};

// Static method to get movements by site
projectorMovementSchema.statics.getSiteMovements = function(siteId, limit = 100) {
  return this.find({
    $or: [
      { 'previousLocation.siteId': siteId },
      { 'newLocation.siteId': siteId }
    ]
  })
  .sort({ movementDate: -1 })
  .limit(limit)
  .populate('projectorId', 'projectorNumber serialNumber model brand');
};

module.exports = mongoose.model('ProjectorMovement', projectorMovementSchema);


