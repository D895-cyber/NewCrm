const mongoose = require('mongoose');

// A flexible, structured schema that mirrors the ASCOMP service report template
const KeyValueSchema = new mongoose.Schema({
  key: { type: String, trim: true },
  value: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const SectionItemSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  status: { type: String, trim: true, default: '-' },
  result: { type: String, trim: true, default: 'OK' },
  ok: { type: Boolean, default: true }
}, { _id: false });

const RecommendedPartSchema = new mongoose.Schema({
  partName: { type: String, trim: true },
  partNumber: { type: String, trim: true }
}, { _id: false });

const EngineerSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true }
}, { _id: false });

const SignatureSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  signedAt: { type: Date },
  dataURI: { type: String } // canvas signature or uploaded image
}, { _id: false });

const ColorMeasurementSchema = new mongoose.Schema({
  testPattern: { type: String, trim: true },
  fl: { type: String, trim: true },
  x: { type: String, trim: true },
  y: { type: String, trim: true }
}, { _id: false });

const ServiceReportSchema = new mongoose.Schema({
  // Report Header Information
  reportNumber: { type: String, trim: true, required: true },
  reportTitle: { type: String, trim: true, default: 'Projector Service Report' },
  reportType: { type: String, enum: ['First', 'Second', 'Third', 'Fourth', 'Emergency', 'Installation'], default: 'First' },
  date: { type: Date, default: Date.now },
  
  // Company Information
  companyName: { type: String, trim: true, default: 'ASCOMP INC.' },
  companyAddress: { type: String, trim: true, default: '9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064' },
  companyContact: {
    desk: { type: String, trim: true, default: '011-45501226' },
    mobile: { type: String, trim: true, default: '8882475207' },
    email: { type: String, trim: true, default: 'helpdesk@ascompinc.in' },
    website: { type: String, trim: true, default: 'WWW.ASCOMPINC.IN' }
  },
  
  // Site Information
  siteId: { type: String },
  visitId: { type: String }, // Link to service visit
  siteName: { type: String, trim: true, required: true },
  siteIncharge: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true }
  },
  
  // Projector Information
  projectorSerial: { type: String, required: true },
  projectorModel: { type: String, trim: true, required: true },
  brand: { type: String, trim: true, required: true },
  softwareVersion: { type: String, trim: true },
  projectorRunningHours: { type: String, trim: true },
  
  // Lamp Information
  lampModel: { type: String, trim: true },
  lampRunningHours: { type: String, trim: true },
  currentLampHours: { type: String, trim: true },
  replacementRequired: { type: Boolean, default: false },
  
  // Voltage Parameters
  voltageParameters: {
    pVsN: { type: String, trim: true },
    pVsE: { type: String, trim: true },
    nVsE: { type: String, trim: true }
  },
  
  // Lamp Power Measurements
  lampPowerMeasurements: {
    flBeforePM: { type: String, trim: true },
    flAfterPM: { type: String, trim: true }
  },
  
  // Air Pollution Level
  airPollutionLevel: {
    overall: { type: String, trim: true },
    hcho: { type: String, trim: true },
    tvoc: { type: String, trim: true },
    pm25: { type: String, trim: true }
  },
  
  // Environmental Conditions
  environmentalConditions: {
    temperature: { type: String, trim: true },
    humidity: { type: String, trim: true }
  },
  
  // Observations
  observations: [{ type: String, trim: true }],
  
  // Engineer Information
  engineer: EngineerSchema,
  
  // Service Checklist Sections - EXACTLY as per ASCOMP format
  sections: {
    // OPTICALS Section
    opticals: [{
      description: { type: String, trim: true },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    }],
    
    // ELECTRONICS Section
    electronics: [{
      description: { type: String, trim: true },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    }],
    
    // Serial Number Verification
    serialNumberVerified: {
      description: { type: String, trim: true, default: 'Chassis label vs Touch Panel' },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    },
    
    // Disposable Consumables
    disposableConsumables: [{
      description: { type: String, trim: true },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    }],
    
    // Coolant
    coolant: {
      description: { type: String, trim: true, default: 'Level and Color' },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    },
    
    // Light Engine Test Patterns
    lightEngineTestPatterns: [{
      color: { type: String, trim: true },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    }],
    
    // MECHANICAL Section
    mechanical: [{
      description: { type: String, trim: true },
      status: { type: String, trim: true, default: '-' },
      result: { type: String, trim: true, default: 'OK' }
    }]
  },
  
  // Image Evaluation - EXACTLY as per ASCOMP format
  imageEvaluation: {
    focusBoresight: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    integratorPosition: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    spotOnScreen: { type: String, enum: ['Yes', 'No'], default: 'No' },
    screenCropping: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    convergenceChecked: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    channelsChecked: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    pixelDefects: { type: String, enum: ['Yes', 'No'], default: 'No' },
    imageVibration: { type: String, enum: ['Yes', 'No'], default: 'No' },
    liteLoc: { type: String, enum: ['Yes', 'No'], default: 'No' }
  },
  
  // Recommended Parts
  recommendedParts: [RecommendedPartSchema],
  
  // Measured Color Coordinates (MCGD)
  measuredColorCoordinates: [ColorMeasurementSchema],
  
  // CIE XYZ Color Accuracy
  cieColorAccuracy: [ColorMeasurementSchema],
  
  // Screen Information
  screenInfo: {
    scope: {
      height: { type: String, trim: true },
      width: { type: String, trim: true },
      gain: { type: String, trim: true }
    },
    flat: {
      height: { type: String, trim: true },
      width: { type: String, trim: true },
      gain: { type: String, trim: true }
    },
    screenMake: { type: String, trim: true },
    throwDistance: { type: String, trim: true }
  },
  
  // Voltage Parameters
  voltageParameters: {
    pVsN: { type: String, trim: true },
    pVsE: { type: String, trim: true },
    nVsE: { type: String, trim: true }
  },
  
  // Content Playing Server
  contentPlayingServer: { type: String, trim: true },
  
  // Lamp Power Measurements
  lampPowerMeasurements: {
    flBeforePM: { type: String, trim: true },
    flAfterPM: { type: String, trim: true }
  },
  
  // Environment Status
  environmentStatus: {
    projectorPlacement: { type: String, trim: true, default: 'ok' },
    room: { type: String, trim: true, default: 'ok' },
    environment: { type: String, trim: true, default: 'ok' }
  },
  
  // Observations and Remarks
  observations: [{
    number: { type: Number },
    description: { type: String, trim: true }
  }],
  
  // Air Pollution Level
  airPollutionLevel: {
    hcho: { type: String, trim: true },
    tvoc: { type: String, trim: true },
    pm1: { type: String, trim: true },
    pm25: { type: String, trim: true },
    pm10: { type: String, trim: true },
    overall: { type: String, trim: true }
  },
  
  // Environmental Conditions
  environmentalConditions: {
    temperature: { type: String, trim: true },
    humidity: { type: String, trim: true }
  },
  
  // System Status
  systemStatus: {
    leStatus: { type: String, trim: true },
    acStatus: { type: String, trim: true }
  },
  
  // Photos
  photos: [{
    filename: String,
    originalName: String,
    path: String,
    cloudUrl: String,
    publicId: String,
    description: String,
    category: String,
    beforeAfter: { 
      type: String, 
      enum: ['BEFORE', 'AFTER', 'DURING', 'Before Service', 'During Service', 'After Service', 'Issue Found', 'Parts Used', 'Spare Parts', 'RMA', 'Service Photos', 'Other'], 
      default: 'BEFORE' 
    }
  }],
  
  // Signatures
  signatures: {
    engineer: SignatureSchema,
    customer: SignatureSchema
  },
  
  // Additional Notes
  notes: { type: String, trim: true },
  
  // Original PDF Report (uploaded by FSE)
  originalPdfReport: {
    filename: String,
    originalName: String,
    cloudUrl: String,
    publicId: String,
    uploadedAt: Date,
    uploadedBy: String, // FSE ID or name
    fileSize: Number,
    mimeType: String
  },

  // System generated documents
  generatedDocReport: {
    filename: String,
    cloudUrl: String,
    publicId: String,
    generatedAt: Date,
    generatedBy: String,
    fileSize: Number
  },
  generatedPdfReport: {
    filename: String,
    cloudUrl: String,
    publicId: String,
    generatedAt: Date,
    generatedBy: String,
    fileSize: Number
  },
  
  // Metadata
  metadata: { type: [KeyValueSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('ServiceReport', ServiceReportSchema);

