const express = require('express');
const router = express.Router();
const RMA = require('../models/RMA');
const DeliveryProviderService = require('../services/DeliveryProviderService');

// Get all RMA records
router.get('/', async (req, res) => {
  try {
    const rmaRecords = await RMA.find().sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA records by projector serial
router.get('/projector/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    const rmaRecords = await RMA.find({ projectorSerial: serial }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records for projector:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA by ID
router.get('/:id', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    res.json(rma);
  } catch (error) {
    console.error('Error fetching RMA record:', error);
    res.status(500).json({ error: 'Failed to fetch RMA record', details: error.message });
  }
});

// Create new RMA
router.post('/', async (req, res) => {
  try {
    const rma = new RMA(req.body);
    await rma.save();
    res.status(201).json(rma);
  } catch (error) {
    console.error('Error creating RMA:', error);
    res.status(500).json({ error: 'Failed to create RMA', details: error.message });
  }
});

// Update RMA
router.put('/:id', async (req, res) => {
  try {
    const rma = await RMA.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    
    res.json(rma);
  } catch (error) {
    console.error('Error updating RMA:', error);
    res.status(500).json({ error: 'Failed to update RMA', details: error.message });
  }
});

// Delete RMA
router.delete('/:id', async (req, res) => {
  try {
    const rma = await RMA.findByIdAndDelete(req.params.id);
    
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    
    res.json({ message: 'RMA record deleted successfully' });
  } catch (error) {
    console.error('Error deleting RMA:', error);
    res.status(500).json({ error: 'Failed to delete RMA', details: error.message });
  }
});

// Get RMA records by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const rmaRecords = await RMA.find({ status }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records by status:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA records by priority
router.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const rmaRecords = await RMA.find({ priority }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records by priority:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await RMA.aggregate([
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
          installationComplete: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Installation Complete'] }, 1, 0] }
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
      installationComplete: 0,
      completed: 0,
      rejected: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching RMA stats:', error);
    res.status(500).json({ error: 'Failed to fetch RMA statistics' });
  }
});

// ==================== ENHANCED TRACKING ROUTES ====================

// Get tracking information for an RMA
router.get('/:id/tracking', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    const trackingService = new DeliveryProviderService();
    const trackingData = {
      rmaNumber: rma.rmaNumber,
      outbound: null,
      return: null,
      lastUpdated: new Date()
    };

    // Get outbound tracking
    if (rma.shipping.outbound.trackingNumber && rma.shipping.outbound.carrier) {
      try {
        const outboundTracking = await trackingService.trackShipment(
          rma.shipping.outbound.trackingNumber,
          rma.shipping.outbound.carrier
        );
        trackingData.outbound = {
          ...outboundTracking,
          trackingNumber: rma.shipping.outbound.trackingNumber,
          carrier: rma.shipping.outbound.carrier,
          carrierService: rma.shipping.outbound.carrierService,
          shippedDate: rma.shipping.outbound.shippedDate,
          estimatedDelivery: rma.shipping.outbound.estimatedDelivery,
          actualDelivery: rma.shipping.outbound.actualDelivery,
          status: rma.shipping.outbound.status,
          lastUpdated: rma.shipping.outbound.lastUpdated
        };
      } catch (error) {
        console.error('Error tracking outbound shipment:', error);
        trackingData.outbound = {
          error: error.message,
          trackingNumber: rma.shipping.outbound.trackingNumber,
          carrier: rma.shipping.outbound.carrier,
          status: rma.shipping.outbound.status
        };
      }
    }

    // Get return tracking
    if (rma.shipping.return.trackingNumber && rma.shipping.return.carrier) {
      try {
        const returnTracking = await trackingService.trackShipment(
          rma.shipping.return.trackingNumber,
          rma.shipping.return.carrier
        );
        trackingData.return = {
          ...returnTracking,
          trackingNumber: rma.shipping.return.trackingNumber,
          carrier: rma.shipping.return.carrier,
          carrierService: rma.shipping.return.carrierService,
          shippedDate: rma.shipping.return.shippedDate,
          estimatedDelivery: rma.shipping.return.estimatedDelivery,
          actualDelivery: rma.shipping.return.actualDelivery,
          status: rma.shipping.return.status,
          lastUpdated: rma.shipping.return.lastUpdated
        };
      } catch (error) {
        console.error('Error tracking return shipment:', error);
        trackingData.return = {
          error: error.message,
          trackingNumber: rma.shipping.return.trackingNumber,
          carrier: rma.shipping.return.carrier,
          status: rma.shipping.return.status
        };
      }
    }

    // Include tracking history
    trackingData.trackingHistory = rma.trackingHistory || [];

    res.json({
      success: true,
      tracking: trackingData
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ error: 'Failed to fetch tracking data', details: error.message });
  }
});

