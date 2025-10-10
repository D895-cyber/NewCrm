const RMA = require('../models/RMA');
const CommunicationService = require('./CommunicationService');
const DeliveryProviderService = require('./DeliveryProviderService');

class ReturnWorkflowService {
  constructor() {
    this.communicationService = new CommunicationService();
    this.deliveryService = new DeliveryProviderService();
  }

  // Initiate defective part return
  async initiateReturn(rmaId, returnData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Validate RMA status
      if (rma.caseStatus !== 'Replacement Received') {
        throw new Error('RMA must be in "Replacement Received" status to initiate return');
      }

      // Determine return path
      const returnPath = returnData.returnPath || 'via_ascomp'; // 'direct' or 'via_ascomp'
      
      // Update RMA with return information
      rma.caseStatus = 'Faulty Part Returned';
      rma.shipping.return = {
        ...rma.shipping.return,
        trackingNumber: returnData.trackingNumber,
        carrier: returnData.carrier,
        carrierService: returnData.carrierService || 'Standard',
        shippedDate: returnData.shippedDate || new Date(),
        status: 'in_transit',
        lastUpdated: new Date(),
        weight: returnData.weight,
        dimensions: returnData.dimensions,
        insuranceValue: returnData.insuranceValue,
        requiresSignature: returnData.requiresSignature || false
      };

      // Add return workflow tracking
      rma.returnWorkflow = {
        initiatedBy: returnData.initiatedBy || 'System',
        initiatedDate: new Date(),
        returnPath: returnPath,
        returnInstructions: returnData.instructions || this.generateReturnInstructions(returnPath),
        trackingNumber: returnData.trackingNumber,
        carrier: returnData.carrier,
        expectedDelivery: returnData.expectedDelivery
      };

      await rma.save();

      // Generate return label if needed
      if (returnData.generateLabel) {
        await this.generateReturnLabel(rma, returnData);
      }

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'Replacement Received',
        'Faulty Part Returned',
        returnData.initiatedBy || 'System',
        `Defective part return initiated via ${returnPath === 'direct' ? 'direct to CDS' : 'ASCOMP'}`
      );

      // Send return instructions
      await this.sendReturnInstructions(rma, returnPath);

      console.log(`✅ Return initiated for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error initiating return:', error);
      throw error;
    }
  }

  // Generate return instructions based on path
  generateReturnInstructions(returnPath) {
    if (returnPath === 'direct') {
      return {
        recipient: 'CDS (Christie Digital Systems)',
        address: 'CDS Return Address',
        instructions: [
          'Package defective part securely',
          'Include RMA number on package',
          'Use provided return label',
          'Send via specified carrier'
        ],
        contact: 'CDS Support Team'
      };
    } else {
      return {
        recipient: 'ASCOMP Office',
        address: 'ASCOMP Return Address',
        instructions: [
          'Package defective part securely',
          'Include RMA number on package',
          'Send to ASCOMP office first',
          'ASCOMP will forward to CDS',
          'Keep tracking number for reference'
        ],
        contact: 'ASCOMP Support Team'
      };
    }
  }

  // Generate return label
  async generateReturnLabel(rma, returnData) {
    try {
      // This would integrate with a shipping API to generate actual labels
      // For now, we'll create a mock label data structure
      const labelData = {
        rmaNumber: rma.rmaNumber,
        trackingNumber: returnData.trackingNumber,
        carrier: returnData.carrier,
        fromAddress: {
          name: rma.siteName,
          address: 'Site Address', // Would come from site data
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'India'
        },
        toAddress: returnData.returnPath === 'direct' ? 
          this.getCDSAddress() : 
          this.getASCOMPAddress(),
        packageInfo: {
          weight: returnData.weight || 1,
          dimensions: returnData.dimensions || { length: 10, width: 10, height: 5 },
          description: `Defective part return - ${rma.rmaNumber}`
        },
        serviceType: returnData.carrierService || 'Standard',
        labelUrl: `https://example.com/labels/${returnData.trackingNumber}.pdf`
      };

      // Store label data in RMA
      rma.returnWorkflow.labelData = labelData;
      await rma.save();

