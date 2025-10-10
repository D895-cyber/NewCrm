import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  MapPin, 
  DollarSign,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Bell,
  MessageSquare,
  Settings,
  Building2,
  Monitor,
  ArrowRight,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { apiClient } from '../../utils/api/client';
import { PartAnalytics } from '../PartAnalytics';
// Removed react-router-dom import - using hash-based navigation

interface DashboardMetrics {
  overview: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  trends: Array<{
    month: string;
    total: number;
    completed: number;
    highPriority: number;
    totalCost: number;
    completionRate: number;
  }>;
  performance: {
    sites: Array<{
      _id: string;
      totalRMAs: number;
      completedRMAs: number;
      completionRate: number;
      avgResolutionTime: number;
      totalCost: number;
      highPriorityCount: number;
    }>;
    technicians: Array<{
      _id: string;
      totalRMAs: number;
      completedRMAs: number;
      completionRate: number;
      avgResolutionTime: number;
      totalCost: number;
      highPriorityCount: number;
    }>;
  };
  financial: {
    overall: {
      totalCost: number;
      avgCost: number;
      maxCost: number;
      minCost: number;
      totalRMAs: number;
    };
    byPriority: Array<{
      _id: string;
      totalCost: number;
      avgCost: number;
      count: number;
    }>;
    monthly: Array<{
      _id: { year: number; month: number };
      totalCost: number;
      count: number;
    }>;
  };
  parts: {
    summary: {
      totalParts: number;
      partsWithPending: number;
      avgPendingDays: number;
      criticalParts: number;
      totalPendingCost: number;
    };
    parts: Array<{
      partName: string;
      partNumber: string;
      totalCount: number;
      pendingCount: number;
      completedCount: number;
      completionRate: number;
      avgPendingDays: number;
      maxPendingDays: number;
      avgResolutionDays: number;
      totalCost: number;
      avgCost: number;
      lastStatus: string;
      lastUpdateDate: string;
      statusBreakdown: Record<string, number>;
      affectedSites: number;
      sites: string[];
      priority: number;
    }>;
    lastUpdated: string;
  };
  sla: {
    totalActive: number;
    breaches: number;
    avgBreachHours: number;
    maxBreachHours: number;
    breachRate: number;
    breachDetails: Array<{
      rmaNumber: string;
      siteName: string;
      priority: string;
      caseStatus: string;
      hoursElapsed: number;
      slaHours: number;
      breachHours: number;
    }>;
  };
  lastUpdated: string;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  count?: number;
  details?: any[];
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  // Using hash-based navigation instead of react-router-dom

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear cache if force refresh is requested
      if (forceRefresh) {
        try {
          await apiClient.post('/analytics/clear-cache');
          console.log('🧹 Analytics cache cleared');
        } catch (cacheError) {
          console.warn('Failed to clear cache:', cacheError);
        }
      }

      const [metricsResponse, alertsResponse] = await Promise.all([
        apiClient.get('/analytics/dashboard'),
        apiClient.get('/analytics/alerts')
      ]);

      setMetrics(metricsResponse.data);
      setAlerts(alertsResponse.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadDashboardData(true)} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RMA Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time RMA insights and performance metrics</p>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh ? lastRefresh.toLocaleString() : 'Never'}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.hash = '#site-analytics'}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Building2 className="w-4 h-4" />
            <span>Site Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => loadDashboardData(true)}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-red-600" />
            Active Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    {alert.count && (
                      <span className="text-2xl font-bold text-red-600">{alert.count}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.hash = '#site-analytics'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Site Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">Region-wise site analysis with detailed projector information</p>
                <div className="flex items-center mt-2 text-blue-600">
                  <span className="text-sm font-medium">View Site Analytics</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">RMA Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">Current RMA performance metrics and trends</p>
                <div className="flex items-center mt-2 text-blue-600">
                  <span className="text-sm font-medium">Currently Viewing</span>
                  <CheckCircle className="w-4 h-4 ml-1" />
                </div>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total RMAs</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview.total || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active RMAs</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview.active || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview.completed || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview.completionRate || 0}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            SLA Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics?.sla.totalActive || 0}</p>
              <p className="text-sm text-gray-600">Active RMAs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics?.sla.breaches || 0}</p>
              <p className="text-sm text-gray-600">SLA Breaches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics?.sla.breachRate || 0}%</p>
              <p className="text-sm text-gray-600">Breach Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{Math.round(metrics?.sla.avgBreachHours || 0)}h</p>
              <p className="text-sm text-gray-600">Avg Breach Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="parts">Parts Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics?.priorityBreakdown || {}).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className={`font-medium ${getPriorityColor(priority)}`}>{priority}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / (metrics?.overview.total || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics?.statusBreakdown || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / (metrics?.overview.total || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA Breach Details */}
          {metrics?.sla.breachDetails && metrics.sla.breachDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  SLA Breach Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">RMA Number</th>
                        <th className="text-left py-2">Site</th>
                        <th className="text-left py-2">Priority</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Hours Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.sla.breachDetails.slice(0, 10).map((breach, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-medium">{breach.rmaNumber}</td>
                          <td className="py-2">{breach.siteName}</td>
                          <td className="py-2">
                            <span className={getPriorityColor(breach.priority)}>
                              {breach.priority}
                            </span>
                          </td>
                          <td className="py-2">{breach.caseStatus}</td>
                          <td className="py-2 text-red-600 font-medium">
                            {Math.round(breach.breachHours)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Site Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Top Performing Sites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.performance.sites.slice(0, 5).map((site, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{site._id}</p>
                        <p className="text-sm text-gray-600">
                          {site.completedRMAs}/{site.totalRMAs} completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{(site.completionRate || 0).toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">{(site.avgResolutionTime || 0).toFixed(1)}d avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technician Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Top Performing Technicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.performance.technicians.slice(0, 5).map((tech, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{tech._id}</p>
                        <p className="text-sm text-gray-600">
                          {tech.completedRMAs}/{tech.totalRMAs} completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{(tech.completionRate || 0).toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">{(tech.avgResolutionTime || 0).toFixed(1)}d avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{(metrics?.financial.overall.totalCost || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{Math.round(metrics?.financial.overall.avgCost || 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Max Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{(metrics?.financial.overall.maxCost || 0).toLocaleString()}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Min Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{(metrics?.financial.overall.minCost || 0).toLocaleString()}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Distribution by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.financial.byPriority.map((priority, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`font-medium ${getPriorityColor(priority._id)}`}>
                      {priority._id}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(priority.totalCost / (metrics?.financial.overall.totalCost || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        ₹{(priority.totalCost || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          {metrics?.parts ? (
            <PartAnalytics partData={metrics.parts} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Parts Data</h3>
                <p className="text-gray-600">Please wait while we load the parts analytics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.trends.slice(-6).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{trend.month}</p>
                      <p className="text-sm text-gray-600">
                        {trend.total} total, {trend.completed} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{trend.completionRate}%</p>
                      <p className="text-sm text-gray-600">
                        ₹{(trend.totalCost || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
