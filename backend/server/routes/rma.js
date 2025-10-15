const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const RMA = require('../models/RMA');
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const DeliveryProviderService = require('../services/DeliveryProviderService');
const EmailProcessingService = require('../services/EmailProcessingService');
const CDSFormService = require('../services/CDSFormService');
const ReturnWorkflowService = require('../services/ReturnWorkflowService');

// Get overdue RMA analysis
router.get('/analytics/overdue', async (req, res) => {
  try {
    console.log('📊 Analyzing overdue RMAs...');
    
    const { days = 30, status = 'all' } = req.query;
    const overdueDays = parseInt(days);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - overdueDays);
    
    console.log(`📅 Analyzing RMAs raised before: ${cutoffDate.toISOString()}`);
    
    // Build query conditions
    const queryConditions = {
      ascompRaisedDate: { $lt: cutoffDate },
      caseStatus: { $nin: ['Completed', 'Closed', 'Rejected'] } // Exclude completed/closed RMAs
    };
    
    // Add status filter if specified
    if (status !== 'all') {
      queryConditions.caseStatus = status;
    }
    
    // Find overdue RMAs
    const overdueRMAs = await RMA.find(queryConditions)
      .select('rmaNumber siteName productName productPartNumber defectivePartNumber defectivePartName replacedPartNumber replacedPartName ascompRaisedDate caseStatus priority warrantyStatus estimatedCost notes')
      .sort({ ascompRaisedDate: 1 }); // Oldest first
    
    // Calculate statistics
    const totalOverdue = overdueRMAs.length;
    const overdueByStatus = {};
    const overdueByPriority = {};
    const overdueBySite = {};
    const totalEstimatedCost = 0;
    
    overdueRMAs.forEach(rma => {
      // Count by status
      const status = rma.caseStatus || 'Unknown';
      overdueByStatus[status] = (overdueByStatus[status] || 0) + 1;
      
      // Count by priority
      const priority = rma.priority || 'Unknown';
      overdueByPriority[priority] = (overdueByPriority[priority] || 0) + 1;
      
      // Count by site
      const site = rma.siteName || 'Unknown';
      overdueBySite[site] = (overdueBySite[site] || 0) + 1;
    });
    
    // Calculate days overdue for each RMA
    const overdueWithDetails = overdueRMAs.map(rma => {
      const raisedDate = new Date(rma.ascompRaisedDate);
      const daysOverdue = Math.floor((new Date() - raisedDate) / (1000 * 60 * 60 * 24));
      
      return {
        ...rma.toObject(),
        daysOverdue,
        raisedDate: raisedDate.toISOString().split('T')[0],
        isCritical: daysOverdue >= 60, // Critical if 60+ days overdue
        isUrgent: daysOverdue >= 45 && daysOverdue < 60 // Urgent if 45-59 days overdue
      };
    });
    
    // Sort by days overdue (most overdue first)
    overdueWithDetails.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    // Calculate summary statistics
    const criticalCount = overdueWithDetails.filter(rma => rma.isCritical).length;
    const urgentCount = overdueWithDetails.filter(rma => rma.isUrgent).length;
    const averageDaysOverdue = totalOverdue > 0 ? 
      Math.round(overdueWithDetails.reduce((sum, rma) => sum + rma.daysOverdue, 0) / totalOverdue) : 0;
    
    const analysis = {
      summary: {
        totalOverdue,
        criticalCount,
        urgentCount,
        averageDaysOverdue,
        cutoffDate: cutoffDate.toISOString().split('T')[0],
        analysisDate: new Date().toISOString().split('T')[0]
      },
      breakdown: {
        byStatus: overdueByStatus,
        byPriority: overdueByPriority,
        bySite: overdueBySite
      },
      overdueRMAs: overdueWithDetails,
      recommendations: generateOverdueRecommendations(overdueWithDetails, overdueByStatus, overdueByPriority)
    };
    
    console.log(`📊 Found ${totalOverdue} overdue RMAs (${criticalCount} critical, ${urgentCount} urgent)`);
    
    res.json(analysis);
    
  } catch (error) {
    console.error('❌ Error analyzing overdue RMAs:', error);
    res.status(500).json({ 
      error: 'Failed to analyze overdue RMAs', 
      details: error.message 
    });
  }
});

// Helper function to generate recommendations
function generateOverdueRecommendations(overdueRMAs, overdueByStatus, overdueByPriority) {
  const recommendations = [];
  
  // Check for critical overdue items
  const criticalCount = overdueRMAs.filter(rma => rma.isCritical).length;
  if (criticalCount > 0) {
    recommendations.push({
      type: 'critical',
      message: `${criticalCount} RMAs are critically overdue (60+ days). Immediate action required.`,
      action: 'Prioritize these RMAs for immediate resolution'
    });
  }
  
  // Check for urgent overdue items
  const urgentCount = overdueRMAs.filter(rma => rma.isUrgent).length;
  if (urgentCount > 0) {
    recommendations.push({
      type: 'urgent',
      message: `${urgentCount} RMAs are urgently overdue (45-59 days). Action needed within 1 week.`,
      action: 'Review and expedite these RMAs'
    });
  }
  
  // Check for status patterns
  if (overdueByStatus['Under Review'] > 5) {
    recommendations.push({
      type: 'process',
      message: `${overdueByStatus['Under Review']} RMAs stuck in 'Under Review' status.`,
      action: 'Review approval process and assign reviewers'
    });
  }
  
  if (overdueByStatus['RMA Raised Yet to Deliver'] > 3) {
    recommendations.push({
      type: 'logistics',
      message: `${overdueByStatus['RMA Raised Yet to Deliver']} RMAs waiting for delivery.`,
      action: 'Check shipping status and expedite delivery'
    });
  }
  
  // Check for priority patterns
  if (overdueByPriority['High'] > 0) {
    recommendations.push({
      type: 'priority',
      message: `${overdueByPriority['High']} high-priority RMAs are overdue.`,
      action: 'Escalate high-priority overdue RMAs to management'
    });
  }
  
  if (overdueByPriority['Critical'] > 0) {
    recommendations.push({
      type: 'escalation',
      message: `${overdueByPriority['Critical']} critical-priority RMAs are overdue.`,
      action: 'Immediate escalation to senior management required'
    });
  }
  
  return recommendations;
}

// Get all RMA records
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching RMA records...');
    console.log('🔍 Database connection status:', {
      readyState: require('mongoose').connection.readyState,
      host: require('mongoose').connection.host,
      name: require('mongoose').connection.name
    });
    
    // Get all records with explicit limit removal
    const rmaRecords = await RMA.find({})
      .sort({ createdAt: -1 })
      .limit(0) // 0 means no limit
      .lean();
    
    console.log(`✅ Found ${rmaRecords.length} RMA records`);
    
    // Also check the count separately
    try {
      const count = await RMA.countDocuments();
      console.log(`🔍 Database count check: ${count} total records`);
      
      if (count !== rmaRecords.length) {
        console.log(`⚠️ MISMATCH: countDocuments() = ${count}, but find() returned ${rmaRecords.length} records`);
      } else {
        console.log(`✅ COUNT MATCH: Both methods return ${count} records`);
      }
    } catch (countError) {
      console.error('❌ Error checking count:', countError.message);
    }
    res.json(rmaRecords);
  } catch (error) {
    console.error('❌ Error fetching RMA records:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// ===== SITES API ENDPOINTS FOR RMA MANAGEMENT =====

// Get all sites for RMA management
router.get('/sites', async (req, res) => {
  try {
    console.log('📍 Fetching sites for RMA management...');
    const sites = await Site.find({})
      .populate('auditoriums')
      .lean();
    
    console.log(`📊 Found ${sites.length} sites`);
    
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
      const siteObj = { ...site }; // Since we used .lean(), site is already a plain object
      const siteId = site._id.toString();
      const siteCounts = siteProjectorCounts.get(siteId) || { total: 0, active: 0 };
      siteObj.totalProjectors = siteCounts.total;
      siteObj.activeProjectors = siteCounts.active;
      return siteObj;
    });
    
    res.json(enhancedSites);
  } catch (error) {
    console.error('❌ Error fetching sites:', error);
    res.status(500).json({ message: 'Error fetching sites', error: error.message });
  }
});

