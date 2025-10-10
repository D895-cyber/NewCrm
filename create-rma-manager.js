const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0';

// User Schema (matching your existing User model)
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: () => `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'fse', 'technician', 'rma_manager', 'engineer'],
    default: 'fse'
  },
  fseId: {
    type: String,
    ref: 'FSE'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  permissions: [{
    type: String,
    enum: [
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
      'export_data',
      'manage_dtr',
      'troubleshoot_dtr',
      'convert_dtr_to_rma',
      'assign_rma'
    ]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model('User', userSchema);

// Function to create RMA Manager user
async function createRMAManager() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // RMA Manager user details
    const rmaManagerData = {
      username: 'rma_manager',
      email: 'rma.manager@ascomp.com',
      password: 'rma123', // Change this to a secure password
      role: 'rma_manager',
      isActive: true,
      profile: {
        firstName: 'RMA',
        lastName: 'Manager',
        phone: '+91-9876543210'
      },
      permissions: [
        'view_dashboard',
        'create_dtr',
        'manage_dtr',
        'assign_dtr',
        'manage_rma',
        'manage_spare_parts',
        'assign_rma',
        'view_analytics',
        'export_data'
      ]
    };

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: rmaManagerData.username },
        { email: rmaManagerData.email }
      ]
    });

    if (existingUser) {
      console.log('⚠️  RMA Manager user already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Username:', existingUser.username);
      console.log('🔑 Role:', existingUser.role);
      console.log('\n💡 To update password, delete this user first and run script again.\n');
      
      // Ask if user wants to delete and recreate
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Do you want to delete and recreate this user? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          await User.findByIdAndDelete(existingUser._id);
          console.log('🗑️  Deleted existing user');
          
          // Create new user
          const newUser = new User(rmaManagerData);
          await newUser.save();
          
          console.log('\n✅ RMA Manager user created successfully!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📧 Email:    ', newUser.email);
          console.log('👤 Username: ', newUser.username);
          console.log('🔑 Password: ', rmaManagerData.password);
          console.log('👔 Role:     ', newUser.role);
          console.log('🆔 User ID:  ', newUser.userId);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('\n🔐 IMPORTANT: Change the password after first login!\n');
          
          readline.close();
          await mongoose.connection.close();
          process.exit(0);
        } else {
          console.log('❌ User creation cancelled');
          readline.close();
          await mongoose.connection.close();
          process.exit(0);
        }
      });
    } else {
      // Create new user
      const newUser = new User(rmaManagerData);
      await newUser.save();
      
      console.log('\n✅ RMA Manager user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:    ', newUser.email);
      console.log('👤 Username: ', newUser.username);
      console.log('🔑 Password: ', rmaManagerData.password);
      console.log('👔 Role:     ', newUser.role);
      console.log('🆔 User ID:  ', newUser.userId);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📝 Permissions:');
      newUser.permissions.forEach(perm => console.log('  ✓', perm));
      console.log('\n🔐 IMPORTANT: Change the password after first login!\n');
      
      await mongoose.connection.close();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error creating RMA Manager:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createRMAManager();

