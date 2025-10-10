import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Mail, 
  FileText, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Send
} from 'lucide-react';

interface RMAWorkflowDashboardProps {
  rmaId: string;
}

interface WorkflowStatus {
  rmaNumber: string;
  caseStatus: string;
  approvalStatus: string;
  priority: string;
  warrantyStatus: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  emailWorkflow: {
    source: string;
    subject: string;
    receivedAt: string;
  };
  cdsWorkflow: {
    sentToCDS?: {
      date: string;
      sentBy: string;
      referenceNumber: string;
      notes: string;
    };
    cdsApproval?: {
      date: string;
      approvedBy: string;
      approvalNotes: string;
      caseId: string;
    };
    replacementTracking?: {
      trackingNumber: string;
      carrier: string;
      shippedDate: string;
      estimatedDelivery: string;
      actualDelivery: string;
    };
  };
  returnWorkflow?: {
    initiatedBy: string;
    initiatedDate: string;
    returnPath: string;
    returnInstructions: {
      recipient: string;
      address: string;
      instructions: string[];
      contact: string;
    };
    trackingNumber: string;
    carrier: string;
    expectedDelivery: string;
    deliveryConfirmed?: {
      date: string;
      confirmedBy: string;
      notes: string;
    };
  };
  shipping: {
    outbound: any;
    return: any;
  };
  trackingHistory: any[];
  sla: any;
  completionData?: {
    completedBy: string;
    completedDate: string;
    completionNotes: string;
    totalDays: number;
  };
}

