import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  BarChart3,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { apiClient } from '../../utils/api/client';
import { useData } from '../../contexts/DataContext';

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

interface RMADetail {
  rmaNumber: string;
  partName: string;
}

interface SerialNumberAnalytics {
  serialNumber: string;
  count: number;
  rmaNumbers: string[];
  rmaDetails: RMADetail[];
  siteName: string;
  productName: string;
}

// Color palette for pie chart
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export function SimpleRMAAnalytics() {
  const { rma: rmaItems } = useData();
  const [analytics, setAnalytics] = useState<SimpleRMAAnalytics | null>(null);
  const [serialNumberAnalytics, setSerialNumberAnalytics] = useState<SerialNumberAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [partName, setPartName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Serial number analytics filter states
  const [rmaCountFilter, setRmaCountFilter] = useState<'all' | 'custom'>('all');
  const [customMinCount, setCustomMinCount] = useState<number>(1);
  const [customMaxCount, setCustomMaxCount] = useState<number>(100);
  const [chartView, setChartView] = useState<'serialNumber' | 'productName'>('serialNumber');
  const [partNameFilter, setPartNameFilter] = useState<string>('');
  
  // Date filter states for serial number analytics
  const [serialStartDate, setSerialStartDate] = useState('');
  const [serialEndDate, setSerialEndDate] = useState('');
  
  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Calculate serial number analytics from RMA data with date filtering
  useEffect(() => {
    if (rmaItems && rmaItems.length > 0) {
      // First, filter RMAs by date range if specified
      let filteredRMAs = rmaItems;
      
      if (serialStartDate || serialEndDate) {
        filteredRMAs = rmaItems.filter((rma: any) => {
          const rmaDate = new Date(rma.ascompRaisedDate || rma.raisedDate || rma.createdAt);
          
          if (serialStartDate && serialEndDate) {
            const start = new Date(serialStartDate);
            const end = new Date(serialEndDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            return rmaDate >= start && rmaDate <= end;
          } else if (serialStartDate) {
            const start = new Date(serialStartDate);
            return rmaDate >= start;
          } else if (serialEndDate) {
            const end = new Date(serialEndDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            return rmaDate <= end;
          }
          return true;
        });
      }
      
      // Now aggregate the filtered RMAs
      const serialNumberMap = new Map<string, SerialNumberAnalytics>();
      
      filteredRMAs.forEach((rma: any) => {
        const serialNumber = rma.serialNumber || rma.projectorSerial || 'Unknown';
        const rmaNumber = rma.rmaNumber || 'N/A';
        const partName = rma.defectivePartName || rma.replacedPartName || rma.partName || 'N/A';
        
        if (serialNumberMap.has(serialNumber)) {
          const existing = serialNumberMap.get(serialNumber)!;
          existing.count += 1;
          existing.rmaNumbers.push(rmaNumber);
          existing.rmaDetails.push({ rmaNumber, partName });
        } else {
          serialNumberMap.set(serialNumber, {
            serialNumber,
            count: 1,
            rmaNumbers: [rmaNumber],
            rmaDetails: [{ rmaNumber, partName }],
            siteName: rma.siteName || rma.customerSite || 'N/A',
            productName: rma.productName || rma.projectorModel || 'N/A'
          });
        }
      });
      
      // Convert to array and sort by count (descending)
      const analyticsArray = Array.from(serialNumberMap.values())
        .sort((a, b) => b.count - a.count);
      
      setSerialNumberAnalytics(analyticsArray);
    }
  }, [rmaItems, serialStartDate, serialEndDate]);

  // Filter serial number analytics based on selected filters (date already filtered in useEffect)
  const filteredSerialNumberAnalytics = useMemo(() => {
    let filtered = serialNumberAnalytics;
    
    // Filter by RMA count
    if (rmaCountFilter === 'custom') {
      filtered = filtered.filter(item => 
        item.count >= customMinCount && item.count <= customMaxCount
      );
    }
    
    // Filter by part name
    if (partNameFilter.trim()) {
      const searchTerm = partNameFilter.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.rmaDetails.some(detail => 
          detail.partName.toLowerCase().includes(searchTerm)
        )
      );
    }
    
    return filtered;
  }, [serialNumberAnalytics, rmaCountFilter, customMinCount, customMaxCount, partNameFilter]);

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

      {/* Serial Number Analytics Section */}
      {serialNumberAnalytics.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              RMA Analysis by Serial Number
            </h3>
            <Button 
              onClick={() => {
                // Export serial number analytics to CSV
                const headers = ['Serial Number', 'RMA Count', 'Site Name', 'Product Name', 'RMA Details (Number - Part Name)'];
                const csvData = filteredSerialNumberAnalytics.map(item => [
                  item.serialNumber,
                  item.count,
                  item.siteName,
                  item.productName,
                  item.rmaDetails.map(detail => `${detail.rmaNumber} - ${detail.partName}`).join('; ')
                ]);
                
                const csvContent = [headers, ...csvData]
                  .map(row => row.map(field => `"${field}"`).join(','))
                  .join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rma-by-serial-number-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              variant="outline" 
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Serial Analytics
            </Button>
          </div>

          {/* Summary Stats Card */}
          {(serialStartDate || serialEndDate) && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Currently Showing</p>
                    <h4 className="text-2xl font-bold text-blue-900">
                      {(() => {
                        const totalRMAs = serialNumberAnalytics.reduce((sum, item) => sum + item.count, 0);
                        const startDate = serialStartDate;
                        const endDate = serialEndDate;
                        const yearMatch = startDate && endDate && startDate.match(/^(\d{4})-01-01$/) && endDate.match(/^(\d{4})-12-31$/);
                        
                        if (yearMatch && startDate.substring(0, 4) === endDate.substring(0, 4)) {
                          return `${totalRMAs} RMAs from Year ${startDate.substring(0, 4)}`;
                        } else if (startDate && endDate) {
                          return `${totalRMAs} RMAs (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`;
                        } else {
                          return `${totalRMAs} RMAs in selected period`;
                        }
                      })()}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Across {serialNumberAnalytics.length} projector{serialNumberAnalytics.length !== 1 ? 's' : ''} 
                      {filteredSerialNumberAnalytics.length !== serialNumberAnalytics.length && 
                        ` (${filteredSerialNumberAnalytics.length} shown after additional filters)`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Date Filter Section */}
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Date Range Filter
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="serialStartDate" className="text-sm">Start Date</Label>
                      <Input
                        id="serialStartDate"
                        type="date"
                        value={serialStartDate}
                        onChange={(e) => setSerialStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialEndDate" className="text-sm">End Date</Label>
                      <Input
                        id="serialEndDate"
                        type="date"
                        value={serialEndDate}
                        onChange={(e) => setSerialEndDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Date Presets */}
                  <div className="mt-3 space-y-3">
                    {/* Year Filters - PROMINENT */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                      <span className="text-sm font-bold text-blue-900 block mb-3 flex items-center gap-2">
                        📅 Filter by Year
                        <span className="text-xs font-normal text-blue-600">(Click a year to show only RMAs from that year)</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[2025, 2024, 2023, 2022, 2021, 2020].map(year => {
                          const isSelected = serialStartDate === `${year}-01-01` && serialEndDate === `${year}-12-31`;
                          return (
                            <Button
                              key={year}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSerialStartDate(`${year}-01-01`);
                                setSerialEndDate(`${year}-12-31`);
                              }}
                              className={`text-sm font-bold px-4 py-2 transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg scale-105'
                                  : 'bg-white hover:bg-blue-100 hover:border-blue-400'
                              }`}
                            >
                              {year}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const currentYear = now.getFullYear();
                            setSerialStartDate(`${currentYear}-01-01`);
                            setSerialEndDate(`${currentYear}-12-31`);
                          }}
                          className="text-sm bg-green-100 border-green-400 text-green-700 hover:bg-green-200 font-semibold"
                        >
                          Current Year
                        </Button>
                        {(serialStartDate || serialEndDate) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSerialStartDate('');
                              setSerialEndDate('');
                            }}
                            className="text-sm bg-red-100 border-red-400 text-red-700 hover:bg-red-200 font-semibold"
                          >
                            Clear Year Filter
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 2025 Month Filters */}
                    <div>
                      <span className="text-xs font-medium text-gray-700 block mb-2">2025 Months:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Jan', month: '01' },
                          { name: 'Feb', month: '02' },
                          { name: 'Mar', month: '03' },
                          { name: 'Apr', month: '04' },
                          { name: 'May', month: '05' },
                          { name: 'Jun', month: '06' },
                          { name: 'Jul', month: '07' },
                          { name: 'Aug', month: '08' },
                          { name: 'Sep', month: '09' },
                          { name: 'Oct', month: '10' },
                          { name: 'Nov', month: '11' },
                          { name: 'Dec', month: '12' }
                        ].map(({ name, month }) => (
                          <Button
                            key={month}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const year = 2025;
                              const lastDay = new Date(year, parseInt(month), 0).getDate();
                              setSerialStartDate(`${year}-${month}-01`);
                              setSerialEndDate(`${year}-${month}-${lastDay}`);
                            }}
                            className="text-xs"
                          >
                            {name} '25
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* 2024 Month Filters */}
                    <div>
                      <span className="text-xs font-medium text-gray-700 block mb-2">2024 Months:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Jan', month: '01' },
                          { name: 'Feb', month: '02' },
                          { name: 'Mar', month: '03' },
                          { name: 'Apr', month: '04' },
                          { name: 'May', month: '05' },
                          { name: 'Jun', month: '06' },
                          { name: 'Jul', month: '07' },
                          { name: 'Aug', month: '08' },
                          { name: 'Sep', month: '09' },
                          { name: 'Oct', month: '10' },
                          { name: 'Nov', month: '11' },
                          { name: 'Dec', month: '12' }
                        ].map(({ name, month }) => (
                          <Button
                            key={month}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const year = 2024;
                              const lastDay = new Date(year, parseInt(month), 0).getDate();
                              setSerialStartDate(`${year}-${month}-01`);
                              setSerialEndDate(`${year}-${month}-${lastDay}`);
                            }}
                            className="text-xs"
                          >
                            {name} '24
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Filters */}
                    <div>
                      <span className="text-xs font-medium text-gray-700 block mb-2">Recent:</span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            setSerialStartDate(`${year}-${month}-01`);
                            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
                            setSerialEndDate(`${year}-${month}-${lastDay}`);
                          }}
                          className="text-xs bg-green-50"
                        >
                          This Month
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const thirtyDaysAgo = new Date(now);
                            thirtyDaysAgo.setDate(now.getDate() - 30);
                            setSerialStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                            setSerialEndDate(now.toISOString().split('T')[0]);
                          }}
                          className="text-xs"
                        >
                          Last 30 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const ninetyDaysAgo = new Date(now);
                            ninetyDaysAgo.setDate(now.getDate() - 90);
                            setSerialStartDate(ninetyDaysAgo.toISOString().split('T')[0]);
                            setSerialEndDate(now.toISOString().split('T')[0]);
                          }}
                          className="text-xs"
                        >
                          Last 90 Days
                        </Button>
                        {serialStartDate || serialEndDate ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSerialStartDate('');
                              setSerialEndDate('');
                            }}
                            className="text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          >
                            Clear Dates
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Part Name Search */}
                <div className="space-y-2">
                  <Label htmlFor="partNameFilter" className="text-base font-semibold flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search by Part Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="partNameFilter"
                      placeholder="Search part name (e.g., TPC, Light Engine, Ballast, Integrator rod)..."
                      value={partNameFilter}
                      onChange={(e) => setPartNameFilter(e.target.value)}
                      className="w-full pr-10"
                    />
                    {partNameFilter && (
                      <button
                        onClick={() => setPartNameFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Find projectors with specific part failures. Examples: TPC, Light Engine, Ballast, Integrator rod, DMD, Harness
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Chart Display</Label>
                    <select
                      value={chartView}
                      onChange={(e) => setChartView(e.target.value as 'serialNumber' | 'productName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="serialNumber">By Serial Number</option>
                      <option value="productName">By Product Name</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>RMA Count Filter</Label>
                    <select
                      value={rmaCountFilter}
                      onChange={(e) => setRmaCountFilter(e.target.value as 'all' | 'custom')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Counts</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  
                  {rmaCountFilter === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="minCount">Min RMA Count</Label>
                        <Input
                          id="minCount"
                          type="number"
                          min={1}
                          value={customMinCount}
                          onChange={(e) => setCustomMinCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxCount">Max RMA Count</Label>
                        <Input
                          id="maxCount"
                          type="number"
                          min={1}
                          value={customMaxCount}
                          onChange={(e) => setCustomMaxCount(Math.max(1, parseInt(e.target.value) || 100))}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Quick Part Name Filter Buttons */}
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700 block mb-2">Quick Part Search:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartNameFilter('TPC')}
                    className="text-xs"
                  >
                    TPC
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartNameFilter('Light Engine')}
                    className="text-xs"
                  >
                    Light Engine
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartNameFilter('Ballast')}
                    className="text-xs"
                  >
                    Ballast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartNameFilter('Integrator rod')}
                    className="text-xs"
                  >
                    Integrator Rod
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartNameFilter('DMD')}
                    className="text-xs"
                  >
                    DMD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartNameFilter('Harness')}
                    className="text-xs"
                  >
                    Harness
                  </Button>
                </div>
              </div>

              {/* Quick RMA Count Filter Buttons */}
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700 block mb-2">Quick RMA Count Filters:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRmaCountFilter('custom');
                      setCustomMinCount(1);
                      setCustomMaxCount(1);
                    }}
                    className="text-xs"
                  >
                    Single RMA (= 1)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRmaCountFilter('custom');
                      setCustomMinCount(2);
                      setCustomMaxCount(2);
                    }}
                    className="text-xs"
                  >
                    Exactly 2 RMAs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRmaCountFilter('custom');
                      setCustomMinCount(1);
                      setCustomMaxCount(3);
                    }}
                    className="text-xs"
                  >
                    Less than 3 RMAs (&lt; 3)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRmaCountFilter('custom');
                      setCustomMinCount(3);
                      setCustomMaxCount(100);
                    }}
                    className="text-xs"
                  >
                    3 or More RMAs (≥ 3)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRmaCountFilter('custom');
                      setCustomMinCount(5);
                      setCustomMaxCount(100);
                    }}
                    className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    High Risk (≥ 5)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRmaCountFilter('all');
                      setPartNameFilter('');
                      setSerialStartDate('');
                      setSerialEndDate('');
                    }}
                    className="text-xs bg-blue-50"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
              
              {/* Active Filter Display */}
              {(rmaCountFilter === 'custom' || partNameFilter || serialStartDate || serialEndDate) && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Active Filters:</p>
                      <div className="space-y-1">
                        {(serialStartDate || serialEndDate) && (
                          <p className="text-sm text-purple-800">
                            📅 Date Range: <strong>
                              {(() => {
                                // Check if it's a full year filter
                                const startDate = serialStartDate;
                                const endDate = serialEndDate;
                                const yearMatch = startDate && endDate && startDate.match(/^(\d{4})-01-01$/) && endDate.match(/^(\d{4})-12-31$/);
                                
                                if (yearMatch && startDate.substring(0, 4) === endDate.substring(0, 4)) {
                                  return `Year ${startDate.substring(0, 4)} ONLY (Jan 1 - Dec 31)`;
                                } else if (startDate && endDate) {
                                  return `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
                                } else if (startDate) {
                                  return `From ${new Date(startDate).toLocaleDateString()}`;
                                } else {
                                  return `Until ${new Date(endDate).toLocaleDateString()}`;
                                }
                              })()}
                            </strong>
                          </p>
                        )}
                        {rmaCountFilter === 'custom' && (
                          <p className="text-sm text-blue-800">
                            📊 RMA Count: <strong>{customMinCount}</strong> to <strong>{customMaxCount}</strong> RMAs
                          </p>
                        )}
                        {partNameFilter && (
                          <p className="text-sm text-green-800">
                            🔍 Part Name: <strong>"{partNameFilter}"</strong>
                          </p>
                        )}
                        <p className="text-sm text-gray-700 mt-2">
                          Found <strong className="text-blue-700">{filteredSerialNumberAnalytics.length}</strong> projector{filteredSerialNumberAnalytics.length !== 1 ? 's' : ''} matching your criteria
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {chartView === 'serialNumber' 
                    ? `RMAs by Serial Number (Top 10)` 
                    : `RMAs by Product Name (Top 10)`}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {(() => {
                    const filters = [];
                    if (serialStartDate && serialEndDate) {
                      filters.push(`${new Date(serialStartDate).toLocaleDateString()} - ${new Date(serialEndDate).toLocaleDateString()}`);
                    } else if (serialStartDate) {
                      filters.push(`From ${new Date(serialStartDate).toLocaleDateString()}`);
                    } else if (serialEndDate) {
                      filters.push(`Until ${new Date(serialEndDate).toLocaleDateString()}`);
                    }
                    if (rmaCountFilter === 'custom') {
                      filters.push(`${customMinCount}-${customMaxCount} RMAs`);
                    }
                    return filters.length > 0 ? `Filtered: ${filters.join(', ')}` : 'All projectors';
                  })()}
                </p>
              </CardHeader>
              <CardContent>
                {filteredSerialNumberAnalytics.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <div className="text-center">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No data matches your filter criteria</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={filteredSerialNumberAnalytics.slice(0, 10).map(item => ({
                          name: chartView === 'serialNumber' ? item.serialNumber : item.productName,
                          value: item.count,
                          serialNumber: item.serialNumber,
                          productName: item.productName,
                          siteName: item.siteName
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => {
                          const shortName = name.length > 15 ? name.substring(0, 12) + '...' : name;
                          return `${shortName}: ${value} (${(percent * 100).toFixed(1)}%)`;
                        }}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {filteredSerialNumberAnalytics.slice(0, 10).map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-semibold text-gray-900">{data.serialNumber}</p>
                                <p className="text-sm text-gray-600">{data.productName}</p>
                                <p className="text-sm text-gray-600">{data.siteName}</p>
                                <p className="text-sm font-semibold text-blue-600 mt-1">
                                  {data.value} RMA{data.value > 1 ? 's' : ''}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics Summary</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {rmaCountFilter === 'custom' || partNameFilter || serialStartDate || serialEndDate 
                    ? 'Filtered Results' 
                    : 'All Data'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Serial Numbers</span>
                    <span className="text-2xl font-bold text-blue-600">{filteredSerialNumberAnalytics.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total RMAs</span>
                    <span className="text-2xl font-bold text-green-600">
                      {filteredSerialNumberAnalytics.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Avg RMAs per Serial</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {filteredSerialNumberAnalytics.length > 0 
                        ? (filteredSerialNumberAnalytics.reduce((sum, item) => sum + item.count, 0) / 
                          filteredSerialNumberAnalytics.length).toFixed(1)
                        : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Max RMAs (Single Serial)</span>
                    <span className="text-2xl font-bold text-red-600">
                      {filteredSerialNumberAnalytics[0]?.count || 0}
                    </span>
                  </div>
                  {filteredSerialNumberAnalytics.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Top Serial:</strong> {filteredSerialNumberAnalytics[0]?.serialNumber || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {filteredSerialNumberAnalytics[0]?.productName || 'N/A'} at {filteredSerialNumberAnalytics[0]?.siteName || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Detailed Serial Number Analysis</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {(() => {
                      const dateInfo = serialStartDate && serialEndDate 
                        ? `from ${new Date(serialStartDate).toLocaleDateString()} to ${new Date(serialEndDate).toLocaleDateString()}`
                        : serialStartDate 
                        ? `from ${new Date(serialStartDate).toLocaleDateString()}`
                        : serialEndDate 
                        ? `until ${new Date(serialEndDate).toLocaleDateString()}`
                        : '';
                      
                      const countInfo = rmaCountFilter === 'custom' ? `${customMinCount}-${customMaxCount} RMAs` : '';
                      const partInfo = partNameFilter ? `"${partNameFilter}" failures` : '';
                      
                      const filters = [dateInfo, partInfo, countInfo].filter(Boolean).join(' with ');
                      
                      return filters 
                        ? `${filteredSerialNumberAnalytics.length} projector(s) ${filters}`
                        : `All ${filteredSerialNumberAnalytics.length} projectors`;
                    })()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSerialNumberAnalytics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No projectors match your filter criteria</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setRmaCountFilter('all')}
                  >
                    Clear Filter
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">#</th>
                        <th className="text-left p-3 font-semibold">Serial Number</th>
                        <th className="text-left p-3 font-semibold">Product Name</th>
                        <th className="text-left p-3 font-semibold">Site Name</th>
                        <th className="text-center p-3 font-semibold">RMA Count</th>
                        <th className="text-left p-3 font-semibold">RMA Details (Number → Part Name)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSerialNumberAnalytics.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-gray-600">{index + 1}</td>
                          <td className="p-3 font-mono text-blue-600 font-semibold">{item.serialNumber}</td>
                          <td className="p-3">{item.productName}</td>
                          <td className="p-3">{item.siteName}</td>
                          <td className="p-3 text-center">
                            <Badge className={
                              item.count >= 5 ? 'bg-red-100 text-red-800' :
                              item.count >= 3 ? 'bg-orange-100 text-orange-800' :
                              item.count >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {item.count} RMA{item.count > 1 ? 's' : ''}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              {item.rmaDetails.map((detail, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Badge className="text-xs bg-blue-600 text-white hover:bg-blue-700 font-mono">
                                    {detail.rmaNumber}
                                  </Badge>
                                  <span className="text-xs text-gray-400 mt-0.5">→</span>
                                  <Badge className="text-xs bg-green-600 text-white hover:bg-green-700">
                                    {detail.partName}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
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