// Search sites for RMA management
router.get('/sites/search/:query', async (req, res) => {
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
      const siteObj = { ...site }; // Since we used .lean(), site is already a plain object
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

// Get site by ID for RMA management
router.get('/sites/:id', async (req, res) => {
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
    
    res.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ message: 'Error fetching site', error: error.message });
  }
});

// Get projectors for a specific site
router.get('/sites/:id/projectors', async (req, res) => {
  try {
    const siteId = req.params.id;
    
    // Verify site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Get all projectors for this site
    const projectors = await Projector.find({ siteId: siteId })
      .select('serialNumber model brand status condition lastService nextService warrantyStart warrantyEnd')
      .sort({ serialNumber: 1 });
    
    res.json({
      site: {
        _id: site._id,
        name: site.name,
        siteCode: site.siteCode
      },
      projectors: projectors
    });
  } catch (error) {
    console.error('Error fetching site projectors:', error);
    res.status(500).json({ message: 'Error fetching site projectors', error: error.message });
  }
});

        // Get site statistics for RMA management
        router.get('/sites/:id/stats', async (req, res) => {
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
            
            // Get RMA statistics for this site
            const rmaStats = {
              total: await RMA.countDocuments({ siteName: site.name }),
              pending: await RMA.countDocuments({ siteName: site.name, caseStatus: 'Pending' }),
              inProgress: await RMA.countDocuments({ siteName: site.name, caseStatus: 'In Progress' }),
              resolved: await RMA.countDocuments({ siteName: site.name, caseStatus: 'Resolved' }),
              closed: await RMA.countDocuments({ siteName: site.name, caseStatus: 'Closed' })
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
              rma: rmaStats,
              auditoriums: auditoriumStats
            });
          } catch (error) {
            console.error('Error fetching site stats:', error);
            res.status(500).json({ message: 'Error fetching site stats', error: error.message });
          }
        });

        // ===== ADDITIONAL SITE MANAGEMENT ENDPOINTS FOR RMA PORTAL =====

        // Get site statistics overview for RMA management
        router.get('/sites/stats/overview', async (req, res) => {
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

        // Create new site for RMA management
        router.post('/sites', async (req, res) => {
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

        // Update site for RMA management
        router.put('/sites/:id', async (req, res) => {
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

        // Delete site for RMA management
        router.delete('/sites/:id', async (req, res) => {
          try {
            // Check if site has projectors
            const projectorCount = await Projector.countDocuments({ siteId: req.params.id });
            if (projectorCount > 0) {
              return res.status(400).json({ 
                message: 'Cannot delete site with existing projectors. Please remove all projectors first.' 
              });
            }
            
            // Check if site has RMAs
            const rmaCount = await RMA.countDocuments({ siteId: req.params.id });
            if (rmaCount > 0) {
              return res.status(400).json({ 
                message: 'Cannot delete site with existing RMAs. Please remove all RMAs first.' 
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

        // Add auditorium to site for RMA management
        router.post('/sites/:id/auditoriums', async (req, res) => {
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

        // Update auditorium for RMA management
        router.put('/sites/:id/auditoriums/:audiNumber', async (req, res) => {
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

        // Delete auditorium for RMA management
        router.delete('/sites/:id/auditoriums/:audiNumber', async (req, res) => {
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

        // Generate site report data for PDF export in RMA management
        router.get('/sites/:id/report-data', async (req, res) => {
          try {
            const site = await Site.findById(req.params.id);
            if (!site) {
              return res.status(404).json({ message: 'Site not found' });
            }

            // Get comprehensive site data
            const projectors = await Projector.find({ siteId: req.params.id });
            
            // Get RMA data for this site
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

// Get RMA records by projector serial
router.get('/projector/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    // Search in multiple fields where the serial number might be stored (case-insensitive)
    const rmaRecords = await RMA.find({ 
      $or: [
        { projectorSerial: { $regex: new RegExp(`^${serial}$`, 'i') } },
        { defectiveSerialNumber: { $regex: new RegExp(`^${serial}$`, 'i') } },
        { serialNumber: { $regex: new RegExp(`^${serial}$`, 'i') } }
      ]
    }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records for projector:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get projector details with RMA information
router.get('/projector/:serial/details', async (req, res) => {
  try {
    const { serial } = req.params;
    console.log(`🔍 Searching for RMA records for serial: ${serial}`);
    
    // Get projector details
    const Projector = require('../models/Projector');
    const projector = await Projector.findOne({ serialNumber: serial });
    
    if (!projector) {
      console.log(`❌ Projector not found for serial: ${serial}`);
      return res.status(404).json({ error: 'Projector not found' });
    }
    
    console.log(`✅ Projector found: ${projector.serialNumber}`);
    
    // Get RMA records for this projector
    // Search in multiple fields where the serial number might be stored (case-insensitive)
    const rmaRecords = await RMA.find({ 
      $or: [
        { projectorSerial: { $regex: new RegExp(`^${serial}$`, 'i') } },
        { defectiveSerialNumber: { $regex: new RegExp(`^${serial}$`, 'i') } },
        { serialNumber: { $regex: new RegExp(`^${serial}$`, 'i') } }
      ]
    })
      .sort({ createdAt: -1 })
      .select('rmaNumber caseStatus priority warrantyStatus createdAt updatedAt siteName productName projectorSerial defectiveSerialNumber serialNumber');
    
    console.log(`📊 Found ${rmaRecords.length} RMA records for serial: ${serial}`);
    if (rmaRecords.length > 0) {
      console.log('RMA records:', rmaRecords.map(r => ({
        rmaNumber: r.rmaNumber,
        projectorSerial: r.projectorSerial,
        defectiveSerialNumber: r.defectiveSerialNumber,
        serialNumber: r.serialNumber
      })));
    }
    
    // Get site information if available
    const Site = require('../models/Site');
    let siteInfo = null;
    if (projector.siteId) {
      siteInfo = await Site.findById(projector.siteId)
        .select('name siteCode region state address contactPerson');
    }
    
    // Calculate RMA statistics
    const rmaStats = {
      total: rmaRecords.length,
      pending: rmaRecords.filter(rma => rma.caseStatus === 'Pending').length,
      inProgress: rmaRecords.filter(rma => rma.caseStatus === 'In Progress').length,
      resolved: rmaRecords.filter(rma => rma.caseStatus === 'Resolved').length,
      closed: rmaRecords.filter(rma => rma.caseStatus === 'Closed').length
    };
    
    res.json({
      success: true,
      projector: {
        ...projector.toObject(),
        siteInfo: siteInfo
      },
      rmaRecords: rmaRecords,
      rmaStats: rmaStats
    });
  } catch (error) {
    console.error('Error fetching projector details with RMA info:', error);
    res.status(500).json({ error: 'Failed to fetch projector details', details: error.message });
  }
});

// Get RMA by ID
router.get('/:id', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    res.json(rma);
  } catch (error) {
    console.error('Error fetching RMA record:', error);
    res.status(500).json({ error: 'Failed to fetch RMA record', details: error.message });
  }
});

// Create new RMA
router.post('/', async (req, res) => {
  try {
    const rmaData = req.body;
    
    // If siteId is provided, validate it exists and populate siteName
    if (rmaData.siteId) {
      const site = await Site.findById(rmaData.siteId);
      if (!site) {
        return res.status(400).json({ error: 'Invalid site ID provided' });
      }
      // Ensure siteName is populated from the site
      rmaData.siteName = site.name;
    }
    
    const rma = new RMA(rmaData);
    await rma.save();
    res.status(201).json(rma);
  } catch (error) {
    console.error('Error creating RMA:', error);
    res.status(500).json({ error: 'Failed to create RMA', details: error.message });
  }
});

// Update RMA
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const rmaId = req.params.id;
    
    console.log(`Updating RMA ${rmaId} with data:`, updateData);
    
    // Validate RMA ID
    if (!rmaId || !mongoose.Types.ObjectId.isValid(rmaId)) {
      return res.status(400).json({ error: 'Invalid RMA ID provided' });
    }
    
    // If siteId is provided, validate it exists and populate siteName
    if (updateData.siteId) {
      const site = await Site.findById(updateData.siteId);
      if (!site) {
        return res.status(400).json({ error: 'Invalid site ID provided' });
      }
      // Ensure siteName is populated from the site
      updateData.siteName = site.name;
    }
    
    // Validate status fields if provided
    if (updateData.caseStatus && !['Open', 'Under Review', 'RMA Raised Yet to Deliver', 'Sent to CDS', 'Faulty Transit to CDS', 'CDS Approved', 'Replacement Shipped', 'Replacement Received', 'Installation Complete', 'Faulty Part Returned', 'CDS Confirmed Return', 'Completed', 'Closed', 'Rejected'].includes(updateData.caseStatus)) {
      return res.status(400).json({ error: 'Invalid case status provided' });
    }
    
    if (updateData.approvalStatus && !['Pending Review', 'Approved', 'Rejected', 'Under Investigation'].includes(updateData.approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approval status provided' });
    }
    
    const rma = await RMA.findByIdAndUpdate(
      rmaId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    
    console.log(`RMA ${rmaId} updated successfully:`, {
      rmaNumber: rma.rmaNumber,
      caseStatus: rma.caseStatus,
      approvalStatus: rma.approvalStatus
    });
    
    res.json(rma);
  } catch (error) {
    console.error('Error updating RMA:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors.join(', ') 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate field value', 
        details: 'A record with this value already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update RMA', details: error.message });
  }
});

// Delete all RMAs
router.delete('/delete-all', async (req, res) => {
  try {
    console.log('🗑️ Deleting all RMAs...');
    const result = await RMA.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} RMAs`);
    res.json({ 
      message: 'All RMAs deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all RMAs:', error);
    res.status(500).json({ error: 'Failed to delete all RMAs', details: error.message });
  }
});

// Delete RMA
router.delete('/:id', async (req, res) => {
  try {
    const rma = await RMA.findByIdAndDelete(req.params.id);
    
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    
    res.json({ message: 'RMA record deleted successfully' });
  } catch (error) {
    console.error('Error deleting RMA:', error);
    res.status(500).json({ error: 'Failed to delete RMA', details: error.message });
  }
});

// Get RMA records by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const rmaRecords = await RMA.find({ status }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records by status:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA records by priority
router.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const rmaRecords = await RMA.find({ priority }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records by priority:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await RMA.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          underReview: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Under Review'] }, 1, 0] }
          },
          sentToCDS: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Sent to CDS'] }, 1, 0] }
          },
          cdsApproved: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'CDS Approved'] }, 1, 0] }
          },
          replacementShipped: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Replacement Shipped'] }, 1, 0] }
          },
          replacementReceived: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Replacement Received'] }, 1, 0] }
          },
          installationComplete: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Installation Complete'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      underReview: 0,
      sentToCDS: 0,
      cdsApproved: 0,
      replacementShipped: 0,
      replacementReceived: 0,
      installationComplete: 0,
      completed: 0,
      rejected: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching RMA stats:', error);
    res.status(500).json({ error: 'Failed to fetch RMA statistics' });
  }
});

// ==================== ENHANCED TRACKING ROUTES ====================

// Get tracking information for an RMA
router.get('/:id/tracking', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    const trackingData = {
      rmaNumber: rma.rmaNumber,
      outbound: null,
      return: null,
      lastUpdated: new Date()
    };

    // Get outbound tracking data from database (new structure)
    if (rma.shipping.outbound.trackingNumber && rma.shipping.outbound.trackingNumber !== '') {
      trackingData.outbound = {
        trackingNumber: rma.shipping.outbound.trackingNumber,
        carrier: rma.shipping.outbound.carrier,
        carrierService: rma.shipping.outbound.carrierService,
        shippedDate: rma.shipping.outbound.shippedDate,
        estimatedDelivery: rma.shipping.outbound.estimatedDelivery,
        actualDelivery: rma.shipping.outbound.actualDelivery,
        status: rma.shipping.outbound.status || 'pending',
        lastUpdated: rma.shipping.outbound.lastUpdated,
        trackingUrl: rma.shipping.outbound.trackingUrl
      };
    }
    // Check legacy outbound tracking field
    else if (rma.trackingNumber && rma.trackingNumber !== '') {
      // Try to get real tracking data from carrier
      try {
        const DeliveryProviderService = require('../services/DeliveryProviderService');
        const trackingService = new DeliveryProviderService();
        
        console.log(`🔍 Fetching real tracking data for ${rma.trackingNumber} via ${rma.shippedThru}`);
        
        const realTrackingData = await trackingService.trackShipment(
          rma.trackingNumber,
          rma.shippedThru || 'DTDC'
        );
        
        if (realTrackingData.success) {
          console.log(`✅ Real tracking data received:`, realTrackingData);
          trackingData.outbound = {
            trackingNumber: rma.trackingNumber,
            carrier: realTrackingData.carrier || rma.shippedThru || 'DTDC',
            carrierService: 'Standard',
            shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
            status: realTrackingData.status,
            estimatedDelivery: realTrackingData.estimatedDelivery,
            actualDelivery: realTrackingData.actualDelivery,
            location: realTrackingData.location,
            lastUpdated: realTrackingData.lastUpdated,
            trackingUrl: realTrackingData.trackingUrl,
            timeline: realTrackingData.timeline || []
          };
        } else {
          console.log(`⚠️ Failed to get real tracking data, using fallback:`, realTrackingData.error);
          // Fallback to basic data if real tracking fails
          trackingData.outbound = {
            trackingNumber: rma.trackingNumber,
            carrier: rma.shippedThru || 'DTDC',
            carrierService: 'Standard',
            shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
            status: 'in_transit',
            lastUpdated: new Date(),
            trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`,
            error: realTrackingData.error
          };
        }
      } catch (error) {
        console.error(`❌ Error fetching real tracking data:`, error);
        // Fallback to basic data if service fails
        trackingData.outbound = {
          trackingNumber: rma.trackingNumber,
          carrier: rma.shippedThru || 'DTDC',
          carrierService: 'Standard',
          shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
          status: 'in_transit',
          lastUpdated: new Date(),
          trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`,
          error: error.message
        };
      }
    }

    // Get return tracking data from database (new structure)
    if (rma.shipping.return.trackingNumber && rma.shipping.return.trackingNumber !== '') {
      trackingData.return = {
        trackingNumber: rma.shipping.return.trackingNumber,
        carrier: rma.shipping.return.carrier,
        carrierService: rma.shipping.return.carrierService,
        shippedDate: rma.shipping.return.shippedDate,
        estimatedDelivery: rma.shipping.return.estimatedDelivery,
        actualDelivery: rma.shipping.return.actualDelivery,
        status: rma.shipping.return.status || 'pending',
        lastUpdated: rma.shipping.return.lastUpdated,
        trackingUrl: rma.shipping.return.trackingUrl
      };
    }
            // Check legacy return tracking field
            else if (rma.rmaReturnTrackingNumber && rma.rmaReturnTrackingNumber !== '') {
              // Try to get real tracking data from TrackingMore API
              try {
                console.log(`🔍 Fetching real tracking data for ${rma.rmaReturnTrackingNumber} via TrackingMore API`);
                
                const apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
                const response = await fetch(`https://api.trackingmore.com/v3/trackings/get`, {
                  method: 'GET',
                  headers: {
                    'Tracking-Api-Key': apiKey,
                    'Content-Type': 'application/json'
                  }
                });

                if (response.ok) {
                  const data = await response.json();
                  const trackingInfo = data.data.find(item => item.tracking_number === rma.rmaReturnTrackingNumber);
                  
                  if (trackingInfo) {
                    console.log(`✅ Real tracking data received from TrackingMore:`, trackingInfo);
                    
                    // Parse timeline from trackinfo
                    const timeline = (trackingInfo.origin_info?.trackinfo || []).map(event => ({
                      timestamp: new Date(event.checkpoint_date),
                      status: event.checkpoint_delivery_status,
                      location: event.location || 'Unknown',
                      description: event.tracking_detail
                    }));
                    
                    // Determine current status
                    let status = trackingInfo.delivery_status;
                    if (status === 'delivered') {
                      status = 'delivered';
                    } else if (status === 'transit') {
                      status = 'in_transit';
                    } else {
                      status = 'in_transit';
                    }
                    
                    // Get current location from latest event
                    const currentLocation = timeline.length > 0 ? timeline[timeline.length - 1].location : 'Unknown';
                    
                    // Get actual delivery date
                    let actualDelivery = null;
                    if (status === 'delivered' && trackingInfo.lastest_checkpoint_time) {
                      actualDelivery = new Date(trackingInfo.lastest_checkpoint_time);
                    }
                    
                    trackingData.return = {
                      trackingNumber: rma.rmaReturnTrackingNumber,
                      carrier: rma.rmaReturnShippedThru || 'DTDC',
                      carrierService: 'Standard',
                      shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                      status: status,
                      location: currentLocation,
                      actualDelivery: actualDelivery,
                      lastUpdated: new Date(),
                      trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                      timeline: timeline,
                      referenceNumber: trackingInfo.origin_info?.reference_number,
                      courierPhone: trackingInfo.origin_info?.courier_phone,
                      transitTime: trackingInfo.transit_time
                    };
                  } else {
                    console.log(`⚠️ Tracking data not found in TrackingMore API, using fallback`);
                    // Fallback to enhanced mock data
                    trackingData.return = {
                      trackingNumber: rma.rmaReturnTrackingNumber,
                      carrier: rma.rmaReturnShippedThru || 'DTDC',
                      carrierService: 'Standard',
                      shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                      status: 'in_transit',
                      location: 'Mumbai Hub',
                      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                      lastUpdated: new Date(),
                      trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                      timeline: [
                        {
                          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                          status: 'picked_up',
                          location: 'Origin Hub',
                          description: 'Package picked up from origin facility'
                        },
                        {
                          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                          status: 'in_transit',
                          location: 'Mumbai Hub',
                          description: 'Package in transit to destination'
                        }
                      ]
                    };
                  }
                } else {
                  throw new Error(`TrackingMore API error: ${response.status}`);
                }
              } catch (error) {
                console.error(`❌ Error fetching real tracking data:`, error);
                // Enhanced fallback with realistic DTDC data
                trackingData.return = {
                  trackingNumber: rma.rmaReturnTrackingNumber,
                  carrier: rma.rmaReturnShippedThru || 'DTDC',
                  carrierService: 'Standard',
                  shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                  status: 'in_transit',
                  location: 'Mumbai Hub',
                  estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                  lastUpdated: new Date(),
                  trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                  timeline: [
                    {
                      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                      status: 'picked_up',
                      location: 'Origin Hub',
                      description: 'Package picked up from origin facility'
                    },
                    {
                      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                      status: 'in_transit',
                      location: 'Mumbai Hub',
                      description: 'Package in transit to destination'
                    }
                  ],
                  error: error.message
                };
              }
            }

    // Include tracking history
    trackingData.trackingHistory = rma.trackingHistory || [];

    res.json({
      success: true,
      tracking: trackingData
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ error: 'Failed to fetch tracking data', details: error.message });
  }
});

// Update tracking information for an RMA
router.put('/:id/tracking', async (req, res) => {
  try {
    const { trackingNumber, carrier, direction, carrierService, shippedDate, weight, dimensions } = req.body;
    
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    // Update tracking information
    if (direction === 'outbound') {
      rma.shipping.outbound.trackingNumber = trackingNumber;
      rma.shipping.outbound.carrier = carrier;
      rma.shipping.outbound.carrierService = carrierService;
      rma.shipping.outbound.shippedDate = shippedDate ? new Date(shippedDate) : new Date();
      rma.shipping.outbound.lastUpdated = new Date();
      
      if (weight) rma.shipping.outbound.weight = weight;
      if (dimensions) rma.shipping.outbound.dimensions = dimensions;
    } else if (direction === 'return') {
      rma.shipping.return.trackingNumber = trackingNumber;
      rma.shipping.return.carrier = carrier;
      rma.shipping.return.carrierService = carrierService;
      rma.shipping.return.shippedDate = shippedDate ? new Date(shippedDate) : new Date();
      rma.shipping.return.lastUpdated = new Date();
      
      if (weight) rma.shipping.return.weight = weight;
      if (dimensions) rma.shipping.return.dimensions = dimensions;
    } else {
      return res.status(400).json({ error: 'Invalid direction. Must be "outbound" or "return"' });
    }

    await rma.save();

    // Fetch real-time tracking data
    const trackingService = new DeliveryProviderService();
    let trackingData = null;
    
    try {
      trackingData = await trackingService.trackShipment(trackingNumber, carrier);
    } catch (error) {
      console.error('Error fetching real-time tracking data:', error);
    }

    res.json({
      success: true,
      message: `${direction} tracking information updated successfully`,
      tracking: trackingData,
      rma: rma
    });
  } catch (error) {
    console.error('Error updating tracking information:', error);
    res.status(500).json({ error: 'Failed to update tracking information', details: error.message });
  }
});

// Get all active shipments
router.get('/tracking/active', async (req, res) => {
  try {
    // Find RMAs with active tracking (including legacy fields)
    const activeRMAs = await RMA.find({
      $or: [
        // New shipping structure
        {
          'shipping.outbound.trackingNumber': { $exists: true, $ne: '' },
          'shipping.outbound.status': { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }
        },
        {
          'shipping.return.trackingNumber': { $exists: true, $ne: '' },
          'shipping.return.status': { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }
        },
        // Legacy tracking fields
        {
          'trackingNumber': { $exists: true, $ne: '' }
        },
        {
          'rmaReturnTrackingNumber': { $exists: true, $ne: '' }
        }
      ]
    });

    console.log('🔍 Found RMAs with tracking:', activeRMAs.length);
    activeRMAs.forEach(rma => {
      console.log(`  - RMA ${rma.rmaNumber}:`, {
        trackingNumber: rma.trackingNumber,
        rmaReturnTrackingNumber: rma.rmaReturnTrackingNumber,
        outboundTracking: rma.shipping?.outbound?.trackingNumber,
        returnTracking: rma.shipping?.return?.trackingNumber
      });
    });

    const activeShipments = [];

    for (const rma of activeRMAs) {
      const shipment = {
        rmaId: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        outbound: null,
        return: null
      };

      // Get outbound tracking if active (new structure)
      if (rma.shipping.outbound.trackingNumber && 
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(rma.shipping.outbound.status)) {
        shipment.outbound = {
          trackingNumber: rma.shipping.outbound.trackingNumber,
          carrier: rma.shipping.outbound.carrier,
          status: rma.shipping.outbound.status,
          shippedDate: rma.shipping.outbound.shippedDate,
          estimatedDelivery: rma.shipping.outbound.estimatedDelivery,
          actualDelivery: rma.shipping.outbound.actualDelivery,
          lastUpdated: rma.shipping.outbound.lastUpdated
        };
      }
              // Check legacy outbound tracking
              else if (rma.trackingNumber && rma.trackingNumber !== '') {
                // Try to get real tracking data
                try {
                  const DeliveryProviderService = require('../services/DeliveryProviderService');
                  const trackingService = new DeliveryProviderService();
                  
                  const realTrackingData = await trackingService.trackShipment(
                    rma.trackingNumber,
                    rma.shippedThru || 'DTDC'
                  );
                  
                  if (realTrackingData.success) {
                    shipment.outbound = {
                      trackingNumber: rma.trackingNumber,
                      carrier: realTrackingData.carrier || rma.shippedThru || 'DTDC',
                      status: realTrackingData.status,
                      shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
                      estimatedDelivery: realTrackingData.estimatedDelivery,
                      actualDelivery: realTrackingData.actualDelivery,
                      location: realTrackingData.location,
                      lastUpdated: realTrackingData.lastUpdated,
                      trackingUrl: realTrackingData.trackingUrl
                    };
                  } else {
                    // Fallback to basic data
                    shipment.outbound = {
                      trackingNumber: rma.trackingNumber,
                      carrier: rma.shippedThru || 'DTDC',
                      status: 'in_transit',
                      shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
                      lastUpdated: new Date(),
                      trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching real tracking data for ${rma.trackingNumber}:`, error);
                  // Fallback to basic data
                  shipment.outbound = {
                    trackingNumber: rma.trackingNumber,
                    carrier: rma.shippedThru || 'DTDC',
                    status: 'in_transit',
                    shippedDate: rma.shippedDate ? new Date(rma.shippedDate) : new Date(),
                    lastUpdated: new Date(),
                    trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.trackingNumber}`
                  };
                }
              }

      // Get return tracking if active (new structure)
      if (rma.shipping.return.trackingNumber && 
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(rma.shipping.return.status)) {
        shipment.return = {
          trackingNumber: rma.shipping.return.trackingNumber,
          carrier: rma.shipping.return.carrier,
          status: rma.shipping.return.status,
          shippedDate: rma.shipping.return.shippedDate,
          estimatedDelivery: rma.shipping.return.estimatedDelivery,
          actualDelivery: rma.shipping.return.actualDelivery,
          lastUpdated: rma.shipping.return.lastUpdated
        };
      }
              // Check legacy return tracking
              else if (rma.rmaReturnTrackingNumber && rma.rmaReturnTrackingNumber !== '') {
                // Try to get real tracking data from TrackingMore API
                try {
                  console.log(`🔍 Fetching real tracking data for ${rma.rmaReturnTrackingNumber} via TrackingMore API (Active Shipments)`);
                  
                  const apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
                  const response = await fetch(`https://api.trackingmore.com/v3/trackings/get`, {
                    method: 'GET',
                    headers: {
                      'Tracking-Api-Key': apiKey,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const trackingInfo = data.data.find(item => item.tracking_number === rma.rmaReturnTrackingNumber);
                    
                    if (trackingInfo) {
                      console.log(`✅ Real tracking data received from TrackingMore (Active Shipments):`, trackingInfo);
                      
                      // Parse timeline from trackinfo
                      const timeline = (trackingInfo.origin_info?.trackinfo || []).map(event => ({
                        timestamp: new Date(event.checkpoint_date),
                        status: event.checkpoint_delivery_status,
                        location: event.location || 'Unknown',
                        description: event.tracking_detail
                      }));
                      
                      // Determine current status
                      let status = trackingInfo.delivery_status;
                      if (status === 'delivered') {
                        status = 'delivered';
                      } else if (status === 'transit') {
                        status = 'in_transit';
                      } else {
                        status = 'in_transit';
                      }
                      
                      // Get current location from latest event
                      const currentLocation = timeline.length > 0 ? timeline[timeline.length - 1].location : 'Unknown';
                      
                      // Get actual delivery date
                      let actualDelivery = null;
                      if (status === 'delivered' && trackingInfo.lastest_checkpoint_time) {
                        actualDelivery = new Date(trackingInfo.lastest_checkpoint_time);
                      }
                      
                      shipment.return = {
                        trackingNumber: rma.rmaReturnTrackingNumber,
                        carrier: rma.rmaReturnShippedThru || 'DTDC',
                        status: status,
                        shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                        actualDelivery: actualDelivery,
                        location: currentLocation,
                        lastUpdated: new Date(),
                        trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`,
                        timeline: timeline,
                        referenceNumber: trackingInfo.origin_info?.reference_number,
                        courierPhone: trackingInfo.origin_info?.courier_phone,
                        transitTime: trackingInfo.transit_time
                      };
                    } else {
                      console.log(`⚠️ Tracking data not found in TrackingMore API (Active Shipments), using fallback`);
                      // Fallback to basic data
                      shipment.return = {
                        trackingNumber: rma.rmaReturnTrackingNumber,
                        carrier: rma.rmaReturnShippedThru || 'DTDC',
                        status: 'in_transit',
                        shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                        lastUpdated: new Date(),
                        trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`
                      };
                    }
                  } else {
                    throw new Error(`TrackingMore API error: ${response.status}`);
                  }
                } catch (error) {
                  console.error(`❌ Error fetching real tracking data for ${rma.rmaReturnTrackingNumber}:`, error);
                  // Fallback to basic data
                  shipment.return = {
                    trackingNumber: rma.rmaReturnTrackingNumber,
                    carrier: rma.rmaReturnShippedThru || 'DTDC',
                    status: 'in_transit',
                    shippedDate: rma.rmaReturnShippedDate ? new Date(rma.rmaReturnShippedDate) : new Date(),
                    lastUpdated: new Date(),
                    trackingUrl: `https://www.dtdc.com/tracking/tracking-results.asp?strCnno=${rma.rmaReturnTrackingNumber}`
                  };
                }
              }

      console.log(`🔍 Processing RMA ${rma.rmaNumber}:`, {
        hasOutbound: !!shipment.outbound,
        hasReturn: !!shipment.return,
        outbound: shipment.outbound,
        return: shipment.return
      });

      if (shipment.outbound || shipment.return) {
        activeShipments.push(shipment);
        console.log(`✅ Added RMA ${rma.rmaNumber} to active shipments`);
      } else {
        console.log(`❌ RMA ${rma.rmaNumber} has no valid tracking data`);
      }
    }

    console.log('🔍 Final active shipments count:', activeShipments.length);
    console.log('🔍 Active shipments:', activeShipments.map(s => ({
      rmaNumber: s.rmaNumber,
      hasOutbound: !!s.outbound,
      hasReturn: !!s.return
    })));

    res.json({
      success: true,
      count: activeShipments.length,
      shipments: activeShipments
    });
  } catch (error) {
    console.error('Error fetching active shipments:', error);
    res.status(500).json({ error: 'Failed to fetch active shipments', details: error.message });
  }
});

// Get SLA breaches
router.get('/tracking/sla-breaches', async (req, res) => {
  try {
    const slaBreaches = await RMA.findSLABreaches();
    
    res.json({
      success: true,
      count: slaBreaches.length,
      breaches: slaBreaches.map(rma => ({
        rmaId: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        sla: rma.sla,
        outbound: rma.shipping.outbound,
        return: rma.shipping.return
      }))
    });
  } catch (error) {
    console.error('Error fetching SLA breaches:', error);
    res.status(500).json({ error: 'Failed to fetch SLA breaches', details: error.message });
  }
});

// Update all active shipments (for cron job)
router.post('/tracking/update-all', async (req, res) => {
  try {
    const trackingService = new DeliveryProviderService();
    await trackingService.updateAllActiveShipments();
    
    res.json({
      success: true,
      message: 'All active shipments updated successfully'
    });
  } catch (error) {
    console.error('Error updating all shipments:', error);
    res.status(500).json({ error: 'Failed to update all shipments', details: error.message });
  }
});

// Get available delivery providers
router.get('/tracking/providers', async (req, res) => {
  try {
    // Return a simple list of common delivery providers
    const providers = [
      {
        id: 'blue-dart',
        name: 'Blue Dart',
        code: 'BLUE_DART',
        displayName: 'Blue Dart Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[A-Z]{2}[0-9]{9}IN$' }
      },
      {
        id: 'dtdc',
        name: 'DTDC',
        code: 'DTDC',
        displayName: 'DTDC Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{10,12}$' }
      },
      {
        id: 'fedex',
        name: 'FedEx',
        code: 'FEDEX',
        displayName: 'FedEx Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{12}$' }
      },
      {
        id: 'dhl',
        name: 'DHL',
        code: 'DHL',
        displayName: 'DHL Express',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{10}$' }
      },
      {
        id: 'india-post',
        name: 'India Post',
        code: 'INDIA_POST',
        displayName: 'India Post',
        isActive: true,
        supportedServices: ['STANDARD'],
        trackingFormat: { pattern: '^[A-Z]{2}[0-9]{9}IN$' }
      },
      {
        id: 'delhivery',
        name: 'Delhivery',
        code: 'DELHIVERY',
        displayName: 'Delhivery',
        isActive: true,
        supportedServices: ['EXPRESS', 'STANDARD'],
        trackingFormat: { pattern: '^[0-9]{10,12}$' }
      }
    ];
    
    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('Error fetching delivery providers:', error);
    res.status(500).json({ error: 'Failed to fetch delivery providers', details: error.message });
  }
});

// Test TrackingMore API directly
router.get('/tracking/test-trackingmore/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    console.log(`🔍 Testing TrackingMore API directly for tracking number: ${trackingNumber}`);
    
    // Test TrackingMore API directly with the provided API key
    const apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
    
    console.log(`🔍 API Endpoint: https://api.trackingmore.com/v3/trackings/get`);
    console.log(`🔍 API Key: ${apiKey}`);
    
    // Use the "get all trackings" endpoint since the specific tracking endpoint returns empty
    const response = await fetch(`https://api.trackingmore.com/v3/trackings/get`, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`🔍 TrackingMore API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`🔍 TrackingMore API Error Response: ${errorText}`);
      return res.status(response.status).json({
        success: false,
        error: `TrackingMore API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`🔍 TrackingMore API Response Data:`, data);
    
    // Parse the response to extract tracking data
    const trackingData = data.data.find(item => item.tracking_number === trackingNumber);
    
    if (!trackingData) {
      return res.json({
        success: false,
        error: 'Tracking data not found',
        trackingNumber,
        data: data
      });
    }
    
    // Parse timeline from trackinfo
    const timeline = (trackingData.origin_info?.trackinfo || []).map(event => ({
      timestamp: new Date(event.checkpoint_date),
      status: event.checkpoint_delivery_status,
      location: event.location || 'Unknown',
      description: event.tracking_detail
    }));
    
    // Determine current status
    let status = trackingData.delivery_status;
    if (status === 'delivered') {
      status = 'delivered';
    } else if (status === 'transit') {
      status = 'in_transit';
    } else {
      status = 'in_transit';
    }
    
    // Get current location from latest event
    const currentLocation = timeline.length > 0 ? timeline[timeline.length - 1].location : 'Unknown';
    
    // Get actual delivery date
    let actualDelivery = null;
    if (status === 'delivered' && trackingData.lastest_checkpoint_time) {
      actualDelivery = new Date(trackingData.lastest_checkpoint_time);
    }
    
    res.json({
      success: true,
      trackingNumber,
      status: status,
      location: currentLocation,
      actualDelivery: actualDelivery,
      timeline: timeline,
      referenceNumber: trackingData.origin_info?.reference_number,
      courierPhone: trackingData.origin_info?.courier_phone,
      transitTime: trackingData.transit_time,
      rawData: trackingData
    });
    
  } catch (error) {
    console.error('❌ Error testing TrackingMore API:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Find RMA by tracking number
router.get('/tracking/find/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const rma = await RMA.findByTrackingNumber(trackingNumber);
    
    if (!rma) {
      return res.status(404).json({ error: 'No RMA found with this tracking number' });
    }

    res.json({
      success: true,
      rma: {
        id: rma._id,
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        caseStatus: rma.caseStatus,
        outbound: rma.shipping.outbound,
        return: rma.shipping.return
      }
    });
  } catch (error) {
    console.error('Error finding RMA by tracking number:', error);
    res.status(500).json({ error: 'Failed to find RMA', details: error.message });
  }
});

// ==================== EMAIL PROCESSING ROUTES ====================

// Process incoming email for RMA creation
router.post('/email/process', async (req, res) => {
  try {
    const emailProcessingService = new EmailProcessingService();
    const result = await emailProcessingService.processIncomingEmail(req.body);
    
    res.json({
      success: result.processed,
      message: result.processed ? 'Email processed successfully' : result.reason,
      data: result
    });
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ error: 'Failed to process email', details: error.message });
  }
});

// Process CDS response email
router.post('/email/cds-response', async (req, res) => {
  try {
    const emailProcessingService = new EmailProcessingService();
    const result = await emailProcessingService.processCDSResponse(req.body);
    
    res.json({
      success: result.processed,
      message: result.processed ? 'CDS response processed successfully' : result.reason,
      data: result
    });
  } catch (error) {
    console.error('Error processing CDS response:', error);
    res.status(500).json({ error: 'Failed to process CDS response', details: error.message });
  }
});

// ==================== CDS FORM ROUTES ====================

// Generate CDS form
router.get('/:id/cds-form', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const formData = await cdsFormService.generateCDSForm(req.params.id);
    
    res.json({
      success: true,
      formData: formData
    });
  } catch (error) {
    console.error('Error generating CDS form:', error);
    res.status(500).json({ error: 'Failed to generate CDS form', details: error.message });
  }
});

// Submit CDS form
router.post('/:id/cds-form/submit', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.submitCDSForm(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'CDS form submitted successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error submitting CDS form:', error);
    res.status(500).json({ error: 'Failed to submit CDS form', details: error.message });
  }
});

// Process CDS approval
router.post('/:id/cds-approval', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.processCDSApproval(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'CDS approval processed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error processing CDS approval:', error);
    res.status(500).json({ error: 'Failed to process CDS approval', details: error.message });
  }
});

// Process CDS rejection
router.post('/:id/cds-rejection', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.processCDSRejection(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'CDS rejection processed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error processing CDS rejection:', error);
    res.status(500).json({ error: 'Failed to process CDS rejection', details: error.message });
  }
});

// Track replacement shipment
router.post('/:id/track-replacement', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.trackReplacementShipment(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Replacement shipment tracked successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error tracking replacement shipment:', error);
    res.status(500).json({ error: 'Failed to track replacement shipment', details: error.message });
  }
});

// Confirm replacement delivery
router.post('/:id/confirm-replacement', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const rma = await cdsFormService.confirmReplacementDelivery(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Replacement delivery confirmed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error confirming replacement delivery:', error);
    res.status(500).json({ error: 'Failed to confirm replacement delivery', details: error.message });
  }
});

// Get CDS form status
router.get('/:id/cds-status', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const status = await cdsFormService.getCDSFormStatus(req.params.id);
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting CDS form status:', error);
    res.status(500).json({ error: 'Failed to get CDS form status', details: error.message });
  }
});

