import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Monitor,
  Settings,
  MoreVertical,
  Wifi,
  WifiOff,
  Server,
  FileText,
  Download
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV } from "../../utils/export";
import AuditoriumManager from "../AuditoriumManager";
import { useAuth } from "../../contexts/AuthContext";
import SiteReportGenerator from "../SiteReportGenerator";

interface Site {
  _id: string;
  name: string;
  siteCode: string;
  region: string;
  state: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  businessHours: {
    openTime: string;
    closeTime: string;
    workingDays: string[];
  };
  siteType: string;
  status: string;
  totalProjectors: number;
  activeProjectors: number;
  totalAuditoriums: number;
  auditoriums: Array<{
    _id?: string;
    audiNumber: string;
    name: string;
    capacity: number;
    screenSize: string;
    projectorCount: number;
    status: string;
    notes: string;
  }>;
  contractDetails: {
    contractNumber: string;
    startDate: string;
    endDate: string;
    contractValue: number;
    serviceLevel: string;
  };
  fullAddress: string;
  contractStatus: string;
  createdAt: string;
  updatedAt: string;
}

export function SitesPage() {
  const { isAuthenticated, token } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showAddSite, setShowAddSite] = useState(false);
  const [showAuditoriums, setShowAuditoriums] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteStats, setSiteStats] = useState<any>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [reportSiteId, setReportSiteId] = useState<string | null>(null);
  const [reportSiteData, setReportSiteData] = useState<any>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showAllSites, setShowAllSites] = useState(false); // New: Control visibility
  const [isSearching, setIsSearching] = useState(false); // New: Search loading state

  // Form state for adding/editing sites
  const [formData, setFormData] = useState({
    name: '',
    siteCode: '',
    region: 'Central',
    state: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      designation: ''
    },
    businessHours: {
      openTime: '09:00',
      closeTime: '18:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    siteType: 'Mall',
    status: 'Active',
    auditoriums: [{
      audiNumber: 'AUDI-01',
      name: 'Main Auditorium',
      capacity: 100,
      screenSize: 'Standard',
      projectorCount: 0,
      status: 'Active',
      notes: 'Default auditorium'
    }],
    contractDetails: {
      contractNumber: '',
      startDate: '',
      endDate: '',
      contractValue: 0,
      serviceLevel: 'Standard'
    }
  });

  const siteTypes = ['Mall', 'Cinema', 'Corporate Office', 'Convention Center', 'Hotel', 'Restaurant', 'Educational Institute', 'Other'];
  const siteStatuses = ['Active', 'Inactive', 'Under Maintenance'];
  const serviceLevels = ['Basic', 'Standard', 'Premium'];
  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const regions = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];

  useEffect(() => {
    if (isAuthenticated && token) {
      // Set the auth token for API requests
      apiClient.setAuthToken(token);
      checkBackendConnection();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isBackendConnected && isAuthenticated) {
      loadSites();
      loadSiteStats();
    }
  }, [isBackendConnected, isAuthenticated]);

  useEffect(() => {
    filterSites();
  }, [sites, searchTerm, filterType, filterStatus]);

  // Dynamic search effect - triggers when user types (min 2 characters)
  useEffect(() => {
    const performSearch = async () => {
      // Don't search if less than 2 characters
      if (searchTerm.trim().length < 2) {
        if (searchTerm.trim().length === 0 && !showAllSites) {
          setFilteredSites([]);
        }
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        // Filter sites that match the search term
        const filtered = sites.filter(site =>
          site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (site.siteCode && site.siteCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (site.region && site.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (site.state && site.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
          site.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.address.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.contactPerson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.siteType.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Apply additional filters
        let finalFiltered = filtered;
        
        if (filterType !== "All") {
          finalFiltered = finalFiltered.filter(site => site.siteType === filterType);
        }

        if (filterStatus !== "All") {
          finalFiltered = finalFiltered.filter(site => site.status === filterStatus);
        }
        
        setFilteredSites(finalFiltered);
      } catch (err: any) {
        console.error('Error filtering sites:', err);
        setError('Search failed: ' + err.message);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search - wait 300ms after user stops typing
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, sites, filterType, filterStatus, showAllSites]);

  const checkBackendConnection = async () => {
    try {
      setConnectionError(null);
      // Use the configured API URL for health check
      const healthCheckUrl = `${apiClient.getBaseUrl().replace('/api', '')}/api/health`;
      console.log('🔍 Checking backend connection at:', healthCheckUrl);
      
      const response = await fetch(healthCheckUrl);
      const isConnected = response.ok;
      setIsBackendConnected(isConnected);
      
      if (!isConnected) {
        throw new Error(`Backend health check failed. Status: ${response.status}`);
      }
      
      console.log('✅ Backend connection successful');
    } catch (err: any) {
      console.error('❌ Backend connection failed:', err);
      setIsBackendConnected(false);
      
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDev) {
        setConnectionError(
          'Cannot connect to backend server. Please ensure:\n' +
          '1. Express.js server is running on http://localhost:4000\n' +
          '2. MongoDB is connected and running\n' +
          '3. Run "cd backend && npm run dev" to start backend'
        );
      } else {
        setConnectionError(
          'Cannot connect to backend server. Please check:\n' +
          '1. Backend service is deployed and running\n' +
          '2. VITE_API_URL environment variable is set correctly\n' +
          '3. CORS is configured to allow requests from this domain\n' +
          `4. Trying to connect to: ${apiClient.getBaseUrl()}`
        );
      }
    }
  };

  const loadSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sitesData = await apiClient.getAllSites();
      setSites(sitesData);
    } catch (err: any) {
      console.error('Error loading sites:', err);
      setError('Failed to load sites. Backend server may not be running.');
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDetails = async (siteId: string) => {
    try {
      const site = sites.find(s => s._id === siteId);
      if (!site) {
        setError('Site not found');
        return;
      }
      
      const siteData = [{
        name: site.name,
        type: site.siteType,
        status: site.status,
        address: site.fullAddress,
        contact: site.contactPerson.name,
        email: site.contactPerson.email,
        phone: site.contactPerson.phone,
        contractValue: site.contractDetails?.contractValue || 0,
        totalProjectors: site.totalProjectors || 0,
        activeProjectors: site.activeProjectors || 0
      }];
      
      const csvContent = convertToCSV(siteData);
      downloadCSV([site], `site_${site.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Export Successful',
        message: `Site details for ${site.name} exported to CSV file`
      });
    } catch (err: any) {
      console.error('Error exporting site details:', err);
      setError('Failed to export site details: ' + err.message);
    }
  };

  const loadSiteStats = async () => {
    try {
      const stats = await apiClient.getSiteStats();
      setSiteStats(stats);
    } catch (err) {
      console.error('Error loading site statistics:', err);
      // Create fallback stats from current sites
      setSiteStats({
        totalSites: sites.length,
        activeSites: sites.filter(s => s.status === 'Active').length,
        inactiveSites: sites.filter(s => s.status === 'Inactive').length,
        maintenanceSites: sites.filter(s => s.status === 'Under Maintenance').length
      });
    }
  };

  const filterSites = () => {
    // Only filter when showing all sites
    if (!showAllSites && searchTerm.trim().length < 2) {
      setFilteredSites([]);
      return;
    }

    let filtered = sites;

    if (searchTerm && searchTerm.trim().length >= 2) {
      filtered = filtered.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.siteCode && site.siteCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (site.region && site.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (site.state && site.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
        site.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.address.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.contactPerson.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "All") {
      filtered = filtered.filter(site => site.siteType === filterType);
    }

    if (filterStatus !== "All") {
      filtered = filtered.filter(site => site.status === filterStatus);
    }

    setFilteredSites(filtered);
  };

  const handleAddSite = async () => {
    try {
      setIsLoading(true);
      await apiClient.createSite(formData);
      await loadSites();
      await loadSiteStats();
      setShowAddSite(false);
      resetForm();
      console.log('Site added successfully');
    } catch (err: any) {
      console.error('Error adding site:', err);
      setError('Failed to add site: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.deleteSite(siteId);
      await loadSites();
      await loadSiteStats();
      console.log('Site deleted successfully');
    } catch (err: any) {
      console.error('Error deleting site:', err);
      setError('Failed to delete site: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditoriumUpdate = (updatedAuditoriums: any[]) => {
    if (selectedSite) {
      const updatedSite = { ...selectedSite, auditoriums: updatedAuditoriums };
      setSelectedSite(updatedSite);
      
      // Update the sites list as well
      setSites(sites.map(site => 
        site._id === selectedSite._id ? updatedSite : site
      ));
      setFilteredSites(filteredSites.map(site => 
        site._id === selectedSite._id ? updatedSite : site
      ));
    }
  };

  const handleProjectorAdd = (auditoriumId: string, projector: any) => {
    // This will be implemented to open the projector creation form
    console.log('Add projector to auditorium:', auditoriumId, projector);
    // You can implement navigation to projector creation or open a modal
  };

  const resetForm = () => {
    setFormData({
      name: '',
      siteCode: '',
      region: 'Central',
      state: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      contactPerson: {
        name: '',
        email: '',
        phone: '',
        designation: ''
      },
      businessHours: {
        openTime: '09:00',
        closeTime: '18:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      siteType: 'Mall',
      status: 'Active',
      auditoriums: [{
        audiNumber: 'AUDI-01',
        name: 'Main Auditorium',
        capacity: 100,
        screenSize: 'Standard',
        projectorCount: 0,
        status: 'Active',
        notes: 'Default auditorium'
      }],
      contractDetails: {
        contractNumber: '',
        startDate: '',
        endDate: '',
        contractValue: 0,
        serviceLevel: 'Standard'
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-600";
      case "Inactive":
        return "bg-gray-600";
      case "Under Maintenance":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Mall":
        return "bg-blue-600";
      case "Cinema":
        return "bg-purple-600";
      case "Corporate Office":
        return "bg-green-600";
      case "Convention Center":
        return "bg-orange-600";
      case "Hotel":
        return "bg-pink-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If user is not authenticated, show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-dark-primary mb-2">Authentication Required</h2>
          <p className="text-dark-secondary mb-4">Please log in to access site management.</p>
        </div>
      </div>
    );
  }

  // If backend is not connected, show connection error
  if (isBackendConnected === false) {
    return (
      <>
        <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-dark-primary">Site Management</h1>
              <p className="text-sm text-dark-secondary mt-1">Backend server connection required</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-red-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Backend Offline</span>
              </div>
              <button 
                onClick={checkBackendConnection}
                className="dark-button-primary gap-2 flex items-center"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 bg-dark-bg">
          <div className="max-w-4xl mx-auto">
            {/* Connection Error */}
            <div className="mb-8 p-6 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
              <div className="flex items-start space-x-3">
                <Server className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Backend Server Not Running</h3>
                  <p className="text-red-300 mb-4">{connectionError}</p>
                  
                  <div className="bg-red-950 bg-opacity-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-red-300 mb-2">Quick Start Commands:</h4>
                    <div className="space-y-2 text-sm font-mono text-red-200">
                      <div className="bg-red-900 bg-opacity-30 p-2 rounded">
                        # Terminal 1: Start Backend Server
                      </div>
                      <div className="bg-red-900 bg-opacity-30 p-2 rounded">
                        cd server && npm install && npm run dev
                      </div>
                      <div className="bg-red-900 bg-opacity-30 p-2 rounded mt-3">
                        # Terminal 2: Start Frontend (this app)
                      </div>
                      <div className="bg-red-900 bg-opacity-30 p-2 rounded">
                        npm start
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-red-300">
                    <p className="mb-2"><strong>Requirements:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Node.js installed</li>
                      <li>MongoDB running (local or cloud)</li>
                      <li>Backend server running on port 5000</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="dark-card">
              <h3 className="text-xl font-semibold text-dark-primary mb-4">Setup Instructions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-dark-primary mb-2">1. Start MongoDB</h4>
                  <div className="bg-dark-bg p-3 rounded-lg text-sm font-mono text-dark-secondary">
                    # Windows: net start MongoDB<br/>
                    # macOS: brew services start mongodb-community<br/>
                    # Linux: sudo systemctl start mongod
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-dark-primary mb-2">2. Start Backend Server</h4>
                  <div className="bg-dark-bg p-3 rounded-lg text-sm font-mono text-dark-secondary">
                    cd server<br/>
                    npm install<br/>
                    npm run dev
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-dark-primary mb-2">3. Verify Backend</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    Check that the backend is running by visiting:{' '}
                    <a 
                      href="http://localhost:4000/api/health" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-dark-cta hover:underline"
                    >
                      http://localhost:4000/api/health
                    </a>
                  </p>
                </div>

                <button 
                  onClick={checkBackendConnection}
                  className="dark-button-primary gap-2 flex items-center"
                >
                  <RefreshCw className="w-4 h-4" />
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Site Management</h1>
            <p className="text-sm text-dark-secondary mt-1">Manage projector installation sites and locations</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isBackendConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Backend Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Checking...</span>
                </>
              )}
            </div>
            <button 
              onClick={() => {
                setShowAllSites(false);
                setSearchTerm("");
                setFilteredSites([]);
                loadSites();
                loadSiteStats();
              }}
              className="dark-button-secondary gap-2 flex items-center"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => {
                setReportSiteId(null);
                setReportSiteData(null);
                setShowReportGenerator(true);
              }}
              className="dark-button-secondary gap-2 flex items-center"
              disabled={!isBackendConnected}
            >
              <Download className="w-4 h-4" />
              Regional Report
            </button>
            <button 
              onClick={() => setShowAddSite(true)}
              className="dark-button-primary gap-2 flex items-center"
              disabled={!isBackendConnected}
            >
              <Plus className="w-4 h-4" />
              Add Site
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {siteStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="dark-card text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark-primary mb-1">{siteStats.totalSites || sites.length}</h3>
              <p className="text-sm text-dark-secondary">Total Sites</p>
            </div>
            
            <div className="dark-card text-center">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark-primary mb-1">
                {siteStats.activeSites || sites.filter(s => s.status === 'Active').length}
              </h3>
              <p className="text-sm text-dark-secondary">Active Sites</p>
            </div>
            
            <div className="dark-card text-center">
              <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark-primary mb-1">
                {siteStats.maintenanceSites || sites.filter(s => s.status === 'Under Maintenance').length}
              </h3>
              <p className="text-sm text-dark-secondary">Under Maintenance</p>
            </div>
            
            <div className="dark-card text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-600 flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark-primary mb-1">
                {sites.reduce((total, site) => total + (site.totalProjectors || 0), 0)}
              </h3>
              <p className="text-sm text-dark-secondary">Total Projectors</p>
            </div>
          </div>
        )}

        {/* Advanced Search and Filters */}
        <div className="dark-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-dark-primary mb-2">Advanced Site Search</h2>
              <p className="text-dark-secondary">Start typing (min 2 characters) to search by name, code, region, city, or contact</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary w-5 h-5" />
              <Input
                placeholder="Type to search: site name, code, region, city, contact..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowAllSites(false);
                }}
                className="pl-12 h-12 bg-dark-card border-dark-color text-dark-primary text-base"
                disabled={isLoading}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-blue-400" />
              )}
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 h-12 bg-dark-card border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Types</option>
              {siteTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 h-12 bg-dark-card border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Status</option>
              {siteStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Search Status Messages */}
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <div className="mt-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg">
              <p className="text-sm text-yellow-300">
                Please enter at least 2 characters to search
              </p>
            </div>
          )}
          
          {searchTerm.trim().length >= 2 && filteredSites.length > 0 && (
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg">
              <p className="text-sm text-blue-300">
                Found {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </p>
            </div>
          )}
          
          {searchTerm.trim().length >= 2 && filteredSites.length === 0 && !isSearching && (
            <div className="mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-300">
                No sites found matching "{searchTerm}"
              </p>
            </div>
          )}
        </div>

        {/* Sites Grid */}
        {isLoading && sites.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-dark-secondary mx-auto mb-4 animate-spin" />
            <p className="text-dark-secondary">Loading sites...</p>
          </div>
        ) : !showAllSites && searchTerm.trim().length === 0 ? (
          /* Empty state - show search prompt */
          <div className="text-center py-16">
            <Search className="w-20 h-20 text-dark-secondary mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-medium text-dark-primary mb-3">Search for Sites</h3>
            <p className="text-dark-secondary mb-6 max-w-md mx-auto">
              Enter at least 2 characters in the search box above to find sites by name, code, region, city, or contact information.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => {
                  setShowAllSites(true);
                  setSearchTerm("");
                  setFilteredSites(sites);
                }}
                className="dark-button-primary gap-2 flex items-center"
              >
                <Building2 className="w-4 h-4" />
                View All Sites
              </button>
            </div>
          </div>
        ) : filteredSites.length > 0 ? (
          /* Show search results or all sites */
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-primary">
                {searchTerm.trim().length >= 2 ? 'Search Results' : 'All Sites'} 
                <span className="text-dark-secondary ml-2">({filteredSites.length})</span>
              </h3>
              {(showAllSites || searchTerm.trim().length >= 2) && (
                <button 
                  onClick={() => {
                    setShowAllSites(false);
                    setSearchTerm("");
                    setFilteredSites([]);
                  }}
                  className="dark-button-secondary text-sm px-4 py-2"
                >
                  Clear & Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSites.map((site) => (
              <div key={site._id} className="dark-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-dark-primary mb-1">{site.name}</h3>
                    <p className="text-sm text-dark-secondary flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {site.address.city}, {site.address.state}
                    </p>
                    <p className="text-xs text-dark-secondary flex items-center gap-1">
                      <span className="font-medium">Code:</span> {site.siteCode || 'N/A'} | 
                      <span className="font-medium ml-1">Region:</span> {site.region || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`dark-tag ${getStatusColor(site.status)}`}>
                      {site.status}
                    </div>
                    <button className="p-1 hover:bg-dark-hover rounded">
                      <MoreVertical className="w-4 h-4 text-dark-secondary" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className={`dark-tag ${getTypeColor(site.siteType)} inline-flex items-center gap-1`}>
                    <Building2 className="w-3 h-3" />
                    {site.siteType}
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-dark-secondary" />
                      <span className="text-dark-primary">{site.contactPerson.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-dark-secondary" />
                      <span className="text-dark-primary">{site.contactPerson.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-dark-secondary" />
                      <span className="text-dark-primary">{site.contactPerson.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-dark-secondary" />
                      <span className="text-dark-primary">
                        {site.businessHours.openTime} - {site.businessHours.closeTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div>
                    <div className="text-lg font-bold text-dark-primary">{site.totalProjectors || 0}</div>
                    <div className="text-xs text-dark-secondary">Total Projectors</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-dark-primary">{site.activeProjectors || 0}</div>
                    <div className="text-xs text-dark-secondary">Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-dark-primary">
                      {site.contractDetails?.serviceLevel || 'N/A'}
                    </div>
                    <div className="text-xs text-dark-secondary">Service Level</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedSite(site)}
                    className="flex-1 dark-button-secondary text-sm py-2 gap-2 flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button 
                    onClick={() => {
                      setReportSiteId(site._id);
                      setReportSiteData(site);
                      setShowReportGenerator(true);
                    }}
                    className="dark-button-secondary p-2 text-blue-400 hover:text-blue-300"
                    title="Generate Site Report"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="dark-button-secondary p-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSite(site._id)}
                    className="dark-button-secondary p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : searchTerm.trim().length >= 2 ? (
          /* No search results found */
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-dark-secondary mx-auto mb-4" />
            <h3 className="text-xl font-medium text-dark-primary mb-2">No Sites Found</h3>
            <p className="text-dark-secondary mb-4">
              No sites match your search "{searchTerm}" 
              {(filterType !== "All" || filterStatus !== "All") && " and selected filters"}.
            </p>
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterType("All");
                setFilterStatus("All");
              }}
              className="dark-button-secondary gap-2 flex items-center mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        ) : null}

        {/* Add Site Modal */}
        {showAddSite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-primary">Add New Site</h2>
                <button 
                  onClick={() => {
                    setShowAddSite(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-dark-secondary rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Site Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Enter site name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Site Code *</label>
                    <Input
                      value={formData.siteCode}
                      onChange={(e) => setFormData({...formData, siteCode: e.target.value.toUpperCase()})}
                      className="bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Enter site code (e.g., NOMAL123)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Region *</label>
                      <select
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      >
                        {regions.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">State *</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Site Type *</label>
                    <select
                      value={formData.siteType}
                      onChange={(e) => setFormData({...formData, siteType: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      {siteTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      {siteStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <h4 className="text-md font-semibold text-dark-primary mt-6">Address</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Street Address *</label>
                    <Input
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">City *</label>
                      <Input
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, city: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">State *</label>
                      <Input
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, state: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Pincode *</label>
                      <Input
                        value={formData.address.pincode}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, pincode: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="Pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Country</label>
                      <Input
                        value={formData.address.country}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, country: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Contract Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Contact Person</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Name *</label>
                    <Input
                      value={formData.contactPerson.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, name: e.target.value}
                      })}
                      className="bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Email *</label>
                    <Input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, email: e.target.value}
                      })}
                      className="bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Email address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Phone *</label>
                      <Input
                        value={formData.contactPerson.phone}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contactPerson: {...formData.contactPerson, phone: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Designation</label>
                      <Input
                        value={formData.contactPerson.designation}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contactPerson: {...formData.contactPerson, designation: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="Job title"
                      />
                    </div>
                  </div>

                  {/* Business Hours */}
                  <h4 className="text-md font-semibold text-dark-primary mt-6">Business Hours</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Open Time</label>
                      <Input
                        type="time"
                        value={formData.businessHours.openTime}
                        onChange={(e) => setFormData({
                          ...formData, 
                          businessHours: {...formData.businessHours, openTime: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Close Time</label>
                      <Input
                        type="time"
                        value={formData.businessHours.closeTime}
                        onChange={(e) => setFormData({
                          ...formData, 
                          businessHours: {...formData.businessHours, closeTime: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                      />
                    </div>
                  </div>

                  {/* Contract Details */}
                  <h4 className="text-md font-semibold text-dark-primary mt-6">Contract Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-2">Contract Number</label>
                    <Input
                      value={formData.contractDetails.contractNumber}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contractDetails: {...formData.contractDetails, contractNumber: e.target.value}
                      })}
                      className="bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Contract number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Start Date</label>
                      <Input
                        type="date"
                        value={formData.contractDetails.startDate}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contractDetails: {...formData.contractDetails, startDate: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">End Date</label>
                      <Input
                        type="date"
                        value={formData.contractDetails.endDate}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contractDetails: {...formData.contractDetails, endDate: e.target.value}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Contract Value (₹)</label>
                      <Input
                        type="number"
                        value={formData.contractDetails.contractValue}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contractDetails: {...formData.contractDetails, contractValue: Number(e.target.value)}
                        })}
                        className="bg-dark-bg border-dark-color text-dark-primary"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-secondary mb-2">Service Level</label>
                      <select
                        value={formData.contractDetails.serviceLevel}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contractDetails: {...formData.contractDetails, serviceLevel: e.target.value}
                        })}
                        className="w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      >
                        {serviceLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 mt-6 border-t border-dark-color">
                <button 
                  onClick={() => {
                    setShowAddSite(false);
                    resetForm();
                  }}
                  className="flex-1 dark-button-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSite}
                  disabled={!formData.name || !formData.address.street || !formData.contactPerson.name}
                  className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Site
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Site Details Modal */}
        {selectedSite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-primary">Site Details</h2>
                <button 
                  onClick={() => setSelectedSite(null)}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-dark-secondary rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Site Name</label>
                        <p className="text-dark-primary font-semibold">{selectedSite.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Type</label>
                        <div className={`dark-tag ${getTypeColor(selectedSite.siteType)} inline-flex items-center gap-1 mt-1`}>
                          <Building2 className="w-3 h-3" />
                          {selectedSite.siteType}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Status</label>
                        <div className={`dark-tag ${getStatusColor(selectedSite.status)} inline-flex items-center gap-1 mt-1`}>
                          {selectedSite.status}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Address</label>
                        <p className="text-dark-primary">{selectedSite.fullAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-dark-secondary" />
                        <div>
                          <p className="text-dark-primary font-medium">{selectedSite.contactPerson.name}</p>
                          <p className="text-sm text-dark-secondary">{selectedSite.contactPerson.designation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-dark-secondary" />
                        <p className="text-dark-primary">{selectedSite.contactPerson.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-dark-secondary" />
                        <p className="text-dark-primary">{selectedSite.contactPerson.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-dark-secondary" />
                        <p className="text-dark-primary">
                          {selectedSite.businessHours.openTime} - {selectedSite.businessHours.closeTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Contract Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract Number</label>
                        <p className="text-dark-primary">{selectedSite.contractDetails?.contractNumber || 'Not specified'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-dark-secondary">Start Date</label>
                          <p className="text-dark-primary">{formatDate(selectedSite.contractDetails?.startDate)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-dark-secondary">End Date</label>
                          <p className="text-dark-primary">{formatDate(selectedSite.contractDetails?.endDate)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-dark-secondary">Contract Value</label>
                          <p className="text-dark-primary font-semibold">
                            ₹{selectedSite.contractDetails?.contractValue?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-dark-secondary">Service Level</label>
                          <p className="text-dark-primary">{selectedSite.contractDetails?.serviceLevel}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Projector Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-dark-bg rounded-lg">
                        <div className="text-2xl font-bold text-dark-primary mb-1">{selectedSite.totalProjectors || 0}</div>
                        <div className="text-sm text-dark-secondary">Total Projectors</div>
                      </div>
                      <div className="text-center p-4 bg-dark-bg rounded-lg">
                        <div className="text-2xl font-bold text-dark-primary mb-1">{selectedSite.activeProjectors || 0}</div>
                        <div className="text-sm text-dark-secondary">Active Projectors</div>
                      </div>
                      <div className="text-center p-4 bg-dark-bg rounded-lg">
                        <div className="text-2xl font-bold text-dark-primary mb-1">{selectedSite.totalAuditoriums || 0}</div>
                        <div className="text-sm text-dark-secondary">Total Auditoriums</div>
                      </div>
                    </div>
                  </div>

                  {/* Auditorium Management */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-dark-primary">Auditorium Management</h3>
                      <button
                        onClick={() => setShowAuditoriums(!showAuditoriums)}
                        className="dark-button-secondary px-4 py-2"
                      >
                        {showAuditoriums ? 'Hide' : 'Show'} Auditoriums
                      </button>
                    </div>
                    
                    {showAuditoriums && (
                      <div className="bg-dark-card border border-dark-color rounded-lg p-4">
                        <AuditoriumManager
                          siteId={selectedSite._id}
                          siteName={selectedSite.name}
                          auditoriums={selectedSite.auditoriums || []}
                          onAuditoriumUpdate={handleAuditoriumUpdate}
                          onProjectorAdd={handleProjectorAdd}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 mt-6 border-t border-dark-color">
                <button className="flex-1 dark-button-secondary">Edit Site</button>
                <button 
                  onClick={() => {
                    setReportSiteId(selectedSite._id);
                    setReportSiteData(selectedSite);
                    setShowReportGenerator(true);
                  }}
                  className="dark-button-secondary px-6 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Report
                </button>
                <button 
                  onClick={() => handleExportDetails(selectedSite._id)}
                  className="dark-button-secondary px-6"
                >
                  Export Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Site Report Generator Modal */}
        {showReportGenerator && (
          <SiteReportGenerator
            siteId={reportSiteId}
            siteData={reportSiteData}
            onClose={() => {
              setShowReportGenerator(false);
              setReportSiteId(null);
              setReportSiteData(null);
            }}
          />
        )}
      </main>
    </>
  );
}