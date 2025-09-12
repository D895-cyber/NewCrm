const mongoose = require('mongoose');
const Site = require('../models/Site');
const Projector = require('../models/Projector');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';

async function fixProjectorSiteMapping() {
  try {
    console.log('🚀 Starting migration to fix projector-site mapping...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Get all current sites with their auditoriums
    const sites = await Site.find({}).populate('auditoriums');
    console.log(`📋 Found ${sites.length} current sites`);
    
    // Get all projectors that need updating
    const projectorsToUpdate = await Projector.find({
      $or: [
        { auditoriumId: { $exists: false } },
        { auditoriumId: null },
        { auditoriumId: undefined }
      ]
    });
    
    console.log(`📋 Found ${projectorsToUpdate.length} projectors that need site mapping updates`);
    
    if (projectorsToUpdate.length === 0) {
      console.log('✅ All projectors already have proper site mapping');
      return;
    }
    
    // Create a mapping strategy: distribute projectors evenly across sites
    // Since we have 548 projectors and 5 sites, each site will get ~110 projectors
    const projectorsPerSite = Math.ceil(projectorsToUpdate.length / sites.length);
    
    console.log(`📊 Distribution: ~${projectorsPerSite} projectors per site`);
    
    let updatedCount = 0;
    let currentSiteIndex = 0;
    let projectorsInCurrentSite = 0;
    
    // Update each projector
    for (const projector of projectorsToUpdate) {
      // Get current site and its default auditorium
      const currentSite = sites[currentSiteIndex];
      const defaultAuditorium = currentSite.auditoriums[0];
      
      if (!defaultAuditorium) {
        console.log(`   ⚠️  Site ${currentSite.name} has no auditoriums, skipping...`);
        continue;
      }
      
      // Generate projectorNumber if it doesn't exist
      if (!projector.projectorNumber) {
        projector.projectorNumber = `PROJ-${String(updatedCount + 1).padStart(6, '0')}`;
      }
      
      // Update the projector with new site and auditorium details
      projector.siteId = currentSite._id;
      projector.siteName = currentSite.name;
      projector.siteCode = currentSite.siteCode;
      projector.auditoriumId = defaultAuditorium.audiNumber;
      projector.auditoriumName = defaultAuditorium.name;
      
      // Map old fields to new fields if they exist
      if (projector.site && !projector.siteName) {
        projector.siteName = projector.site;
      }
      if (projector.location && !projector.location) {
        projector.location = projector.location;
      }
      
      await projector.save();
      updatedCount++;
      projectorsInCurrentSite++;
      
      // Move to next site if we've assigned enough projectors to current site
      if (projectorsInCurrentSite >= projectorsPerSite && currentSiteIndex < sites.length - 1) {
        currentSiteIndex++;
        projectorsInCurrentSite = 0;
        console.log(`   🔄 Moving to next site: ${sites[currentSiteIndex].name}`);
      }
      
      // Progress update every 50 projectors
      if (updatedCount % 50 === 0) {
        console.log(`   - Updated ${updatedCount} projectors...`);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Updated ${updatedCount} projectors with new site mapping`);
    
    // Verify the update
    const remainingProjectors = await Projector.find({
      $or: [
        { auditoriumId: { $exists: false } },
        { auditoriumId: null },
        { auditoriumId: undefined }
      ]
    });
    
    console.log(`✅ Verification: ${remainingProjectors.length} projectors still need auditorium IDs`);
    
    // Show distribution summary
    console.log('\n📈 Distribution Summary:');
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const projectorCount = await Projector.countDocuments({ siteId: site._id });
      console.log(`   ${site.name}: ${projectorCount} projectors`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  fixProjectorSiteMapping()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixProjectorSiteMapping };
