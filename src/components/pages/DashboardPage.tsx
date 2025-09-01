import { useMemo, useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { 
  MapPin, 
  Monitor, 
  FileText, 
  Calendar, 
  Download, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  RefreshCw,
  Loader2,
  Play,
  Pause
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { convertToCSV, downloadCSV } from "../../utils/export";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useData } from "../../contexts/DataContext";
import { apiClient } from "../../utils/api/client";

export function DashboardPage() {
  const { 
    dashboardData, 
    isLoading, 
    error, 
    refreshData,
    sites,
    projectors,
    services,
    serviceVisits,
    purchaseOrders
  } = useData();

  // AMC Contract statistics
  const [amcStats, setAmcStats] = useState<any>(null);
  const [amcContracts, setAmcContracts] = useState<any[]>([]);

  useEffect(() => {
    loadAMCData();
  }, []);

  const loadAMCData = async () => {
    try {
      const [stats, contracts] = await Promise.all([
        apiClient.getAMCDashboardStats(),
        apiClient.getAllAMCContracts()
      ]);
      
      setAmcStats(stats);
      setAmcContracts(contracts);
    } catch (error) {
      console.error('Error loading AMC data:', error);
    }
  };

  const generateServiceTrends = (serviceVisits: any[]) => {
    const now = new Date();
    const trends = [];
    
    // Show past 3 months, current month, and future 2 months
    for (let i = -3; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthVisits = serviceVisits.filter((visit: any) => {
        const visitDate = new Date(visit.scheduledDate);
        return visitDate.getMonth() === date.getMonth() && 
               visitDate.getFullYear() === date.getFullYear();
      });
      
      const scheduledCount = monthVisits.filter((v: any) => v.status === 'Scheduled').length;
      const completedCount = monthVisits.filter((v: any) => v.status === 'Completed').length;
      
      console.log(`Month ${monthName}: ${monthVisits.length} visits (${scheduledCount} scheduled, ${completedCount} completed)`);
      
      trends.push({
        month: monthName,
        scheduled: scheduledCount,
        completed: completedCount
      });
    }
    
    return trends;
  };

  const generateWarrantyStatus = (projectors: any[]) => {
    const now = new Date();
    const status = {
      active: 0,
      expiring: 0,
      expired: 0
    };
    
    projectors.forEach((projector: any) => {
      const warrantyEnd = new Date(projector.warrantyEnd);
      const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (warrantyEnd > now) {
        if (daysUntilExpiry <= 30) {
          status.expiring++;
        } else {
          status.active++;
        }
      } else {
        status.expired++;
      }
    });
    
    return [
      { name: 'Active (> 6 months)', value: status.active, color: '#10B981' },
      { name: 'Expiring Soon (≤ 30 days)', value: status.expiring, color: '#F59E0B' },
      { name: 'Expired', value: status.expired, color: '#EF4444' }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-400';
      case 'Scheduled':
        return 'text-blue-400';
      case 'Pending':
        return 'text-yellow-400';
      case 'Cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Memoized computed data
  const computedData = useMemo(() => {
    const now = new Date();
    
    // Generate service trends (current and future months only)
    console.log('Service visits data:', serviceVisits);
    const serviceTrends = generateServiceTrends(serviceVisits);
    console.log('Generated service trends:', serviceTrends);
    
    // Generate intelligent warranty status
    const warrantyStatus = generateWarrantyStatus(projectors);

    // Get recent POs and services (only current/future dates)
    const recentPOs = purchaseOrders
      .filter((po: any) => {
        const poDate = new Date(po.createdAt);
        return poDate >= now;
      })
      .slice(0, 4)
      .map((po: any) => ({
        id: po.purchaseOrderId,
        site: po.siteName,
        projectors: po.projectorCount || 0,
        status: po.status,
        amount: `$${po.totalAmount?.toFixed(2) || '0.00'}`,
        date: new Date(po.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

    // Use serviceVisits instead of services for recent services
    console.log('Computing recent services from', serviceVisits.length, 'service visits');
    
    const recentServices = serviceVisits
      .filter((visit: any) => {
        // Show all visits, but prioritize recent ones
        if (!visit.scheduledDate && !visit.actualDate) {
          console.log('Visit without date:', visit);
          return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        // Sort by date, most recent first
        const dateA = new Date(a.scheduledDate || a.actualDate);
        const dateB = new Date(b.scheduledDate || b.actualDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4)
      .map((visit: any) => {
        const visitDate = new Date(visit.scheduledDate || visit.actualDate);
        console.log('Processing visit:', {
          id: visit.visitId || visit._id,
          site: visit.siteName,
          date: visitDate.toISOString(),
          status: visit.status
        });
        
        return {
          id: visit.visitId || visit._id,
          site: visit.siteName || 'Unknown Site',
          projector: visit.projectorSerial || 'Unknown Projector',
          type: visit.visitType || 'Service Visit',
          status: visit.status || 'Unknown',
          technician: visit.fseName || 'Unknown FSE',
          date: visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    
        console.log('Final recent services:', recentServices);
    

    
    return {
      serviceTrends,
      warrantyStatus,
      recentPOs,
      recentServices
    };
  }, [services, projectors, purchaseOrders, serviceVisits]);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-dark-secondary">
        <AlertTriangle className="w-10 h-10 mb-4 text-red-400" />
        <p>{error}</p>
        <Button onClick={refreshData} className="dark-button-primary mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 p-8 bg-dark-bg">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark-primary">Dashboard</h1>
            <p className="text-dark-secondary">Monitor your projector warranty services and operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={refreshData}
              disabled={isLoading}
              className="dark-button-secondary gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Data
            </Button>

            <Button 
              onClick={() => {
                const reportData = [
                  { metric: 'Total Sites', value: dashboardData.sites },
                  { metric: 'Total Projectors', value: dashboardData.projectors },
                  { metric: 'Pending POs', value: dashboardData.pendingPOs },
                  { metric: 'Services This Week', value: dashboardData.servicesThisWeek }
                ];
                const csvContent = convertToCSV(reportData);
                downloadCSV(csvContent, `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
                (window as any).showToast?.({
                  type: 'success',
                  title: 'Export Successful',
                  message: 'Dashboard report exported to CSV file'
                });
              }}
              className="dark-button-secondary gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>

          </div>
        </div>

        {/* Warranty Alerts - Now handled by notification bar */}

        {/* Top-level Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Active Sites */}
          <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                <MapPin className={`w-7 h-7 text-blue-400`} />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                <span className={`text-sm font-bold text-dark-positive`}>
                  {dashboardData.sites}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-dark-primary mb-2">Active Sites</h3>
              <p className="text-sm font-medium text-dark-secondary">Total active sites</p>
            </div>
          </div>

          {/* Total Projectors */}
          <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                <Monitor className={`w-7 h-7 text-green-400`} />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                <span className={`text-sm font-bold text-dark-positive`}>
                  {dashboardData.projectors}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-dark-primary mb-2">Total Projectors</h3>
              <p className="text-sm font-medium text-dark-secondary">Total projectors in inventory</p>
            </div>
          </div>

          {/* Pending POs */}
          <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                <FileText className={`w-7 h-7 text-orange-400`} />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                <span className={`text-sm font-bold text-dark-positive`}>
                  {dashboardData.pendingPOs}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-dark-primary mb-2">Pending POs</h3>
              <p className="text-sm font-medium text-dark-secondary">Total pending purchase orders</p>
            </div>
          </div>

          {/* Services This Week */}
          <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                <Calendar className={`w-7 h-7 text-purple-400`} />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                <span className={`text-sm font-bold text-dark-positive`}>
                  {dashboardData.servicesThisWeek}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-dark-primary mb-2">Services This Week</h3>
              <p className="text-sm font-medium text-dark-secondary">Services scheduled for this week</p>
            </div>
          </div>
        </div>

        {/* AMC Contracts Metrics */}
        {amcStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total AMC Contracts */}
            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                  <FileText className={`w-7 h-7 text-blue-600`} />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                  <span className={`text-sm font-bold text-dark-positive`}>
                    {amcStats.totalContracts}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-dark-primary mb-2">AMC Contracts</h3>
                <p className="text-sm font-medium text-dark-secondary">Total maintenance contracts</p>
              </div>
            </div>

            {/* Active AMC Contracts */}
            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                  <CheckCircle className={`w-7 h-7 text-green-600`} />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                  <span className={`text-sm font-bold text-dark-positive`}>
                    {amcStats.activeContracts}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-dark-primary mb-2">Active Contracts</h3>
                <p className="text-sm font-medium text-dark-secondary">Currently active contracts</p>
              </div>
            </div>

            {/* Upcoming Services */}
            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                  <Calendar className={`w-7 h-7 text-blue-600`} />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                  <span className={`text-sm font-bold text-dark-positive`}>
                    {amcStats.upcomingServices}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-dark-primary mb-2">Upcoming Services</h3>
                <p className="text-sm font-medium text-dark-secondary">Services due in next 30 days</p>
              </div>
            </div>

            {/* Contract Value */}
            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                  <TrendingUp className={`w-7 h-7 text-green-600`} />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-4 h-4 text-dark-positive`} />
                  <span className={`text-sm font-bold text-dark-positive`}>
                    ${(amcStats.revenue.totalValue / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-dark-primary mb-2">Contract Value</h3>
                <p className="text-sm font-medium text-dark-secondary">Total contract value</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Service Trends */}
          <div className="dark-card">
            <CardHeader>
              <CardTitle className="text-dark-primary">Service Trends</CardTitle>
              <CardDescription className="text-dark-secondary">Monthly service completion vs scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {computedData.serviceTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={computedData.serviceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="scheduled" fill="#3B82F6" name="Scheduled" />
                    <Bar dataKey="completed" fill="#10B981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-dark-secondary">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mb-4 text-dark-secondary" />
                    <p className="text-sm">No service data available. Service trends will appear here when services are created.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          {/* Warranty Status */}
          <div className="dark-card">
            <CardHeader>
              <CardTitle className="text-dark-primary">Warranty Status</CardTitle>
              <CardDescription className="text-dark-secondary">Current warranty distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {computedData.warrantyStatus.some(status => status.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={computedData.warrantyStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {computedData.warrantyStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-dark-secondary">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mb-4 text-dark-secondary" />
                    <p className="text-sm">Warranty status will appear here when projectors are added</p>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* AMC Alerts */}
        {amcStats && (amcStats.overdueServices > 0 || amcStats.expiringSoon > 0) && (
          <div className="mb-10">
            <div className="dark-card">
              <CardHeader>
                <CardTitle className="text-dark-primary flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  AMC Alerts
                </CardTitle>
                <CardDescription className="text-dark-secondary">
                  Contracts requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Overdue Services */}
                  {amcStats.overdueServices > 0 && (
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-400">Overdue Services</h4>
                          <p className="text-sm text-red-300">{amcStats.overdueServices} services overdue</p>
                        </div>
                      </div>
                      <p className="text-sm text-red-300">
                        Services scheduled in the past that haven't been completed. 
                        These require immediate attention to maintain contract compliance.
                      </p>
                    </div>
                  )}

                  {/* Expiring Contracts */}
                  {amcStats.expiringSoon > 0 && (
                    <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-400">Expiring Soon</h4>
                          <p className="text-sm text-orange-300">{amcStats.expiringSoon} contracts expiring in 30 days</p>
                        </div>
                      </div>
                      <p className="text-sm text-orange-300">
                        Contracts expiring soon. Consider renewal discussions with customers.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Purchase Orders */}
          <div className="dark-card">
            <CardHeader>
              <CardTitle className="text-dark-primary">Recent Purchase Orders</CardTitle>
              <CardDescription className="text-dark-secondary">Latest purchase order activities</CardDescription>
            </CardHeader>
            <CardContent>
              {computedData.recentPOs.length > 0 ? (
                <div className="space-y-4">
                  {computedData.recentPOs.map((po) => (
                    <div key={po.id} className="flex items-center justify-between p-4 bg-dark-card-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-dark-tag rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-dark-primary font-medium">{po.site}</p>
                          <p className="text-dark-secondary text-sm">{po.projectors} projectors • {po.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-dark-primary font-medium">{po.amount}</p>
                        <Badge className={`${getStatusColor(po.status)} bg-opacity-20`}>
                          {po.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-dark-secondary">
                  <FileText className="w-12 h-12 mb-4 text-dark-secondary" />
                  <p className="text-sm">No recent purchase orders</p>
                </div>
              )}
            </CardContent>
          </div>

          {/* Recent Services */}
          <div className="dark-card">
            <CardHeader>
              <CardTitle className="text-dark-primary">Recent Services</CardTitle>
              <CardDescription className="text-dark-secondary">Latest service activities</CardDescription>
            </CardHeader>
            <CardContent>
              {computedData.recentServices.length > 0 ? (
                <div className="space-y-4">
                  {computedData.recentServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 bg-dark-card-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-dark-tag rounded-lg flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-dark-primary font-medium">{service.site}</p>
                          <p className="text-dark-secondary text-sm">{service.projector} • {service.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-dark-primary font-medium">{service.type}</p>
                        <Badge className={`${getStatusColor(service.status)} bg-opacity-20`}>
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-dark-secondary">
                  <Wrench className="w-12 h-12 mb-4 text-dark-secondary" />
                  <p className="text-sm">No recent services</p>
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </main>
    </>
  );
} 