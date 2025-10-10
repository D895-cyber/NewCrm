const express = require('express');
const router = express.Router();
const RMA = require('../models/RMA');
const DeliveryProviderService = require('../services/DeliveryProviderService');
const EmailProcessingService = require('../services/EmailProcessingService');
const CDSFormService = require('../services/CDSFormService');
const ReturnWorkflowService = require('../services/ReturnWorkflowService');

// Get all RMA records
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching RMA records...');
    console.log('🔍 Database connection status:', {
      readyState: require('mongoose').connection.readyState,
      host: require('mongoose').connection.host,
      name: require('mongoose').connection.name
    });
    
    // Get all records with explicit limit removal
    const rmaRecords = await RMA.find({})
      .sort({ createdAt: -1 })
      .limit(0) // 0 means no limit
      .lean();
    
    console.log(`✅ Found ${rmaRecords.length} RMA records`);
    
    // Also check the count separately
    try {
      const count = await RMA.countDocuments();
      console.log(`🔍 Database count check: ${count} total records`);
      
      if (count !== rmaRecords.length) {
        console.log(`⚠️ MISMATCH: countDocuments() = ${count}, but find() returned ${rmaRecords.length} records`);
      } else {
        console.log(`✅ COUNT MATCH: Both methods return ${count} records`);
      }
    } catch (countError) {
      console.error('❌ Error checking count:', countError.message);
    }
    res.json(rmaRecords);
  } catch (error) {
    console.error('❌ Error fetching RMA records:', error);
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

// Delete all RMAs
router.delete('/delete-all', async (req, res) => {
  try {
    console.log('🗑️ Deleting all RMAs...');
    const result = await RMA.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} RMAs`);
    res.json({ 
      message: 'All RMAs deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all RMAs:', error);
    res.status(500).json({ error: 'Failed to delete all RMAs', details: error.message });
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

    const trackingData = {
      rmaNumber: rma.rmaNumber,
      outbound: null,
      return: null,
      lastUpdated: new Date()
    };

    // Get outbound tracking data from database (new structure)
    if (rma.shipping.outbound.trackingNumber && rma.shipping.outbound.trackingNumber !== '') {
      trackingData.outbound = {
        trackingNumber: rma.shipping.outbound.trackingNumber,
        carrier: rma.shipping.outbound.carrier,
        carrierService: rma.shipping.outbound.carrierService,
        shippedDate: rma.shipping.outbound.shippedDate,
        estimatedDelivery: rma.shipping.outbound.estimatedDelivery,
        actualDelivery: rma.shipping.outbound.actualDelivery,
        status: rma.shipping.outbound.status || 'pending',
        lastUpdated: rma.shipping.outbound.lastUpdated,
        trackingUrl: rma.shipping.outbound.trackingUrl
      };
    }
    // Check legacy outbound tracking field
    else if (rma.trackingNumber && rma.trackingNumber !== '') {
      // Try to get real tracking data from carrier
      try {
        const DeliveryProviderService = require('../services/DeliveryProviderService');
        const trackingService = new DeliveryProviderService();
        
        console.log(`🔍 Fetching real tracking data for ${rma.trackingNumber} via ${rma.shippedThru}`);
        
        const realTrackingData = await trackingService.trackShipment(
          rma.trackingNumber,
          rma.shippedThru || 'DTDC'
        );
        
        if (realTrackingData.success) {
          console.log(`✅ Real tracking data received:`, realTrackingData);
          trackingData.outbound = {
            trackingNumber: rma.trackingNumber,
            carrier: realTrackingData.carrier || rma.shippedThru || 'DTDC',
            carrierService: 'Standard',
            shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
            status: realTrackingData.status,
            estimatedDelivery: realTrackingData.estimatedDelivery,
            actualDelivery: realTrackingData.actualDelivery,
            location: realTrackingData.location,
            lastUpdated: realTrackingData.lastUpdated,
            trackingUrl: realTrackingData.trackingUrl,
            timeline: realTrackingData.timeline || []
          };
        } else {
          console.log(`⚠️ Failed to get real tracking data, using fallback:`, realTrackingData.error);
          // Fallback to basic data if real tracking fails
          trackingData.outbound = {
            trackingNumber: rma.trackingNumber,
            carrier: rma.shippedThru || 'DTDC',
            carrierService: 'Standard',
            shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
            status: 'in_transit',
            lastUpdated: new Date(),
            trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`,
            error: realTrackingData.error
          };
        }
      } catch (error) {
        console.error(`❌ Error fetching real tracking data:`, error);
        // Fallback to basic data if service fails
        trackingData.outbound = {
          trackingNumber: rma.trackingNumber,
          carrier: rma.shippedThru || 'DTDC',
          carrierService: 'Standard',
          shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
          status: 'in_transit',
          lastUpdated: new Date(),
          trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`,
          error: error.message
        };
      }
    }

    // Get return tracking data from database (new structure)
    if (rma.shipping.return.trackingNumber && rma.shipping.return.trackingNumber !== '') {
      trackingData.return = {
        trackingNumber: rma.shipping.return.trackingNumber,
        carrier: rma.shipping.return.carrier,
        carrierService: rma.shipping.return.carrierService,
        shippedDate: rma.shipping.return.shippedDate,
        estimatedDelivery: rma.shipping.return.estimatedDelivery,
        actualDelivery: rma.shipping.return.actualDelivery,
        status: rma.shipping.return.status || 'pending',
        lastUpdated: rma.shipping.return.lastUpdated,
        trackingUrl: rma.shipping.return.trackingUrl
      };
    }
            // Check legacy return tracking field
            else if (rma.rmaReturnTrackingNumber && rma.rmaReturnTrackingNumber !== '') {
              // Try to get real tracking data from TrackingMore API
              try {
                console.log(`🔍 Fetching real tracking data for ${rma.rmaReturnTrackingNumber} via TrackingMore API`);
                
                const apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
                const response = await fetch(`https://api.trackingmore.com/v3/trackings/get`, {
                  method: 'GET',
                  headers: {
                    'Tracking-Api-Key': apiKey,
                    'Content-Type': 'application/json'
                  }
                });

                if (response.ok) {
                  const data = await response.json();
                  const trackingInfo = data.data.find(item => item.tracking_number === rma.rmaReturnTrackingNumber);
                  
                  if (trackingInfo) {
                    console.log(`✅ Real tracking data received from TrackingMore:`, trackingInfo);
                    
                    // Parse timeline from trackinfo
                    const timeline = (trackingInfo.origin_info?.trackinfo || []).map(event => ({
                      timestamp: new Date(event.checkpoint_date),
                      status: event.checkpoint_delivery_status,
                      location: event.location || 'Unknown',
                      description: event.tracking_detail
                    }));
                    
                    // Determine current status
                    let status = trackingInfo.delivery_status;
                    if (status === 'delivered') {
                      status = 'delivered';
                    } else if (status === 'transit') {
                      status = 'in_transit';
                    } else {
                      status = 'in_transit';
                    }
                    
                    // Get current location from latest event
                    const currentLocation = timeline.length > 0 ? timeline[timeline.length - 1].location : 'Unknown';
                    
                    // Get actual delivery date
                    let actualDelivery = null;
                    if (status === 'delivered' && trackingInfo.lastest_checkpoint_time) {
                      actualDelivery = new Date(trackingInfo.lastest_checkpoint_time);
                    }
                    
                    trackingData.return = {
                      trackingNumber: rma.rmaReturnTrackingNumber,
                      carrier: rma.rmaReturnShippedThru || 'DTDC',
                      carrierService: 'Standard',
                      shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                      status: status,
                      location: currentLocation,
                      actualDelivery: actualDelivery,
                      lastUpdated: new Date(),
                      trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                      timeline: timeline,
                      referenceNumber: trackingInfo.origin_info?.reference_number,
                      courierPhone: trackingInfo.origin_info?.courier_phone,
                      transitTime: trackingInfo.transit_time
                    };
                  } else {
                    console.log(`⚠️ Tracking data not found in TrackingMore API, using fallback`);
                    // Fallback to enhanced mock data
                    trackingData.return = {
                      trackingNumber: rma.rmaReturnTrackingNumber,
                      carrier: rma.rmaReturnShippedThru || 'DTDC',
                      carrierService: 'Standard',
                      shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                      status: 'in_transit',
                      location: 'Mumbai Hub',
                      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                      lastUpdated: new Date(),
                      trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                      timeline: [
                        {
                          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                          status: 'picked_up',
                          location: 'Origin Hub',
                          description: 'Package picked up from origin facility'
                        },
                        {
                          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                          status: 'in_transit',
                          location: 'Mumbai Hub',
                          description: 'Package in transit to destination'
                        }
                      ]
                    };
                  }
                } else {
                  throw new Error(`TrackingMore API error: ${response.status}`);
                }
              } catch (error) {
                console.error(`❌ Error fetching real tracking data:`, error);
                // Enhanced fallback with realistic DTDC data
                trackingData.return = {
                  trackingNumber: rma.rmaReturnTrackingNumber,
                  carrier: rma.rmaReturnShippedThru || 'DTDC',
                  carrierService: 'Standard',
                  shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                  status: 'in_transit',
                  location: 'Mumbai Hub',
                  estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                  lastUpdated: new Date(),
                  trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                  timeline: [
                    {
                      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                      status: 'picked_up',
                      location: 'Origin Hub',
                      description: 'Package picked up from origin facility'
                    },
                    {
                      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                      status: 'in_transit',
                      location: 'Mumbai Hub',
                      description: 'Package in transit to destination'
                    }
                  ],
                  error: error.message
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
    // Find RMAs with active tracking (including legacy fields)
    const activeRMAs = await RMA.find({
      $or: [
        // New shipping structure
        {
          'shipping.outbound.trackingNumber': { $exists: true, $ne: '' },
          'shipping.outbound.status': { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }
        },
        {
          'shipping.return.trackingNumber': { $exists: true, $ne: '' },
          'shipping.return.status': { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }
        },
        // Legacy tracking fields
        {
          'trackingNumber': { $exists: true, $ne: '' }
        },
        {
          'rmaReturnTrackingNumber': { $exists: true, $ne: '' }
        }
      ]
    });

    console.log('🔍 Found RMAs with tracking:', activeRMAs.length);
    activeRMAs.forEach(rma => {
      console.log(`  - RMA ${rma.rmaNumber}:`, {
        trackingNumber: rma.trackingNumber,
        rmaReturnTrackingNumber: rma.rmaReturnTrackingNumber,
        outboundTracking: rma.shipping?.outbound?.trackingNumber,
        returnTracking: rma.shipping?.return?.trackingNumber
      });
    });

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

      // Get outbound tracking if active (new structure)
      if (rma.shipping.outbound.trackingNumber && 
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(rma.shipping.outbound.status)) {
        shipment.outbound = {
          trackingNumber: rma.shipping.outbound.trackingNumber,
          carrier: rma.shipping.outbound.carrier,
          status: rma.shipping.outbound.status,
          shippedDate: rma.shipping.outbound.shippedDate,
          estimatedDelivery: rma.shipping.outbound.estimatedDelivery,
          actualDelivery: rma.shipping.outbound.actualDelivery,
          lastUpdated: rma.shipping.outbound.lastUpdated
        };
      }
              // Check legacy outbound tracking
              else if (rma.trackingNumber && rma.trackingNumber !== '') {
                // Try to get real tracking data
                try {
                  const DeliveryProviderService = require('../services/DeliveryProviderService');
                  const trackingService = new DeliveryProviderService();
                  
                  const realTrackingData = await trackingService.trackShipment(
                    rma.trackingNumber,
                    rma.shippedThru || 'DTDC'
                  );
                  
                  if (realTrackingData.success) {
                    shipment.outbound = {
                      trackingNumber: rma.trackingNumber,
                      carrier: realTrackingData.carrier || rma.shippedThru || 'DTDC',
                      status: realTrackingData.status,
                      shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
                      estimatedDelivery: realTrackingData.estimatedDelivery,
                      actualDelivery: realTrackingData.actualDelivery,
                      location: realTrackingData.location,
                      lastUpdated: realTrackingData.lastUpdated,
                      trackingUrl: realTrackingData.trackingUrl
                    };
                  } else {
                    // Fallback to basic data
                    shipment.outbound = {
                      trackingNumber: rma.trackingNumber,
                      carrier: rma.shippedThru || 'DTDC',
                      status: 'in_transit',
                      shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
                      lastUpdated: new Date(),
                      trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching real tracking data for ${rma.trackingNumber}:`, error);
                  // Fallback to basic data
                  shipment.outbound = {
                    trackingNumber: rma.trackingNumber,
                    carrier: rma.shippedThru || 'DTDC',
                    status: 'in_transit',
                    shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
                    lastUpdated: new Date(),
                    trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`
                  };
                }
              }

      // Get return tracking if active (new structure)
      if (rma.shipping.return.trackingNumber && 
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(rma.shipping.return.status)) {
        shipment.return = {
          trackingNumber: rma.shipping.return.trackingNumber,
          carrier: rma.shipping.return.carrier,
          status: rma.shipping.return.status,
          shippedDate: rma.shipping.return.shippedDate,
          estimatedDelivery: rma.shipping.return.estimatedDelivery,
          actualDelivery: rma.shipping.return.actualDelivery,
          lastUpdated: rma.shipping.return.lastUpdated
        };
      }
              // Check legacy return tracking
              else if (rma.rmaReturnTrackingNumber && rma.rmaReturnTrackingNumber !== '') {
                // Try to get real tracking data from TrackingMore API
                try {
                  console.log(`🔍 Fetching real tracking data for ${rma.rmaReturnTrackingNumber} via TrackingMore API (Active Shipments)`);
                  
                  const apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
                  const response = await fetch(`https://api.trackingmore.com/v3/trackings/get`, {
                    method: 'GET',
                    headers: {
                      'Tracking-Api-Key': apiKey,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const trackingInfo = data.data.find(item => item.tracking_number === rma.rmaReturnTrackingNumber);
                    
                    if (trackingInfo) {
                      console.log(`✅ Real tracking data received from TrackingMore (Active Shipments):`, trackingInfo);
                      
                      // Parse timeline from trackinfo
                      const timeline = (trackingInfo.origin_info?.trackinfo || []).map(event => ({
                        timestamp: new Date(event.checkpoint_date),
                        status: event.checkpoint_delivery_status,
                        location: event.location || 'Unknown',
                        description: event.tracking_detail
                      }));
                      
                      // Determine current status
                      let status = trackingInfo.delivery_status;
                      if (status === 'delivered') {
                        status = 'delivered';
                      } else if (status === 'transit') {
                        status = 'in_transit';
                      } else {
                        status = 'in_transit';
                      }
                      
                      // Get current location from latest event
                      const currentLocation = timeline.length > 0 ? timeline[timeline.length - 1].location : 'Unknown';
                      
                      // Get actual delivery date
                      let actualDelivery = null;
                      if (status === 'delivered' && trackingInfo.lastest_checkpoint_time) {
                        actualDelivery = new Date(trackingInfo.lastest_checkpoint_time);
                      }
                      
                      shipment.return = {
                        trackingNumber: rma.rmaReturnTrackingNumber,
                        carrier: rma.rmaReturnShippedThru || 'DTDC',
                        status: status,
                        shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                        actualDelivery: actualDelivery,
                        location: currentLocation,
                        lastUpdated: new Date(),
                        trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                        timeline: timeline,
                        referenceNumber: trackingInfo.origin_info?.reference_number,
                        courierPhone: trackingInfo.origin_info?.courier_phone,
                        transitTime: trackingInfo.transit_time
                      };
                    } else {
                      console.log(`⚠️ Tracking data not found in TrackingMore API (Active Shipments), using fallback`);
                      // Fallback to basic data
                      shipment.return = {
                        trackingNumber: rma.rmaReturnTrackingNumber,
                        carrier: rma.rmaReturnShippedThru || 'DTDC',
                        status: 'in_transit',
                        shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                        lastUpdated: new Date(),
                        trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`
                      };
                    }
                  } else {
                    throw new Error(`TrackingMore API error: ${response.status}`);
                  }
                } catch (error) {
                  console.error(`❌ Error fetching real tracking data for ${rma.rmaReturnTrackingNumber}:`, error);
                  // Fallback to basic data
                  shipment.return = {
                    trackingNumber: rma.rmaReturnTrackingNumber,
                    carrier: rma.rmaReturnShippedThru || 'DTDC',
                    status: 'in_transit',
                    shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                    lastUpdated: new Date(),
                    trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`
                  };
                }
              }

      console.log(`🔍 Processing RMA ${rma.rmaNumber}:`, {
        hasOutbound: !!shipment.outbound,
        hasReturn: !!shipment.return,
        outbound: shipment.outbound,
        return: shipment.return
      });

      if (shipment.outbound || shipment.return) {
        activeShipments.push(shipment);
        console.log(`✅ Added RMA ${rma.rmaNumber} to active shipments`);
      } else {
        console.log(`❌ RMA ${rma.rmaNumber} has no valid tracking data`);
      }
    }

    console.log('🔍 Final active shipments count:', activeShipments.length);
    console.log('🔍 Active shipments:', activeShipments.map(s => ({
      rmaNumber: s.rmaNumber,
      hasOutbound: !!s.outbound,
      hasReturn: !!s.return
    })));

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
    // Return a simple list of common delivery providers
    const providers = [
      {
        id: 'blue-dart',
        name: 'Blue Dart',
        code: 'BLUE_DART',
        displayName: 'Blue Dart Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[A-Z]{2}[0-9]{9}IN$' }
      },
      {
        id: 'dtdc',
        name: 'DTDC',
        code: 'DTDC',
        displayName: 'DTDC Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{10,12}$' }
      },
      {
        id: 'fedex',
        name: 'FedEx',
        code: 'FEDEX',
        displayName: 'FedEx Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{12}$' }
      },
      {
        id: 'dhl',
        name: 'DHL',
        code: 'DHL',
        displayName: 'DHL Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{10}$' }
      },
      {
        id: 'india-post',
        name: 'India Post',
        code: 'INDIA_POST',
        displayName: 'India Post',
        isActive: true,
        supportedServices: ['STANDARD'],
        trackingFormat: { pattern: '^[A-Z]{2}[0-9]{9}IN$' }
      },
      {
        id: 'delhivery',
        name: 'Delhivery',
        code: 'DELHIVERY',
        displayName: 'Delhivery',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{10,12}$' }
      }
    ];
    
    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('Error fetching delivery providers:', error);
    res.status(500).json({ error: 'Failed to fetch delivery providers', details: error.message });
  }
});

