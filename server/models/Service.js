const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    unique: true,
    trim: true
  },
  projectorSerial: {
    type: String,
    required: true,
    ref: 'Projector'
  },
  siteName: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'AMC Service 1',           // First AMC service after warranty start
      'AMC Service 2',           // Second AMC service (3-5 months later)
      'Special Service',          // Convergence, spare part replacement
      'Emergency Repair',         // Urgent repairs
      'Urgent Repair',            // Urgent repairs (alternative name)
      'Lamp Replacement',
      'Filter Cleaning',
      'Calibration',
      'Installation Service',
      'Preventive Maintenance'    // Regular maintenance
    ],
    trim: true
  },
  amcPeriod: {
    type: String,
    enum: ['AMC Period 1', 'AMC Period 2', 'Outside AMC'],
    default: 'Outside AMC'
  },
  technician: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  recommendations: {
    spareParts: [{
      partNumber: String,
      partName: String,
      reason: String,
      priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      }
    }],
    rmaParts: [{
      partNumber: String,
      partName: String,
      issue: String,
      priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      }
    }]
  },
  cost: {
    type: Number,
    min: 0
  },
  hours: {
    type: Number,
    min: 0
  },
  nextServiceDate: {
    type: Date
  },
  warrantyStatus: {
    type: String,
    enum: ['Under Warranty', 'AMC Active', 'Expired'],
    default: 'Under Warranty'
  }
}, {
  timestamps: true
});

// Generate serviceId before saving
serviceSchema.pre('save', function(next) {
  if (!this.serviceId) {
    this.serviceId = `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Indexes for faster queries
serviceSchema.index({ projectorSerial: 1 });
serviceSchema.index({ date: -1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ technician: 1 });
serviceSchema.index({ type: 1 });
serviceSchema.index({ amcPeriod: 1 });

// Auto-generate service ID
serviceSchema.pre('save', async function(next) {
  try {
    if (!this.serviceId) {
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        // Get the highest service ID number to avoid duplicates
        const lastService = await mongoose.model('Service').findOne({}, {}, { sort: { 'serviceId': -1 } });
        let nextNumber = 1;
        
        if (lastService && lastService.serviceId) {
          const match = lastService.serviceId.match(/SRV-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
        
        const proposedServiceId = `SRV-${String(nextNumber).padStart(3, '0')}`;
        
        // Check if this ID already exists
        const existingService = await mongoose.model('Service').findOne({ serviceId: proposedServiceId });
        if (!existingService) {
          this.serviceId = proposedServiceId;
          break;
        }
        
        attempts++;
        // Small delay to avoid race conditions amd 
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      if (!this.serviceId) {
        throw new Error('Failed to generate unique service ID after multiple attempts');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Service', serviceSchema);