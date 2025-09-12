const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Projector = require('../models/Projector');
const AMCContract = require('../models/AMCContract');

async function updateProjectorSchemas() {
  try {
    console.log('Starting schema updates...');

    // Update existing projectors to add warranty start field
    console.log('Updating projectors with warranty start dates...');
    
    const projectors = await Projector.find({ warrantyStart: { $exists: false } });
    console.log(`Found ${projectors.length} projectors without warranty start dates`);

    for (const projector of projectors) {
      try {
        // Try to find associated AMC contract
        const amcContract = await AMCContract.findOne({ projectorSerial: projector.serialNumber });
        
        if (amcContract) {
          // Update projector with warranty start date from AMC contract
          await Projector.findByIdAndUpdate(projector._id, {
            warrantyStart: amcContract.contractStartDate
          });
          console.log(`Updated projector ${projector.serialNumber} with warranty start date: ${amcContract.contractStartDate}`);
        } else {
          // If no AMC contract, set warranty start to install date
          await Projector.findByIdAndUpdate(projector._id, {
            warrantyStart: projector.installDate
          });
          console.log(`Updated projector ${projector.serialNumber} with warranty start date: ${projector.installDate} (from install date)`);
        }
      } catch (error) {
        console.error(`Error updating projector ${projector.serialNumber}:`, error.message);
      }
    }

    console.log('Schema updates completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during schema updates:', error);
    process.exit(1);
  }
}

// Run the migration
updateProjectorSchemas();

