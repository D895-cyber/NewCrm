const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const AMCContract = require('../models/AMCContract');
const { authenticateToken } = require('../middleware/auth');

// Get all sites with auditoriums and projector counts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sites = await Site.find({})
      .populate('auditoriums')
      .lean();
    
    // Get projector counts for each auditorium and site totals
    for (const site of sites) {
      // Initialize auditoriums array if it doesn't exist (for existing sites)
      if (!site.auditoriums) {
        site.auditoriums = [];
      }
      
      // Get total projectors for the site first
      const totalProjectorCount = await Projector.countDocuments({
        siteId: site._id
      });
      site.totalProjectors = totalProjectorCount;
      
      // Get active projectors count
      const activeProjectorCount = await Projector.countDocuments({
        siteId: site._id,
        status: 'Active'
      });
      site.activeProjectors = activeProjectorCount;
      
      // Get projector counts for each auditorium
      for (const auditorium of site.auditoriums) {
        const projectorCount = await Projector.countDocuments({
          siteId: site._id,
          auditoriumId: auditorium.audiNumber
        });
        auditorium.projectorCount = projectorCount;
      }
    }
    
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ message: 'Error fetching sites', error: error.message });
  }
});

// Get site by ID with full details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Get total projectors for the site
    const totalProjectorCount = await Projector.countDocuments({
      siteId: site._id
    });
    site.totalProjectors = totalProjectorCount;
    
    // Get active projectors count
    const activeProjectorCount = await Projector.countDocuments({
      siteId: site._id,
      status: 'Active'
    });
    site.activeProjectors = activeProjectorCount;
    
    // Get projectors for each auditorium
    if (site.auditoriums && site.auditoriums.length > 0) {
      for (const auditorium of site.auditoriums) {
        const projectors = await Projector.find({
          siteId: site._id,
          auditoriumId: auditorium.audiNumber
        }).select('projectorNumber serialNumber model brand status condition lastService nextService');
        
        auditorium.projectors = projectors;
        
        // Update auditorium projector count
        auditorium.projectorCount = projectors.length;
      }
    } else {
      // Initialize empty auditoriums array for existing sites
      site.auditoriums = [];
    }
    
    // Get AMC contracts for this site
    const amcContracts = await AMCContract.find({
      siteId: site._id
    }).select('contractNumber status contractStartDate contractEndDate projectorSerial');
    
    site.amcContracts = amcContracts;
    
    res.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ message: 'Error fetching site', error: error.message });
  }
});

