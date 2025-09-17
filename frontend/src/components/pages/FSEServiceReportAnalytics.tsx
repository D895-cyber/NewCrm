import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { 
  Download, 
  Eye, 
  Calendar, 
  Filter, 
  TrendingUp, 
  BarChart3, 
  User, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Activity,
  Users,
  FileText,
  Zap,
  Award,
  TrendingDown
} from "lucide-react";
import { convertToCSV, downloadCSV } from "../../utils/export";
import { Progress } from "../ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";
import { apiClient } from "../../utils/api/client";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useAuth } from "../../contexts/AuthContext";

interface FSEAnalyticsData {
  fsePerformance: Array<{
    fseName: string;
    totalReports: number;
    avgCompletionTime: number;
    avgSatisfaction: number;
    totalIssues: number;
    efficiency: number;
  }>;
  dailyTrends: Array<{
    date: string;
    reports: number;
    avgTime: number;
    satisfaction: number;
    issues: number;
  }>;
  serviceTypeDistribution: Array<{
    type: string;
    count: number;
    avgTime: number;
    avgSatisfaction: number;
  }>;
  topSites: Array<{
    siteName: string;
    services: number;
    avgSatisfaction: number;
    lastVisit: string;
  }>;
  summary: {
    totalReports: number;
    totalFSEs: number;
    avgReportsPerFSE: number;
  };
  monthlyTrends: Array<{
    month: string;
    reports: number;
    avgTime: number;
    satisfaction: number;
    issues: number;
  }>;
  issueAnalysis: Array<{
    issue: string;
    count: number;
    fseCount: number;
    siteCount: number;
    fseNames: string[];
    sites: string[];
  }>;
  fseEfficiency: Array<{
    fseName: string;
    totalReports: number;
    avgProjectorHours: number;
    avgLampPerformance: number;
    totalIssues: number;
    issueRate: number;
    lastReportDate: string;
    firstReportDate: string;
    experienceDays: number;
  }>;
}

