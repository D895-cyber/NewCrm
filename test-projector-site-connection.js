const mongoose = require('mongoose');
const Site = require('./server/models/Site');
const Projector = require('./server/models/Projector');

async function testProjectorSiteConnection() {
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

    // Test the exact query used in analytics
    console.log('\n=== TESTING ANALYTICS QUERY ===');
    for (const site of sites.slice(0, 3)) {
      console.log(`\nTesting site: "${site.name}"`);
      const projectorsForSite = await Projector.find({ siteName: site.name }).lean();
      console.log(`Found ${projectorsForSite.length} projectors for this site`);
      
      if (projectorsForSite.length > 0) {
        projectorsForSite.forEach(p => {
          console.log(`  - ${p.serialNumber} (${p.brand} ${p.model})`);
        });
      }
    }

    // Check for any projectors with empty or null siteName
    const projectorsWithNoSite = await Projector.find({
      $or: [
        { siteName: { $exists: false } },
        { siteName: null },
        { siteName: "" }
      ]
    }).lean();
    
    if (projectorsWithNoSite.length > 0) {
      console.log('\n=== PROJECTORS WITH NO SITE NAME ===');
      projectorsWithNoSite.forEach(p => {
        console.log(`- ${p.serialNumber}: siteName = "${p.siteName}"`);
      });
    }

    // Check for exact string matches
    console.log('\n=== EXACT STRING MATCH TEST ===');
    const sampleSite = sites[0];
    const exactMatch = await Projector.find({ siteName: sampleSite.name }).lean();
    const regexMatch = await Projector.find({ siteName: { $regex: sampleSite.name, $options: 'i' } }).lean();
    
    console.log(`Site: "${sampleSite.name}"`);
    console.log(`Exact match: ${exactMatch.length} projectors`);
    console.log(`Regex match: ${regexMatch.length} projectors`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testProjectorSiteConnection();






