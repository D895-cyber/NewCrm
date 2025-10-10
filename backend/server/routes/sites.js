const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const AMCContract = require('../models/AMCContract');
const { authenticateToken } = require('../middleware/auth');

// Debug endpoint to check projector-site linkage
router.get('/debug/projector-counts', authenticateToken, async (req, res) => {
  try {
    const Projector = require('../models/Projector');
    
    // Get total projectors
    const totalProjectors = await Projector.countDocuments();
    
    // Get projectors by siteId
    const projectorsBySite = await Projector.aggregate([
      {
        $group: {
          _id: '$siteId',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get sample projectors
    const sampleProjectors = await Projector.find().limit(5).select('serialNumber siteId siteName');
    
    res.json({
      totalProjectors,
      sitesWithProjectors: projectorsBySite.length,
      projectorsBySite: projectorsBySite.slice(0, 10),
      sampleProjectors
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get site statistics overview
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalSites = await Site.countDocuments();
    const activeSites = await Site.countDocuments({ status: 'Active' });
    const totalProjectors = await Projector.countDocuments();
    const activeProjectors = await Projector.countDocuments({ status: 'Active' });
    
    // Get sites by region
    const sitesByRegion = await Site.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get sites by type
    const sitesByType = await Site.aggregate([
      { $group: { _id: '$siteType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get projectors by status
    const projectorsByStatus = await Projector.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalSites,
      activeSites,
      totalProjectors,
      activeProjectors,
      sitesByRegion,
      sitesByType,
      projectorsByStatus
    });
  } catch (error) {
    console.error('Error fetching site statistics:', error);
    res.status(500).json({ message: 'Error fetching site statistics', error: error.message });
  }
});

// Advanced search sites with partial matching (MUST BE BEFORE /:id route!)
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    
    // Return empty if query is too short (less than 2 characters)
    if (query.trim().length < 2) {
      return res.json([]);
    }

    const sites = await Site.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { siteCode: { $regex: query, $options: 'i' } },
        { region: { $regex: query, $options: 'i' } },
        { state: { $regex: query, $options: 'i' } },
        { 'address.city': { $regex: query, $options: 'i' } },
        { 'address.state': { $regex: query, $options: 'i' } },
        { 'address.pincode': { $regex: query, $options: 'i' } },
        { 'contactPerson.name': { $regex: query, $options: 'i' } },
        { 'contactPerson.email': { $regex: query, $options: 'i' } },
        { siteType: { $regex: query, $options: 'i' } }
      ]
    }).sort({ 
      updatedAt: -1 
    }).limit(50); // Limit results to prevent overwhelming the frontend

    // Get projector counts for each site
    const siteIds = sites.map(site => site._id);
    const projectorCounts = await Projector.aggregate([
      {
        $match: { siteId: { $in: siteIds } }
      },
      {
        $group: {
          _id: {
            siteId: '$siteId',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create lookup map for fast access
    const siteProjectorCounts = new Map();
    
    projectorCounts.forEach(item => {
      const siteId = item._id.siteId?.toString();
      const status = item._id.status;
      const count = item.count;
      
      if (siteId) {
        if (!siteProjectorCounts.has(siteId)) {
          siteProjectorCounts.set(siteId, { total: 0, active: 0 });
        }
        const siteCounts = siteProjectorCounts.get(siteId);
        siteCounts.total += count;
        if (status === 'Active') {
          siteCounts.active += count;
        }
      }
    });
    
    // Apply counts to sites
    const enhancedSites = sites.map(site => {
      const siteObj = site.toObject();
      const siteId = site._id.toString();
      const siteCounts = siteProjectorCounts.get(siteId) || { total: 0, active: 0 };
      siteObj.totalProjectors = siteCounts.total;
      siteObj.activeProjectors = siteCounts.active;
      return siteObj;
    });
    
    res.json(enhancedSites);
  } catch (error) {
    console.error('Error searching sites:', error);
    res.status(500).json({ message: 'Error searching sites', error: error.message });
  }
});

// Get all sites with auditoriums and projector counts
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Fetching all sites...');
    const sites = await Site.find({})
      .populate('auditoriums')
      .lean();
    
    console.log(`📊 Found ${sites.length} sites`);
    
    // Get all projector counts in a single aggregation query
    const projectorCounts = await Projector.aggregate([
      {
        $group: {
          _id: {
            siteId: '$siteId',
            auditoriumId: '$auditoriumId',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`🔢 Found ${projectorCounts.length} projector count groups`);
    
    // Create lookup maps for fast access
    const siteProjectorCounts = new Map();
    const auditoriumProjectorCounts = new Map();
    
    projectorCounts.forEach(item => {
      const siteId = item._id.siteId?.toString();
      const auditoriumId = item._id.auditoriumId;
      const status = item._id.status;
      const count = item.count;
      
      if (siteId) {
        // Site totals
        if (!siteProjectorCounts.has(siteId)) {
          siteProjectorCounts.set(siteId, { total: 0, active: 0 });
        }
        const siteCounts = siteProjectorCounts.get(siteId);
        siteCounts.total += count;
        if (status === 'Active') {
          siteCounts.active += count;
        }
        
        // Auditorium counts
        if (auditoriumId) {
          const key = `${siteId}-${auditoriumId}`;
          if (!auditoriumProjectorCounts.has(key)) {
            auditoriumProjectorCounts.set(key, 0);
          }
          auditoriumProjectorCounts.set(key, auditoriumProjectorCounts.get(key) + count);
        }
      }
    });
    
    console.log(`✅ Calculated counts for ${siteProjectorCounts.size} sites`);
    
    // Apply counts to sites
    sites.forEach(site => {
      // Initialize auditoriums array if it doesn't exist
      if (!site.auditoriums) {
        site.auditoriums = [];
      }
      
      const siteId = site._id.toString();
      const siteCounts = siteProjectorCounts.get(siteId) || { total: 0, active: 0 };
      site.totalProjectors = siteCounts.total;
      site.activeProjectors = siteCounts.active;
      
      // Apply auditorium counts
      site.auditoriums.forEach(auditorium => {
        const key = `${siteId}-${auditorium.audiNumber}`;
        auditorium.projectorCount = auditoriumProjectorCounts.get(key) || 0;
      });
    });
    
    // Calculate total projectors for logging
    const totalProjectors = sites.reduce((sum, site) => sum + (site.totalProjectors || 0), 0);
    console.log(`📊 Total projectors across all sites: ${totalProjectors}`);
    
    res.json(sites);
  } catch (error) {
    console.error('❌ Error fetching sites:', error);
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

// Generate site report data for PDF export
router.get('/:id/report-data', authenticateToken, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Get comprehensive site data
    const projectors = await Projector.find({ siteId: req.params.id });
    const amcContracts = await AMCContract.find({ siteId: req.params.id });
    
    // Get RMA data for this site
    const RMA = require('../models/RMA');
    const rmaCases = await RMA.find({ siteId: req.params.id });
    
    // Get service reports for this site
    const ServiceReport = require('../models/ServiceReport');
    const serviceReports = await ServiceReport.find({ siteName: site.name });

    // Calculate analytics
    const rmaAnalysis = {
      totalCases: rmaCases.length,
      avgResolutionTime: rmaCases.length > 0 ? 
        rmaCases.reduce((sum, rma) => {
          if (rma.resolvedAt && rma.createdAt) {
            const days = Math.ceil((new Date(rma.resolvedAt) - new Date(rma.createdAt)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }
          return sum;
        }, 0) / rmaCases.length : 0,
      totalCost: rmaCases.reduce((sum, rma) => sum + (rma.cost || 0), 0)
    };

    const serviceAnalysis = {
      totalVisits: serviceReports.length,
      lastVisit: serviceReports.length > 0 ? 
        serviceReports.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null
    };

    const projectorAnalysis = {
      total: projectors.length,
      active: projectors.filter(p => p.status === 'Active').length,
      underService: projectors.filter(p => p.status === 'Under Service').length,
      needsRepair: projectors.filter(p => p.status === 'Needs Repair').length,
      inactive: projectors.filter(p => p.status === 'Inactive').length,
      byBrand: projectors.reduce((acc, p) => {
        const brand = p.brand || 'Unknown';
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      }, {}),
      byModel: projectors.reduce((acc, p) => {
        const model = p.model || 'Unknown';
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {})
    };

    // Prepare site data with analytics
    const siteData = {
      ...site.toObject(),
      totalProjectors: projectors.length,
      activeProjectors: projectors.filter(p => p.status === 'Active').length,
      rmaAnalysis,
      serviceAnalysis,
      projectorAnalysis,
      amcContracts: amcContracts.length,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: siteData
    });

  } catch (error) {
    console.error('Error generating site report data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating site report data', 
      error: error.message 
    });
  }
});

// Generate regional report data
router.get('/reports/regional', authenticateToken, async (req, res) => {
  try {
    const { region } = req.query;
    
    // Get sites in the region
    const sites = await Site.find(region ? { region } : {});
    
    // Get comprehensive data for all sites
    const siteIds = sites.map(site => site._id);
    const projectors = await Projector.find({ siteId: { $in: siteIds } });
    const amcContracts = await AMCContract.find({ siteId: { $in: siteIds } });
    
    // Get RMA data
    const RMA = require('../models/RMA');
    const rmaCases = await RMA.find({ siteId: { $in: siteIds } });
    
    // Get service reports
    const ServiceReport = require('../models/ServiceReport');
    const serviceReports = await ServiceReport.find({ 
      siteName: { $in: sites.map(s => s.name) } 
    });

    // Calculate regional analytics
    const regionalAnalytics = {
      totalSites: sites.length,
      totalProjectors: projectors.length,
      activeProjectors: projectors.filter(p => p.status === 'Active').length,
      totalRmaCases: rmaCases.length,
      totalServiceVisits: serviceReports.length,
      sitesByStatus: sites.reduce((acc, site) => {
        acc[site.status] = (acc[site.status] || 0) + 1;
        return acc;
      }, {}),
      projectorsByStatus: projectors.reduce((acc, projector) => {
        acc[projector.status] = (acc[projector.status] || 0) + 1;
        return acc;
      }, {}),
      sites: sites.map(site => ({
        ...site.toObject(),
        projectorCount: projectors.filter(p => p.siteId.toString() === site._id.toString()).length,
        activeProjectorCount: projectors.filter(p => p.siteId.toString() === site._id.toString() && p.status === 'Active').length,
        rmaCount: rmaCases.filter(rma => rma.siteId.toString() === site._id.toString()).length,
        serviceVisitCount: serviceReports.filter(sr => sr.siteName === site.name).length
      }))
    };

    res.json({
      success: true,
      data: regionalAnalytics
    });

  } catch (error) {
    console.error('Error generating regional report data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating regional report data', 
      error: error.message 
    });
  }
});

module.exports = router;