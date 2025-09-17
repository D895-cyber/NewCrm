const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'UPDATE', 
      'DELETE',
      'UNABLE_TO_COMPLETE',
      'RESCHEDULE',
      'BULK_UPDATE',
      'BULK_RESCHEDULE',
      'EXPORT',
      'LOGIN',
      'LOGOUT'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['ServiceVisit', 'FSE', 'Site', 'Projector', 'User', 'System']
  },
  entityId: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'FSE'
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['Missing Parts', 'Equipment Failure', 'Access Issues', 'Customer Request', 'Safety Concerns', 'Technical Complexity', 'Other']
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });

// Static method to log actions
auditLogSchema.statics.logAction = async function(actionData) {
  try {
    const auditLog = new this(actionData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

// Instance method to get formatted log entry
auditLogSchema.methods.getFormattedLog = function() {
  return {
    id: this._id,
    action: this.action,
    entity: `${this.entityType}:${this.entityName}`,
    user: `${this.username} (${this.userRole})`,
    timestamp: this.timestamp,
    reason: this.reason,
    category: this.category,
    changes: this.changes,
    metadata: this.metadata
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
