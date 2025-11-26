const mongoose = require('mongoose');

// Schema for checklist items with Status and YES/NO-OK columns
const checklistItemSchema = new mongoose.Schema({
  status: { type: String, default: '' },
  yesNoOk: { type: String, default: '' }
}, { _id: false });

const ascompReportSchema = new mongoose.Schema({
  // Header Information
  reportNumber: { type: String, required: true, unique: true },
  reportType: { type: String, default: 'EW - Preventive Maintenance Report' },
  date: { type: Date, required: true },
  
  // Cinema Details
  cinemaName: { type: String, required: true },
  address: { type: String, default: '' },
  contactDetails: { type: String, default: '' },
  location: { type: String, default: '' },
  
  // Serial Information
  serialNumber: { type: String },
  equipAndEWServiceVisit: { type: String },
  projectorModelSerialAndHours: { type: String },
  replacementRequired: { type: Boolean, default: false },
  
  // ==================== PAGE 1: CHECKLIST TABLE ====================
  
  // OPTICALS Section
  opticals: {
    reflector: checklistItemSchema,
    uvFilter: checklistItemSchema,
    integratorRod: checklistItemSchema,
    coldMirror: checklistItemSchema,
    foldMirror: checklistItemSchema
  },
  
  // ELECTRONICS Section
  electronics: {
    touchPanel: checklistItemSchema,
    evbAndImcbBoard: checklistItemSchema,
    pibAndIcpBoard: checklistItemSchema,
    imb2Board: checklistItemSchema
  },
  
  // Serial Number Verified
  serialNumberVerified: {
    chassisLabelVsTouchPanel: checklistItemSchema
  },
  
  // Disposable Consumables
  disposableConsumables: {
    airIntakeLadAndRad: checklistItemSchema
  },
  
  // Coolant Section
  coolant: {
    levelAndColor: checklistItemSchema,
    white: checklistItemSchema,
    red: checklistItemSchema
  },
  
  // Light Engine Test Pattern
  lightEngineTestPattern: {
    green: checklistItemSchema,
    blue: checklistItemSchema,
    black: checklistItemSchema
  },
  
  // MECHANICAL Section
  mechanical: {
    acBlowerAndVaneSwitch: checklistItemSchema,
    extractorVaneSwitch: checklistItemSchema,
    exhaustCfmValue: checklistItemSchema,
    lightEngineFansWithLadFan: checklistItemSchema,
    cardCageTopAndBottomFans: checklistItemSchema,
    radiatorFanAndPump: checklistItemSchema,
    connectorAndHoseForPump: checklistItemSchema,
    securityAndLampHouseLockSwitch: checklistItemSchema
  },
  
  // Lamp LOC Mechanism
  lampLocMechanism: {
    xAndZMovement: checklistItemSchema
  },
  
  // ==================== PAGE 2: DETAILED INFORMATION ====================
  
  // Projector Placement
  projectorPlacementRoomAndEnvironment: { type: String },
  
  // Lamp Information
  lampInfo: {
    makeAndModel: { type: String },
    numberOfLampsRunning: { type: Number },
    currentLampRunningHours: { type: Number }
  },
  
  // Voltage Parameters
  voltageParameters: {
    pVsN: { type: String },
    pVsE: { type: String },
    nVsE: { type: String }
  },
  
  // fL measurements
  flMeasurements: { type: String },
  
  // Content Player Model
  contentPlayerModel: { type: String },
  
  // AC Status
  acStatus: { 
    type: String, 
    enum: ['Working', 'Not Working', 'Not Available', ''],
    default: ''
  },
  
  // LE Status during PM
  leStatusDuringPM: { 
    type: String,
    enum: ['Removed', 'Not removed - Good fL', 'Not removed - DE bonded', ''],
    default: ''
  },
  
  // Remarks and LE S. No.
  remarks: { type: String },
  leSNo: { type: String },
  
  // Software Version Table
  softwareVersion: {
    w2k4k: {
      mcgd: { type: String, default: '' },
      fl: { type: String, default: '' },
      x: { type: String, default: '' },
      y: { type: String, default: '' }
    },
    r2k4k: {
      mcgd: { type: String, default: '' },
      fl: { type: String, default: '' },
      x: { type: String, default: '' },
      y: { type: String, default: '' }
    },
    g2k4k: {
      mcgd: { type: String, default: '' },
      fl: { type: String, default: '' },
      x: { type: String, default: '' },
      y: { type: String, default: '' }
    }
  },
  
  // Screen Information in metres
  screenInformation: {
    scope: {
      height: { type: String, default: '' },
      width: { type: String, default: '' },
      gain: { type: String, default: '' }
    },
    flat: {
      height: { type: String, default: '' },
      width: { type: String, default: '' },
      gain: { type: String, default: '' }
    },
    screenMake: { type: String },
    throwDistance: { type: String }
  },
  
  // Image Evaluation (OK - Yes/No column)
  imageEvaluation: {
    focusBoresight: { type: String, default: '' },
    integratorPosition: { type: String, default: '' },
    spotOnScreenAfterIPM: { type: String, default: '' },
    croppingScreenEdges6x31AndScope: { type: String, default: '' },
    convergenceChecked: { type: String, default: '' },
    channelsCheckedScopeFlatAlternative: { type: String, default: '' },
    pixelDefects: { type: String, default: '' },
    excessiveImageVibration: { type: String, default: '' },
    liteLoc: { type: String, default: '' }
  },
  
  // CIE XYZ Color Accuracy Test Pattern
  cieXyzColorAccuracy: {
    bwStep: {
      x: { type: String, default: '' },
      y: { type: String, default: '' },
      fl: { type: String, default: '' }
    },
    _10_2k4k: {
      x: { type: String, default: '' },
      y: { type: String, default: '' },
      fl: { type: String, default: '' }
    }
  },
  
  // Air Pollution Level
  airPollutionLevel: {
    hcho: { type: String, default: '' },
    tvoc: { type: String, default: '' },
    pm10: { type: String, default: '' },
    pm25: { type: String, default: '' },
    pm10_full: { type: String, default: '' },
    temperature: { type: String, default: '' },
    humidityPercent: { type: String, default: '' }
  },
  
  // Signatures
  clientSignatureAndStamp: {
    signatureUrl: { type: String },
    stampUrl: { type: String },
    signatureData: { type: String }, // Base64 for canvas signature
    date: { type: Date }
  },
  
  engineerSignature: {
    signatureUrl: { type: String },
    signatureData: { type: String }, // Base64 for canvas signature
    name: { type: String },
    date: { type: Date }
  },
  
  // Engineer/FSE Information
  engineer: {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Original PDF uploaded from bulk import or manual upload
  originalPdfReport: {
    filename: { type: String },
    originalName: { type: String },
    cloudUrl: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: { 
      type: String, 
      enum: ['drive', 'manual_upload', 'bulk_import'],
      default: 'manual_upload'
    },
    driveLink: { type: String }, // Original Google Drive link if applicable
    fileSize: { type: Number },
    mimeType: { type: String }
  },
  
  // Generated PDF/DOC files
  generatedPdfReport: {
    filename: { type: String },
    cloudUrl: { type: String },
    publicId: { type: String },
    generatedAt: { type: Date }
  },
  
  generatedDocReport: {
    filename: { type: String },
    cloudUrl: { type: String },
    publicId: { type: String },
    generatedAt: { type: Date }
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Reviewed', 'Approved'],
    default: 'Draft'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: { type: Date }
  
}, {
  timestamps: true
});

// Indexes
ascompReportSchema.index({ reportNumber: 1 });
ascompReportSchema.index({ cinemaName: 1 });
ascompReportSchema.index({ date: -1 });
ascompReportSchema.index({ 'engineer.userId': 1 });
ascompReportSchema.index({ status: 1 });

// Pre-save hook to generate report number if not provided
ascompReportSchema.pre('save', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Count reports this month
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });
    
    this.reportNumber = `ASCOMP-EW-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ASCOMPReport', ascompReportSchema);

