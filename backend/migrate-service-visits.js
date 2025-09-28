const mongoose = require('mongoose');
const ServiceVisit = require('./server/models/ServiceVisit');
const Projector = require('./server/models/Projector');

async function migrateServiceVisits() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projectorcare');
    console.log('Connected to MongoDB');

    // Find service visits that don't have projectorModel
    const visitsWithoutModel = await ServiceVisit.find({
      $or: [
        { projectorModel: { $exists: false } },
        { projectorModel: '' },
        { projectorModel: null }
      ]
    });

    console.log(`Found ${visitsWithoutModel.length} service visits without projector model`);

    let updatedCount = 0;

    for (const visit of visitsWithoutModel) {
      try {
        // Find the projector by serial number
        const projector = await Projector.findOne({ serialNumber: visit.projectorSerial });
        
        if (projector) {
          // Update the service visit with projector model and site address
          await ServiceVisit.findByIdAndUpdate(visit._id, {
            projectorModel: projector.model,
            siteAddress: visit.siteAddress || 'Address not available'
          });
          
          console.log(`Updated visit ${visit.visitId} with model: ${projector.model}`);
          updatedCount++;
        } else {
          console.log(`Projector not found for serial: ${visit.projectorSerial}`);
        }
      } catch (error) {
        console.error(`Error updating visit ${visit.visitId}:`, error.message);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} service visits.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateServiceVisits();
}

module.exports = migrateServiceVisits;

