import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Camera, 
  FileText, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Settings,
  LogOut,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Wrench,
  Camera as CameraIcon,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';

interface FSE {
  _id: string;
  fseId: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  specialization: string[];
  assignedTerritory: string[];
  status: string;
  experience: number;
  certifications: Array<{
    name: string;
    issuer: string;
    validUntil: string;
  }>;
  supervisor: {
    name: string;
    email: string;
    phone: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServiceVisit {
  _id: string;
  visitId: string;
  fseId: string;
  fseName: string;
  siteId: string;
  siteName: string;
  projectorSerial: string;
  visitType: string;
  amcContractId?: string;
  amcServiceInterval: string;
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
  customerFeedback?: {
    rating: number;
    comments: string;
  };
  photos: Array<{
    filename: string;
    originalName: string;
    cloudUrl: string;
    publicId: string;
    uploadedAt: string;
    description: string;
    category: string;
    fileSize: number;
    mimeType: string;
  }>;
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
    fuel: number;
    food: number;
    accommodation: number;
    other: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServiceReport {
  _id: string;
  reportId: string;
  visitId: string;
  fseId: string;
  fseName: string;
  siteId: string;
  siteName: string;
  projectorSerial: string;
  reportDate: string;
  serviceType: string;
  workPerformed: string;
  partsUsed: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    cost: number;
  }>;
  totalCost: number;
  customerFeedback: {
    rating: number;
    comments: string;
  };
  photos: Array<{
    filename: string;
    originalName: string;
    cloudUrl: string;
    publicId: string;
    uploadedAt: string;
    description: string;
    category: string;
  }>;
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
  createdAt: string;
  updatedAt: string;
}

const RealFSEDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [fse, setFSE] = useState<FSE | null>(null);
  const [serviceVisits, setServiceVisits] = useState<ServiceVisit[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'reports' | 'profile'>('overview');
  const [stats, setStats] = useState({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    totalReports: 0,
    totalPhotos: 0
  });

  // Load FSE data and related information
  useEffect(() => {
    loadFSEData();
  }, []);

  const loadFSEData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the authenticated user's information
      if (!user) {
        setError('No user authenticated');
        return;
      }

      // Create FSE profile from authenticated user
      const currentFSE: FSE = {
        _id: user.id || 'fse-user-id',
        fseId: user.fseId || `FSE-${Date.now()}`,
        name: user.name || user.username || 'FSE User',
        email: user.email || 'fse@projectorcare.com',
        phone: user.phone || '+1-555-0000',
        employeeId: user.employeeId || user.username || 'FSE001',
        designation: user.designation || 'Field Service Engineer',
        specialization: user.specialization || ['Projector Installation', 'Maintenance', 'Repair'],
        assignedTerritory: user.assignedTerritory || ['General Territory'],
        status: 'Active',
        experience: user.experience || 0,
        certifications: user.certifications || [
          {
            name: 'Field Service Engineer',
            issuer: 'ProjectorCare',
            validUntil: '2025-12-31'
          }
        ],
        supervisor: user.supervisor || {
          name: 'Supervisor',
          email: 'supervisor@projectorcare.com',
          phone: '+1-555-0001'
        },
        emergencyContact: user.emergencyContact || {
          name: 'Emergency Contact',
          relationship: 'Contact',
          phone: '+1-555-0002'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setFSE(currentFSE);

      // Load service visits
      try {
        const visits = await apiClient.getServiceVisitsByFSE(currentFSE.fseId);
        setServiceVisits(visits || []);
      } catch (visitError) {
        console.log('Service visits not available, showing empty state');
        // Show empty state instead of demo data for new FSE users
        setServiceVisits([]);
      }

      // Load service reports
      try {
        const reports = await apiClient.getAllServiceReports();
        setServiceReports(reports || []);
      } catch (reportError) {
        console.log('Service reports not available, showing empty state');
        // Show empty state instead of demo data for new FSE users
        setServiceReports([]);
      }

      // Calculate stats
      const totalVisits = serviceVisits.length;
      const completedVisits = serviceVisits.filter(v => v.status === 'Completed').length;
      const pendingVisits = serviceVisits.filter(v => v.status === 'Scheduled' || v.status === 'In Progress').length;
      const totalReports = serviceReports.length;
      const totalPhotos = serviceVisits.reduce((sum, visit) => sum + (visit.photos?.length || 0), 0);

      setStats({
        totalVisits,
        completedVisits,
        pendingVisits,
        totalReports,
        totalPhotos
      });

    } catch (err) {
      console.error('Error loading FSE data:', err);
      setError('Failed to load FSE data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFSEData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString || 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading FSE Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-bg border-b border-dark-color p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark-primary">FSE Portal</h1>
            <p className="text-xs text-dark-secondary">Field Service Engineer Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-dark-secondary hover:text-dark-primary transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-dark-secondary" />
            <span className="text-sm text-dark-secondary">{fse?.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-dark-secondary hover:text-dark-primary hover:bg-dark-color rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-dark-bg border-b border-dark-color pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'visits', label: 'Service Visits', icon: Calendar },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'profile', label: 'Profile', icon: User }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-dark-secondary hover:text-dark-primary hover:border-dark-color'
                }`}
              >
                <tab.icon className="h-4 w-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-dark-secondary">Total Visits</p>
                    <p className="text-2xl font-semibold text-dark-primary">{stats.totalVisits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color p-6 hover:border-green-500/50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-dark-secondary">Completed</p>
                    <p className="text-2xl font-semibold text-dark-primary">{stats.completedVisits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color p-6 hover:border-yellow-500/50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-dark-secondary">Pending</p>
                    <p className="text-2xl font-semibold text-dark-primary">{stats.pendingVisits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color p-6 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Camera className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-dark-secondary">Photos</p>
                    <p className="text-2xl font-semibold text-dark-primary">{stats.totalPhotos}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color">
              <div className="px-6 py-4 border-b border-dark-color">
                <h3 className="text-lg font-medium text-dark-primary">Recent Activity</h3>
              </div>
              <div className="p-6">
                {serviceVisits.slice(0, 5).map((visit) => (
                  <div key={visit._id} className="flex items-center justify-between py-3 border-b border-dark-color last:border-b-0">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-primary">{visit.siteName}</p>
                        <p className="text-xs text-dark-secondary">{visit.visitType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)}`}>
                        {visit.status}
                      </span>
                      <span className="text-xs text-dark-secondary">{formatDate(visit.scheduledDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-dark-primary">Service Visits</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                New Visit
              </button>
            </div>

            <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-color">
                  <thead className="bg-dark-color">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-card divide-y divide-dark-color">
                    {serviceVisits.map((visit) => (
                      <tr key={visit._id} className="hover:bg-dark-color/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-dark-primary">{visit.siteName}</div>
                            <div className="text-sm text-dark-secondary">{visit.projectorSerial}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">{visit.visitType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">{formatDate(visit.scheduledDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)}`}>
                            {visit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(visit.priority)}`}>
                            {visit.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-400 hover:text-blue-300 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-400 hover:text-green-300 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Service Reports</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceReports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.reportId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.siteName}</div>
                            <div className="text-sm text-gray-500">{report.projectorSerial}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(report.reportDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.serviceType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${report.totalCost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && fse && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.designation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.experience} years</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Specialization</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {fse.specialization.map((spec, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Assigned Territory</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {fse.assignedTerritory.map((territory, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {territory}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Supervisor</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.supervisor.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.supervisor.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{fse.supervisor.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default RealFSEDashboard;
