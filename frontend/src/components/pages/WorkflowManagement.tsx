import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Play,
  Pause,
  Zap,
  MessageSquare,
  Bell,
  Send,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { apiClient } from '../../utils/api/client';

interface WorkflowRules {
  assignment: Record<string, string>;
  sla: Record<string, number>;
  escalation: Record<string, number>;
}

interface Comment {
  id: string;
  comment: string;
  author: string;
  type: string;
  timestamp: string;
  isInternal: boolean;
}

interface RMAData {
  _id: string;
  rmaNumber: string;
  siteName: string;
  productName: string;
  caseStatus: string;
  priority: string;
  assignedTo?: string;
  createdBy: string;
  ascompRaisedDate: string;
  comments?: Comment[];
}

export function WorkflowManagement() {
  const [rules, setRules] = useState<WorkflowRules | null>(null);
  const [rmas, setRmas] = useState<RMAData[]>([]);
  const [selectedRMA, setSelectedRMA] = useState<RMAData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [rulesResponse, rmasResponse] = await Promise.all([
        apiClient.get('/workflow/rules'),
        apiClient.get('/rma')
      ]);

      setRules(rulesResponse.data || rulesResponse);
      setRmas(rmasResponse.data || rmasResponse);
    } catch (err: any) {
      console.error('Error loading workflow data:', err);
      setError('Failed to load workflow data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssign = async (rmaId: string) => {
    try {
      const response = await apiClient.post(`/workflow/assign/${rmaId}`);
      if (response.data.success) {
        await loadWorkflowData();
        alert('RMA assigned successfully');
      }
    } catch (err: any) {
      console.error('Error auto-assigning RMA:', err);
      alert('Failed to assign RMA');
    }
  };

  const handleEscalate = async (rmaId: string) => {
    try {
      const response = await apiClient.post('/workflow/escalate');
      if (response.data.success) {
        await loadWorkflowData();
        alert(`${response.data.data.length} RMAs escalated`);
      }
    } catch (err: any) {
      console.error('Error escalating RMAs:', err);
      alert('Failed to escalate RMAs');
    }
  };

  const handleCheckSLABreaches = async () => {
    try {
      const response = await apiClient.get('/workflow/sla-breaches');
      if (response.data.success) {
        alert(`Found ${response.data.count} SLA breaches`);
      }
    } catch (err: any) {
      console.error('Error checking SLA breaches:', err);
      alert('Failed to check SLA breaches');
    }
  };

  const handleAddComment = async () => {
    if (!selectedRMA || !newComment.trim()) return;

    try {
      const response = await apiClient.post(`/workflow/comments/${selectedRMA._id}`, {
        comment: newComment,
        author: 'Current User', // You can get this from auth context
        type: commentType
      });

      if (response.data.success) {
        setNewComment('');
        await loadComments(selectedRMA._id);
        alert('Comment added successfully');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const loadComments = async (rmaId: string) => {
    try {
      const response = await apiClient.get(`/workflow/comments/${rmaId}`);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSendNotification = async (type: string) => {
    if (!selectedRMA) return;

    try {
      let response;
      switch (type) {
        case 'status':
          response = await apiClient.post(`/workflow/notify/status-update/${selectedRMA._id}`, {
            oldStatus: 'Previous Status',
            newStatus: selectedRMA.caseStatus,
            updatedBy: 'Current User',
            comments: 'Status updated via workflow management'
          });
          break;
        case 'assignment':
          response = await apiClient.post(`/workflow/notify/assignment/${selectedRMA._id}`, {
            assignee: selectedRMA.assignedTo || 'default@company.com'
          });
          break;
        default:
          return;
      }

      if (response.data.success) {
        alert('Notification sent successfully');
      }
    } catch (err: any) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    }
  };

  const filteredRMAs = (rmas || []).filter(rma => {
    const matchesSearch = rma.rmaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rma.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rma.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rma.caseStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-600 text-white';
      case 'High':
        return 'bg-orange-600 text-white';
      case 'Medium':
        return 'bg-yellow-600 text-white';
      case 'Low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Replacement Approved':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workflow management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Management</h1>
          <p className="text-gray-600 mt-1">Automate and manage RMA workflows</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={loadWorkflowData}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          onClick={handleCheckSLABreaches}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Check SLA Breaches</span>
        </Button>
        
        <Button
          onClick={handleEscalate}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Zap className="w-4 h-4" />
          <span>Auto-Escalate</span>
        </Button>
        
        <Button
          onClick={() => {/* Implement bulk assignment */}}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Users className="w-4 h-4" />
          <span>Bulk Assign</span>
        </Button>
        
        <Button
          onClick={() => {/* Implement notification center */}}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Bell className="w-4 h-4" />
          <span>Send Notifications</span>
        </Button>
      </div>

      <Tabs defaultValue="rmas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rmas">RMA Management</TabsTrigger>
          <TabsTrigger value="rules">Workflow Rules</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="rmas" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search RMAs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Replacement Approved">Replacement Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RMA List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>RMA List ({filteredRMAs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredRMAs.map((rma) => (
                    <div
                      key={rma._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRMA?._id === rma._id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedRMA(rma);
                        loadComments(rma._id);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{rma.rmaNumber}</h3>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(rma.priority)}>
                            {rma.priority}
                          </Badge>
                          <Badge className={getStatusColor(rma.caseStatus)}>
                            {rma.caseStatus}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rma.siteName} - {rma.productName}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Created: {new Date(rma.ascompRaisedDate).toLocaleDateString()}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoAssign(rma._id);
                            }}
                            className="text-xs"
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* RMA Details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedRMA ? `RMA Details - ${selectedRMA.rmaNumber}` : 'Select an RMA'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRMA ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Site:</span>
                        <p>{selectedRMA.siteName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Product:</span>
                        <p>{selectedRMA.productName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p>{selectedRMA.caseStatus}</p>
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span>
                        <p>{selectedRMA.priority}</p>
                      </div>
                      <div>
                        <span className="font-medium">Assigned To:</span>
                        <p>{selectedRMA.assignedTo || 'Not assigned'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Created By:</span>
                        <p>{selectedRMA.createdBy}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSendNotification('status')}
                        className="flex items-center space-x-1"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Notify Status</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSendNotification('assignment')}
                        className="flex items-center space-x-1"
                      >
                        <Users className="w-3 h-3" />
                        <span>Notify Assignment</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Select an RMA from the list to view details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Rules Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {rules ? (
                <div className="space-y-6">
                  {/* Assignment Rules */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Auto-Assignment Rules</h3>
                    <div className="space-y-2">
                      {Object.entries(rules.assignment).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{key}</span>
                          <span className="text-sm text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SLA Rules */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">SLA Rules (Hours)</h3>
                    <div className="space-y-2">
                      {Object.entries(rules.sla).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{key}</span>
                          <span className="text-sm text-gray-600">{value} hours</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Escalation Rules */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Escalation Rules (Hours)</h3>
                    <div className="space-y-2">
                      {Object.entries(rules.escalation).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{key}</span>
                          <span className="text-sm text-gray-600">{value} hours</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading workflow rules...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          {selectedRMA ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Comment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Add Comment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Comment Type</label>
                      <select
                        value={commentType}
                        onChange={(e) => setCommentType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="status">Status Update</option>
                        <option value="technical">Technical</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Comment</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Enter your comment..."
                      />
                    </div>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="w-full flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Add Comment</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Comments List */}
              <Card>
                <CardHeader>
                  <CardTitle>Comments ({comments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {comment.type}
                            </Badge>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-xs bg-blue-100">
                                Internal
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.comment}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No comments yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No RMA Selected</h3>
                <p className="text-gray-600">
                  Select an RMA from the RMA Management tab to view and manage communications
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