// Create new site
router.post('/', authenticateToken, async (req, res) => {
  try {
    const siteData = req.body;
    
    // Generate site code if not provided
    if (!siteData.siteCode) {
      const year = new Date().getFullYear();
      const count = await Site.countDocuments({
        siteCode: new RegExp(`^SITE-${year}-`)
      });
      siteData.siteCode = `SITE-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Create default auditorium if none provided
    if (!siteData.auditoriums || siteData.auditoriums.length === 0) {
      siteData.auditoriums = [{
        audiNumber: 'AUDI-01',
        name: 'Main Auditorium',
        capacity: 100,
        screenSize: 'Standard',
        projectorCount: 0,
        status: 'Active',
        notes: 'Default auditorium'
      }];
    }
    
    const newSite = new Site(siteData);
    const savedSite = await newSite.save();
    
    res.status(201).json({
      message: 'Site created successfully',
      site: savedSite
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ message: 'Error creating site', error: error.message });
  }
});

// Update site
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedSite = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    res.json({
      message: 'Site updated successfully',
      site: updatedSite
    });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ message: 'Error updating site', error: error.message });
  }
});

// Delete site
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if site has projectors
    const projectorCount = await Projector.countDocuments({ siteId: req.params.id });
    if (projectorCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete site with existing projectors. Please remove all projectors first.' 
      });
    }
    
    // Check if site has AMC contracts
    const amcCount = await AMCContract.countDocuments({ siteId: req.params.id });
    if (amcCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete site with existing AMC contracts. Please remove all contracts first.' 
      });
    }
    
    const deletedSite = await Site.findByIdAndDelete(req.params.id);
    if (!deletedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ message: 'Error deleting site', error: error.message });
  }
});

// Add auditorium to site
router.post('/:id/auditoriums', authenticateToken, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    const auditoriumData = req.body;
    
    // Generate auditorium number if not provided
    if (!auditoriumData.audiNumber) {
      const audiNumber = `AUDI-${String(site.auditoriums.length + 1).padStart(2, '0')}`;
      auditoriumData.audiNumber = audiNumber;
    }
    
    // Check if auditorium number already exists
    const existingAuditorium = site.auditoriums.find(audi => audi.audiNumber === auditoriumData.audiNumber);
    if (existingAuditorium) {
      return res.status(400).json({ message: 'Auditorium number already exists' });
    }
    
    await site.addAuditorium(auditoriumData);
    
    res.status(201).json({
      message: 'Auditorium added successfully',
      auditorium: site.auditoriums[site.auditoriums.length - 1]
    });
  } catch (error) {
    console.error('Error adding auditorium:', error);
    res.status(500).json({ message: 'Error adding auditorium', error: error.message });
  }
});

// Update auditorium
router.put('/:id/auditoriums/:audiNumber', authenticateToken, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    const auditoriumIndex = site.auditoriums.findIndex(audi => audi.audiNumber === req.params.audiNumber);
    if (auditoriumIndex === -1) {
      return res.status(404).json({ message: 'Auditorium not found' });
    }
    
    // Update auditorium
    site.auditoriums[auditoriumIndex] = {
      ...site.auditoriums[auditoriumIndex],
      ...req.body
    };
    
    await site.save();
    
    res.json({
      message: 'Auditorium updated successfully',
      auditorium: site.auditoriums[auditoriumIndex]
    });
  } catch (error) {
    console.error('Error updating auditorium:', error);
    res.status(500).json({ message: 'Error updating auditorium', error: error.message });
  }
});

// Delete auditorium
router.delete('/:id/auditoriums/:audiNumber', authenticateToken, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Check if auditorium has projectors
    const projectorCount = await Projector.countDocuments({
      siteId: req.params.id,
      auditoriumId: req.params.audiNumber
    });
    
    if (projectorCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete auditorium with existing projectors. Please remove all projectors first.' 
      });
    }
    
    // Remove auditorium
    site.auditoriums = site.auditoriums.filter(audi => audi.audiNumber !== req.params.audiNumber);
    await site.save();
    
    res.json({ message: 'Auditorium deleted successfully' });
  } catch (error) {
    console.error('Error deleting auditorium:', error);
    res.status(500).json({ message: 'Error deleting auditorium', error: error.message });
  }
});

// Get site statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Get projector statistics
    const projectors = await Projector.find({ siteId: req.params.id });
    const projectorStats = {
      total: projectors.length,
      active: projectors.filter(p => p.status === 'Active').length,
      underService: projectors.filter(p => p.status === 'Under Service').length,
      needsRepair: projectors.filter(p => p.status === 'Needs Repair').length,
      inactive: projectors.filter(p => p.status === 'Inactive').length
    };
    
    // Get AMC contract statistics
    const amcContracts = await AMCContract.find({ siteId: req.params.id });
    const amcStats = {
      total: amcContracts.length,
      active: amcContracts.filter(c => c.status === 'Active').length,
      expired: amcContracts.filter(c => c.status === 'Expired').length,
      suspended: amcContracts.filter(c => c.status === 'Suspended').length
    };
    
    // Get auditorium statistics
    const auditoriumStats = {
      total: site.auditoriums.length,
      active: site.auditoriums.filter(a => a.status === 'Active').length,
      underMaintenance: site.auditoriums.filter(a => a.status === 'Under Maintenance').length
    };
    
    res.json({
      site: {
        name: site.name,
        siteCode: site.siteCode,
        region: site.region,
        state: site.state
      },
      projectors: projectorStats,
      amcContracts: amcStats,
      auditoriums: auditoriumStats
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({ message: 'Error fetching site stats', error: error.message });
  }
});

module.exports = router;