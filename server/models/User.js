const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Method to get user permissions based on role
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
      'view_analytics',
      'export_data'
    ],
    fse: [
      'view_dashboard',
      'manage_service_visits',
      'upload_photos',
      'update_service_status'
    ]
  };
  
  return rolePermissions[this.role] || [];
};

module.exports = mongoose.model('User', userSchema); 