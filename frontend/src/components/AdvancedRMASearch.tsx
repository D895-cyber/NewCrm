import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Loader2,
  Download,
  Eye,
  Package,
  Hash,
  Monitor,
  Cpu
} from 'lucide-react';

interface PartAnalytics {
  partName: string;
  searchType: string;
  searchValue: string;
  totalCases: number;
  recentCases: number;
  completionRate: number;
  avgResolutionDays: number;
  statusDistribution: { [key: string]: number };
  priorityDistribution: { [key: string]: number };
  warrantyDistribution: { [key: string]: number };
  rmaRecords: any[];
  searchTimestamp: Date;
}

type SearchType = 'partName' | 'partNumber' | 'modelNumber' | 'serialNumber';

interface AdvancedRMASearchProps {
  onRmaSelect?: (rma: any) => void;
}

export function AdvancedRMASearch({ onRmaSelect }: AdvancedRMASearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('partName');
  const [isSearching, setIsSearching] = useState(false);
  const [analytics, setAnalytics] = useState<PartAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Date range filtering
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useDateFilter, setUseDateFilter] = useState(false);

  const searchTypeOptions = [
    { value: 'partName', label: 'Part Name', icon: Package, placeholder: 'Enter part name (e.g., Assy. Light Engine)' },
    { value: 'partNumber', label: 'Part Number', icon: Hash, placeholder: 'Enter part number (e.g., 003-001529-01)' },
    { value: 'modelNumber', label: 'Model Number', icon: Monitor, placeholder: 'Enter model number (e.g., PT-RZ970)' },
    { value: 'serialNumber', label: 'Serial Number', icon: Cpu, placeholder: 'Enter projector serial number' }
  ];

  const getSearchTypeConfig = () => {
    return searchTypeOptions.find(option => option.value === searchType) || searchTypeOptions[0];
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError(`Please enter a ${getSearchTypeConfig().label.toLowerCase()} to search`);
      return;
    }

    // Validate date range if enabled
    if (useDateFilter) {
      if (!startDate || !endDate) {
        setError('Please select both start and end dates');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError('Start date cannot be after end date');
        return;
      }
    }

    setIsSearching(true);
    setError(null);
    setAnalytics(null);

    try {
      const params = new URLSearchParams();
      params.append(searchType, searchTerm.trim());
      
      if (useDateFilter) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      const response = await fetch(`/api/rma/search/part-analytics?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Under Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'Sent to CDS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'CDS Approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'Replacement Shipped': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      'Faulty Transit to CDS': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'RMA Raised Yet to Deliver': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: { [key: string]: string } = {
      'Low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'High': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'Critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  };

  const exportResults = () => {
    if (!analytics) return;

    const csvData = analytics.rmaRecords.map(rma => ({
      'RMA Number': rma.rmaNumber,
      'Site Name': rma.siteName,
      'Part Name': rma.defectivePartName || rma.productName,
      'Part Number': rma.productPartNumber || rma.defectivePartNumber,
      'Model Number': rma.projectorModel || rma.productName,
      'Serial Number': rma.serialNumber,
      'Status': rma.caseStatus,
      'Priority': rma.priority,
      'Warranty Status': rma.warrantyStatus,
      'Date Raised': rma.ascompRaisedDate ? new Date(rma.ascompRaisedDate).toLocaleDateString() : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rma-search-${analytics.searchValue.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced RMA Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Type Selector */}
            <div className="flex flex-wrap gap-2">
              {searchTypeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={searchType === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchType(option.value as SearchType)}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder={getSearchTypeConfig().placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="px-6"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="useDateFilter"
                  checked={useDateFilter}
                  onChange={(e) => setUseDateFilter(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="useDateFilter" className="text-sm font-medium">
                  Filter by date range (e.g., April 1 to April 10)
                </label>
              </div>
              
              {useDateFilter && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-gray-900 rma-analytics-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-gray-900 rma-analytics-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Results */}
      {analytics && (
        <div className="space-y-6">
          {/* Date Range Info */}
          {analytics.dateRange?.hasDateFilter && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    Date Range: {analytics.dateRange.startDate ? new Date(analytics.dateRange.startDate).toLocaleDateString() : 'No start'} 
                    {' to '} 
                    {analytics.dateRange.endDate ? new Date(analytics.dateRange.endDate).toLocaleDateString() : 'No end'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.totalCases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Resolution</p>
                    <p className="text-2xl font-bold text-orange-600">{analytics.avgResolutionDays} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Recent Cases</p>
                    <p className="text-2xl font-bold text-purple-600">{analytics.recentCases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge className={getStatusColor(status)}>
                        {status}
                      </Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.priorityDistribution).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <Badge className={getPriorityColor(priority)}>
                        {priority}
                      </Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RMA Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">RMA Records ({analytics.rmaRecords.length})</CardTitle>
                <Button onClick={exportResults} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">RMA Number</th>
                      <th className="text-left p-2">Site Name</th>
                      <th className="text-left p-2">Part Name</th>
                      <th className="text-left p-2">Part Number</th>
                      <th className="text-left p-2">Model</th>
                      <th className="text-left p-2">Serial Number</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Priority</th>
                      <th className="text-left p-2">Date Raised</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.rmaRecords.map((rma) => (
                      <tr key={rma._id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{rma.rmaNumber}</td>
                        <td className="p-2">{rma.siteName}</td>
                        <td className="p-2">{rma.defectivePartName || rma.productName}</td>
                        <td className="p-2">{rma.productPartNumber || rma.defectivePartNumber || 'N/A'}</td>
                        <td className="p-2">{rma.projectorModel || rma.productName || 'N/A'}</td>
                        <td className="p-2">{rma.serialNumber || 'N/A'}</td>
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
                        <td className="p-2">
                          {rma.ascompRaisedDate ? new Date(rma.ascompRaisedDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRmaSelect?.(rma)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

