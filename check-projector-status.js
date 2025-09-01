const mongoose = require('mongoose');
const Projector = require('./server/models/Projector');

async function checkProjectorStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/projector_warranty');
    
    console.log('=== CHECKING PROJECTOR STATUS ===');
    
    // Count projectors by status
    const statusCounts = await Projector.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Projectors by status:');
    statusCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });
    
    // Check first few projectors
    const projectors = await Projector.find({}).limit(5);
    console.log('\nFirst 5 projectors:');
    projectors.forEach((proj, index) => {
      console.log(`  ${index + 1}. ${proj.projectorNumber} | Status: ${proj.status} | Site: ${proj.siteName}`);
    });
    
    // Check total count
    const totalCount = await Projector.countDocuments({});
    console.log(`\nTotal projectors in DB: ${totalCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkProjectorStatus();
