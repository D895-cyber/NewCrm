const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkSites = async () => {
  try {
    console.log('Checking sites in database...');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    // Get the sites collection directly
    const db = mongoose.connection.db;
    const sitesCollection = db.collection('sites');
    
    const sites = await sitesCollection.find({}).toArray();
    console.log(`Found ${sites.length} sites in database`);
    
    if (sites.length > 0) {
      console.log('Sample site:', JSON.stringify(sites[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking sites:', error);
    process.exit(1);
  }
};

// Run the check
checkSites();





