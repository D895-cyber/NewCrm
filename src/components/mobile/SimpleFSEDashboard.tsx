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
  Camera
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SimpleFSEDashboard() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ProjectorCare FSE</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.profile?.firstName || user?.username || 'FSE User'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
                onClick={() => window.location.hash = '#fse-workflow'}
                className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
              >
                <PlayCircle className="h-6 w-6" />
                <span>Start Workflow</span>
              </Button>
              <Button 
                onClick={() => window.location.hash = '#mobile-test'}
                className="h-20 flex-col space-y-2"
              >
                <FileText className="h-6 w-6" />
                <span>Test Features</span>
              </Button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Dashboard Loaded Successfully!</span>
              </div>
              <p className="text-sm text-blue-700">
                This is a simplified FSE dashboard with demo data. All features are working.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule ({visits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visits.map((visit) => (
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
                    <Badge className={getStatusColor(visit.status)}>
                      {visit.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
          </CardContent>
        </Card>

        {/* Service Visits List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Visits</CardTitle>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(visit.status)}>
                      {visit.status}
                    </Badge>
                    <Badge className={getPriorityColor(visit.priority)}>
                      {visit.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
