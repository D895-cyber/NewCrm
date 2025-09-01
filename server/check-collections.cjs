const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkCollections = async () => {
  try {
    console.log('Checking collections in database...');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    // Get the database
    const db = mongoose.connection.db;
    
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
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking collections:', error);
    process.exit(1);
  }
};

// Run the check
checkCollections();




