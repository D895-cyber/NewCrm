const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FSE = require('../models/FSE');
const router = express.Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get FSE details if user is FSE
    let fseDetails = null;
    if (user.role === 'fse' && user.fseId) {
      fseDetails = await FSE.findOne({ fseId: user.fseId });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fseId: user.fseId,
        permissions: user.getPermissions()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fseId: user.fseId,
        profile: user.profile,
        permissions: user.getPermissions(),
        fseDetails
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    // Only admin can register new users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can register new users' });
    }

    const { username, email, password, role, fseId, firstName, lastName, phone } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if FSE exists if role is fse and fseId is provided
    if (role === 'fse' && fseId) {
      const fse = await FSE.findOne({ fseId });
      if (!fse) {
        return res.status(400).json({ error: 'FSE not found' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role,
      fseId: role === 'fse' && fseId ? fseId : undefined,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || ''
      }
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fseId: user.fseId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let fseDetails = null;
    if (user.role === 'fse' && user.fseId) {
      fseDetails = await FSE.findOne({ fseId: user.fseId });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fseId: user.fseId,
        profile: user.profile,
        permissions: user.getPermissions(),
        fseDetails
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone) user.profile.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fseId: user.fseId,
        profile: user.profile,
        permissions: user.getPermissions()
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({}, { password: 0 });
    
    // Get FSE details for FSE users
    const usersWithFSE = await Promise.all(
      users.map(async (user) => {
        let fseDetails = null;
        if (user.role === 'fse' && user.fseId) {
          fseDetails = await FSE.findOne({ fseId: user.fseId });
        }
        return {
          ...user.toObject(),
          fseDetails
        };
      })
    );

    res.json({
      success: true,
      users: usersWithFSE
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user endpoint (admin only)
router.delete('/users/:userId', authenticateToken, async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.deleteOne({ userId });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, email, password, role, fseId, firstName, lastName, phone } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      userId: `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      password: hashedPassword,
      role,
      fseId: fseId || null,
      isActive: true,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || ''
      },
      permissions: role === 'fse' ? [
        'view_dashboard',
        'manage_service_visits',
        'upload_photos',
        'update_service_status'
      ] : role === 'rma_handler' ? [
        'view_dashboard',
        'manage_rma',
        'assign_rma',
        'view_analytics',
        'export_data',
        'manage_sites',
        'manage_projectors',
        'manage_service_visits',
        'manage_spare_parts',
        'manage_dtr',
        'troubleshoot_dtr',
        'convert_dtr_to_rma'
      ] : role === 'technical_head' ? [
        'view_dashboard',
        'manage_fse',
        'manage_service_visits',
        'view_analytics',
        'export_data',
        'manage_dtr',
        'troubleshoot_dtr',
        'assign_dtr',
        'supervise_fse',
        'view_fse_reports',
        'manage_technical_team'
      ] : [
        'view_dashboard',
        'manage_sites',
        'manage_projectors',
        'manage_fse',
        'manage_service_visits',
        'manage_purchase_orders',
        'manage_rma',
        'manage_spare_parts',
        'view_analytics',
        'export_data',
        'manage_dtr',
        'troubleshoot_dtr',
        'convert_dtr_to_rma',
        'assign_rma',
        'supervise_fse',
        'view_fse_reports',
        'manage_technical_team',
        'assign_dtr'
      ]
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fseId: user.fseId,
        profile: user.profile,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin impersonation - login as any user (admin only)
router.post('/impersonate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Find the target user
    const targetUser = await User.findOne({ userId: targetUserId });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (!targetUser.isActive) {
      return res.status(400).json({ error: 'Target user is deactivated' });
    }

    // Get FSE details if it's an FSE user
    let fseDetails = null;
    if (targetUser.role === 'fse' && targetUser.fseId) {
      fseDetails = await FSE.findOne({ fseId: targetUser.fseId });
    }

    // Create impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.userId,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        permissions: targetUser.getPermissions(),
        impersonatedBy: req.user.userId,
        impersonatedByUsername: req.user.username,
        isImpersonation: true
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: `Successfully impersonating ${targetUser.username}`,
      token: impersonationToken,
      user: {
        userId: targetUser.userId,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        fseId: targetUser.fseId,
        profile: targetUser.profile,
        permissions: targetUser.getPermissions(),
        fseDetails,
        isImpersonation: true,
        impersonatedBy: req.user.username
      }
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password (admin only)
router.post('/reset-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password are required' });
    }

    // Find the user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set the password as plain text - the User model's pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: `Password updated successfully for ${username}`
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, authenticateToken }; 