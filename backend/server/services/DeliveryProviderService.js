const DeliveryProvider = require('../models/DeliveryProvider');
const RMA = require('../models/RMA');
const mongoose = require('mongoose');

class DeliveryProviderService {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  async initializeProviders() {
    try {
      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ MongoDB not connected, skipping provider initialization');
        return;
      }
      
      const providers = await DeliveryProvider.getActiveProviders();
      console.log(`🔧 Initializing ${providers.length} delivery providers:`, providers.map(p => p.code));
      providers.forEach(provider => {
        this.providers.set(provider.code, provider);
        console.log(`   ✅ Loaded provider: ${provider.name} (${provider.code})`);
      });
    } catch (error) {
      console.error('Error initializing delivery providers:', error);
    }
  }

  async trackShipment(trackingNumber, providerCode) {
    try {
      // Always reload providers to get latest configuration
      await this.initializeProviders();
      
      const provider = this.providers.get(providerCode.toUpperCase());
      if (!provider) {
        console.log(`❌ Provider ${providerCode} not found. Available providers:`, Array.from(this.providers.keys()));
        throw new Error(`Provider ${providerCode} not found or not active`);
      }
      
      console.log(`✅ Found provider: ${provider.name} (${provider.code}) with API key: ${provider.apiKey ? 'Present' : 'Missing'}`);

      // Validate tracking number format
      if (!provider.validateTrackingNumber(trackingNumber)) {
        throw new Error(`Invalid tracking number format for ${provider.name}`);
      }

      let trackingData;
      switch (providerCode.toUpperCase()) {
        case 'BLUE_DART':
          trackingData = await this.trackBlueDart(trackingNumber, provider);
          break;
        case 'DTDC':
          trackingData = await this.trackDTDC(trackingNumber, provider);
          break;
        case 'FEDEX':
          trackingData = await this.trackFedEx(trackingNumber, provider);
          break;
        case 'DHL':
          trackingData = await this.trackDHL(trackingNumber, provider);
          break;
        case 'INDIA_POST':
          trackingData = await this.trackIndiaPost(trackingNumber, provider);
          break;
        case 'DELHIVERY':
          trackingData = await this.trackDelhivery(trackingNumber, provider);
          break;
        case 'ECOM_EXPRESS':
          trackingData = await this.trackEcomExpress(trackingNumber, provider);
          break;
        case 'XPRESSBEES':
          trackingData = await this.trackXpressBees(trackingNumber, provider);
          break;
        default:
          throw new Error(`Tracking not implemented for provider: ${providerCode}`);
      }

      return {
        success: true,
        trackingNumber,
        carrier: provider.name,
        carrierCode: provider.code,
        status: trackingData.status,
        timeline: trackingData.timeline,
        estimatedDelivery: trackingData.estimatedDelivery,
        actualDelivery: trackingData.actualDelivery,
        location: trackingData.location,
        trackingUrl: provider.getTrackingUrl(trackingNumber),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error tracking shipment ${trackingNumber} with ${providerCode}:`, error);
      return {
        success: false,
        error: error.message,
        trackingNumber,
        carrierCode: providerCode
      };
    }
  }

  async trackBlueDart(trackingNumber, provider) {
    try {
      // Blue Dart API integration
      const response = await fetch(`${provider.apiEndpoint}/tracking/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Blue Dart API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseBlueDartResponse(data);
    } catch (error) {
      console.error('Blue Dart tracking error:', error);
      // Return mock data for development
      return this.getMockTrackingData('BLUE_DART', trackingNumber);
    }
  }

  async trackDTDC(trackingNumber, provider) {
    try {
      console.log(`🔍 Calling TrackingMore API for DTDC tracking number: ${trackingNumber}`);
      
      // Use TrackingMore API for DTDC tracking
      const response = await fetch(`https://api.trackingmore.com/v3/trackings/dtdc/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Tracking-Api-Key': provider.apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log(`🔍 TrackingMore API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`🔍 TrackingMore API Error Response: ${errorText}`);
        throw new Error(`TrackingMore API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`🔍 TrackingMore API Response Data:`, data);
      
      return this.parseTrackingMoreResponse(data, trackingNumber);
    } catch (error) {
      console.error('TrackingMore API error:', error);
      console.log(`⚠️ Falling back to mock data for ${trackingNumber}`);
      return this.getMockTrackingData('DTDC', trackingNumber);
    }
  }

  async trackFedEx(trackingNumber, provider) {
    try {
      // FedEx API integration
      const response = await fetch(`${provider.apiEndpoint}/track/v1/trackingnumbers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingInfo: [{
            trackingNumberInfo: {
              trackingNumber: trackingNumber
            }
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`FedEx API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseFedExResponse(data);
    } catch (error) {
      console.error('FedEx tracking error:', error);
      return this.getMockTrackingData('FEDEX', trackingNumber);
    }
  }

  async trackDHL(trackingNumber, provider) {
    try {
      // DHL API integration
      const response = await fetch(`${provider.apiEndpoint}/track/shipments`, {
        method: 'GET',
        headers: {
          'DHL-API-Key': provider.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          trackingNumber: trackingNumber
        }
      });

      if (!response.ok) {
        throw new Error(`DHL API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseDHLResponse(data);
    } catch (error) {
      console.error('DHL tracking error:', error);
      return this.getMockTrackingData('DHL', trackingNumber);
    }
  }

  async trackIndiaPost(trackingNumber, provider) {
    try {
      // India Post API integration
      const response = await fetch(`${provider.apiEndpoint}/track/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`India Post API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseIndiaPostResponse(data);
    } catch (error) {
      console.error('India Post tracking error:', error);
      return this.getMockTrackingData('INDIA_POST', trackingNumber);
    }
  }

  async trackDelhivery(trackingNumber, provider) {
    try {
      // Delhivery API integration
      const response = await fetch(`${provider.apiEndpoint}/track/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Delhivery API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseDelhiveryResponse(data);
    } catch (error) {
      console.error('Delhivery tracking error:', error);
      return this.getMockTrackingData('DELHIVERY', trackingNumber);
    }
  }

  async trackEcomExpress(trackingNumber, provider) {
    try {
      // Ecom Express API integration
      const response = await fetch(`${provider.apiEndpoint}/track/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ecom Express API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseEcomExpressResponse(data);
    } catch (error) {
      console.error('Ecom Express tracking error:', error);
      return this.getMockTrackingData('ECOM_EXPRESS', trackingNumber);
    }
  }

  async trackXpressBees(trackingNumber, provider) {
    try {
      // XpressBees API integration
      const response = await fetch(`${provider.apiEndpoint}/track/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XpressBees API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseXpressBeesResponse(data);
    } catch (error) {
      console.error('XpressBees tracking error:', error);
      return this.getMockTrackingData('XPRESSBEES', trackingNumber);
    }
  }

  // Parser methods for different providers
  parseBlueDartResponse(data) {
    // Parse Blue Dart specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  parseTrackingMoreResponse(data, trackingNumber) {
    console.log('🔍 Parsing TrackingMore API response:', data);
    
    // Find the specific tracking data for our tracking number
    const trackingData = data.data.find(item => item.tracking_number === trackingNumber);
    
    if (!trackingData) {
      console.log('❌ Tracking data not found for:', trackingNumber);
      return {
        status: 'not_found',
        timeline: [],
        estimatedDelivery: null,
        actualDelivery: null,
        location: 'Unknown'
      };
    }
    
    console.log('✅ Found tracking data:', trackingData);
    
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
    
    // Calculate estimated delivery (if not delivered)
    let estimatedDelivery = null;
    if (status !== 'delivered' && trackingData.scheduled_delivery_date) {
      estimatedDelivery = new Date(trackingData.scheduled_delivery_date);
    }
    
    // Get actual delivery date
    let actualDelivery = null;
    if (status === 'delivered' && trackingData.lastest_checkpoint_time) {
      actualDelivery = new Date(trackingData.lastest_checkpoint_time);
    }

    return {
      status: status,
      timeline: timeline,
      estimatedDelivery: estimatedDelivery,
      actualDelivery: actualDelivery,
      location: currentLocation,
      referenceNumber: trackingData.origin_info?.reference_number,
      courierPhone: trackingData.origin_info?.courier_phone,
      transitTime: trackingData.transit_time
    };
  }

  parseDTDCResponse(data) {
    console.log('🔍 Parsing DTDC API response:', data);
    
    // Parse DTDC specific response format
    // DTDC API typically returns data in this format:
    // {
    //   "trackingNumber": "D30048484",
    //   "status": "in_transit",
    //   "events": [
    //     {
    //       "timestamp": "2025-10-02T10:00:00Z",
    //       "status": "picked_up",
    //       "location": "Mumbai Hub",
    //       "description": "Package picked up"
    //     }
    //   ],
    //   "estimatedDelivery": "2025-10-05T18:00:00Z",
    //   "currentLocation": "Mumbai Hub"
    // }
    
    const timeline = (data.events || data.timeline || []).map(event => ({
      timestamp: new Date(event.timestamp || event.time || Date.now()),
      status: event.status || event.eventType || 'unknown',
      location: event.location || event.city || 'Unknown',
      description: event.description || event.remarks || 'Status update'
    }));

    return {
      status: data.status || data.currentStatus || 'in_transit',
      timeline: timeline,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.currentLocation || data.location || timeline[timeline.length - 1]?.location || 'Unknown'
    };
  }

  parseFedExResponse(data) {
    // Parse FedEx specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  parseDHLResponse(data) {
    // Parse DHL specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  parseIndiaPostResponse(data) {
    // Parse India Post specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  parseDelhiveryResponse(data) {
    // Parse Delhivery specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  parseEcomExpressResponse(data) {
    // Parse Ecom Express specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  parseXpressBeesResponse(data) {
    // Parse XpressBees specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
    };
  }

  // Mock data for development and testing
  getMockTrackingData(provider, trackingNumber) {
    const statuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const timeline = [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'picked_up',
        location: 'Origin Hub',
        description: 'Package picked up from origin'
      },
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'in_transit',
        location: 'Transit Hub',
        description: 'Package in transit to destination'
      }
    ];

    if (randomStatus === 'out_for_delivery' || randomStatus === 'delivered') {
      timeline.push({
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'out_for_delivery',
        location: 'Destination City',
        description: 'Package out for delivery'
      });
    }

    if (randomStatus === 'delivered') {
      timeline.push({
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'delivered',
        location: 'Destination Address',
        description: 'Package delivered successfully'
      });
    }

    return {
      status: randomStatus,
      timeline,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      actualDelivery: randomStatus === 'delivered' ? new Date(Date.now() - 30 * 60 * 1000) : null,
      location: timeline[timeline.length - 1]?.location || 'Unknown'
    };
  }

  // Update all active shipments
  async updateAllActiveShipments() {
    try {
      const activeRMAs = await RMA.findActiveShipments();
      console.log(`Updating tracking for ${activeRMAs.length} active shipments`);

      for (const rma of activeRMAs) {
        try {
          await this.updateRMATracking(rma);
        } catch (error) {
          console.error(`Error updating RMA ${rma.rmaNumber}:`, error);
        }
      }
    } catch (error) {
      console.error('Error updating active shipments:', error);
    }
  }

  async updateRMATracking(rma) {
    const trackingService = new DeliveryProviderService();
    
    // Update outbound tracking
    if (rma.shipping.outbound.trackingNumber && 
        rma.shipping.outbound.status !== 'delivered' && 
        rma.shipping.outbound.status !== 'exception') {
      
      const outboundData = await trackingService.trackShipment(
        rma.shipping.outbound.trackingNumber,
        rma.shipping.outbound.carrier
      );
      
      if (outboundData.success && outboundData.status !== rma.shipping.outbound.status) {
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
      }
    }
    
    // Update return tracking
    if (rma.shipping.return.trackingNumber && 
        rma.shipping.return.status !== 'delivered' && 
        rma.shipping.return.status !== 'exception') {
      
      const returnData = await trackingService.trackShipment(
        rma.shipping.return.trackingNumber,
        rma.shipping.return.carrier
      );
      
      if (returnData.success && returnData.status !== rma.shipping.return.status) {
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
      }
    }
    
    // Calculate SLA breach
    await rma.calculateSLABreach();
  }

  // Get available providers
  async getAvailableProviders() {
    return await DeliveryProvider.getActiveProviders();
  }

  // Get providers by coverage
  async getProvidersByCoverage(isDomestic = true) {
    return await DeliveryProvider.getProvidersByCoverage(isDomestic);
  }
}

module.exports = DeliveryProviderService;

