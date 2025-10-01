const mongoose = require('mongoose');

const serviceVisitSchema = new mongoose.Schema({
  visitId: {
    type: String,
    required: true,
    unique: true,
    default: () => `VISIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  fseId: {
    type: String,
    required: true,
    ref: 'FSE'
  },
  fseName: {
    type: String,
    required: true
  },
  siteId: {
    type: String,
    required: true,
    ref: 'Site'
  },
  siteName: {
    type: String,
    required: true
  },
  siteAddress: {
    type: String,
    trim: true
  },
  projectorSerial: {
    type: String,
    required: true,
    ref: 'Projector'
  },
  projectorModel: {
    type: String,
    required: true,
    trim: true
  },
  visitType: {
    type: String,
    enum: ['Scheduled Maintenance', 'Emergency Repair', 'Installation', 'Calibration', 'Inspection', 'Training', 'AMC Service 1', 'AMC Service 2'],
    required: true
  },
  amcContractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AMCContract'
  },
  amcServiceInterval: {
    type: String,
    enum: ['First Service', 'Second Service', 'Outside AMC'],
    default: 'Outside AMC'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  actualDate: {
    type: Date
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Unable to Complete'],
    default: 'Scheduled'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  description: {
    type: String
  },
  unableToCompleteReason: {
    type: String,
    maxlength: 1000
  },
  unableToCompleteCategory: {
    type: String,
    enum: ['Missing Parts', 'Equipment Failure', 'Access Issues', 'Customer Request', 'Safety Concerns', 'Technical Complexity', 'Other'],
    default: 'Other'
  },
  workPerformed: {
    type: String
  },
  partsUsed: [{
    partNumber: String,
    partName: String,
    quantity: Number,
    cost: Number
  }],
  totalCost: {
    type: Number,
    default: 0
  },
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  
  // NEW: Photo-First Workflow Status Tracking
  workflowStatus: {
    photosCaptured: {
      type: Boolean,
      default: false
    },
    serviceCompleted: {
      type: Boolean,
      default: false
    },
    reportGenerated: {
      type: Boolean,
      default: false
    },
    signatureCaptured: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // ENHANCED: Photo Categories for Photo-First Workflow
  photoCategories: {
    beforeService: [{
      filename: String,
      originalName: String,
      path: String,
      cloudUrl: String,
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      description: String,
      fileSize: Number,
      mimeType: String,
      cloudinaryData: {
        assetId: String,
        versionId: String,
        signature: String,
        format: String,
        width: Number,
        height: Number
      }
    }],
    duringService: [{
      filename: String,
      originalName: String,
      path: String,
      cloudUrl: String,
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      description: String,
      fileSize: Number,
      mimeType: String,
      cloudinaryData: {
        assetId: String,
        versionId: String,
        signature: String,
        format: String,
        width: Number,
        height: Number
      }
    }],
    afterService: [{
      filename: String,
      originalName: String,
      path: String,
      cloudUrl: String,
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      description: String,
      fileSize: Number,
      mimeType: String,
      cloudinaryData: {
        assetId: String,
        versionId: String,
        signature: String,
        format: String,
        width: Number,
        height: Number
      }
    }],
    issuesFound: [{
      filename: String,
      originalName: String,
      path: String,
      cloudUrl: String,
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      description: String,
      fileSize: Number,
      mimeType: String,
      cloudinaryData: {
        assetId: String,
        versionId: String,
        signature: String,
        format: String,
        width: Number,
        height: Number
      }
    }],
    partsUsed: [{
      filename: String,
      originalName: String,
      path: String,
      cloudUrl: String,
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      description: String,
      fileSize: Number,
      mimeType: String,
      cloudinaryData: {
        assetId: String,
        versionId: String,
        signature: String,
        format: String,
        width: Number,
        height: Number
      }
    }]
  },

  // NEW: Digital Signature Capture
  digitalSignature: {
    siteInCharge: {
      name: String,
      designation: String,
      signature: String, // Base64 encoded signature
      timestamp: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    fse: {
      name: String,
      signature: String, // Base64 encoded signature
      timestamp: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      }
    }
  },

  // NEW: Site In-Charge Information
  siteInCharge: {
    name: String,
    phone: String,
    email: String,
    designation: String,
    department: String
  },

  // LEGACY: Keep existing photos array for backward compatibility
  photos: [{
    filename: String,
    originalName: String,
    path: String,
    cloudUrl: String, // Cloudinary URL
    publicId: String, // Cloudinary public ID
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String,
    category: {
      type: String,
      enum: [
        'Before Service', 'During Service', 'After Service', 'Spare Parts', 'RMA', 'Issue Found', 'Parts Used', 'Service Photos', 'Other',
        'BEFORE', 'DURING', 'AFTER', 'ISSUE', 'PARTS'  // Frontend categories
      ]
    },
    fileSize: Number,
    mimeType: String,
    cloudinaryData: {
      assetId: String,
      versionId: String,
      signature: String,
      format: String,
      width: Number,
      height: Number
    }
  }],
  issuesFound: {
    type: [{
      description: String,
      severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical']
      },
      resolved: {
        type: Boolean,
        default: false
      }
    }],
    default: [],
    set: function(value) {
      // Handle case where frontend sends empty string or null
      if (value === "" || value === null || value === undefined) {
        return [];
      }
      // If it's already an array, return as is
      if (Array.isArray(value)) {
        return value;
      }
      // If it's a string, convert to array with single object
      if (typeof value === 'string' && value.trim() !== '') {
        return [{
          description: value.trim(),
          severity: 'Medium',
          resolved: false
        }];
      }
      // Default to empty array
      return [];
    }
  },
  recommendations: {
    type: [{
      description: String,
      priority: {
        type: String,
        enum: ['Low', 'Medium', 'High']
      }
    }],
    default: [],
    set: function(value) {
      // Handle case where frontend sends empty string or null
      if (value === "" || value === null || value === undefined) {
        return [];
      }
      // If it's already an array, return as is
      if (Array.isArray(value)) {
        return value;
      }
      // If it's a string, convert to array with single object
      if (typeof value === 'string' && value.trim() !== '') {
        return [{
          description: value.trim(),
          priority: 'Medium'
        }];
      }
      // Default to empty array
      return [];
    }
  },
  nextVisitDate: {
    type: Date
  },
  travelDistance: {
    type: Number
  },
  travelTime: {
    type: Number
  },
  expenses: {
    fuel: Number,
    food: Number,
    accommodation: Number,
    other: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// NEW: Pre-save middleware to update workflow status and clean data
serviceVisitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Clean up recommendations field - ensure it's always an array (handled by setter now)
  if (!Array.isArray(this.recommendations)) {
    this.recommendations = [];
  }
  
  // Clean up issuesFound field - ensure it's always an array (handled by setter now)
  if (!Array.isArray(this.issuesFound)) {
    this.issuesFound = [];
  }
  
  // Auto-update workflow status based on completion
  if (this.workflowStatus) {
    this.workflowStatus.lastUpdated = new Date();
    
    // Check if all workflow steps are completed
    const allStepsComplete = 
      this.workflowStatus.photosCaptured &&
      this.workflowStatus.serviceCompleted &&
      this.workflowStatus.reportGenerated &&
      this.workflowStatus.signatureCaptured;
    
    if (allStepsComplete && !this.workflowStatus.completed) {
      this.workflowStatus.completed = true;
      this.status = 'Completed';
    }
  }
  
  next();
});

// NEW: Instance method to check if photos are required
serviceVisitSchema.methods.arePhotosRequired = function() {
  return !this.workflowStatus.photosCaptured;
};

// NEW: Instance method to check if signature is required
serviceVisitSchema.methods.isSignatureRequired = function() {
  return this.workflowStatus.serviceCompleted && 
         this.workflowStatus.reportGenerated && 
         !this.workflowStatus.signatureCaptured;
};

// NEW: Instance method to get workflow progress percentage
serviceVisitSchema.methods.getWorkflowProgress = function() {
  const steps = [
    this.workflowStatus.photosCaptured,
    this.workflowStatus.serviceCompleted,
    this.workflowStatus.reportGenerated,
    this.workflowStatus.signatureCaptured
  ];
  
  const completedSteps = steps.filter(step => step).length;
  return Math.round((completedSteps / steps.length) * 100);
};

// Database indexes for better performance
serviceVisitSchema.index({ status: 1, actualDate: 1 });
serviceVisitSchema.index({ unableToCompleteCategory: 1 });
serviceVisitSchema.index({ fseId: 1, status: 1 });
serviceVisitSchema.index({ siteId: 1, status: 1 });
serviceVisitSchema.index({ projectorSerial: 1, status: 1 });
serviceVisitSchema.index({ scheduledDate: 1, status: 1 });
serviceVisitSchema.index({ visitType: 1, status: 1 });
serviceVisitSchema.index({ createdAt: 1 });
serviceVisitSchema.index({ updatedAt: 1 });

module.exports = mongoose.model('ServiceVisit', serviceVisitSchema); 