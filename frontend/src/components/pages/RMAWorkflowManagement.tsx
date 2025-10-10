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

interface PendingSubmission {
  id: string;
  rmaNumber: string;
  siteName: string;
  productName: string;
  serialNumber: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  daysPending: number;
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
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [activeReturns, setActiveReturns] = useState<ActiveReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRMA, setSelectedRMA] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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

      // Fetch pending CDS submissions
      const pendingResponse = await fetch('/api/rma/cds/pending');
      const pendingData = await pendingResponse.json();
      if (pendingData.success) {
        setPendingSubmissions(pendingData.submissions);
      }

      // Fetch active returns
      const returnsResponse = await fetch('/api/rma/returns/active');
      const returnsData = await returnsResponse.json();
      if (returnsData.success) {
        setActiveReturns(returnsData.returns);
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending CDS</TabsTrigger>
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
                  {stats && Object.entries(stats).filter(([key, value]) => 
                    typeof value === 'number' && key !== 'total'
                  ).map(([status, count]) => (
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
                <div className="space-y-3">
                  {pendingSubmissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{submission.rmaNumber}</p>
                        <p className="text-xs text-gray-600">{submission.siteName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(submission.priority)}>
                          {submission.priority}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewRMA(submission.id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pending CDS Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search RMAs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {pendingSubmissions
              .filter(submission => 
                submission.rmaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                submission.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                submission.productName.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{submission.rmaNumber}</h3>
                          <Badge className={getPriorityColor(submission.priority)}>
                            {submission.priority}
                          </Badge>
                          <Badge variant="outline">
                            {submission.daysPending} days pending
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Site:</span> {submission.siteName}
                          </div>
                          <div>
                            <span className="font-medium">Product:</span> {submission.productName}
                          </div>
                          <div>
                            <span className="font-medium">Serial:</span> {submission.serialNumber}
                          </div>
                          <div>
                            <span className="font-medium">Created By:</span> {submission.createdBy}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => handleViewRMA(submission.id)}
                          size="sm"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleViewRMA(submission.id)}
                          size="sm"
                          variant="outline"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Submit CDS Form
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Active Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search returns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {activeReturns
              .filter(returnItem => 
                returnItem.rmaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                returnItem.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                returnItem.returnTracking.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((returnItem) => (
                <Card key={returnItem.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{returnItem.rmaNumber}</h3>
                          <Badge className={getReturnStatusColor(returnItem.status)}>
                            {returnItem.status}
                          </Badge>
                          <Badge variant="outline">
                            {returnItem.returnPath === 'direct' ? 'Direct to CDS' : 'Via ASCOMP'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Site:</span> {returnItem.siteName}
                          </div>
                          <div>
                            <span className="font-medium">Tracking:</span> {returnItem.returnTracking}
                          </div>
                          <div>
                            <span className="font-medium">Carrier:</span> {returnItem.carrier}
                          </div>
                          <div>
                            <span className="font-medium">Shipped:</span> {new Date(returnItem.shippedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => handleViewRMA(returnItem.id)}
                          size="sm"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleViewRMA(returnItem.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Track Return
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Workflow Status Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an RMA to View Workflow</h3>
            <p className="text-gray-600">
              Click on any RMA from the Pending CDS or Active Returns tabs to view its detailed workflow status.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RMAWorkflowManagement;




