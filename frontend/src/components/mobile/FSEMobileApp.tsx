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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { apiClient } from '../../utils/api/client';
import { exportServiceReportToPDF } from '../../utils/export';

export function FSEMobileApp() {
  const { user } = useAuth();
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

  // Load FSE's assigned visits
  useEffect(() => {
    loadFSEReports();
  }, [user, serviceVisits]);

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

  const handleServiceReportSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log('ASCOMP Service Report Submitted:', data);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Submit to backend using the new API
      const response = await apiClient.createServiceReport(data);
      
      // Set success state
      setSubmittedReport(response.report || data);
      setShowDownloadModal(true);
      setShowServiceReport(false);
      setCurrentView('dashboard');
      await loadFSEReports(); // Refresh data
      
      // Show success message
      console.log('ASCOMP Service Report created successfully!');
      (window as any).showToast?.({
        type: 'success',
        title: 'Report Submitted Successfully!',
        message: 'Your ASCOMP service report has been completed and saved.'
      });
    } catch (err: any) {
      console.error('Error submitting ASCOMP report:', err);
      
      // Handle specific error types
      let errorMessage = 'There was an error submitting your report. Please try again.';
      if (err.message?.includes('Authentication required')) {
        errorMessage = 'Please log in again to submit the report.';
      } else if (err.message?.includes('Invalid or expired token')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (err.message?.includes('projectorModel')) {
        errorMessage = 'Missing projector information. Please check your data.';
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
          date: new Date().toISOString().split('T')[0]
        }}
        onClose={() => setShowServiceReport(false)}
      />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ProjectorCare FSE</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.profile?.firstName || user?.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={loadFSEReports}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.hash = '#fse-desktop'}
              title="Switch to Desktop Dashboard"
            >
              <Wrench className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
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
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Report Ready for Download</h3>
            <p className="text-sm text-gray-600 mb-4">Your service report has been successfully submitted and is ready for download.</p>
            <Button 
              onClick={handleDownloadReport} 
              className="flex items-center space-x-2"
              disabled={isSubmitting}
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </Button>
            <Button 
              onClick={() => setShowDownloadModal(false)} 
              variant="outline" 
              className="mt-2"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
