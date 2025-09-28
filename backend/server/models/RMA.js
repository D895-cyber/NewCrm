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
    trim: true
  },
  rmaOrderNumber: {
    type: String,
    trim: true
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
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productPartNumber: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true,
    ref: 'Projector'
  },
  
  // Defective Part Details
  defectivePartNumber: {
    type: String,
    trim: true
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
  
  // Enhanced Shipping Information
  shipping: {
    // Outbound (Company to CDS)
    outbound: {
      trackingNumber: {
        type: String,
        trim: true
      },
      carrier: {
        type: String,
        trim: true,
        ref: 'DeliveryProvider'
      },
      carrierService: {
        type: String,
        trim: true
      },
      shippedDate: {
        type: Date
      },
      estimatedDelivery: {
        type: Date
      },
      actualDelivery: {
        type: Date
      },
      status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned'],
        default: 'pending'
      },
      trackingUrl: {
        type: String,
        trim: true
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      weight: {
        type: Number,
        min: 0
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      insuranceValue: {
        type: Number,
        min: 0
      },
      requiresSignature: {
        type: Boolean,
        default: false
      }
    },
    
    // Return (CDS to Company)
    return: {
      trackingNumber: {
        type: String,
        trim: true
      },
      carrier: {
        type: String,
        trim: true,
        ref: 'DeliveryProvider'
      },
      carrierService: {
        type: String,
        trim: true
      },
      shippedDate: {
        type: Date
      },
      estimatedDelivery: {
        type: Date
      },
      actualDelivery: {
        type: Date
      },
      status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned'],
        default: 'pending'
      },
      trackingUrl: {
        type: String,
        trim: true
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      weight: {
        type: Number,
        min: 0
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      insuranceValue: {
        type: Number,
        min: 0
      },
      requiresSignature: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Legacy shipping fields for backward compatibility
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
    default: 'Under Review'
  },
  
  approvalStatus: {
    type: String,
    enum: ['Pending Review', 'Approved', 'Rejected', 'Under Investigation'],
    default: 'Pending Review'
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
    default: 'Medium'
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
  },
  
  // Tracking History
  trackingHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true
    },
    direction: {
      type: String,
      enum: ['outbound', 'return'],
      required: true
    },
    trackingNumber: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      enum: ['api', 'webhook', 'manual'],
      default: 'api'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Delivery Provider Integration
  deliveryProvider: {
    providerId: {
      type: String,
      ref: 'DeliveryProvider'
    },
    apiKey: {
      type: String,
      trim: true
    },
    webhookUrl: {
      type: String,
      trim: true
    },
    lastSync: {
      type: Date
    },
    syncEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Cost Tracking
  shippingCosts: {
    outbound: {
      cost: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      },
      paidBy: {
        type: String,
        enum: ['company', 'customer', 'cds'],
        default: 'company'
      }
    },
    return: {
      cost: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      },
      paidBy: {
        type: String,
        enum: ['company', 'customer', 'cds'],
        default: 'company'
      }
    }
  },
  
  // SLA Tracking
  sla: {
    targetDeliveryDays: {
      type: Number,
      default: 3
    },
    actualDeliveryDays: {
      type: Number
    },
    slaBreached: {
      type: Boolean,
      default: false
    },
    breachReason: {
      type: String,
      trim: true
    }
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

// Enhanced tracking indexes
rmaSchema.index({ 'shipping.outbound.trackingNumber': 1 });
rmaSchema.index({ 'shipping.return.trackingNumber': 1 });
rmaSchema.index({ 'shipping.outbound.carrier': 1 });
rmaSchema.index({ 'shipping.return.carrier': 1 });
rmaSchema.index({ 'shipping.outbound.status': 1 });
rmaSchema.index({ 'shipping.return.status': 1 });
rmaSchema.index({ 'deliveryProvider.providerId': 1 });
rmaSchema.index({ 'trackingHistory.timestamp': -1 });
rmaSchema.index({ 'sla.slaBreached': 1 });

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

// Instance methods for tracking functionality
rmaSchema.methods.addTrackingEvent = function(trackingData) {
  this.trackingHistory.push({
    timestamp: new Date(),
    status: trackingData.status,
    location: trackingData.location,
    description: trackingData.description,
    carrier: trackingData.carrier,
    direction: trackingData.direction,
    trackingNumber: trackingData.trackingNumber,
    source: trackingData.source || 'api',
    metadata: trackingData.metadata
  });
  
  // Update last sync time
  this.deliveryProvider.lastSync = new Date();
  
  return this.save();
};

rmaSchema.methods.updateShippingStatus = function(direction, status, additionalData = {}) {
  if (direction === 'outbound') {
    this.shipping.outbound.status = status;
    this.shipping.outbound.lastUpdated = new Date();
    
    if (additionalData.actualDelivery) {
      this.shipping.outbound.actualDelivery = additionalData.actualDelivery;
    }
    if (additionalData.estimatedDelivery) {
      this.shipping.outbound.estimatedDelivery = additionalData.estimatedDelivery;
    }
  } else if (direction === 'return') {
    this.shipping.return.status = status;
    this.shipping.return.lastUpdated = new Date();
    
    if (additionalData.actualDelivery) {
      this.shipping.return.actualDelivery = additionalData.actualDelivery;
    }
    if (additionalData.estimatedDelivery) {
      this.shipping.return.estimatedDelivery = additionalData.estimatedDelivery;
    }
  }
  
  return this.save();
};

rmaSchema.methods.calculateSLABreach = function() {
  const targetDays = this.sla.targetDeliveryDays || 3;
  
  // Check outbound SLA
  if (this.shipping.outbound.actualDelivery && this.shipping.outbound.shippedDate) {
    const actualDays = Math.ceil(
      (this.shipping.outbound.actualDelivery - this.shipping.outbound.shippedDate) / (1000 * 60 * 60 * 24)
    );
    
    if (actualDays > targetDays) {
      this.sla.slaBreached = true;
      this.sla.actualDeliveryDays = actualDays;
      this.sla.breachReason = `Outbound delivery took ${actualDays} days, exceeding target of ${targetDays} days`;
    }
  }
  
  // Check return SLA
  if (this.shipping.return.actualDelivery && this.shipping.return.shippedDate) {
    const actualDays = Math.ceil(
      (this.shipping.return.actualDelivery - this.shipping.return.shippedDate) / (1000 * 60 * 60 * 24)
    );
    
    if (actualDays > targetDays) {
      this.sla.slaBreached = true;
      this.sla.actualDeliveryDays = actualDays;
      this.sla.breachReason = `Return delivery took ${actualDays} days, exceeding target of ${targetDays} days`;
    }
  }
  
  return this.save();
};

rmaSchema.methods.getTrackingUrl = function(direction) {
  const shipping = direction === 'outbound' ? this.shipping.outbound : this.shipping.return;
  
  if (!shipping.trackingNumber || !shipping.carrier) {
    return null;
  }
  
  // This will be populated by the DeliveryProvider model
  return shipping.trackingUrl;
};

// Static methods
rmaSchema.statics.findByTrackingNumber = function(trackingNumber) {
  return this.findOne({
    $or: [
      { 'shipping.outbound.trackingNumber': trackingNumber },
      { 'shipping.return.trackingNumber': trackingNumber }
    ]
  });
};

rmaSchema.statics.findActiveShipments = function() {
  return this.find({
    $or: [
      { 'shipping.outbound.status': { $in: ['picked_up', 'in_transit', 'out_for_delivery'] } },
      { 'shipping.return.status': { $in: ['picked_up', 'in_transit', 'out_for_delivery'] } }
    ]
  });
};

rmaSchema.statics.findSLABreaches = function() {
  return this.find({
    'sla.slaBreached': true
  });
};

module.exports = mongoose.model('RMA', rmaSchema);