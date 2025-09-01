const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const RMA = require('../models/RMA');
const SparePart = require('../models/SparePart');
const Service = require('../models/Service');
const { authenticateToken } = require('../middleware/auth');

// Get comprehensive site analysis by region, state, and site code
router.get('/sites', authenticateToken, async (req, res) => {
  try {
    const { region, state, siteCode } = req.query;
    
    // Build filter based on query parameters
    const filter = {};
    if (region) filter.region = region;
    if (state) filter.state = state;
    if (siteCode) filter.siteCode = { $regex: siteCode, $options: 'i' };
    
    const sites = await Site.find(filter).lean();
    
    // Get comprehensive analysis for each site
    const analysisResults = await Promise.all(sites.map(async (site) => {
      // Get projector statistics
      // Try multiple ways to find projectors for this site
      let projectors = await Projector.find({ siteName: site.name }).lean();
      
      // If no projectors found by siteName, try by siteId
      if (projectors.length === 0) {
        projectors = await Projector.find({ siteId: site._id }).lean();
      }
      
      // If still no projectors, try case-insensitive search
      if (projectors.length === 0) {
        projectors = await Projector.find({ 
          siteName: { $regex: site.name, $options: 'i' } 
        }).lean();
      }
      
      console.log(`[DEBUG] Site: "${site.name}" - Found ${projectors.length} projectors`);
      const projectorStats = {
        total: projectors.length,
        active: projectors.filter(p => p.status === 'Active').length,
        underService: projectors.filter(p => p.status === 'Under Service').length,
        inactive: projectors.filter(p => p.status === 'Inactive').length,
        needsRepair: projectors.filter(p => p.status === 'Needs Repair').length,
        byBrand: {},
        byModel: {},
        byCondition: {}
      };
      
      // Calculate projector statistics
      projectors.forEach(projector => {
        // By brand
        projectorStats.byBrand[projector.brand] = (projectorStats.byBrand[projector.brand] || 0) + 1;
        // By model
        projectorStats.byModel[projector.model] = (projectorStats.byModel[projector.model] || 0) + 1;
        // By condition
        projectorStats.byCondition[projector.condition] = (projectorStats.byCondition[projector.condition] || 0) + 1;
      });
      
      // Get RMA statistics
      const rmaRecords = await RMA.find({ siteName: site.name }).lean();
      const rmaStats = {
        total: rmaRecords.length,
        byStatus: {},
        byPriority: {},
        byProduct: {},
        avgResolutionTime: 0,
        totalCost: 0
      };
      
      // Calculate RMA statistics
      rmaRecords.forEach(rma => {
        // By status
        rmaStats.byStatus[rma.caseStatus] = (rmaStats.byStatus[rma.caseStatus] || 0) + 1;
        // By priority
        rmaStats.byPriority[rma.priority] = (rmaStats.byPriority[rma.priority] || 0) + 1;
        // By product
        rmaStats.byProduct[rma.productName] = (rmaStats.byProduct[rma.productName] || 0) + 1;
        // Calculate costs
        if (rma.estimatedCost) {
          rmaStats.totalCost += rma.estimatedCost;
        }
      });
      
      // Calculate average resolution time
      const completedRMAs = rmaRecords.filter(rma => rma.caseStatus === 'Completed');
      if (completedRMAs.length > 0) {
        const totalDays = completedRMAs.reduce((sum, rma) => {
          if (rma.ascompRaisedDate && rma.shippedDate) {
            const days = Math.ceil((new Date(rma.shippedDate) - new Date(rma.ascompRaisedDate)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }
          return sum;
        }, 0);
        rmaStats.avgResolutionTime = Math.round(totalDays / completedRMAs.length);
      }
      
      // Get spare parts statistics
      const spareParts = await SparePart.find({
        projectorSerial: { $in: projectors.map(p => p.serialNumber) }
      }).lean();
      
      const sparePartsStats = {
        total: spareParts.length,
        byCategory: {},
        byStatus: {},
        byBrand: {},
        totalValue: 0,
        lowStockCount: 0
      };
      
      // Calculate spare parts statistics
      spareParts.forEach(part => {
        // By category
        sparePartsStats.byCategory[part.category] = (sparePartsStats.byCategory[part.category] || 0) + 1;
        // By status
        sparePartsStats.byStatus[part.status] = (sparePartsStats.byStatus[part.status] || 0) + 1;
        // By brand
        sparePartsStats.byBrand[part.brand] = (sparePartsStats.byBrand[part.brand] || 0) + 1;
        // Calculate total value
        sparePartsStats.totalValue += (part.unitPrice * part.stockQuantity);
        // Count low stock
        if (part.stockQuantity <= part.reorderLevel) {
          sparePartsStats.lowStockCount++;
        }
      });
      
      // Get service statistics
      const services = await Service.find({
        siteName: site.name
      }).lean();
      
      const serviceStats = {
        total: services.length,
        byType: {},
        avgSatisfaction: 0,
        totalIssues: 0
      };
      
      // Calculate service statistics
      services.forEach(service => {
        if (service.serviceType) {
          serviceStats.byType[service.serviceType] = (serviceStats.byType[service.serviceType] || 0) + 1;
        }
        if (service.customerSatisfaction) {
          serviceStats.avgSatisfaction += service.customerSatisfaction;
        }
        if (service.issuesFound) {
          serviceStats.totalIssues += service.issuesFound;
        }
      });
      
      if (services.length > 0) {
        serviceStats.avgSatisfaction = Math.round(serviceStats.avgSatisfaction / services.length);
      }
      
      return {
        site: {
          _id: site._id,
          name: site.name,
          siteCode: site.siteCode,
          region: site.region,
          state: site.state,
          address: site.address,
          siteType: site.siteType,
          status: site.status,
          totalAuditoriums: site.auditoriums ? site.auditoriums.length : 0
        },
        analysis: {
          projectors: projectorStats,
          rma: rmaStats,
          spareParts: sparePartsStats,
          services: serviceStats
        }
      };
    }));
    
    res.json({
      totalSites: analysisResults.length,
      sites: analysisResults
    });
    
  } catch (error) {
    console.error('Error fetching site analysis:', error);
    res.status(500).json({ message: 'Error fetching site analysis', error: error.message });
  }
});

// Get regional analysis summary
router.get('/regions', authenticateToken, async (req, res) => {
  try {
    // Get all sites grouped by region
    const regionalAnalysis = await Site.aggregate([
      {
        $group: {
          _id: '$region',
          siteCount: { $sum: 1 },
          states: { $addToSet: '$state' },
          siteTypes: { $addToSet: '$siteType' },
          siteNames: { $addToSet: '$name' }
        }
      }
    ]);

    // Get projector counts for each region using the same approach as site analysis
    const finalRegionalAnalysis = await Promise.all(regionalAnalysis.map(async (region) => {
      let totalProjectors = 0;
      let activeProjectors = 0;
      
      // For each site in this region, count projectors
      for (const siteName of region.siteNames) {
        // Try multiple ways to find projectors for this site
        let projectors = await Projector.find({ siteName: siteName }).lean();
        
        // If no projectors found by siteName, try by siteId
        if (projectors.length === 0) {
          const site = await Site.findOne({ name: siteName }).lean();
          if (site) {
            projectors = await Projector.find({ siteId: site._id }).lean();
          }
        }
        
        // If still no projectors, try case-insensitive search
        if (projectors.length === 0) {
          projectors = await Projector.find({ 
            siteName: { $regex: siteName, $options: 'i' } 
          }).lean();
        }
        
        totalProjectors += projectors.length;
        activeProjectors += projectors.filter(p => p.status === 'Active').length;
      }
      
      return {
        ...region,
        totalProjectors,
        activeProjectors
      };
    }));
    
    res.json(finalRegionalAnalysis);
  } catch (error) {
    console.error('Error fetching regional analysis:', error);
    res.status(500).json({ message: 'Error fetching regional analysis', error: error.message });
  }
});

// Get state-wise analysis
router.get('/states', authenticateToken, async (req, res) => {
  try {
    const { region } = req.query;
    
    const filter = {};
    if (region) filter.region = region;
    
    const stateAnalysis = await Site.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$state',
          region: { $first: '$region' },
          siteCount: { $sum: 1 },
          siteCodes: { $addToSet: '$siteCode' },
          siteTypes: { $addToSet: '$siteType' },
          siteNames: { $addToSet: '$name' }
        }
      }
    ]);

    // Get projector counts for each state using the same approach as site analysis
    const finalStateAnalysis = await Promise.all(stateAnalysis.map(async (state) => {
      let totalProjectors = 0;
      let activeProjectors = 0;
      
      // For each site in this state, count projectors
      for (const siteName of state.siteNames) {
        // Try multiple ways to find projectors for this site
        let projectors = await Projector.find({ siteName: siteName }).lean();
        
        // If no projectors found by siteName, try by siteId
        if (projectors.length === 0) {
          const site = await Site.findOne({ name: siteName }).lean();
          if (site) {
            projectors = await Projector.find({ siteId: site._id }).lean();
          }
        }
        
        // If still no projectors, try case-insensitive search
        if (projectors.length === 0) {
          projectors = await Projector.find({ 
            siteName: { $regex: siteName, $options: 'i' } 
          }).lean();
        }
        
        totalProjectors += projectors.length;
        activeProjectors += projectors.filter(p => p.status === 'Active').length;
      }
      
      return {
        ...state,
        totalProjectors,
        activeProjectors
      };
    }));
    
    // Sort the results after Promise.all resolves
    finalStateAnalysis.sort((a, b) => b.siteCount - a.siteCount);
    
    res.json(finalStateAnalysis);
  } catch (error) {
    console.error('Error fetching state analysis:', error);
    res.status(500).json({ message: 'Error fetching state analysis', error: error.message });
  }
});

