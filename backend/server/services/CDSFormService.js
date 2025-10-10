const RMA = require('../models/RMA');
const EmailProcessingService = require('./EmailProcessingService');
const CommunicationService = require('./CommunicationService');

class CDSFormService {
  constructor() {
    this.emailService = new EmailProcessingService();
    this.communicationService = new CommunicationService();
  }

  // Generate CDS form data from RMA
  async generateCDSForm(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      const formData = {
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        serialNumber: rma.serialNumber,
        productPartNumber: rma.productPartNumber,
        defectivePartNumber: rma.defectivePartNumber,
        defectivePartName: rma.defectivePartName,
        defectiveSerialNumber: rma.defectiveSerialNumber,
        symptoms: rma.symptoms,
        ascompRaisedDate: rma.ascompRaisedDate,
        customerErrorDate: rma.customerErrorDate,
        priority: rma.priority,
        warrantyStatus: rma.warrantyStatus,
        remarks: rma.remarks,
        createdBy: rma.createdBy,
        generatedAt: new Date(),
        formVersion: '1.0'
      };

      console.log(`✅ CDS form generated for RMA: ${rma.rmaNumber}`);
      return formData;
    } catch (error) {
      console.error('❌ Error generating CDS form:', error);
      throw error;
    }
  }

  // Submit CDS form
  async submitCDSForm(rmaId, submissionData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA status
      rma.caseStatus = 'Sent to CDS';
      rma.cdsWorkflow.sentToCDS = {
        date: new Date(),
        sentBy: submissionData.sentBy || 'System',
        referenceNumber: submissionData.referenceNumber,
        notes: submissionData.notes || 'CDS form submitted'
      };

      await rma.save();

      // Send form to CDS
      await this.emailService.sendCDSForm(rma, submissionData);

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'Under Review',
        'Sent to CDS',
        submissionData.sentBy || 'System',
        'CDS form submitted for approval'
      );

      console.log(`✅ CDS form submitted for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error submitting CDS form:', error);
      throw error;
    }
  }

  // Process CDS approval
  async processCDSApproval(rmaId, approvalData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA with approval data
      rma.caseStatus = 'CDS Approved';
      rma.approvalStatus = 'Approved';
      rma.cdsWorkflow.cdsApproval = {
        date: new Date(),
        approvedBy: approvalData.approvedBy || 'CDS',
        approvalNotes: approvalData.notes || 'Approved by CDS',
        caseId: approvalData.caseId
      };

      await rma.save();

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'Sent to CDS',
        'CDS Approved',
        'CDS',
        `RMA approved with case ID: ${approvalData.caseId}`
      );

      console.log(`✅ CDS approval processed for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error processing CDS approval:', error);
      throw error;
    }
  }

  // Process CDS rejection
  async processCDSRejection(rmaId, rejectionData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA with rejection data
      rma.caseStatus = 'Rejected';
      rma.approvalStatus = 'Rejected';
      rma.cdsWorkflow.cdsApproval = {
        date: new Date(),
        approvedBy: 'CDS',
        approvalNotes: rejectionData.reason || 'Rejected by CDS',
        caseId: null
      };

      await rma.save();

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'Sent to CDS',
        'Rejected',
        'CDS',
        `RMA rejected: ${rejectionData.reason}`
      );

      console.log(`✅ CDS rejection processed for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error processing CDS rejection:', error);
      throw error;
    }
  }

  // Track replacement part shipment
  async trackReplacementShipment(rmaId, trackingData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA with replacement tracking
      rma.caseStatus = 'Replacement Shipped';
      rma.cdsWorkflow.replacementTracking = {
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        shippedDate: trackingData.shippedDate || new Date(),
        estimatedDelivery: trackingData.estimatedDelivery,
        actualDelivery: trackingData.actualDelivery
      };

      // Update shipping information
      rma.shipping.outbound.trackingNumber = trackingData.trackingNumber;
      rma.shipping.outbound.carrier = trackingData.carrier;
      rma.shipping.outbound.shippedDate = trackingData.shippedDate || new Date();
      rma.shipping.outbound.status = 'in_transit';

      await rma.save();

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'CDS Approved',
        'Replacement Shipped',
        'CDS',
        `Replacement part shipped with tracking: ${trackingData.trackingNumber}`
      );

      console.log(`✅ Replacement shipment tracked for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error tracking replacement shipment:', error);
      throw error;
    }
  }

  // Confirm replacement delivery
  async confirmReplacementDelivery(rmaId, deliveryData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA with delivery confirmation
      rma.caseStatus = 'Replacement Received';
      rma.shipping.outbound.actualDelivery = deliveryData.deliveryDate || new Date();
      rma.shipping.outbound.status = 'delivered';

      await rma.save();

      // Notify stakeholders
      await this.communicationService.sendStatusUpdate(
        rmaId,
        'Replacement Shipped',
        'Replacement Received',
        deliveryData.confirmedBy || 'Site',
        'Replacement part delivered and confirmed'
      );

      console.log(`✅ Replacement delivery confirmed for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error confirming replacement delivery:', error);
      throw error;
    }
  }

  // Get CDS form status
  async getCDSFormStatus(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      const status = {
        rmaNumber: rma.rmaNumber,
        caseStatus: rma.caseStatus,
        approvalStatus: rma.approvalStatus,
        cdsWorkflow: rma.cdsWorkflow,
        shipping: rma.shipping,
        lastUpdated: rma.updatedAt
      };

      return status;
    } catch (error) {
      console.error('❌ Error getting CDS form status:', error);
      throw error;
    }
  }

  // Get pending CDS submissions
  async getPendingCDSSubmissions() {
    try {
      const pendingRMAs = await RMA.find({
        caseStatus: 'Under Review'
      }).sort({ createdAt: -1 });

      return pendingRMAs.map(rma => ({
        id: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        serialNumber: rma.serialNumber,
        priority: rma.priority,
        createdBy: rma.createdBy,
        createdAt: rma.createdAt,
        daysPending: Math.ceil((new Date() - rma.createdAt) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      console.error('❌ Error getting pending CDS submissions:', error);
      throw error;
    }
  }

  // Get CDS approval statistics
  async getCDSApprovalStats(dateRange = {}) {
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
            underReview: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Under Review'] }, 1, 0] }
            },
            sentToCDS: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Sent to CDS'] }, 1, 0] }
            },
            cdsApproved: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'CDS Approved'] }, 1, 0] }
            },
            replacementShipped: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Replacement Shipped'] }, 1, 0] }
            },
            replacementReceived: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Replacement Received'] }, 1, 0] }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$caseStatus', 'Rejected'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        underReview: 0,
        sentToCDS: 0,
        cdsApproved: 0,
        replacementShipped: 0,
        replacementReceived: 0,
        completed: 0,
        rejected: 0
      };

      // Calculate approval rate
      const totalProcessed = result.cdsApproved + result.rejected;
      result.approvalRate = totalProcessed > 0 ? (result.cdsApproved / totalProcessed * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      console.error('❌ Error getting CDS approval stats:', error);
      throw error;
    }
  }
}

module.exports = CDSFormService;




