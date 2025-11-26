import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
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
  LogIn,
  Search,
  X,
  Calendar,
  BarChart3,
  Users,
  Zap,
  Target,
  RefreshCw,
  Eye,
  Settings,
  Save,
  Share2,
  Sparkles,
  Rocket,
  Lightbulb,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, SkeletonCard, SkeletonTable, SkeletonChart } from '../ui/3DLoadingSpinner';
import { NoResultsEmptyState, WelcomeEmptyState, ErrorEmptyState } from '../ui/EmptyState';

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

interface IssuePickerCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
  trend?: string;
  color: string;
  filters: any;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function EnhancedRMAReportDashboard() {
  const { isAuthenticated, token, user } = useAuth();
  const [analytics, setAnalytics] = useState<RMAAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIssuePicker, setShowIssuePicker] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Array<{key: string, value: string, label: string}>>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<string>('');

  // Filter states
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [siteName, setSiteName] = useState('');

  // Issue picker cards
  const issueCards: IssuePickerCard[] = [
    {
      id: 'overdue',
      title: 'Overdue RMAs',
      description: 'RMAs past due date',
      icon: <AlertTriangle className="w-8 h-8" />,
      count: 23,
      trend: '+12% WoW',
      color: 'from-red-500 to-red-600',
      filters: { status: 'overdue' }
    },
    {
      id: 'sla-breaches',
      title: 'SLA Breaches',
      description: 'RMAs exceeding SLA limits',
      icon: <Zap className="w-8 h-8" />,
      count: 8,
      trend: '-5% WoW',
      color: 'from-orange-500 to-orange-600',
      filters: { slaBreach: true }
    },
    {
      id: 'parts-pending',
      title: 'Parts Pending',
      description: 'RMAs waiting for parts',
      icon: <Package className="w-8 h-8" />,
      count: 15,
      trend: '+8% WoW',
      color: 'from-blue-500 to-blue-600',
      filters: { status: 'parts_pending' }
    },
    {
      id: 'high-priority',
      title: 'High Priority',
      description: 'Critical and high priority RMAs',
      icon: <Target className="w-8 h-8" />,
      count: 12,
      trend: '+3% WoW',
      color: 'from-purple-500 to-purple-600',
      filters: { priority: 'high' }
    },
    {
      id: 'aging-buckets',
      title: 'Aging Analysis',
      description: 'RMAs by age categories',
      icon: <Clock className="w-8 h-8" />,
      count: 45,
      trend: '+15% WoW',
      color: 'from-indigo-500 to-indigo-600',
      filters: { aging: 'analysis' }
    },
    {
      id: 'my-rmas',
      title: 'My RMAs',
      description: 'RMAs assigned to me',
      icon: <Users className="w-8 h-8" />,
      count: 7,
      trend: '0% WoW',
      color: 'from-green-500 to-green-600',
      filters: { assignedTo: user?.userId || user?._id }
    },
    {
      id: 'cost-analysis',
      title: 'Cost Analysis',
      description: 'Financial impact and trends',
      icon: <DollarSign className="w-8 h-8" />,
      count: 156,
      trend: '+22% WoW',
      color: 'from-emerald-500 to-emerald-600',
      filters: { analysis: 'cost' }
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Resolution time and efficiency',
      icon: <Activity className="w-8 h-8" />,
      count: 89,
      trend: '+7% WoW',
      color: 'from-cyan-500 to-cyan-600',
      filters: { analysis: 'performance' }
    }
  ];

  const fetchAnalytics = async (customFilters?: any) => {
    if (!isAuthenticated || !token) {
      setError('Please log in to access RMA analytics');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const filters = customFilters || {
        partName, partNumber, serialNumber, startDate, endDate, status, priority, siteName
      };

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/rma/reports/comprehensive?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          return;
        } else if (response.status === 403) {
          setError('Access denied. You do not have permission to view RMA analytics.');
          return;
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch RMA analytics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
      setShowIssuePicker(false);
    } catch (err: any) {
      console.error('Error fetching RMA analytics:', err);
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCardClick = (card: IssuePickerCard) => {
    // Apply the card's filters and fetch analytics
    fetchAnalytics(card.filters);
  };

  const handleGlobalSearch = (searchTerm: string) => {
    setGlobalSearch(searchTerm);
    // Implement search logic here
  };

  const addActiveFilter = (key: string, value: string, label: string) => {
    const newFilter = { key, value, label };
    setActiveFilters(prev => [...prev.filter(f => f.key !== key), newFilter]);
  };

  const removeActiveFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setPartName('');
    setPartNumber('');
    setSerialNumber('');
    setStartDate('');
    setEndDate('');
    setStatus('all');
    setPriority('all');
    setSiteName('');
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

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md transform hover:scale-105 transition-all duration-300 shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access RMA analytics and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.hash = '#login'}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Issue Picker Screen
  if (showIssuePicker && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">RMA Analytics</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose what you'd like to explore. Each option will show you relevant insights and data.
          </p>
        </div>

        {/* Issue Picker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {issueCards.map((card, index) => (
            <Card 
              key={card.id}
              className="group cursor-pointer card-3d shadow-lg hover:shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-fade-in-up"
              style={{
                animationDelay: `${index * 100}ms`
              }}
              onClick={() => handleIssueCardClick(card)}
            >
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${card.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 mb-4">{card.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">{card.count}</span>
                    <span className="text-sm text-gray-500">RMAs</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">{card.trend}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                  <span className="text-sm font-medium">View Details</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            onClick={() => setShowIssuePicker(false)}
            className="bg-white/80 hover:bg-white shadow-lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            RMA Analytics Report
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive RMA analysis with part tracking and cost insights</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowIssuePicker(true)}
            variant="outline" 
            className="bg-white/80 hover:bg-white shadow-lg"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Issue Picker
          </Button>
          <Button onClick={handleExportCSV} variant="outline" disabled={!analytics} className="bg-white/80 hover:bg-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => {}} variant="outline" disabled={!analytics} className="bg-white/80 hover:bg-white shadow-lg">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Global Search */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search RMAs, parts, sites... (e.g., status:overdue site:Delhi)"
                value={globalSearch}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <Button 
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {activeFilters.map((filter) => (
                <Badge 
                  key={filter.key}
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                  onClick={() => removeActiveFilter(filter.key)}
                >
                  {filter.label}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
                placeholder="Enter part name"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 rma-analytics-input"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Part Number</Label>
              <Input
                placeholder="Enter part number"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 rma-analytics-input"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Serial Number</Label>
              <Input
                placeholder="Enter serial number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 rma-analytics-input"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Site Name</Label>
              <Input
                placeholder="Enter site name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 rma-analytics-input"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 rma-analytics-input"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 rma-analytics-input"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 rma-analytics-select">
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
                <SelectTrigger className="bg-white/80 border-gray-200 focus:border-blue-500 text-gray-900 rma-analytics-select">
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
            <Button 
              onClick={() => fetchAnalytics()} 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 btn-3d"
            >
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
            <Button onClick={clearAllFilters} variant="outline" className="bg-white/80 hover:bg-white">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <ErrorEmptyState 
          error={error} 
          onRetry={() => fetchAnalytics()} 
        />
      )}

      {/* No Data State */}
      {!loading && !error && !analytics && !showIssuePicker && (
        <WelcomeEmptyState 
          onStartExploring={() => setShowIssuePicker(true)} 
        />
      )}

      {/* No Results State */}
      {analytics && analytics.rmaRecords.length === 0 && !loading && (
        <NoResultsEmptyState 
          onClearFilters={clearAllFilters}
          onBrowseAll={() => fetchAnalytics()}
        />
      )}

      {/* Enhanced Loading State */}
      {loading && (
        <div className="space-y-6">
          <LoadingSpinner 
            size="lg" 
            text="Generating comprehensive RMA analytics..." 
            subtext="This may take a few moments"
          />
          
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          
          {/* Skeleton Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          
          {/* Skeleton Table */}
          <SkeletonTable />
        </div>
      )}

      {/* Enhanced Analytics Display */}
      {analytics && !loading && (
        <>
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl card-3d">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total RMAs</p>
                    <p className="text-3xl font-bold text-blue-900">{analytics.summary.totalCases}</p>
                    <p className="text-xs text-blue-600 mt-1">All time cases</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl card-3d">
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
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl card-3d">
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
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl card-3d">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Avg Resolution</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {analytics.summary.avgResolutionTime} days
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Resolution time</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rest of the analytics content remains the same but with enhanced styling */}
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RMAs Over Time */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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

          {/* Enhanced Part Analysis Table */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
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

          {/* Enhanced Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Sites */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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

          {/* Enhanced Serial Number Analysis */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
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

          {/* Enhanced Detailed RMA Records */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
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

      {/* CSS for 3D animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .group:hover {
          transform: translateY(-8px) scale(1.02);
        }
        
        .group:hover .w-16 {
          transform: scale(1.1) rotate(5deg);
        }
      `}</style>
    </div>
  );
}
