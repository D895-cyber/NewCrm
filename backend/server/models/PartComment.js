const mongoose = require('mongoose');

const partCommentSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: true,
    index: true
  },
  partNumber: {
    type: String,
    required: true,
    index: true
  },
  siteId: {
    type: String,
    required: true,
    index: true
  },
  siteName: {
    type: String,
    required: true,
    index: true
  },
  rmaId: {
    type: String,
    index: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  commentType: {
    type: String,
    enum: ['status_update', 'issue_note', 'resolution', 'escalation', 'general'],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  author: {
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      index: true
    }
  },
  isInternal: {
    type: Boolean,
    default: false,
    index: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    index: true
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  metadata: {
    previousStatus: String,
    newStatus: String,
    costImpact: Number,
    estimatedResolutionDate: Date,
    vendorInfo: {
      name: String,
      contact: String,
      reference: String
    }
  }
}, {
  timestamps: true,
  collection: 'part_comments'
});

// Indexes for efficient querying
partCommentSchema.index({ partName: 1, siteId: 1, createdAt: -1 });
partCommentSchema.index({ siteId: 1, createdAt: -1 });
partCommentSchema.index({ commentType: 1, priority: 1 });
partCommentSchema.index({ 'author.userId': 1, createdAt: -1 });
partCommentSchema.index({ status: 1, isInternal: 1 });

// Virtual for formatted timestamp
partCommentSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for time ago
partCommentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
});

// Method to get comment summary
partCommentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    comment: this.comment.length > 100 ? this.comment.substring(0, 100) + '...' : this.comment,
    author: this.author.name,
    role: this.author.role,
    timestamp: this.createdAt,
    timeAgo: this.timeAgo,
    commentType: this.commentType,
    priority: this.priority,
    isInternal: this.isInternal
  };
};

// Static method to get comments for a part at a site
partCommentSchema.statics.getPartSiteComments = function(partName, partNumber, siteId, options = {}) {
  const query = {
    partName,
    partNumber,
    siteId,
    status: 'active'
  };

  if (options.includeInternal === false) {
    query.isInternal = false;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get latest comment for a part at a site
partCommentSchema.statics.getLatestPartSiteComment = function(partName, partNumber, siteId) {
  return this.findOne({
    partName,
    partNumber,
    siteId,
    status: 'active'
  }).sort({ createdAt: -1 });
};

// Static method to get comment statistics
partCommentSchema.statics.getCommentStats = function(filters = {}) {
  const matchStage = { status: 'active' };
  
  if (filters.partName) matchStage.partName = filters.partName;
  if (filters.siteId) matchStage.siteId = filters.siteId;
  if (filters.commentType) matchStage.commentType = filters.commentType;
  if (filters.priority) matchStage.priority = filters.priority;
  if (filters.dateFrom || filters.dateTo) {
    matchStage.createdAt = {};
    if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        byType: {
          $push: {
            type: '$commentType',
            priority: '$priority'
          }
        },
        byPriority: {
          $push: '$priority'
        },
        latestComment: { $max: '$createdAt' }
      }
    }
  ]);
};

module.exports = mongoose.model('PartComment', partCommentSchema);