interface FSESpecificData {
  fseName: string;
  summary: {
    totalReports: number;
    avgProjectorHours: number;
    avgLampPerformance: number;
    totalIssues: number;
    issueRate: number;
    firstReportDate: string;
    lastReportDate: string;
  };
  monthlyPerformance: Array<{
    month: string;
    reports: number;
    avgProjectorHours: number;
    avgLampPerformance: number;
    issues: number;
  }>;
  sitePerformance: Array<{
    siteName: string;
    reports: number;
    avgProjectorHours: number;
    avgLampPerformance: number;
    issues: number;
    lastVisit: string;
  }>;
  recentReports: Array<{
    reportNumber: string;
    siteName: string;
    date: string;
    reportType: string;
    projectorSerial: string;
    projectorModel: string;
    projectorRunningHours: string;
    lampPerformance: string;
    issuesCount: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function FSEServiceReportAnalytics() {
  const { user, token, logout } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<FSEAnalyticsData | null>(null);
  const [selectedFSE, setSelectedFSE] = useState<string | null>(null);
  const [fseSpecificData, setFseSpecificData] = useState<FSESpecificData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fseLoading, setFseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fse-detail' | 'issues' | 'trends'>('overview');

  useEffect(() => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }
    
    apiClient.setAuthToken(token);
    loadAnalyticsData();
  }, [token]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      apiClient.setAuthToken(token);
      const response = await apiClient.getFSEAnalytics();
      setAnalyticsData(response);
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      
      if (err.message?.includes('Access token required') || err.message?.includes('Unauthorized')) {
        setError('Your session has expired. Please log in again.');
        logout();
      } else {
        setError(err.message || 'Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFSESpecificData = async (fseName: string) => {
    try {
      setFseLoading(true);
      const response = await apiClient.getFSESpecificAnalytics(fseName);
      setFseSpecificData(response);
    } catch (err: any) {
      console.error('Error loading FSE-specific data:', err);
      setError(err.message || 'Failed to load FSE-specific data');
    } finally {
      setFseLoading(false);
    }
  };

  const handleFSESelect = (fseName: string) => {
    setSelectedFSE(fseName);
    setActiveTab('fse-detail');
    loadFSESpecificData(fseName);
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const exportData = [
      ...analyticsData.fsePerformance.map(fse => ({
        'FSE Name': fse.fseName,
        'Total Reports': fse.totalReports,
        'Avg Completion Time': fse.avgCompletionTime,
        'Avg Satisfaction': fse.avgSatisfaction,
        'Total Issues': fse.totalIssues,
        'Efficiency': fse.efficiency
      }))
    ];
    
    downloadCSV(exportData, 'fse-analytics');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-primary mb-2">Error Loading Analytics</h2>
          <p className="text-dark-secondary mb-4">{error}</p>
          <Button onClick={loadAnalyticsData} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-primary mb-2">No Analytics Data</h2>
          <p className="text-dark-secondary">No service reports found for analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-dark-bg border-b border-dark-color p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-primary">FSE Service Report Analytics</h1>
              <p className="text-dark-secondary">Comprehensive analysis of Field Service Engineer performance</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={exportAnalytics}
              variant="outline"
              className="border-dark-color text-dark-secondary hover:text-dark-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button
              onClick={loadAnalyticsData}
              variant="outline"
              className="border-dark-color text-dark-secondary hover:text-dark-primary"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-dark-bg border-b border-dark-color px-6">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'fse-detail', label: 'FSE Details', icon: User },
            { id: 'issues', label: 'Issue Analysis', icon: AlertTriangle },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-dark-secondary hover:text-dark-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="bg-dark-card border-dark-color">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-1">{analyticsData.summary.totalFSEs}</div>
                  <div className="text-sm text-dark-secondary">Active FSEs</div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-color">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">{analyticsData.summary.totalReports}</div>
                  <div className="text-sm text-dark-secondary">Total Reports</div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-color">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-1">{analyticsData.summary.avgReportsPerFSE}</div>
                  <div className="text-sm text-dark-secondary">Avg Reports/FSE</div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-color">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-1">
                    {analyticsData.fseEfficiency.reduce((sum, fse) => sum + fse.totalIssues, 0)}
                  </div>
                  <div className="text-sm text-dark-secondary">Total Issues</div>
                </CardContent>
              </Card>
            </div>

            {/* FSE Performance Table */}
            <Card className="bg-dark-card border-dark-color">
              <CardHeader>
                <CardTitle className="text-dark-primary flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  FSE Performance Overview
                </CardTitle>
                <CardDescription className="text-dark-secondary">
                  Click on any FSE to view detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-dark-color">
                      <TableHead className="text-dark-secondary">FSE Name</TableHead>
                      <TableHead className="text-dark-secondary">Total Reports</TableHead>
                      <TableHead className="text-dark-secondary">Avg Projector Hours</TableHead>
                      <TableHead className="text-dark-secondary">Avg Lamp Performance</TableHead>
                      <TableHead className="text-dark-secondary">Total Issues</TableHead>
                      <TableHead className="text-dark-secondary">Issue Rate</TableHead>
                      <TableHead className="text-dark-secondary">Experience (Days)</TableHead>
                      <TableHead className="text-dark-secondary">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.fseEfficiency.map((fse) => (
                      <TableRow key={fse.fseName} className="border-dark-color hover:bg-dark-color/50">
                        <TableCell className="text-dark-primary font-medium">{fse.fseName}</TableCell>
                        <TableCell className="text-dark-secondary">{fse.totalReports}</TableCell>
                        <TableCell className="text-dark-secondary">{fse.avgProjectorHours}</TableCell>
                        <TableCell className="text-dark-secondary">{fse.avgLampPerformance}</TableCell>
                        <TableCell className="text-dark-secondary">{fse.totalIssues}</TableCell>
                        <TableCell className="text-dark-secondary">
                          <Badge variant={fse.issueRate > 20 ? "destructive" : fse.issueRate > 10 ? "secondary" : "default"}>
                            {fse.issueRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-dark-secondary">{Math.round(fse.experienceDays)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFSESelect(fse.fseName)}
                            className="border-dark-color text-dark-secondary hover:text-dark-primary"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Type Distribution */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-dark-primary">Service Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.serviceTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.serviceTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Sites */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-dark-primary">Top Sites by Service Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.topSites.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="siteName" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Bar dataKey="services" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'fse-detail' && (
          <div className="space-y-6">
            {fseLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : fseSpecificData ? (
              <>
                {/* FSE Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="bg-dark-card border-dark-color">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-500 mb-1">{fseSpecificData.summary.totalReports}</div>
                      <div className="text-sm text-dark-secondary">Total Reports</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-dark-card border-dark-color">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-500 mb-1">{fseSpecificData.summary.avgProjectorHours}</div>
                      <div className="text-sm text-dark-secondary">Avg Projector Hours</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-dark-card border-dark-color">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-500 mb-1">{fseSpecificData.summary.avgLampPerformance}</div>
                      <div className="text-sm text-dark-secondary">Avg Lamp Performance</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-dark-card border-dark-color">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-500 mb-1">{fseSpecificData.summary.issueRate}%</div>
                      <div className="text-sm text-dark-secondary">Issue Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Performance Chart */}
                <Card className="bg-dark-card border-dark-color">
                  <CardHeader>
                    <CardTitle className="text-dark-primary">Monthly Performance - {fseSpecificData.fseName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={fseSpecificData.monthlyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="reports" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                        <Area type="monotone" dataKey="issues" stackId="2" stroke="#EF4444" fill="#EF4444" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Site Performance */}
                <Card className="bg-dark-card border-dark-color">
                  <CardHeader>
                    <CardTitle className="text-dark-primary">Site Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-dark-color">
                          <TableHead className="text-dark-secondary">Site Name</TableHead>
                          <TableHead className="text-dark-secondary">Reports</TableHead>
                          <TableHead className="text-dark-secondary">Avg Projector Hours</TableHead>
                          <TableHead className="text-dark-secondary">Avg Lamp Performance</TableHead>
                          <TableHead className="text-dark-secondary">Issues</TableHead>
                          <TableHead className="text-dark-secondary">Last Visit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fseSpecificData.sitePerformance.map((site) => (
                          <TableRow key={site.siteName} className="border-dark-color hover:bg-dark-color/50">
                            <TableCell className="text-dark-primary font-medium">{site.siteName}</TableCell>
                            <TableCell className="text-dark-secondary">{site.reports}</TableCell>
                            <TableCell className="text-dark-secondary">{site.avgProjectorHours}</TableCell>
                            <TableCell className="text-dark-secondary">{site.avgLampPerformance}</TableCell>
                            <TableCell className="text-dark-secondary">{site.issues}</TableCell>
                            <TableCell className="text-dark-secondary">
                              {new Date(site.lastVisit).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Recent Reports */}
                <Card className="bg-dark-card border-dark-color">
                  <CardHeader>
                    <CardTitle className="text-dark-primary">Recent Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-dark-color">
                          <TableHead className="text-dark-secondary">Report #</TableHead>
                          <TableHead className="text-dark-secondary">Site</TableHead>
                          <TableHead className="text-dark-secondary">Date</TableHead>
                          <TableHead className="text-dark-secondary">Type</TableHead>
                          <TableHead className="text-dark-secondary">Projector</TableHead>
                          <TableHead className="text-dark-secondary">Issues</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fseSpecificData.recentReports.map((report) => (
                          <TableRow key={report.reportNumber} className="border-dark-color hover:bg-dark-color/50">
                            <TableCell className="text-dark-primary font-medium">{report.reportNumber}</TableCell>
                            <TableCell className="text-dark-secondary">{report.siteName}</TableCell>
                            <TableCell className="text-dark-secondary">
                              {new Date(report.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-dark-secondary">{report.reportType}</TableCell>
                            <TableCell className="text-dark-secondary">{report.projectorModel}</TableCell>
                            <TableCell className="text-dark-secondary">
                              <Badge variant={report.issuesCount > 0 ? "destructive" : "default"}>
                                {report.issuesCount}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Select an FSE</h3>
                <p className="text-dark-secondary">Choose an FSE from the overview to view detailed analytics.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            <Card className="bg-dark-card border-dark-color">
              <CardHeader>
                <CardTitle className="text-dark-primary flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Issue Analysis
                </CardTitle>
                <CardDescription className="text-dark-secondary">
                  Most common issues found across all service reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-dark-color">
                      <TableHead className="text-dark-secondary">Issue Description</TableHead>
                      <TableHead className="text-dark-secondary">Count</TableHead>
                      <TableHead className="text-dark-secondary">FSEs Affected</TableHead>
                      <TableHead className="text-dark-secondary">Sites Affected</TableHead>
                      <TableHead className="text-dark-secondary">FSE Names</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.issueAnalysis.map((issue, index) => (
                      <TableRow key={index} className="border-dark-color hover:bg-dark-color/50">
                        <TableCell className="text-dark-primary font-medium">{issue.issue}</TableCell>
                        <TableCell className="text-dark-secondary">
                          <Badge variant="destructive">{issue.count}</Badge>
                        </TableCell>
                        <TableCell className="text-dark-secondary">{issue.fseCount}</TableCell>
                        <TableCell className="text-dark-secondary">{issue.siteCount}</TableCell>
                        <TableCell className="text-dark-secondary">
                          <div className="flex flex-wrap gap-1">
                            {issue.fseNames.slice(0, 3).map((name, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                            {issue.fseNames.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{issue.fseNames.length - 3}
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

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Monthly Trends */}
            <Card className="bg-dark-card border-dark-color">
              <CardHeader>
                <CardTitle className="text-dark-primary">Monthly Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="issues" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Trends */}
            <Card className="bg-dark-card border-dark-color">
              <CardHeader>
                <CardTitle className="text-dark-primary">Daily Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="reports" fill="#3B82F6" />
                    <Bar dataKey="issues" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
