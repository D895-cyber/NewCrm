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
  Map,
  PieChart,
  BarChart,
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { apiClient } from '../../utils/api/client';
// Removed react-router-dom import - using hash-based navigation

interface SiteAnalytics {
  overview: {
    totalSites: number;
    activeSites: number;
    totalProjectors: number;
    activeProjectors: number;
    siteUtilization: number;
    projectorUtilization: number;
  };
  distribution: {
    byRegion: Array<{ _id: string; count: number }>;
    byType: Array<{ _id: string; count: number }>;
    projectorsByStatus: Array<{ _id: string; count: number }>;
  };
  regionDetails: Array<{
    _id: string;
    sites: Array<{
      siteId: string;
      name: string;
      siteCode: string;
      state: string;
      siteType: string;
      status: string;
      totalProjectors: number;
      activeProjectors: number;
    }>;
    totalSites: number;
    totalProjectors: number;
    activeProjectors: number;
  }>;
  siteDetails: Array<{
    _id: string;
    name: string;
    siteCode: string;
    region: string;
    state: string;
    siteType: string;
    status: string;
    totalProjectors: number;
    activeProjectors: number;
    projectorsByStatus: Record<string, number>;
    auditoriums: Array<any>;
    utilizationRate: number;
  }>;
  lastUpdated: string;
}

interface RegionAnalytics {
  regions: Array<{
    _id: string;
    totalSites: number;
    activeSites: number;
    totalProjectors: number;
    activeProjectors: number;
    siteUtilization: number;
    projectorUtilization: number;
    projectorStatusBreakdown: Record<string, number>;
    projectorConditionBreakdown: Record<string, number>;
    sites: Array<{
      siteId: string;
      siteName: string;
      siteCode: string;
      state: string;
      siteType: string;
      status: string;
      totalAuditoriums: number;
    }>;
  }>;
  summary: {
    totalRegions: number;
    totalSites: number;
    totalProjectors: number;
    avgSiteUtilization: number;
    avgProjectorUtilization: number;
  };
  lastUpdated: string;
}

interface ProjectorAnalytics {
  overview: {
    totalProjectors: number;
    activeProjectors: number;
    utilizationRate: number;
  };
  breakdown: {
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    byBrand: Record<string, number>;
    byModel: Record<string, number>;
  };
  details: Array<{
    status: string;
    condition: string;
    brand: string;
    model: string;
    siteName: string;
    siteRegion: string;
    siteState: string;
    auditoriumId: string;
    auditoriumName: string;
    installDate: string;
    warrantyEnd: string;
    hoursUsed: number;
  }>;
  lastUpdated: string;
}

