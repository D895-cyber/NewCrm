import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Alert, AlertDescription } from '../../ui/alert';
import { Progress } from '../../ui/progress';
import { Calendar, Clock, DollarSign, Package, Wrench, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  amcContracts: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    pendingServices: number;
  };
  purchaseOrders: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    overdue: number;
  };
  proformaInvoices: {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    overdue: number;
  };
  serviceTickets: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    overdue: number;
    today: number;
    thisWeek: number;
  };
  spareParts: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    rmaPending: number;
  };
  rma: {
    total: number;
    underReview: number;
    sentToCDS: number;
    replacementShipped: number;
    completed: number;
  };
}

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const EnhancedDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        amcStats,
        poStats,
        piStats,
        ticketStats,
        spareStats,
        rmaStats
      ] = await Promise.all([
        fetch('/api/amc-contracts/stats/overview').then(res => res.json()),
        fetch('/api/purchase-orders/stats/overview').then(res => res.json()),
        fetch('/api/proforma-invoices/stats/overview').then(res => res.json()),
        fetch('/api/service-tickets/stats/overview').then(res => res.json()),
        fetch('/api/spare-parts/stats/overview').then(res => res.json()),
        fetch('/api/rma/stats/overview').then(res => res.json())
      ]);

      setStats({
        amcContracts: amcStats,
        purchaseOrders: poStats,
        proformaInvoices: piStats,
        serviceTickets: ticketStats,
        spareParts: spareStats,
        rma: rmaStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
          // This would fetch from a notifications endpoint
    // For now, setting empty notifications
    setNotifications([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Clock className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced CRM Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : user?.username || 'User'}</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AMC Contracts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.amcContracts.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.amcContracts.expiringSoon || 0} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.purchaseOrders.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.purchaseOrders.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Tickets Today</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.serviceTickets.today || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.serviceTickets.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Parts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.spareParts.lowStock || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.spareParts.outOfStock || 0} out of stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="amc">AMC Management</TabsTrigger>
          <TabsTrigger value="po-pi">PO/PI Status</TabsTrigger>
          <TabsTrigger value="service">Service Tickets</TabsTrigger>
          <TabsTrigger value="spares">Spare Parts</TabsTrigger>
          <TabsTrigger value="rma">RMA Tracking</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AMC Contracts Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  AMC Contracts Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Contracts</span>
                    <span className="font-medium">{stats?.amcContracts.active || 0}</span>
                  </div>
                  <Progress value={(stats?.amcContracts.active || 0) / (stats?.amcContracts.total || 1) * 100} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-bold text-yellow-600">{stats?.amcContracts.expiringSoon || 0}</div>
                    <div className="text-yellow-500">Expiring Soon</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-bold text-red-600">{stats?.amcContracts.expired || 0}</div>
                    <div className="text-red-500">Expired</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Tickets Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Service Tickets Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span className="font-medium">{stats?.serviceTickets.thisWeek || 0}</span>
                  </div>
                  <Progress value={(stats?.serviceTickets.thisWeek || 0) / (stats?.serviceTickets.total || 1) * 100} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-600">{stats?.serviceTickets.scheduled || 0}</div>
                    <div className="text-blue-500">Scheduled</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-bold text-orange-600">{stats?.serviceTickets.inProgress || 0}</div>
                    <div className="text-orange-500">In Progress</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-600">{stats?.serviceTickets.completed || 0}</div>
                    <div className="text-green-500">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <Alert key={notification.id} className="border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <AlertDescription className="font-medium">
                          {notification.title}
                        </AlertDescription>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AMC Management Tab */}
        <TabsContent value="amc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AMC Contract Status</CardTitle>
              <CardDescription>Overview of all AMC contracts and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.amcContracts.active || 0}</div>
                  <div className="text-green-500">Active Contracts</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.amcContracts.expiringSoon || 0}</div>
                  <div className="text-yellow-500">Expiring Soon</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats?.amcContracts.expired || 0}</div>
                  <div className="text-red-500">Expired</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PO/PI Status Tab */}
        <TabsContent value="po-pi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total POs</span>
                    <span className="font-medium">{stats?.purchaseOrders.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Approval</span>
                    <span className="font-medium">{stats?.purchaseOrders.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue</span>
                    <span className="font-medium text-red-600">{stats?.purchaseOrders.overdue || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proforma Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Proforma Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total PIs</span>
                    <span className="font-medium">{stats?.proformaInvoices.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sent</span>
                    <span className="font-medium">{stats?.proformaInvoices.sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue</span>
                    <span className="font-medium text-red-600">{stats?.proformaInvoices.overdue || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Tickets Tab */}
        <TabsContent value="service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Ticket Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{stats?.serviceTickets.today || 0}</div>
                  <div className="text-blue-500 text-sm">Today</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{stats?.serviceTickets.thisWeek || 0}</div>
                  <div className="text-purple-500 text-sm">This Week</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{stats?.serviceTickets.overdue || 0}</div>
                  <div className="text-orange-500 text-sm">Overdue</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats?.serviceTickets.completed || 0}</div>
                  <div className="text-green-500 text-sm">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spare Parts Tab */}
        <TabsContent value="spares" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spare Parts Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats?.spareParts.inStock || 0}</div>
                  <div className="text-green-500 text-sm">In Stock</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">{stats?.spareParts.lowStock || 0}</div>
                  <div className="text-yellow-500 text-sm">Low Stock</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{stats?.spareParts.outOfStock || 0}</div>
                  <div className="text-red-500 text-sm">Out of Stock</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{stats?.spareParts.rmaPending || 0}</div>
                  <div className="text-blue-500 text-sm">RMA Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RMA Tracking Tab */}
        <TabsContent value="rma" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RMA Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{stats?.rma.underReview || 0}</div>
                  <div className="text-blue-500 text-sm">Under Review</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{stats?.rma.sentToCDS || 0}</div>
                  <div className="text-purple-500 text-sm">Sent to CDS</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{stats?.rma.replacementShipped || 0}</div>
                  <div className="text-orange-500 text-sm">Replacement Shipped</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats?.rma.completed || 0}</div>
                  <div className="text-green-500 text-sm">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboardPage;
