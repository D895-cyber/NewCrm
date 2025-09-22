require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FSE = require('./models/FSE');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check User collection
    const users = await User.find();
    console.log(`\n📊 Users in User collection: ${users.length}`);
    users.forEach(u => console.log(`- ${u.username} (${u.role}) - ${u.email}`));
    
    // Check FSE collection
    const fses = await FSE.find();
    console.log(`\n👷 FSEs in FSE collection: ${fses.length}`);
    fses.forEach(f => console.log(`- ${f.name} (${f.fseId}) - ${f.email}`));
    
    // Check if FSEs have corresponding User accounts
    console.log('\n🔗 Checking FSE-User relationships:');
    for (const fse of fses) {
      const user = await User.findOne({ fseId: fse.fseId });
      if (user) {
        console.log(`✅ ${fse.name} has User account: ${user.username}`);
      } else {
        console.log(`❌ ${fse.name} has NO User account`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsers();
