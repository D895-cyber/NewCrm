const mongoose = require('mongoose');
const Site = require('./models/Site');
const Projector = require('./models/Projector');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testSitesEndpoint() {
  try {
    console.log('🧪 Testing Sites Endpoint Logic...\n');
    
    // Simulate the exact logic from the updated sites route
    const sites = await Site.find({})
      .populate('auditoriums')
      .lean();
    
    console.log(`📊 Found ${sites.length} sites\n`);
    
    // Get projector counts for each auditorium and site totals
    for (const site of sites) {
      console.log(`🏢 Site: ${site.name}`);
      
      // Initialize auditoriums array if it doesn't exist (for existing sites)
      if (!site.auditoriums) {
        site.auditoriums = [];
      }
      
      // Get total projectors for the site first
      const totalProjectorCount = await Projector.countDocuments({
        siteId: site._id
      });
      site.totalProjectors = totalProjectorCount;
      console.log(`   - Total Projectors: ${site.totalProjectors}`);
      
      // Get active projectors count
      const activeProjectorCount = await Projector.countDocuments({
        siteId: site._id,
        status: 'Active'
      });
      site.activeProjectors = activeProjectorCount;
      console.log(`   - Active Projectors: ${site.activeProjectors}`);
      
      // Get projector counts for each auditorium
      for (const auditorium of site.auditoriums) {
        const projectorCount = await Projector.countDocuments({
          siteId: site._id,
          auditoriumId: auditorium.audiNumber
        });
        auditorium.projectorCount = projectorCount;
        console.log(`     📽️  ${auditorium.name}: ${auditorium.projectorCount} projectors`);
      }
      
      console.log('');
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing sites endpoint:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSitesEndpoint();






