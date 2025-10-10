const RMA = require('../models/RMA');
const Projector = require('../models/Projector');
const Site = require('../models/Site');
const PartComment = require('../models/PartComment');
const mongoose = require('mongoose');

class AnalyticsService {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Check if MongoDB is connected
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Wait for MongoDB connection
  async waitForConnection(timeout = 10000) {
    if (this.isConnected()) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (this.isConnected()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('MongoDB connection timeout'));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      
      checkConnection();
    });
  }

  // Get comprehensive dashboard metrics
  async getDashboardMetrics() {
    const cacheKey = 'dashboard_metrics';
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Wait for MongoDB connection before proceeding
      await this.waitForConnection();
      const [
        totalRMAs,
        activeRMAs,
        completedRMAs,
        priorityBreakdown,
        statusBreakdown,
        monthlyTrends,
        sitePerformance,
        technicianPerformance,
        costAnalysis,
        slaMetrics,
        partAnalytics
      ] = await Promise.all([
        this.getTotalRMAs(),
        this.getActiveRMAs(),
        this.getCompletedRMAs(),
        this.getPriorityBreakdown(),
        this.getStatusBreakdown(),
        this.getMonthlyTrends(),
        this.getSitePerformance(),
        this.getTechnicianPerformance(),
        this.getCostAnalysis(),
        this.getSLAMetrics(),
        this.getPartAnalytics()
      ]);

      const metrics = {
        overview: {
          total: totalRMAs,
          active: activeRMAs,
          completed: completedRMAs,
          completionRate: totalRMAs > 0 ? (completedRMAs / totalRMAs * 100).toFixed(1) : 0
        },
        priorityBreakdown,
        statusBreakdown,
        trends: monthlyTrends,
        performance: {
          sites: sitePerformance,
          technicians: technicianPerformance
        },
        financial: costAnalysis,
        sla: slaMetrics,
        parts: partAnalytics,
        lastUpdated: new Date()
      };

      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      return metrics;
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  // Get total RMAs count
  async getTotalRMAs() {
    await this.waitForConnection();
    return await RMA.countDocuments();
  }

  // Get active RMAs count
  async getActiveRMAs() {
    await this.waitForConnection();
    return await RMA.countDocuments({
      caseStatus: { $nin: ['Completed', 'Rejected'] }
    });
  }

  // Get completed RMAs count
  async getCompletedRMAs() {
    await this.waitForConnection();
    return await RMA.countDocuments({
      caseStatus: 'Completed'
    });
  }

  // Get priority breakdown
  async getPriorityBreakdown() {
    await this.waitForConnection();
    const breakdown = await RMA.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return breakdown.reduce((acc, item) => {
      acc[item._id || 'Unknown'] = item.count;
      return acc;
    }, {});
  }

  // Get status breakdown
  async getStatusBreakdown() {
    await this.waitForConnection();
    const breakdown = await RMA.aggregate([
      {
        $group: {
          _id: '$caseStatus',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return breakdown.reduce((acc, item) => {
      acc[item._id || 'Unknown'] = item.count;
      return acc;
    }, {});
  }

  // Get monthly trends
  async getMonthlyTrends() {
    await this.waitForConnection();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trends = await RMA.aggregate([
      {
        $match: {
          ascompRaisedDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$ascompRaisedDate' },
            month: { $month: '$ascompRaisedDate' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0]
            }
          },
          highPriority: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'High'] }, 1, 0]
            }
          },
          totalCost: { $sum: '$estimatedCost' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return trends.map(trend => ({
      month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
      total: trend.total,
      completed: trend.completed,
      highPriority: trend.highPriority,
      totalCost: trend.totalCost,
      completionRate: trend.total > 0 ? (trend.completed / trend.total * 100).toFixed(1) : 0
    }));
  }

  // Get site performance metrics
  async getSitePerformance() {
    await this.waitForConnection();
    const performance = await RMA.aggregate([
      {
        $group: {
          _id: '$siteName',
          totalRMAs: { $sum: 1 },
          completedRMAs: {
            $sum: {
              $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0]
            }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$caseStatus', 'Completed'] },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$ascompRaisedDate'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                },
                null
              ]
            }
          },
          totalCost: { $sum: '$estimatedCost' },
          highPriorityCount: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'High'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalRMAs', 0] },
              { $multiply: [{ $divide: ['$completedRMAs', '$totalRMAs'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalRMAs: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return performance;
  }

  // Get technician performance metrics
  async getTechnicianPerformance() {
    await this.waitForConnection();
    const performance = await RMA.aggregate([
      {
        $match: {
          createdBy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$createdBy',
          totalRMAs: { $sum: 1 },
          completedRMAs: {
            $sum: {
              $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0]
            }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$caseStatus', 'Completed'] },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$ascompRaisedDate'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                },
                null
              ]
            }
          },
          totalCost: { $sum: '$estimatedCost' },
          highPriorityCount: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'High'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalRMAs', 0] },
              { $multiply: [{ $divide: ['$completedRMAs', '$totalRMAs'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalRMAs: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return performance;
  }

  // Get cost analysis
  async getCostAnalysis() {
    await this.waitForConnection();
    const costAnalysis = await RMA.aggregate([
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$estimatedCost' },
          avgCost: { $avg: '$estimatedCost' },
          maxCost: { $max: '$estimatedCost' },
          minCost: { $min: '$estimatedCost' },
          totalRMAs: { $sum: 1 }
        }
      }
    ]);

    const priorityCosts = await RMA.aggregate([
      {
        $group: {
          _id: '$priority',
          totalCost: { $sum: '$estimatedCost' },
          avgCost: { $avg: '$estimatedCost' },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyCosts = await RMA.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$ascompRaisedDate' },
            month: { $month: '$ascompRaisedDate' }
          },
          totalCost: { $sum: '$estimatedCost' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    return {
      overall: costAnalysis[0] || {
        totalCost: 0,
        avgCost: 0,
        maxCost: 0,
        minCost: 0,
        totalRMAs: 0
      },
      byPriority: priorityCosts,
      monthly: monthlyCosts
    };
  }

  // Get SLA metrics
  async getSLAMetrics() {
    await this.waitForConnection();
    const slaRules = {
      'High': 24,
      'Critical': 4,
      'Medium': 72,
      'Low': 168
    };

    const slaMetrics = await RMA.aggregate([
      {
        $match: {
          caseStatus: { $nin: ['Completed', 'Rejected'] }
        }
      },
      {
        $addFields: {
          slaHours: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'High'] }, then: 24 },
                { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                { case: { $eq: ['$priority', 'Medium'] }, then: 72 },
                { case: { $eq: ['$priority', 'Low'] }, then: 168 }
              ],
              default: 72
            }
          },
          hoursElapsed: {
            $divide: [
              { $subtract: [new Date(), '$ascompRaisedDate'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $addFields: {
          isBreach: { $gt: ['$hoursElapsed', '$slaHours'] },
          breachHours: {
            $cond: [
              { $gt: ['$hoursElapsed', '$slaHours'] },
              { $subtract: ['$hoursElapsed', '$slaHours'] },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalActive: { $sum: 1 },
          breaches: { $sum: { $cond: ['$isBreach', 1, 0] } },
          avgBreachHours: { $avg: '$breachHours' },
          maxBreachHours: { $max: '$breachHours' }
        }
      }
    ]);

    const breachDetails = await RMA.aggregate([
      {
        $match: {
          caseStatus: { $nin: ['Completed', 'Rejected'] }
        }
      },
      {
        $addFields: {
          slaHours: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'High'] }, then: 24 },
                { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                { case: { $eq: ['$priority', 'Medium'] }, then: 72 },
                { case: { $eq: ['$priority', 'Low'] }, then: 168 }
              ],
              default: 72
            }
          },
          hoursElapsed: {
            $divide: [
              { $subtract: [new Date(), '$ascompRaisedDate'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $match: {
          $expr: { $gt: ['$hoursElapsed', '$slaHours'] }
        }
      },
      {
        $project: {
          rmaNumber: 1,
          siteName: 1,
          priority: 1,
          caseStatus: 1,
          hoursElapsed: 1,
          slaHours: 1,
          breachHours: { $subtract: ['$hoursElapsed', '$slaHours'] }
        }
      },
      {
        $sort: { breachHours: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const metrics = slaMetrics[0] || {
      totalActive: 0,
      breaches: 0,
      avgBreachHours: 0,
      maxBreachHours: 0
    };

    return {
      ...metrics,
      breachRate: metrics.totalActive > 0 ? (metrics.breaches / metrics.totalActive * 100).toFixed(1) : 0,
      breachDetails
    };
  }

  // Get real-time alerts
  async getRealTimeAlerts() {
    const alerts = [];

    // SLA breaches
    const slaBreaches = await this.getSLAMetrics();
    if (slaBreaches.breaches > 0) {
      alerts.push({
        type: 'sla_breach',
        severity: 'high',
        message: `${slaBreaches.breaches} RMAs have breached SLA`,
        count: slaBreaches.breaches,
        details: slaBreaches.breachDetails.slice(0, 3)
      });
    }

    // High priority RMAs
    const highPriorityCount = await RMA.countDocuments({
      priority: 'High',
      caseStatus: { $nin: ['Completed', 'Rejected'] }
    });

    if (highPriorityCount > 0) {
      alerts.push({
        type: 'high_priority',
        severity: 'medium',
        message: `${highPriorityCount} high priority RMAs need attention`,
        count: highPriorityCount
      });
    }

    // Critical RMAs
    const criticalCount = await RMA.countDocuments({
      priority: 'Critical',
      caseStatus: { $nin: ['Completed', 'Rejected'] }
    });

    if (criticalCount > 0) {
      alerts.push({
        type: 'critical',
        severity: 'critical',
        message: `${criticalCount} critical RMAs require immediate attention`,
        count: criticalCount
      });
    }

    // RMAs stuck in review
    const stuckInReview = await RMA.countDocuments({
      caseStatus: 'Under Review',
      ascompRaisedDate: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } // 48 hours ago
    });

    if (stuckInReview > 0) {
      alerts.push({
        type: 'stuck_review',
        severity: 'medium',
        message: `${stuckInReview} RMAs stuck in review for over 48 hours`,
        count: stuckInReview
      });
    }

    return alerts;
  }

  // Get default metrics when there's an error
  getDefaultMetrics() {
    return {
      overview: {
        total: 0,
        active: 0,
        completed: 0,
        completionRate: 0
      },
      priorityBreakdown: {},
      statusBreakdown: {},
      trends: [],
      performance: {
        sites: [],
        technicians: []
      },
      financial: {
        overall: {
          totalCost: 0,
          avgCost: 0,
          maxCost: 0,
          minCost: 0,
          totalRMAs: 0
        },
        byPriority: [],
        monthly: []
      },
      sla: {
        totalActive: 0,
        breaches: 0,
        avgBreachHours: 0,
        maxBreachHours: 0,
        breachRate: 0,
        breachDetails: []
      },
      lastUpdated: new Date()
    };
  }

  // Get comprehensive site analytics
  async getSiteAnalytics() {
    const cacheKey = 'site_analytics';
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const [
        totalSites,
        activeSites,
        totalProjectors,
        activeProjectors,
        sitesByRegion,
        sitesByType,
        projectorsByStatus,
        regionDetails,
        siteDetails
      ] = await Promise.all([
        this.getTotalSites(),
        this.getActiveSites(),
        this.getTotalProjectors(),
        this.getActiveProjectors(),
        this.getSitesByRegion(),
        this.getSitesByType(),
        this.getProjectorsByStatus(),
        this.getRegionDetails(),
        this.getSiteDetails()
      ]);

      const analytics = {
        overview: {
          totalSites,
          activeSites,
          totalProjectors,
          activeProjectors,
          siteUtilization: totalSites > 0 ? (activeSites / totalSites * 100).toFixed(1) : 0,
          projectorUtilization: totalProjectors > 0 ? (activeProjectors / totalProjectors * 100).toFixed(1) : 0
        },
        distribution: {
          byRegion: sitesByRegion,
          byType: sitesByType,
          projectorsByStatus
        },
        regionDetails,
        siteDetails,
        lastUpdated: new Date()
      };

      this.metricsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      console.error('Error getting site analytics:', error);
      return this.getDefaultSiteAnalytics();
    }
  }

  // Get region-wise analytics
  async getRegionAnalytics() {
    const cacheKey = 'region_analytics';
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Get all sites grouped by region
      const sites = await Site.find({}).select('_id name siteCode region state siteType status auditoriums');
      const projectors = await Projector.find({}).select('siteId status condition');

      // Group sites by region
      const regionMap = new Map();
      
      sites.forEach(site => {
        const region = site.region;
        if (!regionMap.has(region)) {
          regionMap.set(region, {
            _id: region,
            totalSites: 0,
            activeSites: 0,
            totalProjectors: 0,
            activeProjectors: 0,
            sites: [],
            projectorStatusBreakdown: {},
            projectorConditionBreakdown: {}
          });
        }
        
        const regionData = regionMap.get(region);
        regionData.totalSites++;
        if (site.status === 'Active') {
          regionData.activeSites++;
        }
        
        regionData.sites.push({
          siteId: site._id,
          siteName: site.name,
          siteCode: site.siteCode,
          state: site.state,
          siteType: site.siteType,
          status: site.status,
          totalAuditoriums: site.auditoriums.length
        });
      });

      // Count projectors for each region
      projectors.forEach(projector => {
        const site = sites.find(s => s._id.toString() === projector.siteId.toString());
        if (site) {
          const region = site.region;
          if (regionMap.has(region)) {
            const regionData = regionMap.get(region);
            regionData.totalProjectors++;
            if (projector.status === 'Active') {
              regionData.activeProjectors++;
            }
            
            // Count by status
            const status = projector.status || 'Unknown';
            regionData.projectorStatusBreakdown[status] = (regionData.projectorStatusBreakdown[status] || 0) + 1;
            
            // Count by condition
            const condition = projector.condition || 'Unknown';
            regionData.projectorConditionBreakdown[condition] = (regionData.projectorConditionBreakdown[condition] || 0) + 1;
          }
        }
      });

      // Calculate utilization rates
      const processedRegions = Array.from(regionMap.values()).map(region => ({
        ...region,
        siteUtilization: region.totalSites > 0 ? (region.activeSites / region.totalSites * 100).toFixed(1) : 0,
        projectorUtilization: region.totalProjectors > 0 ? (region.activeProjectors / region.totalProjectors * 100).toFixed(1) : 0
      })).sort((a, b) => b.totalSites - a.totalSites);

      const analytics = {
        regions: processedRegions,
        summary: {
          totalRegions: processedRegions.length,
          totalSites: processedRegions.reduce((sum, region) => sum + region.totalSites, 0),
          totalProjectors: processedRegions.reduce((sum, region) => sum + region.totalProjectors, 0),
          avgSiteUtilization: processedRegions.length > 0 ? 
            (processedRegions.reduce((sum, region) => sum + parseFloat(region.siteUtilization), 0) / processedRegions.length).toFixed(1) : 0,
          avgProjectorUtilization: processedRegions.length > 0 ? 
            (processedRegions.reduce((sum, region) => sum + parseFloat(region.projectorUtilization), 0) / processedRegions.length).toFixed(1) : 0
        },
        lastUpdated: new Date()
      };

      this.metricsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      console.error('Error getting region analytics:', error);
      return this.getDefaultRegionAnalytics();
    }
  }

  // Get detailed projector analytics
  async getProjectorAnalytics() {
    const cacheKey = 'projector_analytics';
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Get projectors with site information
      const projectors = await Projector.find({})
        .populate('siteId', 'name region state')
        .select('status condition brand model auditoriumId auditoriumName installDate warrantyEnd hoursUsed');

      const statusBreakdown = {};
      const conditionBreakdown = {};
      const brandBreakdown = {};
      const modelBreakdown = {};
      let activeProjectors = 0;

      const projectorsByStatus = projectors.map(projector => {
        const status = projector.status || 'Unknown';
        const condition = projector.condition || 'Unknown';
        const brand = projector.brand || 'Unknown';
        const model = projector.model || 'Unknown';

        // Count by status
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        if (status === 'Active') activeProjectors++;

        // Count by condition
        conditionBreakdown[condition] = (conditionBreakdown[condition] || 0) + 1;

        // Count by brand
        brandBreakdown[brand] = (brandBreakdown[brand] || 0) + 1;

        // Count by model
        modelBreakdown[model] = (modelBreakdown[model] || 0) + 1;

        return {
          status: projector.status,
          condition: projector.condition,
          brand: projector.brand,
          model: projector.model,
          siteName: projector.siteId?.name || 'Unknown',
          siteRegion: projector.siteId?.region || 'Unknown',
          siteState: projector.siteId?.state || 'Unknown',
          auditoriumId: projector.auditoriumId,
          auditoriumName: projector.auditoriumName,
          installDate: projector.installDate,
          warrantyEnd: projector.warrantyEnd,
          hoursUsed: projector.hoursUsed || 0
        };
      });

      const analytics = {
        overview: {
          totalProjectors: projectors.length,
          activeProjectors: activeProjectors,
          utilizationRate: projectors.length > 0 ? 
            parseFloat((activeProjectors / projectors.length * 100).toFixed(1)) : 0
        },
        breakdown: {
          byStatus: statusBreakdown,
          byCondition: conditionBreakdown,
          byBrand: brandBreakdown,
          byModel: modelBreakdown
        },
        details: projectorsByStatus,
        lastUpdated: new Date()
      };

      this.metricsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      console.error('Error getting projector analytics:', error);
      return this.getDefaultProjectorAnalytics();
    }
  }

  // Helper methods for site analytics
  async getTotalSites() {
    return await Site.countDocuments();
  }

  async getActiveSites() {
    return await Site.countDocuments({ status: 'Active' });
  }

  async getTotalProjectors() {
    return await Projector.countDocuments();
  }

  async getActiveProjectors() {
    return await Projector.countDocuments({ status: 'Active' });
  }

  async getSitesByRegion() {
    return await Site.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getSitesByType() {
    return await Site.aggregate([
      { $group: { _id: '$siteType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getProjectorsByStatus() {
    return await Projector.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getRegionDetails() {
    return await Site.aggregate([
      {
        $lookup: {
          from: 'projectors',
          localField: '_id',
          foreignField: 'siteId',
          as: 'projectors'
        }
      },
      {
        $group: {
          _id: '$region',
          sites: {
            $push: {
              siteId: '$_id',
              name: '$name',
              siteCode: '$siteCode',
              state: '$state',
              siteType: '$siteType',
              status: '$status',
              totalProjectors: { $size: '$projectors' },
              activeProjectors: {
                $size: {
                  $filter: {
                    input: '$projectors',
                    cond: { $eq: ['$$this.status', 'Active'] }
                  }
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalSites: { $size: '$sites' },
          totalProjectors: {
            $sum: '$sites.totalProjectors'
          },
          activeProjectors: {
            $sum: '$sites.activeProjectors'
          }
        }
      },
      {
        $sort: { totalSites: -1 }
      }
    ]);
  }

  async getSiteDetails() {
    const sites = await Site.find({}).select('_id name siteCode region state siteType status auditoriums');
    const projectors = await Projector.find({}).select('siteId status');

    const siteDetails = await Promise.all(sites.map(async (site) => {
      const siteProjectors = projectors.filter(p => p.siteId.toString() === site._id.toString());
      const activeProjectors = siteProjectors.filter(p => p.status === 'Active').length;
      
      const projectorsByStatus = {};
      siteProjectors.forEach(projector => {
        const status = projector.status || 'Unknown';
        projectorsByStatus[status] = (projectorsByStatus[status] || 0) + 1;
      });

      return {
        _id: site._id,
        name: site.name,
        siteCode: site.siteCode,
        region: site.region,
        state: site.state,
        siteType: site.siteType,
        status: site.status,
        totalProjectors: siteProjectors.length,
        activeProjectors: activeProjectors,
        projectorsByStatus: projectorsByStatus,
        auditoriums: site.auditoriums,
        utilizationRate: siteProjectors.length > 0 ? 
          parseFloat((activeProjectors / siteProjectors.length * 100).toFixed(1)) : 0
      };
    }));

    return siteDetails.sort((a, b) => b.totalProjectors - a.totalProjectors);
  }

  // Default analytics when there's an error
  getDefaultSiteAnalytics() {
    return {
      overview: {
        totalSites: 0,
        activeSites: 0,
        totalProjectors: 0,
        activeProjectors: 0,
        siteUtilization: 0,
        projectorUtilization: 0
      },
      distribution: {
        byRegion: [],
        byType: [],
        projectorsByStatus: []
      },
      regionDetails: [],
      siteDetails: [],
      lastUpdated: new Date()
    };
  }

  getDefaultRegionAnalytics() {
    return {
      regions: [],
      summary: {
        totalRegions: 0,
        totalSites: 0,
        totalProjectors: 0,
        avgSiteUtilization: 0,
        avgProjectorUtilization: 0
      },
      lastUpdated: new Date()
    };
  }

  getDefaultProjectorAnalytics() {
    return {
      overview: {
        totalProjectors: 0,
        activeProjectors: 0,
        utilizationRate: 0
      },
      breakdown: {
        byStatus: {},
        byCondition: {},
        byBrand: {},
        byModel: {}
      },
      details: [],
      lastUpdated: new Date()
    };
  }

  // Get part analytics with site-wise breakdown
  async getPartAnalytics() {
    try {
      await this.waitForConnection();
      const rmas = await RMA.find({}).lean();
      
      // Group by defective parts with site-wise breakdown
      const partGroups = {};
      const currentDate = new Date();
      
      rmas.forEach(rma => {
        const partName = rma.defectivePartName || rma.productName || 'Unknown Part';
        const partNumber = rma.defectivePartNumber || rma.productPartNumber || 'N/A';
        const siteName = rma.siteName || 'Unknown Site';
        const siteId = rma.siteId || rma.siteName || 'unknown';
        const key = `${partName}|${partNumber}`;
        
        if (!partGroups[key]) {
          partGroups[key] = {
            partName,
            partNumber,
            totalCount: 0,
            pendingCount: 0,
            completedCount: 0,
            pendingDays: [],
            statusBreakdown: {},
            sites: new Set(),
            siteBreakdown: {},
            lastStatus: null,
            lastUpdateDate: null,
            avgResolutionDays: 0,
            totalCost: 0
          };
        }
        
        const part = partGroups[key];
        part.totalCount++;
        part.sites.add(siteName);
        
        // Initialize site breakdown if not exists
        if (!part.siteBreakdown[siteId]) {
          part.siteBreakdown[siteId] = {
            siteId,
            siteName,
            totalCount: 0,
            pendingCount: 0,
            completedCount: 0,
            pendingDays: [],
            statusBreakdown: {},
            totalCost: 0,
            lastRmaDate: null,
            lastStatus: null
          };
        }
        
        const siteData = part.siteBreakdown[siteId];
        siteData.totalCount++;
        
        // Calculate pending days
        const startDate = rma.ascompRaisedDate || rma.customerErrorDate || rma.createdAt;
        if (startDate) {
          const daysPending = Math.floor((currentDate - new Date(startDate)) / (1000 * 60 * 60 * 24));
          
          if (rma.caseStatus === 'Completed' || rma.caseStatus === 'Closed') {
            part.completedCount++;
            siteData.completedCount++;
            part.avgResolutionDays += daysPending;
          } else {
            part.pendingCount++;
            siteData.pendingCount++;
            part.pendingDays.push(daysPending);
            siteData.pendingDays.push(daysPending);
          }
        }
        
        // Status breakdown
        const status = rma.caseStatus || 'Unknown';
        part.statusBreakdown[status] = (part.statusBreakdown[status] || 0) + 1;
        siteData.statusBreakdown[status] = (siteData.statusBreakdown[status] || 0) + 1;
        
        // Track last status and update date
        const updateDate = rma.updatedAt || rma.createdAt;
        if (!part.lastUpdateDate || new Date(updateDate) > new Date(part.lastUpdateDate)) {
          part.lastStatus = status;
          part.lastUpdateDate = updateDate;
        }
        
        if (!siteData.lastRmaDate || new Date(updateDate) > new Date(siteData.lastRmaDate)) {
          siteData.lastStatus = status;
          siteData.lastRmaDate = updateDate;
        }
        
        // Cost tracking
        if (rma.estimatedCost && !isNaN(rma.estimatedCost)) {
          const cost = parseFloat(rma.estimatedCost);
          part.totalCost += cost;
          siteData.totalCost += cost;
        }
      });
      
      // Process and format the data with site breakdown
      const partAnalytics = await Promise.all(Object.values(partGroups).map(async (part) => {
        const avgPendingDays = part.pendingDays.length > 0 
          ? Math.round(part.pendingDays.reduce((a, b) => a + b, 0) / part.pendingDays.length)
          : 0;
        
        const maxPendingDays = part.pendingDays.length > 0 
          ? Math.max(...part.pendingDays)
          : 0;
        
        const avgResolutionDays = part.completedCount > 0 
          ? Math.round(part.avgResolutionDays / part.completedCount)
          : 0;
        
        // Process site breakdown
        const siteBreakdown = await Promise.all(Object.values(part.siteBreakdown).map(async (siteData) => {
          const siteAvgPendingDays = siteData.pendingDays.length > 0 
            ? Math.round(siteData.pendingDays.reduce((a, b) => a + b, 0) / siteData.pendingDays.length)
            : 0;
          
          const siteMaxPendingDays = siteData.pendingDays.length > 0 
            ? Math.max(...siteData.pendingDays)
            : 0;
          
          // Get latest comment for this part at this site
          let latestComment = null;
          try {
            latestComment = await PartComment.getLatestPartSiteComment(
              part.partName,
              part.partNumber,
              siteData.siteId
            );
          } catch (error) {
            console.warn(`Failed to fetch latest comment for ${part.partName} at ${siteData.siteId}:`, error.message);
          }
          
          return {
            siteId: siteData.siteId,
            siteName: siteData.siteName,
            totalCount: siteData.totalCount,
            pendingCount: siteData.pendingCount,
            completedCount: siteData.completedCount,
            completionRate: siteData.totalCount > 0 ? Math.round((siteData.completedCount / siteData.totalCount) * 100) : 0,
            avgPendingDays: siteAvgPendingDays,
            maxPendingDays: siteMaxPendingDays,
            totalCost: siteData.totalCost,
            avgCost: siteData.totalCount > 0 ? Math.round(siteData.totalCost / siteData.totalCount) : 0,
            lastStatus: siteData.lastStatus,
            lastRmaDate: siteData.lastRmaDate,
            statusBreakdown: siteData.statusBreakdown,
            latestComment: latestComment ? {
              id: latestComment._id,
              comment: latestComment.comment,
              author: latestComment.author.name,
              role: latestComment.author.role,
              timestamp: latestComment.createdAt,
              timeAgo: latestComment.timeAgo,
              commentType: latestComment.commentType,
              priority: latestComment.priority,
              isInternal: latestComment.isInternal
            } : null
          };
        }));
        
        // Sort sites by pending count (highest first) and filter to show only sites with pending cases
        const activeSiteBreakdown = siteBreakdown
          .filter(site => site.pendingCount > 0) // Only show sites with pending cases
          .sort((a, b) => b.pendingCount - a.pendingCount);
        
        return {
          partName: part.partName,
          partNumber: part.partNumber,
          totalCount: part.totalCount,
          pendingCount: part.pendingCount,
          completedCount: part.completedCount,
          completionRate: part.totalCount > 0 ? Math.round((part.completedCount / part.totalCount) * 100) : 0,
          avgPendingDays,
          maxPendingDays,
          avgResolutionDays,
          totalCost: part.totalCost,
          avgCost: part.totalCount > 0 ? Math.round(part.totalCost / part.totalCount) : 0,
          lastStatus: part.lastStatus,
          lastUpdateDate: part.lastUpdateDate,
          statusBreakdown: part.statusBreakdown,
          affectedSites: part.sites.size,
          sites: Array.from(part.sites).slice(0, 5), // Show first 5 sites
          siteBreakdown: activeSiteBreakdown, // Only show sites with pending cases
          activeSitesCount: activeSiteBreakdown.length, // Count of sites with pending cases
          priority: this.calculatePartPriority(part)
        };
      }));
      
      // Sort by priority (most critical first)
      partAnalytics.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.pendingCount - a.pendingCount;
      });
      
      // Calculate summary statistics
      const summary = {
        totalParts: partAnalytics.length,
        partsWithPending: partAnalytics.filter(p => p.pendingCount > 0).length,
        avgPendingDays: partAnalytics.length > 0 
          ? Math.round(partAnalytics.reduce((sum, p) => sum + p.avgPendingDays, 0) / partAnalytics.length)
          : 0,
        criticalParts: partAnalytics.filter(p => p.priority >= 8).length,
        totalPendingCost: partAnalytics.reduce((sum, p) => sum + (p.avgCost * p.pendingCount), 0)
      };
      
      return {
        summary,
        parts: partAnalytics,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error getting part analytics:', error);
      return {
        summary: {
          totalParts: 0,
          partsWithPending: 0,
          avgPendingDays: 0,
          criticalParts: 0,
          totalPendingCost: 0
        },
        parts: [],
        lastUpdated: new Date()
      };
    }
  }
  
  // Calculate part priority based on various factors
  calculatePartPriority(part) {
    let priority = 0;
    
    // High pending count increases priority
    if (part.pendingCount > 10) priority += 3;
    else if (part.pendingCount > 5) priority += 2;
    else if (part.pendingCount > 0) priority += 1;
    
    // High pending days increases priority
    const maxPendingDays = part.pendingDays.length > 0 ? Math.max(...part.pendingDays) : 0;
    if (maxPendingDays > 30) priority += 3;
    else if (maxPendingDays > 14) priority += 2;
    else if (maxPendingDays > 7) priority += 1;
    
    // High cost increases priority
    if (part.totalCost > 100000) priority += 2;
    else if (part.totalCost > 50000) priority += 1;
    
    // Multiple sites affected increases priority
    if (part.sites.size > 5) priority += 2;
    else if (part.sites.size > 2) priority += 1;
    
    // Low completion rate increases priority
    const completionRate = part.totalCount > 0 ? (part.completedCount / part.totalCount) : 0;
    if (completionRate < 0.3) priority += 2;
    else if (completionRate < 0.6) priority += 1;
    
    return Math.min(priority, 10); // Cap at 10
  }

  // Clear cache
  clearCache() {
    this.metricsCache.clear();
    console.log('🧹 Analytics cache cleared');
  }
  
  // Force refresh metrics (bypass cache)
  async getDashboardMetricsForceRefresh() {
    this.clearCache();
    return await this.getDashboardMetrics();
  }
}

module.exports = new AnalyticsService();