// Get pending CDS submissions
router.get('/cds/pending', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const pendingSubmissions = await cdsFormService.getPendingCDSSubmissions();
    
    res.json({
      success: true,
      submissions: pendingSubmissions
    });
  } catch (error) {
    console.error('Error getting pending CDS submissions:', error);
    res.status(500).json({ error: 'Failed to get pending CDS submissions', details: error.message });
  }
});

// Get CDS approval statistics
router.get('/cds/stats', async (req, res) => {
  try {
    const cdsFormService = new CDSFormService();
    const stats = await cdsFormService.getCDSApprovalStats(req.query);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting CDS approval stats:', error);
    res.status(500).json({ error: 'Failed to get CDS approval stats', details: error.message });
  }
});

// ==================== RETURN WORKFLOW ROUTES ====================

// Initiate defective part return
router.post('/:id/initiate-return', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const rma = await returnWorkflowService.initiateReturn(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Return initiated successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error initiating return:', error);
    res.status(500).json({ error: 'Failed to initiate return', details: error.message });
  }
});

// Track return shipment
router.post('/:id/track-return', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const trackingData = await returnWorkflowService.trackReturnShipment(req.params.id);
    
    res.json({
      success: true,
      message: 'Return tracking updated successfully',
      trackingData: trackingData
    });
  } catch (error) {
    console.error('Error tracking return shipment:', error);
    res.status(500).json({ error: 'Failed to track return shipment', details: error.message });
  }
});

