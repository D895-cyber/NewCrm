const mongoose = require('mongoose');
const Site = require('../models/Site');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';

async function addAuditoriumsToExistingSites() {
  try {
    console.log('🚀 Starting migration to add auditoriums to existing sites...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Find sites that don't have auditoriums field
    const sitesWithoutAuditoriums = await Site.find({
      $or: [
        { auditoriums: { $exists: false } },
        { auditoriums: null }
      ]
    });
    
    console.log(`📋 Found ${sitesWithoutAuditoriums.length} sites without auditoriums`);
    
    if (sitesWithoutAuditoriums.length === 0) {
      console.log('✅ All sites already have auditoriums field');
      return;
    }
    
    // Update each site to add default auditorium
    for (const site of sitesWithoutAuditoriums) {
      const defaultAuditorium = {
        audiNumber: 'AUDI-01',
        name: 'Main Auditorium',
        capacity: 100,
        screenSize: 'Standard',
        projectorCount: 0,
        status: 'Active',
        notes: 'Default auditorium created during migration'
      };
      
      site.auditoriums = [defaultAuditorium];
      await site.save();
      
      console.log(`✅ Added default auditorium to site: ${site.name}`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Updated ${sitesWithoutAuditoriums.length} sites`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  addAuditoriumsToExistingSites()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addAuditoriumsToExistingSites };
