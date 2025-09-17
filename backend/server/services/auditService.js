const AuditLog = require('../models/AuditLog');

class AuditService {
  async logUnableToComplete(serviceVisit, user, reason, category, req) {
    try {
      await AuditLog.logAction({
        action: 'UNABLE_TO_COMPLETE',
        entityType: 'ServiceVisit',
        entityId: serviceVisit._id.toString(),
        entityName: serviceVisit.visitId,
        userId: user.id || user._id || 'unknown',
        username: user.username || user.name || 'unknown',
        userRole: user.role || 'FSE',
        changes: {
          before: {
            status: serviceVisit.status,
            actualDate: serviceVisit.actualDate,
            endTime: serviceVisit.endTime
          },
          after: {
            status: 'Unable to Complete',
            actualDate: new Date(),
            endTime: new Date().toLocaleTimeString(),
            unableToCompleteReason: reason,
            unableToCompleteCategory: category
          }
        },
        reason: reason,
        category: category,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        sessionId: req?.sessionID,
        metadata: {
          siteName: serviceVisit.siteName,
          fseName: serviceVisit.fseName,
          projectorSerial: serviceVisit.projectorSerial,
          visitType: serviceVisit.visitType
        }
      });
    } catch (error) {
      console.error('Error logging unable to complete action:', error);
    }
  }

  async logBulkUnableToComplete(visitIds, user, reason, category, req) {
    try {
      await AuditLog.logAction({
        action: 'BULK_UPDATE',
        entityType: 'ServiceVisit',
        entityId: visitIds.join(','),
        entityName: `${visitIds.length} visits`,
        userId: user.id || user._id || 'unknown',
        username: user.username || user.name || 'unknown',
        userRole: user.role || 'FSE',
        changes: {
          before: { status: 'Various' },
          after: { 
            status: 'Unable to Complete',
            unableToCompleteReason: reason,
            unableToCompleteCategory: category
          }
        },
        reason: reason,
        category: category,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        sessionId: req?.sessionID,
        metadata: {
          visitCount: visitIds.length,
          operation: 'bulk_unable_to_complete'
        }
      });
    } catch (error) {
      console.error('Error logging bulk unable to complete action:', error);
    }
  }

  async logBulkReschedule(visitIds, user, newScheduledDate, reason, req) {
    try {
      await AuditLog.logAction({
        action: 'BULK_RESCHEDULE',
        entityType: 'ServiceVisit',
        entityId: visitIds.join(','),
        entityName: `${visitIds.length} visits`,
        userId: user.id || user._id || 'unknown',
        username: user.username || user.name || 'unknown',
        userRole: user.role || 'FSE',
        changes: {
          before: { status: 'Unable to Complete' },
          after: { 
            status: 'Scheduled',
            scheduledDate: newScheduledDate
          }
        },
        reason: reason,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        sessionId: req?.sessionID,
        metadata: {
          visitCount: visitIds.length,
          operation: 'bulk_reschedule',
          newScheduledDate: newScheduledDate
        }
      });
    } catch (error) {
      console.error('Error logging bulk reschedule action:', error);
    }
  }

  async logExport(user, format, entityType, filters, req) {
    try {
      await AuditLog.logAction({
        action: 'EXPORT',
        entityType: entityType,
        entityId: 'export',
        entityName: `${entityType} Export`,
        userId: user.id || user._id || 'unknown',
        username: user.username || user.name || 'unknown',
        userRole: user.role || 'FSE',
        changes: {
          before: null,
          after: { format: format, filters: filters }
        },
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        sessionId: req?.sessionID,
        metadata: {
          exportFormat: format,
          filters: filters,
          operation: 'data_export'
        }
      });
    } catch (error) {
      console.error('Error logging export action:', error);
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      const query = {};
      
      if (filters.action) query.action = filters.action;
      if (filters.entityType) query.entityType = filters.entityType;
      if (filters.userId) query.userId = filters.userId;
      if (filters.category) query.category = filters.category;
      if (filters.startDate && filters.endDate) {
        query.timestamp = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .skip(filters.skip || 0);

      return logs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async getAuditStats(filters = {}) {
    try {
      const matchQuery = {};
      
      if (filters.startDate && filters.endDate) {
        matchQuery.timestamp = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const stats = await AuditLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            unableToCompleteCount: {
              $sum: { $cond: [{ $eq: ['$action', 'UNABLE_TO_COMPLETE'] }, 1, 0] }
            },
            bulkOperationsCount: {
              $sum: { $cond: [{ $in: ['$action', ['BULK_UPDATE', 'BULK_RESCHEDULE']] }, 1, 0] }
            },
            exportCount: {
              $sum: { $cond: [{ $eq: ['$action', 'EXPORT'] }, 1, 0] }
            },
            uniqueUsers: { $addToSet: '$userId' },
            categoryBreakdown: {
              $push: {
                $cond: [
                  { $ne: ['$category', null] },
                  '$category',
                  null
                ]
              }
            }
          }
        },
        {
          $project: {
            totalActions: 1,
            unableToCompleteCount: 1,
            bulkOperationsCount: 1,
            exportCount: 1,
            uniqueUserCount: { $size: '$uniqueUsers' },
            categoryBreakdown: {
              $reduce: {
                input: '$categoryBreakdown',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $cond: [
                        { $ne: ['$$this', null] },
                        { $arrayToObject: [{ k: '$$this', v: 1 }] },
                        {}
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalActions: 0,
        unableToCompleteCount: 0,
        bulkOperationsCount: 0,
        exportCount: 0,
        uniqueUserCount: 0,
        categoryBreakdown: {}
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        totalActions: 0,
        unableToCompleteCount: 0,
        bulkOperationsCount: 0,
        exportCount: 0,
        uniqueUserCount: 0,
        categoryBreakdown: {}
      };
    }
  }
}

module.exports = new AuditService();
