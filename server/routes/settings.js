const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory settings storage (in production, use database)
let systemSettings = {
  companyName: 'ProjectorCare',
  warrantyDefaultDays: 365,
  autoAlertDays: 30,
  maxFileUploadSize: 10,
  sessionTimeout: 24,
  enableNotifications: true,
  enableEmailAlerts: true,
  enableSMSAlerts: false,
  backupFrequency: 'daily',
  dataRetentionDays: 1095,
  maintenanceMode: false
};

// Get all settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin can access settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ success: true, settings: systemSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    // Only admin can update settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updatedSettings = req.body;
    
    // Validate settings
    if (updatedSettings.warrantyDefaultDays && updatedSettings.warrantyDefaultDays < 1) {
      return res.status(400).json({ error: 'Warranty days must be at least 1' });
    }
    
    if (updatedSettings.maxFileUploadSize && updatedSettings.maxFileUploadSize < 1) {
      return res.status(400).json({ error: 'Max file upload size must be at least 1MB' });
    }

    // Update settings
    systemSettings = { ...systemSettings, ...updatedSettings };
    
    // Log the update
    console.log('Settings updated by admin:', req.user.username, 'New settings:', updatedSettings);
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings: systemSettings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset settings to defaults
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    // Only admin can reset settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    systemSettings = {
      companyName: 'ProjectorCare',
      warrantyDefaultDays: 365,
      autoAlertDays: 30,
      maxFileUploadSize: 10,
      sessionTimeout: 24,
      enableNotifications: true,
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      backupFrequency: 'daily',
      dataRetentionDays: 1095,
      maintenanceMode: false
    };
    
    console.log('Settings reset to defaults by admin:', req.user.username);
    
    res.json({ 
      success: true, 
      message: 'Settings reset to defaults',
      settings: systemSettings 
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification settings specifically
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      notifications: {
        enableNotifications: systemSettings.enableNotifications,
        enableEmailAlerts: systemSettings.enableEmailAlerts,
        enableSMSAlerts: systemSettings.enableSMSAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification settings
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    // Only admin can update notification settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { enableNotifications, enableEmailAlerts, enableSMSAlerts } = req.body;
    
    // Update notification settings
    systemSettings.enableNotifications = enableNotifications;
    systemSettings.enableEmailAlerts = enableEmailAlerts;
    systemSettings.enableSMSAlerts = enableSMSAlerts;
    
    console.log('Notification settings updated by admin:', req.user.username, {
      enableNotifications,
      enableEmailAlerts,
      enableSMSAlerts
    });
    
    res.json({ 
      success: true, 
      message: 'Notification settings updated successfully',
      notifications: {
        enableNotifications: systemSettings.enableNotifications,
        enableEmailAlerts: systemSettings.enableEmailAlerts,
        enableSMSAlerts: systemSettings.enableSMSAlerts
      }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = { router }; 