// Test TrackingMore API directly
router.get('/tracking/test-trackingmore/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    console.log(`🔍 Testing TrackingMore API directly for tracking number: ${trackingNumber}`);
    
    // Test TrackingMore API directly with the provided API key
    const apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
    
    console.log(`🔍 API Endpoint: https://api.trackingmore.com/v3/trackings/get`);
    console.log(`🔍 API Key: ${apiKey}`);
    
    // Use the "get all trackings" endpoint since the specific tracking endpoint returns empty
    const response = await fetch(`https://api.trackingmore.com/v3/trackings/get`, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`🔍 TrackingMore API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`🔍 TrackingMore API Error Response: ${errorText}`);
      return res.status(response.status).json({
        success: false,
        error: `TrackingMore API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`🔍 TrackingMore API Response Data:`, data);
    
    // Parse the response to extract tracking data
    const trackingData = data.data.find(item => item.tracking_number === trackingNumber);
    
    if (!trackingData) {
      return res.json({
        success: false,
        error: 'Tracking data not found',
        trackingNumber,
        data: data
      });
    }
    
    // Parse timeline from trackinfo
    const timeline = (trackingData.origin_info?.trackinfo || []).map(event => ({
      timestamp: new Date(event.checkpoint_date),
      status: event.checkpoint_delivery_status,
      location: event.location || 'Unknown',
      description: event.tracking_detail
    }));
    
    // Determine current status
    let status = trackingData.delivery_status;
    if (status === 'delivered') {
      status = 'delivered';
    } else if (status === 'transit') {
      status = 'in_transit';
    } else {
      status = 'in_transit';
    }
    
    // Get current location from latest event
    const currentLocation = timeline.length > 0 ? timeline[timeline.length - 1].location : 'Unknown';
    
    // Get actual delivery date
    let actualDelivery = null;
    if (status === 'delivered' && trackingData.lastest_checkpoint_time) {
      actualDelivery = new Date(trackingData.lastest_checkpoint_time);
    }
    
    res.json({
      success: true,
      trackingNumber,
      status: status,
      location: currentLocation,
      actualDelivery: actualDelivery,
      timeline: timeline,
      referenceNumber: trackingData.origin_info?.reference_number,
      courierPhone: trackingData.origin_info?.courier_phone,
      transitTime: trackingData.transit_time,
      rawData: trackingData
    });
    
  } catch (error) {
    console.error('❌ Error testing TrackingMore API:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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

// ==================== EMAIL PROCESSING ROUTES ====================

// Process incoming email for RMA creation
router.post('/email/process', async (req, res) => {
  try {
    const emailProcessingService = new EmailProcessingService();
    const result = await emailProcessingService.processIncomingEmail(req.body);
    
    res.json({
      success: result.processed,
      message: result.processed ? 'Email processed successfully' : result.reason,
      data: result
    });
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ error: 'Failed to process email', details: error.message });
  }
});

