const mongoose = require('mongoose');

// Test the MongoDB connection URL
const testMongoConnection = async () => {
  const mongoURI = 'mongodb://part:dev12345@cluster0-shard-00-00.es90y1z.mongodb.net:27017,cluster0-shard-00-01.es90y1z.mongodb.net:27017,cluster0-shard-00-02.es90y1z.mongodb.net:27017/projector_warranty?ssl=true&replicaSet=atlas-xxxx-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  console.log('🔍 Testing MongoDB Connection...');
  console.log('📋 Connection Details:');
  console.log('   - Host: cluster0-shard-00-00.es90y1z.mongodb.net');
  console.log('   - Database: projector_warranty');
  console.log('   - SSL: true');
  console.log('   - Replica Set: atlas-xxxx-shard-0');
  console.log('   - Auth Source: admin');
  console.log('');

  try {
    console.log('⏳ Attempting to connect...');
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log('✅ MongoDB connection successful!');
    console.log('📊 Connection Status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    console.log('🏷️  Database Name:', mongoose.connection.db.databaseName);
    console.log('🔗 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);

    // Test basic database operations
    console.log('\n🧪 Testing database operations...');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:', collections.length);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Test a simple query
    const stats = await mongoose.connection.db.stats();
    console.log('📈 Database Stats:');
    console.log(`   - Collections: ${stats.collections}`);
    console.log(`   - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n🎉 All tests passed! MongoDB connection is working perfectly.');

  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('🔍 Error Details:');
    console.error('   - Error Type:', error.name);
    console.error('   - Error Message:', error.message);
    
    if (error.code) {
      console.error('   - Error Code:', error.code);
    }
    
    if (error.codeName) {
      console.error('   - Code Name:', error.codeName);
    }

    // Provide specific troubleshooting based on error type
    console.log('\n🔧 Troubleshooting Suggestions:');
    
    if (error.message.includes('authentication failed')) {
      console.log('   - Check username and password');
      console.log('   - Verify the user has proper permissions');
      console.log('   - Ensure authSource=admin is correct');
    }
    
    if (error.message.includes('server selection timeout')) {
      console.log('   - Check network connectivity');
      console.log('   - Verify the cluster is accessible');
      console.log('   - Check if IP is whitelisted in MongoDB Atlas');
    }
    
    if (error.message.includes('replica set')) {
      console.log('   - Verify replica set name is correct');
      console.log('   - Check if all replica set members are accessible');
    }
    
    if (error.message.includes('SSL')) {
      console.log('   - SSL connection might be required');
      console.log('   - Check if ssl=true parameter is needed');
    }

    console.log('\n📋 Connection String Breakdown:');
    console.log('   - Protocol: mongodb://');
    console.log('   - Username: part');
    console.log('   - Password: dev12345');
    console.log('   - Hosts: cluster0-shard-00-00.es90y1z.mongodb.net:27017, cluster0-shard-00-01.es90y1z.mongodb.net:27017, cluster0-shard-00-02.es90y1z.mongodb.net:27017');
    console.log('   - Database: projector_warranty');
    console.log('   - SSL: true');
    console.log('   - Replica Set: atlas-xxxx-shard-0');
    console.log('   - Auth Source: admin');
    console.log('   - Retry Writes: true');
    console.log('   - Write Concern: majority');

  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Connection closed.');
    }
  }
};

// Run the test
testMongoConnection()
  .then(() => {
    console.log('\n✨ Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
