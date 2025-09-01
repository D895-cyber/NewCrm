const mongoose = require('mongoose');

const projectorSchema = new mongoose.Schema({
  projectorNumber: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  
  // Core relationships - Site and Auditorium
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
  
  // Installation details
  installDate: {
    type: Date,
    required: true
  },
  warrantyEnd: {
    type: Date,
    required: true
  },
  
  // Status and condition
  status: {
    type: String,
    enum: ['Active', 'Under Service', 'Inactive', 'Needs Repair'],
    default: 'Active'
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Needs Repair'],
    default: 'Good'
  },
  
  // Service tracking
  lastService: {
    type: Date
  },
  nextService: {
    type: Date
  },
  totalServices: {
    type: Number,
    default: 0
  },
  hoursUsed: {
    type: Number,
    default: 0
  },
  expectedLife: {
    type: Number,
    default: 10000
  },
  
  // AMC Contract link
  amcContractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AMCContract'
  },
  
  // Performance metrics
  uptime: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Maintenance history
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    technician: String,
    cost: Number
  }],
  
  // Location details within auditorium
  position: {
    type: String,
    trim: true
  },
  rackPosition: {
    type: String,
    trim: true
  },
  
  // Enhanced status tracking
  lastMaintenance: {
    date: Date,
    type: String,
    technician: String,
    notes: String
  },
  nextMaintenance: {
    date: Date,
    type: String,
    estimatedCost: Number
  },
  
  // RMA tracking
  lastRMA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RMA'
  },
  totalRMAs: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster searches
projectorSchema.index({ siteId: 1 });
projectorSchema.index({ siteName: 1 });
projectorSchema.index({ siteCode: 1 });
projectorSchema.index({ auditoriumId: 1 });
projectorSchema.index({ status: 1 });
projectorSchema.index({ amcContractId: 1 });
projectorSchema.index({ serialNumber: 1 });
projectorSchema.index({ projectorNumber: 1 });
projectorSchema.index({ lastRMA: 1 });
projectorSchema.index({ uptime: -1 });
projectorSchema.index({ 'lastMaintenance.date': -1 });
projectorSchema.index({ 'nextMaintenance.date': 1 });

// Virtual for warranty status
projectorSchema.virtual('warrantyStatus').get(function() {
  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);
  
  if (this.warrantyEnd < now) {
    return 'Expired';
  } else if (this.warrantyEnd < threeMonthsFromNow) {
    return 'Expiring Soon';
  } else {
    return 'Active';
  }
});

// Virtual for life percentage
projectorSchema.virtual('lifePercentage').get(function() {
  if (!this.hoursUsed || !this.expectedLife) return 0;
  return Math.round((this.hoursUsed / this.expectedLife) * 100);
});

// Virtual for AMC status
projectorSchema.virtual('amcStatus').get(function() {
  if (!this.amcContractId) return 'No AMC';
  return 'AMC Active'; // This will be populated from AMC contract
});

projectorSchema.set('toJSON', { virtuals: true });
projectorSchema.set('toObject', { virtuals: true });

// Pre-save hook to validate site and auditorium exist
projectorSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('siteId')) {
      const Site = mongoose.model('Site');
      const siteExists = await Site.findById(this.siteId);
      if (!siteExists) {
        throw new Error(`Site with ID ${this.siteId} does not exist. Please add the site first.`);
      }
      
      // Validate auditorium exists in the site
      const auditorium = siteExists.getAuditorium(this.auditoriumId);
      if (!auditorium) {
        throw new Error(`Auditorium ${this.auditoriumId} does not exist in site ${siteExists.name}. Please add the auditorium first.`);
      }
      
      // Auto-populate site details
      this.siteName = siteExists.name;
      this.siteCode = siteExists.siteCode;
      this.auditoriumName = auditorium.name;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save hook to update auditorium projector count
projectorSchema.post('save', async function(doc) {
  try {
    const Site = mongoose.model('Site');
    const site = await Site.findById(doc.siteId);
    if (site) {
      // Count projectors in this auditorium
      const Projector = mongoose.model('Projector');
      const projectorCount = await Projector.countDocuments({
        siteId: doc.siteId,
        auditoriumId: doc.auditoriumId
      });
      
      // Update auditorium projector count
      await site.updateAuditoriumProjectorCount(doc.auditoriumId, projectorCount);
    }
  } catch (error) {
    console.error('Error updating auditorium projector count:', error);
  }
});

module.exports = mongoose.model('Projector', projectorSchema);