// Get RMA analysis by site
router.get('/rma-analysis', authenticateToken, async (req, res) => {
  try {
    const { siteCode, region, state } = req.query;
    
    const filter = {};
    if (siteCode) filter.siteCode = { $regex: siteCode, $options: 'i' };
    if (region) filter.region = region;
    if (state) filter.state = state;
    
    const sites = await Site.find(filter).select('name siteCode region state').lean();
    const siteNames = sites.map(site => site.name);
    
    const rmaAnalysis = await RMA.aggregate([
      {
        $match: {
          siteName: { $in: siteNames }
        }
      },
      {
        $group: {
          _id: '$siteName',
          totalRMAs: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$caseStatus',
              priority: '$priority',
              product: '$productName',
              cost: '$estimatedCost',
              raisedDate: '$ascompRaisedDate',
              shippedDate: '$shippedDate'
            }
          },
          totalCost: { $sum: { $ifNull: ['$estimatedCost', 0] } },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: ['$ascompRaisedDate', '$shippedDate'] },
                {
                  $ceil: {
                    $divide: [
                      { $subtract: ['$shippedDate', '$ascompRaisedDate'] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                },
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'sites',
          localField: '_id',
          foreignField: 'name',
          as: 'siteInfo'
        }
      },
      {
        $addFields: {
          siteCode: { $arrayElemAt: ['$siteInfo.siteCode', 0] },
          region: { $arrayElemAt: ['$siteInfo.region', 0] },
          state: { $arrayElemAt: ['$siteInfo.state', 0] }
        }
      },
      {
        $project: {
          siteInfo: 0
        }
      }
    ]);
    
    res.json(rmaAnalysis);
  } catch (error) {
    console.error('Error fetching RMA analysis:', error);
    res.status(500).json({ message: 'Error fetching RMA analysis', error: error.message });
  }
});

