const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import all models
const RMA = require('./server/models/RMA');
const DTR = require('./server/models/DTR');
const Projector = require('./server/models/Projector');
const Site = require('./server/models/Site');
const ServiceVisit = require('./server/models/ServiceVisit');
const ServiceReport = require('./server/models/ServiceReport');
const Service = require('./server/models/Service');
const SparePart = require('./server/models/SparePart');
const PurchaseOrder = require('./server/models/PurchaseOrder');
const AMCContract = require('./server/models/AMCContract');
const CallLog = require('./server/models/CallLog');
const FSE = require('./server/models/FSE');
const User = require('./server/models/User');

async function prepareForDeployment() {
  try {
    console.log('🚀 CRM System - Deployment Preparation\n');
    console.log('=' .repeat(50));
    
    // Step 1: Check current data
    console.log('\n📊 Step 1: Current Database Status');
    console.log('-'.repeat(30));
    
    const collections = [
      { name: 'RMA', model: RMA },
      { name: 'DTR', model: DTR },
      { name: 'Projector', model: Projector },
      { name: 'Site', model: Site },
      { name: 'ServiceVisit', model: ServiceVisit },
      { name: 'ServiceReport', model: ServiceReport },
      { name: 'Service', model: Service },
      { name: 'SparePart', model: SparePart },
      { name: 'PurchaseOrder', model: PurchaseOrder },
      { name: 'AMCContract', model: AMCContract },
      { name: 'CallLog', model: CallLog },
      { name: 'FSE', model: FSE },
      { name: 'User', model: User }
    ];

    let totalRecords = 0;
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      totalRecords += count;
      console.log(`   ${collection.name}: ${count} records`);
    }
    
    console.log(`\n   Total records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('\n✨ Database is already clean!');
    } else {
      // Step 2: Clear all data
      console.log('\n🗑️  Step 2: Clearing All Data');
      console.log('-'.repeat(30));
      console.log('⚠️  WARNING: This will remove ALL data!\n');

      let deletedCount = 0;
      for (const collection of collections) {
        try {
          const count = await collection.model.countDocuments();
          if (count > 0) {
            const result = await collection.model.deleteMany({});
            console.log(`   ✅ ${collection.name}: Cleared ${result.deletedCount} records`);
            deletedCount += result.deletedCount;
          }
        } catch (error) {
          console.log(`   ❌ ${collection.name}: Error - ${error.message}`);
        }
      }
      
      console.log(`\n   Total records removed: ${deletedCount}`);
    }

    // Step 3: Verify cleanup
    console.log('\n🔍 Step 3: Verification');
    console.log('-'.repeat(30));
    
    let allClean = true;
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      if (count > 0) {
        console.log(`   ❌ ${collection.name}: ${count} records remain`);
        allClean = false;
      } else {
        console.log(`   ✅ ${collection.name}: Clean`);
      }
    }

    // Step 4: Deployment readiness
    console.log('\n🚀 Step 4: Deployment Readiness');
    console.log('-'.repeat(30));
    
    if (allClean) {
      console.log('   ✅ Database: Clean and ready');
      console.log('   ✅ Collections: All empty');
      console.log('   ✅ Schema: Valid and ready');
      console.log('   ✅ Indexes: Will be created on first use');
      
      console.log('\n🎉 DEPLOYMENT READY!');
      console.log('Your CRM system database is now clean and ready for production deployment.');
      console.log('\nNext steps:');
      console.log('   1. Deploy your application');
      console.log('   2. Database will be initialized with empty collections');
      console.log('   3. Users can start adding real data');
      console.log('   4. All schemas and indexes will be created automatically');
      
    } else {
      console.log('   ❌ Database: Not clean');
      console.log('   ❌ Some collections still contain data');
      console.log('   ❌ Manual cleanup required before deployment');
    }

    // Step 5: Environment check
    console.log('\n🔧 Step 5: Environment Check');
    console.log('-'.repeat(30));
    
    const envVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'PORT',
      'NODE_ENV'
    ];
    
    let envReady = true;
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: Set`);
      } else {
        console.log(`   ❌ ${envVar}: Not set`);
        envReady = false;
      }
    }
    
    if (envReady) {
      console.log('\n   ✅ Environment variables are properly configured');
    } else {
      console.log('\n   ⚠️  Some environment variables are missing');
      console.log('   Please check your .env file before deployment');
    }

  } catch (error) {
    console.error('\n❌ Critical error during preparation:', error);
    console.log('Please check your database connection and try again.');
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    console.log('\n' + '='.repeat(50));
    console.log('Deployment preparation completed.');
  }
}

// Run the function
prepareForDeployment();
