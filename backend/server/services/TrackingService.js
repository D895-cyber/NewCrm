const axios = require('axios');
const cheerio = require('cheerio');

class TrackingService {
  constructor() {
    this.baseUrl = 'https://trackcourier.io/track-and-trace';
    this.supportedCouriers = [
      'dtdc', 'blue-dart', 'delhivery', 'fedex', 'dhl', 'ups', 'tcs', 
      'gati', 'safexpress', 'ekart', 'xpressbees', 'shadowfax'
    ];
  }

  /**
   * Get actual delivery date from tracking API
   * @param {string} courierName - Name of the courier service
   * @param {string} trackingNumber - Tracking/docket number
   * @returns {Promise<Object>} - Delivery information
   */
  async getActualDeliveryDate(courierName, trackingNumber) {
    try {
      if (!courierName || !trackingNumber) {
        throw new Error('Courier name and tracking number are required');
      }

      // Normalize courier name for URL
      const normalizedCourier = this.normalizeCourierName(courierName);
      
      // Construct tracking URL
      const trackingUrl = `${this.baseUrl}/${normalizedCourier}/${trackingNumber}`;
      
      console.log(`🔍 Fetching tracking data from: ${trackingUrl}`);

      // Fetch tracking page
      const response = await axios.get(trackingUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Parse the HTML response
      const $ = cheerio.load(response.data);
      
      // Extract tracking information
      const trackingInfo = this.parseTrackingResponse($, courierName, trackingNumber);
      
      return {
        success: true,
        courierName: courierName,
        trackingNumber: trackingNumber,
        trackingUrl: trackingUrl,
        ...trackingInfo
      };

    } catch (error) {
      console.error(`❌ Error fetching tracking data for ${courierName} ${trackingNumber}:`, error.message);
      return {
        success: false,
        courierName: courierName,
        trackingNumber: trackingNumber,
        error: error.message,
        actualDeliveryDate: null,
        status: 'Error fetching tracking data'
      };
    }
  }

  /**
   * Normalize courier name for URL
   * @param {string} courierName - Original courier name
   * @returns {string} - Normalized courier name
   */
  normalizeCourierName(courierName) {
    const courierMap = {
      'dtdc': 'dtdc',
      'blue dart': 'blue-dart',
      'delhivery': 'delhivery',
      'fedex': 'fedex',
      'dhl': 'dhl',
      'ups': 'ups',
      'tcs': 'tcs',
      'gati': 'gati',
      'safexpress': 'safexpress',
      'ekart': 'ekart',
      'xpressbees': 'xpressbees',
      'shadowfax': 'shadowfax'
    };

    const normalized = courierName.toLowerCase().trim();
    return courierMap[normalized] || normalized.replace(/\s+/g, '-');
  }

  /**
   * Parse tracking response from HTML
   * @param {Object} $ - Cheerio object
   * @param {string} courierName - Courier name
   * @param {string} trackingNumber - Tracking number
   * @returns {Object} - Parsed tracking information
   */
  parseTrackingResponse($, courierName, trackingNumber) {
    try {
      // Look for delivery status and date
      let actualDeliveryDate = null;
      let status = 'In Transit';
      let lastLocation = 'Unknown';
      let trackingHistory = [];

      // Try to find delivery information in various formats
      const deliveryIndicators = [
        'delivered', 'delivery completed', 'delivered to', 'successfully delivered',
        'out for delivery', 'delivery attempted', 'delivery failed'
      ];

      // Look for tracking history or status information
      $('*').each((i, element) => {
        const text = $(element).text().toLowerCase();
        
        // Check for delivery status
        if (deliveryIndicators.some(indicator => text.includes(indicator))) {
          status = 'Delivered';
          
          // Try to extract date from the same element or nearby elements
          const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
          if (dateMatch) {
            actualDeliveryDate = this.parseDate(dateMatch[0]);
          }
        }
      });

      // If no delivery date found, look for the most recent date in tracking
      if (!actualDeliveryDate) {
        const allDates = [];
        $('*').each((i, element) => {
          const text = $(element).text();
          const dateMatches = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g);
          if (dateMatches) {
            dateMatches.forEach(dateStr => {
              const parsedDate = this.parseDate(dateStr);
              if (parsedDate) {
                allDates.push(parsedDate);
              }
            });
          }
        });

        // Use the most recent date if available
        if (allDates.length > 0) {
          actualDeliveryDate = new Date(Math.max(...allDates));
        }
      }

      return {
        actualDeliveryDate: actualDeliveryDate,
        status: status,
        lastLocation: lastLocation,
        trackingHistory: trackingHistory,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error parsing tracking response:', error);
      return {
        actualDeliveryDate: null,
        status: 'Error parsing response',
        lastLocation: 'Unknown',
        trackingHistory: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Parse date string to Date object
   * @param {string} dateStr - Date string
   * @returns {Date|null} - Parsed date or null
   */
  parseDate(dateStr) {
    try {
      // Handle different date formats
      const formats = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/   // MM/DD/YY or DD/MM/YY
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let year, month, day;
          
          if (format === formats[0]) { // MM/DD/YYYY or DD/MM/YYYY
            const [, part1, part2, part3] = match;
            // Assume DD/MM/YYYY format (common in India)
            day = parseInt(part1);
            month = parseInt(part2) - 1; // JavaScript months are 0-indexed
            year = parseInt(part3);
          } else if (format === formats[1]) { // YYYY/MM/DD
            const [, part1, part2, part3] = match;
            year = parseInt(part1);
            month = parseInt(part2) - 1;
            day = parseInt(part3);
          } else { // MM/DD/YY or DD/MM/YY
            const [, part1, part2, part3] = match;
            day = parseInt(part1);
            month = parseInt(part2) - 1;
            year = 2000 + parseInt(part3);
          }

          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * Batch fetch delivery dates for multiple RMAs
   * @param {Array} rmas - Array of RMA objects with courier and tracking info
   * @returns {Promise<Array>} - Array of updated RMA data
   */
  async batchFetchDeliveryDates(rmas) {
    const results = [];
    
    for (const rma of rmas) {
      try {
        const trackingInfo = await this.getActualDeliveryDate(
          rma.courierName || rma.carrier,
          rma.trackingNumber || rma.docketNumber
        );
        
        results.push({
          rmaId: rma._id,
          rmaNumber: rma.rmaNumber,
          trackingInfo: trackingInfo
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing RMA ${rma.rmaNumber}:`, error);
        results.push({
          rmaId: rma._id,
          rmaNumber: rma.rmaNumber,
          trackingInfo: {
            success: false,
            error: error.message
          }
        });
      }
    }
    
    return results;
  }
}

module.exports = TrackingService;
