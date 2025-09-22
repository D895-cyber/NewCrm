import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Download, Eye, Calendar, Filter, TrendingUp, BarChart3, User, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { convertToCSV, downloadCSV } from "../../utils/export";
import { Progress } from "../ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
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
}

interface DetailedReport {
  date: string;
  fseName: string;
  siteName: string;
  reportType: string;
  serviceStatus: string;
  completionTime: number;
  customerSatisfaction: number;
  issuesFound: number;
  partsReplaced: number;
}

export function ReportsPage() {
  const { user, token, logout } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<FSEAnalyticsData | null>(null);
  const [detailedReports, setDetailedReports] = useState<DetailedReport[]>([]);
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
      
      const [analyticsResponse, detailedResponse] = await Promise.all([
        apiClient.getFSEAnalytics(),
        apiClient.getDetailedServiceReports(50, 0)
      ]);

      setAnalyticsData(analyticsResponse);
      setDetailedReports(detailedResponse || []);
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      
      // Handle specific authentication errors
      if (err.message?.includes('Access token required') || err.message?.includes('Unauthorized')) {
        setError('Your session has expired. Please log in again.');
        logout(); // Clear the invalid token
      } else {
        setError(err.message || 'Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics from real data
  const totalReports = analyticsData?.fsePerformance.reduce((sum, fse) => sum + fse.totalReports, 0) || 0;
  const avgCompletionTime = analyticsData?.fsePerformance.length 
    ? Math.round((analyticsData.fsePerformance.reduce((sum, fse) => sum + fse.avgCompletionTime, 0) / analyticsData.fsePerformance.length) * 10) / 10
    : 0;
  const avgSatisfaction = analyticsData?.fsePerformance.length
    ? Math.round((analyticsData.fsePerformance.reduce((sum, fse) => sum + fse.avgSatisfaction, 0) / analyticsData.fsePerformance.length) * 10) / 10
    : 0;
  const totalIssues = analyticsData?.fsePerformance.reduce((sum, fse) => sum + fse.totalIssues, 0) || 0;

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
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
            <h1 className="text-2xl font-semibold text-gray-900">FSE Service Report Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Comprehensive analysis of Field Service Engineer performance and service reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-mint-600 hover:bg-mint-700"
              onClick={() => {
                const csvContent = convertToCSV(detailedReports);
                downloadCSV(analyticsData?.serviceTypeDistribution || [], `fse_service_report_analytics_${new Date().toISOString().split('T')[0]}.csv`);
                (window as any).showToast?.({
                  type: 'success',
                  title: 'Export Successful',
                  message: 'FSE service report analytics exported to CSV file'
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
              <div className="text-3xl font-bold text-gray-900 mb-1">{analyticsData?.fsePerformance.length || 0}</div>
              <div className="text-sm text-gray-500">Active FSEs</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-mint-600 mb-1">{totalReports}</div>
              <div className="text-sm text-gray-500">Total Service Reports</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{avgCompletionTime}h</div>
              <div className="text-sm text-gray-500">Avg Completion Time</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{avgSatisfaction}/5</div>
              <div className="text-sm text-gray-500">Avg Customer Satisfaction</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Service Trends */}
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Daily Service Trends
              </CardTitle>
              <CardDescription>
                Service reports and completion time trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.dailyTrends || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    <Line 
                      type="monotone" 
                      dataKey="reports" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="Service Reports"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name="Avg Time (hours)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Service Type Distribution */}
          <Card className="rounded-xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Service Type Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of different types of service reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.serviceTypeDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analyticsData?.serviceTypeDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getServiceTypeColor(entry.type)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FSE Performance Table */}
        <Card className="rounded-xl border-0 shadow-sm bg-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              FSE Performance Analysis
            </CardTitle>
            <CardDescription>
              Detailed performance metrics for each Field Service Engineer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="font-semibold text-gray-700">FSE Name</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Total Reports</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Avg Time (hrs)</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Satisfaction</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Efficiency %</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData?.fsePerformance.map((fse, index) => (
                  <TableRow 
                    key={index}
                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{fse.fseName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-medium bg-blue-100 text-blue-700">
                        {fse.totalReports}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-gray-900">{fse.avgCompletionTime}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-green-600">{fse.avgSatisfaction}/5</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center space-x-2">
                        <Progress value={fse.efficiency} className="w-16 h-2" />
                        <span className="font-medium text-purple-600">{fse.efficiency}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detailed Service Reports Table */}
        <Card className="rounded-xl border-0 shadow-sm bg-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Detailed Service Reports Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive breakdown of daily service reports and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">FSE Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Site</TableHead>
                  <TableHead className="font-semibold text-gray-700">Service Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Completion Time</TableHead>
                  <TableHead className="font-semibold text-gray-700">Satisfaction</TableHead>
                  <TableHead className="font-semibold text-gray-700">Issues Found</TableHead>
                  <TableHead className="font-semibold text-gray-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedReports.map((row, index) => (
                  <TableRow 
                    key={index}
                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(row.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">{row.fseName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-700">{row.siteName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`font-medium ${
                          row.reportType === 'Emergency' ? 'bg-red-100 text-red-700' :
                          row.reportType === 'First' ? 'bg-blue-100 text-blue-700' :
                          row.reportType === 'Second' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {row.reportType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-medium">{row.serviceStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{row.completionTime}h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`text-sm ${star <= row.customerSatisfaction ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="font-medium text-gray-700">{row.customerSatisfaction}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <Badge variant="secondary" className="font-medium bg-orange-100 text-orange-700">
                          {row.issuesFound}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                    FSE Performance Insights
                  </h3>
                  <p className="text-sm text-mint-700">
                    Your FSE team completed {totalReports} service reports with an average completion time of {avgCompletionTime} hours and customer satisfaction of {avgSatisfaction}/5
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-mint-900">{totalIssues}</div>
                <div className="text-sm text-mint-700">Total Issues Found</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

// Helper function to get colors for service types
const getServiceTypeColor = (type: string) => {
  switch (type) {
    case "First": return "#3b82f6";
    case "Second": return "#10b981";
    case "Third": return "#f59e0b";
    case "Emergency": return "#ef4444";
    case "Installation": return "#8b5cf6";
    default: return "#6b7280";
  }
};