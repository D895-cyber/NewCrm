import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  MapPin, 
  ArrowRightLeft, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  History, 
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';

interface Projector {
  _id: string;
  projectorNumber: string;
  serialNumber: string;
  model: string;
  brand: string;
  siteName: string;
  auditoriumName: string;
  status: string;
  condition: string;
  currentLocation?: {
    siteName: string;
    auditoriumName: string;
    position?: string;
  };
}

interface Movement {
  _id: string;
  projectorId: {
    projectorNumber: string;
    serialNumber: string;
    model: string;
    brand: string;
  };
  movementType: string;
  previousLocation: {
    siteName: string;
    auditoriumName: string;
    position?: string;
  };
  newLocation: {
    siteName: string;
    auditoriumName: string;
    position?: string;
  };
  reason: string;
  performedBy: string;
  movementDate: string;
  isApproved: boolean;
}

interface StatusChange {
  _id: string;
  projectorId: {
    projectorNumber: string;
    serialNumber: string;
    model: string;
    brand: string;
  };
  status: string;
  condition: string;
  currentLocation: {
    siteName: string;
    auditoriumName: string;
  };
  reason: string;
  changedBy: string;
  statusChangeDate: string;
  isResolved: boolean;
}

export function ProjectorTrackingPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'movements' | 'statuses' | 'move-projector'>('dashboard');
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [statuses, setStatuses] = useState<StatusChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMovementType, setFilterMovementType] = useState('');

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalProjectors: 0,
      activeProjectors: 0,
      underServiceProjectors: 0,
      inactiveProjectors: 0
    },
    recentMovements: [],
    recentStatusChanges: [],
    projectorsByStatus: [],
    movementsByType: []
  });

  // Move projector form
  const [moveForm, setMoveForm] = useState({
    projectorId: '',
    movementType: 'Move',
    newLocation: {
      siteId: '',
      siteName: '',
      auditoriumId: '',
      auditoriumName: ''
    },
    reason: '',
    notes: '',
    performedBy: '',
    technician: '',
    authorizedBy: ''
  });

  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [auditoriums, setAuditoriums] = useState<any[]>([]);
  const [selectedProjector, setSelectedProjector] = useState<any>(null);
  const [projectorsForSite, setProjectorsForSite] = useState<any[]>([]);
  
  // Swap tracking states
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [destinationSite, setDestinationSite] = useState<any>(null);
  const [destinationAuditoriums, setDestinationAuditoriums] = useState<any[]>([]);
  const [swapWithProjector, setSwapWithProjector] = useState<any>(null);
  const [projectorsForDestinationSite, setProjectorsForDestinationSite] = useState<any[]>([]);

  useEffect(() => {
    // Set authentication token if available
    if (token) {
      console.log('Setting auth token for ProjectorTrackingPage:', token.substring(0, 20) + '...');
      apiClient.setAuthToken(token);
      loadDashboardData();
      loadProjectors();
      loadSites();
    } else {
      console.error('No authentication token available - user needs to log in');
    }
  }, [token]);


  useEffect(() => {
    if (activeTab === 'movements') {
      loadMovements();
    } else if (activeTab === 'statuses') {
      loadStatuses();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/projector-tracking/dashboard');
      console.log('Dashboard API response:', response);
      
      // Handle different response structures
      const data = response?.data || response || {
        summary: {
          totalProjectors: 0,
          activeProjectors: 0,
          underServiceProjectors: 0,
          inactiveProjectors: 0
        },
        recentMovements: [],
        recentStatusChanges: [],
        projectorsByStatus: [],
        movementsByType: []
      };
      
      console.log('Loaded dashboard data:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData({
        summary: {
          totalProjectors: 0,
          activeProjectors: 0,
          underServiceProjectors: 0,
          inactiveProjectors: 0
        },
        recentMovements: [],
        recentStatusChanges: [],
        projectorsByStatus: [],
        movementsByType: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectors = async () => {
    try {
      const response = await apiClient.get('/projectors');
      setProjectors(response.data || []);
    } catch (error) {
      console.error('Error loading projectors:', error);
      setProjectors([]);
    }
  };

  const loadSites = async () => {
    try {
      console.log('Loading sites...');
      const data = await apiClient.getAllSites();
      console.log('Sites loaded:', data?.length || 0, 'sites');
      setSites(data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
      setSites([]);
    }
  };

  const loadProjectorsForSite = async (siteId: string) => {
    try {
      console.log('Loading projectors for site:', siteId);
      const data = await apiClient.getAllProjectors();
      // Filter projectors by site
      const siteProjectors = data.filter((projector: any) => projector.siteId === siteId);
      console.log('Projectors for site:', siteProjectors.length);
      setProjectorsForSite(siteProjectors || []);
    } catch (error) {
      console.error('Error loading projectors for site:', error);
      setProjectorsForSite([]);
    }
  };

  const loadProjectorsForDestinationSite = async (siteId: string) => {
    try {
      console.log('Loading projectors for destination site:', siteId);
      const data = await apiClient.getAllProjectors();
      // Filter projectors by site
      const siteProjectors = data.filter((projector: any) => projector.siteId === siteId);
      console.log('Projectors for destination site:', siteProjectors.length);
      setProjectorsForDestinationSite(siteProjectors || []);
    } catch (error) {
      console.error('Error loading projectors for destination site:', error);
      setProjectorsForDestinationSite([]);
    }
  };

  const loadMovements = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterMovementType) params.append('movementType', filterMovementType);
      
      const response = await apiClient.get(`/projector-tracking/movements?${params}`);
      console.log('Movements API response:', response);
      
      // Handle different response structures
      const movements = response?.movements || response?.data?.movements || response?.data || response || [];
      console.log('Loaded movements:', movements.length);
      setMovements(movements);
    } catch (error) {
      console.error('Error loading movements:', error);
      setMovements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatuses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await apiClient.get(`/projector-tracking/statuses?${params}`);
      console.log('Statuses API response:', response);
      
      // Handle different response structures
      const statuses = response?.statuses || response?.data?.statuses || response?.data || response || [];
      console.log('Loaded statuses:', statuses.length);
      setStatuses(statuses);
    } catch (error) {
      console.error('Error loading statuses:', error);
      setStatuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteChange = (siteId: string) => {
    const site = sites.find(s => s._id === siteId);
    setSelectedSite(site);
    setAuditoriums(site?.auditoriums || []);
    
    // Load projectors for this site
    if (siteId) {
      loadProjectorsForSite(siteId);
    } else {
      setProjectorsForSite([]);
    }
    
    // Reset form selections
    setSelectedProjector(null);
    setMoveForm(prev => ({
      ...prev,
      projectorId: '',
      newLocation: {
        ...prev.newLocation,
        siteId,
        siteName: site?.name || '',
        auditoriumId: '',
        auditoriumName: ''
      }
    }));
  };

  const handleDestinationSiteChange = (siteId: string) => {
    const site = sites.find(s => s._id === siteId);
    setDestinationSite(site);
    setDestinationAuditoriums(site?.auditoriums || []);
    setSwapWithProjector(null);
    setProjectorsForDestinationSite([]);
    
    if (siteId) {
      loadProjectorsForDestinationSite(siteId);
    } else {
      setProjectorsForDestinationSite([]);
    }
  };

  const handleAuditoriumChange = (auditoriumId: string) => {
    const auditorium = auditoriums.find(a => a.audiNumber === auditoriumId);
    setMoveForm(prev => ({
      ...prev,
      newLocation: {
        ...prev.newLocation,
        auditoriumId,
        auditoriumName: auditorium?.name || ''
      }
    }));
  };

  const handleProjectorChange = (projectorId: string) => {
    const projector = projectorsForSite.find(p => p._id === projectorId);
    setSelectedProjector(projector);
    setMoveForm(prev => ({
      ...prev,
      projectorId
    }));
  };

  const handleSwapWithProjectorChange = (projectorId: string) => {
    const projector = projectorsForDestinationSite.find(p => p._id === projectorId);
    setSwapWithProjector(projector);
  };

  const handleMovementTypeChange = (movementType: string) => {
    const isSwap = movementType === 'Projector Swap';
    setIsSwapMode(isSwap);
    
    setMoveForm(prev => ({
      ...prev,
      movementType
    }));
  };

  const handleMoveProjector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Prepare movement data
      const movementData = {
        ...moveForm,
        projectorId: selectedProjector?._id,
        projectorNumber: selectedProjector?.projectorNumber,
        serialNumber: selectedProjector?.serialNumber,
        previousLocation: {
          siteId: selectedProjector?.siteId,
          siteName: selectedProjector?.siteName,
          auditoriumId: selectedProjector?.auditoriumId,
          auditoriumName: selectedProjector?.auditoriumName
        },
        newLocation: {
          ...moveForm.newLocation,
          siteId: isSwapMode ? destinationSite?._id : moveForm.newLocation.siteId,
          siteName: isSwapMode ? destinationSite?.name : moveForm.newLocation.siteName,
          siteCode: isSwapMode ? destinationSite?.siteCode : moveForm.newLocation.siteCode
        }
      };

      // Add swap details if it's a swap
      if (isSwapMode && swapWithProjector) {
        movementData.swapWithProjector = {
          projectorId: swapWithProjector._id,
          projectorNumber: swapWithProjector.projectorNumber,
          serialNumber: swapWithProjector.serialNumber
        };
        
        // Ensure the new location is set to the destination site for the swap
        movementData.newLocation = {
          siteId: destinationSite._id,
          siteName: destinationSite.name,
          siteCode: destinationSite.siteCode,
          auditoriumId: swapWithProjector.auditoriumId,
          auditoriumName: swapWithProjector.auditoriumName
        };
      }

      await apiClient.post('/projector-tracking/movements', movementData);
      
      // Reset form and states
      setMoveForm({
        projectorId: '',
        movementType: 'Move',
        newLocation: {
          siteId: '',
          siteName: '',
          auditoriumId: '',
          auditoriumName: ''
        },
        reason: '',
        notes: '',
        performedBy: '',
        technician: '',
        authorizedBy: ''
      });
      
      setSelectedSite(null);
      setSelectedProjector(null);
      setDestinationSite(null);
      setSwapWithProjector(null);
      setIsSwapMode(false);
      setProjectorsForSite([]);
      setProjectorsForDestinationSite([]);
      setAuditoriums([]);
      
      // Reload data
      loadDashboardData();
      loadProjectors();
      
      alert(isSwapMode ? 'Projector swap completed successfully!' : 'Projector status updated successfully!');
    } catch (error) {
      console.error('Error updating projector status:', error);
      alert('Failed to update projector status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjectors = (projectors || []).filter(projector => {
    const matchesSearch = projector.projectorNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projector.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projector.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || projector.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-300 bg-green-600/30 border border-green-500/50 shadow-sm';
      case 'Under Service': return 'text-yellow-300 bg-yellow-600/30 border border-yellow-500/50 shadow-sm';
      case 'Inactive': return 'text-gray-300 bg-gray-600/30 border border-gray-500/50 shadow-sm';
      case 'Needs Repair': return 'text-red-300 bg-red-600/30 border border-red-500/50 shadow-sm';
      case 'Critical': return 'text-red-200 bg-red-700/40 border border-red-400/60 shadow-sm';
      case 'In Storage': return 'text-blue-300 bg-blue-600/30 border border-blue-500/50 shadow-sm';
      case 'Disposed': return 'text-gray-400 bg-gray-700/40 border border-gray-600/50 shadow-sm';
      default: return 'text-blue-300 bg-blue-600/30 border border-blue-500/50 shadow-sm';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'Move': return <ArrowRightLeft className="w-4 h-4" />;
      case 'Swap': return <RefreshCw className="w-4 h-4" />;
      case 'Status Change': return <AlertTriangle className="w-4 h-4" />;
      case 'Installation': return <Plus className="w-4 h-4" />;
      case 'Removal': return <XCircle className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Show login prompt if not authenticated
  if (!token) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Projector Tracking System</h1>
          <p className="text-gray-300">Track projector movements, swaps, and status changes across all sites</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl shadow-lg text-center">
          <div className="text-yellow-400 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-300 mb-4">Please log in to access the Projector Tracking System.</p>
          <p className="text-sm text-gray-400">You need to be authenticated to view sites and manage projector tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Projector Tracking System</h1>
        <p className="text-gray-300">Track projector movements, swaps, and status changes across all sites</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Monitor },
          { id: 'movements', label: 'Movements', icon: ArrowRightLeft },
          { id: 'statuses', label: 'Status Changes', icon: AlertTriangle },
          { id: 'move-projector', label: 'Update Status', icon: Plus }
        ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-300">Loading dashboard data...</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 border border-gray-600/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/70">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/30 rounded-xl">
                  <Monitor className="w-6 h-6 text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Total Projectors</p>
                  <p className="text-2xl font-bold text-white">{dashboardData?.summary?.totalProjectors || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-600/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/70">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Active</p>
                  <p className="text-2xl font-bold text-white">{dashboardData?.summary?.activeProjectors || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-600/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/70">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-500/30 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Under Service</p>
                  <p className="text-2xl font-bold text-white">{dashboardData?.summary?.underServiceProjectors || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-600/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/70">
              <div className="flex items-center">
                <div className="p-3 bg-red-500/30 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Inactive</p>
                  <p className="text-2xl font-bold text-white">{dashboardData?.summary?.inactiveProjectors || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-gray-600/50 p-6 rounded-xl shadow-lg hover:bg-gray-800/70 transition-all">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Movements</h3>
              <div className="space-y-3">
                {(dashboardData.recentMovements || []).slice(0, 5).map((movement: any) => (
                  <div key={movement._id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-all">
                    <div className="p-2 bg-blue-500/30 rounded-lg">
                      {getMovementTypeIcon(movement.movementType)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {movement.projectorId?.projectorNumber}
                      </p>
                      <p className="text-xs text-gray-300">
                        {movement.previousLocation?.siteName} → {movement.newLocation?.siteName}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(movement.movementDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-600/50 p-6 rounded-xl shadow-lg hover:bg-gray-800/70 transition-all">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Status Changes</h3>
              <div className="space-y-3">
                {(dashboardData.recentStatusChanges || []).slice(0, 5).map((status: any) => (
                  <div key={status._id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-all">
                    <div className="p-2 bg-yellow-500/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {status.projectorId?.projectorNumber}
                      </p>
                      <p className="text-xs text-gray-300">
                        Status: {status.status} ({status.condition})
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(status.statusChangeDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search movements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={filterMovementType}
                onChange={(e) => setFilterMovementType(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Movement Types</option>
                <option value="Move">Move</option>
                <option value="Swap">Swap</option>
                <option value="Status Change">Status Change</option>
                <option value="Installation">Installation</option>
                <option value="Removal">Removal</option>
              </select>
              <button
                onClick={loadMovements}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Movements List */}
          <div className="bg-gray-800/90 border border-gray-600/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600/50">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Projector
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Movement Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      From
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Performed By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600/30">
                  {(movements || []).map((movement) => (
                    <tr key={movement._id} className="bg-gray-800/90 hover:bg-gray-700/70 transition-all duration-200 border-b border-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {movement.projectorId.projectorNumber}
                          </div>
                          <div className="text-sm text-gray-300">
                            {movement.projectorId.serialNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <div className="flex items-center space-x-2">
                          {getMovementTypeIcon(movement.movementType)}
                          <span className="text-sm text-white">{movement.movementType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <div className="text-sm text-white">
                          {movement.previousLocation.siteName}
                        </div>
                        <div className="text-sm text-gray-300">
                          {movement.previousLocation.auditoriumName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <div className="text-sm text-white">
                          {movement.newLocation.siteName}
                        </div>
                        <div className="text-sm text-gray-300">
                          {movement.newLocation.auditoriumName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white bg-gray-800/90">
                        {movement.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white bg-gray-800/90">
                        {movement.performedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 bg-gray-800/90">
                        {new Date(movement.movementDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.isApproved 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {movement.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Status Changes Tab */}
      {activeTab === 'statuses' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search status changes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Under Service">Under Service</option>
                <option value="Inactive">Inactive</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="In Storage">In Storage</option>
                <option value="Disposed">Disposed</option>
              </select>
              <button
                onClick={loadStatuses}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Status Changes List */}
          <div className="bg-gray-800/90 border border-gray-600/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600/50">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Projector
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Condition
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Changed By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-600">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600/30">
                  {(statuses || []).map((status) => (
                    <tr key={status._id} className="bg-gray-800/90 hover:bg-gray-700/70 transition-all duration-200 border-b border-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {status.projectorId.projectorNumber}
                          </div>
                          <div className="text-sm text-gray-300">
                            {status.projectorId.serialNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status.status)}`}>
                          {status.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white bg-gray-800/90">
                        {status.condition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <div className="text-sm text-white">
                          {status.currentLocation.siteName}
                        </div>
                        <div className="text-sm text-gray-300">
                          {status.currentLocation.auditoriumName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white bg-gray-800/90">
                        {status.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white bg-gray-800/90">
                        {status.changedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 bg-gray-800/90">
                        {new Date(status.statusChangeDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-800/90">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          status.isResolved 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {status.isResolved ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {/* Move Projector Tab */}
        {activeTab === 'move-projector' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Update Projector Status</h3>
              <p className="text-sm text-gray-400 mb-6">Track projector status changes and location updates for reference purposes</p>
              
              {isSwapMode && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center text-blue-300 text-sm">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    <span className="font-medium">Bidirectional Swap Mode:</span>
                  </div>
                  <p className="text-blue-200 text-xs mt-1">
                    When you swap projectors, both will exchange their exact locations (site + auditorium)
                  </p>
                </div>
              )}
            
            <form onSubmit={handleMoveProjector} className="space-y-6">
              {/* Current Site Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Current Site
                </label>
                <select
                  value={moveForm.newLocation.siteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose current site...</option>
                  {(sites || []).map(site => (
                    <option key={site._id} value={site._id}>
                      {site.name} ({site.siteCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Projector Selection */}
              {moveForm.newLocation.siteId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Projector
                  </label>
                  <select
                    value={moveForm.projectorId}
                    onChange={(e) => handleProjectorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a projector...</option>
                    {(projectorsForSite || []).map(projector => (
                      <option key={projector._id} value={projector._id}>
                        {projector.projectorNumber} - {projector.serialNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current Projector Status */}
              {selectedProjector && (
                <div className="bg-gray-700/50 border border-gray-600 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Current Projector Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Projector Number:</span>
                      <span className="ml-2 text-white">{selectedProjector.projectorNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Serial Number:</span>
                      <span className="ml-2 text-white">{selectedProjector.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedProjector.status)}`}>
                        {selectedProjector.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Condition:</span>
                      <span className="ml-2 text-white">{selectedProjector.condition}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Site:</span>
                      <span className="ml-2 text-white">{selectedProjector.siteName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Auditorium:</span>
                      <span className="ml-2 text-white">{selectedProjector.auditoriumName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Swap Details Display */}
              {isSwapMode && selectedProjector && swapWithProjector && (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                    <ArrowRightLeft className="w-5 h-5 mr-2" />
                    Bidirectional Projector Swap Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Projector A (Moving FROM) */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                        Projector A (Moving FROM):
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-gray-400">Projector:</span> <span className="text-white font-medium">{selectedProjector.projectorNumber} - {selectedProjector.serialNumber}</span></div>
                        <div><span className="text-gray-400">From Site:</span> <span className="text-white">{selectedProjector.siteName}</span></div>
                        <div><span className="text-gray-400">From Auditorium:</span> <span className="text-white">{selectedProjector.auditoriumName}</span></div>
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <span className="text-green-400 text-xs">→ Will move to: {destinationSite?.name} - {swapWithProjector.auditoriumName}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Projector B (Moving TO) */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                        Projector B (Moving TO):
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-gray-400">Projector:</span> <span className="text-white font-medium">{swapWithProjector.projectorNumber} - {swapWithProjector.serialNumber}</span></div>
                        <div><span className="text-gray-400">From Site:</span> <span className="text-white">{destinationSite?.name}</span></div>
                        <div><span className="text-gray-400">From Auditorium:</span> <span className="text-white">{swapWithProjector.auditoriumName}</span></div>
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <span className="text-green-400 text-xs">→ Will move to: {selectedProjector.siteName} - {selectedProjector.auditoriumName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Swap Summary */}
                  <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-600/50">
                    <h6 className="text-sm font-medium text-gray-300 mb-2">Swap Summary:</h6>
                    <div className="text-sm text-gray-400">
                      <p>• <span className="text-white">{selectedProjector.projectorNumber}</span> will move from <span className="text-white">{selectedProjector.siteName}</span> to <span className="text-white">{destinationSite?.name}</span></p>
                      <p>• <span className="text-white">{swapWithProjector.projectorNumber}</span> will move from <span className="text-white">{destinationSite?.name}</span> to <span className="text-white">{selectedProjector.siteName}</span></p>
                      <p className="text-yellow-400 text-xs mt-1">Both projectors will exchange their exact locations (site + auditorium)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Movement Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Update Type
                </label>
                <select
                  value={moveForm.movementType}
                  onChange={(e) => handleMovementTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Move">Location Update</option>
                  <option value="Swap">Projector Swap</option>
                  <option value="Status Change">Status Change</option>
                  <option value="Installation">New Installation</option>
                  <option value="Removal">Removal/Decommission</option>
                </select>
              </div>

              {/* Destination Site Selection for Swaps */}
              {isSwapMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination Site (Where to swap)
                  </label>
                  <select
                    value={destinationSite?._id || ''}
                    onChange={(e) => handleDestinationSiteChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose destination site...</option>
                    {(sites || []).map(site => (
                      <option key={site._id} value={site._id}>
                        {site.name} ({site.siteCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Projector Selection for Swaps */}
              {isSwapMode && destinationSite && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Swap With Projector
                  </label>
                  <select
                    value={swapWithProjector?._id || ''}
                    onChange={(e) => handleSwapWithProjectorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose projector to swap with...</option>
                    {(projectorsForDestinationSite || []).map(projector => (
                      <option key={projector._id} value={projector._id}>
                        {projector.projectorNumber} - {projector.serialNumber} ({projector.model})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* New Site Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Move to New Site
                </label>
                <select
                  value={moveForm.newLocation.siteId}
                  onChange={(e) => {
                    const site = sites.find(s => s._id === e.target.value);
                    setMoveForm(prev => ({
                      ...prev,
                      newLocation: {
                        ...prev.newLocation,
                        siteId: e.target.value,
                        siteName: site?.name || '',
                        siteCode: site?.siteCode || ''
                      }
                    }));
                    setAuditoriums(site?.auditoriums || []);
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose new site...</option>
                  {(sites || []).map(site => (
                    <option key={site._id} value={site._id}>
                      {site.name} ({site.siteCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* New Auditorium Selection */}
              {moveForm.newLocation.siteId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Auditorium
                  </label>
                  <select
                    value={moveForm.newLocation.auditoriumId}
                    onChange={(e) => handleAuditoriumChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose an auditorium...</option>
                    {(auditoriums || []).map(auditorium => (
                      <option key={auditorium.audiNumber} value={auditorium.audiNumber}>
                        {auditorium.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Auditorium Details */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auditorium Number
                </label>
                <input
                  type="text"
                  value={moveForm.newLocation.auditoriumId}
                  onChange={(e) => setMoveForm(prev => ({
                    ...prev,
                    newLocation: { ...prev.newLocation, auditoriumId: e.target.value }
                  }))}
                  placeholder="e.g., AUDI-01, AUDI-02, Screen-1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Reason and Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Status Change
                </label>
                <input
                  type="text"
                  value={moveForm.reason}
                  onChange={(e) => setMoveForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Site closure, Maintenance, Relocation, Status update"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={moveForm.notes}
                  onChange={(e) => setMoveForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional details about the status change or movement for reference..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Personnel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Performed By
                  </label>
                  <input
                    type="text"
                    value={moveForm.performedBy}
                    onChange={(e) => setMoveForm(prev => ({ ...prev, performedBy: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Technician
                  </label>
                  <input
                    type="text"
                    value={moveForm.technician}
                    onChange={(e) => setMoveForm(prev => ({ ...prev, technician: e.target.value }))}
                    placeholder="Technician name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Authorized By
                  </label>
                  <input
                    type="text"
                    value={moveForm.authorizedBy}
                    onChange={(e) => setMoveForm(prev => ({ ...prev, authorizedBy: e.target.value }))}
                    placeholder="Manager/Supervisor name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Updating...' : 'Update Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-white">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
