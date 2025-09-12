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
  const { user } = useAuth();
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
        console.log('Service visits not available, using demo data');
        // Create demo service visits with current user's name
        const demoVisits: ServiceVisit[] = [
          {
            _id: 'visit-1',
            visitId: 'VISIT-001',
            fseId: currentFSE.fseId,
            fseName: currentFSE.name,
            siteId: 'SITE-001',
            siteName: 'Downtown Office Building',
            projectorSerial: 'PROJ-001',
            visitType: 'Scheduled Maintenance',
            amcServiceInterval: 'First Service',
            scheduledDate: new Date().toISOString(),
            actualDate: new Date().toISOString(),
            startTime: '09:00',
            endTime: '11:30',
            status: 'Completed',
            priority: 'Medium',
            description: 'Routine maintenance check',
            workPerformed: 'Cleaned lens, checked alignment, updated firmware',
            partsUsed: [
              {
                partNumber: 'LENS-001',
                partName: 'Replacement Lens',
                quantity: 1,
                cost: 150.00
              }
            ],
            totalCost: 150.00,
            customerFeedback: {
              rating: 5,
              comments: 'Excellent service, very professional'
            },
            photos: [
              {
                filename: 'before_service_001.jpg',
                originalName: 'before_service_001.jpg',
                cloudUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/before_service_001.jpg',
                publicId: 'before_service_001',
                uploadedAt: new Date().toISOString(),
                description: 'Before service photo',
                category: 'Before Service',
                fileSize: 1024000,
                mimeType: 'image/jpeg'
              }
            ],
            issuesFound: [
              {
                description: 'Minor dust accumulation on lens',
                severity: 'Low',
                resolved: true
              }
            ],
            recommendations: [
              {
                description: 'Schedule next maintenance in 6 months',
                priority: 'Medium'
              }
            ],
            nextVisitDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            travelDistance: 15.5,
            travelTime: 25,
            expenses: {
              fuel: 25.00,
              food: 15.00,
              accommodation: 0,
              other: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setServiceVisits(demoVisits);
      }

      // Load service reports
      try {
        const reports = await apiClient.getAllServiceReports();
        setServiceReports(reports || []);
      } catch (reportError) {
        console.log('Service reports not available, using demo data');
        // Create demo service reports with current user's name
        const demoReports: ServiceReport[] = [
          {
            _id: 'report-1',
            reportId: 'RPT-001',
            visitId: 'VISIT-001',
            fseId: currentFSE.fseId,
            fseName: currentFSE.name,
            siteId: 'SITE-001',
            siteName: 'Downtown Office Building',
            projectorSerial: 'PROJ-001',
            reportDate: new Date().toISOString(),
            serviceType: 'Scheduled Maintenance',
            workPerformed: 'Cleaned lens, checked alignment, updated firmware',
            partsUsed: [
              {
                partNumber: 'LENS-001',
                partName: 'Replacement Lens',
                quantity: 1,
                cost: 150.00
              }
            ],
            totalCost: 150.00,
            customerFeedback: {
              rating: 5,
              comments: 'Excellent service, very professional'
            },
            photos: [
              {
                filename: 'before_service_001.jpg',
                originalName: 'before_service_001.jpg',
                cloudUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/before_service_001.jpg',
                publicId: 'before_service_001',
                uploadedAt: new Date().toISOString(),
                description: 'Before service photo',
                category: 'Before Service'
              }
            ],
            issuesFound: [
              {
                description: 'Minor dust accumulation on lens',
                severity: 'Low',
                resolved: true
              }
            ],
            recommendations: [
              {
                description: 'Schedule next maintenance in 6 months',
                priority: 'Medium'
              }
            ],
            nextVisitDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setServiceReports(demoReports);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FSE Portal</h1>
                <p className="text-sm text-gray-600">Field Service Engineer Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">{fse?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
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
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Visits</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalVisits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedVisits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingVisits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Photos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalPhotos}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                {serviceVisits.slice(0, 5).map((visit) => (
                  <div key={visit._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{visit.siteName}</p>
                        <p className="text-xs text-gray-500">{visit.visitType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)}`}>
                        {visit.status}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(visit.scheduledDate)}</span>
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
              <h2 className="text-2xl font-bold text-gray-900">Service Visits</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Visit
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceVisits.map((visit) => (
                      <tr key={visit._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{visit.siteName}</div>
                            <div className="text-sm text-gray-500">{visit.projectorSerial}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.visitType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(visit.scheduledDate)}</td>
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
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
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
  );
};

export default RealFSEDashboard;
