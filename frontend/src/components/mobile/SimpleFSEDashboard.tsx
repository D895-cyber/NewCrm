import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Wrench,
  User,
  Calendar,
  Bell,
  Settings,
  Home,
  List,
  RefreshCw,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  FileText,
  Camera,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SimpleFSEDashboard() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Demo data - always available
  const demoVisits = [
    {
      _id: 'demo-1',
      visitId: 'VISIT-001',
      siteName: 'TechCorp Office',
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
      siteName: 'Innovation Hub',
      projectorSerial: 'PROJ-002',
      visitType: 'Repair',
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'In Progress',
      priority: 'High',
      fseId: user?.fseId || 'FSE-001',
      fseName: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'Demo FSE'
    },
    {
      _id: 'demo-3',
      visitId: 'VISIT-003',
      siteName: 'Conference Center',
      projectorSerial: 'PROJ-003',
      visitType: 'Installation',
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Completed',
      priority: 'Low',
      fseId: user?.fseId || 'FSE-001',
      fseName: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'Demo FSE'
    }
  ];

  const visits = demoVisits;
  const totalVisits = visits.length;
  const completedVisits = visits.filter(v => v.status === 'Completed').length;
  const pendingVisits = visits.filter(v => v.status === 'Scheduled').length;
  const inProgressVisits = visits.filter(v => v.status === 'In Progress').length;

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
      <Card className="bg-dark-card border-dark-color">
        <CardHeader>
          <CardTitle className="text-lg text-dark-primary">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.hash = '#fse-workflow'}
              className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="h-6 w-6" />
              <span>Start Workflow</span>
            </Button>
            <Button 
              onClick={() => window.location.hash = '#service-report'}
              className="h-20 flex-col space-y-2"
            >
              <FileText className="h-6 w-6" />
              <span>Quick Report</span>
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-blue-300">Demo Mode</span>
            </div>
            <p className="text-sm text-blue-200">
              This is a simplified demo dashboard with sample data for testing purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-dark-card border-dark-color">
        <CardHeader>
          <CardTitle className="text-lg text-dark-primary">Service Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-400">{totalVisits}</p>
              <p className="text-sm text-dark-secondary">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{completedVisits}</p>
              <p className="text-sm text-dark-secondary">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{pendingVisits + inProgressVisits}</p>
              <p className="text-sm text-dark-secondary">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Visits */}
      <Card className="bg-dark-card border-dark-color">
        <CardHeader>
          <CardTitle className="text-lg text-dark-primary">Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visits.slice(0, 3).map((visit) => (
              <div key={visit._id} className="flex items-center justify-between p-3 border border-dark-color rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-dark-primary">{visit.siteName}</p>
                    <p className="text-sm text-dark-secondary">{visit.visitType}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(visit.status)}>
                  {visit.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  // Schedule View
  const renderScheduleView = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visits.map((visit) => (
              <div key={visit._id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{visit.siteName}</p>
                      <p className="text-sm text-gray-600">{visit.visitType}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(visit.status)}>
                    {visit.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>Date:</strong> {new Date(visit.scheduledDate).toLocaleDateString()}</p>
                    <p><strong>Projector:</strong> {visit.projectorSerial}</p>
                  </div>
                  <div>
                    <p><strong>Priority:</strong> {visit.priority}</p>
                    <p><strong>Visit ID:</strong> {visit.visitId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  // Reports View
  const renderReportsView = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visits.map((visit) => (
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
                <Badge className={getStatusColor(visit.status)}>
                  {visit.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  // Profile View
  const renderProfileView = () => (
    <>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
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
              <p className="text-sm text-dark-secondary">Welcome, {user?.profile?.firstName || user?.username || 'FSE User'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-dark-secondary hover:text-dark-primary">
              <Bell className="h-4 w-4" />
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
    </div>
  );
}
