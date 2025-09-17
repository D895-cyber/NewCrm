import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CheckCircle, Clock, MapPin, Calendar, Camera, FileText, PenTool, Play, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface Assignment {
  _id: string;
  assignmentId: string;
  title: string;
  fseName: string;
  siteName: string;
  siteAddress: string;
  projectors: Array<{
    projectorId: string;
    projectorSerial: string;
    projectorModel: string;
    auditorium: string;
    serviceType: string;
    priority: string;
    estimatedDuration: number;
    notes: string;
    status?: string;
    completedAt?: string;
  }>;
  generatedSchedule: Array<{
    day: number;
    date: string;
    projectors: any[];
    totalEstimatedHours: number;
    status: string;
  }>;
  status: string;
  progress: {
    totalProjectors: number;
    completedProjectors: number;
    totalDays: number;
    completedDays: number;
    percentage: number;
  };
}

interface TodaysWork {
  assignmentId: string;
  title: string;
  siteName: string;
  siteAddress: string;
  projectors: Array<{
    projectorId: string;
    projectorSerial: string;
    projectorModel: string;
    auditorium: string;
    serviceType: string;
    priority: string;
    estimatedDuration: number;
    notes: string;
    status?: string;
  }>;
  totalEstimatedHours: number;
  status: string;
}

export function AssignmentWorkflow() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todaysWork, setTodaysWork] = useState<TodaysWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [showUnableToCompleteModal, setShowUnableToCompleteModal] = useState(false);
  const [unableToCompleteReason, setUnableToCompleteReason] = useState('');
  const [assignmentToMarkUnable, setAssignmentToMarkUnable] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fseId && token) {
      // Set the auth token for API requests
      apiClient.setAuthToken(token);
      loadAssignments();
      loadTodaysWork();
    }
  }, [user, token]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/service-assignments/fse/${user?.fseId}`);
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysWork = async () => {
    try {
      const response = await apiClient.get(`/service-assignments/fse/${user?.fseId}/today`);
      setTodaysWork(response || []);
    } catch (error) {
      console.error('Error loading today\'s work:', error);
    }
  };

  const startAssignment = async (assignmentId: string) => {
    try {
      await apiClient.patch(`/service-assignments/${assignmentId}/start`);
      toast.success('Assignment started successfully');
      loadAssignments();
    } catch (error) {
      console.error('Error starting assignment:', error);
      toast.error('Failed to start assignment');
    }
  };

  const completeProjector = async (assignmentId: string, projectorId: string, dayNumber: number) => {
    try {
      await apiClient.patch(`/service-assignments/${assignmentId}/complete-projector`, {
        projectorId,
        dayNumber,
        notes: 'Projector service completed'
      });
      toast.success('Projector marked as completed');
      loadAssignments();
      loadTodaysWork();
    } catch (error) {
      console.error('Error completing projector:', error);
      toast.error('Failed to complete projector');
    }
  };

  const markAssignmentUnableToComplete = async () => {
    if (!assignmentToMarkUnable || !unableToCompleteReason.trim()) {
      toast.error('Please provide a reason for being unable to complete the assignment');
      return;
    }

    try {
      await apiClient.patch(`/service-assignments/${assignmentToMarkUnable}/unable-to-complete`, {
        reason: unableToCompleteReason.trim()
      });
      toast.success('Assignment marked as unable to complete');
      setShowUnableToCompleteModal(false);
      setUnableToCompleteReason('');
      setAssignmentToMarkUnable(null);
      loadAssignments();
      loadTodaysWork();
    } catch (error) {
      console.error('Error marking assignment as unable to complete:', error);
      toast.error('Failed to mark assignment as unable to complete');
    }
  };

  const openUnableToCompleteModal = (assignmentId: string) => {
    setAssignmentToMarkUnable(assignmentId);
    setShowUnableToCompleteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Unable to Complete': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">My Service Assignments</h1>
        <p className="text-gray-600">Manage your assigned service work</p>
      </div>

      {/* Today's Work */}
      {todaysWork.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Today's Work
          </h2>
          {todaysWork.map((work) => (
            <Card key={work.assignmentId} className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{work.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {work.siteName}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {work.totalEstimatedHours} hours
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {work.projectors.length} projectors to service today
                  </div>
                  <div className="grid gap-2">
                    {work.projectors.map((projector, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{projector.projectorSerial}</div>
                          <div className="text-sm text-gray-600">
                            {projector.projectorModel} - {projector.auditorium}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(projector.priority)}>
                            {projector.priority}
                          </Badge>
                          {projector.status === 'Completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => completeProjector(work.assignmentId, projector.projectorId, 1)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Assignments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Assignments</h2>
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">No assignments found</div>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {assignment.siteName}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {assignment.progress.totalProjectors} projectors
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(assignment.status)}>
                    {assignment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{assignment.progress.percentage}%</span>
                    </div>
                    <Progress value={assignment.progress.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{assignment.progress.completedProjectors} of {assignment.progress.totalProjectors} projectors</span>
                      <span>{assignment.progress.completedDays} of {assignment.progress.totalDays} days</span>
                    </div>
                  </div>

                  {assignment.status === 'Assigned' && (
                    <Button
                      onClick={() => startAssignment(assignment._id)}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Assignment
                    </Button>
                  )}

                  {assignment.status === 'In Progress' && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        View Schedule
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => openUnableToCompleteModal(assignment._id)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Unable to Complete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assignment Schedule Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{selectedAssignment.title}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAssignment(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {selectedAssignment.generatedSchedule.map((day, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Day {day.day}</h4>
                      <Badge className={getStatusColor(day.status)}>
                        {day.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString()} • {day.totalEstimatedHours} hours
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {day.projectors.map((projector, pIndex) => (
                        <div key={pIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium text-sm">{projector.projectorSerial}</div>
                            <div className="text-xs text-gray-600">
                              {projector.projectorModel} - {projector.auditorium}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(projector.priority)}>
                              {projector.priority}
                            </Badge>
                            {projector.status === 'Completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  completeProjector(selectedAssignment._id, projector.projectorId, day.day);
                                  setSelectedAssignment(null);
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unable to Complete Modal */}
      <Dialog open={showUnableToCompleteModal} onOpenChange={setShowUnableToCompleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Unable to Complete Assignment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Please provide a detailed reason why you are unable to complete this assignment. This information will be shared with the admin team.
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Unable to Complete</Label>
              <Textarea
                id="reason"
                value={unableToCompleteReason}
                onChange={(e) => setUnableToCompleteReason(e.target.value)}
                placeholder="Please explain why you cannot complete this assignment (e.g., equipment issues, access problems, safety concerns, etc.)"
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnableToCompleteModal(false);
                  setUnableToCompleteReason('');
                  setAssignmentToMarkUnable(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={markAssignmentUnableToComplete}
                disabled={!unableToCompleteReason.trim()}
              >
                Mark as Unable to Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