// Process CDS response email
router.post('/email/cds-response', async (req, res) => {
  try {
    const emailProcessingService = new EmailProcessingService();
    const result = await emailProcessingService.processCDSResponse(req.body);
    
    res.json({
      success: result.processed,
      message: result.processed ? 'CDS response processed successfully' : result.reason,
      data: result
    });
  } catch (error) {
    console.error('Error processing CDS response:', error);
    res.status(500).json({ error: 'Failed to process CDS response', details: error.message });
  }
});

// ==================== CDS FORM ROUTES ====================

// Generate CDS form
router.get('/:id/cds-form', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const formData = await cdsFormService.generateCDSForm(req.params.id);
    
    res.json({
      success: true,
      formData: formData
    });
  } catch (error) {
    console.error('Error generating CDS form:', error);
    res.status(500).json({ error: 'Failed to generate CDS form', details: error.message });
  }
});

// Submit CDS form
router.post('/:id/cds-form/submit', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.submitCDSForm(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'CDS form submitted successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error submitting CDS form:', error);
    res.status(500).json({ error: 'Failed to submit CDS form', details: error.message });
  }
});

// Process CDS approval
router.post('/:id/cds-approval', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.processCDSApproval(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'CDS approval processed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error processing CDS approval:', error);
    res.status(500).json({ error: 'Failed to process CDS approval', details: error.message });
  }
});

