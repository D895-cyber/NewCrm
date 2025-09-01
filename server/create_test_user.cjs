const mongoose = require('mongoose');
const User = require('./models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/projector_warranty', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('ℹ️  Test user already exists');
      console.log('Username: admin');
      console.log('Password: admin123');
      return;
    }
    
    // Create test user
    const testUser = new User({
      username: 'admin',
      email: 'admin@projectorcare.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      permissions: [
        'view_dashboard',
        'manage_sites',
        'manage_projectors',
        'manage_fse',
        'manage_service_visits',
        'manage_purchase_orders',
        'manage_rma',
        'manage_spare_parts',
        'upload_photos',
        'update_service_status',
        'view_analytics',
        'export_data'
      ]
    });
    
    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createTestUser();