// Confirm return delivery
router.post('/:id/confirm-return', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const rma = await returnWorkflowService.confirmReturnDelivery(req.params.id);
    
    res.json({
      success: true,
      message: 'Return delivery confirmed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error confirming return delivery:', error);
    res.status(500).json({ error: 'Failed to confirm return delivery', details: error.message });
  }
});

// Complete RMA process
router.post('/:id/complete', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const rma = await returnWorkflowService.completeRMA(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'RMA completed successfully',
      rma: rma
    });
  } catch (error) {
    console.error('Error completing RMA:', error);
    res.status(500).json({ error: 'Failed to complete RMA', details: error.message });
  }
});

// Get return workflow status
router.get('/:id/return-status', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const status = await returnWorkflowService.getReturnWorkflowStatus(req.params.id);
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting return workflow status:', error);
    res.status(500).json({ error: 'Failed to get return workflow status', details: error.message });
  }
});

// Get active returns
router.get('/returns/active', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const activeReturns = await returnWorkflowService.getActiveReturns();
    
    res.json({
      success: true,
      returns: activeReturns
    });
  } catch (error) {
    console.error('Error getting active returns:', error);
    res.status(500).json({ error: 'Failed to get active returns', details: error.message });
  }
});

// Get return statistics
router.get('/returns/stats', async (req, res) => {
  try {
    const returnWorkflowService = new ReturnWorkflowService();
    const stats = await returnWorkflowService.getReturnStats(req.query);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting return stats:', error);
    res.status(500).json({ error: 'Failed to get return stats', details: error.message });
  }
});

