const mongoose = require('mongoose');

const deliveryProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  // API Configuration
  apiEndpoint: {
    type: String,
    trim: true
  },
  trackingEndpoint: {
    type: String,
    trim: true
  },
  webhookEndpoint: {
    type: String,
    trim: true
  },
  apiKey: {
    type: String,
    trim: true
  },
  apiSecret: {
    type: String,
    trim: true
  },
  
  // Provider Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDomestic: {
    type: Boolean,
    default: true
  },
  isInternational: {
    type: Boolean,
    default: false
  },
  
  // Supported Services
  supportedServices: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    estimatedDays: {
      type: Number,
      required: true,
      min: 1
    },
    cost: {
      type: Number,
      min: 0
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  // Tracking Number Format
  trackingFormat: {
    pattern: {
      type: String,
      trim: true
    },
    length: {
      type: Number,
      min: 1
    },
    prefix: {
      type: String,
      trim: true
    },
    example: {
      type: String,
      trim: true
    }
  },
  
  // Coverage Information
  coverage: {
    domestic: {
      type: Boolean,
      default: true
    },
    international: {
      type: Boolean,
      default: false
    },
    countries: [{
      type: String,
      trim: true
    }],
    states: [{
      type: String,
      trim: true
    }]
  },
  
  // Contact Information
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    supportHours: {
      type: String,
      trim: true
    }
  },
  
  // Performance Metrics
  performance: {
    averageDeliveryTime: {
      type: Number,
      min: 0
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100
    },
    customerRating: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  
  // Configuration
  config: {
    requiresSignature: {
      type: Boolean,
      default: false
    },
    supportsCOD: {
      type: Boolean,
      default: false
    },
    supportsInsurance: {
      type: Boolean,
      default: false
    },
    maxWeight: {
      type: Number,
      min: 0
    },
    maxDimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  
  // Metadata
  logo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
deliveryProviderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
deliveryProviderSchema.index({ code: 1 });
deliveryProviderSchema.index({ isActive: 1 });
deliveryProviderSchema.index({ 'coverage.domestic': 1, 'coverage.international': 1 });

// Static method to get active providers
deliveryProviderSchema.statics.getActiveProviders = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get providers by coverage
deliveryProviderSchema.statics.getProvidersByCoverage = function(isDomestic = true) {
  const query = { isActive: true };
  if (isDomestic) {
    query['coverage.domestic'] = true;
  } else {
    query['coverage.international'] = true;
  }
  return this.find(query).sort({ name: 1 });
};

// Instance method to validate tracking number format
deliveryProviderSchema.methods.validateTrackingNumber = function(trackingNumber) {
  if (!this.trackingFormat.pattern) {
    return true; // No pattern defined, accept any format
  }
  
  const regex = new RegExp(this.trackingFormat.pattern);
  return regex.test(trackingNumber);
};

// Instance method to get tracking URL
deliveryProviderSchema.methods.getTrackingUrl = function(trackingNumber) {
  if (!this.trackingEndpoint) {
    return null;
  }
  
  return this.trackingEndpoint.replace('{trackingNumber}', trackingNumber);
};

module.exports = mongoose.model('DeliveryProvider', deliveryProviderSchema);

