const mongoose = require('mongoose');

const fseSchema = new mongoose.Schema({
  fseId: {
    type: String,
    required: true,
    unique: true,
    default: () => `FSE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    default: 'Field Service Engineer'
  },
  specialization: [{
    type: String,
    enum: ['Projector Installation', 'Maintenance', 'Repair', 'Calibration', 'Network Setup', 'Software Installation']
  }],
  assignedTerritory: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'On Duty'],
    default: 'Active'
  },
  experience: {
    type: Number,
    default: 0
  },
  certifications: [{
    name: String,
    issuer: String,
    validUntil: Date
  }],
  supervisor: {
    name: String,
    email: String,
    phone: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
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

fseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('FSE', fseSchema); 