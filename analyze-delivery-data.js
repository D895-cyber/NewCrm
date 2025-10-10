#!/usr/bin/env node

/**
 * Comprehensive delivery data analysis script
 * This will help identify why delivery dates are showing as today's date
 */

const mongoose = require('mongoose');

// RMA Schema for analysis
const rmaSchema = new mongoose.Schema({
  rmaNumber: String,
  siteName: String,
  caseStatus: String,
  shippedDate: Date,
  rmaReturnShippedDate: Date,
  trackingNumber: String,
  shippedThru: String,
  carrier: String,
  shipping: {
    outbound: {
      trackingNumber: String,
      carrier: String,
      shippedDate: Date,
      actualDelivery: Date,
      status: String
    },
    return: {
      trackingNumber: String,
      carrier: String,
      shippedDate: Date,
      actualDelivery: Date,
      status: String
    }
  },
  updatedAt: Date,
  createdAt: Date
}, { timestamps: true });

const RMA = mongoose.model('RMA', rmaSchema);

async function analyzeDeliveryData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Comprehensive Delivery Data Analysis\n');

    // 1. Get all completed RMAs
    const completedRMAs = await RMA.find({
      caseStatus: 'Completed'
    })
    .select('rmaNumber siteName caseStatus shippedDate rmaReturnShippedDate trackingNumber shippedThru carrier shipping updatedAt createdAt')
    .sort({ updatedAt: -1 });

    console.log(`📊 Total Completed RMAs: ${completedRMAs.length}\n`);

    // 2. Analyze delivery date sources
    console.log('📅 Delivery Date Source Analysis:\n');
    
    const deliveryDateAnalysis = {
      hasActualDeliveryOutbound: 0,
      hasActualDeliveryReturn: 0,
      hasReturnShippedDate: 0,
      hasShippedDate: 0,
      usingUpdatedAt: 0,
      hasTrackingNumber: 0,
      hasCarrierInfo: 0
    };

    completedRMAs.forEach(rma => {
      // Check actual delivery dates
      if (rma.shipping?.outbound?.actualDelivery) {
        deliveryDateAnalysis.hasActualDeliveryOutbound++;
      }
      if (rma.shipping?.return?.actualDelivery) {
        deliveryDateAnalysis.hasActualDeliveryReturn++;
      }
      if (rma.rmaReturnShippedDate) {
        deliveryDateAnalysis.hasReturnShippedDate++;
      }
      if (rma.shippedDate) {
        deliveryDateAnalysis.hasShippedDate++;
      }
      if (rma.trackingNumber || rma.shipping?.outbound?.trackingNumber || rma.shipping?.return?.trackingNumber) {
        deliveryDateAnalysis.hasTrackingNumber++;
      }
      if (rma.shippedThru || rma.carrier || rma.shipping?.outbound?.carrier || rma.shipping?.return?.carrier) {
        deliveryDateAnalysis.hasCarrierInfo++;
      }
    });

    console.log('   Delivery Date Sources:');
    console.log(`      Outbound Actual Delivery: ${deliveryDateAnalysis.hasActualDeliveryOutbound}`);
    console.log(`      Return Actual Delivery: ${deliveryDateAnalysis.hasActualDeliveryReturn}`);
    console.log(`      Return Shipped Date: ${deliveryDateAnalysis.hasReturnShippedDate}`);
    console.log(`      Shipped Date: ${deliveryDateAnalysis.hasShippedDate}`);
    console.log(`      Has Tracking Numbers: ${deliveryDateAnalysis.hasTrackingNumber}`);
    console.log(`      Has Carrier Info: ${deliveryDateAnalysis.hasCarrierInfo}`);

    // 3. Check for tracking API candidates
    console.log('\n🎯 Tracking API Integration Analysis:\n');
    
    const trackingCandidates = completedRMAs.filter(rma => {
      const hasTracking = rma.trackingNumber || 
                         rma.shipping?.outbound?.trackingNumber || 
                         rma.shipping?.return?.trackingNumber;
      const hasCarrier = rma.shippedThru || 
                        rma.carrier || 
                        rma.shipping?.outbound?.carrier || 
                        rma.shipping?.return?.carrier;
      return hasTracking && hasCarrier;
    });

    console.log(`   RMAs ready for tracking API: ${trackingCandidates.length}`);
    
    if (trackingCandidates.length > 0) {
      console.log('\n   Top 10 tracking candidates:');
      trackingCandidates.slice(0, 10).forEach((rma, index) => {
        const courierName = rma.shippedThru || rma.carrier || rma.shipping?.outbound?.carrier || rma.shipping?.return?.carrier;
        const trackingNumber = rma.trackingNumber || rma.shipping?.outbound?.trackingNumber || rma.shipping?.return?.trackingNumber;
        
        console.log(`      ${index + 1}. ${rma.rmaNumber} - ${courierName} ${trackingNumber}`);
      });
    }

    // 4. Date pattern analysis
    console.log('\n📅 Date Pattern Analysis:\n');
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const dateCounts = {};
    const todayCount = { count: 0, rmAs: [] };
    
    completedRMAs.forEach(rma => {
      const date = rma.updatedAt ? rma.updatedAt.toISOString().split('T')[0] : 'No Date';
      dateCounts[date] = (dateCounts[date] || 0) + 1;
      
      if (date === todayStr) {
        todayCount.count++;
        todayCount.rmAs.push(rma.rmaNumber);
      }
    });
    
    console.log(`   RMAs updated today (${todayStr}): ${todayCount.count}`);
    if (todayCount.count > 0) {
      console.log(`   RMAs with today's date: ${todayCount.rmAs.slice(0, 5).join(', ')}${todayCount.rmAs.length > 5 ? '...' : ''}`);
    }
    
    console.log('\n   Top 10 most common update dates:');
    Object.entries(dateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([date, count]) => {
        console.log(`      ${date}: ${count} RMAs`);
      });

    // 5. Recommendations
    console.log('\n💡 Recommendations:\n');
    
    if (deliveryDateAnalysis.hasTrackingNumber > 0 && deliveryDateAnalysis.hasCarrierInfo > 0) {
      console.log('   ✅ Tracking API Integration:');
      console.log(`      - ${deliveryDateAnalysis.hasTrackingNumber} RMAs have tracking numbers`);
      console.log(`      - ${deliveryDateAnalysis.hasCarrierInfo} RMAs have carrier information`);
      console.log('      - Ready to use TrackCourier.io API for real delivery dates');
    } else {
      console.log('   ⚠️  Limited tracking data available');
      console.log('      - Consider adding tracking numbers and carrier info to RMAs');
    }
    
    if (deliveryDateAnalysis.hasActualDeliveryOutbound === 0 && deliveryDateAnalysis.hasActualDeliveryReturn === 0) {
      console.log('   ⚠️  No actual delivery dates in database');
      console.log('      - All delivery dates are falling back to updatedAt timestamp');
      console.log('      - This explains why most show today\'s date');
    }
    
    if (todayCount.count > 5) {
      console.log('   ⚠️  Many RMAs updated today');
      console.log('      - This suggests bulk updates or data imports');
      console.log('      - Consider using tracking API for real delivery dates');
    }

    // 6. Sample data for testing
    console.log('\n🧪 Sample Data for Testing:\n');
    
    const sampleRMAs = completedRMAs.slice(0, 5);
    sampleRMAs.forEach((rma, index) => {
      console.log(`   Sample ${index + 1}: ${rma.rmaNumber}`);
      console.log(`      Site: ${rma.siteName}`);
      console.log(`      Updated: ${rma.updatedAt}`);
      console.log(`      Tracking: ${rma.trackingNumber || 'N/A'}`);
      console.log(`      Carrier: ${rma.shippedThru || rma.carrier || 'N/A'}`);
      console.log(`      Outbound Delivery: ${rma.shipping?.outbound?.actualDelivery || 'N/A'}`);
      console.log(`      Return Delivery: ${rma.shipping?.return?.actualDelivery || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the analysis
if (require.main === module) {
  analyzeDeliveryData();
}

module.exports = { analyzeDeliveryData };
