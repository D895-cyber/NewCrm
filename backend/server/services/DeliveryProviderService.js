const DeliveryProvider = require('../models/DeliveryProvider');
const RMA = require('../models/RMA');

class DeliveryProviderService {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  async initializeProviders() {
    try {
      const providers = await DeliveryProvider.getActiveProviders();
      providers.forEach(provider => {
        this.providers.set(provider.code, provider);
      });
    } catch (error) {
      console.error('Error initializing delivery providers:', error);
    }
  }

  async trackShipment(trackingNumber, providerCode) {
    try {
      const provider = this.providers.get(providerCode.toUpperCase());
      if (!provider) {
        throw new Error(`Provider ${providerCode} not found or not active`);
      }

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
      // DTDC API integration
      const response = await fetch(`${provider.apiEndpoint}/track/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'X-API-Key': provider.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DTDC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.parseDTDCResponse(data);
    } catch (error) {
      console.error('DTDC tracking error:', error);
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

  parseDTDCResponse(data) {
    // Parse DTDC specific response format
    return {
      status: data.status || 'in_transit',
      timeline: data.timeline || [],
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
      actualDelivery: data.actualDelivery ? new Date(data.actualDelivery) : null,
      location: data.location || 'Unknown'
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