// Get projector analysis by site
router.get('/projector-analysis', authenticateToken, async (req, res) => {
  try {
    const { siteCode, region, state } = req.query;
    
    const filter = {};
    if (siteCode) filter.siteCode = { $regex: siteCode, $options: 'i' };
    if (region) filter.region = region;
    if (state) filter.state = state;
    
    const sites = await Site.find(filter).select('_id name siteCode region state').lean();
    const siteNames = sites.map(site => site.name);
    
    const projectorAnalysis = await Projector.aggregate([
      {
        $match: {
          siteName: { $in: siteNames }
        }
      },
      {
        $lookup: {
          from: 'sites',
          localField: 'siteName',
          foreignField: 'name',
          as: 'siteInfo'
        }
      },
      {
        $addFields: {
          siteName: { $arrayElemAt: ['$siteInfo.name', 0] },
          siteCode: { $arrayElemAt: ['$siteInfo.siteCode', 0] },
          region: { $arrayElemAt: ['$siteInfo.region', 0] },
          state: { $arrayElemAt: ['$siteInfo.state', 0] }
        }
      },
      {
        $group: {
          _id: '$siteName',
          siteName: { $first: '$siteName' },
          siteCode: { $first: '$siteCode' },
          region: { $first: '$region' },
          state: { $first: '$state' },
          totalProjectors: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              condition: '$condition',
              brand: '$brand',
              model: '$model',
              uptime: '$uptime',
              hoursUsed: '$hoursUsed',
              expectedLife: '$expectedLife'
            }
          },
          byBrand: {},
          byModel: {},
          byCondition: {},
          avgUptime: { $avg: '$uptime' },
          avgHoursUsed: { $avg: '$hoursUsed' },
          totalServices: { $sum: '$totalServices' },
          totalRMAs: { $sum: '$totalRMAs' }
        }
      },
      {
        $project: {
          siteInfo: 0
        }
      }
    ]);
    
    // Calculate additional statistics
    projectorAnalysis.forEach(site => {
      const projectors = site.byStatus;
      
      // Calculate by brand
      site.byBrand = projectors.reduce((acc, p) => {
        acc[p.brand] = (acc[p.brand] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate by model
      site.byModel = projectors.reduce((acc, p) => {
        acc[p.model] = (acc[p.model] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate by condition
      site.byCondition = projectors.reduce((acc, p) => {
        acc[p.condition] = (acc[p.condition] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate by status
      site.byStatus = projectors.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
    });
    
    res.json(projectorAnalysis);
  } catch (error) {
    console.error('Error fetching projector analysis:', error);
    res.status(500).json({ message: 'Error fetching projector analysis', error: error.message });
  }
});

// Get spare parts analysis by site
router.get('/spare-parts-analysis', authenticateToken, async (req, res) => {
  try {
    const { siteCode, region, state } = req.query;
    
    const filter = {};
    if (siteCode) filter.siteCode = { $regex: siteCode, $options: 'i' };
    if (region) filter.region = region;
    if (state) filter.state = state;
    
    const sites = await Site.find(filter).select('_id name siteCode region state').lean();
    const siteNames = sites.map(site => site.name);
    
    // Get projectors for these sites
    const projectors = await Projector.find({ siteName: { $in: siteNames } })
      .select('serialNumber siteName')
      .lean();
    
    const projectorSerials = projectors.map(p => p.serialNumber);
    const projectorBySite = projectors.reduce((acc, p) => {
      if (!acc[p.siteName]) acc[p.siteName] = [];
      acc[p.siteName].push(p.serialNumber);
      return acc;
    }, {});
    
    // Get spare parts for these projectors
    const spareParts = await SparePart.find({
      projectorSerial: { $in: projectorSerials }
    }).lean();
    
    // Group spare parts by site
    const sparePartsBySite = {};
    spareParts.forEach(part => {
      const projector = projectors.find(p => p.serialNumber === part.projectorSerial);
      if (projector && projectorBySite[projector.siteName]) {
        if (!sparePartsBySite[projector.siteName]) {
          sparePartsBySite[projector.siteName] = [];
        }
        sparePartsBySite[projector.siteName].push(part);
      }
    });
    
    // Build analysis for each site
    const analysis = sites.map(site => {
      const siteSpareParts = sparePartsBySite[site.name] || [];
      
      const stats = {
        total: siteSpareParts.length,
        byCategory: {},
        byStatus: {},
        byBrand: {},
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
      
      siteSpareParts.forEach(part => {
        // By category
        stats.byCategory[part.category] = (stats.byCategory[part.category] || 0) + 1;
        // By status
        stats.byStatus[part.status] = (stats.byStatus[part.status] || 0) + 1;
        // By brand
        stats.byBrand[part.brand] = (stats.byBrand[part.brand] || 0) + 1;
        // Calculate total value
        stats.totalValue += (part.unitPrice * part.stockQuantity);
        // Count low stock and out of stock
        if (part.stockQuantity === 0) {
          stats.outOfStockCount++;
        } else if (part.stockQuantity <= part.reorderLevel) {
          stats.lowStockCount++;
        }
      });
      
      return {
        site: {
          _id: site._id,
          name: site.name,
          siteCode: site.siteCode,
          region: site.region,
          state: site.state
        },
        analysis: stats
      };
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching spare parts analysis:', error);
    res.status(500).json({ message: 'Error fetching spare parts analysis', error: error.message });
  }
});

// Get comprehensive dashboard statistics
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const [siteStats, projectorStats, rmaStats, sparePartsStats] = await Promise.all([
      Site.aggregate([
        {
          $group: {
            _id: null,
            totalSites: { $sum: 1 },
            byRegion: { $addToSet: '$region' },
            byState: { $addToSet: '$state' },
            byType: { $addToSet: '$siteType' }
          }
        }
      ]),
      Projector.aggregate([
        {
          $group: {
            _id: null,
            totalProjectors: { $sum: 1 },
            activeProjectors: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            underService: { $sum: { $cond: [{ $eq: ['$status', 'Under Service'] }, 1, 0] } },
            needsRepair: { $sum: { $cond: [{ $eq: ['$status', 'Needs Repair'] }, 1, 0] } }
          }
        }
      ]),
      RMA.aggregate([
        {
          $group: {
            _id: null,
            totalRMAs: { $sum: 1 },
            underReview: { $sum: { $cond: [{ $eq: ['$caseStatus', 'Under Review'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0] } },
            totalCost: { $sum: { $ifNull: ['$estimatedCost', 0] } }
          }
        }
      ]),
      SparePart.aggregate([
        {
          $group: {
            _id: null,
            totalParts: { $sum: 1 },
            inStock: { $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] } },
            outOfStock: { $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] } }
          }
        }
      ])
    ]);
    
    const stats = {
      sites: siteStats[0] || { totalSites: 0, byRegion: [], byState: [], byType: [] },
      projectors: projectorStats[0] || { totalProjectors: 0, activeProjectors: 0, underService: 0, needsRepair: 0 },
      rma: rmaStats[0] || { totalRMAs: 0, underReview: 0, completed: 0, totalCost: 0 },
      spareParts: sparePartsStats[0] || { totalParts: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

module.exports = router;
