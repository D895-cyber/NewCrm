const mongoose = require('mongoose');

const auditoriumSchema = new mongoose.Schema({
  audiNumber: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    min: 1
  },
  screenSize: {
    type: String,
    trim: true
  },
  projectorCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Under Maintenance'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  siteCode: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true
  },
  region: {
    type: String,
    required: true,
    trim: true,
    enum: ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest', 'Southeast', 'Southwest', 'North & East', 'North & West', 'South & East', 'South & West', 'West & Central', 'All Regions']
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  contactPerson: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    }
  },
  businessHours: {
    openTime: {
      type: String,
      default: '09:00'
    },
    closeTime: {
      type: String,
      default: '18:00'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  },
  siteType: {
    type: String,
    enum: ['Mall', 'Cinema', 'Corporate Office', 'Convention Center', 'Hotel', 'Restaurant', 'Educational Institute', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Under Maintenance'],
    default: 'Active'
  },
  
  // Auditoriums - Core feature for the correlated system
  auditoriums: [auditoriumSchema],
  
  // Calculated fields
  totalProjectors: {
    type: Number,
    default: 0
  },
  activeProjectors: {
    type: Number,
    default: 0
  },
  totalAuditoriums: {
    type: Number,
    default: 0
  },
  
  // Service tracking
  lastServiceDate: {
    type: Date
  },
  nextScheduledService: {
    type: Date
  },
  
  // Contract details
  contractDetails: {
    contractNumber: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    contractValue: {
      type: Number,
      min: 0
    },
    serviceLevel: {
      type: String,
      enum: ['Basic', 'Standard', 'Premium'],
      default: 'Standard'
    }
  },
  
  notes: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
siteSchema.index({ 'address.city': 1 });
siteSchema.index({ siteType: 1 });
siteSchema.index({ status: 1 });
siteSchema.index({ 'contactPerson.email': 1 });
siteSchema.index({ region: 1 });
siteSchema.index({ state: 1 });
siteSchema.index({ siteCode: 1 });
siteSchema.index({ 'auditoriums.audiNumber': 1 });

// Virtual for full address
siteSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
});

// Virtual for contract status
siteSchema.virtual('contractStatus').get(function() {
  if (!this.contractDetails.endDate) return 'No Contract';
  
  const now = new Date();
  const endDate = new Date(this.contractDetails.endDate);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);
  
  if (endDate < now) {
    return 'Expired';
  } else if (endDate < threeMonthsFromNow) {
    return 'Expiring Soon';
  } else {
    return 'Active';
  }
});

// Pre-save middleware to update calculated fields
siteSchema.pre('save', async function(next) {
  // Calculate total auditoriums
  this.totalAuditoriums = this.auditoriums ? this.auditoriums.length : 0;
  
  // Don't calculate projector counts here - let the API handle it
  // This avoids circular dependency issues with projector post-save hooks
  
  next();
});

// Method to add auditorium
siteSchema.methods.addAuditorium = function(audiData) {
  const audiNumber = `AUDI-${String(this.auditoriums.length + 1).padStart(2, '0')}`;
  const newAuditorium = {
    ...audiData,
    audiNumber: audiData.audiNumber || audiNumber
  };
  
  this.auditoriums.push(newAuditorium);
  return this.save();
};

// Method to update projector count for an auditorium
siteSchema.methods.updateAuditoriumProjectorCount = function(audiNumber, count) {
  const auditorium = this.auditoriums.find(audi => audi.audiNumber === audiNumber);
  if (auditorium) {
    auditorium.projectorCount = count;
    return this.save();
  }
  throw new Error(`Auditorium ${audiNumber} not found`);
};

// Method to get auditorium by number
siteSchema.methods.getAuditorium = function(audiNumber) {
  return this.auditoriums.find(audi => audi.audiNumber === audiNumber);
};

siteSchema.set('toJSON', { virtuals: true });
siteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Site', siteSchema);