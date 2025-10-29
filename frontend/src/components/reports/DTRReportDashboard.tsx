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
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  LogIn
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

interface DTRAnalytics {
  summary: {
    totalCases: number;
    openCases: number;
    inProgressCases: number;
    resolvedCases: number;
    closedCases: number;
    shiftedToRMA: number;
    avgResolutionTimeHours: number;
  };
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
  callStatusDistribution: Record<string, number>;
  timeBasedTrends: Array<{ date: string; count: number }>;
  serialNumberAnalysis: Array<{
    serialNumber: string;
    siteName: string;
    unitModel: string;
    count: number;
    cases: any[];
  }>;
  siteAnalysis: Array<{ siteName: string; count: number }>;
  topProblems: Array<{ problemName: string; count: number }>;
  dtrRecords: any[];
  filters: any;
  generatedAt: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function DTRReportDashboard() {
  const { isAuthenticated, token } = useAuth();
  const [analytics, setAnalytics] = useState<DTRAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [serialNumber, setSerialNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [callStatus, setCallStatus] = useState('all');
  const [siteName, setSiteName] = useState('');
  const [caseSeverity, setCaseSeverity] = useState('all');

  const fetchAnalytics = async () => {
    if (!isAuthenticated || !token) {
      setError('Please log in to access DTR analytics');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (serialNumber) params.append('serialNumber', serialNumber);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);
      if (callStatus !== 'all') params.append('callStatus', callStatus);
      if (siteName) params.append('siteName', siteName);
      if (caseSeverity !== 'all') params.append('caseSeverity', caseSeverity);

      console.log('Fetching DTR analytics with token:', token ? 'Present' : 'Missing');
      console.log('API URL:', `/api/dtr/reports/analytics?${params.toString()}`);
      
      const response = await fetch(`/api/dtr/reports/analytics?${params.toString()}`, {
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
          setError('Access denied. You do not have permission to view DTR analytics.');
          return;
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch DTR analytics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Analytics data received:', data);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching DTR analytics:', err);
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSerialNumber('');
    setStartDate('');
    setEndDate('');
    setStatus('all');
    setPriority('all');
    setCallStatus('all');
    setSiteName('');
    setCaseSeverity('all');
  };

  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    alert('PDF export will be implemented in the next phase');
  };

  const handleExportCSV = () => {
    if (!analytics || analytics.dtrRecords.length === 0) {
      alert('No data to export');
      return;
    }

    const csvRows = [];
    const headers = ['Case ID', 'Serial Number', 'Site Name', 'Unit Model', 'Problem', 'Status', 'Priority', 'Severity', 'Error Date', 'Assigned To'];
    csvRows.push(headers.join(','));

    analytics.dtrRecords.forEach(dtr => {
      const row = [
        dtr.caseId || '',
        dtr.serialNumber || '',
        dtr.siteName || '',
        dtr.unitModel || '',
        (dtr.problemName || '').replace(/,/g, ';'),
        dtr.status || '',
        dtr.priority || '',
        dtr.caseSeverity || '',
        dtr.errorDate ? new Date(dtr.errorDate).toLocaleDateString() : '',
        typeof dtr.assignedTo === 'string' ? dtr.assignedTo : dtr.assignedTo?.name || 'Unassigned'
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `dtr-report-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  // Test API connection
  const testConnection = async () => {
    if (!isAuthenticated || !token) {
      alert('Please log in to test the connection');
      return;
    }

    try {
      const response = await fetch('/api/dtr/test-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test connection successful:', data);
        alert(`Connection successful! Found ${data.totalDTRs} DTR records in database.`);
      } else if (response.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        alert('Access denied. You do not have permission to access this resource.');
      } else {
        console.error('Test connection failed:', response.status);
        alert(`Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      alert(`Connection error: ${error.message}`);
    }
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
              Please log in to access DTR analytics and reports.
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DTR Analytics Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive Daily Trouble Report analysis and insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testConnection} variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-50">
            Test Connection
          </Button>
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
              <Label>Serial Number</Label>
              <Input
                placeholder="Enter serial number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Site Name</Label>
              <Input
                placeholder="Enter site name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed by Technical Head">Completed</SelectItem>
                  <SelectItem value="Ready for RMA">Ready for RMA</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Shifted to RMA">Shifted to RMA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
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
            <div>
              <Label>Call Status</Label>
              <Select value={callStatus} onValueChange={setCallStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Call Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Case Severity</Label>
              <Select value={caseSeverity} onValueChange={setCaseSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
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
            <p className="ml-3 text-gray-600">Generating analytics report...</p>
          </CardContent>
        </Card>
      )}

      {/* Analytics Display */}
      {analytics && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total DTRs</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalCases}</p>
                  </div>
                  <FileText className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open DTRs</p>
                    <p className="text-3xl font-bold text-yellow-600">{analytics.summary.openCases}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-yellow-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved DTRs</p>
                    <p className="text-3xl font-bold text-green-600">{analytics.summary.resolvedCases}</p>
                  </div>
                  <CheckCircle2 className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Resolution</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {analytics.summary.avgResolutionTimeHours.toFixed(1)}h
                    </p>
                  </div>
                  <Clock className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DTRs Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>DTRs Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timeBasedTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3B82F6" name="DTR Count" />
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

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analytics.priorityDistribution).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#10B981" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analytics.severityDistribution).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#F59E0B" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Sites */}
          <Card>
            <CardHeader>
              <CardTitle>Top Sites by DTR Count</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.siteAnalysis.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="siteName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8B5CF6" name="DTR Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Serial Number Analysis Table */}
          <Card>
            <CardHeader>
              <CardTitle>Serial Numbers with Most Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Serial Number</th>
                      <th className="text-left p-2">Site Name</th>
                      <th className="text-left p-2">Unit Model</th>
                      <th className="text-right p-2">DTR Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.serialNumberAnalysis.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{item.serialNumber}</td>
                        <td className="p-2">{item.siteName || 'N/A'}</td>
                        <td className="p-2">{item.unitModel || 'N/A'}</td>
                        <td className="p-2 text-right font-semibold">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Problems */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Problem Name</th>
                      <th className="text-right p-2">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProblems.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.problemName}</td>
                        <td className="p-2 text-right font-semibold">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed DTR Records ({analytics.dtrRecords.length} records)</CardTitle>
              <CardDescription>Showing up to 100 most recent records matching filters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Case ID</th>
                      <th className="text-left p-2">Serial Number</th>
                      <th className="text-left p-2">Site</th>
                      <th className="text-left p-2">Problem</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Priority</th>
                      <th className="text-left p-2">Error Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.dtrRecords.slice(0, 50).map((dtr, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-blue-600">{dtr.caseId}</td>
                        <td className="p-2 font-mono">{dtr.serialNumber}</td>
                        <td className="p-2">{dtr.siteName}</td>
                        <td className="p-2 max-w-xs truncate" title={dtr.problemName}>{dtr.problemName || 'N/A'}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {dtr.status}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                            {dtr.priority}
                          </span>
                        </td>
                        <td className="p-2">{dtr.errorDate ? new Date(dtr.errorDate).toLocaleDateString() : 'N/A'}</td>
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

