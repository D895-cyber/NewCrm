const mongoose = require('mongoose');
const Site = require('./server/models/Site');
const Projector = require('./server/models/Projector');

async function testAnalytics() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/projector-warranty');
    console.log('Connected to MongoDB');

    // Test 1: Check if sites exist
    const sites = await Site.find().limit(3).lean();
    console.log('\n=== SITES ===');
    console.log(`Found ${sites.length} sites`);
    sites.forEach(site => {
      console.log(`- ${site.name} (ID: ${site._id})`);
    });

    // Test 2: Check if projectors exist and their siteName values
    const projectors = await Projector.find().limit(5).lean();
    console.log('\n=== PROJECTORS ===');
    console.log(`Found ${projectors.length} projectors`);
    projectors.forEach(projector => {
      console.log(`- ${projector.serialNumber} -> siteName: "${projector.siteName}"`);
    });

    // Test 3: Test the analytics query logic
    console.log('\n=== ANALYTICS QUERY TEST ===');
    const testSite = sites[0];
    if (testSite) {
      console.log(`Testing with site: ${testSite.name}`);
      
      // Test the old query (should return 0)
      const oldQuery = await Projector.find({ siteId: testSite._id }).lean();
      console.log(`Old query (siteId: ${testSite._id}): ${oldQuery.length} projectors`);
      
      // Test the new query (should return projectors)
      const newQuery = await Projector.find({ siteName: testSite.name }).lean();
      console.log(`New query (siteName: "${testSite.name}"): ${newQuery.length} projectors`);
      
      if (newQuery.length > 0) {
        console.log('Sample projector data:');
        newQuery.slice(0, 3).forEach(p => {
          console.log(`  - ${p.serialNumber} (${p.brand} ${p.model}) - Status: ${p.status}`);
        });
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAnalytics();