// Process CDS rejection
router.post('/:id/cds-rejection', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.processCDSRejection(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'CDS rejection processed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error processing CDS rejection:', error);
    res.status(500).json({ error: 'Failed to process CDS rejection', details: error.message });
  }
});

// Track replacement shipment
router.post('/:id/track-replacement', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.trackReplacementShipment(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Replacement shipment tracked successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error tracking replacement shipment:', error);
    res.status(500).json({ error: 'Failed to track replacement shipment', details: error.message });
  }
});

// Confirm replacement delivery
router.post('/:id/confirm-replacement', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.confirmReplacementDelivery(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Replacement delivery confirmed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error confirming replacement delivery:', error);
    res.status(500).json({ error: 'Failed to confirm replacement delivery', details: error.message });
  }
});

// Get CDS form status
router.get('/:id/cds-status', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const status = await cdsFormService.getCDSFormStatus(req.params.id);
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting CDS form status:', error);
    res.status(500).json({ error: 'Failed to get CDS form status', details: error.message });
  }
});

// Get pending CDS submissions
router.get('/cds/pending', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const pendingSubmissions = await cdsFormService.getPendingCDSSubmissions();
    
    res.json({
      success: true,
      submissions: pendingSubmissions
    });
  } catch (error) {
    console.error('Error getting pending CDS submissions:', error);
    res.status(500).json({ error: 'Failed to get pending CDS submissions', details: error.message });
  }
});

