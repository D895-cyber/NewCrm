const mongoose = require('mongoose');
const Site = require('../models/Site');
const Projector = require('../models/Projector');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';

async function updateProjectorAuditoriumIds() {
  try {
    console.log('🚀 Starting migration to update projector auditorium IDs...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Get all sites with their auditoriums
    const sites = await Site.find({}).populate('auditoriums');
    console.log(`📋 Found ${sites.length} sites`);
    
    // Get all projectors that need updating
    const projectorsToUpdate = await Projector.find({
      $or: [
        { auditoriumId: { $exists: false } },
        { auditoriumId: null },
        { auditoriumId: undefined }
      ]
    });
    
    console.log(`📋 Found ${projectorsToUpdate.length} projectors that need auditorium ID updates`);
    
    if (projectorsToUpdate.length === 0) {
      console.log('✅ All projectors already have auditorium IDs');
      return;
    }
    
    let updatedCount = 0;
    
    // Update each projector
    for (const projector of projectorsToUpdate) {
      // Find the site for this projector
      const site = sites.find(s => s._id.toString() === projector.siteId.toString());
      
      if (site && site.auditoriums && site.auditoriums.length > 0) {
        // Use the first auditorium (default auditorium we created)
        const defaultAuditorium = site.auditoriums[0];
        
        // Update the projector with auditorium details
        projector.auditoriumId = defaultAuditorium.audiNumber;
        projector.auditoriumName = defaultAuditorium.name;
        
        await projector.save();
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`   - Updated ${updatedCount} projectors...`);
        }
      } else {
        console.log(`   ⚠️  Could not find site or auditoriums for projector ${projector.projectorNumber}`);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Updated ${updatedCount} projectors with auditorium IDs`);
    
    // Verify the update
    const remainingProjectors = await Projector.find({
      $or: [
        { auditoriumId: { $exists: false } },
        { auditoriumId: null },
        { auditoriumId: undefined }
      ]
    });
    
    console.log(`✅ Verification: ${remainingProjectors.length} projectors still need auditorium IDs`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  updateProjectorAuditoriumIds()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateProjectorAuditoriumIds };
