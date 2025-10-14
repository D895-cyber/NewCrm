const RMA = require('../models/RMA');
const Projector = require('../models/Projector');
const CommunicationService = require('./CommunicationService');

class AdvancedTrackingService {
  constructor() {
    this.trackingIntervals = new Map();
    this.performanceMetrics = new Map();
    this.alertThresholds = {
      slaBreach: 0.1, // 10% breach rate
      responseTime: 24, // 24 hours
      completionRate: 0.8 // 80% completion rate
    };
  }

  // Start real-time tracking for an RMA
  async startRealTimeTracking(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return false;

      // Clear existing tracking if any
      this.stopRealTimeTracking(rmaId);

      // Set up tracking interval (every 5 minutes)
      const interval = setInterval(async () => {
        await this.updateRMAMetrics(rmaId);
        await this.checkAlerts(rmaId);
      }, 5 * 60 * 1000);

      this.trackingIntervals.set(rmaId, interval);
      console.log(`Real-time tracking started for RMA ${rma.rmaNumber}`);
      return true;
    } catch (error) {
      console.error('Error starting real-time tracking:', error);
      return false;
    }
  }

  // Stop real-time tracking for an RMA
  stopRealTimeTracking(rmaId) {
    const interval = this.trackingIntervals.get(rmaId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(rmaId);
      console.log(`Real-time tracking stopped for RMA ${rmaId}`);
    }
  }

  // Update RMA metrics
  async updateRMAMetrics(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return;

      const metrics = {
        rmaId,
        timestamp: new Date(),
        status: rma.caseStatus,
        priority: rma.priority,
        hoursElapsed: this.calculateHoursElapsed(rma),
        slaStatus: this.calculateSLAStatus(rma),
        progressPercentage: this.calculateProgressPercentage(rma),
        estimatedCompletion: this.estimateCompletion(rma),
        riskLevel: this.assessRiskLevel(rma)
      };

      this.performanceMetrics.set(rmaId, metrics);
      
      // Update RMA with latest metrics
      rma.trackingMetrics = metrics;
      await rma.save();

      return metrics;
    } catch (error) {
      console.error('Error updating RMA metrics:', error);
      return null;
    }
  }

  // Check for alerts and send notifications
  async checkAlerts(rmaId) {
    try {
      const metrics = this.performanceMetrics.get(rmaId);
      if (!metrics) return;

      const alerts = [];

      // SLA breach alert
      if (metrics.slaStatus === 'breached') {
        alerts.push({
          type: 'sla_breach',
          severity: 'high',
          message: `RMA ${rmaId} has breached SLA`,
          data: metrics
        });
      }

      // High risk alert
      if (metrics.riskLevel === 'high') {
        alerts.push({
          type: 'high_risk',
          severity: 'critical',
          message: `RMA ${rmaId} is at high risk`,
          data: metrics
        });
      }

      // Stagnant progress alert
      if (metrics.progressPercentage < 10 && metrics.hoursElapsed > 24) {
        alerts.push({
          type: 'stagnant_progress',
          severity: 'medium',
          message: `RMA ${rmaId} shows stagnant progress`,
          data: metrics
        });
      }

      // Send alerts
      for (const alert of alerts) {
        await this.sendAlert(rmaId, alert);
      }

      return alerts;
    } catch (error) {
      console.error('Error checking alerts:', error);
      return [];
    }
  }

  // Send alert notification
  async sendAlert(rmaId, alert) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return;

      // Send email notification
      await CommunicationService.sendSLABreachNotification(
        rmaId,
        this.getSLAHours(rma.priority),
        alert.data.hoursElapsed
      );

      // Log alert
      console.log(`Alert sent for RMA ${rma.rmaNumber}: ${alert.message}`);
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }

  // Calculate hours elapsed since RMA creation
  calculateHoursElapsed(rma) {
    const now = new Date();
    const created = new Date(rma.ascompRaisedDate);
    return (now - created) / (1000 * 60 * 60);
  }

  // Calculate SLA status
  calculateSLAStatus(rma) {
    const slaHours = this.getSLAHours(rma.priority);
    const hoursElapsed = this.calculateHoursElapsed(rma);
    
    if (hoursElapsed > slaHours) {
      return 'breached';
    } else if (hoursElapsed > slaHours * 0.8) {
      return 'at_risk';
    } else {
      return 'on_track';
    }
  }

  // Get SLA hours based on priority
  getSLAHours(priority) {
    const slaRules = {
      'Critical': 4,
      'High': 24,
      'Medium': 72,
      'Low': 168
    };
    return slaRules[priority] || 72;
  }

  // Calculate progress percentage based on status
  calculateProgressPercentage(rma) {
    const statusProgress = {
      'Under Review': 10,
      'Sent to CDS': 20,
      'CDS Approved': 30,
      'Replacement Shipped': 50,
      'Replacement Received': 70,
      'Installation Complete': 85,
      'Faulty Part Returned': 90,
      'CDS Confirmed Return': 95,
      'Completed': 100,
      'Rejected': 0
    };
    return statusProgress[rma.caseStatus] || 0;
  }

  // Estimate completion time
  estimateCompletion(rma) {
    const progressPercentage = this.calculateProgressPercentage(rma);
    if (progressPercentage >= 100) return null;

    const hoursElapsed = this.calculateHoursElapsed(rma);
    const remainingProgress = 100 - progressPercentage;
    const avgProgressPerHour = progressPercentage / Math.max(hoursElapsed, 1);
    
    if (avgProgressPerHour <= 0) return null;
    
    const estimatedHoursRemaining = remainingProgress / avgProgressPerHour;
    return new Date(Date.now() + estimatedHoursRemaining * 60 * 60 * 1000);
  }

  // Assess risk level
  assessRiskLevel(rma) {
    const slaStatus = this.calculateSLAStatus(rma);
    const progressPercentage = this.calculateProgressPercentage(rma);
    const hoursElapsed = this.calculateHoursElapsed(rma);

    if (slaStatus === 'breached' || (progressPercentage < 20 && hoursElapsed > 48)) {
      return 'high';
    } else if (slaStatus === 'at_risk' || (progressPercentage < 50 && hoursElapsed > 24)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Get real-time dashboard data
  async getRealTimeDashboard() {
    try {
      const activeRMAs = await RMA.find({
        caseStatus: { $nin: ['Completed', 'Rejected'] }
      });

      const dashboard = {
        totalActive: activeRMAs.length,
        slaBreaches: 0,
        highRisk: 0,
        avgProgress: 0,
        estimatedCompletions: [],
        alerts: [],
        performance: {
          sites: {},
          technicians: {},
          priorities: {}
        }
      };

      let totalProgress = 0;

      for (const rma of activeRMAs) {
        const metrics = await this.updateRMAMetrics(rma._id);
        if (!metrics) continue;

        totalProgress += metrics.progressPercentage;

        // Count SLA breaches
        if (metrics.slaStatus === 'breached') {
          dashboard.slaBreaches++;
        }

        // Count high risk
        if (metrics.riskLevel === 'high') {
          dashboard.highRisk++;
        }

        // Add to estimated completions
        if (metrics.estimatedCompletion) {
          dashboard.estimatedCompletions.push({
            rmaId: rma._id,
            rmaNumber: rma.rmaNumber,
            estimatedCompletion: metrics.estimatedCompletion,
            progress: metrics.progressPercentage
          });
        }

        // Update performance metrics
        this.updatePerformanceMetrics(dashboard.performance, rma, metrics);
      }

      dashboard.avgProgress = activeRMAs.length > 0 ? totalProgress / activeRMAs.length : 0;
      dashboard.estimatedCompletions.sort((a, b) => a.estimatedCompletion - b.estimatedCompletion);

      return dashboard;
    } catch (error) {
      console.error('Error getting real-time dashboard:', error);
      return this.getDefaultDashboard();
    }
  }

  // Update performance metrics
  updatePerformanceMetrics(performance, rma, metrics) {
    // Site performance
    if (!performance.sites[rma.siteName]) {
      performance.sites[rma.siteName] = { total: 0, completed: 0, avgProgress: 0 };
    }
    performance.sites[rma.siteName].total++;
    if (metrics.progressPercentage >= 100) {
      performance.sites[rma.siteName].completed++;
    }

    // Technician performance
    if (rma.createdBy) {
      if (!performance.technicians[rma.createdBy]) {
        performance.technicians[rma.createdBy] = { total: 0, completed: 0, avgProgress: 0 };
      }
      performance.technicians[rma.createdBy].total++;
      if (metrics.progressPercentage >= 100) {
        performance.technicians[rma.createdBy].completed++;
      }
    }

    // Priority performance
    if (!performance.priorities[rma.priority]) {
      performance.priorities[rma.priority] = { total: 0, completed: 0, avgProgress: 0 };
    }
    performance.priorities[rma.priority].total++;
    if (metrics.progressPercentage >= 100) {
      performance.priorities[rma.priority].completed++;
    }
  }

  // Get predictive analytics
  async getPredictiveAnalytics() {
    try {
      const rmas = await RMA.find({
        ascompRaisedDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      });

      const analytics = {
        failurePatterns: await this.analyzeFailurePatterns(rmas),
        completionPredictions: await this.predictCompletions(rmas),
        resourceRequirements: await this.predictResourceRequirements(rmas),
        costProjections: await this.projectCosts(rmas),
        seasonalTrends: await this.analyzeSeasonalTrends(rmas)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting predictive analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Analyze failure patterns
  async analyzeFailurePatterns(rmas) {
    const patterns = {
      byProduct: {},
      bySite: {},
      byTechnician: {},
      byTimeOfDay: {},
      byDayOfWeek: {}
    };

    for (const rma of rmas) {
      // Product patterns
      if (!patterns.byProduct[rma.productName]) {
        patterns.byProduct[rma.productName] = 0;
      }
      patterns.byProduct[rma.productName]++;

      // Site patterns
      if (!patterns.bySite[rma.siteName]) {
        patterns.bySite[rma.siteName] = 0;
      }
      patterns.bySite[rma.siteName]++;

      // Technician patterns
      if (rma.createdBy) {
        if (!patterns.byTechnician[rma.createdBy]) {
          patterns.byTechnician[rma.createdBy] = 0;
        }
        patterns.byTechnician[rma.createdBy]++;
      }

      // Time patterns
      const date = new Date(rma.ascompRaisedDate);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (!patterns.byTimeOfDay[hour]) {
        patterns.byTimeOfDay[hour] = 0;
      }
      patterns.byTimeOfDay[hour]++;

      if (!patterns.byDayOfWeek[dayOfWeek]) {
        patterns.byDayOfWeek[dayOfWeek] = 0;
      }
      patterns.byDayOfWeek[dayOfWeek]++;
    }

    return patterns;
  }

  // Predict completions
  async predictCompletions(rmas) {
    const activeRMAs = rmas.filter(rma => 
      !['Completed', 'Rejected'].includes(rma.caseStatus)
    );

    const predictions = [];

    for (const rma of activeRMAs) {
      const metrics = await this.updateRMAMetrics(rma._id);
      if (metrics && metrics.estimatedCompletion) {
        predictions.push({
          rmaId: rma._id,
          rmaNumber: rma.rmaNumber,
          estimatedCompletion: metrics.estimatedCompletion,
          confidence: this.calculateConfidence(rma, metrics),
          riskFactors: this.identifyRiskFactors(rma, metrics)
        });
      }
    }

    return predictions.sort((a, b) => a.estimatedCompletion - b.estimatedCompletion);
  }

  // Calculate confidence level
  calculateConfidence(rma, metrics) {
    let confidence = 0.5; // Base confidence

    // Adjust based on progress
    if (metrics.progressPercentage > 50) confidence += 0.3;
    if (metrics.progressPercentage > 80) confidence += 0.2;

    // Adjust based on SLA status
    if (metrics.slaStatus === 'on_track') confidence += 0.2;
    if (metrics.slaStatus === 'at_risk') confidence -= 0.1;
    if (metrics.slaStatus === 'breached') confidence -= 0.3;

    // Adjust based on priority
    if (rma.priority === 'High' || rma.priority === 'Critical') confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  // Identify risk factors
  identifyRiskFactors(rma, metrics) {
    const factors = [];

    if (metrics.slaStatus === 'breached') {
      factors.push('SLA Breached');
    }
    if (metrics.riskLevel === 'high') {
      factors.push('High Risk');
    }
    if (metrics.progressPercentage < 20 && metrics.hoursElapsed > 24) {
      factors.push('Slow Progress');
    }
    if (rma.priority === 'Critical') {
      factors.push('Critical Priority');
    }

    return factors;
  }

  // Predict resource requirements
  async predictResourceRequirements(rmas) {
    const activeRMAs = rmas.filter(rma => 
      !['Completed', 'Rejected'].includes(rma.caseStatus)
    );

    const requirements = {
      technicians: {},
      sites: {},
      parts: {},
      estimatedHours: 0
    };

    for (const rma of activeRMAs) {
      // Technician requirements
      if (rma.createdBy) {
        if (!requirements.technicians[rma.createdBy]) {
          requirements.technicians[rma.createdBy] = 0;
        }
        requirements.technicians[rma.createdBy]++;
      }

      // Site requirements
      if (!requirements.sites[rma.siteName]) {
        requirements.sites[rma.siteName] = 0;
      }
      requirements.sites[rma.siteName]++;

      // Parts requirements
      if (rma.defectivePartName) {
        if (!requirements.parts[rma.defectivePartName]) {
          requirements.parts[rma.defectivePartName] = 0;
        }
        requirements.parts[rma.defectivePartName]++;
      }

      // Estimate hours based on priority
      const hoursByPriority = {
        'Critical': 8,
        'High': 4,
        'Medium': 2,
        'Low': 1
      };
      requirements.estimatedHours += hoursByPriority[rma.priority] || 2;
    }

    return requirements;
  }

  // Project costs
  async projectCosts(rmas) {
    const activeRMAs = rmas.filter(rma => 
      !['Completed', 'Rejected'].includes(rma.caseStatus)
    );

    const projections = {
      totalEstimatedCost: 0,
      avgCostPerRMA: 0,
      costByPriority: {},
      costBySite: {},
      monthlyProjections: []
    };

    for (const rma of activeRMAs) {
      const cost = rma.estimatedCost || 0;
      projections.totalEstimatedCost += cost;

      // Cost by priority
      if (!projections.costByPriority[rma.priority]) {
        projections.costByPriority[rma.priority] = 0;
      }
      projections.costByPriority[rma.priority] += cost;

      // Cost by site
      if (!projections.costBySite[rma.siteName]) {
        projections.costBySite[rma.siteName] = 0;
      }
      projections.costBySite[rma.siteName] += cost;
    }

    projections.avgCostPerRMA = activeRMAs.length > 0 ? 
      projections.totalEstimatedCost / activeRMAs.length : 0;

    return projections;
  }

  // Analyze seasonal trends
  async analyzeSeasonalTrends(rmas) {
    const trends = {
      byMonth: {},
      byQuarter: {},
      peakHours: [],
      peakDays: []
    };

    for (const rma of rmas) {
      const date = new Date(rma.ascompRaisedDate);
      const month = date.getMonth();
      const quarter = Math.floor(month / 3);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      // Monthly trends
      if (!trends.byMonth[month]) {
        trends.byMonth[month] = 0;
      }
      trends.byMonth[month]++;

      // Quarterly trends
      if (!trends.byQuarter[quarter]) {
        trends.byQuarter[quarter] = 0;
      }
      trends.byQuarter[quarter]++;

      // Peak hours
      if (!trends.peakHours[hour]) {
        trends.peakHours[hour] = 0;
      }
      trends.peakHours[hour]++;

      // Peak days
      if (!trends.peakDays[dayOfWeek]) {
        trends.peakDays[dayOfWeek] = 0;
      }
      trends.peakDays[dayOfWeek]++;
    }

    return trends;
  }

  // Get default dashboard
  getDefaultDashboard() {
    return {
      totalActive: 0,
      slaBreaches: 0,
      highRisk: 0,
      avgProgress: 0,
      estimatedCompletions: [],
      alerts: [],
      performance: {
        sites: {},
        technicians: {},
        priorities: {}
      }
    };
  }

  // Get default analytics
  getDefaultAnalytics() {
    return {
      failurePatterns: {},
      completionPredictions: [],
      resourceRequirements: {},
      costProjections: {},
      seasonalTrends: {}
    };
  }

  // Stop all tracking
  stopAllTracking() {
    for (const [rmaId, interval] of this.trackingIntervals) {
      clearInterval(interval);
    }
    this.trackingIntervals.clear();
    console.log('All real-time tracking stopped');
  }
}

module.exports = new AdvancedTrackingService();



















