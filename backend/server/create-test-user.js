require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema inline since we can't import
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
    enum: ['admin', 'fse'],
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
      'export_data'
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

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get permissions based on role
userSchema.methods.getPermissions = function() {
  const rolePermissions = {
    admin: [
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
    ],
    fse: [
      'view_dashboard',
      'upload_photos',
      'update_service_status',
      'view_analytics'
    ]
  };
  
  return rolePermissions[this.role] || [];
};

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Try different MongoDB connection options
    const mongoURIs = [
      process.env.MONGODB_URI || 'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0',
      'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0',
      'mongodb://localhost:27017/projector_warranty',
      'mongodb://127.0.0.1:27017/projector_warranty',
      'mongodb://localhost:27017/projectorcare',
      'mongodb://127.0.0.1:27017/projectorcare'
    ];

    let connected = false;
    for (const uri of mongoURIs) {
      try {
        console.log(`Trying to connect to: ${uri}`);
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Failed to connect to ${uri}: ${error.message}`);
      }
    }

    if (!connected) {
      console.log('\n❌ Could not connect to MongoDB. Please ensure MongoDB is running.');
      console.log('You can:');
      console.log('1. Install MongoDB locally');
      console.log('2. Use MongoDB Atlas (cloud)');
      console.log('3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo');
      process.exit(1);
    }
    
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`Username: admin`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Password: admin123`);
    } else {
      // Create test user
      const testUser = new User({
        username: 'admin',
        email: 'admin@projectorcare.com',
        password: 'admin123',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+1234567890'
        }
      });

      await testUser.save();
      console.log('✅ Test user created successfully:');
      console.log(`Username: admin`);
      console.log(`Email: admin@projectorcare.com`);
      console.log(`Password: admin123`);
      console.log(`Role: admin`);
    }

    // Create FSE test user
    const existingFSE = await User.findOne({ username: 'fse1' });
    if (!existingFSE) {
      const fseUser = new User({
        username: 'fse1',
        email: 'fse1@projectorcare.com',
        password: 'fse123',
        role: 'fse',
        fseId: 'FSE-001',
        profile: {
          firstName: 'John',
          lastName: 'Engineer',
          phone: '+1234567891'
        }
      });

      await fseUser.save();
      console.log('\n✅ FSE test user created:');
      console.log(`Username: fse1`);
      console.log(`Email: fse1@projectorcare.com`);
      console.log(`Password: fse123`);
      console.log(`Role: fse`);
    } else {
      console.log('\n✅ FSE test user already exists:');
      console.log(`Username: fse1`);
      console.log(`Password: fse123`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUser();
