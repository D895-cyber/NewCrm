import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Mail, 
  FileText, 
  Truck, 
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import RMAWorkflowDashboard from '../RMAWorkflowDashboard';

interface RMAWorkflowManagementProps {}

interface WorkflowStats {
  total: number;
  underReview: number;
  sentToCDS: number;
  cdsApproved: number;
  replacementShipped: number;
  replacementReceived: number;
  faultyPartReturned: number;
  cdsConfirmedReturn: number;
  completed: number;
  rejected: number;
  approvalRate: string;
  returnCompletionRate: string;
}


interface ActiveReturn {
  id: string;
  rmaNumber: string;
  siteName: string;
  returnTracking: string;
  carrier: string;
  status: string;
  shippedDate: string;
  expectedDelivery: string;
  actualDelivery: string;
  returnPath: string;
}

const RMAWorkflowManagement: React.FC<RMAWorkflowManagementProps> = () => {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [rmas, setRmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRMA, setSelectedRMA] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Map backend data to frontend display format
  const mapBackendDataToFrontend = (backendRMA: any) => {
    return {
      _id: backendRMA._id,
      rmaNumber: backendRMA.rmaNumber || 'N/A',
      callLogNumber: backendRMA.callLogNumber || 'N/A',
      rmaOrderNumber: backendRMA.rmaOrderNumber || 'N/A',
      ascompRaisedDate: backendRMA.ascompRaisedDate ? new Date(backendRMA.ascompRaisedDate).toLocaleDateString() : 
                        backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
      customerErrorDate: backendRMA.customerErrorDate ? new Date(backendRMA.customerErrorDate).toLocaleDateString() : 
                         backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
      siteName: backendRMA.siteName || backendRMA.customerSite || 'N/A',
      productName: backendRMA.productPartNumber || backendRMA.productName || backendRMA.projectorModel || 'N/A',
      productPartNumber: backendRMA.serialNumber || backendRMA.productPartNumber || backendRMA.defectivePartNumber || 'N/A',
      serialNumber: backendRMA.projectorSerial || backendRMA.defectiveSerialNumber || 'N/A',
      defectivePartNumber: backendRMA.defectivePartNumber || 'N/A',
      defectivePartName: backendRMA.defectivePartName || 'Projector Component',
      defectiveSerialNumber: backendRMA.defectiveSerialNumber || 'N/A',
      symptoms: backendRMA.symptoms || backendRMA.failureDescription || backendRMA.reason || 'N/A',
      replacedPartNumber: backendRMA.replacedPartNumber || 'N/A',
      replacedPartName: backendRMA.replacedPartName || 'N/A',
      replacedPartSerialNumber: backendRMA.replacedPartSerialNumber || 'N/A',
      replacementNotes: backendRMA.replacementNotes || 'N/A',
      shippedDate: backendRMA.shippedDate ? new Date(backendRMA.shippedDate).toLocaleDateString() : 'N/A',
      trackingNumber: backendRMA.trackingNumber || 'N/A',
      shippedThru: backendRMA.shippedThru || 'N/A',
      caseStatus: backendRMA.caseStatus || backendRMA.status || 'Under Review',
      approvalStatus: backendRMA.approvalStatus || 'Pending Review',
      priority: backendRMA.priority || 'Medium',
      warrantyStatus: backendRMA.warrantyStatus || 'In Warranty',
      estimatedCost: backendRMA.estimatedCost || 0,
      notes: backendRMA.notes || 'N/A',
      brand: backendRMA.brand || 'N/A',
      projectorModel: backendRMA.projectorModel || 'N/A',
      customerSite: backendRMA.customerSite || 'N/A',
      technician: backendRMA.technician || 'N/A',
      createdBy: backendRMA.createdBy || 'System'
    };
  };

  useEffect(() => {
    fetchWorkflowData();
  }, []);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      
      // Fetch workflow stats
      const statsResponse = await fetch('/api/rma/workflow/stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }


      // Fetch RMA data
      const rmaResponse = await fetch('/api/rma/');
      const rmaData = await rmaResponse.json();
      
      if (Array.isArray(rmaData)) {
        // Apply mapping function to transform backend data to frontend format
        const mappedRmaData = rmaData.map(mapBackendDataToFrontend);
        setRmas(mappedRmaData);
      } else if (rmaData.success && Array.isArray(rmaData.data)) {
        // Apply mapping function to transform backend data to frontend format
        const mappedRmaData = rmaData.data.map(mapBackendDataToFrontend);
        setRmas(mappedRmaData);
      } else {
        console.error('Unexpected RMA data format:', rmaData);
        setRmas([]);
      }
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Sent to CDS': 'bg-blue-100 text-blue-800',
      'CDS Approved': 'bg-green-100 text-green-800',
      'Replacement Shipped': 'bg-purple-100 text-purple-800',
      'Replacement Received': 'bg-indigo-100 text-indigo-800',
      'Faulty Part Returned': 'bg-orange-100 text-orange-800',
      'CDS Confirmed Return': 'bg-teal-100 text-teal-800',
      'Completed': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: { [key: string]: string } = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getReturnStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-gray-100 text-gray-800',
      'picked_up': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'out_for_delivery': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'exception': 'bg-red-100 text-red-800',
      'returned': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleRefresh = () => {
    fetchWorkflowData();
  };

  const handleViewRMA = (rmaId: string) => {
    setSelectedRMA(rmaId);
    setActiveTab('workflow');
  };

  // Get unique statuses and priorities for filtering
  const availableStatuses = React.useMemo(() => {
    const statusCounts = (rmas || []).reduce((acc, rma) => {
      const status = rma.caseStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts)
      .filter(([_, count]) => (count as number) > 0)
      .map(([status, count]) => ({ status, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }, [rmas]);

  const availablePriorities = React.useMemo(() => {
    const priorityCounts = (rmas || []).reduce((acc, rma) => {
      const priority = rma.priority || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(priorityCounts)
      .filter(([_, count]) => (count as number) > 0)
      .map(([priority, count]) => ({ priority, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }, [rmas]);

  // Filter RMAs based on search and filters
  const filteredRMAs = React.useMemo(() => {
    return (rmas || []).filter(rma => {
      const matchesSearch = 
        rma.rmaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rma.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rma.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rma.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rma.defectivePartName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || rma.caseStatus === statusFilter;
      const matchesPriority = priorityFilter === 'all' || rma.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [rmas, searchTerm, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading workflow data...</span>
      </div>
    );
  }

  if (selectedRMA) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => setSelectedRMA(null)}
            variant="outline"
          >
            ← Back to Workflow Management
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <RMAWorkflowDashboard rmaId={selectedRMA} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RMA Workflow Management</h1>
          <p className="text-gray-600">Manage the complete RMA lifecycle from email to completion</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RMAs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting CDS form submission
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CDS Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvalRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.cdsApproved} approved, {stats.rejected} rejected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Return Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.returnCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed} completed returns
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="returns">Active Returns</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats && Object.entries(stats).filter(([key, value]) => {
                    const allowedStatuses = [
                      'Completed',
                      'Faulty Transit to CDS', 
                      'RMA Raised Yet to Deliver',
                      'Open',
                      'Under Review'
                    ];
                    return typeof value === 'number' && key !== 'total' && allowedStatuses.includes(key);
                  }).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {status.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity to display</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        {/* Active Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          {/* Enhanced Search and Filter Bar */}
          <Card className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by RMA number, site, product, serial, or defective part..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="px-4 py-2"
                >
                  Clear All
                </Button>
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Status ({rmas?.length || 0})</option>
                    {availableStatuses.map(({ status, count }) => (
                      <option key={status} value={status}>
                        {status} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Priority:</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Priority ({rmas?.length || 0})</option>
                    {availablePriorities.map(({ priority, count }) => (
                      <option key={priority} value={priority}>
                        {priority} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Showing {filteredRMAs.length} of {rmas?.length || 0} RMAs</span>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Status: {statusFilter}
                    </span>
                  )}
                  {priorityFilter !== 'all' && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                      Priority: {priorityFilter}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-4">
            {filteredRMAs.length > 0 ? (
              filteredRMAs.map((rma) => (
                <Card key={rma._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-lg">{rma.rmaNumber}</h3>
                          <Badge className={getStatusColor(rma.caseStatus)}>
                            {rma.caseStatus}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(rma.priority)}>
                            {rma.priority || 'Medium'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Site:</span> {rma.siteName}
                          </div>
                          <div>
                            <span className="font-medium">Product:</span> {rma.productName}
                          </div>
                          <div>
                            <span className="font-medium">Serial:</span> {rma.serialNumber}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {rma.createdAt ? new Date(rma.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => handleViewRMA(rma._id)}
                          size="sm"
                          variant="outline"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleViewRMA(rma._id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No RMAs Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'No RMAs available at the moment.'}
                </p>
                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                    className="mt-4"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Workflow Status Tab */}
        <TabsContent value="workflow" className="space-y-4">
          {/* Enhanced Search and Filter Bar */}
          <Card className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by RMA number, site, product, serial, or defective part..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="px-4 py-2"
                >
                  Clear All
                </Button>
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Status ({rmas?.length || 0})</option>
                    {availableStatuses.map(({ status, count }) => (
                      <option key={status} value={status}>
                        {status} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Priority:</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Priority ({rmas?.length || 0})</option>
                    {availablePriorities.map(({ priority, count }) => (
                      <option key={priority} value={priority}>
                        {priority} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Showing {filteredRMAs.length} of {rmas?.length || 0} RMAs</span>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Status: {statusFilter}
                    </span>
                  )}
                  {priorityFilter !== 'all' && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                      Priority: {priorityFilter}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-4">
            {filteredRMAs.length > 0 ? (
              filteredRMAs.map((rma) => (
                <Card key={rma._id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-lg">{rma.rmaNumber}</h3>
                          <Badge className={getStatusColor(rma.caseStatus)}>
                            {rma.caseStatus}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(rma.priority)}>
                            {rma.priority || 'Medium'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Site:</span> {rma.siteName}
                          </div>
                          <div>
                            <span className="font-medium">Product:</span> {rma.productName}
                          </div>
                          <div>
                            <span className="font-medium">Serial:</span> {rma.serialNumber}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {rma.createdAt ? new Date(rma.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => handleViewRMA(rma._id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No RMAs Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'No RMAs available at the moment.'}
                </p>
                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                    className="mt-4"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RMAWorkflowManagement;




