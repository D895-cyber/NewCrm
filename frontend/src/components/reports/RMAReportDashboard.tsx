import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Clock,
  Package,
  Loader2,
  LogIn
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

interface RMAAnalytics {
  summary: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    avgResolutionTime: number;
    totalCost: number;
    costPerRMA: number;
  };
  partAnalysis: Array<{
    partName: string;
    partNumber: string;
    count: number;
    totalCost: number;
    avgResolutionDays: number;
  }>;
  serialNumberAnalysis: Array<{
    serialNumber: string;
    siteName: string;
    count: number;
    issues: any[];
  }>;
  timeBasedDistribution: Array<{ date: string; count: number; cost: number }>;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  siteDistribution: Array<{ siteName: string; count: number }>;
  costTrends: Array<{ week: string; count: number; totalCost: number }>;
  rmaRecords: any[];
  filters: any;
  generatedAt: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function RMAReportDashboard() {
  const { isAuthenticated, token } = useAuth();
  const [analytics, setAnalytics] = useState<RMAAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [siteName, setSiteName] = useState('');

  const fetchAnalytics = async () => {
    if (!isAuthenticated || !token) {
      setError('Please log in to access RMA analytics');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (partName) params.append('partName', partName);
      if (partNumber) params.append('partNumber', partNumber);
      if (serialNumber) params.append('serialNumber', serialNumber);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);
      if (siteName) params.append('siteName', siteName);

      console.log('Fetching RMA analytics with token:', token ? 'Present' : 'Missing');
      console.log('API URL:', `/api/rma/reports/comprehensive?${params.toString()}`);
      
      const response = await fetch(`/api/rma/reports/comprehensive?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          return;
        } else if (response.status === 403) {
          setError('Access denied. You do not have permission to view RMA analytics.');
          return;
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch RMA analytics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Analytics data received:', data);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching RMA analytics:', err);
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setPartName('');
    setPartNumber('');
    setSerialNumber('');
    setStartDate('');
    setEndDate('');
    setStatus('all');
    setPriority('all');
    setSiteName('');
  };

  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    alert('PDF export will be implemented in the next phase');
  };

  const handleExportCSV = () => {
    if (!analytics || analytics.rmaRecords.length === 0) {
      alert('No data to export');
      return;
    }

    const csvRows = [];
    const headers = ['RMA Number', 'Site Name', 'Part Name', 'Part Number', 'Serial Number', 'Status', 'Priority', 'Date Raised', 'Estimated Cost'];
    csvRows.push(headers.join(','));

    analytics.rmaRecords.forEach(rma => {
      const row = [
        rma.rmaNumber || '',
        rma.siteName || '',
        (rma.defectivePartName || '').replace(/,/g, ';'),
        rma.defectivePartNumber || '',
        rma.projectorSerial || rma.serialNumber || '',
        rma.caseStatus || '',
        rma.priority || '',
        rma.ascompRaisedDate ? new Date(rma.ascompRaisedDate).toLocaleDateString() : '',
        rma.estimatedCost || '0'
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `rma-report-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  // Load initial analytics on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LogIn className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access RMA analytics and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.hash = '#login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RMA Analytics Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive RMA analysis with part tracking and cost insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" disabled={!analytics}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" disabled={!analytics}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-700 font-medium">Part Name</Label>
              <Input
                className="text-gray-900 placeholder:text-gray-500 rma-analytics-input"
                placeholder="Enter part name"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Part Number</Label>
              <Input
                className="text-gray-900 placeholder:text-gray-500 rma-analytics-input"
                placeholder="Enter part number"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Serial Number</Label>
              <Input
                className="text-gray-900 placeholder:text-gray-500 rma-analytics-input"
                placeholder="Enter serial number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Site Name</Label>
              <Input
                className="text-gray-900 placeholder:text-gray-500 rma-analytics-input"
                placeholder="Enter site name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Start Date</Label>
              <Input
                className="text-gray-900 rma-analytics-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">End Date</Label>
              <Input
                className="text-gray-900 rma-analytics-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="text-gray-900 rma-analytics-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="CDS Approved">CDS Approved</SelectItem>
                  <SelectItem value="Replacement Shipped">Replacement Shipped</SelectItem>
                  <SelectItem value="Replacement Received">Replacement Received</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="text-gray-900 rma-analytics-select">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchAnalytics} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-3 text-gray-600">Generating comprehensive RMA analytics...</p>
          </CardContent>
        </Card>
      )}

      {/* Analytics Display */}
      {analytics && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total RMAs</p>
                    <p className="text-3xl font-bold text-blue-900">{analytics.summary.totalCases}</p>
                  </div>
                  <Package className="w-12 h-12 text-blue-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Completed</p>
                    <p className="text-3xl font-bold text-green-900">{analytics.summary.completedCases}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {analytics.summary.totalCases > 0 
                        ? ((analytics.summary.completedCases / analytics.summary.totalCases) * 100).toFixed(1) 
                        : 0}% completion
                    </p>
                  </div>
                  <Package className="w-12 h-12 text-green-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Total Cost</p>
                    <p className="text-3xl font-bold text-purple-900">
                      ${analytics.summary.totalCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      ${analytics.summary.costPerRMA} per RMA
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-purple-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Avg Resolution</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {analytics.summary.avgResolutionTime} days
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Resolution time</p>
                  </div>
                  <Clock className="w-12 h-12 text-orange-600 opacity-30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RMAs Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>RMAs Raised Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timeBasedDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3B82F6" name="RMA Count" />
                    <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#10B981" name="Cost ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.statusDistribution).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(analytics.statusDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Part Analysis Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top 20 Parts by RMA Count</CardTitle>
              <CardDescription>Parts with highest failure rates and associated costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Part Name</th>
                      <th className="text-left p-2">Part Number</th>
                      <th className="text-right p-2">RMA Count</th>
                      <th className="text-right p-2">Total Cost</th>
                      <th className="text-right p-2">Avg Resolution (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.partAnalysis.map((part, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{part.partName}</td>
                        <td className="p-2 font-mono">{part.partNumber}</td>
                        <td className="p-2 text-right font-semibold text-blue-600">{part.count}</td>
                        <td className="p-2 text-right font-semibold text-green-600">
                          ${part.totalCost.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">{part.avgResolutionDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Sites */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Sites by RMA Count</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.siteDistribution.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="siteName" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8B5CF6" name="RMA Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Trends (Weekly) */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.costTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalCost" stroke="#10B981" name="Total Cost ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Serial Number Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Serial Numbers with Most RMAs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Serial Number</th>
                      <th className="text-left p-2">Site Name</th>
                      <th className="text-right p-2">RMA Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.serialNumberAnalysis.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{item.serialNumber}</td>
                        <td className="p-2">{item.siteName || 'N/A'}</td>
                        <td className="p-2 text-right font-semibold text-red-600">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed RMA Records */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed RMA Records ({analytics.rmaRecords.length} records)</CardTitle>
              <CardDescription>Showing up to 100 most recent RMAs matching filters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">RMA #</th>
                      <th className="text-left p-2">Site</th>
                      <th className="text-left p-2">Part Name</th>
                      <th className="text-left p-2">Part Number</th>
                      <th className="text-left p-2">Serial #</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Priority</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.rmaRecords.slice(0, 50).map((rma, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-blue-600">{rma.rmaNumber}</td>
                        <td className="p-2">{rma.siteName}</td>
                        <td className="p-2 max-w-xs truncate" title={rma.defectivePartName}>
                          {rma.defectivePartName || 'N/A'}
                        </td>
                        <td className="p-2 font-mono">{rma.defectivePartNumber || 'N/A'}</td>
                        <td className="p-2 font-mono">{rma.projectorSerial || rma.serialNumber || 'N/A'}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            {rma.caseStatus}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                            {rma.priority}
                          </span>
                        </td>
                        <td className="p-2">
                          {rma.ascompRaisedDate ? new Date(rma.ascompRaisedDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          ${(rma.estimatedCost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

