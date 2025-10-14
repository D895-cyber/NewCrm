import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../utils/api/client";
import { DashboardKPICards } from "../components/dashboard/DashboardKPICards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { downloadCSV } from "../utils/export";
import { ProjectorsPage } from "../components/pages/ProjectorsPage";
import { RMAPage } from "../components/pages/RMAPage";
import { DTRPage } from "../components/pages/DTRPage";
import { SitesPage } from "../components/pages/SitesPage";
import {
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Package,
  FileText,
  MapPin,
  Monitor,
  Activity,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Menu,
  X,
  Home,
  ClipboardList,
  Truck,
  BarChart3,
  Settings,
  Users,
  Plus,
  Eye,
  Edit,
  Filter,
  Calendar,
  Download,
  Search,
  Loader2,
  Workflow,
  LogOut
} from "lucide-react";

interface DashboardData {
  kpis: {
    totalRMAs?: { value: number; change: number; period: string };
    activeRMAs?: { value: number; change: number; period: string };
    rmasInTransit?: { value: number; change: number; period: string };
    awaitingParts?: { value: number; change: number; period: string };
    completedThisMonth?: { value: number; change: number; period: string };
  };
  statusDistribution: {
    distribution: Array<{
      status: string;
      count: number;
      percentage: number;
      color: string;
    }>;
    total: number;
  };
  priorityQueue: {
    critical: { count: number; items: any[] };
    high: { count: number; items: any[] };
    medium: { count: number };
    low: { count: number };
  };
  recentConversions: any[];
  activeShipments: {
    outbound: { count: number; shipments: any[] };
    return: { count: number; shipments: any[] };
  };
  siteStats: {
    totalSites: number;
    sitesWithActiveRMAs: number;
    highRMASites: number;
  };
  projectorStats: {
    totalProjectors: number;
    underMaintenance: number;
    withActiveRMA: number;
  };
  slaMetrics: {
    slaCompliance: { withinSLA: number; breached: number };
    avgResolutionTime: { actual: number; target: number; unit: string; status: string };
    avgResponseTime: { actual: number; target: number; unit: string; status: string };
    customerSatisfaction: { score: number; outOf: number; totalResponses: number };
  };
  analytics: {
    monthlyTrend: any[];
    topFailureComponents: any[];
    topSites: any[];
    topModels: any[];
  };
  activityFeed: any[];
  alerts: {
    alerts: any[];
    unreadCount: number;
  };
  timestamp: string;
}