export function SiteAnalyticsDashboard() {
  const [siteAnalytics, setSiteAnalytics] = useState<SiteAnalytics | null>(null);
  const [regionAnalytics, setRegionAnalytics] = useState<RegionAnalytics | null>(null);
  const [projectorAnalytics, setProjectorAnalytics] = useState<ProjectorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  // Using hash-based navigation instead of react-router-dom

  useEffect(() => {
    loadAnalyticsData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [siteResponse, regionResponse, projectorResponse] = await Promise.all([
        apiClient.get('/analytics/sites'),
        apiClient.get('/analytics/sites/regions'),
        apiClient.get('/analytics/sites/projectors')
      ]);

      setSiteAnalytics(siteResponse.data);
      setRegionAnalytics(regionResponse.data);
      setProjectorAnalytics(projectorResponse.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Under Service':
        return 'text-orange-600 bg-orange-100';
      case 'Inactive':
        return 'text-gray-600 bg-gray-100';
      case 'Needs Repair':
        return 'text-red-600 bg-red-100';
      case 'In Storage':
        return 'text-blue-600 bg-blue-100';
      case 'Disposed':
        return 'text-gray-500 bg-gray-50';
      case 'Maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'Testing':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return 'text-green-600 bg-green-100';
      case 'Good':
        return 'text-blue-600 bg-blue-100';
      case 'Fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'Poor':
        return 'text-orange-600 bg-orange-100';
      case 'Needs Repair':
        return 'text-red-600 bg-red-100';
      case 'Critical':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRegionColor = (region: string) => {
    const colors = [
      'text-blue-600 bg-blue-100',
      'text-green-600 bg-green-100',
      'text-purple-600 bg-purple-100',
      'text-orange-600 bg-orange-100',
      'text-red-600 bg-red-100',
      'text-yellow-600 bg-yellow-100',
      'text-indigo-600 bg-indigo-100',
      'text-pink-600 bg-pink-100',
      'text-teal-600 bg-teal-100'
    ];
    const index = region.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading && !siteAnalytics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading site analytics...</p>
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
            <Button onClick={loadAnalyticsData} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredRegionData = selectedRegion === 'all' 
    ? regionAnalytics?.regions || []
    : regionAnalytics?.regions.filter(region => region._id === selectedRegion) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive site and projector analytics by region</p>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh ? lastRefresh.toLocaleString() : 'Never'}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
              <Button
                onClick={() => window.location.hash = '#analytics'}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
              >
                <BarChart3 className="w-4 h-4" />
                <span>RMA Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
          <Button
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-2xl font-bold text-gray-900">{siteAnalytics?.overview.totalSites || 0}</p>
                <p className="text-xs text-gray-500">
                  {siteAnalytics?.overview.activeSites || 0} active
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projectors</p>
                <p className="text-2xl font-bold text-gray-900">{siteAnalytics?.overview.totalProjectors || 0}</p>
                <p className="text-xs text-gray-500">
                  {siteAnalytics?.overview.activeProjectors || 0} active
                </p>
              </div>
              <Monitor className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Site Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{siteAnalytics?.overview.siteUtilization || 0}%</p>
                <p className="text-xs text-gray-500">Active sites</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projector Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{siteAnalytics?.overview.projectorUtilization || 0}%</p>
                <p className="text-xs text-gray-500">Active projectors</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regions">Region Analysis</TabsTrigger>
          <TabsTrigger value="projectors">Projector Details</TabsTrigger>
          <TabsTrigger value="sites">Site Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sites by Region */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="w-5 h-5 mr-2 text-blue-600" />
                  Sites by Region
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {siteAnalytics?.distribution.byRegion.map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{region._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(region.count / (siteAnalytics?.overview.totalSites || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{region.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sites by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-green-600" />
                  Sites by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {siteAnalytics?.distribution.byType.map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{type._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(type.count / (siteAnalytics?.overview.totalSites || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{type.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projector Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-purple-600" />
                Projector Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {siteAnalytics?.distribution.projectorsByStatus.map((status, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                    <div className="text-sm text-gray-600">{status._id}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          {/* Region Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Region Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedRegion === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedRegion('all')}
                  size="sm"
                >
                  All Regions ({regionAnalytics?.summary.totalRegions || 0})
                </Button>
                {regionAnalytics?.regions.map((region, index) => (
                  <Button
                    key={index}
                    variant={selectedRegion === region._id ? 'default' : 'outline'}
                    onClick={() => setSelectedRegion(region._id)}
                    size="sm"
                  >
                    {region._id} ({region.totalSites})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Region Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{regionAnalytics?.summary.totalRegions || 0}</p>
                  <p className="text-sm text-gray-600">Total Regions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{regionAnalytics?.summary.totalSites || 0}</p>
                  <p className="text-sm text-gray-600">Total Sites</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{regionAnalytics?.summary.totalProjectors || 0}</p>
                  <p className="text-sm text-gray-600">Total Projectors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{regionAnalytics?.summary.avgSiteUtilization || 0}%</p>
                  <p className="text-sm text-gray-600">Avg Site Utilization</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Region Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRegionData.map((region, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      {region._id}
                    </span>
                    <Badge className={getRegionColor(region._id)}>
                      {region.totalSites} sites
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{region.totalSites}</div>
                        <div className="text-sm text-gray-600">Total Sites</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{region.activeSites}</div>
                        <div className="text-sm text-gray-600">Active Sites</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{region.totalProjectors}</div>
                        <div className="text-sm text-gray-600">Total Projectors</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{region.activeProjectors}</div>
                        <div className="text-sm text-gray-600">Active Projectors</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Site Utilization</span>
                        <span className="font-medium">{typeof region.siteUtilization === 'number' ? region.siteUtilization.toFixed(1) : region.siteUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${typeof region.siteUtilization === 'number' ? region.siteUtilization : parseFloat(region.siteUtilization)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Projector Utilization</span>
                        <span className="font-medium">{typeof region.projectorUtilization === 'number' ? region.projectorUtilization.toFixed(1) : region.projectorUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${typeof region.projectorUtilization === 'number' ? region.projectorUtilization : parseFloat(region.projectorUtilization)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Projector Status Breakdown */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Projector Status</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(region.projectorStatusBreakdown).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-xs">
                            <span className={getStatusColor(status)}>{status}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sites in Region */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sites in Region</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {region.sites.map((site, siteIndex) => (
                          <div key={siteIndex} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                            <span className="font-medium">{site.siteName}</span>
                            <div className="flex space-x-2">
                              <Badge variant="outline" className="text-xs">{site.siteType}</Badge>
                              <span className={getStatusColor(site.status)}>{site.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projectors" className="space-y-6">
          {/* Projector Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{projectorAnalytics?.overview.totalProjectors || 0}</p>
                  <p className="text-sm text-gray-600">Total Projectors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{projectorAnalytics?.overview.activeProjectors || 0}</p>
                  <p className="text-sm text-gray-600">Active Projectors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{projectorAnalytics?.overview.utilizationRate || 0}%</p>
                  <p className="text-sm text-gray-600">Utilization Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projector Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Projector Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectorAnalytics?.breakdown.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / (projectorAnalytics?.overview.totalProjectors || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projector Condition Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Projector Condition Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectorAnalytics?.breakdown.byCondition || {}).map(([condition, count]) => (
                    <div key={condition} className="flex items-center justify-between">
                      <span className={`font-medium ${getConditionColor(condition)}`}>{condition}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / (projectorAnalytics?.overview.totalProjectors || 1)) * 100}%` }}
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

          {/* Brand and Model Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projector Brands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectorAnalytics?.breakdown.byBrand || {}).map(([brand, count]) => (
                    <div key={brand} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{brand}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(count / (projectorAnalytics?.overview.totalProjectors || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projector Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectorAnalytics?.breakdown.byModel || {}).map(([model, count]) => (
                    <div key={model} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{model}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${(count / (projectorAnalytics?.overview.totalProjectors || 1)) * 100}%` }}
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

          {/* Projector Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Projector Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Brand</th>
                      <th className="text-left py-2">Model</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Condition</th>
                      <th className="text-left py-2">Site</th>
                      <th className="text-left py-2">Region</th>
                      <th className="text-left py-2">Auditorium</th>
                      <th className="text-left py-2">Hours Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectorAnalytics?.details.slice(0, 20).map((projector, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{projector.brand}</td>
                        <td className="py-2">{projector.model}</td>
                        <td className="py-2">
                          <Badge className={getStatusColor(projector.status)}>
                            {projector.status}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge className={getConditionColor(projector.condition)}>
                            {projector.condition}
                          </Badge>
                        </td>
                        <td className="py-2">{projector.siteName}</td>
                        <td className="py-2">{projector.siteRegion}</td>
                        <td className="py-2">{projector.auditoriumName}</td>
                        <td className="py-2">{projector.hoursUsed || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites" className="space-y-6">
          {/* Site Details */}
          <div className="grid grid-cols-1 gap-6">
            {siteAnalytics?.siteDetails.map((site, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      {site.name}
                    </span>
                    <div className="flex space-x-2">
                      <Badge className={getRegionColor(site.region)}>
                        {site.region}
                      </Badge>
                      <Badge variant="outline">{site.siteType}</Badge>
                      <Badge className={getStatusColor(site.status)}>
                        {site.status}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{site.totalProjectors}</div>
                        <div className="text-sm text-gray-600">Total Projectors</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{site.activeProjectors}</div>
                        <div className="text-sm text-gray-600">Active Projectors</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{site.auditoriums.length}</div>
                        <div className="text-sm text-gray-600">Auditoriums</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{(site.utilizationRate || 0).toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Utilization</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Projector Utilization</span>
                        <span className="font-medium">{(site.utilizationRate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${site.utilizationRate || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Projector Status Breakdown for Site */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Projector Status</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(site.projectorsByStatus).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-xs">
                            <span className={getStatusColor(status)}>{status}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Auditoriums */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Auditoriums</h4>
                      <div className="space-y-1">
                        {site.auditoriums.map((auditorium, audIndex) => (
                          <div key={audIndex} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                            <span className="font-medium">{auditorium.name}</span>
                            <div className="flex space-x-2">
                              <span>Capacity: {auditorium.capacity}</span>
                              <span>Screen: {auditorium.screenSize}</span>
                              <Badge className={getStatusColor(auditorium.status)}>
                                {auditorium.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
