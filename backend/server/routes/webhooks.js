const express = require('express');
const router = express.Router();
const RMA = require('../models/RMA');
const DeliveryProvider = require('../models/DeliveryProvider');

// Middleware to verify webhook signatures (implement based on provider requirements)
const verifyWebhookSignature = (req, res, next) => {
  // This is a placeholder - implement actual signature verification based on provider
  // For example, Blue Dart might use HMAC-SHA256, FedEx might use different methods
  next();
};

// Generic webhook handler for delivery provider updates
router.post('/delivery/:provider', verifyWebhookSignature, async (req, res) => {
  try {
    const { provider } = req.params;
    const trackingData = req.body;
    
    console.log(`Received webhook from ${provider}:`, trackingData);
    
    // Find RMA by tracking number
    const rma = await RMA.findOne({
      $or: [
        { 'shipping.outbound.trackingNumber': trackingData.trackingNumber },
        { 'shipping.return.trackingNumber': trackingData.trackingNumber }
      ]
    });
    
    if (!rma) {
      console.log(`No RMA found for tracking number: ${trackingData.trackingNumber}`);
      return res.json({ success: true, message: 'No RMA found for this tracking number' });
    }
    
    // Determine direction (outbound or return)
    const direction = rma.shipping.outbound.trackingNumber === trackingData.trackingNumber ? 'outbound' : 'return';
    const shipping = rma.shipping[direction];
    
    // Check if status has changed
    if (shipping.status !== trackingData.status) {
      console.log(`Status changed for RMA ${rma.rmaNumber} (${direction}): ${shipping.status} -> ${trackingData.status}`);
      
      // Update shipping status
      shipping.status = trackingData.status;
      shipping.lastUpdated = new Date();
      
      // Update additional fields if provided
      if (trackingData.estimatedDelivery) {
        shipping.estimatedDelivery = new Date(trackingData.estimatedDelivery);
      }
      if (trackingData.actualDelivery) {
        shipping.actualDelivery = new Date(trackingData.actualDelivery);
      }
      if (trackingData.location) {
        // Store location in tracking history
      }
      
      // Add to tracking history
      rma.trackingHistory.push({
        timestamp: new Date(),
        status: trackingData.status,
        location: trackingData.location || 'Unknown',
        description: trackingData.description || `Status updated to ${trackingData.status}`,
        carrier: provider.toUpperCase(),
        direction: direction,
        trackingNumber: trackingData.trackingNumber,
        source: 'webhook',
        metadata: {
          provider: provider,
          webhookData: trackingData
        }
      });
      
      // Update last sync time
      rma.deliveryProvider.lastSync = new Date();
      
      await rma.save();
      
      // Calculate SLA breach if delivery is completed
      if (trackingData.status === 'delivered') {
        await rma.calculateSLABreach();
      }
      
      // Send notification (implement notification service)
      await sendTrackingUpdateNotification(rma, trackingData, direction);
      
      console.log(`Successfully updated RMA ${rma.rmaNumber} with new status: ${trackingData.status}`);
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook', details: error.message });
  }
});

// Blue Dart specific webhook handler
router.post('/delivery/blue-dart', async (req, res) => {
  try {
    const trackingData = req.body;
    
    // Parse Blue Dart specific webhook format
    const parsedData = {
      trackingNumber: trackingData.waybill_number,
      status: mapBlueDartStatus(trackingData.status),
      location: trackingData.location,
      description: trackingData.status_description,
      estimatedDelivery: trackingData.estimated_delivery_date,
      actualDelivery: trackingData.actual_delivery_date
    };
    
    // Process using generic handler
    req.body = parsedData;
    req.params.provider = 'blue-dart';
    
    return await router.handle(req, res);
  } catch (error) {
    console.error('Blue Dart webhook error:', error);
    res.status(500).json({ error: 'Failed to process Blue Dart webhook' });
  }
});

// DTDC specific webhook handler
router.post('/delivery/dtdc', async (req, res) => {
  try {
    const trackingData = req.body;
    
    // Parse DTDC specific webhook format
    const parsedData = {
      trackingNumber: trackingData.consignment_number,
      status: mapDTDCStatus(trackingData.status),
      location: trackingData.current_location,
      description: trackingData.status_description,
      estimatedDelivery: trackingData.expected_delivery_date,
      actualDelivery: trackingData.delivery_date
    };
    
    // Process using generic handler
    req.body = parsedData;
    req.params.provider = 'dtdc';
    
    return await router.handle(req, res);
  } catch (error) {
    console.error('DTDC webhook error:', error);
    res.status(500).json({ error: 'Failed to process DTDC webhook' });
  }
});

// FedEx specific webhook handler
router.post('/delivery/fedex', async (req, res) => {
  try {
    const trackingData = req.body;
    
    // Parse FedEx specific webhook format
    const parsedData = {
      trackingNumber: trackingData.trackingNumber,
      status: mapFedExStatus(trackingData.status),
      location: trackingData.location,
      description: trackingData.statusDescription,
      estimatedDelivery: trackingData.estimatedDeliveryDate,
      actualDelivery: trackingData.actualDeliveryDate
    };
    
    // Process using generic handler
    req.body = parsedData;
    req.params.provider = 'fedex';
    
    return await router.handle(req, res);
  } catch (error) {
    console.error('FedEx webhook error:', error);
    res.status(500).json({ error: 'Failed to process FedEx webhook' });
  }
});

// DHL specific webhook handler
router.post('/delivery/dhl', async (req, res) => {
  try {
    const trackingData = req.body;
    
    // Parse DHL specific webhook format
    const parsedData = {
      trackingNumber: trackingData.trackingNumber,
      status: mapDHLStatus(trackingData.status),
      location: trackingData.location,
      description: trackingData.statusDescription,
      estimatedDelivery: trackingData.estimatedDeliveryDate,
      actualDelivery: trackingData.actualDeliveryDate
    };
    
    // Process using generic handler
    req.body = parsedData;
    req.params.provider = 'dhl';
    
    return await router.handle(req, res);
  } catch (error) {
    console.error('DHL webhook error:', error);
    res.status(500).json({ error: 'Failed to process DHL webhook' });
  }
});

// Status mapping functions for different providers
function mapBlueDartStatus(blueDartStatus) {
  const statusMap = {
    'PICKED_UP': 'picked_up',
    'IN_TRANSIT': 'in_transit',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'EXCEPTION': 'exception',
    'RETURNED': 'returned'
  };
  return statusMap[blueDartStatus] || 'pending';
}

function mapDTDCStatus(dtdcStatus) {
  const statusMap = {
    'PICKED_UP': 'picked_up',
    'IN_TRANSIT': 'in_transit',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'EXCEPTION': 'exception',
    'RETURNED': 'returned'
  };
  return statusMap[dtdcStatus] || 'pending';
}

function mapFedExStatus(fedexStatus) {
  const statusMap = {
    'PICKED_UP': 'picked_up',
    'IN_TRANSIT': 'in_transit',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'EXCEPTION': 'exception',
    'RETURNED': 'returned'
  };
  return statusMap[fedexStatus] || 'pending';
}

function mapDHLStatus(dhlStatus) {
  const statusMap = {
    'PICKED_UP': 'picked_up',
    'IN_TRANSIT': 'in_transit',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'EXCEPTION': 'exception',
    'RETURNED': 'returned'
  };
  return statusMap[dhlStatus] || 'pending';
}

// Notification service (placeholder - implement based on your notification system)
async function sendTrackingUpdateNotification(rma, trackingData, direction) {
  try {
    // Implement notification logic here
    // This could include:
    // - Email notifications to relevant stakeholders
    // - SMS notifications for critical updates
    // - Push notifications to mobile apps
    // - Slack/Teams notifications
    // - Dashboard notifications
    
    console.log(`Sending notification for RMA ${rma.rmaNumber} - ${direction} status: ${trackingData.status}`);
    
    // Example notification data structure
    const notificationData = {
      rmaNumber: rma.rmaNumber,
      siteName: rma.siteName,
      direction: direction,
      status: trackingData.status,
      trackingNumber: trackingData.trackingNumber,
      location: trackingData.location,
      description: trackingData.description,
      timestamp: new Date()
    };
    
    // TODO: Implement actual notification sending
    // await NotificationService.send(notificationData);
    
  } catch (error) {
    console.error('Error sending tracking update notification:', error);
  }
}

// Health check endpoint for webhooks
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    message: 'Webhook service is running' 
  });
});

// Test webhook endpoint (for development)
router.post('/test', async (req, res) => {
  try {
    const { trackingNumber, status, provider = 'test' } = req.body;
    
    if (!trackingNumber || !status) {
      return res.status(400).json({ error: 'trackingNumber and status are required' });
    }
    
    // Process test webhook
    req.body = {
      trackingNumber,
      status,
      location: 'Test Location',
      description: `Test status update: ${status}`
    };
    req.params.provider = provider;
    
    return await router.handle(req, res);
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to process test webhook' });
  }
});

module.exports = router;