export function RMADashboardPage() {
  const { user, isAuthenticated, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rmaData, setRmaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // RMA Management states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRMA, setEditingRMA] = useState<any>(null);
  const [isLoadingRMAs, setIsLoadingRMAs] = useState(false);
  const [showSerialNumberSelector, setShowSerialNumberSelector] = useState(false);
  const [serialNumberSearch, setSerialNumberSearch] = useState("");
  const [availableProjectors, setAvailableProjectors] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Sites management state
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [siteSearchTerm, setSiteSearchTerm] = useState("");
  const [showSiteSelector, setShowSiteSelector] = useState(false);

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
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  
  
  // New RMA form state
  const [newRMA, setNewRMA] = useState({
    rmaNumber: "",
    callLogNumber: "",
    rmaOrderNumber: "",
    sxNumber: "",
    ascompRaisedDate: "",
    customerErrorDate: "",
    siteId: "",
    siteName: "",
    productName: "",
    productPartNumber: "",
    serialNumber: "",
    defectivePartNumber: "",
    defectivePartName: "",
    defectiveSerialNumber: "",
    symptoms: "",
    replacedPartNumber: "",
    replacedPartName: "",
    replacedPartSerialNumber: "",
    replacementNotes: "",
    shippedDate: "",
    trackingNumber: "",
    shippedThru: "",
    remarks: "",
    createdBy: "",
    caseStatus: "Under Review",
    rmaReturnShippedDate: "",
    rmaReturnTrackingNumber: "",
    rmaReturnShippedThru: "",
    daysCountShippedToSite: 0,
    daysCountReturnToCDS: 0,
    priority: "Medium",
    warrantyStatus: "In Warranty",
    estimatedCost: 0,
    notes: "",
    brand: "",
    projectorModel: "",
    customerSite: "",
    technician: "",
    physicalCondition: "Good",
    logicalCondition: "Good",
    issueDescription: "",
    rmaReason: "",
    approvalStatus: "Pending Review"
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation menu items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Overview and KPIs' },
    { id: 'rma-management', label: 'RMA Management', icon: ClipboardList, description: 'Manage RMAs' },
    { id: 'rma-tracking', label: 'RMA Tracking', icon: Truck, description: 'Track shipments' },
    { id: 'rma-analytics', label: 'RMA Analytics', icon: BarChart3, description: 'Reports and insights' },
    { id: 'projector-management', label: 'Projector Management', icon: Monitor, description: 'Manage projectors' },
    { id: 'site-management', label: 'Site Management', icon: MapPin, description: 'Manage sites' },
    { id: 'dtr-management', label: 'DTR Management', icon: AlertCircle, description: 'Daily Trouble Reports' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'System settings' },
    { id: 'logout', label: 'Logout', icon: LogOut, description: 'Sign out of system', isLogout: true }
  ];

  useEffect(() => {
    if (isAuthenticated && token) {
      // Ensure API client has the token before making requests
      apiClient.setAuthToken(token);
      loadDashboardData();
      loadRMAData();
      loadSites();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadDashboardData();
        loadRMAData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch dashboard data from the new public API endpoints
      const [kpisResponse, statusResponse, priorityResponse, siteStatsResponse, projectorStatsResponse, activityFeedResponse] = await Promise.all([
        apiClient.get('/dashboard/public-kpis').catch(() => ({ kpis: {} })),
        apiClient.get('/dashboard/public-status-distribution').catch(() => ({ distribution: [] })),
        apiClient.get('/dashboard/public-priority-queue').catch(() => ({ critical: { count: 0, items: [] }, high: { count: 0, items: [] }, medium: { count: 0 }, low: { count: 0 } })),
        apiClient.get('/dashboard/public-site-stats').catch(() => ({ totalSites: 0, sitesWithActiveRMAs: 0, highRMASites: 0 })),
        apiClient.get('/dashboard/public-projector-stats').catch(() => ({ totalProjectors: 0, underMaintenance: 0, withActiveRMA: 0 })),
        apiClient.get('/dashboard/public-activity-feed?useTracking=true').catch(() => ({ activities: [] }))
      ]);

      setDashboardData({
        kpis: kpisResponse.kpis || {},
        statusDistribution: statusResponse,
        priorityQueue: priorityResponse,
        recentConversions: [], // Will be populated later if needed
        activeShipments: { outbound: { count: 0, shipments: [] }, return: { count: 0, shipments: [] } }, // Will be populated later if needed
        siteStats: siteStatsResponse,
        projectorStats: projectorStatsResponse,
        slaMetrics: { slaCompliance: { withinSLA: 0, breached: 0 }, avgResolutionTime: { actual: 0, target: 7, unit: 'days', status: 'good' }, avgResponseTime: { actual: 2.1, target: 4, unit: 'hours', status: 'good' }, customerSatisfaction: { score: 0, outOf: 5, totalResponses: 0 } }, // Will be populated later if needed
        analytics: { monthlyTrend: [], topFailureComponents: [], topSites: [], topModels: [] }, // Will be populated later if needed
        activityFeed: activityFeedResponse.activities || [],
        alerts: { alerts: [], unreadCount: 0 }, // Will be populated later if needed
        timestamp: new Date().toISOString()
      });
      
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      // If it's an authentication error, try to refresh the token
      if (errorMessage.includes('Access token required') || errorMessage.includes('Unauthorized')) {
        console.log('Authentication error detected, attempting to refresh token...');
        // The AuthContext should handle token refresh automatically
      }
    } finally {
      setLoading(false);
    }
  };


  const loadRMAData = async () => {
    try {
      setIsLoadingRMAs(true);
      console.log('ðŸ” Loading RMA data for table...');
      const rmaResponse = await apiClient.getAllRMA();
      console.log('ðŸ“Š RMA data loaded:', rmaResponse.length, 'records');
      // Apply mapping function to transform backend data to frontend format
      const mappedRmaData = (rmaResponse || []).map(mapBackendDataToFrontend);
      setRmaData(mappedRmaData);
    } catch (err: any) {
      console.error('Error loading RMA data:', err);
      setRmaData([]);
    } finally {
      setIsLoadingRMAs(false);
    }
  };

  // Load available projectors for serial number selection
  useEffect(() => {
    loadAvailableProjectors();
  }, []);

  const loadAvailableProjectors = async () => {
    try {
      const projectors = await apiClient.getAllProjectors();
      setAvailableProjectors(projectors);
    } catch (err: any) {
      console.error('Error loading projectors:', err);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPriority]);

  // Filter RMAs based on search and filters
  const filteredRMAs = (rmaData || []).filter(rma => {
    const matchesSearch = (rma.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.rmaNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.defectivePartName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || (rma.caseStatus || rma.approvalStatus) === filterStatus;
    const matchesPriority = filterPriority === "All" || rma.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRMAs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRMAs = filteredRMAs.slice(startIndex, endIndex);

  // Handle serial number selection
  const handleSerialNumberSelect = (selectedProjector: any) => {
    const mapWarrantyStatus = (projectorStatus: string) => {
      switch (projectorStatus) {
        case 'Active': return 'In Warranty';
        case 'Expired': return 'Expired';
        case 'Expiring Soon': return 'Extended Warranty';
        default: return 'In Warranty';
      }
    };

    setNewRMA({
      ...newRMA,
      serialNumber: selectedProjector.serialNumber,
      productName: selectedProjector.model,
      siteName: selectedProjector.site,
      createdBy: selectedProjector.technician || 'System',
      warrantyStatus: mapWarrantyStatus(selectedProjector.warrantyStatus)
    });
    setShowSerialNumberSelector(false);
    setSerialNumberSearch("");
  };

  // Handle creating new RMA
  const handleCreateRMA = async () => {
    try {
      setIsLoadingRMAs(true);
      await apiClient.createRMA(newRMA);
      await loadRMAData();
      setShowAddModal(false);
      setNewRMA({
        rmaNumber: "",
        callLogNumber: "",
        rmaOrderNumber: "",
        sxNumber: "",
        ascompRaisedDate: "",
        customerErrorDate: "",
        siteName: "",
        productName: "",
        productPartNumber: "",
        serialNumber: "",
        defectivePartNumber: "",
        defectivePartName: "",
        defectiveSerialNumber: "",
        symptoms: "",
        replacedPartNumber: "",
        replacedPartName: "",
        replacedPartSerialNumber: "",
        replacementNotes: "",
        shippedDate: "",
        trackingNumber: "",
        shippedThru: "",
        remarks: "",
        createdBy: "",
        caseStatus: "Under Review",
        rmaReturnShippedDate: "",
        rmaReturnTrackingNumber: "",
        rmaReturnShippedThru: "",
        daysCountShippedToSite: 0,
        daysCountReturnToCDS: 0,
        priority: "Medium",
        warrantyStatus: "In Warranty",
        estimatedCost: 0,
        notes: "",
        brand: "",
        projectorModel: "",
        customerSite: "",
        technician: "",
        physicalCondition: "Good",
        logicalCondition: "Good",
        issueDescription: "",
        rmaReason: "",
        approvalStatus: "Pending Review"
      });
    } catch (err: any) {
      console.error('Error creating RMA:', err);
    } finally {
      setIsLoadingRMAs(false);
    }
  };

  // Load all sites for RMA management
  const loadSites = async () => {
    try {
      setIsLoadingSites(true);
      const response = await apiClient.get('/rma/sites');
      setSites(response.data || response);
    } catch (err: any) {
      console.error('Error loading sites:', err);
    } finally {
      setIsLoadingSites(false);
    }
  };

  // Search sites
  const searchSites = async (query: string) => {
    if (query.trim().length < 2) {
      setSites([]);
      return;
    }
    
    try {
      setIsLoadingSites(true);
      const response = await apiClient.get(`/rma/sites/search/${encodeURIComponent(query)}`);
      setSites(response.data || response);
    } catch (err: any) {
      console.error('Error searching sites:', err);
    } finally {
      setIsLoadingSites(false);
    }
  };

  // Handle site selection
  const handleSiteSelect = (site: any) => {
    setSelectedSite(site);
    setNewRMA(prev => ({
      ...prev,
      siteId: site._id,
      siteName: site.name
    }));
    setShowSiteSelector(false);
    setSiteSearchTerm("");
  };

  // Load projectors for selected site
  const loadSiteProjectors = async (siteId: string) => {
    try {
      const response = await apiClient.get(`/rma/sites/${siteId}/projectors`);
      setAvailableProjectors(response.data.projectors || []);
    } catch (err: any) {
      console.error('Error loading site projectors:', err);
    }
  };

  // Handle updating RMA
  const handleUpdateRMA = async () => {
    try {
      setIsLoadingRMAs(true);
      await apiClient.updateRMA(editingRMA._id, editingRMA);
      await loadRMAData();
      setShowEditModal(false);
      setEditingRMA(null);
    } catch (err: any) {
      console.error('Error updating RMA:', err);
    } finally {
      setIsLoadingRMAs(false);
    }
  };


  // Export RMAs to CSV
  const handleExportRMAs = () => {
    const csvData = filteredRMAs.map(rma => ({
      'RMA Number': rma.rmaNumber,
      'Site Name': rma.siteName,
      'Product': rma.productName,
      'Serial Number': rma.serialNumber,
      'Status': rma.caseStatus || rma.approvalStatus,
      'Priority': rma.priority,
      'Created Date': rma.ascompRaisedDate || rma.createdAt,
      'Defective Part': rma.defectivePartName,
      'Symptoms': rma.symptoms,
      'Technician': rma.technician || rma.createdBy
    }));
    
    downloadCSV(csvData, `rma-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Under Review': 'bg-gray-100 text-gray-800',
      'Pending Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Shipped to Site': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'Rejected': 'bg-red-100 text-red-800',
      'RMA Raised Yet to Deliver': 'bg-orange-100 text-orange-800',
      'Ready Transit to CDS': 'bg-blue-100 text-blue-800',
      'Faulty Transit to CDS': 'bg-red-100 text-red-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };



  // Safe date formatting function
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Safe time formatting function
  const formatTime = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Time formatting error:', error);
      return 'N/A';
    }
  };


  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-dark-primary">RMA Portal Dashboard</h1>
          <p className="text-dark-secondary mt-2">Welcome back, {user?.username || 'User'}</p>
          <p className="text-sm text-dark-secondary mt-1">
            Last updated: {formatTime(lastRefresh)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              loadDashboardData();
              loadRMAData();
            }}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardData && dashboardData.kpis && <DashboardKPICards kpis={dashboardData.kpis} />}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* High Priority Actions */}
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-secondary">High Priority Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-primary">
              {dashboardData?.priorityQueue ? (dashboardData.priorityQueue.critical.count + dashboardData.priorityQueue.high.count) : 0}
            </div>
            <p className="text-xs text-dark-secondary">RMAs requiring immediate attention</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Critical: {dashboardData?.priorityQueue?.critical.count || 0}</span>
                <span className="text-orange-400">High: {dashboardData?.priorityQueue?.high.count || 0}</span>
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-dark-cta hover:text-blue-300 mt-2"
              onClick={() => setActiveSection('rma-management')}
            >
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Active Shipments */}
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-secondary">Active Shipments</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-primary">
              {(dashboardData?.activeShipments?.outbound.count || 0) + (dashboardData?.activeShipments?.return.count || 0)}
            </div>
            <p className="text-xs text-dark-secondary">Currently in transit</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">Outbound ({dashboardData?.activeShipments?.outbound.count || 0})</span>
                <span className="text-dark-secondary">Return ({dashboardData?.activeShipments?.return.count || 0})</span>
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-dark-cta hover:text-blue-300 mt-2"
              onClick={() => setActiveSection('rma-tracking')}
            >
              Track All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent DTR Conversions */}
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-secondary">Recent DTR Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-primary">
              {dashboardData?.recentConversions?.length || 0}
            </div>
            <p className="text-xs text-dark-secondary">Newly converted DTRs requiring review</p>
            <div className="mt-2">
              <p className="text-sm text-dark-secondary">
                {dashboardData?.recentConversions && dashboardData?.recentConversions.length > 0 
                  ? `${dashboardData?.recentConversions.length} conversions in last 30 days`
                  : 'No recent conversions'
                }
              </p>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-dark-cta hover:text-blue-300 mt-2"
              onClick={() => setActiveSection('dtr-management')}
            >
              View All DTRs <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-secondary">Quick Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-dark-secondary">Total RMAs</span>
                  <span className="text-sm font-medium text-dark-primary">{dashboardData?.kpis?.totalRMAs?.value || 0}</span>
                </div>
                <div className="text-xs text-dark-secondary">In Transit: {dashboardData?.kpis?.rmasInTransit?.value || 0}</div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-dark-secondary">Completed</span>
                  <span className="text-sm font-medium text-dark-primary">{dashboardData?.kpis?.completedThisMonth?.value || 0}</span>
                </div>
                <div className="text-xs text-dark-secondary">Active: {dashboardData?.kpis?.activeRMAs?.value || 0}</div>
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-dark-cta hover:text-blue-300 mt-2"
              onClick={() => setActiveSection('rma-analytics')}
            >
              View Details <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRMAManagement = () => (
    <div className="h-full">
      <RMAPage />
    </div>
  );

  // OLD RMA Management function - replaced with imported RMAPage component
  const renderRMAManagementOld = () => (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-8 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-3">RMA Records</h1>
            <p className="text-xl text-blue-100 opacity-90">Showing {rmaData?.length || 0} RMA records</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setActiveSection('rma-tracking')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-orange-400/30 hover:shadow-lg"
            >
              <Workflow className="w-4 h-4" />
              Workflow Management
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Search and Filters */}
        <div className="bg-dark-card rounded-xl shadow-lg p-6 mb-8 border border-dark-color">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search RMA number, serial number, part, or site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-bg border-dark-color text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-11"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-dark-bg border border-dark-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-11 min-w-[140px]"
              >
                <option value="All">All Status</option>
                <option value="Under Review">Under Review</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="RMA Raised Yet to Deliver">RMA Raised Yet to Deliver</option>
                <option value="Ready Transit to CDS">Ready Transit to CDS</option>
                <option value="Faulty Transit to CDS">Faulty Transit to CDS</option>
                <option value="Shipped to Site">Shipped to Site</option>
                <option value="Delivered">Delivered</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 bg-dark-bg border border-dark-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-11 min-w-[140px]"
              >
                <option value="All">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            
            <Button 
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("All");
                setFilterPriority("All");
              }}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 px-6"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-dark-color">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="font-medium">Active Filters:</span>
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Search: "{searchTerm}"
                </span>
              )}
              {filterStatus !== "All" && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Status: {filterStatus}
                </span>
              )}
              {filterPriority !== "All" && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  Priority: {filterPriority}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 px-6"
              onClick={handleExportRMAs}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New RMA
            </Button>
          </div>
        </div>

        {/* RMA Table */}
        <div className="bg-dark-card rounded-lg border border-dark-color overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-dark-bg to-dark-tag border-b-2 border-dark-color">
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">RMA #</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Site & Product</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Defective Part</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Replacement Part</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Status & Priority</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Dates & Tracking</th>
                  <th className="text-center font-bold text-white py-4 px-4 text-sm uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRMAs?.map((rma: any, index: number) => (
                  <tr key={`${rma._id}-${index}`} className={`border-b border-dark-color transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-bg'
                  } hover:bg-dark-tag hover:shadow-sm`}>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="font-semibold text-blue-400 hover:text-blue-300 cursor-pointer text-base">
                          {rma.rmaNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Call: {rma.callLogNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Order: {rma.rmaOrderNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm">
                          {rma.siteName || 'N/A'}
                        </div>
                        <div className="text-gray-300 text-sm">
                          {rma.productName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300 font-mono">
                          SN: {rma.serialNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Part: {rma.productPartNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="text-white text-sm">
                          {rma.defectivePartNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Part: {rma.defectivePartName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          SN: {rma.serialNumber || 'N/A'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(rma.symptoms || '').split(',').map((symptom: string, idx: number) => (
                            <span key={idx} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                              {symptom.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="text-white text-sm">
                          {rma.replacedPartNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Part: {rma.replacedPartName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Serial: {rma.replacedPartSerialNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          {rma.replacementNotes || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(rma.caseStatus || rma.approvalStatus || 'Under Review')}>
                            {rma.caseStatus || rma.approvalStatus || 'Under Review'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-300">
                          Priority: {rma.priority || 'Medium'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Created by: {rma.createdBy || 'System'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="text-white text-sm">
                          Raised: {formatDate(rma.ascompRaisedDate || rma.createdAt)}
                        </div>
                        <div className="text-white text-sm">
                          Error: {formatDate(rma.customerErrorDate || rma.ascompRaisedDate)}
                        </div>
                        <div className="text-white text-sm">
                          Shipped: {formatDate(rma.shippedDate)}
                        </div>
                        <div className="text-xs text-gray-300">
                          Track: {rma.trackingNumber ? (
                            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                              {rma.trackingNumber}
                            </span>
                          ) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Via: {rma.shippedThru || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white p-1"
                          onClick={() => {
                            setEditingRMA(rma);
                            setShowEditModal(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white p-1"
                          onClick={() => {
                            setEditingRMA(rma);
                            setShowEditModal(true);
                          }}
                          title="Edit RMA"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-white p-1"
                          onClick={() => {
                            setEditingRMA(rma);
                            setShowEditModal(true);
                          }}
                          title="File Details"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-300">
                      {isLoadingRMAs ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading RMAs...
                        </div>
                      ) : filteredRMAs.length === 0 ? (
                        'No RMAs found matching your criteria'
                      ) : (
                        'No RMA data available'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

         {/* Pagination */}
         <div className="flex items-center justify-between">
           <p className="text-gray-300 text-sm">
             Showing {startIndex + 1}-{Math.min(endIndex, filteredRMAs?.length || 0)} of {filteredRMAs?.length || 0} RMAs
             {searchTerm || filterStatus !== "All" || filterPriority !== "All" ? (
               <span className="text-blue-500 ml-2">(filtered from {rmaData?.length || 0} total)</span>
             ) : null}
           </p>
           <div className="flex items-center space-x-2">
             <Button 
               variant="outline" 
               size="sm" 
               className="border-gray-300 text-gray-700 hover:bg-gray-50"
               onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
               disabled={currentPage === 1}
             >
               Previous
             </Button>
             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
               const pageNum = i + 1;
               return (
                 <Button 
                   key={pageNum}
                   size="sm" 
                   className={currentPage === pageNum ? "bg-blue-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
                   variant={currentPage === pageNum ? "default" : "outline"}
                   onClick={() => setCurrentPage(pageNum)}
                 >
                   {pageNum}
                 </Button>
               );
             })}
             <Button 
               variant="outline" 
               size="sm" 
               className="border-gray-300 text-gray-700 hover:bg-gray-50"
               onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
               disabled={currentPage === totalPages}
             >
               Next
             </Button>
           </div>
         </div>
      </main>
    </>
  );

  const renderRMATracking = () => (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-8 py-8 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-3">RMA Tracking</h1>
            <p className="text-xl text-green-100 opacity-90">Track RMA shipments and deliveries in real-time</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setActiveSection('rma-management')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-green-400/30 hover:shadow-lg"
            >
              <ClipboardList className="w-4 h-4" />
              Manage RMAs
            </Button>
            <Button 
              onClick={() => setActiveSection('rma-analytics')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-blue-400/30 hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button className="bg-white text-green-600 hover:bg-gray-100 px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <Search className="w-4 h-4" />
              Track by Number
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100 opacity-90">In Transit</p>
                <p className="text-3xl font-bold text-white">{dashboardData?.kpis?.rmasInTransit?.value || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100 opacity-90">Outbound</p>
                <p className="text-3xl font-bold text-white">{dashboardData?.activeShipments?.outbound.count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100 opacity-90">Return</p>
                <p className="text-3xl font-bold text-white">{dashboardData?.activeShipments?.return.count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100 opacity-90">Delivered</p>
                <p className="text-3xl font-bold text-white">{dashboardData?.kpis?.completedThisMonth?.value || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Search and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Search by RMA number, tracking number..."
                className="pl-10 pr-4 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta w-80"
              />
            </div>
            <select className="px-4 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta">
              <option value="">All Shipments</option>
              <option value="outbound">Outbound</option>
              <option value="return">Return</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="dark-button-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="dark-button-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Active Shipments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outbound Shipments */}
          <div className="bg-dark-card rounded-lg border border-dark-color p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark-primary">Outbound Shipments</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {dashboardData?.activeShipments?.outbound?.count || 0} Active
              </Badge>
            </div>
            <div className="space-y-4">
              {dashboardData?.activeShipments?.outbound?.shipments?.slice(0, 4).map((shipment: any, index: number) => (
                <div key={shipment.rmaNumber || index} className="p-4 bg-dark-hover rounded-lg border border-dark-color">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-dark-primary font-medium">{shipment.rmaNumber || `RMA-${index + 1}`}</p>
                        <p className="text-dark-secondary text-sm">Tracking: {shipment.trackingNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{shipment.status || 'In Transit'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-dark-secondary">Destination</p>
                      <p className="text-dark-primary font-medium">{shipment.destination || 'CDS'}</p>
                    </div>
                    <div>
                      <p className="text-dark-secondary">ETA</p>
                      <p className="text-dark-primary font-medium">{shipment.estimatedDelivery || `${index + 2} days`}</p>
                    </div>
                    <div>
                      <p className="text-dark-secondary">Carrier</p>
                      <p className="text-dark-primary font-medium">{shipment.carrier || 'BlueDart'}</p>
                    </div>
                    <div>
                      <p className="text-dark-secondary">Days in Transit</p>
                      <p className="text-dark-primary font-medium">{shipment.daysInTransit || index + 1} days</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="dark-button-secondary"
                      onClick={() => setActiveSection('rma-management')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View RMA
                    </Button>
                    <Button size="sm" className="dark-button-primary">
                      <Truck className="w-4 h-4 mr-1" />
                      Track
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="p-8 text-center text-dark-secondary">
                  {loading ? 'Loading shipments...' : 'No active shipments found'}
                </div>
              )}
            </div>
          </div>

          {/* Return Shipments */}
          <div className="bg-dark-card rounded-lg border border-dark-color p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark-primary">Return Shipments</h3>
              <Badge className="bg-orange-100 text-orange-800">{dashboardData?.activeShipments?.return?.count || 0} Active</Badge>
            </div>
            <div className="space-y-4">
              {dashboardData?.activeShipments?.return?.shipments?.slice(0, 4).map((shipment: any, index: number) => (
                <div key={shipment.rmaNumber || index} className="p-4 bg-dark-hover rounded-lg border border-dark-color">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-dark-primary font-medium">{shipment.rmaNumber || `RMA-${index + 1}`}</p>
                        <p className="text-dark-secondary text-sm">Tracking: {shipment.trackingNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">{shipment.status || 'Returning'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-dark-secondary">From</p>
                      <p className="text-dark-primary font-medium">{shipment.destination || 'Site'}</p>
                    </div>
                    <div>
                      <p className="text-dark-secondary">ETA</p>
                      <p className="text-dark-primary font-medium">{shipment.estimatedDelivery || `${index + 1} days`}</p>
                    </div>
                    <div>
                      <p className="text-dark-secondary">Carrier</p>
                      <p className="text-dark-primary font-medium">{shipment.carrier || 'FedEx'}</p>
                    </div>
                    <div>
                      <p className="text-dark-secondary">Days in Transit</p>
                      <p className="text-dark-primary font-medium">{shipment.daysInTransit || index + 1} days</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="dark-button-secondary"
                      onClick={() => setActiveSection('rma-management')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View RMA
                    </Button>
                    <Button size="sm" className="dark-button-primary">
                      <Truck className="w-4 h-4 mr-1" />
                      Track
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="p-8 text-center text-dark-secondary">
                  {loading ? 'Loading return shipments...' : 'No return shipments found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-dark-card rounded-lg border border-dark-color p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-dark-primary">Recent RMAs</h3>
            <Button 
              variant="outline" 
              className="dark-button-secondary"
              onClick={() => setActiveSection('rma-analytics')}
            >
              View All Analytics
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-hover">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-dark-primary">RMA Number</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-dark-primary">Destination</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-dark-primary">Last Updated</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-dark-primary">Transit Time</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-dark-primary">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-dark-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-color">
                {dashboardData?.activityFeed?.slice(0, 5).map((activity: any, index: number) => (
                  <tr key={activity.id || index} className="hover:bg-dark-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-dark-primary font-medium">{activity.rmaNumber || `RMA-${index + 1}`}</p>
                          <p className="text-dark-secondary text-sm">{activity.type || 'Activity'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-dark-primary">{activity.siteName || 'N/A'}</p>
                        <p className="text-dark-secondary text-sm">Customer Site</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-secondary">
                      {formatDate(activity.deliveredDate || activity.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${activity.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {activity.status === 'Completed' && activity.shippedDate ? 
                          `${Math.ceil((new Date(activity.deliveredDate || activity.timestamp).getTime() - new Date(activity.shippedDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                          activity.status === 'Completed' ? 'Delivered' : 'In Transit'
                        }
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${
                        activity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'Sent to CDS' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'Replacement Shipped' ? 'bg-purple-100 text-purple-800' :
                        activity.status === 'Faulty Transit to CDS' ? 'bg-orange-100 text-orange-800' :
                        activity.status === 'Replacement Received' ? 'bg-cyan-100 text-cyan-800' :
                        activity.status === 'Installation Complete' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-dark-secondary hover:text-dark-primary"
                          onClick={() => setActiveSection('rma-management')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="dark-button-primary">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-dark-secondary">
                      {loading ? 'Loading deliveries...' : 'No recent deliveries found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderRMAAnalytics = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-dark-primary">RMA Analytics</h1>
          <p className="text-dark-secondary mt-2">Reports and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="dark-button-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button className="dark-button-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-dark-primary">RMA Trends</CardTitle>
            <CardDescription className="text-dark-secondary">Monthly RMA statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
              <p className="text-dark-secondary">Chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-dark-primary">Performance Metrics</CardTitle>
            <CardDescription className="text-dark-secondary">Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-secondary">Average Resolution Time</span>
                <span className="text-dark-primary font-bold">{dashboardData?.slaMetrics?.avgResolutionTime?.actual || 0} {dashboardData?.slaMetrics?.avgResolutionTime?.unit || 'days'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-secondary">SLA Compliance</span>
                <span className="text-dark-primary font-bold">{dashboardData?.slaMetrics?.slaCompliance?.withinSLA || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-secondary">Customer Satisfaction</span>
                <span className="text-dark-primary font-bold">{dashboardData?.slaMetrics?.customerSatisfaction?.score || 0}/{dashboardData?.slaMetrics?.customerSatisfaction?.outOf || 5}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProjectorManagement = () => (
    <div className="h-full">
      <ProjectorsPage />
    </div>
  );

  const renderSiteManagement = () => (
    <div className="h-full">
      <SitesPage />
    </div>
  );

  const renderDTRManagement = () => (
    <div className="h-full">
      <DTRPage />
    </div>
  );

  // OLD DTR Management function - replaced with imported DTRPage component
  const renderDTRManagementOld = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">DTR Management</h1>
          <p className="text-gray-400 mt-1">Daily Trouble Reports</p>
        </div>
        <div className="flex space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New DTR
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent DTRs</CardTitle>
              <CardDescription className="text-gray-400">Latest trouble reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <div>
                        <p className="text-white font-medium">DTR-2025-{item.toString().padStart(3, '0')}</p>
                        <p className="text-gray-400 text-sm">Projector XYZ-{item}23 - Display Issue</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        In Progress
                      </Badge>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">DTR Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Open</span>
                  <span className="text-white font-bold">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">In Progress</span>
                  <span className="text-white font-bold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Resolved</span>
                  <span className="text-white font-bold">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Converted to RMA</span>
                  <span className="text-white font-bold">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );


  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">System configuration and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">General Settings</CardTitle>
            <CardDescription className="text-gray-400">Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300 font-medium">System Name</span>
                <span className="text-white font-semibold bg-gray-700 px-3 py-1 rounded-md">RMA Portal</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300 font-medium">Version</span>
                <span className="text-white font-semibold bg-gray-700 px-3 py-1 rounded-md">1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300 font-medium">Environment</span>
                <span className="text-white font-semibold bg-gray-700 px-3 py-1 rounded-md">Production</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Notification Settings</CardTitle>
            <CardDescription className="text-gray-400">Configure alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300 font-medium">Email Notifications</span>
                <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                  Enabled
                </Button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300 font-medium">SMS Alerts</span>
                <Button size="sm" variant="outline" className="border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white">
                  Disabled
                </Button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300 font-medium">Push Notifications</span>
                <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                  Enabled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Add RMA Modal
  const renderAddRMAModal = () => (
    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New RMA</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rmaNumber">RMA Number</Label>
            <Input
              id="rmaNumber"
              value={newRMA.rmaNumber}
              onChange={(e) => setNewRMA({...newRMA, rmaNumber: e.target.value})}
              placeholder="Enter RMA number"
            />
          </div>
          <div>
            <Label htmlFor="siteName">Site</Label>
            <div className="flex space-x-2">
              <Input
                id="siteName"
                value={newRMA.siteName}
                onChange={(e) => setNewRMA({...newRMA, siteName: e.target.value})}
                placeholder="Enter site name or click Select"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSiteSelector(true)}
              >
                Select Site
              </Button>
            </div>
            {selectedSite && (
              <div className="mt-2 p-2 bg-dark-hover rounded text-sm">
                <div className="text-white font-medium">{selectedSite.name}</div>
                <div className="text-gray-300 text-xs">
                  {selectedSite.siteCode} • {selectedSite.region} • {selectedSite.state}
                </div>
                <div className="text-gray-300 text-xs">
                  Projectors: {selectedSite.totalProjectors || 0} total, {selectedSite.activeProjectors || 0} active
                </div>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={newRMA.productName}
              onChange={(e) => setNewRMA({...newRMA, productName: e.target.value})}
              placeholder="Enter product name"
            />
          </div>
          <div>
            <Label htmlFor="serialNumber">Serial Number</Label>
            <div className="flex space-x-2">
              <Input
                id="serialNumber"
                value={newRMA.serialNumber}
                onChange={(e) => setNewRMA({...newRMA, serialNumber: e.target.value})}
                placeholder="Enter serial number"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSerialNumberSelector(true)}
              >
                Select
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={newRMA.priority} onValueChange={(value) => setNewRMA({...newRMA, priority: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="caseStatus">Status</Label>
             <Select value={newRMA.caseStatus} onValueChange={(value) => setNewRMA({...newRMA, caseStatus: value})}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="Under Review">Under Review</SelectItem>
                 <SelectItem value="Pending Review">Pending Review</SelectItem>
                 <SelectItem value="Approved">Approved</SelectItem>
                 <SelectItem value="Rejected">Rejected</SelectItem>
                 <SelectItem value="Completed">Completed</SelectItem>
                 <SelectItem value="RMA Raised Yet to Deliver">RMA Raised Yet to Deliver</SelectItem>
                 <SelectItem value="Ready Transit to CDS">Ready Transit to CDS</SelectItem>
                 <SelectItem value="Faulty Transit to CDS">Faulty Transit to CDS</SelectItem>
                 <SelectItem value="Shipped to Site">Shipped to Site</SelectItem>
                 <SelectItem value="Delivered">Delivered</SelectItem>
                 <SelectItem value="Closed">Closed</SelectItem>
               </SelectContent>
             </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="symptoms">Symptoms/Issue Description</Label>
            <Textarea
              id="symptoms"
              value={newRMA.symptoms}
              onChange={(e) => setNewRMA({...newRMA, symptoms: e.target.value})}
              placeholder="Describe the issue or symptoms"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newRMA.notes}
              onChange={(e) => setNewRMA({...newRMA, notes: e.target.value})}
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateRMA} disabled={isLoadingRMAs}>
            {isLoadingRMAs ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create RMA'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Edit RMA Modal
  const renderEditRMAModal = () => (
    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit RMA</DialogTitle>
        </DialogHeader>
        {editingRMA && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-rmaNumber">RMA Number</Label>
              <Input
                id="edit-rmaNumber"
                value={editingRMA.rmaNumber || ''}
                onChange={(e) => setEditingRMA({...editingRMA, rmaNumber: e.target.value})}
                placeholder="Enter RMA number"
              />
            </div>
            <div>
              <Label htmlFor="edit-siteName">Site Name</Label>
              <Input
                id="edit-siteName"
                value={editingRMA.siteName || ''}
                onChange={(e) => setEditingRMA({...editingRMA, siteName: e.target.value})}
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="edit-productName">Product Name</Label>
              <Input
                id="edit-productName"
                value={editingRMA.productName || ''}
                onChange={(e) => setEditingRMA({...editingRMA, productName: e.target.value})}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="edit-serialNumber">Serial Number</Label>
              <Input
                id="edit-serialNumber"
                value={editingRMA.serialNumber || ''}
                onChange={(e) => setEditingRMA({...editingRMA, serialNumber: e.target.value})}
                placeholder="Enter serial number"
              />
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={editingRMA.priority || 'Medium'} onValueChange={(value) => setEditingRMA({...editingRMA, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-caseStatus">Status</Label>
               <Select value={editingRMA.caseStatus || editingRMA.approvalStatus || 'Under Review'} onValueChange={(value) => setEditingRMA({...editingRMA, caseStatus: value})}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Under Review">Under Review</SelectItem>
                   <SelectItem value="Pending Review">Pending Review</SelectItem>
                   <SelectItem value="Approved">Approved</SelectItem>
                   <SelectItem value="Rejected">Rejected</SelectItem>
                   <SelectItem value="Completed">Completed</SelectItem>
                   <SelectItem value="RMA Raised Yet to Deliver">RMA Raised Yet to Deliver</SelectItem>
                   <SelectItem value="Ready Transit to CDS">Ready Transit to CDS</SelectItem>
                   <SelectItem value="Faulty Transit to CDS">Faulty Transit to CDS</SelectItem>
                   <SelectItem value="Shipped to Site">Shipped to Site</SelectItem>
                   <SelectItem value="Delivered">Delivered</SelectItem>
                   <SelectItem value="Closed">Closed</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-symptoms">Symptoms/Issue Description</Label>
              <Textarea
                id="edit-symptoms"
                value={editingRMA.symptoms || editingRMA.issueDescription || ''}
                onChange={(e) => setEditingRMA({...editingRMA, symptoms: e.target.value})}
                placeholder="Describe the issue or symptoms"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editingRMA.notes || ''}
                onChange={(e) => setEditingRMA({...editingRMA, notes: e.target.value})}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateRMA} disabled={isLoadingRMAs}>
            {isLoadingRMAs ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update RMA'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Serial Number Selector Modal
  const renderSerialNumberSelector = () => (
    <Dialog open={showSerialNumberSelector} onOpenChange={setShowSerialNumberSelector}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Projector Serial Number</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="serialSearch">Search Projectors</Label>
            <Input
              id="serialSearch"
              value={serialNumberSearch}
              onChange={(e) => setSerialNumberSearch(e.target.value)}
              placeholder="Search by serial number, model, or site..."
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {availableProjectors
              .filter(projector => 
                projector.serialNumber?.toLowerCase().includes(serialNumberSearch.toLowerCase()) ||
                projector.model?.toLowerCase().includes(serialNumberSearch.toLowerCase()) ||
                projector.site?.toLowerCase().includes(serialNumberSearch.toLowerCase())
              )
              .slice(0, 20)
              .map((projector) => (
                <div
                  key={projector._id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSerialNumberSelect(projector)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{projector.serialNumber}</p>
                      <p className="text-sm text-gray-600">{projector.model} - {projector.site}</p>
                    </div>
                    <Badge variant="outline">{projector.warrantyStatus}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSerialNumberSelector(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Site Selector Modal
  const renderSiteSelector = () => (
    <Dialog open={showSiteSelector} onOpenChange={setShowSiteSelector}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Site</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="siteSearch">Search Sites</Label>
            <Input
              id="siteSearch"
              value={siteSearchTerm}
              onChange={(e) => {
                setSiteSearchTerm(e.target.value);
                searchSites(e.target.value);
              }}
              placeholder="Search by site name, code, region, state, city..."
            />
          </div>
          
          {isLoadingSites ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sites.map((site) => (
                <div
                  key={site._id}
                  className="p-4 border border-dark-color rounded-lg hover:bg-dark-hover cursor-pointer transition-colors"
                  onClick={() => handleSiteSelect(site)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{site.name}</h3>
                      <div className="text-gray-300 text-sm mt-1">
                        <div>Code: {site.siteCode}</div>
                        <div>Region: {site.region} • State: {site.state}</div>
                        {site.address && (
                          <div>Address: {site.address.city}, {site.address.pincode}</div>
                        )}
                        {site.contactPerson && (
                          <div>Contact: {site.contactPerson.name} ({site.contactPerson.email})</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-300">
                      <div>Projectors: {site.totalProjectors || 0}</div>
                      <div>Active: {site.activeProjectors || 0}</div>
                      <div>Type: {site.siteType}</div>
                    </div>
                  </div>
                </div>
              ))}
              {sites.length === 0 && siteSearchTerm && (
                <div className="text-center py-8 text-gray-400">
                  No sites found matching "{siteSearchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSiteSelector(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'rma-management':
        return renderRMAManagement();
      case 'rma-tracking':
        return renderRMATracking();
      case 'rma-analytics':
        return renderRMAAnalytics();
      case 'projector-management':
        return renderProjectorManagement();
      case 'site-management':
        return renderSiteManagement();
      case 'dtr-management':
        return renderDTRManagement();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <Card className="w-96 dark-card">
          <CardHeader>
            <CardTitle className="text-dark-primary">Authentication Required</CardTitle>
            <CardDescription className="text-dark-secondary">Please log in to access the RMA Dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-bg border-b border-dark-color p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => {
              window.location.hash = '';
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }}
            variant="ghost"
            size="sm"
            className="text-dark-secondary hover:text-dark-primary p-1"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark-primary">RMA Portal</h1>
            <p className="text-xs text-dark-secondary">Return Management System</p>
          </div>
        </div>
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="ghost"
          size="sm"
          className="text-dark-secondary hover:text-dark-primary"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out' : 'w-72'} bg-dark-bg border-r border-dark-color flex flex-col ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}>
        {/* Logo */}
        <div className={`${isMobile ? 'pt-20' : ''} p-8 border-b border-dark-color`}>
        <div className="flex items-center space-x-4">
          {user?.role !== 'rma_handler' && (
            <Button
              onClick={() => {
                window.location.hash = '';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }}
              variant="ghost"
              size="sm"
              className="text-dark-secondary hover:text-dark-primary p-1"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
          )}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center dark-shadow-lg relative overflow-hidden">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-primary">RMA Portal</h1>
              <p className="text-xs text-dark-secondary font-medium">Return Management System</p>
            </div>
          </div>
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-dark-color">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-dark-secondary" />
                <div className="flex flex-col">
                  <span className="text-sm text-dark-secondary">
                    {user?.profile?.firstName || user?.username}
                  </span>
                  <span className="text-xs text-dark-secondary">
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-dark-secondary hover:text-red-400 hover:bg-red-900/20 p-2"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isLogout = item.isLogout;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isLogout) {
                      logout();
                    } else {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`dark-nav-item w-full text-left ${
                    isActive ? "dark-nav-item-active" : ""
                  } ${isLogout ? "hover:text-red-400 hover:bg-red-900/20" : ""}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-dark-primary" : "text-dark-secondary"} ${isLogout ? "text-red-400" : ""}`} />
                  <div>
                    <div className={`font-medium ${isLogout ? "text-red-400" : ""}`}>{item.label}</div>
                    <div className="text-xs text-dark-secondary">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Content with proper spacing for mobile header */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'pt-20' : ''}`}>
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderAddRMAModal()}
      {renderEditRMAModal()}
      {renderSerialNumberSelector()}
      {renderSiteSelector()}
    </div>
  );
}
