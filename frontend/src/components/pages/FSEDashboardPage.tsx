import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Clock, 
  Play,
  Wrench,
  FileText,
  Building,
  Monitor,
  Star,
  LogOut
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../utils/api/client";
import { ServiceReportEditor } from "./ServiceReportEditor";

interface ServiceVisit {
  _id: string;
  visitId: string;
  fseId: string;
  fseName: string;
  siteId: string;
  siteName: string;
  projectorSerial: string;
  visitType: string;
  scheduledDate: string;
  actualDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  priority: string;
  description?: string;
  workPerformed?: string;
  photos: Array<{
    filename: string;
    originalName: string;
    path: string;
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
  customerFeedback?: {
    rating: number;
    comments: string;
  };
}

export function FSEDashboardPage() {
  const { user, logout } = useAuth();
  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<ServiceVisit | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [preparingReport, setPreparingReport] = useState<string | null>(null);
  const [reportIdFromHash, setReportIdFromHash] = useState<string | null>(null);

  // Load FSE's assigned visits
  useEffect(() => {
    if (user?.fseId) {
      loadFSEReports();
    }
  }, [user]);

  // Lightweight hash route so FSE can open the report editor full-screen
  useEffect(() => {
    const apply = () => {
      const match = window.location.hash.match(/#\/service-reports\/([^/?]+)/);
      setReportIdFromHash(match ? match[1] : null);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const loadFSEReports = async () => {
    try {
      setIsLoading(true);
      console.log('Loading FSE reports for user:', user);
      console.log('FSE ID:', user?.fseId);
      
      let response;
      if (user?.fseId) {
        // If user has FSE ID, load their specific visits
        console.log('Loading visits for specific FSE:', user.fseId);
        response = await apiClient.getServiceVisitsByFSE(user.fseId);
      } else {
        // For demo purposes, if no FSE ID, try to load visits for Satish (FSE-005)
        console.log('No FSE ID found, loading visits for Satish (FSE-005) for demo');
        response = await apiClient.getServiceVisitsByFSE('FSE-005');
      }
      
      console.log('FSE visits response:', response);
      setVisits(response);
    } catch (err: any) {
      console.error('Error loading FSE reports:', err);
      setError(err.message);
      // Fallback to empty array
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (visitId: string, newStatus: string) => {
    try {
      await apiClient.updateServiceVisit(visitId, { status: newStatus });
      await loadFSEReports(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Updated to support multiple photos
  const handlePhotoUpload = async (visitId: string, files: File[], description: string, category: string) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      files.forEach((file) => formData.append('photos', file));
      formData.append('description', description);

      // Automated upload to create category folders
      await apiClient.uploadServiceVisitPhotosAutomated(visitId, formData, category);
      await loadFSEReports();
      setShowPhotoUpload(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate dashboard metrics
  const totalVisits = visits.length;
  const completedVisits = visits.filter(v => v.status === 'Completed').length;
  const pendingVisits = visits.filter(v => v.status === 'Scheduled').length;
  const inProgressVisits = visits.filter(v => v.status === 'In Progress').length;
  const averageRating = visits
    .filter(v => v.customerFeedback?.rating)
    .reduce((acc, v) => acc + (v.customerFeedback?.rating || 0), 0) / 
    visits.filter(v => v.customerFeedback?.rating).length || 0;

  if (reportIdFromHash) {
    return <ServiceReportEditor reportId={reportIdFromHash} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FSE Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.profile?.firstName || user?.username}!
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => {
              console.log('=== FSE DASHBOARD DEBUG INFO ===');
              console.log(':', user);
              console.log('FSE ID:', user?.fseId);
              console.log('Total visits loaded:', visits.length);
              console.log('Visits data:', visits);
              
              const debugInfo = `
FSE Dashboard Debug Info:
- Role: ${user?.role}
- FSE ID: ${user?.fseId || 'Not Set'}
- Total Visits: ${visits.length}
- Current Date: ${new Date().toISOString()}

Visits Sample:
${visits.slice(0, 3).map(v => 
  `- ${v.visitId}: ${v.siteName} (${v.status}) - ${v.fseName}`
).join('\n')}
              `;
              alert(debugInfo);
            }}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <div className="w-4 h-4" />
            <span>Debug Info</span>
          </Button>
          <Button
            onClick={() => window.location.hash = '#mobile-fse'}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <Wrench className="w-4 h-4" />
            <span>Mobile Portal</span>
          </Button>
          <Badge className="bg-blue-100 text-blue-700">
            {user?.fseDetails?.designation || 'Field Service Engineer'}
          </Badge>
          <Badge className="bg-green-100 text-green-700">
            {user?.fseDetails?.status || 'Active'}
          </Badge>
          <Button
            onClick={logout}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <div className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedVisits}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <div className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingVisits}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-purple-600">
                  {averageRating.toFixed(1)} ⭐
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5" />
            My Service Visits
          </CardTitle>
          <CardDescription>
            Your assigned and recent service visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No service visits assigned yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                {user?.fseId ? `FSE ID: ${user.fseId}` : 'Demo Mode: Loading visits for Satish (FSE-005)'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.slice(0, 5).map((visit) => (
                <div
                  key={visit._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(visit.status)}>
                        {visit.status}
                      </Badge>
                      <Badge className={getPriorityColor(visit.priority)}>
                        {visit.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(visit.scheduledDate)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{visit.siteName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{visit.projectorSerial}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{visit.visitType}</span>
                    </div>
                  </div>

                  {visit.description && (
                    <p className="text-sm text-gray-600 mb-3">{visit.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {visit.photos.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {visit.photos.length} photos
                        </Badge>
                      )}
                      {visit.issuesFound.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {visit.issuesFound.length} issues
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {visit.status === 'Scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(visit._id, 'In Progress')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {visit.status === 'In Progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(visit._id, 'Completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <div className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisit(visit);
                          setShowPhotoUpload(true);
                        }}
                      >
                        <div className="w-4 h-4 mr-1" />
                        Photos
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={preparingReport === visit.visitId}
                        onClick={async () => {
                          try {
                            console.log('Visit object:', visit);
                            console.log('object:', user);
                            
                            setPreparingReport(visit.visitId);
                            
                            console.log('Checking for existing reports for visitId:', visit.visitId);
                            const existing = await apiClient.getServiceReportsByVisit(visit.visitId);
                            console.log('Existing reports response:', existing);
                            
                            let reportId = existing?.[0]?._id;
                            console.log('Existing report ID:', reportId);
                            
                            if (!reportId) {
                              console.log('Creating new service report...');
                              // Determine report type from projector history
                              let computedType: 'First' | 'Second' | 'Third' | 'Fourth' = 'First';
                              try {
                                const history = await apiClient.getServiceReportsByProjector(visit.projectorSerial);
                                const count = Array.isArray(history) ? history.length : (history?.data?.length || 0);
                                computedType = count === 0 ? 'First' : count === 1 ? 'Second' : count === 2 ? 'Third' : 'Fourth';
                              } catch (err) {
                                console.warn('History check failed, defaulting to First');
                              }
                              // Fetch projector details to get model and brand
                              let projectorModel = 'Unknown Model';
                              let brand = 'Unknown Brand';
                              try {
                                const projectors = await apiClient.getAllProjectors();
                                const projector = projectors.find((p: any) => p.serialNumber === visit.projectorSerial);
                                if (projector) {
                                  projectorModel = projector.model || 'Unknown Model';
                                  brand = projector.brand || 'Unknown Brand';
                                }
                              } catch (err) {
                                console.warn('Failed to fetch projector details, using defaults');
                              }

                              const reportData = {
                                reportNumber: `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                visitId: visit.visitId,
                                siteId: visit.siteId,
                                siteName: visit.siteName,
                                projectorSerial: visit.projectorSerial,
                                projectorModel: projectorModel,
                                brand: brand,
                                reportType: computedType,
                                engineer: { name: user?.profile?.firstName || user?.username },
                                sections: {
                                  opticals: [
                                    { description: 'Reflector', status: '-', result: 'OK' },
                                    { description: 'UV filter', status: '-', result: 'OK' },
                                    { description: 'Integrator Rod', status: '-', result: 'OK' },
                                    { description: 'Cold Mirror', status: '-', result: 'OK' },
                                    { description: 'Fold Mirror', status: '-', result: 'OK' }
                                  ],
                                  electronics: [
                                    { description: 'Touch Panel', status: '-', result: 'OK' },
                                    { description: 'EVB Board', status: '-', result: 'OK' },
                                    { description: 'IMCB Board/s', status: '-', result: 'OK' },
                                    { description: 'PIB Board', status: '-', result: 'OK' },
                                    { description: 'ICP Board', status: '-', result: 'OK' },
                                    { description: 'IMB/S Board', status: '-', result: 'OK' }
                                  ],
                                  mechanical: [
                                    { description: 'AC blower and Vane Switch', status: '-', result: 'OK' },
                                    { description: 'Extractor Vane Switch', status: '-', result: 'OK' },
                                    { description: 'Exhaust CFM', status: '7.5 M/S', result: 'OK' },
                                    { description: 'Light Engine 4 fans with LAD fan', status: '-', result: 'OK' },
                                    { description: 'Card Cage Top and Bottom fans', status: '-', result: 'OK' },
                                    { description: 'Radiator fan and Pump', status: '-', result: 'OK' },
                                    { description: 'Connector and hose for the Pump', status: '-', result: 'OK' },
                                    { description: 'Security and lamp house lock switch', status: '-', result: 'OK' },
                                    { description: 'Lamp LOC Mechanism X, Y and Z movement', status: '-', result: 'OK' }
                                  ],
                                  disposableConsumables: [
                                    { description: 'Air Intake, LAD and RAD', status: 'Replaced', result: 'OK' }
                                  ],
                                  coolant: { description: 'Level and Color', status: '-', result: 'OK' },
                                  lightEngineTestPatterns: [
                                    { color: 'White', status: '-', result: 'OK' },
                                    { color: 'Red', status: '-', result: 'OK' },
                                    { color: 'Green', status: '-', result: 'OK' },
                                    { color: 'Blue', status: '-', result: 'OK' },
                                    { color: 'Black', status: '-', result: 'OK' }
                                  ],
                                  serialNumberVerified: {
                                    description: 'Chassis label vs Touch Panel', status: '-', result: 'OK'
                                  }
                                },
                                imageEvaluation: {
                                  focusBoresight: 'Yes', integratorPosition: 'Yes', spotOnScreen: 'No',
                                  screenCropping: 'Yes', convergenceChecked: 'Yes', channelsChecked: 'Yes',
                                  pixelDefects: 'No', imageVibration: 'No', liteLoc: 'No'
                                },
                                measuredColorCoordinates: [
                                  { testPattern: 'White 2K', fl: '', x: '', y: '' },
                                  { testPattern: 'White 4K', fl: '', x: '', y: '' },
                                  { testPattern: 'Red 2K', fl: '', x: '', y: '' },
                                  { testPattern: 'Red 4K', fl: '', x: '', y: '' },
                                  { testPattern: 'Green 2K', fl: '', x: '', y: '' },
                                  { testPattern: 'Green 4K', fl: '', x: '', y: '' },
                                  { testPattern: 'Blue 2K', fl: '', x: '', y: '' },
                                  { testPattern: 'Blue 4K', fl: '', x: '', y: '' }
                                ],
                                cieColorAccuracy: [
                                  { testPattern: 'BW Step-10 2K', x: '', y: '', fl: '' },
                                  { testPattern: 'BW Step-10 4K', x: '', y: '', fl: '' }
                                ],
                                screenInfo: {
                                  scope: { height: '', width: '', gain: '' },
                                  flat: { height: '', width: '', gain: '' },
                                  screenMake: '', throwDistance: ''
                                },
                                voltageParameters: { pVsN: '', pVsE: '', nVsE: '' },
                                lampPowerMeasurements: { flBeforePM: '', flAfterPM: '' },
                                environmentStatus: { projectorPlacement: 'ok', room: 'ok', environment: 'ok' },
                                observations: [
                                  { number: 1, description: '' },
                                  { number: 2, description: '' },
                                  { number: 3, description: '' },
                                  { number: 4, description: '' },
                                  { number: 5, description: '' },
                                  { number: 6, description: '' }
                                ]
                              };
                              console.log('Report data being sent:', reportData);
                              
                              const created = await apiClient.createServiceReport(reportData);
                              console.log('Created report response:', created);
                              reportId = created.report._id;
                            }
                            
                            console.log('Final report ID:', reportId);
                            window.location.hash = `#/service-reports/${reportId}`;
                          } catch (e) {
                            console.error('Report open/create failed', e);
                            console.error('Error details:', {
                              message: e.message,
                              stack: e.stack,
                              visit: visit,
                              user: user
                            });
                            (window as any).showToast?.({ type: 'error', title: 'Report', message: 'Could not open report' });
                          } finally {
                            setPreparingReport(null);
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {preparingReport === visit.visitId ? 'Opening…' : 'Fill Report'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Modal */}
      {showPhotoUpload && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Service Photos</CardTitle>
              <CardDescription>
                Add photos for visit: {selectedVisit.visitId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUploadForm
                visitId={selectedVisit._id}
                onUpload={handlePhotoUpload}
                onCancel={() => setShowPhotoUpload(false)}
                uploading={uploadingPhoto}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Photo Form Component
interface PhotoUploadFormProps {
  visitId: string;
  onUpload: (visitId: string, files: File[], description: string, category: string) => Promise<void>;
  onCancel: () => void;
  uploading: boolean;
}

function PhotoUploadForm({ visitId, onUpload, onCancel, uploading }: PhotoUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('During Service');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;

    await onUpload(visitId, files, description, category);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
        {files.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="Before Service">Before Service</option>
          <option value="During Service">During Service</option>
          <option value="After Service">After Service</option>
          <option value="Issue Found">Issue Found</option>
          <option value="Parts Used">Parts Used</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="Describe what these photos show..."
        />
      </div>

      <div className="flex space-x-2">
        <Button
          type="submit"
          disabled={!files.length || uploading}
          className="flex-1"
        >
          {uploading ? 'Uploading...' : 'Photos'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
} 