// Get CDS approval statistics
router.get('/cds/stats', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const stats = await cdsFormService.getCDSApprovalStats(req.query);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting CDS approval stats:', error);
    res.status(500).json({ error: 'Failed to get CDS approval stats', details: error.message });
  }
});

// ==================== RETURN WORKFLOW ROUTES ====================

// Initiate defective part return
router.post('/:id/initiate-return', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const rma = await returnWorkflowService.initiateReturn(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Return initiated successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error initiating return:', error);
    res.status(500).json({ error: 'Failed to initiate return', details: error.message });
  }
});

// Track return shipment
router.post('/:id/track-return', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const trackingData = await returnWorkflowService.trackReturnShipment(req.params.id);
    
    res.json({
      success: true,
      message: 'Return tracking updated successfully',
      trackingData: trackingData
    });
  } catch (error) {
    console.error('Error tracking return shipment:', error);
    res.status(500).json({ error: 'Failed to track return shipment', details: error.message });
  }
});

// Confirm return delivery
router.post('/:id/confirm-return', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const rma = await returnWorkflowService.confirmReturnDelivery(req.params.id);
    
    res.json({
      success: true,
      message: 'Return delivery confirmed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error confirming return delivery:', error);
    res.status(500).json({ error: 'Failed to confirm return delivery', details: error.message });
  }
});

