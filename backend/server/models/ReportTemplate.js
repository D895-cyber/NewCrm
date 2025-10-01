const mongoose = require('mongoose');

const ReportTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  reportType: { type: String, trim: true },
  description: { type: String, trim: true },
  version: { type: String, trim: true },
  storage: {
    cloudUrl: { type: String, required: true },
    publicId: { type: String, trim: true },
    bytes: { type: Number }
  },
  isDefault: { type: Boolean, default: false },
  fields: [{
    key: { type: String, trim: true },
    label: { type: String, trim: true }
  }],
  fieldMappings: [{
    token: { type: String, trim: true },
    dataPath: { type: String, trim: true },
    defaultValue: { type: String, trim: true }
  }],
  uploadedBy: { type: String, trim: true },
  metadata: { type: Map, of: String }
}, { timestamps: true });

module.exports = mongoose.model('ReportTemplate', ReportTemplateSchema);

