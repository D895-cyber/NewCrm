const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/AnalyticsService');
const WorkflowService = require('../services/WorkflowService');
const CommunicationService = require('../services/CommunicationService');
const AdvancedTrackingService = require('../services/AdvancedTrackingService');

// Get comprehensive dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard metrics',
      error: error.message
    });
  }
});

// Clear analytics cache
router.post('/clear-cache', async (req, res) => {
  try {
    AnalyticsService.clearCache();
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear analytics cache',
      error: error.message
    });
  }
});

// Get real-time alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await AnalyticsService.getRealTimeAlerts();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message
    });
  }
});

// Get real-time dashboard
router.get('/realtime', async (req, res) => {
  try {
    const dashboard = await AdvancedTrackingService.getRealTimeDashboard();
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error getting real-time dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time dashboard',
      error: error.message
    });
  }
});

// Get predictive analytics
router.get('/predictive', async (req, res) => {
  try {
    const analytics = await AdvancedTrackingService.getPredictiveAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting predictive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get predictive analytics',
      error: error.message
    });
  }
});

// Get comprehensive site analytics
router.get('/sites', async (req, res) => {
  try {
    const siteAnalytics = await AnalyticsService.getSiteAnalytics();
    res.json({
      success: true,
      data: siteAnalytics
    });
  } catch (error) {
    console.error('Error getting site analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get site analytics',
      error: error.message
    });
  }
});

// Get site performance
router.get('/sites/performance', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics.performance.sites
    });
  } catch (error) {
    console.error('Error getting site performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get site performance',
      error: error.message
    });
  }
});

// Get region-wise site analysis
router.get('/sites/regions', async (req, res) => {
  try {
    const regionAnalytics = await AnalyticsService.getRegionAnalytics();
    res.json({
      success: true,
      data: regionAnalytics
    });
  } catch (error) {
    console.error('Error getting region analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get region analytics',
      error: error.message
    });
  }
});

// Get detailed projector analytics
router.get('/sites/projectors', async (req, res) => {
  try {
    const projectorAnalytics = await AnalyticsService.getProjectorAnalytics();
    res.json({
      success: true,
      data: projectorAnalytics
    });
  } catch (error) {
    console.error('Error getting projector analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projector analytics',
      error: error.message
    });
  }
});

// Get technician performance
router.get('/technicians/performance', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics.performance.technicians
    });
  } catch (error) {
    console.error('Error getting technician performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get technician performance',
      error: error.message
    });
  }
});

// Get cost analysis
router.get('/costs', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics.financial
    });
  } catch (error) {
    console.error('Error getting cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cost analysis',
      error: error.message
    });
  }
});

// Get SLA metrics
router.get('/sla', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics.sla
    });
  } catch (error) {
    console.error('Error getting SLA metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SLA metrics',
      error: error.message
    });
  }
});

// Get monthly trends
router.get('/trends', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics.trends
    });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trends',
      error: error.message
    });
  }
});

// Clear analytics cache
router.post('/cache/clear', async (req, res) => {
  try {
    AnalyticsService.clearCache();
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

module.exports = router;