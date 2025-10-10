const mongoose = require('mongoose');
const RMA = require('./server/models/RMA');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: __dirname + '/server/.env' });

async function checkDatabaseDirectly() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    // Use the same connection string as the server
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    
    // Check total count
    console.log('\n📊 Checking database counts...');
    const totalCount = await RMA.countDocuments();
    console.log(`📊 Total RMA documents: ${totalCount}`);
    
    // Check with find()
    const allRecords = await RMA.find({});
    console.log(`📊 Records returned by find(): ${allRecords.length}`);
    
    // Check with aggregation
    const aggCount = await RMA.aggregate([
      { $count: "total" }
    ]);
    console.log(`📊 Aggregation count: ${aggCount[0]?.total || 0}`);
    
    // Check recent records
    console.log('\n📊 Recent 5 records:');
    const recentRecords = await RMA.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rmaNumber siteName productName caseStatus createdAt');
    
    recentRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.rmaNumber}: ${record.siteName} - ${record.productName} (${record.caseStatus}) - ${record.createdAt}`);
    });
    
    // Check if there are any records with specific patterns
    console.log('\n📊 Checking for specific patterns...');
    const uniqueRMAs = await RMA.distinct('rmaNumber');
    console.log(`📊 Unique RMA numbers: ${uniqueRMAs.length}`);
    
    if (uniqueRMAs.length > 0) {
      console.log('📊 Sample RMA numbers:', uniqueRMAs.slice(0, 10));
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabaseDirectly();




