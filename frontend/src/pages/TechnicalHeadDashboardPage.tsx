import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { apiClient } from '../utils/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Monitor,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  RefreshCw,
  BarChart3,
  UserCheck,
  Activity,
  Menu,
  ClipboardList,
  Home,
  X,
  User,
  LogOut,
  Wrench,
  Settings,
  Package,
  Camera,
  FileImage,
  PenTool,
  MapPin as LocationIcon,
  Phone,
  Mail,
  DollarSign,
  Clock as TimeIcon,
  Car,
  Utensils,
  Bed,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

interface FSE {
  _id: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  assignedTerritory: string[];
  specialization: string[];
  status: 'active' | 'inactive';
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  lastActivity: string;
}

interface ServiceReport {
  _id: string;
  visitId: string;
  visitType: string;
  fseId: string;
  fseName: string;
  siteName: string;
  siteAddress?: string;
  projectorSerial: string;
  projectorModel: string;
  scheduledDate: string;
  actualDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  priority: string;
  description?: string;
  workPerformed?: string;
  partsUsed: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    cost: number;
  }>;
  totalCost: number;
  issuesFound: Array<{
    description: string;
    severity: string;
    resolved: boolean;
  }>;
  recommendations: Array<{
    description: string;
    priority: string;
  }>;
  nextVisitDate?: string;
  travelDistance?: number;
  travelTime?: number;
  expenses: {
    fuel?: number;
    food?: number;
    accommodation?: number;
    other?: number;
  };
  customerFeedback?: {
    rating: number;
    comments: string;
  };
  workflowStatus: {
    photosCaptured: boolean;
    serviceCompleted: boolean;
    reportGenerated: boolean;
    signatureCaptured: boolean;
    completed: boolean;
    lastUpdated: string;
  };
  photoCategories: {
    beforeService: Array<any>;
    duringService: Array<any>;
    afterService: Array<any>;
    issuesFound: Array<any>;
    partsUsed: Array<any>;
  };
  digitalSignature?: {
    siteInCharge?: {
      name: string;
      designation: string;
      signature: string;
      timestamp: string;
      location?: {
        latitude: number;
        longitude: number;
        address: string;
      };
      verified: boolean;
    };
    fse?: {
      name: string;
      signature: string;
      timestamp: string;
      location?: {
        latitude: number;
        longitude: number;
        address: string;
      };
    };
  };
  siteInCharge?: {
    name: string;
    phone: string;
    email: string;
    designation: string;
    department: string;
  };
  photos: Array<{
    filename: string;
    originalName: string;
    path: string;
    cloudUrl: string;
    publicId: string;
    uploadedAt: string;
    description: string;
    category: string;
    fileSize: number;
    mimeType: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface DTR {
  _id: string;
  rmaNumber: string;
  siteName: string;
  serialNumber: string;
  symptoms?: string;
  complaintDescription?: string;
  issueDescription?: string;
  description?: string;
  notes?: string;
  ascompRaisedDate?: string;
  customerErrorDate?: string;
  createdAt?: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  assignedBy?: string;
  technician?: string;
  resolution?: string;
  resolvedDate?: string;
}

export function TechnicalHeadDashboardPage() {
  const { user, isAuthenticated, token, logout } = useAuth();
  const { 
    fses, 
    serviceVisits, 
    rma, 
    isLoading: dataLoading, 
    refreshData, 
    refreshFSEs, 
    refreshServiceVisits, 
    refreshRMA 
  } = useData();
  
  // Add DTR-specific state
  const [dtrs, setDtrs] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDTR, setSelectedDTR] = useState<DTR | null>(null);
  const [isDTRDialogOpen, setIsDTRDialogOpen] = useState(false);
  const [selectedServiceVisit, setSelectedServiceVisit] = useState<ServiceReport | null>(null);
  const [isServiceVisitDialogOpen, setIsServiceVisitDialogOpen] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      apiClient.setAuthToken(token);
      loadDashboardData();
      // Also load DTRs directly to ensure they're loaded
      loadDTRs();
    }
  }, [isAuthenticated, token]);

  // Auto-refresh dashboard data when RMA data changes
  useEffect(() => {
    if (rma.length > 0) {
      console.log('RMA data changed, refreshing dashboard...');
      // Small delay to ensure data is fully loaded
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rma]);

  // Auto-refresh DTR data when assignments are made
  useEffect(() => {
    if (dtrs.length > 0) {
      console.log('DTR data changed, updating dashboard counts...');
    }
  }, [dtrs]);

  const loadDTRs = async () => {
    try {
      console.log('🔄 Loading DTR data for technical head dashboard...');
      console.log('API Client base URL:', apiClient.getBaseUrl());
      console.log('Current token:', token ? 'Present' : 'Missing');
      console.log('User role:', user?.role);
      console.log('User ID:', user?.userId);
      
      console.log('📡 Making DTR API call...');
      
      // Try a simple DTR endpoint first to test connectivity
      try {
        const testResponse = await apiClient.get('/dtr');
        console.log('🧪 Test DTR API call result:', testResponse);
        console.log('🧪 Test response type:', typeof testResponse);
        console.log('🧪 Test response keys:', testResponse ? Object.keys(testResponse) : 'No response');
      } catch (testError) {
        console.error('❌ Test DTR API call failed:', testError);
        console.error('❌ Test error details:', {
          message: testError.message,
          status: testError.response?.status,
          data: testError.response?.data
        });
      }
      
      const response = await apiClient.get('/dtr?page=1&limit=1000'); // Get all DTRs with pagination
      console.log('✅ DTR API call completed');
      console.log('DTR API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'No response');
      
      // Check if response is null or undefined
      if (!response) {
        console.error('DTR API returned null/undefined response');
        setDtrs([]);
        return;
      }
      
      if (response && response.dtrs) {
        setDtrs(response.dtrs);
        console.log('DTRs loaded:', response.dtrs.length);
        console.log('Total DTRs in database:', response.total);
        console.log('DTR statuses:', response.dtrs.map((dtr: any) => ({ 
          caseId: dtr.caseId, 
          status: dtr.status, 
          assignedTo: dtr.assignedTo,
          assignedToDetails: dtr.assignedToDetails
        })));
        
        // Debug: Check for DTRs assigned to current technical head
        const currentUserId = user?.userId;
        const currentUsername = user?.username;
        console.log('Current user info:', { userId: currentUserId, username: currentUsername });
        console.log('Full user object:', user);
        console.log('User object keys:', user ? Object.keys(user) : 'No user object');
        
        const assignedDTRs = response.dtrs.filter((dtr: any) => {
          const isAssignedToCurrentUser = dtr.assignedTo && (
            (typeof dtr.assignedTo === 'string' && dtr.assignedTo === currentUserId) ||
            (typeof dtr.assignedTo === 'object' && dtr.assignedTo.name && dtr.assignedTo.name === currentUsername)
          );
          return isAssignedToCurrentUser;
        });
        console.log('DTRs assigned to current technical head:', assignedDTRs.length);
        console.log('Current user assigned DTRs details:', assignedDTRs.map((dtr: any) => ({
          caseId: dtr.caseId,
          status: dtr.status,
          assignedTo: dtr.assignedTo,
          assignedToType: typeof dtr.assignedTo,
          assignedToDetails: dtr.assignedToDetails
        })));
        
        // Temporary debug: If no DTRs found for current user, show all assigned DTRs
        if (assignedDTRs.length === 0 && allAssignedDTRs.length > 0) {
          console.log('⚠️ No DTRs found for current user, but there are assigned DTRs. Showing all assigned DTRs for debugging.');
          console.log('This suggests a user ID/username mismatch. Check the comparison above.');
        }
        
        // Debug: Show detailed comparison for each assigned DTR
        allAssignedDTRs.forEach((dtr: any, index: number) => {
          console.log(`DTR ${index + 1} (${dtr.caseId}) assignment analysis:`, {
            dtrAssignedTo: dtr.assignedTo,
            dtrAssignedToType: typeof dtr.assignedTo,
            currentUserId: currentUserId,
            currentUsername: currentUsername,
            userIdMatch: dtr.assignedTo === currentUserId,
            usernameMatch: dtr.assignedTo?.name === currentUsername,
            assignedToDetails: dtr.assignedToDetails
          });
        });
        
        // Debug: Check all statuses
        const statusCounts = response.dtrs.reduce((acc: any, dtr: any) => {
          acc[dtr.status] = (acc[dtr.status] || 0) + 1;
          return acc;
        }, {});
        console.log('DTR status counts:', statusCounts);
        
      } else if (Array.isArray(response)) {
        // Handle case where API returns array directly
        setDtrs(response);
        console.log('DTRs loaded (array response):', response.length);
        console.log('DTR statuses:', response.map((dtr: any) => ({ 
          caseId: dtr.caseId, 
          status: dtr.status, 
          assignedTo: dtr.assignedTo 
        })));
        
        // Debug: Check for DTRs assigned to current technical head
        const currentUserId = user?.userId;
        const currentUsername = user?.username;
        console.log('Current user info (array response):', { userId: currentUserId, username: currentUsername });
        
        const assignedDTRs = response.filter((dtr: any) => {
          const isAssignedToCurrentUser = dtr.assignedTo && (
            (typeof dtr.assignedTo === 'string' && dtr.assignedTo === currentUserId) ||
            (typeof dtr.assignedTo === 'object' && dtr.assignedTo.name && dtr.assignedTo.name === currentUsername)
          );
          return isAssignedToCurrentUser;
        });
        console.log('DTRs assigned to current technical head (array response):', assignedDTRs.length);
      } else {
        console.warn('Unexpected DTR response structure:', response);
        setDtrs([]);
      }
    } catch (error) {
      console.error('Error loading DTRs:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setDtrs([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await refreshData();
      await loadDTRs(); // Load DTR data specifically
      
      // Debug: Log the actual data structure
      console.log('RMA Data:', rma.slice(0, 2)); // Log first 2 RMA items
      console.log('Service Visits Data:', serviceVisits.slice(0, 2)); // Log first 2 service visits
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDTR = async (dtrId: string, technicianId: string) => {
    try {
      const response = await apiClient.put(`/dtr/${dtrId}/assign`, {
        assignedTo: technicianId,
        assignedBy: user?.userId,
        status: 'In Progress'
      });

      if (response.success) {
        await loadDTRs(); // Refresh DTR data specifically
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error assigning DTR:', error);
    }
  };

  const handleResolveDTR = async (dtrId: string, resolution: string) => {
    try {
      const response = await apiClient.put(`/dtr/${dtrId}/resolve`, {
        resolution,
        resolvedDate: new Date().toISOString(),
        status: 'Closed'
      });

      if (response.success) {
        await loadDTRs(); // Refresh DTR data specifically
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error resolving DTR:', error);
    }
  };

  const handleFinalizeDTR = async (dtrId: string, resolution: string, notes: string) => {
    try {
      // For now, we'll use a default RMA handler - in a real scenario, you'd get this from user selection
      const response = await apiClient.post(`/dtr/${dtrId}/finalize-by-technical-head`, {
        resolution,
        notes,
        rmaHandlerId: 'default-rma-handler', // This should be selected by the user
        rmaHandlerName: 'RMA Handler',
        rmaHandlerEmail: 'rma@example.com'
      });

      if (response.success) {
        await loadDTRs(); // Refresh DTR data specifically
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error finalizing DTR:', error);
    }
  };

  const handleViewDTR = (dtr: DTR) => {
    console.log('DTR Data Structure:', dtr);
    console.log('Available fields:', Object.keys(dtr));
    setSelectedDTR(dtr);
    setIsDTRDialogOpen(true);
  };

  const handleViewServiceVisit = (visit: ServiceReport) => {
    console.log('Service Visit Data Structure:', visit);
    console.log('Available fields:', Object.keys(visit));
    setSelectedServiceVisit(visit);
    setIsServiceVisitDialogOpen(true);
  };

  const handleNavigateToPage = (page: string) => {
    console.log('Navigating to page:', page);
    switch (page) {
      case 'rma-management':
        window.location.hash = '#rma-management';
        break;
      case 'dtr-management':
        window.location.hash = '#dtr-management';
        break;
      case 'rma-dashboard':
        window.location.hash = '#rma-dashboard';
        break;
      case 'dashboard':
        window.location.hash = '#dashboard';
        break;
      default:
        console.log('Unknown page:', page);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in-progress':
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'inactive':
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) {
      return 'Not Available';
    }
    
    // Debug logging to see what we're getting
    console.log('Formatting date:', dateString, 'Type:', typeof dateString);
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('Invalid date detected:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'Not Available';
    return timeString;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const renderDashboard = () => {
    const totalFSEs = fses.length;
    const activeFSEs = fses.filter(fse => fse.status === 'active').length;
    const totalReports = serviceVisits.length;
    const pendingDTRs = dtrs.filter(dtr => {
      // Only count DTRs assigned to current technical head that are pending
      const isAssignedToCurrentUser = dtr.assignedTo && (
        (typeof dtr.assignedTo === 'string' && dtr.assignedTo === user?.userId) ||
        (typeof dtr.assignedTo === 'object' && dtr.assignedTo.name && dtr.assignedTo.name === user?.username)
      );
      return dtr.status === 'Open' && isAssignedToCurrentUser;
    }).length;
    const assignedDTRs = dtrs.filter(dtr => {
      // Check if DTR is assigned to the current technical head user
      const isAssignedToCurrentUser = dtr.assignedTo && (
        (typeof dtr.assignedTo === 'string' && dtr.assignedTo === user?.userId) ||
        (typeof dtr.assignedTo === 'object' && dtr.assignedTo.name && dtr.assignedTo.name === user?.username)
      );
      // Count DTRs assigned to current technical head regardless of status
      return isAssignedToCurrentUser;
    }).length;
    
    // Temporary fallback: If no DTRs found for current user, show all assigned DTRs for debugging
    const allAssignedDTRsCount = dtrs.filter(dtr => dtr.assignedTo).length;
    const finalAssignedDTRsCount = assignedDTRs > 0 ? assignedDTRs : allAssignedDTRsCount;
    const readyForRMA = dtrs.filter(dtr => {
      // Only count DTRs assigned to current technical head that are ready for RMA
      const isAssignedToCurrentUser = dtr.assignedTo && (
        (typeof dtr.assignedTo === 'string' && dtr.assignedTo === user?.userId) ||
        (typeof dtr.assignedTo === 'object' && dtr.assignedTo.name && dtr.assignedTo.name === user?.username)
      );
      return dtr.status === 'Ready for RMA' && isAssignedToCurrentUser;
    }).length;
    
    // Debug: Log assignment counts
    console.log('Dashboard Assignment Debug:');
    console.log('Total DTR items:', dtrs.length);
    console.log('Pending DTRs:', pendingDTRs);
    console.log('Assigned DTRs:', assignedDTRs);
    console.log('Ready for RMA:', readyForRMA);
    console.log('All DTR statuses:', dtrs.map(dtr => ({ 
      caseId: dtr.caseId, 
      status: dtr.status, 
      assignedTo: dtr.assignedTo 
    })));

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-dark-card border-dark-color">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-primary">Total FSEs</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{totalFSEs}</div>
              <p className="text-xs text-dark-secondary">
                {activeFSEs} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-color">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-primary">Service Reports</CardTitle>
              <FileText className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{totalReports}</div>
              <p className="text-xs text-dark-secondary">
                All time reports
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-color">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-primary">Pending DTRs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{pendingDTRs}</div>
              <p className="text-xs text-dark-secondary">
                Need assignment
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-color">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-primary">Assigned DTRs</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{finalAssignedDTRsCount}</div>
              <p className="text-xs text-dark-secondary">
                Assigned to technical heads
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-color">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-primary">Ready for RMA</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{readyForRMA}</div>
              <p className="text-xs text-dark-secondary">
                Completed by technical head
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-dark-card border-dark-color">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-dark-primary">
                <Activity className="h-5 w-5" />
                Recent Service Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceVisits.slice(0, 5).map((visit) => (
                  <div key={visit._id} className="flex items-center justify-between p-3 bg-dark-hover rounded-lg">
                    <div>
                      <p className="font-medium text-dark-primary">{visit.visitId}</p>
                      <p className="text-sm text-dark-secondary">{visit.siteName}</p>
                      <p className="text-xs text-dark-secondary">{visit.fseName}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(visit.status)}>
                        {visit.status}
                      </Badge>
                      <p className="text-xs text-dark-secondary mt-1">
                        {formatDate(visit.actualDate || visit.scheduledDate || visit.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-color">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-dark-primary">
                <AlertTriangle className="h-5 w-5" />
                Recent DTRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rma.slice(0, 5).map((dtr) => (
                  <div key={dtr._id} className="flex items-center justify-between p-3 bg-dark-hover rounded-lg">
                    <div>
                      <p className="font-medium text-dark-primary">{dtr.rmaNumber}</p>
                      <p className="text-sm text-dark-secondary">{dtr.siteName}</p>
                      <p className="text-xs text-dark-secondary">{dtr.serialNumber}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(dtr.status)}>
                        {dtr.status}
                      </Badge>
                      <Badge className={getPriorityColor(dtr.priority)}>
                        {dtr.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderFSEManagement = () => {
    const filteredFSEs = fses.filter(fse => 
      fse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fse.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fse.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark-primary">FSE Management</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary h-4 w-4" />
              <Input
                placeholder="Search FSEs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-dark-card border-dark-color text-dark-primary placeholder-dark-secondary"
              />
            </div>
            <Button onClick={loadDashboardData} variant="outline" className="border-dark-color text-dark-primary hover:bg-dark-hover">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredFSEs.map((fse) => (
            <Card key={fse._id} className="bg-dark-card border-dark-color">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-dark-primary">{fse.name}</h3>
                      <p className="text-dark-secondary">{fse.email}</p>
                      <p className="text-sm text-dark-secondary">{fse.employeeId} • {fse.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-dark-secondary">Total Visits</p>
                      <p className="font-semibold text-dark-primary">{fse.totalVisits || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-dark-secondary">Completed</p>
                      <p className="font-semibold text-green-400">{fse.completedVisits || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-dark-secondary">Pending</p>
                      <p className="font-semibold text-orange-400">{fse.pendingVisits || 0}</p>
                    </div>
                    <Badge className={getStatusColor(fse.status)}>
                      {fse.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderServiceReports = () => {
    const filteredReports = serviceVisits.filter(visit => 
      visit.visitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.fseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark-primary">Service Reports</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary h-4 w-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-dark-card border-dark-color text-dark-primary placeholder-dark-secondary"
              />
            </div>
            <Button variant="outline" className="border-dark-color text-dark-primary hover:bg-dark-hover">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card className="bg-dark-card border-dark-color">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">
                      Report Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">
                      FSE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-dark-card divide-y divide-dark-color">
                  {filteredReports.map((visit) => (
                    <tr key={visit._id} className="hover:bg-dark-hover">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-primary">{visit.visitId}</div>
                        <div className="text-sm text-dark-secondary">{visit.visitType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-primary">{visit.siteName}</div>
                        <div className="text-sm text-dark-secondary">{visit.projectorSerial}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-primary">{visit.fseName}</div>
                        <div className="text-sm text-dark-secondary">{visit.fseId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                        {formatDate(visit.actualDate || visit.scheduledDate || visit.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(visit.status)}>
                          {visit.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-dark-secondary hover:text-dark-primary"
                          onClick={() => handleViewServiceVisit(visit)}
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
    );
  };

  const renderDTRManagement = () => {
    const filteredDTRs = dtrs.filter(dtr => {
      // Only show DTRs assigned to current technical head
      const isAssignedToCurrentUser = dtr.assignedTo && (
        (typeof dtr.assignedTo === 'string' && dtr.assignedTo === user?.userId) ||
        (typeof dtr.assignedTo === 'object' && dtr.assignedTo.name && dtr.assignedTo.name === user?.username)
      );
      
      // Apply search filter
      const matchesSearch = (dtr.caseId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dtr.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dtr.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return isAssignedToCurrentUser && matchesSearch;
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark-primary">DTR Management</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary h-4 w-4" />
              <Input
                placeholder="Search DTRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-dark-card border-dark-color text-dark-primary placeholder-dark-secondary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-dark-color rounded-md bg-dark-card text-dark-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredDTRs.map((dtr) => (
            <Card key={dtr._id} className="bg-dark-card border-dark-color">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg text-dark-primary">{dtr.rmaNumber}</h3>
                      <Badge className={getStatusColor(dtr.status)}>
                        {dtr.status}
                      </Badge>
                      <Badge className={getPriorityColor(dtr.priority)}>
                        {dtr.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-dark-secondary">Site: <span className="font-medium text-dark-primary">{dtr.siteName}</span></p>
                        <p className="text-dark-secondary">Projector: <span className="font-medium text-dark-primary">{dtr.serialNumber}</span></p>
                      </div>
                      <div>
                        <p className="text-dark-secondary">Reported: <span className="font-medium text-dark-primary">{formatDate(dtr.ascompRaisedDate || dtr.customerErrorDate || dtr.createdAt)}</span></p>
                        {dtr.assignedTo && (
                          <p className="text-dark-secondary">Assigned to: <span className="font-medium text-dark-primary">
                            {typeof dtr.assignedTo === 'string' ? dtr.assignedTo : 
                             typeof dtr.assignedTo === 'object' && dtr.assignedTo?.name ? dtr.assignedTo.name : 
                             'N/A'}
                          </span></p>
                        )}
                      </div>
                    </div>
                    <p className="text-dark-secondary mt-2">{dtr.symptoms || dtr.complaintDescription || dtr.issueDescription || 'No description available'}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {dtr.status === 'Open' && (
                      <Button size="sm" onClick={() => handleAssignDTR(dtr._id, 'technician-id')}>
                        Assign
                      </Button>
                    )}
                    {dtr.assignedTo && dtr.status !== 'Ready for RMA' && dtr.status !== 'Closed' && (
                      <Button size="sm" variant="outline" onClick={() => handleFinalizeDTR(dtr._id, 'Completed by Technical Head', 'DTR completed and ready for RMA conversion')} className="border-dark-color text-dark-primary hover:bg-dark-hover">
                        Finalize
                      </Button>
                    )}
                    {dtr.status === 'Ready for RMA' && (
                      <Button size="sm" variant="outline" disabled className="border-dark-color text-dark-primary">
                        Ready for RMA
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-dark-secondary hover:text-dark-primary"
                      onClick={() => handleViewDTR(dtr)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <Card className="w-96 bg-dark-card border-dark-color">
          <CardHeader>
            <CardTitle className="text-dark-primary">Authentication Required</CardTitle>
            <CardDescription className="text-dark-secondary">Please log in to access the Technical Head Dashboard</CardDescription>
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-bg border-b border-dark-color p-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark-primary">Technical Head</h1>
            <p className="text-xs text-dark-secondary">Supervision Dashboard</p>
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
      <div className={`w-72 bg-dark-bg border-r border-dark-color flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out`}>
        {/* Logo */}
        <div className="p-8 border-b border-dark-color">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center dark-shadow-lg relative overflow-hidden">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-primary">Technical Head</h1>
              <p className="text-xs text-dark-secondary font-medium">Supervision Dashboard</p>
            </div>
          </div>
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-dark-color">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-dark-secondary" />
                <div className="flex flex-col">
                  <span className="text-sm text-dark-secondary">
                    {user?.profile?.firstName || user?.username}
                  </span>
                  <span className="text-xs text-blue-400 font-medium">
                    Technical Head
                  </span>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-dark-secondary hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-2">
          <Button
            onClick={() => setActiveTab('dashboard')}
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            className={`w-full justify-start text-left ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'text-dark-secondary hover:text-dark-primary hover:bg-dark-hover'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button
            onClick={() => setActiveTab('fse-management')}
            variant={activeTab === 'fse-management' ? 'default' : 'ghost'}
            className={`w-full justify-start text-left ${
              activeTab === 'fse-management' 
                ? 'bg-blue-600 text-white' 
                : 'text-dark-secondary hover:text-dark-primary hover:bg-dark-hover'
            }`}
          >
            <Users className="w-4 h-4 mr-3" />
            FSE Management
          </Button>
          <Button
            onClick={() => setActiveTab('service-reports')}
            variant={activeTab === 'service-reports' ? 'default' : 'ghost'}
            className={`w-full justify-start text-left ${
              activeTab === 'service-reports' 
                ? 'bg-blue-600 text-white' 
                : 'text-dark-secondary hover:text-dark-primary hover:bg-dark-hover'
            }`}
          >
            <FileText className="w-4 h-4 mr-3" />
            Service Reports
          </Button>
          <Button
            onClick={() => setActiveTab('dtr-management')}
            variant={activeTab === 'dtr-management' ? 'default' : 'ghost'}
            className={`w-full justify-start text-left ${
              activeTab === 'dtr-management' 
                ? 'bg-blue-600 text-white' 
                : 'text-dark-secondary hover:text-dark-primary hover:bg-dark-hover'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mr-3" />
            DTR Management
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-dark-bg border-b border-dark-color p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark-primary">Technical Head Dashboard</h1>
              <p className="text-dark-secondary">Welcome, {user?.profile?.firstName || user?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-100 text-blue-700">
                Technical Head
              </Badge>
              <Button 
                onClick={() => setShowNavigation(!showNavigation)} 
                variant="outline" 
                size="sm"
                className="border-dark-color text-dark-primary hover:bg-dark-hover"
              >
                <Menu className="h-4 w-4 mr-2" />
                Navigation
              </Button>
              <Button onClick={loadDTRs} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh DTRs
              </Button>
              <Button onClick={() => {
                console.log('🔍 Manual DTR test...');
                loadDTRs();
              }} variant="outline" size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Test DTR API
              </Button>
              <Button onClick={loadDashboardData} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
            </div>
          </div>
          
          {/* Navigation Menu */}
          {showNavigation && (
            <div className="mt-4 p-4 bg-dark-card border border-dark-color rounded-lg">
              <h3 className="text-dark-primary font-medium mb-3">Quick Navigation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  onClick={() => handleNavigateToPage('rma-management')}
                  variant="outline" 
                  size="sm"
                  className="border-dark-color text-dark-primary hover:bg-dark-hover"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  RMA Management
                </Button>
                <Button 
                  onClick={() => handleNavigateToPage('dtr-management')}
                  variant="outline" 
                  size="sm"
                  className="border-dark-color text-dark-primary hover:bg-dark-hover"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  DTR Management
                </Button>
                <Button 
                  onClick={() => handleNavigateToPage('rma-dashboard')}
                  variant="outline" 
                  size="sm"
                  className="border-dark-color text-dark-primary hover:bg-dark-hover"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  RMA Dashboard
                </Button>
                <Button 
                  onClick={() => handleNavigateToPage('dashboard')}
                  variant="outline" 
                  size="sm"
                  className="border-dark-color text-dark-primary hover:bg-dark-hover"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Main Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 font-medium">Error: {error}</p>
              <Button 
                onClick={() => setError(null)} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}
          
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'fse-management' && renderFSEManagement()}
          {activeTab === 'service-reports' && renderServiceReports()}
          {activeTab === 'dtr-management' && renderDTRManagement()}
        </div>
      </div>

      {/* DTR Details Dialog */}
      <Dialog open={isDTRDialogOpen} onOpenChange={setIsDTRDialogOpen}>
        <DialogContent className="max-w-2xl bg-dark-card border-dark-color">
          <DialogHeader>
            <DialogTitle className="text-dark-primary">DTR Details</DialogTitle>
          </DialogHeader>
          
          {selectedDTR && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">RMA Number</Label>
                  <p className="text-white font-medium">{selectedDTR.rmaNumber}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedDTR.status)}>
                      {selectedDTR.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-dark-secondary">Priority</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedDTR.priority)}>
                      {selectedDTR.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-dark-secondary">Reported Date</Label>
                  <p className="text-white">{formatDate(selectedDTR.ascompRaisedDate || selectedDTR.customerErrorDate || selectedDTR.createdAt)}</p>
                </div>
              </div>

              {/* Site and Equipment Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">Site Name</Label>
                  <p className="text-white">{selectedDTR.siteName}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Projector Serial</Label>
                  <p className="text-white">{selectedDTR.serialNumber}</p>
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <Label className="text-dark-secondary">Issue Description</Label>
                <p className="text-white mt-1 p-3 bg-dark-hover rounded-lg">
                  {selectedDTR.symptoms || 
                   selectedDTR.complaintDescription || 
                   selectedDTR.issueDescription || 
                   selectedDTR.description ||
                   selectedDTR.notes ||
                   'No description provided'}
                </p>
              </div>

              {/* Assignment Information */}
              {selectedDTR.assignedTo && (
                <div>
                  <Label className="text-dark-secondary">Assigned To</Label>
                  <p className="text-white">
                    {typeof selectedDTR.assignedTo === 'string' ? selectedDTR.assignedTo : 
                     typeof selectedDTR.assignedTo === 'object' && selectedDTR.assignedTo?.name ? selectedDTR.assignedTo.name : 
                     'N/A'}
                  </p>
                </div>
              )}

              {/* Resolution Information */}
              {selectedDTR.resolution && (
                <div>
                  <Label className="text-dark-secondary">Resolution</Label>
                  <p className="text-white mt-1 p-3 bg-dark-hover rounded-lg">
                    {selectedDTR.resolution}
                  </p>
                </div>
              )}

              {selectedDTR.resolvedDate && (
                <div>
                  <Label className="text-dark-secondary">Resolved Date</Label>
                  <p className="text-white">{formatDate(selectedDTR.resolvedDate)}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedDTR.status === 'Open' && (
                  <Button 
                    onClick={() => {
                      handleAssignDTR(selectedDTR._id, 'technician-id');
                      setIsDTRDialogOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Assign DTR
                  </Button>
                )}
                {selectedDTR.assignedTo && selectedDTR.status !== 'Ready for RMA' && selectedDTR.status !== 'Closed' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleFinalizeDTR(selectedDTR._id, 'Completed by Technical Head', 'DTR completed and ready for RMA conversion');
                      setIsDTRDialogOpen(false);
                    }}
                    className="border-dark-color text-dark-primary hover:bg-dark-hover"
                  >
                    Finalize & Assign to RMA Handler
                  </Button>
                )}
                {selectedDTR.status === 'Ready for RMA' && (
                  <Button 
                    variant="outline"
                    disabled
                    className="border-dark-color text-dark-primary"
                  >
                    Ready for RMA Conversion
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setIsDTRDialogOpen(false)}
                  className="border-dark-color text-dark-primary hover:bg-dark-hover"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comprehensive Service Visit Details Dialog */}
      <Dialog open={isServiceVisitDialogOpen} onOpenChange={setIsServiceVisitDialogOpen}>
        <DialogContent className="max-w-4xl bg-dark-card border-dark-color max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dark-primary">Service Visit Details</DialogTitle>
          </DialogHeader>
          
          {selectedServiceVisit && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">Visit ID</Label>
                  <p className="text-white font-medium">{selectedServiceVisit.visitId}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedServiceVisit.status)}>
                      {selectedServiceVisit.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-dark-secondary">Service Type</Label>
                  <p className="text-white">{selectedServiceVisit.visitType}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Priority</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedServiceVisit.priority)}>
                      {selectedServiceVisit.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dates and Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">Scheduled Date</Label>
                  <p className="text-white">{formatDate(selectedServiceVisit.scheduledDate)}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Actual Date</Label>
                  <p className="text-white">{formatDate(selectedServiceVisit.actualDate)}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Start Time</Label>
                  <p className="text-white">{formatTime(selectedServiceVisit.startTime)}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">End Time</Label>
                  <p className="text-white">{formatTime(selectedServiceVisit.endTime)}</p>
                </div>
              </div>

              {/* Site and Equipment Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">Site Name</Label>
                  <p className="text-white">{selectedServiceVisit.siteName}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Site Address</Label>
                  <p className="text-white">{selectedServiceVisit.siteAddress || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Projector Serial</Label>
                  <p className="text-white">{selectedServiceVisit.projectorSerial}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">Projector Model</Label>
                  <p className="text-white">{selectedServiceVisit.projectorModel}</p>
                </div>
              </div>

              {/* FSE Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">FSE Name</Label>
                  <p className="text-white">{selectedServiceVisit.fseName}</p>
                </div>
                <div>
                  <Label className="text-dark-secondary">FSE ID</Label>
                  <p className="text-white">{selectedServiceVisit.fseId}</p>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <Label className="text-dark-secondary">Work Performed</Label>
                <p className="text-white mt-1 p-3 bg-dark-hover rounded-lg">
                  {selectedServiceVisit.workPerformed || 'No work details provided'}
                </p>
              </div>

              {selectedServiceVisit.description && (
                <div>
                  <Label className="text-dark-secondary">Description</Label>
                  <p className="text-white mt-1 p-3 bg-dark-hover rounded-lg">
                    {selectedServiceVisit.description}
                  </p>
                </div>
              )}

              {/* Parts Used */}
              {selectedServiceVisit.partsUsed && selectedServiceVisit.partsUsed.length > 0 && (
                <div>
                  <Label className="text-dark-secondary">Parts Used</Label>
                  <div className="mt-2 space-y-2">
                    {selectedServiceVisit.partsUsed.map((part, index) => (
                      <div key={index} className="p-3 bg-dark-hover rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-dark-secondary">Part Number</p>
                            <p className="text-white font-medium">{part.partNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-dark-secondary">Part Name</p>
                            <p className="text-white font-medium">{part.partName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-dark-secondary">Quantity</p>
                            <p className="text-white">{part.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-dark-secondary">Cost</p>
                            <p className="text-white">{formatCurrency(part.cost)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues Found */}
              {selectedServiceVisit.issuesFound && selectedServiceVisit.issuesFound.length > 0 && (
                <div>
                  <Label className="text-dark-secondary">Issues Found</Label>
                  <div className="mt-2 space-y-2">
                    {selectedServiceVisit.issuesFound.map((issue, index) => (
                      <div key={index} className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-white">{issue.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                            <Badge className={issue.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {issue.resolved ? 'Resolved' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedServiceVisit.recommendations && selectedServiceVisit.recommendations.length > 0 && (
                <div>
                  <Label className="text-dark-secondary">Recommendations</Label>
                  <div className="mt-2 space-y-2">
                    {selectedServiceVisit.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-white">{rec.description}</p>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-secondary">Total Cost</Label>
                  <p className="text-white font-medium">{formatCurrency(selectedServiceVisit.totalCost)}</p>
                </div>
                {selectedServiceVisit.nextVisitDate && (
                  <div>
                    <Label className="text-dark-secondary">Next Visit Date</Label>
                    <p className="text-white">{formatDate(selectedServiceVisit.nextVisitDate)}</p>
                  </div>
                )}
              </div>

              {/* Travel Information */}
              {(selectedServiceVisit.travelDistance || selectedServiceVisit.travelTime) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedServiceVisit.travelDistance && (
                    <div>
                      <Label className="text-dark-secondary">Travel Distance</Label>
                      <p className="text-white">{selectedServiceVisit.travelDistance} km</p>
                    </div>
                  )}
                  {selectedServiceVisit.travelTime && (
                    <div>
                      <Label className="text-dark-secondary">Travel Time</Label>
                      <p className="text-white">{selectedServiceVisit.travelTime} minutes</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expenses */}
              {selectedServiceVisit.expenses && (
                <div>
                  <Label className="text-dark-secondary">Expenses</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {selectedServiceVisit.expenses.fuel && (
                      <div className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-400" />
                          <span className="text-dark-secondary">Fuel</span>
                          <span className="text-white font-medium">{formatCurrency(selectedServiceVisit.expenses.fuel)}</span>
                        </div>
                      </div>
                    )}
                    {selectedServiceVisit.expenses.food && (
                      <div className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-green-400" />
                          <span className="text-dark-secondary">Food</span>
                          <span className="text-white font-medium">{formatCurrency(selectedServiceVisit.expenses.food)}</span>
                        </div>
                      </div>
                    )}
                    {selectedServiceVisit.expenses.accommodation && (
                      <div className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-purple-400" />
                          <span className="text-dark-secondary">Accommodation</span>
                          <span className="text-white font-medium">{formatCurrency(selectedServiceVisit.expenses.accommodation)}</span>
                        </div>
                      </div>
                    )}
                    {selectedServiceVisit.expenses.other && (
                      <div className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-orange-400" />
                          <span className="text-dark-secondary">Other</span>
                          <span className="text-white font-medium">{formatCurrency(selectedServiceVisit.expenses.other)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Feedback */}
              {selectedServiceVisit.customerFeedback && (
                <div>
                  <Label className="text-dark-secondary">Customer Feedback</Label>
                  <div className="mt-2 p-3 bg-dark-hover rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-dark-secondary">Rating:</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < (selectedServiceVisit.customerFeedback?.rating || 0) ? 'text-yellow-400' : 'text-gray-400'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedServiceVisit.customerFeedback?.comments && (
                      <p className="text-white">{selectedServiceVisit.customerFeedback.comments}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Workflow Status */}
              {selectedServiceVisit.workflowStatus && (
                <div>
                  <Label className="text-dark-secondary">Workflow Status</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-400" />
                      <span className="text-dark-secondary">Photos Captured</span>
                      <Badge className={selectedServiceVisit.workflowStatus.photosCaptured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {selectedServiceVisit.workflowStatus.photosCaptured ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-green-400" />
                      <span className="text-dark-secondary">Service Completed</span>
                      <Badge className={selectedServiceVisit.workflowStatus.serviceCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {selectedServiceVisit.workflowStatus.serviceCompleted ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="text-dark-secondary">Report Generated</span>
                      <Badge className={selectedServiceVisit.workflowStatus.reportGenerated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {selectedServiceVisit.workflowStatus.reportGenerated ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-orange-400" />
                      <span className="text-dark-secondary">Signature Captured</span>
                      <Badge className={selectedServiceVisit.workflowStatus.signatureCaptured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {selectedServiceVisit.workflowStatus.signatureCaptured ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Site In-Charge Information */}
              {selectedServiceVisit.siteInCharge && (
                <div>
                  <Label className="text-dark-secondary">Site In-Charge</Label>
                  <div className="mt-2 p-3 bg-dark-hover rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-dark-secondary">Name</p>
                        <p className="text-white">{selectedServiceVisit.siteInCharge.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-dark-secondary">Designation</p>
                        <p className="text-white">{selectedServiceVisit.siteInCharge.designation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-dark-secondary">Phone</p>
                        <p className="text-white">{selectedServiceVisit.siteInCharge.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-dark-secondary">Email</p>
                        <p className="text-white">{selectedServiceVisit.siteInCharge.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Signature */}
              {selectedServiceVisit.digitalSignature && (
                <div>
                  <Label className="text-dark-secondary">Digital Signatures</Label>
                  <div className="mt-2 space-y-3">
                    {selectedServiceVisit.digitalSignature.siteInCharge && (
                      <div className="p-3 bg-dark-hover rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Site In-Charge</p>
                            <p className="text-dark-secondary">{selectedServiceVisit.digitalSignature.siteInCharge.name}</p>
                          </div>
                          <Badge className={selectedServiceVisit.digitalSignature.siteInCharge.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {selectedServiceVisit.digitalSignature.siteInCharge.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {selectedServiceVisit.digitalSignature.fse && (
                      <div className="p-3 bg-dark-hover rounded-lg">
                        <div>
                          <p className="text-white font-medium">FSE Signature</p>
                          <p className="text-dark-secondary">{selectedServiceVisit.digitalSignature.fse.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos Count */}
              {selectedServiceVisit.photos && selectedServiceVisit.photos.length > 0 && (
                <div>
                  <Label className="text-dark-secondary">Photos Captured</Label>
                  <div className="mt-2 p-3 bg-dark-hover rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-blue-400" />
                      <span className="text-white">{selectedServiceVisit.photos.length} photos</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setIsServiceVisitDialogOpen(false)}
                  className="border-dark-color text-dark-primary hover:bg-dark-hover"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