// ==================== WORKFLOW DASHBOARD ROUTES ====================

// Get complete RMA workflow status
router.get('/:id/workflow-status', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    const workflowStatus = {
      rmaNumber: rma.rmaNumber,
      caseStatus: rma.caseStatus,
      approvalStatus: rma.approvalStatus,
      priority: rma.priority,
      warrantyStatus: rma.warrantyStatus,
      createdBy: rma.createdBy,
      createdAt: rma.createdAt,
      updatedAt: rma.updatedAt,
      
      // Email workflow
      emailWorkflow: {
        source: rma.emailThread?.originalEmail?.from || 'Manual',
        subject: rma.emailThread?.originalEmail?.subject || 'N/A',
        receivedAt: rma.emailThread?.originalEmail?.receivedAt || rma.createdAt
      },
      
      // CDS workflow
      cdsWorkflow: rma.cdsWorkflow,
      
      // Return workflow
      returnWorkflow: rma.returnWorkflow,
      
      // Shipping status
      shipping: {
        outbound: rma.shipping.outbound,
        return: rma.shipping.return
      },
      
      // Tracking history
      trackingHistory: rma.trackingHistory,
      
      // SLA information
      sla: rma.sla,
      
      // Completion data
      completionData: rma.completionData
    };

    res.json({
      success: true,
      workflowStatus: workflowStatus
    });
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({ error: 'Failed to get workflow status', details: error.message });
  }
});

