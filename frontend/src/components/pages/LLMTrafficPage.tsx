import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { BarChart3, TrendingUp, Download, Filter, User, AlertTriangle, MapPin } from "lucide-react";
// import { Progress } from "../ui/progress";
import { convertToCSV, downloadCSV } from "../../utils/export";
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

export function LLMTrafficPage() {
  const { user, token, logout } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<FSEAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }
    
    // Set the auth token in the API client
    apiClient.setAuthToken(token);
    loadAnalyticsData();
  }, [token]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Double-check authentication
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Ensure token is set in API client
      apiClient.setAuthToken(token);
      
      console.log('🔍 Loading FSE Analytics Data...');
      console.log('🔑 Token available:', !!token);
      console.log('🌐 API Base URL:', apiClient.getBaseUrl());
      
      const response = await apiClient.getFSEAnalytics();
      console.log('📊 Analytics Response:', response);
      console.log('📈 Analytics Data (direct):', response);
      
      // The API client returns the data directly, not wrapped in a 'data' property
      setAnalyticsData(response);
    } catch (err: any) {
      console.error('❌ Error loading FSE analytics data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      
      // Handle specific authentication errors
      if (err.message?.includes('Access token required') || err.message?.includes('Unauthorized')) {
        setError('Your session has expired. Please log in again.');
        logout(); // Clear the invalid token
      } else {
        setError(err.message || 'Failed to load FSE analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics from real data
  const totalServices = analyticsData?.summary?.totalReports || 0;
  const avgServiceTime = analyticsData?.fsePerformance.length 
    ? Math.round((analyticsData.fsePerformance.reduce((sum, fse) => sum + fse.avgCompletionTime, 0) / analyticsData.fsePerformance.length) * 10) / 10
    : 0;
  const avgSatisfaction = analyticsData?.fsePerformance.length
    ? Math.round((analyticsData.fsePerformance.reduce((sum, fse) => sum + fse.avgSatisfaction, 0) / analyticsData.fsePerformance.length) * 10) / 10
    : 0;
  const totalIssues = analyticsData?.fsePerformance.reduce((sum, fse) => sum + fse.totalIssues, 0) || 0;

  // Debug logging
  console.log('🔍 Analytics Data Debug:', {
    hasAnalyticsData: !!analyticsData,
    summary: analyticsData?.summary,
    fsePerformance: analyticsData?.fsePerformance,
    totalServices,
    avgServiceTime,
    avgSatisfaction,
    totalIssues
  });

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">Loading FSE Analytics Data...</p>
          <p className="text-xs text-gray-400 mt-2">
            Token: {token ? '✅ Available' : '❌ Missing'} | 
            User: {user ? user.username : '❌ Not logged in'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAnalyticsData} variant="outline">
              Try Again
            </Button>
          </div>
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
            <h1 className="text-2xl font-semibold text-gray-900">FSE Service Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Comprehensive analysis of Field Service Engineer performance and service delivery</p>
            {/* Debug Info */}
            <div className="mt-2 text-xs text-gray-500">
              Debug: Token: {token ? '✅' : '❌'} | User: {user?.username || 'None'} | Data: {analyticsData ? '✅' : '❌'}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-2"
              onClick={() => {
                console.log('🔄 Manually reloading analytics data...');
                loadAnalyticsData();
              }}
            >
              🔄 Reload
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-mint-600 hover:bg-mint-700"
              onClick={() => {
                const csvContent = convertToCSV(analyticsData?.dailyTrends || []);
                downloadCSV(analyticsData?.dailyTrends || [], `fse_service_analytics_${new Date().toISOString().split('T')[0]}.csv`);
                (window as any).showToast?.({
                  type: 'success',
                  title: 'Export Successful',
                  message: 'FSE service analytics exported to CSV file'
                });
              }}
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{analyticsData?.summary?.totalFSEs || 0}</div>
              <div className="text-sm text-gray-500">Active FSEs</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-mint-600 mb-1">{totalServices}</div>
              <div className="text-sm text-gray-500">Total Services</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{avgServiceTime}h</div>
              <div className="text-sm text-gray-500">Avg Service Time</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{avgSatisfaction}/5</div>
              <div className="text-sm text-gray-500">Avg Satisfaction</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Service Trends Chart */}
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Service Delivery Trends
              </CardTitle>
              <CardDescription>
                Daily service completion and performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.dailyTrends || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="reports" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981"
                      fillOpacity={0.8}
                      name="Services Completed"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="issues" 
                      stackId="1"
                      stroke="#f59e0b" 
                      fill="#f59e0b"
                      fillOpacity={0.8}
                      name="Issues Found"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Service Type Performance */}
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Service Type Performance
              </CardTitle>
              <CardDescription>
                Performance metrics by service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.serviceTypeDistribution || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="type" 
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Service Count" />
                    <Bar dataKey="avgTime" fill="#10b981" name="Avg Time (hrs)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* FSE Performance Table */}
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                FSE Performance Overview
              </CardTitle>
              <CardDescription>Field Service Engineer performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-semibold text-gray-700">FSE Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Services</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Efficiency</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.fseEfficiency.map((fse, index) => (
                    <TableRow key={index} className="border-gray-100 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium text-gray-900">{fse.fseName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-medium bg-blue-100 text-blue-700">
                          {fse.totalReports}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`font-medium ${getEfficiencyColor(100 - fse.issueRate)}`}>
                          {Math.round(100 - fse.issueRate)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">{fse.avgLampPerformance}/15</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Sites Table */}
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Top Performing Sites
              </CardTitle>
              <CardDescription>Sites with highest service volume and satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Site Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Services</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Satisfaction</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.topSites.map((site, index) => (
                    <TableRow key={index} className="border-gray-100 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{site.siteName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-medium">
                          {site.services}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">{site.avgSatisfaction}/15</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-gray-500">
                          {new Date(site.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-r from-mint-50 to-mint-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-mint-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-mint-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-mint-900 mb-1">
                    FSE Service Performance Insights
                  </h3>
                  <p className="text-sm text-mint-700">
                    Your FSE team completed {totalServices} services with an average completion time of {avgServiceTime} hours and customer satisfaction of {avgSatisfaction}/5
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-mint-900">{totalIssues}</div>
                <div className="text-sm text-mint-700">Total Issues Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 90) return "bg-green-100 text-green-700";
  if (efficiency >= 80) return "bg-blue-100 text-blue-700";
  if (efficiency >= 70) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};