// Complete RMA process
router.post('/:id/complete', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const rma = await returnWorkflowService.completeRMA(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'RMA completed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error completing RMA:', error);
    res.status(500).json({ error: 'Failed to complete RMA', details: error.message });
  }
});

// Get return workflow status
router.get('/:id/return-status', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const status = await returnWorkflowService.getReturnWorkflowStatus(req.params.id);
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting return workflow status:', error);
    res.status(500).json({ error: 'Failed to get return workflow status', details: error.message });
  }
});

// Get active returns
router.get('/returns/active', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const activeReturns = await returnWorkflowService.getActiveReturns();
    
    res.json({
      success: true,
      returns: activeReturns
    });
  } catch (error) {
    console.error('Error getting active returns:', error);
    res.status(500).json({ error: 'Failed to get active returns', details: error.message });
  }
});

// Get return statistics
router.get('/returns/stats', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const stats = await returnWorkflowService.getReturnStats(req.query);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting return stats:', error);
    res.status(500).json({ error: 'Failed to get return stats', details: error.message });
  }
});

// ==================== WORKFLOW DASHBOARD ROUTES ====================

// Get complete RMA workflow status
router.get('/:id/workflow-status', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    const workflowStatus = {
      rmaNumber: rma.rmaNumber,
      caseStatus: rma.caseStatus,
      approvalStatus: rma.approvalStatus,
      priority: rma.priority,
      warrantyStatus: rma.warrantyStatus,
      createdBy: rma.createdBy,
      createdAt: rma.createdAt,
      updatedAt: rma.updatedAt,
      
      // Email workflow
      emailWorkflow: {
        source: rma.emailThread?.originalEmail?.from || 'Manual',
        subject: rma.emailThread?.originalEmail?.subject || 'N/A',
        receivedAt: rma.emailThread?.originalEmail?.receivedAt || rma.createdAt
      },
      
      // CDS workflow
      cdsWorkflow: rma.cdsWorkflow,
      
      // Return workflow
      returnWorkflow: rma.returnWorkflow,
      
      // Shipping status
      shipping: {
        outbound: rma.shipping.outbound,
        return: rma.shipping.return
      },
      
      // Tracking history
      trackingHistory: rma.trackingHistory,
      
      // SLA information
      sla: rma.sla,
      
      // Completion data
      completionData: rma.completionData
    };

    res.json({
      success: true,
      workflowStatus: workflowStatus
    });
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({ error: 'Failed to get workflow status', details: error.message });
  }
});