const RMAWorkflowDashboard: React.FC<RMAWorkflowDashboardProps> = ({ rmaId }) => {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWorkflowStatus();
  }, [rmaId]);

  const fetchWorkflowStatus = async () => {
    try {
      const response = await fetch(`/api/rma/${rmaId}/workflow-status`);
      const data = await response.json();
      
      if (data.success) {
        setWorkflowStatus(data.workflowStatus);
      }
    } catch (error) {
      console.error('Error fetching workflow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Sent to CDS': 'bg-blue-100 text-blue-800',
      'CDS Approved': 'bg-green-100 text-green-800',
      'Replacement Shipped': 'bg-purple-100 text-purple-800',
      'Replacement Received': 'bg-indigo-100 text-indigo-800',
      'Faulty Part Returned': 'bg-orange-100 text-orange-800',
      'CDS Confirmed Return': 'bg-teal-100 text-teal-800',
      'Completed': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: { [key: string]: string } = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getWorkflowSteps = () => {
    if (!workflowStatus) return [];
    
    const steps = [
      {
        id: 'email-received',
        title: 'Email Received',
        status: 'completed',
        icon: Mail,
        description: 'RMA request received via email',
        date: workflowStatus.emailWorkflow.receivedAt,
        details: {
          from: workflowStatus.emailWorkflow.source,
          subject: workflowStatus.emailWorkflow.subject
        }
      },
      {
        id: 'cds-form-sent',
        title: 'CDS Form Sent',
        status: workflowStatus.cdsWorkflow.sentToCDS ? 'completed' : 'pending',
        icon: FileText,
        description: 'CDS form prepared and submitted',
        date: workflowStatus.cdsWorkflow.sentToCDS?.date,
        details: workflowStatus.cdsWorkflow.sentToCDS
      },
      {
        id: 'cds-approval',
        title: 'CDS Approval',
        status: workflowStatus.cdsWorkflow.cdsApproval ? 'completed' : 'pending',
        icon: CheckCircle,
        description: 'CDS approval received',
        date: workflowStatus.cdsWorkflow.cdsApproval?.date,
        details: workflowStatus.cdsWorkflow.cdsApproval
      },
      {
        id: 'replacement-shipped',
        title: 'Replacement Shipped',
        status: workflowStatus.cdsWorkflow.replacementTracking ? 'completed' : 'pending',
        icon: Truck,
        description: 'Replacement part shipped',
        date: workflowStatus.cdsWorkflow.replacementTracking?.shippedDate,
        details: workflowStatus.cdsWorkflow.replacementTracking
      },
      {
        id: 'replacement-received',
        title: 'Replacement Received',
        status: workflowStatus.caseStatus === 'Replacement Received' ? 'completed' : 'pending',
        icon: CheckCircle,
        description: 'Replacement part delivered',
        date: workflowStatus.shipping.outbound.actualDelivery,
        details: workflowStatus.shipping.outbound
      },
      {
        id: 'defective-returned',
        title: 'Defective Part Returned',
        status: workflowStatus.returnWorkflow ? 'completed' : 'pending',
        icon: ArrowRight,
        description: 'Defective part returned to CDS',
        date: workflowStatus.returnWorkflow?.initiatedDate,
        details: workflowStatus.returnWorkflow
      },
      {
        id: 'return-confirmed',
        title: 'Return Confirmed',
        status: workflowStatus.returnWorkflow?.deliveryConfirmed ? 'completed' : 'pending',
        icon: CheckCircle,
        description: 'CDS confirmed receipt of defective part',
        date: workflowStatus.returnWorkflow?.deliveryConfirmed?.date,
        details: workflowStatus.returnWorkflow?.deliveryConfirmed
      },
      {
        id: 'completed',
        title: 'RMA Completed',
        status: workflowStatus.completionData ? 'completed' : 'pending',
        icon: CheckCircle,
        description: 'RMA process completed',
        date: workflowStatus.completionData?.completedDate,
        details: workflowStatus.completionData
      }
    ];

    return steps;
  };

  const handleAction = async (action: string, data?: any) => {
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'submit-cds-form':
          endpoint = `/api/rma/${rmaId}/cds-form/submit`;
          break;
        case 'track-replacement':
          endpoint = `/api/rma/${rmaId}/track-replacement`;
          break;
        case 'confirm-replacement':
          endpoint = `/api/rma/${rmaId}/confirm-replacement`;
          break;
        case 'initiate-return':
          endpoint = `/api/rma/${rmaId}/initiate-return`;
          break;
        case 'track-return':
          endpoint = `/api/rma/${rmaId}/track-return`;
          break;
        case 'confirm-return':
          endpoint = `/api/rma/${rmaId}/confirm-return`;
          break;
        case 'complete-rma':
          endpoint = `/api/rma/${rmaId}/complete`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchWorkflowStatus();
      } else {
        console.error('Action failed:', result.error);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading workflow status...</span>
      </div>
    );
  }

  if (!workflowStatus) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
        <p>Failed to load workflow status</p>
      </div>
    );
  }

  const workflowSteps = getWorkflowSteps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RMA Workflow Dashboard</h2>
          <p className="text-gray-600">RMA Number: {workflowStatus.rmaNumber}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(workflowStatus.caseStatus)}>
            {workflowStatus.caseStatus}
          </Badge>
          <Badge className={getPriorityColor(workflowStatus.priority)}>
            {workflowStatus.priority}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">RMA Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created By:</span>
                    <span className="text-sm font-medium">{workflowStatus.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium">
                      {new Date(workflowStatus.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Warranty:</span>
                    <span className="text-sm font-medium">{workflowStatus.warrantyStatus}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Email Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">From:</span>
                    <span className="text-sm font-medium">{workflowStatus.emailWorkflow.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subject:</span>
                    <span className="text-sm font-medium truncate">
                      {workflowStatus.emailWorkflow.subject}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Workflow Progress</span>
                    <span>
                      {workflowSteps.filter(step => step.status === 'completed').length} / {workflowSteps.length}
                    </span>
                  </div>
                  <Progress 
                    value={(workflowSteps.filter(step => step.status === 'completed').length / workflowSteps.length) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.status === 'completed';
              const isPending = step.status === 'pending';
              
              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' : 
                    isPending ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        isCompleted ? 'text-green-900' : 
                        isPending ? 'text-gray-500' : 'text-blue-900'
                      }`}>
                        {step.title}
                      </h3>
                      {step.date && (
                        <span className="text-xs text-gray-500">
                          {new Date(step.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      isCompleted ? 'text-green-700' : 
                      isPending ? 'text-gray-500' : 'text-blue-700'
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.details && (
                      <div className="mt-2 text-xs text-gray-600">
                        {Object.entries(step.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outbound Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Outbound Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                {workflowStatus.shipping.outbound.trackingNumber ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tracking Number:</span>
                      <span className="text-sm font-medium">{workflowStatus.shipping.outbound.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Carrier:</span>
                      <span className="text-sm font-medium">{workflowStatus.shipping.outbound.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {workflowStatus.shipping.outbound.status}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No outbound tracking information</p>
                )}
              </CardContent>
            </Card>

            {/* Return Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Return Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                {workflowStatus.shipping.return.trackingNumber ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tracking Number:</span>
                      <span className="text-sm font-medium">{workflowStatus.shipping.return.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Carrier:</span>
                      <span className="text-sm font-medium">{workflowStatus.shipping.return.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        {workflowStatus.shipping.return.status}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No return tracking information</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">CDS Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleAction('submit-cds-form')}
                  disabled={workflowStatus.caseStatus !== 'Under Review'}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit CDS Form
                </Button>
                <Button 
                  onClick={() => handleAction('track-replacement')}
                  disabled={!workflowStatus.cdsWorkflow.replacementTracking}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Track Replacement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Return Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleAction('initiate-return')}
                  disabled={workflowStatus.caseStatus !== 'Replacement Received'}
                  className="w-full"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Initiate Return
                </Button>
                <Button 
                  onClick={() => handleAction('track-return')}
                  disabled={!workflowStatus.returnWorkflow?.trackingNumber}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Track Return
                </Button>
                <Button 
                  onClick={() => handleAction('complete-rma')}
                  disabled={workflowStatus.caseStatus !== 'CDS Confirmed Return'}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete RMA
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RMAWorkflowDashboard;