// Update tracking information for an RMA
router.put('/:id/tracking', async (req, res) => {
  try {
    const { trackingNumber, carrier, direction, carrierService, shippedDate, weight, dimensions } = req.body;
    
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    // Update tracking information
    if (direction === 'outbound') {
      rma.shipping.outbound.trackingNumber = trackingNumber;
      rma.shipping.outbound.carrier = carrier;
      rma.shipping.outbound.carrierService = carrierService;
      rma.shipping.outbound.shippedDate = shippedDate ? new Date(shippedDate) : new Date();
      rma.shipping.outbound.lastUpdated = new Date();
      
      if (weight) rma.shipping.outbound.weight = weight;
      if (dimensions) rma.shipping.outbound.dimensions = dimensions;
    } else if (direction === 'return') {
      rma.shipping.return.trackingNumber = trackingNumber;
      rma.shipping.return.carrier = carrier;
      rma.shipping.return.carrierService = carrierService;
      rma.shipping.return.shippedDate = shippedDate ? new Date(shippedDate) : new Date();
      rma.shipping.return.lastUpdated = new Date();
      
      if (weight) rma.shipping.return.weight = weight;
      if (dimensions) rma.shipping.return.dimensions = dimensions;
    } else {
      return res.status(400).json({ error: 'Invalid direction. Must be "outbound" or "return"' });
    }

    await rma.save();

    // Fetch real-time tracking data
    const trackingService = new DeliveryProviderService();
    let trackingData = null;
    
    try {
      trackingData = await trackingService.trackShipment(trackingNumber, carrier);
    } catch (error) {
      console.error('Error fetching real-time tracking data:', error);
    }

    res.json({
      success: true,
      message: `${direction} tracking information updated successfully`,
      tracking: trackingData,
      rma: rma
    });
  } catch (error) {
    console.error('Error updating tracking information:', error);
    res.status(500).json({ error: 'Failed to update tracking information', details: error.message });
  }
});

// Get all active shipments
router.get('/tracking/active', async (req, res) => {
  try {
    const activeRMAs = await RMA.findActiveShipments();
    
    const trackingService = new DeliveryProviderService();
    const activeShipments = [];

    for (const rma of activeRMAs) {
      const shipment = {
        rmaId: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        outbound: null,
        return: null
      };

      // Get outbound tracking if active
      if (rma.shipping.outbound.trackingNumber && 
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(rma.shipping.outbound.status)) {
        try {
          const outboundTracking = await trackingService.trackShipment(
            rma.shipping.outbound.trackingNumber,
            rma.shipping.outbound.carrier
          );
          shipment.outbound = {
            ...outboundTracking,
            trackingNumber: rma.shipping.outbound.trackingNumber,
            carrier: rma.shipping.outbound.carrier,
            status: rma.shipping.outbound.status
          };
        } catch (error) {
          shipment.outbound = {
            error: error.message,
            trackingNumber: rma.shipping.outbound.trackingNumber,
            carrier: rma.shipping.outbound.carrier,
            status: rma.shipping.outbound.status
          };
        }
      }

      // Get return tracking if active
      if (rma.shipping.return.trackingNumber && 
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(rma.shipping.return.status)) {
        try {
          const returnTracking = await trackingService.trackShipment(
            rma.shipping.return.trackingNumber,
            rma.shipping.return.carrier
          );
          shipment.return = {
            ...returnTracking,
            trackingNumber: rma.shipping.return.trackingNumber,
            carrier: rma.shipping.return.carrier,
            status: rma.shipping.return.status
          };
        } catch (error) {
          shipment.return = {
            error: error.message,
            trackingNumber: rma.shipping.return.trackingNumber,
            carrier: rma.shipping.return.carrier,
            status: rma.shipping.return.status
          };
        }
      }

      activeShipments.push(shipment);
    }

    res.json({
      success: true,
      count: activeShipments.length,
      shipments: activeShipments
    });
  } catch (error) {
    console.error('Error fetching active shipments:', error);
    res.status(500).json({ error: 'Failed to fetch active shipments', details: error.message });
  }
});

// Get SLA breaches
router.get('/tracking/sla-breaches', async (req, res) => {
  try {
    const slaBreaches = await RMA.findSLABreaches();
    
    res.json({
      success: true,
      count: slaBreaches.length,
      breaches: slaBreaches.map(rma => ({
        rmaId: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        sla: rma.sla,
        outbound: rma.shipping.outbound,
        return: rma.shipping.return
      }))
    });
  } catch (error) {
    console.error('Error fetching SLA breaches:', error);
    res.status(500).json({ error: 'Failed to fetch SLA breaches', details: error.message });
  }
});

// Update all active shipments (for cron job)
router.post('/tracking/update-all', async (req, res) => {
  try {
    const trackingService = new DeliveryProviderService();
    await trackingService.updateAllActiveShipments();
    
    res.json({
      success: true,
      message: 'All active shipments updated successfully'
    });
  } catch (error) {
    console.error('Error updating all shipments:', error);
    res.status(500).json({ error: 'Failed to update all shipments', details: error.message });
  }
});

// Get available delivery providers
router.get('/tracking/providers', async (req, res) => {
  try {
    const trackingService = new DeliveryProviderService();
    const providers = await trackingService.getAvailableProviders();
    
    res.json({
      success: true,
      providers: providers.map(provider => ({
        id: provider._id,
        name: provider.name,
        code: provider.code,
        displayName: provider.displayName,
        isActive: provider.isActive,
        isDomestic: provider.isDomestic,
        isInternational: provider.isInternational,
        supportedServices: provider.supportedServices,
        trackingFormat: provider.trackingFormat,
        coverage: provider.coverage,
        contact: provider.contact,
        performance: provider.performance
      }))
    });
  } catch (error) {
    console.error('Error fetching delivery providers:', error);
    res.status(500).json({ error: 'Failed to fetch delivery providers', details: error.message });
  }
});

// Find RMA by tracking number
router.get('/tracking/find/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const rma = await RMA.findByTrackingNumber(trackingNumber);
    
    if (!rma) {
      return res.status(404).json({ error: 'No RMA found with this tracking number' });
    }

    res.json({
      success: true,
      rma: {
        id: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        caseStatus: rma.caseStatus,
        outbound: rma.shipping.outbound,
        return: rma.shipping.return
      }
    });
  } catch (error) {
    console.error('Error finding RMA by tracking number:', error);
    res.status(500).json({ error: 'Failed to find RMA', details: error.message });
  }
});

module.exports = router;