import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Calendar, 
  Package, 
  TrendingUp, 
  FileText,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';

interface SimpleRMAAnalytics {
  summary: {
    totalRMAs: number;
    partName: string;
    dateRange: string;
    averagePerDay: number;
  };
  rmaRecords: Array<{
    rmaNumber: string;
    siteName: string;
    defectivePartName: string;
    defectivePartNumber: string;
    ascompRaisedDate: string;
    caseStatus: string;
    priority: string;
    daysSinceRaised: number;
  }>;
  generatedAt: string;
}

export function SimpleRMAAnalytics() {
  const [analytics, setAnalytics] = useState<SimpleRMAAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [partName, setPartName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchAnalytics = async () => {
    if (!partName.trim()) {
      setError('Please enter a part name to search');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('partName', partName.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      console.log('Fetching simple RMA analytics:', params.toString());
      
      const response = await fetch(`/api/rma/analytics/simple?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Analytics data received:', data);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'Under Review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'Sent to CDS': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'Replacement Shipped': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const exportToCSV = () => {
    if (!analytics?.rmaRecords) return;
    
    const headers = ['RMA Number', 'Site Name', 'Part Name', 'Part Number', 'Raised Date', 'Status', 'Priority', 'Days Since Raised'];
    const csvData = analytics.rmaRecords.map(rma => [
      rma.rmaNumber,
      rma.siteName,
      rma.defectivePartName,
      rma.defectivePartNumber,
      new Date(rma.ascompRaisedDate).toLocaleDateString(),
      rma.caseStatus,
      rma.priority,
      rma.daysSinceRaised
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rma-analytics-${partName}-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Simple RMA Analytics</h2>
          <p className="text-gray-600">Get RMA reports by part name and date range</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name *</Label>
              <Input
                id="partName"
                placeholder="Enter part name (e.g., Assy. Integrator rod, Light Engine, Ballast)"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchAnalytics()}
              />
              <div className="text-sm text-gray-500">
                <p>Common part names: Assy. Integrator rod, Light Engine, Ballast, TPC Assembly, Harness, etc.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchAnalytics} disabled={loading || !partName.trim()}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search RMAs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total RMAs</p>
                    <p className="text-2xl font-bold">{analytics.summary.totalRMAs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                    <p className="text-sm font-bold">{analytics.summary.dateRange}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg per Day</p>
                    <p className="text-2xl font-bold">{analytics.summary.averagePerDay.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Part Name</p>
                    <p className="text-sm font-bold truncate">{analytics.summary.partName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RMA Records Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>RMA Records ({analytics.rmaRecords.length})</CardTitle>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics.rmaRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No RMA records found for the specified criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">RMA Number</th>
                        <th className="text-left p-2 font-semibold">Site Name</th>
                        <th className="text-left p-2 font-semibold">Part Name</th>
                        <th className="text-left p-2 font-semibold">Part Number</th>
                        <th className="text-left p-2 font-semibold">Raised Date</th>
                        <th className="text-left p-2 font-semibold">Status</th>
                        <th className="text-left p-2 font-semibold">Priority</th>
                        <th className="text-left p-2 font-semibold">Days Since</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.rmaRecords.map((rma, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-blue-600">{rma.rmaNumber}</td>
                          <td className="p-2">{rma.siteName}</td>
                          <td className="p-2">{rma.defectivePartName}</td>
                          <td className="p-2 font-mono">{rma.defectivePartNumber}</td>
                          <td className="p-2">{new Date(rma.ascompRaisedDate).toLocaleDateString()}</td>
                          <td className="p-2">
                            <Badge className={getStatusColor(rma.caseStatus)}>
                              {rma.caseStatus}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge className={getPriorityColor(rma.priority)}>
                              {rma.priority}
                            </Badge>
                          </td>
                          <td className="p-2">{rma.daysSinceRaised} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Info */}
          <div className="text-sm text-gray-500 text-center">
            Report generated at: {new Date(analytics.generatedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
