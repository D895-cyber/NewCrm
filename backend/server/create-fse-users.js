require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FSE = require('./models/FSE');
const bcrypt = require('bcryptjs');

async function createFSEUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the FSEs that need User accounts
    const fses = await FSE.find({ 
      $or: [
        { name: 'Dev Gulati' },
        { name: 'Satish Kumar' }
      ]
    });
    
    console.log(`\n👷 Found ${fses.length} FSEs to create User accounts for:`);
    fses.forEach(fse => console.log(`- ${fse.name} (${fse.fseId}) - ${fse.email}`));
    
    for (const fse of fses) {
      // Check if User account already exists
      const existingUser = await User.findOne({ 
        $or: [
          { fseId: fse.fseId },
          { email: fse.email }
        ]
      });
      
      if (existingUser) {
        console.log(`⚠️  User account already exists for ${fse.name}: ${existingUser.username}`);
        continue;
      }
      
      // Create username from name
      const username = fse.name.toLowerCase().replace(/\s+/g, '.');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('fse123', 10);
      
      // Create User account
      const user = new User({
        userId: `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        email: fse.email,
        password: hashedPassword,
        role: 'fse',
        fseId: fse.fseId,
        isActive: true,
        profile: {
          firstName: fse.name.split(' ')[0],
          lastName: fse.name.split(' ').slice(1).join(' '),
          phone: fse.phone
        },
        permissions: [
          'view_dashboard',
          'manage_service_visits',
          'upload_photos',
          'update_service_status'
        ]
      });
      
      await user.save();
      console.log(`✅ Created User account for ${fse.name}:`);
      console.log(`   Username: ${username}`);
      console.log(`   Email: ${fse.email}`);
      console.log(`   Password: fse123`);
      console.log(`   FSE ID: ${fse.fseId}`);
    }
    
    console.log('\n🎉 FSE User accounts created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Dev Gulati: dev.gulati / fse123');
    console.log('Satish Kumar: satish.kumar / fse123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createFSEUsers();
