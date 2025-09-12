const mongoose = require('mongoose');
const Site = require('./server/models/Site');
const Projector = require('./server/models/Projector');

async function debugAnalytics() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/projector-warranty');
    console.log('Connected to MongoDB');

    // Get a few sites
    const sites = await Site.find().limit(5).lean();
    console.log('\n=== SITES ===');
    sites.forEach(site => {
      console.log(`Site: "${site.name}" (ID: ${site._id})`);
    });

    // Get a few projectors
    const projectors = await Projector.find().limit(10).lean();
    console.log('\n=== PROJECTORS ===');
    projectors.forEach(projector => {
      console.log(`Projector: ${projector.serialNumber} -> siteName: "${projector.siteName}"`);
    });

    // Test the exact query that analytics uses
    console.log('\n=== ANALYTICS QUERY TEST ===');
    const testSite = sites[0];
    if (testSite) {
      console.log(`\nTesting with site: "${testSite.name}"`);
      
      // Test the exact query from analytics
      const projectorsForSite = await Projector.find({ siteName: testSite.name }).lean();
      console.log(`Query: { siteName: "${testSite.name}" }`);
      console.log(`Result: ${projectorsForSite.length} projectors found`);
      
      if (projectorsForSite.length > 0) {
        console.log('Found projectors:');
        projectorsForSite.slice(0, 3).forEach(p => {
          console.log(`  - ${p.serialNumber} (${p.brand} ${p.model})`);
        });
      } else {
        // Check if there are projectors with similar names
        const similarProjectors = await Projector.find({
          siteName: { $regex: testSite.name.split(' ')[0], $options: 'i' }
        }).limit(5).lean();
        
        console.log(`\nChecking for similar names (starting with "${testSite.name.split(' ')[0]}"):`);
        similarProjectors.forEach(p => {
          console.log(`  - "${p.siteName}"`);
        });
      }
    }

    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugAnalytics();






