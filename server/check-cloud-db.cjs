const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkCloudDB = async () => {
  try {
    console.log('Checking cloud database...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    // Get the database
    const db = mongoose.connection.db;
    console.log('Connected to database:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections found:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check sites collection specifically
    const sitesCollection = db.collection('sites');
    const sitesCount = await sitesCollection.countDocuments();
    console.log(`\nSites collection has ${sitesCount} documents`);
    
    if (sitesCount > 0) {
      const sampleSite = await sitesCollection.findOne({});
      console.log('Sample site fields:', Object.keys(sampleSite));
      console.log('Sample site name:', sampleSite.name);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking cloud database:', error);
    process.exit(1);
  }
};

// Run the check
checkCloudDB();