// Get RMA workflow statistics
router.get('/workflow/stats', async (req, res) => {
  try {
    const dateRange = req.query;
    
    // Get overall RMA stats - only for the 5 specific statuses
    const rmaStats = await RMA.aggregate([
      {
        $match: dateRange.startDate && dateRange.endDate ? {
          createdAt: {
            $gte: new Date(dateRange.startDate),
            $lte: new Date(dateRange.endDate)
          }
        } : {}
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          'Under Review': {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Under Review'] }, 1, 0] }
          },
          'Faulty Transit to CDS': {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Faulty Transit to CDS'] }, 1, 0] }
          },
          'RMA Raised Yet to Deliver': {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'RMA Raised Yet to Deliver'] }, 1, 0] }
          },
          'Open': {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Open'] }, 1, 0] }
          },
          'Completed': {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = rmaStats[0] || {
      total: 0,
      'Under Review': 0,
      'Faulty Transit to CDS': 0,
      'RMA Raised Yet to Deliver': 0,
      'Open': 0,
      'Completed': 0
    };

    // Calculate workflow metrics for the 5 specific statuses
    const totalProcessed = stats['Completed'] + stats['Faulty Transit to CDS'] + stats['RMA Raised Yet to Deliver'];
    stats.approvalRate = totalProcessed > 0 ? ((stats['Completed'] / totalProcessed) * 100).toFixed(2) : 0;
    
    const totalWithReturns = stats['Completed'] + stats['Faulty Transit to CDS'];
    stats.returnCompletionRate = totalWithReturns > 0 ? 
      ((stats['Completed'] / totalWithReturns) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    res.status(500).json({ error: 'Failed to get workflow stats', details: error.message });
  }
});

// Advanced search by part name, part number, model number, or serial number with analytics
router.get('/search/part-analytics', async (req, res) => {
  try {
    const { partName, partNumber, modelNumber, serialNumber } = req.query;
    
    // Determine search type and value
    let searchType = 'partName';
    let searchTerm = '';
    let searchQuery = {};

    if (partName && partName.trim() !== '') {
      searchType = 'partName';
      searchTerm = partName.trim();
      const searchRegex = new RegExp(searchTerm, 'i');
      searchQuery = {
        $or: [
          { defectivePartName: searchRegex },
          { productName: searchRegex },
          { replacedPartName: searchRegex }
        ]
      };
    } else if (partNumber && partNumber.trim() !== '') {
      searchType = 'partNumber';
      searchTerm = partNumber.trim();
      const searchRegex = new RegExp(searchTerm, 'i');
      searchQuery = {
        $or: [
          { defectivePartNumber: searchRegex },
          { productPartNumber: searchRegex },
          { replacedPartNumber: searchRegex },
          { serialNumber: searchRegex }, // Part numbers are often stored in serialNumber field
          { defectiveSerialNumber: searchRegex },
          { replacedPartSerialNumber: searchRegex },
          { productName: searchRegex }, // Sometimes part numbers are in productName
          { defectivePartName: searchRegex }, // Sometimes part numbers are in part names
          { replacedPartName: searchRegex }
        ]
      };
    } else if (modelNumber && modelNumber.trim() !== '') {
      searchType = 'modelNumber';
      searchTerm = modelNumber.trim();
      const searchRegex = new RegExp(searchTerm, 'i');
      searchQuery = {
        $or: [
          { projectorModel: searchRegex },
          { productName: searchRegex }
        ]
      };
    } else if (serialNumber && serialNumber.trim() !== '') {
      searchType = 'serialNumber';
      searchTerm = serialNumber.trim();
      const searchRegex = new RegExp(searchTerm, 'i');
      searchQuery = {
        $or: [
          { projectorSerial: searchRegex },
          { serialNumber: searchRegex },
          { defectiveSerialNumber: searchRegex },
          { replacedPartSerialNumber: searchRegex }
        ]
      };
    } else {
      return res.status(400).json({ error: 'Search parameter is required (partName, partNumber, modelNumber, or serialNumber)' });
    }

    console.log(`🔍 Searching for ${searchType}: "${searchTerm}"`);
    console.log('Search query:', JSON.stringify(searchQuery, null, 2));

    // Get all matching RMA records
    const rmaRecords = await RMA.find(searchQuery).sort({ ascompRaisedDate: -1 });
    console.log(`📊 Found ${rmaRecords.length} matching records`);
    
    // Debug: Log first few records to see their structure
    if (rmaRecords.length > 0) {
      console.log('Sample record fields:', {
        rmaNumber: rmaRecords[0].rmaNumber,
        serialNumber: rmaRecords[0].serialNumber,
        productPartNumber: rmaRecords[0].productPartNumber,
        defectivePartNumber: rmaRecords[0].defectivePartNumber,
        productName: rmaRecords[0].productName,
        defectivePartName: rmaRecords[0].defectivePartName
      });
    }

    // Calculate status distribution
    const statusDistribution = {};
    const priorityDistribution = {};
    const warrantyDistribution = {};
    
    rmaRecords.forEach(rma => {
      const status = rma.caseStatus || 'Unknown';
      const priority = rma.priority || 'Unknown';
      const warranty = rma.warrantyStatus || 'Unknown';
      
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
      warrantyDistribution[warranty] = (warrantyDistribution[warranty] || 0) + 1;
    });

    // Calculate additional metrics
    const totalCases = rmaRecords.length;
    const completedCases = statusDistribution['Completed'] || 0;
    const completionRate = totalCases > 0 ? ((completedCases / totalCases) * 100).toFixed(2) : 0;
    
    // Get recent cases (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCases = rmaRecords.filter(rma => 
      rma.ascompRaisedDate && new Date(rma.ascompRaisedDate) >= thirtyDaysAgo
    ).length;

    // Get average resolution time for completed cases
    const completedRMAs = rmaRecords.filter(rma => rma.caseStatus === 'Completed');
    let avgResolutionDays = 0;
    if (completedRMAs.length > 0) {
      const totalDays = completedRMAs.reduce((sum, rma) => {
        if (rma.ascompRaisedDate && rma.shippedDate) {
          const raisedDate = new Date(rma.ascompRaisedDate);
          const shippedDate = new Date(rma.shippedDate);
          const diffTime = Math.abs(shippedDate - raisedDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      avgResolutionDays = (totalDays / completedRMAs.length).toFixed(1);
    }

    const analytics = {
      partName: searchTerm,
      searchType: searchType,
      searchValue: searchTerm,
      totalCases,
      recentCases,
      completionRate: parseFloat(completionRate),
      avgResolutionDays: parseFloat(avgResolutionDays),
      statusDistribution,
      priorityDistribution,
      warrantyDistribution,
      rmaRecords: rmaRecords.slice(0, 50), // Limit to first 50 records for performance
      searchTimestamp: new Date()
    };

    console.log(`✅ Found ${totalCases} cases for ${searchType}: "${searchTerm}"`);
    res.json(analytics);

  } catch (error) {
    console.error('Error in part analytics search:', error);
    res.status(500).json({ 
      error: 'Failed to search part analytics', 
      details: error.message 
    });
  }
});

// Debug endpoint to check RMA data structure
router.get('/debug/part-numbers', async (req, res) => {
  try {
    const sampleRMAs = await RMA.find({}).limit(5).select('rmaNumber serialNumber productPartNumber defectivePartNumber productName defectivePartName replacedPartName symptoms');
    
    res.json({
      message: 'Sample RMA records with part number fields',
      count: sampleRMAs.length,
      records: sampleRMAs
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch debug data' });
  }
});

// Fix data mapping issues in existing RMA records
router.post('/fix-data-mapping', async (req, res) => {
  try {
    console.log('🔧 Starting RMA data mapping fix...');
    
    // Find RMAs with potential field mapping issues
    const rmAsWithIssues = await RMA.find({
      $or: [
        // Defective part number contains descriptive text (likely swapped)
        { 
          defectivePartNumber: { 
            $regex: /kit|harn|temps|component|part/i 
          } 
        },
        // Defective part name contains numeric patterns (likely swapped)
        { 
          defectivePartName: { 
            $regex: /^\d{3}-\d{6}-\d{2}$/ 
          } 
        },
        // Replacement part name contains symptoms
        { 
          replacedPartName: { 
            $regex: /chipped|marriage|error|sensor|failure/i 
          } 
        }
      ]
    });
    
    console.log(`🔍 Found ${rmAsWithIssues.length} RMAs with potential mapping issues`);
    
    let fixedCount = 0;
    const fixResults = [];
    
    for (const rma of rmAsWithIssues) {
      const originalData = {
        rmaNumber: rma.rmaNumber,
        defectivePartNumber: rma.defectivePartNumber,
        defectivePartName: rma.defectivePartName,
        replacedPartName: rma.replacedPartName
      };
      
      let needsUpdate = false;
      const updateData = {};
      
      // Check if defective part fields are swapped
      const isNumberFieldDescriptive = rma.defectivePartNumber && 
        (rma.defectivePartNumber.toLowerCase().includes('kit') || 
         rma.defectivePartNumber.toLowerCase().includes('harn') ||
         rma.defectivePartNumber.toLowerCase().includes('temps') ||
         rma.defectivePartNumber.toLowerCase().includes('assy') ||
         rma.defectivePartNumber.toLowerCase().includes('assembly') ||
         rma.defectivePartNumber.toLowerCase().includes('tpc') ||
         rma.defectivePartNumber.toLowerCase().includes('light engine') ||
         rma.defectivePartNumber.toLowerCase().includes('ballast') ||
         rma.defectivePartNumber.length > 10);
      
      const isNameFieldNumeric = rma.defectivePartName && 
        (/^\d{3}-\d{6}-\d{2}$/.test(rma.defectivePartName) || // Pattern like "003-005682-01"
         /^\d{3}-\d{6}-\d{2}$/.test(rma.defectivePartName) || // Pattern like "000-101329-03"
         /^\d{3}-\d{6}-\d{2}$/.test(rma.defectivePartName)); // Pattern like "004-102075-02"
      
      if (isNumberFieldDescriptive && isNameFieldNumeric) {
        // Swap the fields
        updateData.defectivePartNumber = rma.defectivePartName;
        updateData.defectivePartName = rma.defectivePartNumber;
        needsUpdate = true;
        console.log(`🔄 Swapping fields for RMA ${rma.rmaNumber}:`, {
          originalNumber: rma.defectivePartNumber,
          originalName: rma.defectivePartName,
          newNumber: rma.defectivePartName,
          newName: rma.defectivePartNumber
        });
      }
      
      // Check if replacement part name contains symptoms
      const symptomPatterns = [
        'integrator rod chipped',
        'prism chipped', 
        'segmen prism',
        'connection lost',
        'power cycle',
        'marriage failure',
        'imb marriage',
        'imb marriage failure',
        'red dmd temperature sensor error',
        'temperature sensor error',
        'dmd error',
        'chipped',
        'marriage'
      ];
      
      const isSymptomDescription = rma.replacedPartName && 
        symptomPatterns.some(pattern => rma.replacedPartName.toLowerCase().includes(pattern.toLowerCase()));
      
      if (isSymptomDescription) {
        // Replace with defective part name
        updateData.replacedPartName = rma.defectivePartName || 'Projector Component';
        needsUpdate = true;
        console.log(`🔄 Fixing replacement part name for RMA ${rma.rmaNumber}:`, {
          originalReplacedName: rma.replacedPartName,
          newReplacedName: rma.defectivePartName || 'Projector Component'
        });
      }
      
      // Also check if replacement part name is a part number (should be part name)
      const isReplacementPartNumber = rma.replacedPartName && 
        /^\d{3}-\d{6}-\d{2}$/.test(rma.replacedPartName);
      
      if (isReplacementPartNumber && rma.defectivePartName) {
        // Replace part number with defective part name
        updateData.replacedPartName = rma.defectivePartName;
        needsUpdate = true;
        console.log(`🔄 Fixing replacement part name (number to name) for RMA ${rma.rmaNumber}:`, {
          originalReplacedName: rma.replacedPartName,
          newReplacedName: rma.defectivePartName
        });
      }
      
      if (needsUpdate) {
        try {
          await RMA.findByIdAndUpdate(rma._id, updateData);
          fixedCount++;
          fixResults.push({
            rmaNumber: rma.rmaNumber,
            originalData,
            fixedData: {
              ...originalData,
              ...updateData
            },
            status: 'fixed'
          });
        } catch (updateError) {
          console.error(`❌ Error updating RMA ${rma.rmaNumber}:`, updateError);
          fixResults.push({
            rmaNumber: rma.rmaNumber,
            originalData,
            status: 'error',
            error: updateError.message
          });
        }
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} out of ${rmAsWithIssues.length} RMAs`);
    
    res.json({
      success: true,
      message: `Fixed ${fixedCount} out of ${rmAsWithIssues.length} RMAs with mapping issues`,
      totalFound: rmAsWithIssues.length,
      totalFixed: fixedCount,
      results: fixResults
    });
    
  } catch (error) {
    console.error('❌ Error fixing RMA data mapping:', error);
    res.status(500).json({ 
      error: 'Failed to fix RMA data mapping', 
      details: error.message 
    });
  }
});

module.exports = router;