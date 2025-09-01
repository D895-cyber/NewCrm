import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  MapPin, 
  Monitor, 
  Package, 
  RotateCcw, 
  Wrench,
  Filter,
  Download,
  Search,
  Globe,
  Building,
  Hash,
  AlertTriangle,
  Shield,
  CheckCircle,
  Info,
  RefreshCw
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Progress } from "../ui/progress";
import { convertToCSV, downloadCSV } from "../../utils/export";
import { LoadingSpinner } from "../ui/loading-spinner";
import { apiClient } from "../../utils/api/client";

interface SiteAnalysis {
  site: {
    _id: string;
    name: string;
    siteCode: string;
    region: string;
    state: string;
    address: any;
    siteType: string;
    status: string;
    totalAuditoriums: number;
  };
  analysis: {
    projectors: {
      total: number;
      active: number;
      underService: number;
      inactive: number;
      needsRepair: number;
      byBrand: Record<string, number>;
      byModel: Record<string, number>;
      byCondition: Record<string, number>;
    };
    rma: {
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
      byProduct: Record<string, number>;
      avgResolutionTime: number;
      totalCost: number;
    };
    spareParts: {
      total: number;
      byCategory: Record<string, number>;
      byStatus: Record<string, number>;
      byBrand: Record<string, number>;
      totalValue: number;
      lowStockCount: number;
    };
    services: {
      total: number;
      byType: Record<string, number>;
      avgSatisfaction: number;
      totalIssues: number;
    };
  };
}

interface RegionalAnalysis {
  _id: string;
  siteCount: number;
  states: string[];
  siteTypes: string[];
  totalProjectors: number;
  activeProjectors: number;
}

interface StateAnalysis {
  _id: string;
  region: string;
  siteCount: number;
  siteCodes: string[];
  siteTypes: string[];
  totalProjectors: number;
  activeProjectors: number;
}