      console.log(`✅ Return label generated for RMA: ${rma.rmaNumber}`);
      return labelData;
    } catch (error) {
      console.error('❌ Error generating return label:', error);
      throw error;
    }
  }

  // Get CDS address
  getCDSAddress() {
    return {
      name: 'Christie Digital Systems',
      address: 'CDS Return Department',
      city: 'CDS City',
      state: 'CDS State',
      zipCode: 'CDS12345',
      country: 'India'
    };
  }

  // Get ASCOMP address
  getASCOMPAddress() {
    return {
      name: 'ASCOMP Office',
      address: 'ASCOMP Return Department',
      city: 'ASCOMP City',
      state: 'ASCOMP State',
      zipCode: 'ASCOMP12345',
      country: 'India'
    };
  }

  // Send return instructions
  async sendReturnInstructions(rma, returnPath) {
    try {
      const instructions = this.generateReturnInstructions(returnPath);
      
      // This would send actual email notifications
      console.log(`📧 Return instructions sent for RMA: ${rma.rmaNumber}`);
      console.log(`   Return path: ${returnPath}`);
      console.log(`   Instructions:`, instructions);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending return instructions:', error);
      return false;
    }
  }

  // Track return shipment
  async trackReturnShipment(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      if (!rma.shipping.return.trackingNumber) {
        throw new Error('No return tracking number found');
      }

      // Get real-time tracking data
      const trackingData = await this.deliveryService.trackShipment(
        rma.shipping.return.trackingNumber,
        rma.shipping.return.carrier
      );

      if (trackingData.success) {
        // Update RMA with tracking data
        rma.shipping.return.status = trackingData.status;
        rma.shipping.return.lastUpdated = new Date();
        
        if (trackingData.actualDelivery) {
          rma.shipping.return.actualDelivery = new Date(trackingData.actualDelivery);
        }
        
        if (trackingData.estimatedDelivery) {
          rma.shipping.return.estimatedDelivery = new Date(trackingData.estimatedDelivery);
        }

        // Add tracking event to history
        rma.addTrackingEvent({
          status: trackingData.status,
          location: trackingData.location,
          description: trackingData.description,
          carrier: rma.shipping.return.carrier,
          direction: 'return',
          trackingNumber: rma.shipping.return.trackingNumber,
          source: 'api',
          metadata: trackingData
        });

        await rma.save();

        // Check if delivered
        if (trackingData.status === 'delivered') {
          await this.confirmReturnDelivery(rmaId);
        }

        console.log(`✅ Return tracking updated for RMA: ${rma.rmaNumber}`);
        return trackingData;
      } else {
        console.log(`⚠️ Failed to track return for RMA: ${rma.rmaNumber}`);
        return trackingData;
      }
    } catch (error) {
      console.error('❌ Error tracking return shipment:', error);
      throw error;
    }
  }

  // Confirm return delivery
  async confirmReturnDelivery(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA status
      rma.caseStatus = 'CDS Confirmed Return';
      rma.shipping.return.status = 'delivered';
      rma.shipping.return.actualDelivery = new Date();
      rma.shipping.return.lastUpdated = new Date();

      // Update return workflow
      rma.returnWorkflow.deliveryConfirmed = {
        date: new Date(),
        confirmedBy: 'CDS',
        notes: 'Defective part received and confirmed'
      };

      await rma.save();

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'Faulty Part Returned',
        'CDS Confirmed Return',
        'CDS',
        'Defective part received and confirmed by CDS'
      );

      console.log(`✅ Return delivery confirmed for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error confirming return delivery:', error);
      throw error;
    }
  }

  // Complete RMA process
  async completeRMA(rmaId, completionData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA status
      rma.caseStatus = 'Completed';
      rma.completionData = {
        completedBy: completionData.completedBy || 'System',
        completedDate: new Date(),
        completionNotes: completionData.notes || 'RMA process completed successfully',
        totalDays: Math.ceil((new Date() - rma.createdAt) / (1000 * 60 * 60 * 24))
      };

      await rma.save();

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'CDS Confirmed Return',
        'Completed',
        completionData.completedBy || 'System',
        'RMA process completed successfully'
      );

      console.log(`✅ RMA completed: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error completing RMA:', error);
      throw error;
    }
  }

  // Get return workflow status
  async getReturnWorkflowStatus(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      const status = {
        rmaNumber: rma.rmaNumber,
        caseStatus: rma.caseStatus,
        returnWorkflow: rma.returnWorkflow,
        returnShipping: rma.shipping.return,
        trackingHistory: rma.trackingHistory.filter(event => event.direction === 'return'),
        lastUpdated: rma.updatedAt
      };

      return status;
    } catch (error) {
      console.error('❌ Error getting return workflow status:', error);
      throw error;
    }
  }

  // Get active returns
  async getActiveReturns() {
    try {
      const activeReturns = await RMA.find({
        caseStatus: { $in: ['Faulty Part Returned', 'CDS Confirmed Return'] },
        'shipping.return.trackingNumber': { $exists: true, $ne: '' }
      }).sort({ 'shipping.return.shippedDate': -1 });

      return activeReturns.map(rma => ({
        id: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        returnTracking: rma.shipping.return.trackingNumber,
        carrier: rma.shipping.return.carrier,
        status: rma.shipping.return.status,
        shippedDate: rma.shipping.return.shippedDate,
        expectedDelivery: rma.shipping.return.estimatedDelivery,
        actualDelivery: rma.shipping.return.actualDelivery,
        returnPath: rma.returnWorkflow?.returnPath || 'unknown'
      }));
    } catch (error) {
      console.error('❌ Error getting active returns:', error);
      throw error;
    }
  }

  // Get return statistics
  async getReturnStats(dateRange = {}) {
    try {
      const matchStage = {};
      
      if (dateRange.startDate && dateRange.endDate) {
        matchStage.createdAt = {
          $gte: new Date(dateRange.startDate),
          $lte: new Date(dateRange.endDate)
        };
      }

      const stats = await RMA.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            faultyPartReturned: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Faulty Part Returned'] }, 1, 0] }
            },
            cdsConfirmedReturn: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'CDS Confirmed Return'] }, 1, 0] }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0] }
            },
            avgReturnDays: {
              $avg: {
                $cond: [
                  { $and: [
                    { $ne: ['$shipping.return.shippedDate', null] },
                    { $ne: ['$shipping.return.actualDelivery', null] }
                  ]},
                  {
                    $divide: [
                      { $subtract: ['$shipping.return.actualDelivery', '$shipping.return.shippedDate'] },
                      1000 * 60 * 60 * 24
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        faultyPartReturned: 0,
        cdsConfirmedReturn: 0,
        completed: 0,
        avgReturnDays: 0
      };

      // Calculate return completion rate
      const totalWithReturns = result.faultyPartReturned + result.cdsConfirmedReturn + result.completed;
      result.returnCompletionRate = totalWithReturns > 0 ? 
        ((result.completed / totalWithReturns) * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      console.error('❌ Error getting return stats:', error);
      throw error;
    }
  }
}

module.exports = ReturnWorkflowService;




