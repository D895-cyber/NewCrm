import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar, Clock, MapPin, User, Plus, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceAssignment {
  _id: string;
  assignmentId: string;
  title: string;
  description: string;
  fseId: string;
  fseName: string;
  siteId: string;
  siteName: string;
  projectors: Array<{
    projectorId: string;
    projectorSerial: string;
    projectorModel: string;
    auditorium: string;
    serviceType: string;
    priority: string;
    estimatedDuration: number;
    notes: string;
  }>;
  schedulingType: string;
  schedulingOptions: {
    totalDays: number;
    projectorsPerDay: number;
    preferredDays: string[];
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      day: string;
    }>;
  };
  generatedSchedule: Array<{
    day: number;
    date: string;
    projectors: any[];
    totalEstimatedHours: number;
    status: string;
  }>;
  status: string;
  startDate: string;
  endDate: string;
  unableToCompleteReason?: string;
  progress: {
    totalProjectors: number;
    completedProjectors: number;
    totalDays: number;
    completedDays: number;
    percentage: number;
  };
  createdAt: string;
}

interface Projector {
  _id: string;
  serialNumber: string;
  model: string;
  auditorium: string;
  siteId: string;
  status: string;
}

export function ServiceAssignmentPage() {
  const { isAuthenticated, token } = useAuth();
  const { sites, fses, projectors, refreshData } = useData();
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form state for creating new assignment
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    fseId: '',
    siteId: '',
    projectors: [] as Projector[],
    schedulingType: 'flexible',
    schedulingOptions: {
      totalDays: 1,
      projectorsPerDay: 1,
      preferredDays: [] as string[],
      timeSlots: [{ startTime: '09:00', endTime: '17:00', day: 'Monday' }]
    },
    startDate: '',
    amcContractId: null,
    amcServiceInterval: 'Outside AMC',
    adminNotes: ''
  });

  const [selectedSiteProjectors, setSelectedSiteProjectors] = useState<Projector[]>([]);
  const [selectedProjectors, setSelectedProjectors] = useState<Projector[]>([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Set the auth token for API requests
      apiClient.setAuthToken(token);
      loadAssignments();
    }
  }, [isAuthenticated, token]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/service-assignments');
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load service assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteChange = (siteId: string) => {
    const siteProjectors = projectors.filter(p => p.siteId === siteId);
    setSelectedSiteProjectors(siteProjectors);
    setSelectedProjectors([]);
    setNewAssignment(prev => ({
      ...prev,
      siteId,
      projectors: []
    }));
  };

  const handleProjectorToggle = (projector: Projector) => {
    setSelectedProjectors(prev => {
      const isSelected = prev.some(p => p._id === projector._id);
      if (isSelected) {
        return prev.filter(p => p._id !== projector._id);
      } else {
        return [...prev, projector];
      }
    });
  };

  const handleCreateAssignment = async () => {
    try {
      if (!newAssignment.fseId || !newAssignment.siteId || selectedProjectors.length === 0) {
        toast.error('Please fill in all required fields and select at least one projector');
        return;
      }

      const assignmentData = {
        ...newAssignment,
        projectors: selectedProjectors.map(p => ({
          projectorId: p._id,
          projectorSerial: p.serialNumber,
          projectorModel: p.model,
          auditorium: p.auditorium,
          serviceType: 'Scheduled Maintenance',
          priority: 'Medium',
          estimatedDuration: 2,
          notes: ''
        })),
        startDate: new Date(newAssignment.startDate).toISOString(),
        // Handle empty strings for ObjectId fields
        amcContractId: newAssignment.amcContractId === '' ? null : newAssignment.amcContractId
      };

      await apiClient.post('/service-assignments', assignmentData);
      
      toast.success('Service assignment created successfully');
      setShowCreateModal(false);
      resetForm();
      loadAssignments();
      refreshData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create service assignment');
    }
  };

  const resetForm = () => {
    setNewAssignment({
      title: '',
      description: '',
      fseId: '',
      siteId: '',
      projectors: [],
      schedulingType: 'flexible',
      schedulingOptions: {
        totalDays: 1,
        projectorsPerDay: 1,
        preferredDays: [],
        timeSlots: [{ startTime: '09:00', endTime: '17:00', day: 'Monday' }]
      },
      startDate: '',
      amcContractId: null,
      amcServiceInterval: 'Outside AMC',
      adminNotes: ''
    });
    setSelectedSiteProjectors([]);
    setSelectedProjectors([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Unable to Complete': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateEstimatedDays = () => {
    if (selectedProjectors.length === 0 || newAssignment.schedulingOptions.projectorsPerDay === 0) {
      return 0;
    }
    return Math.ceil(selectedProjectors.length / newAssignment.schedulingOptions.projectorsPerDay);
  };

  // If user is not authenticated, show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access service assignments.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Assignments</h1>
          <p className="text-gray-600">Manage flexible service assignments for FSEs</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Service Assignment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assignment title"
                    className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newAssignment.startDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter assignment description"
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* FSE and Site Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fse">Assign to FSE</Label>
                  <Select value={newAssignment.fseId} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, fseId: value }))}>
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select FSE" />
                    </SelectTrigger>
                    <SelectContent>
                      {fses.map((fse) => (
                        <SelectItem key={fse._id} value={fse._id}>
                          {fse.name} - {fse.employeeId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="site">Site</Label>
                  <Select value={newAssignment.siteId} onValueChange={handleSiteChange}>
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select Site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site._id} value={site._id}>
                          {site.name} - {site.address.city}, {site.address.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Projector Selection */}
              {selectedSiteProjectors.length > 0 && (
                <div>
                  <Label>Select Projectors ({selectedProjectors.length} selected)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                    {selectedSiteProjectors.map((projector) => (
                      <div
                        key={projector._id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          selectedProjectors.some(p => p._id === projector._id)
                            ? 'bg-blue-100 border-blue-300'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleProjectorToggle(projector)}
                      >
                        <div className="text-sm font-medium">{projector.serialNumber}</div>
                        <div className="text-xs text-gray-600">{projector.model} - {projector.auditorium}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduling Options */}
              {selectedProjectors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Scheduling Options</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="totalDays">Total Days</Label>
                      <Input
                        id="totalDays"
                        type="number"
                        min="1"
                        max="10"
                        value={newAssignment.schedulingOptions.totalDays}
                        onChange={(e) => setNewAssignment(prev => ({
                          ...prev,
                          schedulingOptions: {
                            ...prev.schedulingOptions,
                            totalDays: parseInt(e.target.value) || 1
                          }
                        }))}
                        className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectorsPerDay">Projectors per Day</Label>
                      <Input
                        id="projectorsPerDay"
                        type="number"
                        min="1"
                        value={newAssignment.schedulingOptions.projectorsPerDay}
                        onChange={(e) => setNewAssignment(prev => ({
                          ...prev,
                          schedulingOptions: {
                            ...prev.schedulingOptions,
                            projectorsPerDay: parseInt(e.target.value) || 1
                          }
                        }))}
                        className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label>Estimated Days</Label>
                      <div className="p-2 bg-gray-800 border border-gray-600 rounded text-sm text-white">
                        {calculateEstimatedDays()} days
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• {selectedProjectors.length} projectors selected</div>
                      <div>• {newAssignment.schedulingOptions.projectorsPerDay} projectors per day</div>
                      <div>• Estimated {calculateEstimatedDays()} days to complete</div>
                      <div>• Total estimated hours: {selectedProjectors.length * 2} hours</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={newAssignment.adminNotes}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Add any special instructions or notes"
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Create Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {assignment.fseName}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {assignment.siteName}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(assignment.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {assignment.progress.totalProjectors} projectors
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(assignment.status)}>
                    {assignment.status}
                  </Badge>
                  {assignment.status === 'Unable to Complete' && (
                    <AlertTriangle className="w-4 h-4 text-orange-600" title="Assignment marked as unable to complete" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowDetailsModal(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{assignment.progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${assignment.progress.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{assignment.progress.completedProjectors} of {assignment.progress.totalProjectors} projectors completed</span>
                  <span>{assignment.progress.completedDays} of {assignment.progress.totalDays} days completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assignment Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Assignment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {selectedAssignment.title}</div>
                    <div><strong>FSE:</strong> {selectedAssignment.fseName}</div>
                    <div><strong>Site:</strong> {selectedAssignment.siteName}</div>
                    <div><strong>Status:</strong> 
                      <Badge className={`ml-2 ${getStatusColor(selectedAssignment.status)}`}>
                        {selectedAssignment.status}
                      </Badge>
                    </div>
                    {selectedAssignment.status === 'Unable to Complete' && selectedAssignment.unableToCompleteReason && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                          <div>
                            <div className="font-medium text-orange-800 mb-1">Reason for Unable to Complete:</div>
                            <div className="text-sm text-orange-700">{selectedAssignment.unableToCompleteReason}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Progress</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Projectors:</strong> {selectedAssignment.progress.completedProjectors} / {selectedAssignment.progress.totalProjectors}</div>
                    <div><strong>Days:</strong> {selectedAssignment.progress.completedDays} / {selectedAssignment.progress.totalDays}</div>
                    <div><strong>Completion:</strong> {selectedAssignment.progress.percentage}%</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Generated Schedule</h3>
                <div className="space-y-3">
                  {selectedAssignment.generatedSchedule.map((day, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Day {day.day} - {new Date(day.date).toLocaleDateString()}</h4>
                          <Badge className={getStatusColor(day.status)}>
                            {day.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            {day.projectors.length} projectors • {day.totalEstimatedHours} hours estimated
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {day.projectors.map((projector, pIndex) => (
                              <div key={pIndex} className="p-2 bg-gray-50 rounded text-sm">
                                <div className="font-medium">{projector.projectorSerial}</div>
                                <div className="text-gray-600">{projector.projectorModel} - {projector.auditorium}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

