const mongoose = require('mongoose');

const RequestedBySchema = new mongoose.Schema({
  userId: { type: String },
  name: { type: String, trim: true },
  role: { type: String, trim: true }
}, { _id: false });

const RecommendedSparePartSchema = new mongoose.Schema({
  reportId: { type: String, required: true },
  visitId: { type: String },
  siteId: { type: String },
  projectorSerial: { type: String },

  partName: { type: String, required: true, trim: true },
  partNumber: { type: String, trim: true },
  quantity: { type: Number, default: 1, min: 1 },
  notes: { type: String, trim: true },

  status: { 
    type: String, 
    enum: ['New', 'Reviewed', 'Approved', 'Ordered', 'Issued', 'Rejected', 'Archived'],
    default: 'New'
  },

  requestedBy: RequestedBySchema
}, { timestamps: true });

module.exports = mongoose.model('RecommendedSparePart', RecommendedSparePartSchema);

