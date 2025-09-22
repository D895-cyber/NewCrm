import { useState, useEffect } from "react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { 
  Monitor, 
  Plus, 
  Search, 
  Calendar,
  MapPin,
  User,
  Wrench,
  Package,
  RotateCcw,
  AlertTriangle,
  Clock,
  FileText,
  History,
  Download,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  X
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV } from "../../utils/export";
import { isDevelopment } from "../../utils/config";

export function ProjectorsPage() {
  const [searchSerial, setSearchSerial] = useState("");
  const [selectedProjector, setSelectedProjector] = useState<any>(null);
  const [, setSearchResult] = useState<any>(null);
  const [showAllProjectors, setShowAllProjectors] = useState(true);
  const [allProjectors, setAllProjectors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjector, setNewProjector] = useState({
    projectorNumber: "",
    serialNumber: "",
    model: "",
    brand: "",
    siteId: "",
    siteName: "",
    siteCode: "",
    auditoriumId: "",
    auditoriumName: "",
    installDate: "",
    warrantyEnd: "",
    status: "Active",
    condition: "Good",
    lastService: "",
    nextService: "",
    totalServices: 0,
    hoursUsed: 0,
    expectedLife: 10000,
    position: "",
    rackPosition: "",
    customer: "",
    technician: "",
    location: ""
  });
  const [sites, setSites] = useState<any[]>([]);
  const [projectorReports, setProjectorReports] = useState<any[]>([]);
  const [projectorSpares, setProjectorSpares] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('checking');
      
      
      // Always try to connect
      setConnectionStatus('connected');
      console.log('Attempting to connect to backend...');
      
      // Load all projectors and sites
      await Promise.all([loadAllProjectors(), loadSites()]);
      
      setIsInitialized(true);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setConnectionStatus('disconnected');
      setError(err.message || 'Failed to load data. Please check if the Express.js server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllProjectors = async () => {
    try {
      const projectors = await apiClient.getAllProjectors();
      
      // Load service reports to populate projector data
      const serviceReports = await apiClient.getAllServiceReports();
      
      // Enhance projector data with service report information
      const enhancedProjectors = projectors.map((projector: any) => {
        // Find all service reports for this projector
        const projectorReports = serviceReports.filter((report: any) => 
          report.projectorSerial === projector.serialNumber
        );
        
        // Calculate total services from reports
        const totalServices = projectorReports.length;
        
        // Calculate total hours from reports (sum of all hours mentioned in reports)
        const totalHours = projectorReports.reduce((sum: number, report: any) => {
          const hours = parseInt(report.projectorRunningHours) || 0;
          return sum + hours;
        }, 0);
        
        // Get latest service date from reports
        const latestServiceDate = projectorReports.length > 0 
          ? new Date(Math.max(...projectorReports.map((r: any) => new Date(r.date).getTime())))
          : null;
        
        // Get next service date (estimate based on last service + typical interval)
        const nextServiceDate = latestServiceDate 
          ? new Date(latestServiceDate.getTime() + (90 * 24 * 60 * 60 * 1000)) // 90 days default
          : null;
        
        // Calculate life percentage based on hours
        const lifePercentage = projector.expectedLife ? Math.round((totalHours / projector.expectedLife) * 100) : 0;
        
        return {
          ...projector,
          totalServices,
          hoursUsed: totalHours,
          lastService: latestServiceDate,
          nextService: nextServiceDate,
          lifePercentage,
          serviceHistory: projectorReports
        };
      });
      
      setAllProjectors(enhancedProjectors);
      console.log('Loaded enhanced projectors:', enhancedProjectors.length);
    } catch (err: any) {
      console.error('Error loading projectors:', err);
      setError('Failed to load projectors data: ' + err.message);
    }
  };

  const loadSites = async () => {
    try {
      const sitesData = await apiClient.getAllSites();
      setSites(sitesData);
      console.log('Loaded sites:', sitesData.length);
    } catch (err: any) {
      console.error('Error loading sites:', err);
      setError('Failed to load sites data: ' + err.message);
    }
  };

  const handleSearch = async () => {
    if (!searchSerial.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const projectorData = await apiClient.getProjector(searchSerial);
      
      if (projectorData && !projectorData.error) {
        // Fetch RMA history for this projector
        try {
          const rmaHistory = await apiClient.getRMAHistoryByProjector(searchSerial);
          projectorData.rmaHistory = rmaHistory || [];
        } catch (rmaErr: any) {
          console.error('Error fetching RMA history:', rmaErr);
          projectorData.rmaHistory = [];
        }
        // Fetch recent service reports
        try {
          const reports = await apiClient.getServiceReportsByProjector(searchSerial);
          setProjectorReports(reports || []);
          
          // Update projector data with service report information
          if (reports && reports.length > 0) {
            const totalServices = reports.length;
            const totalHours = reports.reduce((sum: number, report: any) => {
              const hours = parseInt(report.projectorRunningHours) || 0;
              return sum + hours;
            }, 0);
            
            const latestServiceDate = new Date(Math.max(...reports.map((r: any) => new Date(r.date).getTime())));
            const nextServiceDate = new Date(latestServiceDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days default
            const lifePercentage = selectedProjector.expectedLife ? Math.round((totalHours / selectedProjector.expectedLife) * 100) : 0;
            
            setSelectedProjector({
              ...selectedProjector,
              totalServices,
              hoursUsed: totalHours,
              lastService: latestServiceDate,
              nextService: nextServiceDate,
              lifePercentage
            });
          }
        } catch (repErr: any) {
          console.error('Error fetching reports:', repErr);
          setProjectorReports([]);
        }
        // Fetch recommended spares for this projector
        try {
          const spares = await apiClient.getRecommendedSpares({ projectorSerial: searchSerial });
          setProjectorSpares(spares || []);
        } catch (spErr: any) {
          console.error('Error fetching spares:', spErr);
          setProjectorSpares([]);
        }
        
        setSearchResult(projectorData);
        setSelectedProjector(projectorData);
        setShowAllProjectors(false);
        console.log('Found projector with RMA history:', projectorData);
      } else {
        setSearchResult(null);
        setSelectedProjector(null);
        setProjectorReports([]);
        setProjectorSpares([]);
        setError(`No projector found with serial number: ${searchSerial}`);
      }
    } catch (err: any) {
      console.error('Error searching for projector:', err);
      setSearchResult(null);
      setSelectedProjector(null);
      setError(`Search failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-600";
      case "Under Service":
        return "bg-orange-600";
      case "Inactive":
        return "bg-gray-600";
      case "Needs Repair":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent":
        return "text-green-400";
      case "Good":
        return "text-blue-400";
      case "Fair":
        return "text-orange-400";
      case "Needs Repair":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-600";
      case "In Progress":
        return "bg-blue-600";
      case "Scheduled":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateProjector = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create projector data with proper field mapping
      const projectorData = {
        ...newProjector,
        installDate: newProjector.installDate ? new Date(newProjector.installDate) : new Date(),
        warrantyStart: (newProjector as any).warrantyStart ? new Date((newProjector as any).warrantyStart) : null,
        warrantyEnd: newProjector.warrantyEnd ? new Date(newProjector.warrantyEnd) : null,
        lastService: newProjector.lastService ? new Date(newProjector.lastService) : null,
        nextService: newProjector.nextService ? new Date(newProjector.nextService) : null
      };
      
      console.log('Creating projector with data:', projectorData);
      
      await apiClient.createProjector(projectorData);
      setShowAddModal(false);
      setNewProjector({
        serialNumber: "",
        model: "",
        brand: "",
        siteId: "",
        // site: "",
        location: "",
        installDate: "",
        // warrantyStart: "",
        warrantyEnd: "",
        status: "Active",
        condition: "Good",
        lastService: "",
        nextService: "",
        totalServices: 0,
        hoursUsed: 0,
        expectedLife: 10000,
        customer: "",
        technician: ""
      });
      
      // Reload the projector list
      await loadAllProjectors();
      
      // Show success toast
      (window as any).showToast?.({
        type: 'success',
        title: 'Projector Created Successfully',
        message: `Projector ${projectorData.serialNumber} has been added to the system`
      });
    } catch (err: any) {
      console.error('Error creating projector:', err);
      setError('Failed to create projector: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setIsLoading(true);
      const csvContent = convertToCSV(allProjectors, [
        'serialNumber', 'model', 'brand', 'site', 'location', 'status', 'condition', 'totalServices', 'hoursUsed'
      ]);
      downloadCSV(allProjectors, `projectors_report_${new Date().toISOString().split('T')[0]}.csv`);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Export Successful',
        message: 'Projectors report exported to CSV file'
      });
    } catch (err: any) {
      console.error('Error exporting report:', err);
      setError('Failed to export projectors report: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderParts = async () => {
    try {
      // This would typically open a parts ordering interface
      // For now, we'll show a toast message
      (window as any).showToast?.({
        type: 'info',
        title: 'Order Parts',
        message: 'Parts ordering interface will be available in the next update'
      });
    } catch (err: any) {
      console.error('Error ordering parts:', err);
      setError('Failed to open parts ordering: ' + err.message);
    }
  };

  if (!isInitialized && isLoading) {
    return (
      <>
        <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-dark-primary">Projector Management</h1>
              <p className="text-sm text-dark-secondary mt-1">Connecting to backend server...</p>
            </div>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
              {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-green-400" />}
              {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-400" />}
              <span className="text-sm text-dark-secondary">
                {connectionStatus === 'checking' && 'Connecting...'}
                {connectionStatus === 'connected' && 'Connected'}
                {connectionStatus === 'disconnected' && 'Disconnected'}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8 bg-dark-bg">
          <div className="text-center py-12">
            <Server className="w-16 h-16 text-dark-secondary mx-auto mb-4" />
            <h3 className="text-xl font-medium text-dark-primary mb-2">Connecting to Backend</h3>
            <p className="text-dark-secondary mb-4">Setting up Express.js server and MongoDB database...</p>
            {isDevelopment() && (
              <div className="text-xs text-dark-secondary">
                <p>API URL: {apiClient.getBaseUrl()}</p>
                <p className="mt-2">Make sure your Express.js server is running:</p>
                <code className="bg-dark-card px-2 py-1 rounded mt-1 inline-block">
                  cd server && npm run dev
                </code>
              </div>
            )}
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
            <h1 className="text-2xl font-semibold text-dark-primary">Projector Management</h1>
            <p className="text-sm text-dark-secondary mt-1">Search by serial number for complete projector details</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-green-400" />}
              {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-400" />}
              <span className="text-sm text-dark-secondary">
                {connectionStatus === 'connected' && 'Connected'}
                {connectionStatus === 'disconnected' && 'Disconnected'}
              </span>
            </div>
            <button 
              onClick={() => {
                setShowAllProjectors(true);
                setSearchResult(null);
                setSelectedProjector(null);
                setSearchSerial("");
                setError(null);
                loadAllProjectors();
              }}
              className="dark-button-secondary gap-2 flex items-center"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <button 
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await loadAllProjectors();
                  (window as any).showToast?.({
                    type: 'success',
                    title: 'Data Refreshed',
                    message: 'Projector data updated from latest service reports'
                  });
                } catch (err) {
                  console.error('Error refreshing data:', err);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="dark-button-secondary gap-2 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Reports
            </button>
            <button 
              onClick={() => {
                setShowAllProjectors(true);
                setSearchResult(null);
                setSelectedProjector(null);
                setSearchSerial("");
                setError(null);
              }}
              className="dark-button-secondary"
            >
              View All Projectors
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Add Projector
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
              <div>
                <p className="text-red-400">{error}</p>
                {connectionStatus === 'disconnected' && isDevelopment() && (
                  <div className="mt-2 text-xs text-red-300">
                    <p>To fix this issue:</p>
                    <p>1. Navigate to the server directory: <code className="bg-red-800 px-1 rounded">cd server</code></p>
                    <p>2. Install dependencies: <code className="bg-red-800 px-1 rounded">npm install</code></p>
                    <p>3. Start the server: <code className="bg-red-800 px-1 rounded">npm run dev</code></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Banner */}
        {connectionStatus === 'disconnected' && (
          <div className="mb-6 p-4 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-600">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400">Backend server not available</p>
                <p className="text-xs text-yellow-300 mt-1">The projector data will not be available until the server is running.</p>
              </div>
              <button 
                onClick={loadData}
                className="ml-auto dark-button-secondary text-sm px-3 py-1"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Data Source Info Banner */}
        <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-400">Automatic Data Population</h3>
              <p className="text-sm text-blue-200">
                Projector hours, service counts, and service dates are automatically calculated from completed service reports. 
                No manual entry required - data syncs automatically when FSE engineers submit reports.
              </p>
            </div>
          </div>
        </div>

        {/* Serial Number Search */}
        <div className="dark-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-dark-primary mb-2">Projector Serial Number Lookup</h2>
              <p className="text-dark-secondary">Enter a projector serial number to view complete details, service history, and RMA information</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-dark-secondary">MongoDB + Express.js</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary w-5 h-5" />
              <Input
                placeholder="Enter projector serial number..."
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 h-12 bg-dark-card border-dark-color text-dark-primary text-base"
                disabled={isLoading || connectionStatus === 'disconnected'}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading || !searchSerial.trim() || connectionStatus === 'disconnected'}
              className="dark-button-primary h-12 px-6 gap-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Rest of the component remains the same */}
        {/* Projector Details */}
        {selectedProjector && (
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 dark-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-dark-primary mb-2">{selectedProjector.model}</h2>
                    <p className="text-dark-secondary">Serial: {selectedProjector.serialNumber}</p>
                  </div>
                  <div className={`dark-tag ${getStatusColor(selectedProjector.status)}`}>
                    {selectedProjector.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Brand</label>
                      <p className="text-dark-primary font-semibold">{selectedProjector.brand}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Site Location</label>
                      <p className="text-dark-primary flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-dark-secondary" />
                        {selectedProjector.siteName || 'Site not linked'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Specific Location</label>
                      <p className="text-dark-primary">{selectedProjector.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Customer</label>
                      <p className="text-dark-primary">{selectedProjector.customer}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Install Date</label>
                      <p className="text-dark-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-dark-secondary" />
                        {formatDate(selectedProjector.installDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Warranty Start</label>
                      <p className="text-dark-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-dark-secondary" />
                        {selectedProjector.warrantyStart ? formatDate(selectedProjector.warrantyStart) : 
                         selectedProjector.amcContract?.contractStartDate ? formatDate(selectedProjector.amcContract.contractStartDate) : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Warranty End</label>
                      <p className="text-dark-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-dark-secondary" />
                        {formatDate(selectedProjector.warrantyEnd)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Condition</label>
                      <p className={`font-semibold ${getConditionColor(selectedProjector.condition)}`}>
                        {selectedProjector.condition}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Primary Technician</label>
                      <p className="text-dark-primary flex items-center gap-2">
                        <User className="w-4 h-4 text-dark-secondary" />
                        {selectedProjector.technician}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AMC Contract Information */}
              {selectedProjector.amcContract && (
                <div className="dark-card">
                  <h3 className="text-lg font-bold text-dark-primary mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    AMC Contract Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract Number</label>
                        <p className="text-dark-primary font-semibold">{selectedProjector.amcContract.contractNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract Status</label>
                        <div className={`dark-tag ${selectedProjector.amcContract.status === 'Active' ? 'bg-green-600' : 
                          selectedProjector.amcContract.status === 'Expired' ? 'bg-red-600' : 'bg-yellow-600'}`}>
                          {selectedProjector.amcContract.status}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract Value</label>
                        <p className="text-dark-primary font-semibold">₹{selectedProjector.amcContract.contractValue?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract Start</label>
                        <p className="text-dark-primary flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-dark-secondary" />
                          {formatDate(selectedProjector.amcContract.contractStartDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract End</label>
                        <p className="text-dark-primary flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-dark-secondary" />
                          {formatDate(selectedProjector.amcContract.contractEndDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Contract Manager</label>
                        <p className="text-dark-primary flex items-center gap-2">
                          <User className="w-4 h-4 text-dark-secondary" />
                          {selectedProjector.amcContract.contractManager}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Statistics */}
              <div className="dark-card">
                <h3 className="text-lg font-bold text-dark-primary mb-4">Usage Statistics</h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-2xl font-bold text-dark-primary mb-1">
                      {selectedProjector.hoursUsed?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-dark-secondary">Hours Used (from Reports)</div>
                  </div>
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-2xl font-bold text-dark-primary mb-1">
                      {selectedProjector.totalServices || 0}
                    </div>
                    <div className="text-sm text-dark-secondary">Total Services (from Reports)</div>
                  </div>
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-2xl font-bold text-dark-primary mb-1">
                      {selectedProjector.lifePercentage || 0}%
                    </div>
                    <div className="text-sm text-dark-secondary">Life Used (Calculated)</div>
                  </div>
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-sm text-dark-secondary mb-1">Next Service</div>
                    <div className="font-semibold text-dark-primary">
                      {formatDate(selectedProjector.nextService)}
                    </div>
                  </div>
                </div>
                
                {/* Data Source Info */}
                <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-300">Data Source: Service Reports</span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1">
                    Hours and service counts are automatically calculated from completed service reports
                  </p>
                </div>
              </div>
            </div>

            {/* Service History */}
            <div className="dark-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-dark-primary flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Service History ({selectedProjector.serviceHistory?.length || 0} services)
                </h3>
                <button className="dark-button-secondary text-sm px-4 py-2">
                  View All Services
                </button>
              </div>
              
              {selectedProjector.serviceHistory && selectedProjector.serviceHistory.length > 0 ? (
                <div className="space-y-4">
                  {selectedProjector.serviceHistory.map((service: any, index: number) => (
                    <div key={service._id} className="p-4 bg-dark-bg rounded-lg border border-dark-color">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-dark-primary">{service.reportType || 'Service Report'}</h4>
                            <div className={`dark-tag ${getServiceStatusColor(service.status || 'Completed')}`}>
                              {service.status || 'Completed'}
                            </div>
                            {index === 0 && <div className="dark-tag bg-blue-600">Latest</div>}
                            {index === 1 && <div className="dark-tag bg-purple-600">2nd Service</div>}
                            {index === 2 && <div className="dark-tag bg-orange-600">1st Service</div>}
                          </div>
                          <p className="text-sm text-dark-secondary">
                            {service.observations && service.observations.length > 0 
                              ? service.observations[0]?.description || 'Service completed'
                              : 'Service completed'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-dark-primary">{formatDate(service.date)}</p>
                          <p className="text-xs text-dark-secondary">{service.engineer?.name || 'FSE Engineer'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-dark-secondary">Report #:</span>
                          <p className="text-dark-primary font-medium">{service.reportNumber}</p>
                        </div>
                        <div>
                          <span className="text-dark-secondary">Running Hours:</span>
                          <p className="text-dark-primary font-medium">{service.projectorRunningHours || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-dark-secondary">Site:</span>
                          <p className="text-dark-primary font-medium">{service.siteName}</p>
                        </div>
                        <div>
                          <span className="text-dark-secondary">Engineer:</span>
                          <p className="text-dark-primary font-medium">
                            {service.engineer?.name || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
                  <p className="text-dark-secondary">No service history found</p>
                </div>
              )}
            </div>

            {/* Recent Service Report + Recommended Spares (from reports) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Service Report */}
              <div className="dark-card">
                <h3 className="text-xl font-bold text-dark-primary flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5" />
                  Recent Service Report
                </h3>
                {projectorReports.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-dark-bg rounded-lg border border-dark-color">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-dark-secondary">Visit</div>
                        <div className="text-sm font-medium text-dark-primary">{projectorReports[0].visitId}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-dark-secondary">Engineer:</span>
                          <p className="text-dark-primary font-medium">{projectorReports[0].engineer?.name || '—'}</p>
                        </div>
                        <div>
                          <span className="text-dark-secondary">Date:</span>
                          <p className="text-dark-primary font-medium">{formatDate(projectorReports[0].date)}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-dark-secondary text-sm">Image Evaluation</span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                          {Object.entries(projectorReports[0].sections?.imageEvaluation || {}).map(([k,v]) => (
                            <div key={k} className={`dark-tag ${v ? 'bg-green-600' : 'bg-gray-600'}`}>{k}</div>
                          ))}
                        </div>
                      </div>
                      {projectorReports[0].sections?.observations?.length > 0 && (
                        <div className="mt-3">
                          <span className="text-dark-secondary text-sm">Observations</span>
                          <ul className="list-disc pl-5 text-sm text-dark-primary mt-1">
                            {projectorReports[0].sections.observations.filter(Boolean).slice(0,4).map((o: string, i: number) => (
                              <li key={i}>{o}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <button
                          className="dark-button-secondary text-sm"
                          onClick={() => {
                            const id = projectorReports[0]._id;
                            window.location.hash = `#/service-reports/${id}?readonly=1`;
                          }}
                        >
                          View full report
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
                    <p className="text-dark-secondary">No service report found</p>
                  </div>
                )}
              </div>

              {/* Recommended Spares (queue) */}
              <div className="dark-card">
                <h3 className="text-xl font-bold text-dark-primary flex items-center gap-2 mb-6">
                  <Package className="w-5 h-5" />
                  Recommended Spares ({projectorSpares.length})
                </h3>
                {projectorSpares.length > 0 ? (
                  <div className="space-y-3">
                    {projectorSpares.slice(0,5).map((it: any) => (
                      <div key={it._id} className="p-4 bg-dark-bg rounded-lg border border-dark-color">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-dark-primary font-semibold">{it.partName}</h4>
                            <p className="text-sm text-dark-secondary">{it.partNumber}</p>
                          </div>
                          <div className={`dark-tag ${it.status === 'Approved' ? 'bg-green-600' : it.status === 'Ordered' ? 'bg-blue-600' : 'bg-yellow-600'}`}>{it.status}</div>
                        </div>
                        {it.notes && <p className="text-sm text-dark-secondary mt-2">{it.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
                    <p className="text-dark-secondary">No recommended spares yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* RMA History and Spare Parts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* RMA History */}
              <div className="dark-card">
                <h3 className="text-xl font-bold text-dark-primary flex items-center gap-2 mb-6">
                  <RotateCcw className="w-5 h-5" />
                  RMA History ({selectedProjector.rmaHistory?.length || 0})
                </h3>
                
                {selectedProjector.rmaHistory && selectedProjector.rmaHistory.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProjector.rmaHistory.map((rma: any, _index: number) => (
                      <div key={rma._id} className="p-4 bg-dark-bg rounded-lg border border-dark-color">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-dark-primary">{rma.partName}</h4>
                            <p className="text-sm text-dark-secondary">{rma.partNumber}</p>
                          </div>
                          <div className="text-right">
                            <div className={`dark-tag ${rma.status === "Under Review" ? "bg-yellow-600" : "bg-green-600"}`}>
                              {rma.status}
                            </div>
                            <p className="text-xs text-dark-secondary mt-1">{formatDate(rma.issueDate)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-dark-secondary mb-2">{rma.reason}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-dark-secondary">RMA #: {rma.rmaNumber}</span>
                          <span className="text-sm font-medium text-dark-primary">₹{rma.estimatedCost?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <RotateCcw className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
                    <p className="text-dark-secondary">No RMA history found</p>
                  </div>
                )}
              </div>

              {/* Associated Spare Parts */}
              <div className="dark-card">
                <h3 className="text-xl font-bold text-dark-primary flex items-center gap-2 mb-6">
                  <Package className="w-5 h-5" />
                  Associated Spare Parts ({selectedProjector.spareParts?.length || 0})
                </h3>
                
                {selectedProjector.spareParts && selectedProjector.spareParts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProjector.spareParts.map((part: any, _index: number) => (
                      <div key={part._id} className="p-4 bg-dark-bg rounded-lg border border-dark-color">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-dark-primary">{part.partName}</h4>
                            <p className="text-sm text-dark-secondary">{part.partNumber}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-dark-primary">₹{part.unitPrice?.toLocaleString()}</span>
                            <p className="text-xs text-dark-secondary">Stock: {part.stockQuantity}</p>
                          </div>
                        </div>
                        <div className="text-sm text-dark-secondary">
                          Last Updated: {formatDate(part.updatedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
                    <p className="text-dark-secondary">No spare parts found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="dark-button-primary gap-2 flex items-center">
                <Calendar className="w-4 h-4" />
                Schedule Service
              </button>
              <button className="dark-button-secondary gap-2 flex items-center">
                <Wrench className="w-4 h-4" />
                Update Status
              </button>
              <button 
                onClick={handleOrderParts}
                className="dark-button-secondary gap-2 flex items-center"
              >
                <Package className="w-4 h-4" />
                Order Parts
              </button>
              <button 
                onClick={handleExportReport}
                disabled={isLoading}
                className="dark-button-secondary gap-2 flex items-center"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        )}

        {/* All Projectors Grid */}
        {showAllProjectors && !selectedProjector && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-primary">All Projectors</h2>
              <p className="text-dark-secondary">{allProjectors.length} projectors in system</p>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-dark-secondary mx-auto mb-4 animate-spin" />
                <p className="text-dark-secondary">Loading projectors...</p>
              </div>
            ) : allProjectors.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {allProjectors.map((projector, _index) => (
                  <div key={projector.serialNumber} className="dark-card hover:dark-shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-dark-primary mb-1">{projector.model}</h3>
                        <p className="text-sm text-dark-secondary">{projector.serialNumber}</p>
                      </div>
                      <div className={`dark-tag ${getStatusColor(projector.status)}`}>
                        {projector.status}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-4 h-4 text-dark-secondary" />
                        <span className="text-dark-primary">{projector.siteName || 'Site not linked'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Monitor className="w-4 h-4 text-dark-secondary" />
                        <span className="text-dark-primary">{projector.auditoriumName || projector.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-dark-secondary" />
                        <span className="text-dark-primary">Last Service: {formatDate(projector.lastService)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                      <div>
                        <div className="text-lg font-bold text-dark-primary">{projector.totalServices || 0}</div>
                        <div className="text-xs text-dark-secondary">Services</div>
                        <div className="text-xs text-green-400">From Reports</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-dark-primary">{projector.hoursUsed || 0}</div>
                        <div className="text-xs text-dark-secondary">Hours</div>
                        <div className="text-xs text-green-400">From Reports</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-dark-primary">{projector.lifePercentage || 0}%</div>
                        <div className="text-xs text-dark-secondary">Life Used</div>
                        <div className="text-xs text-green-400">Calculated</div>
                      </div>
                    </div>

                    <button 
                      onClick={async () => {
                        setSelectedProjector(projector);
                        setShowAllProjectors(false);
                        setSearchSerial(projector.serialNumber);
                        setError(null);
                        // Load full details for the selected projector
                        try {
                          const fullData = await apiClient.getProjector(projector.serialNumber);
                          if (fullData && !fullData.error) {
                            // Enhance with service report data
                            const reports = await apiClient.getServiceReportsByProjector(projector.serialNumber);
                            if (reports && reports.length > 0) {
                              const totalServices = reports.length;
                              const totalHours = reports.reduce((sum: number, report: any) => {
                                const hours = parseInt(report.projectorRunningHours) || 0;
                                return sum + hours;
                              }, 0);
                              
                              const latestServiceDate = new Date(Math.max(...reports.map((r: any) => new Date(r.date).getTime())));
                              const nextServiceDate = new Date(latestServiceDate.getTime() + (90 * 24 * 60 * 60 * 1000));
                              const lifePercentage = fullData.expectedLife ? Math.round((totalHours / fullData.expectedLife) * 100) : 0;
                              
                              setSelectedProjector({
                                ...fullData,
                                totalServices,
                                hoursUsed: totalHours,
                                lastService: latestServiceDate,
                                nextService: nextServiceDate,
                                lifePercentage,
                                serviceHistory: reports
                              });
                            } else {
                              setSelectedProjector(fullData);
                            }
                          }
                        } catch (err) {
                          console.error('Error loading projector details:', err);
                        }
                      }}
                      className="w-full dark-button-primary text-sm py-2"
                      disabled={connectionStatus === 'disconnected'}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Monitor className="w-16 h-16 text-dark-secondary mx-auto mb-4" />
                <h3 className="text-xl font-medium text-dark-primary mb-2">No Projectors Found</h3>
                <p className="text-dark-secondary">
                  {connectionStatus === 'disconnected' 
                    ? 'Connect to the backend server to view projectors.'
                    : 'No projectors have been added to the system yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Projector Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-dark-primary">Add New Projector</h2>
                  <p className="text-sm text-dark-secondary mt-1">
                    Service data (hours, services, dates) will be auto-populated from FSE reports
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dark-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Serial Number *</label>
                    <Input
                      value={newProjector.serialNumber}
                      onChange={(e) => setNewProjector({...newProjector, serialNumber: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Enter serial number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Model *</label>
                    <Input
                      value={newProjector.model}
                      onChange={(e) => setNewProjector({...newProjector, model: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="e.g., Epson EB-2250U"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Brand *</label>
                    <Input
                      value={newProjector.brand}
                      onChange={(e) => setNewProjector({...newProjector, brand: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="e.g., Epson"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Site *</label>
                    <select
                      value={newProjector.siteId}
                      onChange={(e) => {
                        const selectedSite = sites.find(site => site._id === e.target.value);
                        setNewProjector({
                          ...newProjector, 
                          siteId: e.target.value,
                          siteName: selectedSite ? selectedSite.name : "",
                          siteCode: selectedSite ? selectedSite.siteCode : ""
                        });
                      }}
                      className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="">Select a site</option>
                      {sites.map((site) => (
                        <option key={site._id} value={site._id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Auditorium *</label>
                    <select
                      value={newProjector.auditoriumId}
                      onChange={(e) => {
                        const selectedSite = sites.find(site => site._id === newProjector.siteId);
                        const selectedAuditorium = selectedSite?.auditoriums?.find((audi: any) => audi.audiNumber === e.target.value);
                        setNewProjector({
                          ...newProjector, 
                          auditoriumId: e.target.value,
                          auditoriumName: selectedAuditorium ? selectedAuditorium.name : ""
                        });
                      }}
                      className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      disabled={!newProjector.siteId}
                    >
                      <option value="">Select an auditorium</option>
                      {newProjector.siteId && sites.find(site => site._id === newProjector.siteId)?.auditoriums?.map((auditorium: any) => (
                        <option key={auditorium.audiNumber} value={auditorium.audiNumber}>
                          {auditorium.name} ({auditorium.audiNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Status</label>
                    <select
                      value={newProjector.status}
                      onChange={(e) => setNewProjector({...newProjector, status: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="Active">Active</option>
                      <option value="Under Service">Under Service</option>
                      <option value="Retired">Retired</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Install Date</label>
                    <Input
                      type="date"
                      value={newProjector.installDate}
                      onChange={(e) => setNewProjector({...newProjector, installDate: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Position</label>
                    <Input
                      value={newProjector.position}
                      onChange={(e) => setNewProjector({...newProjector, position: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="e.g., Front Left, Center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Warranty End Date</label>
                    <Input
                      type="date"
                      value={newProjector.warrantyEnd}
                      onChange={(e) => setNewProjector({...newProjector, warrantyEnd: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Condition</label>
                    <select
                      value={newProjector.condition}
                      onChange={(e) => setNewProjector({...newProjector, condition: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Needs Repair">Needs Repair</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Expected Life (hours)</label>
                    <Input
                      type="number"
                      value={newProjector.expectedLife}
                      onChange={(e) => setNewProjector({...newProjector, expectedLife: Number(e.target.value)})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Hours Used</label>
                    <Input
                      type="number"
                      value={newProjector.hoursUsed}
                      onChange={(e) => setNewProjector({...newProjector, hoursUsed: Number(e.target.value)})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="0"
                      disabled
                    />
                    <p className="text-xs text-dark-secondary mt-1">Auto-populated from service reports</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Total Services</label>
                    <Input
                      type="number"
                      value={newProjector.totalServices}
                      onChange={(e) => setNewProjector({...newProjector, totalServices: Number(e.target.value)})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="0"
                      disabled
                    />
                    <p className="text-xs text-dark-secondary mt-1">Auto-populated from service reports</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Customer</label>
                    <Input
                      value={newProjector.customer}
                      onChange={(e) => setNewProjector({...newProjector, customer: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Customer name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Technician</label>
                    <Input
                      value={newProjector.technician}
                      onChange={(e) => setNewProjector({...newProjector, technician: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Technician name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Last Service Date</label>
                    <Input
                      type="date"
                      value={newProjector.lastService}
                      onChange={(e) => setNewProjector({...newProjector, lastService: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      disabled
                    />
                    <p className="text-xs text-dark-secondary mt-1">Auto-populated from service reports</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Next Service Date</label>
                    <Input
                      type="date"
                      value={newProjector.nextService}
                      onChange={(e) => setNewProjector({...newProjector, nextService: e.target.value})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      disabled
                    />
                    <p className="text-xs text-dark-secondary mt-1">Auto-calculated from last service</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 dark-button-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProjector}
                  disabled={isLoading || !newProjector.serialNumber || !newProjector.model || !newProjector.brand || !newProjector.siteId || !newProjector.location}
                  className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Projector'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}