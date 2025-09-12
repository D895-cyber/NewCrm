const mongoose = require('mongoose');
const Site = require('./models/Site');
const Projector = require('./models/Projector');
const RMA = require('./models/RMA');
const SparePart = require('./models/SparePart');
const Service = require('./models/Service');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';

async function testAnalytics() {
  try {
    console.log('🚀 Testing Analytics System...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Check if sites exist
    const siteCount = await Site.countDocuments();
    console.log(`📊 Total sites in database: ${siteCount}`);
    
    if (siteCount === 0) {
      console.log('⚠️  No sites found. Please populate the database with sample data first.');
      return;
    }
    
    // Test 2: Check site distribution by region
    const regionalDistribution = await Site.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🌍 Regional Distribution:');
    regionalDistribution.forEach(region => {
      console.log(`   ${region._id}: ${region.count} sites`);
    });
    
    // Test 3: Check projector distribution
    const projectorCount = await Projector.countDocuments();
    console.log(`\n📺 Total projectors: ${projectorCount}`);
    
    if (projectorCount > 0) {
      const projectorStatusDistribution = await Projector.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📊 Projector Status Distribution:');
      projectorStatusDistribution.forEach(status => {
        console.log(`   ${status._id}: ${status.count} projectors`);
      });
    }
    
    // Test 4: Check RMA distribution
    const rmaCount = await RMA.countDocuments();
    console.log(`\n🔄 Total RMAs: ${rmaCount}`);
    
    if (rmaCount > 0) {
      const rmaStatusDistribution = await RMA.aggregate([
        {
          $group: {
            _id: '$caseStatus',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📊 RMA Status Distribution:');
      rmaStatusDistribution.forEach(status => {
        console.log(`   ${status._id}: ${status.count} cases`);
      });
    }
    
    // Test 5: Check spare parts distribution
    const sparePartsCount = await SparePart.countDocuments();
    console.log(`\n🔧 Total spare parts: ${sparePartsCount}`);
    
    if (sparePartsCount > 0) {
      const sparePartsStatusDistribution = await SparePart.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📊 Spare Parts Status Distribution:');
      sparePartsStatusDistribution.forEach(status => {
        console.log(`   ${status._id}: ${status.count} parts`);
      });
    }
    
    // Test 6: Check service distribution
    const serviceCount = await Service.countDocuments();
    console.log(`\n🛠️  Total services: ${serviceCount}`);
    
    // Test 7: Test analytics queries
    console.log('\n🧪 Testing Analytics Queries...');
    
    // Test site analysis query
    const sites = await Site.find().limit(3);
    if (sites.length > 0) {
      console.log('\n📋 Sample Site Analysis:');
      for (const site of sites) {
        const projectors = await Projector.countDocuments({ siteId: site._id });
        const rmas = await RMA.countDocuments({ siteName: site.name });
        
        console.log(`   ${site.name} (${site.siteCode}):`);
        console.log(`     Region: ${site.region}, State: ${site.state}`);
        console.log(`     Projectors: ${projectors}, RMAs: ${rmas}`);
      }
    }
    
    // Test regional analysis
    const regionalAnalysis = await Site.aggregate([
      {
        $group: {
          _id: '$region',
          siteCount: { $sum: 1 },
          states: { $addToSet: '$state' }
        }
      },
      { $sort: { siteCount: -1 } }
    ]);
    
    console.log('\n🌍 Regional Analysis:');
    regionalAnalysis.forEach(region => {
      console.log(`   ${region._id}: ${region.siteCount} sites, ${region.states.length} states`);
    });
    
    console.log('\n✅ Analytics system test completed successfully!');
    console.log('\n💡 To test the full analytics API:');
    console.log('   1. Start the server: npm start (in server directory)');
    console.log('   2. Navigate to /analytics in the frontend');
    console.log('   3. Use the filters to analyze data by region, state, and site code');
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testAnalytics()
    .then(() => {
      console.log('Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testAnalytics };
