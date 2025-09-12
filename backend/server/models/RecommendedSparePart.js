const mongoose = require('mongoose');

const RequestedBySchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: { type: String, trim: true },
  role: { type: String, trim: true }
}, { _id: false });

const RecommendedSparePartSchema = new mongoose.Schema({
  reportId: { type: String, index: true, required: true },
  visitId: { type: String, index: true },
  siteId: { type: String, index: true },
  projectorSerial: { type: String, index: true },

  partName: { type: String, required: true, trim: true },
  partNumber: { type: String, trim: true },
  quantity: { type: Number, default: 1, min: 1 },
  notes: { type: String, trim: true },

  status: { 
    type: String, 
    enum: ['New', 'Reviewed', 'Approved', 'Ordered', 'Issued', 'Rejected', 'Archived'],
    default: 'New',
    index: true
  },

  requestedBy: RequestedBySchema
}, { timestamps: true });

module.exports = mongoose.model('RecommendedSparePart', RecommendedSparePartSchema);