// Get RMA workflow statistics
router.get('/workflow/stats', async (req, res) => {
  try {
    const dateRange = req.query;
    
    // Get overall RMA stats
    const rmaStats = await RMA.aggregate([
      {
        $match: dateRange.startDate && dateRange.endDate ? {
          createdAt: {
            $gte: new Date(dateRange.startDate),
            $lte: new Date(dateRange.endDate)
          }
        } : {}
      },
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
          faultyPartReturned: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Faulty Part Returned'] }, 1, 0] }
          },
          cdsConfirmedReturn: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'CDS Confirmed Return'] }, 1, 0] }
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

    const stats = rmaStats[0] || {
      total: 0,
      underReview: 0,
      sentToCDS: 0,
      cdsApproved: 0,
      replacementShipped: 0,
      replacementReceived: 0,
      faultyPartReturned: 0,
      cdsConfirmedReturn: 0,
      completed: 0,
      rejected: 0
    };

    // Calculate workflow metrics
    const totalProcessed = stats.cdsApproved + stats.rejected;
    stats.approvalRate = totalProcessed > 0 ? (stats.cdsApproved / totalProcessed * 100).toFixed(2) : 0;
    
    const totalWithReturns = stats.faultyPartReturned + stats.cdsConfirmedReturn + stats.completed;
    stats.returnCompletionRate = totalWithReturns > 0 ? 
      ((stats.completed / totalWithReturns) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    res.status(500).json({ error: 'Failed to get workflow stats', details: error.message });
  }
});

module.exports = router;