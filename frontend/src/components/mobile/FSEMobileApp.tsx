import { useState, useEffect } from 'react';
import { ASCOMPServiceReportForm } from '../ASCOMPServiceReportForm';
import { FSEWorkflow } from './FSEWorkflow';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Wrench,
  User,
  Calendar,
  Bell,
  Settings,
  Home,
  List,
  RefreshCw,
  AlertTriangle,
  Download,
  PlayCircle,
  CheckCircle,
  ArrowLeft,
  LogOut,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { apiClient } from '../../utils/api/client';
import { exportServiceReportToPDF } from '../../utils/export';

export function FSEMobileApp() {
  const { user, logout } = useAuth();
  const { serviceVisits } = useData();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showServiceReport, setShowServiceReport] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [errorReportData, setErrorReportData] = useState({
    projectorId: '',
    projectorNumber: '',
    serialNumber: '',
    status: 'Needs Repair',
    condition: 'Poor',
    reason: '',
    notes: '',
    priority: 'High',
    siteName: '',
    auditoriumName: ''
  });
  const [sites, setSites] = useState<any[]>([]);
  const [projectors, setProjectors] = useState<any[]>([]);
  const [filteredProjectors, setFilteredProjectors] = useState<any[]>([]);
  const [errorReportStep, setErrorReportStep] = useState(1); // 1: Select Site, 2: Select Projector, 3: Report Error
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load FSE's assigned visits
  useEffect(() => {
    loadFSEReports();
    loadNotifications();
    loadSitesAndProjectors();
  }, [user, serviceVisits]);

  const loadNotifications = async () => {
    try {
      // Load recent status changes as notifications
      const response = await apiClient.get('/projector-tracking/statuses');
      const statusChanges = response?.data || response || [];
      
      // Convert status changes to notifications
      const recentNotifications = statusChanges
        .filter((change: any) => {
          const changeDate = new Date(change.statusChangeDate || change.createdAt);
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return changeDate >= oneWeekAgo;
        })
        .map((change: any) => ({
          id: change._id,
          type: 'error_report',
          title: `Projector ${change.projectorNumber} - ${change.status}`,
          message: change.reason || 'Status change reported',
          priority: change.condition === 'Critical' ? 'High' : change.condition === 'Poor' ? 'Medium' : 'Low',
          timestamp: change.statusChangeDate || change.createdAt,
          projectorNumber: change.projectorNumber,
          siteName: change.currentLocation?.siteName || 'Unknown Site',
          status: change.status
        }))
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setNotifications(recentNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadSitesAndProjectors = async () => {
    try {
      // Load sites
      const sitesData = await apiClient.getAllSites();
      setSites(sitesData || []);
      
      // Load projectors
      const projectorsData = await apiClient.getAllProjectors();
      setProjectors(projectorsData || []);
    } catch (error) {
      console.error('Error loading sites and projectors:', error);
    }
  };

  const handleSiteSelection = (siteName: string) => {
    setErrorReportData(prev => ({ ...prev, siteName }));
    
    // Filter projectors by selected site
    const siteProjectors = projectors.filter(projector => 
      projector.siteName === siteName || projector.currentLocation?.siteName === siteName
    );
    setFilteredProjectors(siteProjectors);
    
    // Move to next step
    setErrorReportStep(2);
  };

  const handleProjectorSelection = (projector: any) => {
    setErrorReportData(prev => ({
      ...prev,
      projectorId: projector._id,
      projectorNumber: projector.projectorNumber,
      serialNumber: projector.serialNumber,
      auditoriumName: projector.auditoriumName || projector.currentLocation?.auditoriumName || ''
    }));
    
    // Move to next step
    setErrorReportStep(3);
  };

  const resetErrorReport = () => {
    setErrorReportData({
      projectorId: '',
      projectorNumber: '',
      serialNumber: '',
      status: 'Needs Repair',
      condition: 'Poor',
      reason: '',
      notes: '',
      priority: 'High',
      siteName: '',
      auditoriumName: ''
    });
    setFilteredProjectors([]);
    setErrorReportStep(1);
    setShowErrorReport(false);
  };

  const loadFSEReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      let response;
      if (user?.fseId) {
        console.log('Loading visits for FSE ID:', user.fseId);
        try {
          response = await Promise.race([
            apiClient.getServiceVisitsByFSE(user.fseId),
            timeoutPromise
          ]);
        } catch (fseError) {
          console.warn('FSE-specific API failed, trying general API:', fseError);
          response = await Promise.race([
            apiClient.getAllServiceVisits(),
            timeoutPromise
          ]);
        }
      } else {
        console.log('No FSE ID, loading all visits');
        response = await Promise.race([
          apiClient.getAllServiceVisits(),
          timeoutPromise
        ]);
      }
      
      console.log('FSE visits response:', response);
      setVisits(Array.isArray(response) ? response : response?.data || []);
    } catch (err: any) {
      console.error('Error loading FSE reports:', err);
      setError(err.message || 'Failed to load service visits');
      
      // Provide fallback demo data
      const demoVisits = [
        {
          _id: 'demo-1',
          visitId: 'VISIT-001',
          siteName: 'Demo Site 1',
          projectorSerial: 'PROJ-001',
          visitType: 'Maintenance',
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'Scheduled',
          priority: 'Medium',
          fseId: user?.fseId || 'FSE-001',
          fseName: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'Demo FSE'
        },
        {
          _id: 'demo-2',
          visitId: 'VISIT-002',
          siteName: 'Demo Site 2',
          projectorSerial: 'PROJ-002',
          visitType: 'Repair',
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'In Progress',
          priority: 'High',
          fseId: user?.fseId || 'FSE-001',
          fseName: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'Demo FSE'
        }
      ];
      setVisits(demoVisits);
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorReport = async () => {
    try {
      setIsSubmitting(true);
      
      // First, find the projector by projectorNumber or serialNumber
      let projectorId = errorReportData.projectorId;
      
      if (!projectorId && (errorReportData.projectorNumber || errorReportData.serialNumber)) {
        try {
          const projectors = await apiClient.get('/projectors');
          const projector = projectors.find((p: any) => 
            p.projectorNumber === errorReportData.projectorNumber || 
            p.serialNumber === errorReportData.serialNumber
          );
          
          if (projector) {
            projectorId = projector._id;
          } else {
            throw new Error('Projector not found. Please check the projector number or serial number.');
          }
        } catch (error) {
          console.error('Error finding projector:', error);
          throw new Error('Could not find projector. Please check the projector number or serial number.');
        }
      }
      
      if (!projectorId) {
        throw new Error('Projector ID is required. Please provide a valid projector number or serial number.');
      }
      
      // Create status change record
      const statusChangeData = {
        projectorId: projectorId,
        status: errorReportData.status,
        condition: errorReportData.condition,
        reason: errorReportData.reason,
        notes: `FSE Error Report - Priority: ${errorReportData.priority}\n${errorReportData.notes}`,
        changedBy: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'FSE Engineer'
      };

      await apiClient.post('/projector-tracking/statuses', statusChangeData);
      
      // Create notification
      const newNotification = {
        id: Date.now().toString(),
        type: 'error_report',
        title: `Error Report: ${errorReportData.projectorNumber}`,
        message: `${errorReportData.status} - ${errorReportData.reason}`,
        priority: errorReportData.priority,
        timestamp: new Date().toISOString(),
        projectorNumber: errorReportData.projectorNumber,
        siteName: errorReportData.siteName,
        status: errorReportData.status
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show success message
      alert('Error report submitted successfully! Management has been notified.');
      
      // Reset form
      resetErrorReport();
      
    } catch (error: any) {
      console.error('Error submitting error report:', error);
      
      let errorMessage = 'Failed to submit error report. Please try again.';
      
      if (error.message?.includes('Projector not found')) {
        errorMessage = 'Projector not found. Please check the projector number or serial number.';
      } else if (error.message?.includes('Could not find projector')) {
        errorMessage = 'Could not find projector. Please check the projector number or serial number.';
      } else if (error.message?.includes('Projector ID is required')) {
        errorMessage = 'Please provide a valid projector number or serial number.';
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = 'Please fill in all required fields.';
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceReportSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log('ASCOMP Service Report Submitted:', data);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Validate required fields before submission
      const requiredFields = ['reportNumber', 'siteName', 'projectorSerial', 'projectorModel', 'brand'];
      const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Ensure engineer information is present
      if (!data.engineer?.name || data.engineer.name.trim() === '') {
        throw new Error('Engineer name is required');
      }
      
      // Submit to backend using the new API
      const response = await apiClient.createServiceReport(data);
      
      // Set success state
      setSubmittedReport(response.report || data);
      if (response.generatedDoc || response.generatedPdf) {
        setSubmittedReport((prev) => ({
          ...(prev || {}),
          generatedDocReport: response.generatedDoc,
          generatedPdfReport: response.generatedPdf,
        }));
      }
      setShowDownloadModal(true);
      setShowServiceReport(false);
      setCurrentView('dashboard');
      await loadFSEReports(); // Refresh data
      
      // Show success message
      console.log('ASCOMP Service Report created successfully!');
      (window as any).showToast?.({
        type: 'success',
        title: 'Report Submitted Successfully!',
        message: response.generatedDoc
          ? 'DOCX/PDF generated automatically. Use the buttons to download.'
          : 'Your ASCOMP service report has been completed and saved.'
      });
    } catch (err: any) {
      console.error('Error submitting ASCOMP report:', err);
      
      // Handle specific error types
      let errorMessage = 'There was an error submitting your report. Please try again.';
      if (err.message?.includes('Authentication required')) {
        errorMessage = 'Please log in again to submit the report.';
      } else if (err.message?.includes('Invalid or expired token')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (err.message?.includes('Missing required fields')) {
        errorMessage = err.message;
      } else if (err.message?.includes('Engineer name is required')) {
        errorMessage = err.message;
      } else if (err.message?.includes('projectorModel')) {
        errorMessage = 'Missing projector information. Please check your data.';
      } else if (err.message?.includes('Validation failed')) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      (window as any).showToast?.({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReport = () => {
    if (submittedReport) {
      exportServiceReportToPDF(submittedReport);
      setShowDownloadModal(false);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Report Downloaded',
        message: 'Your service report has been downloaded as PDF.'
      });
    }
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

  // Get today's visits
  const today = new Date().toISOString().split('T')[0];
  const todaysVisits = visits.filter(visit => 
    visit.scheduledDate === today || visit.actualDate === today
  );

  // Get recent reports (last 5)
  const recentReports = visits
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 5);

  // Render content based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboardView();
      case 'schedule':
        return renderScheduleView();
      case 'reports':
        return renderReportsView();
      case 'profile':
        return renderProfileView();
      default:
        return renderDashboardView();
    }
  };

  // Dashboard View
  const renderDashboardView = () => (
    <>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setShowWorkflow(true)}
              className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="h-6 w-6" />
              <span>Start Workflow</span>
            </Button>
            <Button 
              onClick={() => setShowServiceReport(true)}
              className="h-20 flex-col space-y-2"
            >
              <FileText className="h-6 w-6" />
              <span>Quick Report</span>
            </Button>
            <Button 
              onClick={() => setShowErrorReport(true)}
              className="h-20 flex-col space-y-2 bg-red-600 hover:bg-red-700"
            >
              <AlertCircle className="h-6 w-6" />
              <span>Report Error</span>
            </Button>
            <Button 
              onClick={() => setShowErrorReport(true)}
              className="h-20 flex-col space-y-2 bg-orange-600 hover:bg-orange-700"
            >
              <AlertTriangle className="h-6 w-6" />
              <span>Urgent Alert</span>
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Recommended Workflow</span>
            </div>
            <p className="text-sm text-blue-700">
              Use the step-by-step workflow for complete service process: 
              Service → Photos → Report → Signature
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Schedule ({todaysVisits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysVisits.length > 0 ? (
            <div className="space-y-3">
              {todaysVisits.map((visit) => (
                <div key={visit._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Site Visit - {visit.siteName}</p>
                      <p className="text-sm text-gray-600">{visit.visitType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {visit.startTime ? visit.startTime : 'TBD'}
                    </p>
                    <Badge variant="outline" className={`text-xs ${
                      visit.status === 'Completed' ? 'text-green-600 border-green-200' :
                      visit.status === 'In Progress' ? 'text-blue-600 border-blue-200' :
                      'text-yellow-600 border-yellow-200'
                    }`}>
                      {visit.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No visits scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalVisits}</p>
              <p className="text-sm text-gray-600">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedVisits}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingVisits + inProgressVisits}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          {averageRating > 0 && (
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-purple-600">{averageRating.toFixed(1)} ⭐</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  // Schedule View
  const renderScheduleView = () => {
    // Get upcoming visits (next 7 days)
    const upcomingVisits = visits
      .filter(visit => {
        const visitDate = new Date(visit.scheduledDate || visit.actualDate);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return visitDate >= today && visitDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return (
      <>
        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Schedule ({upcomingVisits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingVisits.length > 0 ? (
              <div className="space-y-3">
                {upcomingVisits.map((visit) => (
                  <div key={visit._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{visit.siteName}</p>
                          <p className="text-sm text-gray-600">{visit.visitType}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        visit.status === 'Completed' ? 'text-green-600 border-green-200' :
                        visit.status === 'In Progress' ? 'text-blue-600 border-blue-200' :
                        'text-yellow-600 border-yellow-200'
                      }`}>
                        {visit.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Date:</strong> {new Date(visit.scheduledDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {visit.startTime || 'TBD'}</p>
                      </div>
                      <div>
                        <p><strong>Projector:</strong> {visit.projectorSerial}</p>
                        <p><strong>Priority:</strong> {visit.priority}</p>
                      </div>
                    </div>
                    {visit.description && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        {visit.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No upcoming visits scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{todaysVisits.length}</p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{upcomingVisits.length}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  // Reports View
  const renderReportsView = () => (
    <>
      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports ({recentReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((visit) => (
                <div key={visit._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{visit.visitId}</p>
                      <p className="text-sm text-gray-600">{visit.siteName} - {visit.visitType}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(visit.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-xs ${
                      visit.status === 'Completed' ? 'text-green-600 border-green-200' :
                      visit.status === 'In Progress' ? 'text-blue-600 border-blue-200' :
                      'text-yellow-600 border-yellow-200'
                    }`}>
                      {visit.status}
                    </Badge>
                    {visit.customerFeedback?.rating && (
                      <div className="mt-1 text-xs text-gray-500">
                        ⭐ {visit.customerFeedback.rating}/5
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent reports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{completedVisits}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{recentReports.length}</p>
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>
          </div>
          {averageRating > 0 && (
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-600">Average Customer Rating</p>
              <p className="text-2xl font-bold text-purple-600">{averageRating.toFixed(1)} ⭐</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  // Profile View
  const renderProfileView = () => (
    <>
      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.profile?.firstName && user?.profile?.lastName 
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user?.username || 'FSE User'
                  }
                </h3>
                <p className="text-sm text-gray-600">Field Service Engineer</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-gray-700">FSE ID</p>
                <p className="text-sm text-gray-900">
                  {user?.fseId || user?.fseDetails?.fseId || 'Not Assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-sm text-gray-900">{user?.profile?.phone || 'N/A'}</p>
              </div>
            </div>
            {user?.fseDetails?.employeeId && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Employee ID</p>
                    <p className="text-sm text-gray-900">{user.fseDetails.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Designation</p>
                    <p className="text-sm text-gray-900">{user.fseDetails.designation || 'Field Service Engineer'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalVisits}</p>
              <p className="text-sm text-gray-600">Total Services</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{completedVisits}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
          {averageRating > 0 && (
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-600">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-purple-600">{averageRating.toFixed(1)} ⭐</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Add settings functionality */}}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Add help functionality */}}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
          <div className="mt-4 text-sm text-gray-500">
            User: {user?.username || 'Unknown'} | Role: {user?.role || 'Unknown'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadFSEReports} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  if (showServiceReport) {
    return (
      <ASCOMPServiceReportForm 
        onSubmit={handleServiceReportSubmit}
        initialData={{
          engineer: {
            name: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username,
            phone: user?.profile?.phone || '',
            email: user?.email || ''
          },
          date: new Date().toISOString().split('T')[0],
          siteName: '', // Will be filled when visit is selected
          siteAddress: '', // Will be filled when visit is selected
          projectorSerial: '', // Will be filled when visit is selected
          projectorModel: '', // Will be filled when visit is selected
          brand: 'Christie' // Default brand
        }}
        onClose={() => setShowServiceReport(false)}
      />
    );
  }

  if (showErrorReport) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                Report Projector Error
              </h2>
              <Button 
                variant="ghost" 
                onClick={resetErrorReport}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${errorReportStep >= 1 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  1
                </div>
                <div className={`w-16 h-1 ${errorReportStep >= 2 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${errorReportStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
                <div className={`w-16 h-1 ${errorReportStep >= 3 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${errorReportStep >= 3 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  3
                </div>
              </div>
            </div>

            {/* Step 1: Select Site */}
            {errorReportStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Site</h3>
                  <p className="text-gray-600">Choose the site where the projector error occurred</p>
                </div>
                
                <div className="space-y-3">
                  {sites.map((site) => (
                    <button
                      key={site._id}
                      onClick={() => handleSiteSelection(site.name)}
                      className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{site.name}</div>
                      <div className="text-sm text-gray-600">
                        {(() => {
                          if (typeof site.address === 'object' && site.address) {
                            const parts = [
                              site.address.street,
                              site.address.city,
                              site.address.state,
                              site.address.pincode
                            ].filter(Boolean);
                            return parts.join(', ');
                          }
                          return site.address || site.city || 'Address not available';
                        })()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Projector */}
            {errorReportStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Select Projector</h3>
                  <p className="text-gray-600">Choose the projector at <strong>{errorReportData.siteName}</strong></p>
                </div>
                
                <div className="space-y-3">
                  {filteredProjectors.length > 0 ? (
                    filteredProjectors.map((projector) => (
                      <button
                        key={projector._id}
                        onClick={() => handleProjectorSelection(projector)}
                        className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{projector.projectorNumber}</div>
                        <div className="text-sm text-gray-600">
                          Serial: {projector.serialNumber} | Model: {projector.model} | Brand: {projector.brand}
                        </div>
                        {projector.auditoriumName && (
                          <div className="text-sm text-gray-500">Auditorium: {projector.auditoriumName}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No projectors found for this site.</p>
                      <Button
                        onClick={() => setErrorReportStep(1)}
                        variant="outline"
                        className="mt-4"
                      >
                        Back to Site Selection
                      </Button>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => setErrorReportStep(1)}
                  variant="outline"
                  className="w-full"
                >
                  Back to Site Selection
                </Button>
              </div>
            )}

            {/* Step 3: Report Error */}
            {errorReportStep === 3 && (
              <form onSubmit={(e) => { e.preventDefault(); handleErrorReport(); }} className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Report Error</h3>
                  <p className="text-gray-600">
                    Reporting error for <strong>{errorReportData.projectorNumber}</strong> at <strong>{errorReportData.siteName}</strong>
                  </p>
                </div>

                {/* Status and Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={errorReportData.status}
                      onChange={(e) => setErrorReportData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="Needs Repair">Needs Repair</option>
                      <option value="Under Service">Under Service</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition *
                    </label>
                    <select
                      value={errorReportData.condition}
                      onChange={(e) => setErrorReportData(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="Poor">Poor</option>
                      <option value="Critical">Critical</option>
                      <option value="Fair">Fair</option>
                      <option value="Good">Good</option>
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level *
                  </label>
                  <select
                    value={errorReportData.priority}
                    onChange={(e) => setErrorReportData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="High">High - Immediate attention required</option>
                    <option value="Medium">Medium - Address within 24 hours</option>
                    <option value="Low">Low - Address within 1 week</option>
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Reason *
                  </label>
                  <input
                    type="text"
                    value={errorReportData.reason}
                    onChange={(e) => setErrorReportData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    placeholder="e.g., Lamp failure, Color wheel issue, etc."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={errorReportData.notes}
                    onChange={(e) => setErrorReportData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Describe the issue in detail, any error messages, symptoms, etc."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Submit Error Report
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setErrorReportStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Projector Selection
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showWorkflow) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FSE Workflow</h1>
                <p className="text-sm text-gray-600">Step-by-step service process</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowWorkflow(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>
        <FSEWorkflow />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-dark-bg border-b border-dark-color p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-primary">ProjectorCare FSE</h1>
              <p className="text-sm text-dark-secondary">Welcome, {user?.profile?.firstName || user?.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={loadFSEReports} className="text-dark-secondary hover:text-dark-primary">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.hash = '#fse-desktop'}
              title="Switch to Desktop Dashboard"
              className="text-dark-secondary hover:text-dark-primary"
            >
              <Wrench className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-dark-secondary hover:text-dark-primary relative"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="text-dark-secondary hover:text-dark-primary">
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              title="Logout"
              className="text-dark-secondary hover:text-dark-primary"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      notification.priority === 'High' ? 'border-red-500 bg-red-50' :
                      notification.priority === 'Medium' ? 'border-orange-500 bg-orange-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{notification.siteName}</span>
                          <span>•</span>
                          <span>{new Date(notification.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          notification.priority === 'High' ? 'text-red-600 border-red-200' :
                          notification.priority === 'Medium' ? 'text-orange-600 border-orange-200' :
                          'text-blue-600 border-blue-200'
                        }`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6 pb-20 bg-dark-bg">
        {renderCurrentView()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-color">
        <div className="flex justify-around p-2">
          <Button 
            variant={currentView === 'dashboard' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex-col h-16"
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Dashboard</span>
          </Button>
          
          <Button 
            variant={currentView === 'schedule' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('schedule')}
            className="flex-col h-16"
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-xs">Schedule</span>
          </Button>
          
          <Button 
            variant={currentView === 'reports' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('reports')}
            className="flex-col h-16"
          >
            <List className="h-5 w-5 mb-1" />
            <span className="text-xs">Reports</span>
          </Button>
          
          <Button 
            variant={currentView === 'profile' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('profile')}
            className="flex-col h-16"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && submittedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Service Report Ready</h3>
              <p className="text-sm text-gray-600">Your report was saved and documents are ready to download.</p>
            </div>

            {submittedReport.generatedDocReport && (
              <Button
                onClick={() => {
                  window.open(submittedReport.generatedDocReport.cloudUrl, '_blank');
                  setShowDownloadModal(false);
                }}
                className="w-full flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <Download className="h-4 w-4" />
                Download DOCX
              </Button>
            )}

            {submittedReport.generatedPdfReport && (
              <Button
                onClick={() => {
                  window.open(submittedReport.generatedPdfReport.cloudUrl, '_blank');
                  setShowDownloadModal(false);
                }}
                className="w-full flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}

            {!submittedReport.generatedDocReport && !submittedReport.generatedPdfReport && (
              <Button 
                onClick={handleDownloadReport} 
                className="flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </Button>
            )}

            <Button 
              onClick={() => setShowDownloadModal(false)} 
              variant="outline"
              disabled={isSubmitting}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
