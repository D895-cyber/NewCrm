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
  projectorSerial: {
    type: String,
    required: true,
    ref: 'Projector'
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
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'],
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
      enum: ['Before Service', 'During Service', 'After Service', 'Spare Parts', 'RMA', 'Issue Found', 'Parts Used', 'Other']
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
  issuesFound: [{
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
  recommendations: [{
    description: String,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    }
  }],
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

serviceVisitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ServiceVisit', serviceVisitSchema); 