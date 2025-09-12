const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const RMA = require('./server/models/RMA');
const DTR = require('./server/models/DTR');
const Projector = require('./server/models/Projector');
const Site = require('./server/models/Site');
const ServiceVisit = require('./server/models/ServiceVisit');
const ServiceReport = require('./server/models/ServiceReport');

async function clearSampleData() {
  try {
    console.log('Starting to clear sample data...\n');

    // Clear RMAs
    const rmaResult = await RMA.deleteMany({});
    console.log(`✅ Cleared ${rmaResult.deletedCount} RMA records`);

    // Clear DTRs
    const dtrResult = await DTR.deleteMany({});
    console.log(`✅ Cleared ${dtrResult.deletedCount} DTR records`);

    // Clear Service Visits
    const serviceVisitResult = await ServiceVisit.deleteMany({});
    console.log(`✅ Cleared ${serviceVisitResult.deletedCount} Service Visit records`);

    // Clear Service Reports
    const serviceReportResult = await ServiceReport.deleteMany({});
    console.log(`✅ Cleared ${serviceReportResult.deletedCount} Service Report records`);

    // Clear Projectors (sample ones)
    const projectorResult = await Projector.deleteMany({
      $or: [
        { serialNumber: { $regex: /^SAMPLE-/, $options: 'i' } },
        { model: { $regex: /^Sample/, $options: 'i' } },
        { brand: { $regex: /^Sample/, $options: 'i' } }
      ]
    });
    console.log(`✅ Cleared ${projectorResult.deletedCount} sample Projector records`);

    // Clear Sites (sample ones)
    const siteResult = await Site.deleteMany({
      $or: [
        { name: { $regex: /^Sample/, $options: 'i' } },
        { name: { $regex: /^Test/, $options: 'i' } },
        { address: { $regex: /^Sample/, $options: 'i' } }
      ]
    });
    console.log(`✅ Cleared ${siteResult.deletedCount} sample Site records`);

    // Show remaining data counts
    console.log('\n📊 Remaining data counts:');
    
    const remainingRMAs = await RMA.countDocuments();
    const remainingDTRs = await DTR.countDocuments();
    const remainingProjectors = await Projector.countDocuments();
    const remainingSites = await Site.countDocuments();
    const remainingServiceVisits = await ServiceVisit.countDocuments();
    const remainingServiceReports = await ServiceReport.countDocuments();

    console.log(`   RMA Records: ${remainingRMAs}`);
    console.log(`   DTR Records: ${remainingDTRs}`);
    console.log(`   Projectors: ${remainingProjectors}`);
    console.log(`   Sites: ${remainingSites}`);
    console.log(`   Service Visits: ${remainingServiceVisits}`);
    console.log(`   Service Reports: ${remainingServiceReports}`);

    console.log('\n🎯 Sample data clearing completed successfully!');
    
    if (remainingRMAs === 0 && remainingDTRs === 0) {
      console.log('✨ Database is now clean with no sample records.');
    } else {
      console.log('⚠️  Some records remain - these may be real data or need manual review.');
    }

  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the function
clearSampleData();
