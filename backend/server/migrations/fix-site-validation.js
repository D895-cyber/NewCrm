const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const generateSiteCode = (siteName, region) => {
  const prefix = region.substring(0, 2).toUpperCase();
  const namePart = siteName.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${namePart}${randomPart}`;
};

const getRegionFromState = (state) => {
  const stateToRegion = {
    // North
    'Delhi': 'North',
    'Haryana': 'North',
    'Punjab': 'North',
    'Himachal Pradesh': 'North',
    'Uttarakhand': 'North',
    'Jammu and Kashmir': 'North',
    'Ladakh': 'North',
    'Chandigarh': 'North',
    
    // South
    'Tamil Nadu': 'South',
    'Karnataka': 'South',
    'Kerala': 'South',
    'Andhra Pradesh': 'South',
    'Telangana': 'South',
    'Puducherry': 'South',
    'Lakshadweep': 'South',
    'Andaman and Nicobar Islands': 'South',
    
    // East
    'West Bengal': 'East',
    'Bihar': 'East',
    'Jharkhand': 'East',
    'Odisha': 'East',
    'Sikkim': 'East',
    
    // West
    'Maharashtra': 'West',
    'Gujarat': 'West',
    'Rajasthan': 'West',
    'Goa': 'West',
    'Dadra and Nagar Haveli': 'West',
    'Daman and Diu': 'West',
    
    // Central
    'Madhya Pradesh': 'Central',
    'Chhattisgarh': 'Central',
    'Uttar Pradesh': 'Central',
    
    // Northeast
    'Assam': 'Northeast',
    'Arunachal Pradesh': 'Northeast',
    'Manipur': 'Northeast',
    'Meghalaya': 'Northeast',
    'Mizoram': 'Northeast',
    'Nagaland': 'Northeast',
    'Tripura': 'Northeast',
    
    // Default
    'default': 'Central'
  };
  
  return stateToRegion[state] || stateToRegion['default'];
};

const fixSiteValidation = async () => {
  try {
    console.log('Starting site validation fix...');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    // Get the sites collection directly to bypass validation
    const db = mongoose.connection.db;
    const sitesCollection = db.collection('sites');
    
    const sites = await sitesCollection.find({}).toArray();
    console.log(`Found ${sites.length} sites to update`);
    
    for (const site of sites) {
      const updates = {};
      
      // Set state from address.state if not already set
      if (!site.state && site.address && site.address.state) {
        updates.state = site.address.state;
      } else if (!site.state) {
        updates.state = 'Maharashtra'; // Default state
      }
      
      // Set region based on state
      if (!site.region) {
        const state = updates.state || site.state || (site.address && site.address.state) || 'Maharashtra';
        updates.region = getRegionFromState(state);
      }
      
      // Generate site code if not present
      if (!site.siteCode) {
        const region = updates.region || site.region || getRegionFromState(updates.state || site.state || 'Maharashtra');
        updates.siteCode = generateSiteCode(site.name, region);
      }
      
      // Update the site if there are changes
      if (Object.keys(updates).length > 0) {
        await sitesCollection.updateOne(
          { _id: site._id },
          { $set: updates }
        );
        console.log(`Updated site: ${site.name} with fields:`, updates);
      }
    }
    
    console.log('Site validation fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Site validation fix failed:', error);
    process.exit(1);
  }
};

// Run the fix
fixSiteValidation();
