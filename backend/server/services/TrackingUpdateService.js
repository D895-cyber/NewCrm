const cron = require('node-cron');
const DeliveryProviderService = require('./DeliveryProviderService');
const RMA = require('../models/RMA');
const NotificationService = require('./NotificationService');

class TrackingUpdateService {
  constructor() {
    this.deliveryProviderService = new DeliveryProviderService();
    this.isRunning = false;
    this.lastUpdate = null;
    this.updateStats = {
      total: 0,
      successful: 0,
      failed: 0,
      lastRun: null
    };
  }

  // Start the automated tracking update service
  start() {
    console.log('🚀 Starting automated tracking update service...');
    
    // Update every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.updateAllActiveShipments();
    });
    
    // Update every 2 hours for less critical shipments
    cron.schedule('0 */2 * * *', async () => {
      await this.updateAllShipments();
    });
    
    // Daily cleanup and reporting
    cron.schedule('0 0 * * *', async () => {
      await this.dailyCleanup();
    });
    
    console.log('✅ Automated tracking update service started');
  }

  // Stop the service
  stop() {
    console.log('🛑 Stopping automated tracking update service...');
    cron.destroy();
    console.log('✅ Automated tracking update service stopped');
  }

  // Update all active shipments
  async updateAllActiveShipments() {
    if (this.isRunning) {
      console.log('⏳ Tracking update already in progress, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🔄 Starting active shipments update...');
      
      const activeRMAs = await RMA.findActiveShipments();
      console.log(`📦 Found ${activeRMAs.length} active shipments to update`);
      
      let successful = 0;
      let failed = 0;
      
      for (const rma of activeRMAs) {
        try {
          await this.updateRMATracking(rma);
          successful++;
        } catch (error) {
          console.error(`❌ Error updating RMA ${rma.rmaNumber}:`, error.message);
          failed++;
        }
      }
      
      this.updateStats = {
        total: activeRMAs.length,
        successful,
        failed,
        lastRun: new Date()
      };
      
      this.lastUpdate = new Date();
      
      console.log(`✅ Active shipments update completed: ${successful} successful, ${failed} failed`);
      
      // Send summary notification if there were failures
      if (failed > 0) {
        await this.sendUpdateSummaryNotification(activeRMAs.length, successful, failed);
      }
      
    } catch (error) {
      console.error('❌ Error in active shipments update:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Update all shipments (including completed ones for final status)
  async updateAllShipments() {
    try {
      console.log('🔄 Starting comprehensive shipments update...');
      
      // Get all RMAs with tracking numbers
      const rmasWithTracking = await RMA.find({
        $or: [
          { 'shipping.outbound.trackingNumber': { $exists: true, $ne: '' } },
          { 'shipping.return.trackingNumber': { $exists: true, $ne: '' } }
        ]
      });
      
      console.log(`📦 Found ${rmasWithTracking.length} RMAs with tracking numbers`);
      
      let successful = 0;
      let failed = 0;
      
      for (const rma of rmasWithTracking) {
        try {
          await this.updateRMATracking(rma);
          successful++;
        } catch (error) {
          console.error(`❌ Error updating RMA ${rma.rmaNumber}:`, error.message);
          failed++;
        }
      }
      
      console.log(`✅ Comprehensive update completed: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error('❌ Error in comprehensive shipments update:', error);
    }
  }

  // Update tracking for a specific RMA
  async updateRMATracking(rma) {
    const trackingService = new DeliveryProviderService();
    let hasUpdates = false;
    
    // Update outbound tracking
    if (rma.shipping.outbound.trackingNumber && 
        rma.shipping.outbound.carrier &&
        !['delivered', 'exception', 'returned'].includes(rma.shipping.outbound.status)) {
      
      try {
        const outboundData = await trackingService.trackShipment(
          rma.shipping.outbound.trackingNumber,
          rma.shipping.outbound.carrier
        );
        
        if (outboundData.success && outboundData.status !== rma.shipping.outbound.status) {
          console.log(`📦 RMA ${rma.rmaNumber} outbound status: ${rma.shipping.outbound.status} -> ${outboundData.status}`);
          
          await rma.updateShippingStatus('outbound', outboundData.status, {
            estimatedDelivery: outboundData.estimatedDelivery,
            actualDelivery: outboundData.actualDelivery
          });
          
          // Add to tracking history
          await rma.addTrackingEvent({
            status: outboundData.status,
            location: outboundData.location,
            description: `Status updated to ${outboundData.status}`,
            carrier: rma.shipping.outbound.carrier,
            direction: 'outbound',
            trackingNumber: rma.shipping.outbound.trackingNumber,
            source: 'api'
          });
          
          hasUpdates = true;
          
          // Send notification for status change
          await this.sendStatusChangeNotification(rma, 'outbound', outboundData);
        }
      } catch (error) {
        console.error(`Error tracking outbound shipment for RMA ${rma.rmaNumber}:`, error);
      }
    }
    
    // Update return tracking
    if (rma.shipping.return.trackingNumber && 
        rma.shipping.return.carrier &&
        !['delivered', 'exception', 'returned'].includes(rma.shipping.return.status)) {
      
      try {
        const returnData = await trackingService.trackShipment(
          rma.shipping.return.trackingNumber,
          rma.shipping.return.carrier
        );
        
        if (returnData.success && returnData.status !== rma.shipping.return.status) {
          console.log(`📦 RMA ${rma.rmaNumber} return status: ${rma.shipping.return.status} -> ${returnData.status}`);
          
          await rma.updateShippingStatus('return', returnData.status, {
            estimatedDelivery: returnData.estimatedDelivery,
            actualDelivery: returnData.actualDelivery
          });
          
          // Add to tracking history
          await rma.addTrackingEvent({
            status: returnData.status,
            location: returnData.location,
            description: `Status updated to ${returnData.status}`,
            carrier: rma.shipping.return.carrier,
            direction: 'return',
            trackingNumber: rma.shipping.return.trackingNumber,
            source: 'api'
          });
          
          hasUpdates = true;
          
          // Send notification for status change
          await this.sendStatusChangeNotification(rma, 'return', returnData);
        }
      } catch (error) {
        console.error(`Error tracking return shipment for RMA ${rma.rmaNumber}:`, error);
      }
    }
    
    // Calculate SLA breach if there were updates
    if (hasUpdates) {
      await rma.calculateSLABreach();
    }
  }

  // Send notification for status changes
  async sendStatusChangeNotification(rma, direction, trackingData) {
    try {
      const notificationData = {
        type: 'tracking_update',
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        direction: direction,
        status: trackingData.status,
        trackingNumber: trackingData.trackingNumber,
        location: trackingData.location,
        description: trackingData.description,
        timestamp: new Date(),
        priority: this.getNotificationPriority(trackingData.status)
      };
      
      // Send notification based on priority
      if (notificationData.priority === 'high') {
        await NotificationService.sendImmediateNotification(notificationData);
      } else {
        await NotificationService.sendNotification(notificationData);
      }
      
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }

  // Send update summary notification
  async sendUpdateSummaryNotification(total, successful, failed) {
    try {
      const notificationData = {
        type: 'update_summary',
        total,
        successful,
        failed,
        timestamp: new Date(),
        priority: 'medium'
      };
      
      await NotificationService.sendNotification(notificationData);
      
    } catch (error) {
      console.error('Error sending update summary notification:', error);
    }
  }

  // Get notification priority based on status
  getNotificationPriority(status) {
    switch (status) {
      case 'delivered':
      case 'exception':
        return 'high';
      case 'out_for_delivery':
        return 'medium';
      default:
        return 'low';
    }
  }

  // Daily cleanup and reporting
  async dailyCleanup() {
    try {
      console.log('🧹 Starting daily cleanup...');
      
      // Clean up old tracking history (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await RMA.updateMany(
        {},
        {
          $pull: {
            trackingHistory: {
              timestamp: { $lt: thirtyDaysAgo }
            }
          }
        }
      );
      
      console.log(`🧹 Cleaned up old tracking history for ${result.modifiedCount} RMAs`);
      
      // Generate daily report
      await this.generateDailyReport();
      
      console.log('✅ Daily cleanup completed');
      
    } catch (error) {
      console.error('❌ Error in daily cleanup:', error);
    }
  }

  // Generate daily tracking report
  async generateDailyReport() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get statistics for today
      const stats = await RMA.aggregate([
        {
          $match: {
            'trackingHistory.timestamp': {
              $gte: today,
              $lt: tomorrow
            }
          }
        },
        {
          $unwind: '$trackingHistory'
        },
        {
          $match: {
            'trackingHistory.timestamp': {
              $gte: today,
              $lt: tomorrow
            }
          }
        },
        {
          $group: {
            _id: '$trackingHistory.status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const report = {
        date: today,
        totalUpdates: stats.reduce((sum, stat) => sum + stat.count, 0),
        statusBreakdown: stats,
        slaBreaches: await RMA.countDocuments({
          'sla.slaBreached': true,
          'sla.breachReason': { $regex: today.toISOString().split('T')[0] }
        })
      };
      
      console.log('📊 Daily tracking report:', report);
      
      // Send report notification
      await NotificationService.sendNotification({
        type: 'daily_report',
        data: report,
        timestamp: new Date(),
        priority: 'low'
      });
      
    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      updateStats: this.updateStats
    };
  }

  // Force update all active shipments (for manual trigger)
  async forceUpdate() {
    console.log('🔄 Force updating all active shipments...');
    await this.updateAllActiveShipments();
  }

  // Update specific RMA (for manual trigger)
  async updateSpecificRMA(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }
      
      await this.updateRMATracking(rma);
      console.log(`✅ Successfully updated RMA ${rma.rmaNumber}`);
      
    } catch (error) {
      console.error(`❌ Error updating RMA ${rmaId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const trackingUpdateService = new TrackingUpdateService();

module.exports = trackingUpdateService;