interface DashboardStats {
  sites: {
    totalSites: number;
    byRegion: string[];
    byState: string[];
    byType: string[];
  };
  projectors: {
    totalProjectors: number;
    activeProjectors: number;
    underService: number;
    needsRepair: number;
  };
  rma: {
    totalRMAs: number;
    underReview: number;
    completed: number;
    totalCost: number;
  };
  spareParts: {
    totalParts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
}

export function AnalyticsPage() {
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis[]>([]);
  const [regionalAnalysis, setRegionalAnalysis] = useState<RegionalAnalysis[]>([]);
  const [stateAnalysis, setStateAnalysis] = useState<StateAnalysis[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [siteCodeFilter, setSiteCodeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'regions' | 'states'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedRegion, selectedState, siteCodeFilter]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);
      
      const [sitesResponse, regionsResponse, statesResponse, statsResponse] = await Promise.all([
        apiClient.get(`/analytics/sites?${new URLSearchParams({
          ...(selectedRegion && selectedRegion !== 'all' && { region: selectedRegion }),
          ...(selectedState && selectedState !== 'all' && { state: selectedState }),
          ...(siteCodeFilter && { siteCode: siteCodeFilter })
        })}`),
        apiClient.get('/analytics/regions'),
        apiClient.get(`/analytics/states?${new URLSearchParams({
          ...(selectedRegion && selectedRegion !== 'all' && { region: selectedRegion })
        })}`),
        apiClient.get('/analytics/dashboard-stats')
      ]);

      setSiteAnalysis(sitesResponse.sites || []);
      setRegionalAnalysis(regionsResponse || []);
      setStateAnalysis(statesResponse || []);
      setDashboardStats(statsResponse || null);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        setAuthError(true);
        setError('Authentication required. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('Analytics endpoint not found. Please check server configuration.');
      } else {
        setError(err.message || 'Failed to load analytics data');
      }
      setLoading(false);
    }
  };

  const exportSiteAnalysis = () => {
    const exportData = siteAnalysis.map(site => ({
      'Site Name': site.site?.name || '',
      'Site Code': site.site?.siteCode || '',
      'Region': site.site?.region || '',
      'State': site.site?.state || '',
      'Site Type': site.site?.siteType || '',
      'Status': site.site?.status || '',
      'Total Auditoriums': site.site?.totalAuditoriums || 0,
      'Total Projectors': site.analysis?.projectors?.total || 0,
      'Active Projectors': site.analysis?.projectors?.active || 0,
      'Under Service': site.analysis?.projectors?.underService || 0,
      'Needs Repair': site.analysis?.projectors?.needsRepair || 0,
      'Total RMAs': site.analysis?.rma?.total || 0,
      'RMA Total Cost': site.analysis?.rma?.totalCost || 0,
      'Avg RMA Resolution Time': site.analysis?.rma?.avgResolutionTime || 0,
      'Total Spare Parts': site.analysis?.spareParts?.total || 0,
      'Spare Parts Value': site.analysis?.spareParts?.totalValue || 0,
      'Low Stock Parts': site.analysis?.spareParts?.lowStockCount || 0,
      'Total Services': site.analysis?.services?.total || 0,
      'Avg Satisfaction': site.analysis?.services?.avgSatisfaction || 0,
      'Total Issues': site.analysis?.services?.totalIssues || 0
    }));
    
    const csv = convertToCSV(exportData);
    downloadCSV(csv, 'site-analysis-report.csv');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Under Service': return 'bg-yellow-100 text-yellow-800';
      case 'Needs Repair': return 'bg-red-100 text-red-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access the analytics data. Please log in again.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadAnalyticsData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Site Analytics & Analysis</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive analysis of sites by region, state, and site code with RMA, projector, and spare parts insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={loadAnalyticsData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={exportSiteAnalysis} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-gray-50">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Analysis Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                    <SelectItem value="Central">Central</SelectItem>
                    <SelectItem value="Northeast">Northeast</SelectItem>
                    <SelectItem value="Northwest">Northwest</SelectItem>
                    <SelectItem value="Southeast">Southeast</SelectItem>
                    <SelectItem value="Southwest">Southwest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {Array.from(new Set(stateAnalysis.map(s => s._id))).map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="siteCode">Site Code</Label>
                <Input
                  id="siteCode"
                  placeholder="Search by site code..."
                  value={siteCodeFilter}
                  onChange={(e) => setSiteCodeFilter(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={loadAnalyticsData} className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'sites', label: 'Site Analysis', icon: Building },
            { id: 'regions', label: 'Regional Analysis', icon: Globe },
            { id: 'states', label: 'State Analysis', icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardStats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.sites?.totalSites || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {dashboardStats.sites?.byRegion?.length || 0} regions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projectors</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.projectors?.totalProjectors || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats.projectors?.activeProjectors || 0} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total RMAs</CardTitle>
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.rma?.totalRMAs || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ₹{(dashboardStats.rma?.totalCost || 0).toLocaleString()} total cost
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Spare Parts</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.spareParts?.totalParts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats.spareParts?.lowStock || 0} low stock
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Regional Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Site Distribution by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="siteCount" fill="#3b82f6" name="Sites" />
                      <Bar dataKey="totalProjectors" fill="#10b981" name="Projectors" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Projector Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Projector Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                                              <Pie
                          data={[
                            { name: 'Active', value: dashboardStats.projectors?.activeProjectors || 0, color: '#10b981' },
                            { name: 'Under Service', value: dashboardStats.projectors?.underService || 0, color: '#f59e0b' },
                            { name: 'Needs Repair', value: dashboardStats.projectors?.needsRepair || 0, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Active', value: dashboardStats.projectors?.activeProjectors || 0, color: '#10b981' },
                            { name: 'Under Service', value: dashboardStats.projectors?.underService || 0, color: '#f59e0b' },
                            { name: 'Needs Repair', value: dashboardStats.projectors?.needsRepair || 0, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Site Analysis Tab */}
        {activeTab === 'sites' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Site Analysis</CardTitle>
                <CardDescription>
                  Comprehensive analysis of {siteAnalysis.length} sites with detailed breakdowns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {siteAnalysis.map((site) => (
                    <Card key={site.site._id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Building className="w-5 h-5" />
                              {site.site.name}
                              <Badge variant="outline">{site.site.siteCode}</Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                {site.site.region}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {site.site.state}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="w-4 h-4" />
                                {site.site.siteType}
                              </span>
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(site.site.status)}>
                            {site.site.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {/* Projectors */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Monitor className="w-4 h-4" />
                              Projectors ({site.analysis?.projectors?.total || 0})
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Active:</span>
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  {site.analysis?.projectors?.active || 0}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Under Service:</span>
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  {site.analysis?.projectors?.underService || 0}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Needs Repair:</span>
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  {site.analysis?.projectors?.needsRepair || 0}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* RMA */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <RotateCcw className="w-4 h-4" />
                              RMA ({site.analysis?.rma?.total || 0})
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Total Cost:</span>
                                <span className="font-medium">₹{(site.analysis?.rma?.totalCost || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Avg Resolution:</span>
                                <span className="font-medium">{site.analysis?.rma?.avgResolutionTime || 0} days</span>
                              </div>
                            </div>
                          </div>

                          {/* Spare Parts */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Spare Parts ({site.analysis?.spareParts?.total || 0})
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Total Value:</span>
                                <span className="font-medium">₹{(site.analysis?.spareParts?.totalValue || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Low Stock:</span>
                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                  {site.analysis?.spareParts?.lowStockCount || 0}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Services */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Wrench className="w-4 h-4" />
                              Services ({site.analysis?.services?.total || 0})
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Avg Satisfaction:</span>
                                <span className="font-medium">{site.analysis?.services?.avgSatisfaction || 0}/5</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Issues:</span>
                                <span className="font-medium">{site.analysis?.services?.totalIssues || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Regional Analysis Tab */}
        {activeTab === 'regions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Analysis</CardTitle>
                <CardDescription>
                  Site and projector distribution across different regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionalAnalysis.map((region) => (
                    <Card key={region._id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          {region._id} Region
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">Sites</h5>
                            <p className="text-2xl font-bold">{region.siteCount}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">States</h5>
                            <p className="text-2xl font-bold">{region.states.length}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">Total Projectors</h5>
                            <p className="text-2xl font-bold">{region.totalProjectors}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">Active Projectors</h5>
                            <p className="text-2xl font-bold">{region.activeProjectors}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h6 className="font-medium text-sm text-gray-600 mb-2">Site Types</h6>
                          <div className="flex flex-wrap gap-2">
                            {region.siteTypes.map((type) => (
                              <Badge key={type} variant="outline">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* State Analysis Tab */}
        {activeTab === 'states' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>State-wise Analysis</CardTitle>
                <CardDescription>
                  Detailed breakdown of sites and projectors by state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Sites</TableHead>
                      <TableHead>Site Codes</TableHead>
                      <TableHead>Total Projectors</TableHead>
                      <TableHead>Active Projectors</TableHead>
                      <TableHead>Site Types</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stateAnalysis.map((state) => (
                      <TableRow key={state._id}>
                        <TableCell className="font-medium">{state._id}</TableCell>
                        <TableCell>{state.region}</TableCell>
                        <TableCell>{state.siteCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {state.siteCodes.slice(0, 3).map((code) => (
                              <Badge key={code} variant="outline" className="text-xs">
                                {code}
                              </Badge>
                            ))}
                            {state.siteCodes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{state.siteCodes.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{state.totalProjectors}</TableCell>
                        <TableCell>{state.activeProjectors}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {state.siteTypes.slice(0, 2).map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                            {state.siteTypes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{state.siteTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}