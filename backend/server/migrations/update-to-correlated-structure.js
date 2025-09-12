const mongoose = require('mongoose');
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const AMCContract = require('../models/AMCContract');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';

async function migrateToCorrelatedStructure() {
  try {
    console.log('🚀 Starting migration to correlated structure...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Update existing sites to include auditoriums
    console.log('\n📋 Step 1: Updating sites with auditoriums...');
    const sites = await Site.find({});
    
    for (const site of sites) {
      // Create default auditorium if none exists
      if (!site.auditoriums || site.auditoriums.length === 0) {
        const defaultAuditorium = {
          audiNumber: 'AUDI-01',
          name: 'Main Auditorium',
          capacity: 100,
          screenSize: 'Standard',
          projectorCount: 0,
          status: 'Active',
          notes: 'Default auditorium created during migration'
        };
        
        site.auditoriums = [defaultAuditorium];
        await site.save();
        console.log(`✅ Added default auditorium to site: ${site.name}`);
      }
    }
    
    // Step 2: Update existing projectors to link with auditoriums
    console.log('\n📋 Step 2: Updating projectors with auditorium links...');
    const projectors = await Projector.find({});
    
    for (const projector of projectors) {
      try {
        // Find the site for this projector
        const site = await Site.findById(projector.siteId);
        if (!site) {
          console.log(`⚠️  Site not found for projector: ${projector.serialNumber}`);
          continue;
        }
        
        // Get the first auditorium (or create one if none exists)
        let auditorium = site.auditoriums[0];
        if (!auditorium) {
          const defaultAuditorium = {
            audiNumber: 'AUDI-01',
            name: 'Main Auditorium',
            capacity: 100,
            screenSize: 'Standard',
            projectorCount: 0,
            status: 'Active',
            notes: 'Default auditorium created during migration'
          };
          site.auditoriums = [defaultAuditorium];
          await site.save();
          auditorium = defaultAuditorium;
        }
        
        // Update projector with auditorium information
        projector.auditoriumId = auditorium.audiNumber;
        projector.auditoriumName = auditorium.name;
        projector.projectorNumber = projector.projectorNumber || `PROJ-${projector.serialNumber.slice(-4)}`;
        projector.siteName = site.name;
        projector.siteCode = site.siteCode;
        
        await projector.save();
        console.log(`✅ Updated projector: ${projector.serialNumber} with auditorium: ${auditorium.audiNumber}`);
        
      } catch (error) {
        console.error(`❌ Error updating projector ${projector.serialNumber}:`, error.message);
      }
    }
    
    // Step 3: Update existing AMC contracts to link with new structure
    console.log('\n📋 Step 3: Updating AMC contracts with new structure...');
    const amcContracts = await AMCContract.find({});
    
    for (const contract of amcContracts) {
      try {
        // Find the projector for this contract
        const projector = await Projector.findById(contract.projector);
        if (!projector) {
          console.log(`⚠️  Projector not found for AMC contract: ${contract.contractNumber}`);
          continue;
        }
        
        // Update contract with new structure
        contract.projectorId = contract.projector;
        contract.siteId = projector.siteId;
        contract.siteName = projector.siteName;
        contract.siteCode = projector.siteCode;
        contract.auditoriumId = projector.auditoriumId;
        contract.auditoriumName = projector.auditoriumName;
        contract.projectorNumber = projector.projectorNumber;
        
        // Convert old service schedule to new format
        if (contract.serviceSchedule && contract.serviceSchedule.length === 0) {
          // Check if old format exists
          if (contract.serviceSchedule.firstService) {
            contract.serviceSchedule = [
              {
                serviceNumber: 1,
                scheduledDate: contract.serviceSchedule.firstService.scheduledDate,
                actualDate: contract.serviceSchedule.firstService.actualDate,
                status: contract.serviceSchedule.firstService.status,
                serviceVisitId: contract.serviceSchedule.firstService.serviceVisitId
              },
              {
                serviceNumber: 2,
                scheduledDate: contract.serviceSchedule.secondService.scheduledDate,
                actualDate: contract.serviceSchedule.secondService.actualDate,
                status: contract.serviceSchedule.secondService.status,
                serviceVisitId: contract.serviceSchedule.secondService.serviceVisitId
              }
            ];
          }
        }
        
        await contract.save();
        console.log(`✅ Updated AMC contract: ${contract.contractNumber}`);
        
      } catch (error) {
        console.error(`❌ Error updating AMC contract ${contract.contractNumber}:`, error.message);
      }
    }
    
    // Step 4: Update auditorium projector counts
    console.log('\n📋 Step 4: Updating auditorium projector counts...');
    const updatedSites = await Site.find({});
    
    for (const site of updatedSites) {
      for (const auditorium of site.auditoriums) {
        const projectorCount = await Projector.countDocuments({
          siteId: site._id,
          auditoriumId: auditorium.audiNumber
        });
        
        auditorium.projectorCount = projectorCount;
      }
      
      await site.save();
      console.log(`✅ Updated projector counts for site: ${site.name}`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Sites processed: ${sites.length}`);
    console.log(`   - Projectors updated: ${projectors.length}`);
    console.log(`   - AMC contracts updated: ${amcContracts.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToCorrelatedStructure()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToCorrelatedStructure };
