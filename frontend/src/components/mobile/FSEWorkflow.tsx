import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Camera, 
  FileText, 
  CheckCircle, 
  Clock, 
  User, 
  Wrench,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Square,
  Upload,
  Check,
  X,
  AlertTriangle,
  Building,
  Monitor,
  Calendar,
  MapPin,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api/client';
import { exportServiceReportToPDF } from '../../utils/export';
import { ASCOMPServiceReportForm } from '../ASCOMPServiceReportForm';

interface ServiceVisit {
  _id: string;
  visitId: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  projectorSerial: string;
  projectorModel: string;
  visitType: string;
  scheduledDate: string;
  actualDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  priority: string;
  description?: string;
  fseId: string;
  fseName: string;
  siteInCharge?: {
    name: string;
    phone: string;
    email: string;
    designation: string;
  };
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  required: boolean;
}

interface PhotoData {
  id: string;
  file: File;
  category: string;
  description: string;
  timestamp: string;
  beforeAfter: 'BEFORE' | 'DURING' | 'AFTER';
}

interface SignatureData {
  siteInCharge: string;
  fse: string;
  timestamp: string;
  location: string;
}

export function FSEWorkflow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVisit, setSelectedVisit] = useState<ServiceVisit | null>(null);
  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showASCOMPForm, setShowASCOMPForm] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isCompletingService, setIsCompletingService] = useState(false);
  const [workflowData, setWorkflowData] = useState({
    serviceStartTime: '',
    serviceEndTime: '',
    workPerformed: '',
    issuesFound: [] as string[],
    partsUsed: [] as string[],
    recommendations: '',
    photos: [] as PhotoData[],
    signatures: {} as SignatureData,
    reportData: {} as any
  });

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'select-visit',
      title: 'Select Service Visit',
      description: 'Choose the service visit to work on',
      icon: Calendar,
      status: 'pending',
      required: true
    },
    {
      id: 'start-service',
      title: 'Start Service',
      description: 'Begin the service work and record start time',
      icon: Play,
      status: 'pending',
      required: true
    },
    {
      id: 'capture-photos',
      title: 'Capture Photos',
      description: 'Take before, during, and after service photos',
      icon: Camera,
      status: 'pending',
      required: true
    },
    {
      id: 'record-work',
      title: 'Record Work Details',
      description: 'Document work performed, issues found, and parts used',
      icon: Wrench,
      status: 'pending',
      required: true
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create comprehensive service report',
      icon: FileText,
      status: 'pending',
      required: true
    },
    {
      id: 'site-signature',
      title: 'Site In-charge Signature',
      description: 'Get signature from site in-charge for completion',
      icon: User,
      status: 'pending',
      required: true
    },
    {
      id: 'complete-service',
      title: 'Complete Service',
      description: 'Finalize and submit the service report',
      icon: CheckCircle,
      status: 'pending',
      required: true
    }
  ];

  useEffect(() => {
    loadFSEReports();
  }, [user]);

  const loadFSEReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (user?.fseId) {
        console.log('Loading visits for FSE ID:', user.fseId);
        try {
          response = await apiClient.getServiceVisitsByFSE(user.fseId);
        } catch (fseError) {
          console.warn('FSE-specific API failed, trying general API:', fseError);
          response = await apiClient.getAllServiceVisits();
        }
      } else {
        console.log('No FSE ID, loading all visits');
        response = await apiClient.getAllServiceVisits();
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
          siteAddress: '123 Demo Street, Demo City',
          projectorSerial: 'PROJ-001',
          projectorModel: 'Demo Model 1000',
          visitType: 'Maintenance',
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'Scheduled',
          priority: 'Medium',
          fseId: user?.fseId || 'FSE-001',
          fseName: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'Demo FSE',
          siteInCharge: {
            name: 'John Smith',
            phone: '+1-555-0123',
            email: 'john.smith@demo.com',
            designation: 'Site Manager'
          }
        },
        {
          _id: 'demo-2',
          visitId: 'VISIT-002',
          siteName: 'Demo Site 2',
          siteAddress: '456 Demo Avenue, Demo City',
          projectorSerial: 'PROJ-002',
          projectorModel: 'Demo Model 2000',
          visitType: 'Repair',
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'In Progress',
          priority: 'High',
          fseId: user?.fseId || 'FSE-001',
          fseName: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username || 'Demo FSE',
          siteInCharge: {
            name: 'Jane Doe',
            phone: '+1-555-0456',
            email: 'jane.doe@demo.com',
            designation: 'Operations Manager'
          }
        }
      ];
      setVisits(demoVisits);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStepStatus = (stepId: string, status: WorkflowStep['status']) => {
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      workflowSteps[stepIndex].status = status;
    }
  };

  const handleStepComplete = (stepId: string) => {
    updateStepStatus(stepId, 'completed');
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepSkip = (stepId: string) => {
    updateStepStatus(stepId, 'skipped');
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleVisitSelect = (visit: ServiceVisit) => {
    setSelectedVisit(visit);
    updateStepStatus('select-visit', 'completed');
    setCurrentStep(1);
  };

  const handleStartService = () => {
    const startTime = new Date().toISOString();
    setWorkflowData(prev => ({
      ...prev,
      serviceStartTime: startTime
    }));
    updateStepStatus('start-service', 'completed');
    setCurrentStep(2);
  };

  const handlePhotosCaptured = (photos: PhotoData[]) => {
    setWorkflowData(prev => ({
      ...prev,
      photos: [...prev.photos, ...photos]
    }));
    updateStepStatus('capture-photos', 'completed');
    setCurrentStep(3);
  };

  const handleWorkRecorded = (workData: any) => {
    setWorkflowData(prev => ({
      ...prev,
      workPerformed: workData.workPerformed,
      issuesFound: workData.issuesFound,
      partsUsed: workData.partsUsed,
      recommendations: workData.recommendations
    }));
    updateStepStatus('record-work', 'completed');
    setCurrentStep(4);
  };

  const handleReportGenerated = (reportData: any) => {
    setWorkflowData(prev => ({
      ...prev,
      reportData
    }));
    updateStepStatus('generate-report', 'completed');
    setCurrentStep(5);
  };

  const handleASCOMPReportSubmit = async (reportData: any) => {
    try {
      setIsSubmittingReport(true);
      console.log('ASCOMP Report submitted from workflow:', reportData);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // First, upload photos to Cloudinary if any exist
      let uploadedPhotos = [];
      if (workflowData.photos && workflowData.photos.length > 0) {
        console.log('Uploading photos to Cloudinary...');
        
        // Upload photos individually with their specific categories
        for (const photo of workflowData.photos) {
          try {
            const formData = new FormData();
            formData.append('photos', photo.file);
            formData.append('description', photo.description);
            
            // Map photo categories to server categories
            const categoryMap = {
              'BEFORE': 'Before Service',
              'DURING': 'During Service', 
              'AFTER': 'After Service',
              'ISSUE': 'Issue Found',
              'PARTS': 'Parts Used'
            };
            
            const serverCategory = categoryMap[photo.category] || 'Service Photos';
            console.log(`Uploading photo with category: ${photo.category} -> ${serverCategory}`);
            
            const uploadResponse = await apiClient.uploadServiceVisitPhotosAutomated(
              selectedVisit?._id || '', 
              formData, 
              serverCategory
            );
            
            if (uploadResponse.photos && uploadResponse.photos.length > 0) {
              uploadedPhotos.push(...uploadResponse.photos);
            }
          } catch (uploadError) {
            console.error(`Photo upload failed for ${photo.category}:`, uploadError);
            // Continue with other photos even if one fails
          }
        }
        
        console.log(`Successfully uploaded ${uploadedPhotos.length} photos to Cloudinary`);
      }
      
      // Fetch projector details to get model and brand
      let projectorModel = 'Unknown Model';
      let brand = 'Unknown Brand';
      try {
        const projectors = await apiClient.getAllProjectors();
        const projector = projectors.find((p: any) => p.serialNumber === selectedVisit?.projectorSerial);
        if (projector) {
          projectorModel = projector.model || 'Unknown Model';
          brand = projector.brand || 'Unknown Brand';
        }
      } catch (err) {
        console.warn('Failed to fetch projector details, using defaults:', err);
      }

      // Merge workflow data with ASCOMP report data
      const mergedReportData = {
        ...reportData,
        visitId: selectedVisit?.visitId,
        siteId: selectedVisit?.siteId,
        siteName: selectedVisit?.siteName,
        projectorSerial: selectedVisit?.projectorSerial,
        projectorModel: projectorModel,
        brand: brand,
        serviceStartTime: workflowData.serviceStartTime,
        serviceEndTime: new Date().toISOString(),
        workPerformed: workflowData.workPerformed,
        issuesFound: workflowData.issuesFound,
        partsUsed: workflowData.partsUsed,
        recommendations: workflowData.recommendations,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : workflowData.photos.map(photo => ({
          filename: photo.file.name,
          originalName: photo.file.name,
          path: URL.createObjectURL(photo.file),
          uploadedAt: photo.timestamp,
          description: photo.description,
          category: photo.category
        })),
        signatures: workflowData.signatures
      };

      console.log('Submitting report with data:', mergedReportData);

      // Submit the comprehensive report
      const response = await apiClient.createServiceReport(mergedReportData);
      console.log('ASCOMP Report created successfully:', response);
      
      // Update visit status to Completed
      if (selectedVisit) {
        await apiClient.updateServiceVisit(selectedVisit._id, {
          status: 'Completed',
          actualDate: new Date().toISOString().split('T')[0],
          endTime: new Date().toTimeString().slice(0, 5),
          workflowStatus: {
            photosCaptured: true,
            serviceCompleted: true,
            reportGenerated: true,
            signatureCaptured: true,
            completed: true,
            lastUpdated: new Date()
          }
        });
        console.log('Visit status updated to Completed');
      }

      setShowASCOMPForm(false);
      updateStepStatus('generate-report', 'completed');
      setCurrentStep(5);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Report Submitted Successfully!',
        message: 'Your comprehensive ASCOMP service report has been completed and saved.'
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
      
      (window as any).showToast?.({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSignatureCaptured = (signatureData: SignatureData) => {
    setWorkflowData(prev => ({
      ...prev,
      signatures: signatureData
    }));
    updateStepStatus('site-signature', 'completed');
    setCurrentStep(6);
  };

  const handleServiceComplete = async () => {
    try {
      setIsCompletingService(true);
      console.log('Starting service completion process...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Validate required data
      if (!selectedVisit) {
        throw new Error('No service visit selected');
      }

      // First, upload photos to Cloudinary if any exist
      let uploadedPhotos = [];
      if (workflowData.photos && workflowData.photos.length > 0) {
        console.log('Uploading photos to Cloudinary...');
        
        // Upload photos individually with their specific categories
        for (const photo of workflowData.photos) {
          try {
            const formData = new FormData();
            formData.append('photos', photo.file);
            formData.append('description', photo.description);
            
            // Map photo categories to server categories
            const categoryMap = {
              'BEFORE': 'Before Service',
              'DURING': 'During Service', 
              'AFTER': 'After Service',
              'ISSUE': 'Issue Found',
              'PARTS': 'Parts Used'
            };
            
            const serverCategory = categoryMap[photo.category] || 'Service Photos';
            console.log(`Uploading photo with category: ${photo.category} -> ${serverCategory}`);
            
            const uploadResponse = await apiClient.uploadServiceVisitPhotosAutomated(
              selectedVisit._id, 
              formData, 
              serverCategory
            );
            
            if (uploadResponse.photos && uploadResponse.photos.length > 0) {
              uploadedPhotos.push(...uploadResponse.photos);
            }
          } catch (uploadError) {
            console.error(`Photo upload failed for ${photo.category}:`, uploadError);
            // Continue with other photos even if one fails
          }
        }
        
        console.log(`Successfully uploaded ${uploadedPhotos.length} photos to Cloudinary`);
      }
      
      // Fetch projector details to get model and brand
      let projectorModel = 'Unknown Model';
      let brand = 'Unknown Brand';
      try {
        const projectors = await apiClient.getAllProjectors();
        const projector = projectors.find((p: any) => p.serialNumber === selectedVisit.projectorSerial);
        if (projector) {
          projectorModel = projector.model || 'Unknown Model';
          brand = projector.brand || 'Unknown Brand';
        }
      } catch (err) {
        console.warn('Failed to fetch projector details, using defaults:', err);
      }

      // Create service report first
      const reportData = {
        reportNumber: `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reportTitle: `${selectedVisit.visitType} Service Report`,
        reportType: 'First', // Default to First, could be determined by history
        date: new Date().toISOString().split('T')[0],
        visitId: selectedVisit.visitId,
        siteId: selectedVisit.siteId,
        siteName: selectedVisit.siteName,
        projectorSerial: selectedVisit.projectorSerial,
        projectorModel: projectorModel,
        brand: brand,
        engineer: {
          name: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username,
          phone: user?.profile?.phone || '',
          email: user?.email || ''
        },
        serviceStartTime: workflowData.serviceStartTime,
        serviceEndTime: new Date().toISOString(),
        workPerformed: workflowData.workPerformed || 'Service completed',
        issuesFound: workflowData.issuesFound || [],
        partsUsed: workflowData.partsUsed || [],
        recommendations: workflowData.recommendations || '',
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : workflowData.photos.map(photo => ({
          filename: photo.file.name,
          originalName: photo.file.name,
          path: URL.createObjectURL(photo.file),
          uploadedAt: photo.timestamp,
          description: photo.description,
          category: photo.category
        })),
        signatures: workflowData.signatures || {},
        ...workflowData.reportData
      };

      console.log('Creating service report with data:', reportData);
      const reportResponse = await apiClient.createServiceReport(reportData);
      console.log('Service report created successfully:', reportResponse);
      
      // Generate PDF for the completed report
      try {
        console.log('🔄 Generating PDF for completed report...');
        await exportServiceReportToPDF(reportResponse.data || reportResponse);
        console.log('✅ PDF generated successfully');
        
        // Show PDF generation success message
        (window as any).showToast?.({
          type: 'success',
          title: 'PDF Generated!',
          message: 'Service report PDF has been downloaded successfully.'
        });
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError);
        // Don't fail the entire process if PDF generation fails
        (window as any).showToast?.({
          type: 'warning',
          title: 'PDF Generation Failed',
          message: 'Service report was saved but PDF generation failed. You can export it later from the reports section.'
        });
      }
      
      // Update visit status after successful report creation
      if (selectedVisit) {
        await apiClient.updateServiceVisit(selectedVisit._id, {
          status: 'Completed',
          actualDate: new Date().toISOString().split('T')[0],
          endTime: new Date().toTimeString().slice(0, 5),
          workPerformed: workflowData.workPerformed || 'Service completed',
          issuesFound: (workflowData.issuesFound || []).map(issue => ({
            description: issue,
            severity: 'Medium',
            resolved: true
          })),
          recommendations: workflowData.recommendations || '',
          photos: uploadedPhotos.length > 0 ? uploadedPhotos : workflowData.photos.map(photo => ({
            filename: photo.file.name,
            originalName: photo.file.name,
            path: URL.createObjectURL(photo.file),
            uploadedAt: photo.timestamp,
            description: photo.description,
            category: photo.category
          })),
          workflowStatus: {
            photosCaptured: true,
            serviceCompleted: true,
            reportGenerated: true,
            signatureCaptured: true,
            completed: true,
            lastUpdated: new Date()
          }
        });
        console.log('Visit status updated to Completed');
      }

      updateStepStatus('complete-service', 'completed');
      
      // Show success message
      (window as any).showToast?.({
        type: 'success',
        title: 'Service Completed!',
        message: 'Service report has been successfully submitted.'
      });

    } catch (error: any) {
      console.error('Error completing service:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to complete service. Please try again.';
      if (error.message?.includes('Authentication required')) {
        errorMessage = 'Please log in again to complete the service.';
      } else if (error.message?.includes('No service visit selected')) {
        errorMessage = 'Please select a service visit first.';
      } else if (error.message?.includes('projectorModel')) {
        errorMessage = 'Missing projector information. Please check your data.';
      } else if (error.message?.includes('Invalid or expired token')) {
        errorMessage = 'Your session has expired. Please log in again.';
      }
      
      (window as any).showToast?.({
        type: 'error',
        title: 'Service Completion Failed',
        message: errorMessage
      });
    } finally {
      setIsCompletingService(false);
    }
  };

  const renderStepContent = () => {
    const currentStepData = workflowSteps[currentStep];
    
    switch (currentStepData.id) {
      case 'select-visit':
        return <VisitSelectionStep visits={visits} onVisitSelect={handleVisitSelect} isLoading={isLoading} />;
      case 'start-service':
        return <StartServiceStep visit={selectedVisit} onStart={handleStartService} />;
      case 'capture-photos':
        return <PhotoCaptureStep onPhotosCaptured={handlePhotosCaptured} visit={selectedVisit} />;
      case 'record-work':
        return <WorkRecordingStep onWorkRecorded={handleWorkRecorded} visit={selectedVisit} />;
      case 'generate-report':
        return <ReportGenerationStep onReportGenerated={handleReportGenerated} workflowData={workflowData} visit={selectedVisit} />;
      case 'site-signature':
        return <SignatureCaptureStep onSignatureCaptured={handleSignatureCaptured} visit={selectedVisit} />;
      case 'complete-service':
        return <ServiceCompletionStep onComplete={handleServiceComplete} workflowData={workflowData} visit={selectedVisit} isLoading={isCompletingService} />;
      default:
        return null;
    }
  };

  // Set up global function for ASCOMP form opening
  useEffect(() => {
    (window as any).openASCOMPForm = () => {
      setShowASCOMPForm(true);
    };
    
    return () => {
      delete (window as any).openASCOMPForm;
    };
  }, []);

  const progress = ((currentStep + 1) / workflowSteps.length) * 100;
  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;

  // Add error display
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Workflow</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                loadFSEReports();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">FSE Service Workflow</h1>
          <p className="text-gray-600">Complete service visits step by step</p>
          <div className="mt-2 text-sm text-gray-500">
            User: {user?.username || 'Unknown'} | FSE ID: {user?.fseId || 'Not Set'} | Visits: {visits.length}
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Progress</h3>
                <p className="text-sm text-gray-600">
                  Step {currentStep + 1} of {workflowSteps.length} - {completedSteps} completed
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = step.status === 'completed';
            const isSkipped = step.status === 'skipped';
            
            return (
              <Card 
                key={step.id} 
                className={`cursor-pointer transition-all ${
                  isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 
                  isCompleted ? 'bg-green-50 border-green-200' :
                  isSkipped ? 'bg-gray-50 border-gray-200' :
                  'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isSkipped ? 'bg-gray-100 text-gray-400' :
                    isActive ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <h4 className={`text-sm font-medium ${
                    isActive ? 'text-blue-900' : 
                    isCompleted ? 'text-green-900' :
                    isSkipped ? 'text-gray-500' :
                    'text-gray-700'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' :
                    isSkipped ? 'text-gray-400' :
                    'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(workflowSteps[currentStep].icon, { className: "w-5 h-5" })}
              {workflowSteps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>

      {/* ASCOMP Report Form Modal */}
      {showASCOMPForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">ASCOMP Service Report</h2>
              <Button
                variant="outline"
                onClick={() => setShowASCOMPForm(false)}
                disabled={isSubmittingReport}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <ASCOMPServiceReportForm
                onSubmit={handleASCOMPReportSubmit}
                initialData={{
                  engineer: {
                    name: user?.profile?.firstName + ' ' + user?.profile?.lastName || user?.username,
                    phone: user?.profile?.phone || '',
                    email: user?.email || ''
                  },
                  date: new Date().toISOString().split('T')[0],
                  siteName: selectedVisit?.siteName || '',
                  projectorSerial: selectedVisit?.projectorSerial || '',
                  projectorModel: selectedVisit?.projectorModel || '',
                  visitId: selectedVisit?.visitId || '',
                  siteId: selectedVisit?.siteId || '',
                  workPerformed: workflowData.workPerformed,
                  issuesFound: workflowData.issuesFound,
                  partsUsed: workflowData.partsUsed,
                  recommendations: workflowData.recommendations
                }}
                onClose={() => setShowASCOMPForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step Components
interface VisitSelectionStepProps {
  visits: ServiceVisit[];
  onVisitSelect: (visit: ServiceVisit) => void;
  isLoading: boolean;
}

function VisitSelectionStep({ visits, onVisitSelect, isLoading }: VisitSelectionStepProps) {
  const [filter, setFilter] = useState('all');
  
  const filteredVisits = visits.filter(visit => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return visit.status === 'Scheduled';
    if (filter === 'in-progress') return visit.status === 'In Progress';
    return true;
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading visits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({visits.length})
        </Button>
        <Button 
          variant={filter === 'scheduled' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('scheduled')}
        >
          Scheduled ({visits.filter(v => v.status === 'Scheduled').length})
        </Button>
        <Button 
          variant={filter === 'in-progress' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({visits.filter(v => v.status === 'In Progress').length})
        </Button>
      </div>

      <div className="space-y-3">
        {filteredVisits.map((visit) => (
          <Card 
            key={visit._id} 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onVisitSelect(visit)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{visit.siteName}</span>
                    <Badge variant="outline" className="text-xs">
                      {visit.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Monitor className="w-4 h-4" />
                      {visit.projectorSerial}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(visit.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Wrench className="w-4 h-4" />
                      {visit.visitType}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface StartServiceStepProps {
  visit: ServiceVisit | null;
  onStart: () => void;
}

function StartServiceStep({ visit, onStart }: StartServiceStepProps) {
  if (!visit) return null;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Service Visit Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Site:</span> {visit.siteName}
          </div>
          <div>
            <span className="font-medium">Projector:</span> {visit.projectorSerial}
          </div>
          <div>
            <span className="font-medium">Type:</span> {visit.visitType}
          </div>
          <div>
            <span className="font-medium">Priority:</span> {visit.priority}
          </div>
        </div>
        {visit.description && (
          <div className="mt-2">
            <span className="font-medium">Description:</span>
            <p className="text-sm text-gray-600 mt-1">{visit.description}</p>
          </div>
        )}
      </div>

      <div className="text-center">
        <Button onClick={onStart} size="lg" className="bg-green-600 hover:bg-green-700">
          <Play className="w-5 h-5 mr-2" />
          Start Service
        </Button>
      </div>
    </div>
  );
}

interface PhotoCaptureStepProps {
  onPhotosCaptured: (photos: PhotoData[]) => void;
  visit: ServiceVisit | null;
}

function PhotoCaptureStep({ onPhotosCaptured, visit }: PhotoCaptureStepProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<Partial<PhotoData>>({
    category: 'BEFORE',
    description: '',
    beforeAfter: 'BEFORE'
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const photoData: PhotoData = {
        id: Date.now().toString(),
        file,
        category: currentPhoto.category || 'BEFORE',
        description: currentPhoto.description || '',
        timestamp: new Date().toISOString(),
        beforeAfter: currentPhoto.beforeAfter || 'BEFORE'
      };
      setPhotos(prev => [...prev, photoData]);
      setCurrentPhoto({
        category: 'DURING',
        description: '',
        beforeAfter: 'DURING'
      });
    }
  };

  const handleComplete = () => {
    onPhotosCaptured(photos);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Capture Service Photos</h3>
        <p className="text-gray-600">Take photos before, during, and after service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Photo Category</label>
          <select 
            value={currentPhoto.category || 'BEFORE'}
            onChange={(e) => setCurrentPhoto(prev => ({ ...prev, category: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="BEFORE">Before Service</option>
            <option value="DURING">During Service</option>
            <option value="AFTER">After Service</option>
            <option value="ISSUE">Issue Found</option>
            <option value="PARTS">Parts Used</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Before/After</label>
          <select 
            value={currentPhoto.beforeAfter || 'BEFORE'}
            onChange={(e) => setCurrentPhoto(prev => ({ ...prev, beforeAfter: e.target.value as 'BEFORE' | 'DURING' | 'AFTER' }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="BEFORE">Before</option>
            <option value="DURING">During</option>
            <option value="AFTER">After</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Description</label>
          <input 
            type="text"
            value={currentPhoto.description || ''}
            onChange={(e) => setCurrentPhoto(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Photo description"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="text-center">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="photo-input"
        />
        <label htmlFor="photo-input">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <span>
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </span>
          </Button>
        </label>
      </div>

      {photos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Captured Photos ({photos.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img 
                  src={URL.createObjectURL(photo.file)} 
                  alt={photo.description}
                  className="w-full h-24 object-cover rounded border"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  {photo.category} - {photo.beforeAfter}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setPhotos([])}>
          Clear All Photos
        </Button>
        <Button onClick={handleComplete} disabled={photos.length === 0}>
          Complete Photo Capture
        </Button>
      </div>
    </div>
  );
}

interface WorkRecordingStepProps {
  onWorkRecorded: (workData: any) => void;
  visit: ServiceVisit | null;
}

function WorkRecordingStep({ onWorkRecorded, visit }: WorkRecordingStepProps) {
  const [workData, setWorkData] = useState({
    workPerformed: '',
    issuesFound: [] as string[],
    partsUsed: [] as string[],
    recommendations: ''
  });

  const [newIssue, setNewIssue] = useState('');
  const [newPart, setNewPart] = useState('');

  const addIssue = () => {
    if (newIssue.trim()) {
      setWorkData(prev => ({
        ...prev,
        issuesFound: [...prev.issuesFound, newIssue.trim()]
      }));
      setNewIssue('');
    }
  };

  const removeIssue = (index: number) => {
    setWorkData(prev => ({
      ...prev,
      issuesFound: prev.issuesFound.filter((_, i) => i !== index)
    }));
  };

  const addPart = () => {
    if (newPart.trim()) {
      setWorkData(prev => ({
        ...prev,
        partsUsed: [...prev.partsUsed, newPart.trim()]
      }));
      setNewPart('');
    }
  };

  const removePart = (index: number) => {
    setWorkData(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    onWorkRecorded(workData);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Work Performed</label>
        <textarea
          value={workData.workPerformed}
          onChange={(e) => setWorkData(prev => ({ ...prev, workPerformed: e.target.value }))}
          placeholder="Describe the work performed during this service visit..."
          className="w-full p-3 border border-gray-300 rounded-md h-32"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Issues Found</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newIssue}
            onChange={(e) => setNewIssue(e.target.value)}
            placeholder="Add an issue found"
            className="flex-1 p-2 border border-gray-300 rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && addIssue()}
          />
          <Button onClick={addIssue} size="sm">Add</Button>
        </div>
        <div className="space-y-1">
          {workData.issuesFound.map((issue, index) => (
            <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
              <span className="text-sm">{issue}</span>
              <Button 
                onClick={() => removeIssue(index)} 
                size="sm" 
                variant="ghost"
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Parts Used</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPart}
            onChange={(e) => setNewPart(e.target.value)}
            placeholder="Add a part used"
            className="flex-1 p-2 border border-gray-300 rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && addPart()}
          />
          <Button onClick={addPart} size="sm">Add</Button>
        </div>
        <div className="space-y-1">
          {workData.partsUsed.map((part, index) => (
            <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
              <span className="text-sm">{part}</span>
              <Button 
                onClick={() => removePart(index)} 
                size="sm" 
                variant="ghost"
                className="text-green-600 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Recommendations</label>
        <textarea
          value={workData.recommendations}
          onChange={(e) => setWorkData(prev => ({ ...prev, recommendations: e.target.value }))}
          placeholder="Any recommendations for future maintenance or improvements..."
          className="w-full p-3 border border-gray-300 rounded-md h-24"
        />
      </div>

      <div className="text-center">
        <Button onClick={handleSubmit} size="lg">
          Record Work Details
        </Button>
      </div>
    </div>
  );
}

interface ReportGenerationStepProps {
  onReportGenerated: (reportData: any) => void;
  workflowData: any;
  visit: ServiceVisit | null;
}

function ReportGenerationStep({ onReportGenerated, workflowData, visit }: ReportGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reportData = {
      reportNumber: `REPORT-${Date.now()}`,
      visitId: visit?.visitId,
      siteName: visit?.siteName,
      projectorSerial: visit?.projectorSerial,
      workPerformed: workflowData.workPerformed,
      issuesFound: workflowData.issuesFound,
      partsUsed: workflowData.partsUsed,
      recommendations: workflowData.recommendations,
      photos: workflowData.photos,
      serviceStartTime: workflowData.serviceStartTime,
      serviceEndTime: new Date().toISOString()
    };
    
    onReportGenerated(reportData);
    setIsGenerating(false);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    
    try {
      // Create a preview report from current workflow data
      const previewReport = {
        reportNumber: `PREVIEW-${Date.now()}`,
        reportTitle: `${visit?.visitType} Service Report Preview`,
        reportType: 'First',
        date: new Date().toISOString().split('T')[0],
        siteName: visit?.siteName || 'Site Name',
        projectorSerial: visit?.projectorSerial || 'Projector Serial',
        projectorModel: 'Projector Model',
        brand: 'Brand',
        engineer: {
          name: 'Engineer Name',
          phone: 'Phone',
          email: 'email@example.com'
        },
        workPerformed: workflowData.workPerformed || 'Service work performed',
        issuesFound: workflowData.issuesFound || [],
        partsUsed: workflowData.partsUsed || [],
        recommendations: workflowData.recommendations || 'No recommendations',
        photos: workflowData.photos || [],
        serviceStartTime: workflowData.serviceStartTime,
        serviceEndTime: new Date().toISOString()
      };

      await exportServiceReportToPDF(previewReport);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'PDF Preview Generated!',
        message: 'Preview PDF has been downloaded successfully.'
      });
    } catch (error) {
      console.error('PDF preview generation failed:', error);
      (window as any).showToast?.({
        type: 'error',
        title: 'PDF Generation Failed',
        message: 'Failed to generate PDF preview. Please try again.'
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generate Service Report</h3>
        <p className="text-gray-600">Create comprehensive service report with all collected data</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Report Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Site:</span> {visit?.siteName}
          </div>
          <div>
            <span className="font-medium">Projector:</span> {visit?.projectorSerial}
          </div>
          <div>
            <span className="font-medium">Photos:</span> {workflowData.photos?.length || 0}
          </div>
          <div>
            <span className="font-medium">Issues:</span> {workflowData.issuesFound?.length || 0}
          </div>
          <div>
            <span className="font-medium">Parts Used:</span> {workflowData.partsUsed?.length || 0}
          </div>
          <div>
            <span className="font-medium">Service Duration:</span> 
            {workflowData.serviceStartTime ? 
              `${Math.round((new Date().getTime() - new Date(workflowData.serviceStartTime).getTime()) / 60000)} minutes` : 
              'Not started'
            }
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">ASCOMP Report Available</h4>
            <p className="text-sm text-blue-700 mt-1">
              You can now fill out the comprehensive ASCOMP service report with all the technical details and measurements.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <Button 
          onClick={handleGenerateReport} 
          disabled={isGenerating}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate Basic Report
            </>
          )}
        </Button>
        
        <div className="text-sm text-gray-500">OR</div>
        
        <Button 
          onClick={() => {
            // This will be handled by the parent component
            (window as any).openASCOMPForm?.();
          }}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <FileText className="w-5 h-5 mr-2" />
          Fill ASCOMP Report
        </Button>
        
        <div className="text-sm text-gray-500">OR</div>
        
        <Button 
          onClick={handleExportPDF}
          disabled={isExportingPDF}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isExportingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate PDF Preview
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface SignatureCaptureStepProps {
  onSignatureCaptured: (signatureData: SignatureData) => void;
  visit: ServiceVisit | null;
}

function SignatureCaptureStep({ onSignatureCaptured, visit }: SignatureCaptureStepProps) {
  const [signatureData, setSignatureData] = useState<SignatureData>({
    siteInCharge: '',
    fse: '',
    timestamp: '',
    location: ''
  });

  const handleSubmit = () => {
    const data = {
      ...signatureData,
      timestamp: new Date().toISOString(),
      location: visit?.siteName || 'Service Location'
    };
    onSignatureCaptured(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Site In-charge Signature</h3>
        <p className="text-gray-600">Get signature from site in-charge to complete service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Site In-charge Name</label>
          <input
            type="text"
            value={signatureData.siteInCharge}
            onChange={(e) => setSignatureData(prev => ({ ...prev, siteInCharge: e.target.value }))}
            placeholder="Enter site in-charge name"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">FSE Name</label>
          <input
            type="text"
            value={signatureData.fse}
            onChange={(e) => setSignatureData(prev => ({ ...prev, fse: e.target.value }))}
            placeholder="Enter FSE name"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Signature Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Please ensure the site in-charge signs the service report to confirm completion and satisfaction.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleSubmit} 
          disabled={!signatureData.siteInCharge || !signatureData.fse}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="w-5 h-5 mr-2" />
          Capture Signatures
        </Button>
      </div>
    </div>
  );
}

interface ServiceCompletionStepProps {
  onComplete: () => void;
  workflowData: any;
  visit: ServiceVisit | null;
  isLoading?: boolean;
}

function ServiceCompletionStep({ onComplete, workflowData, visit, isLoading = false }: ServiceCompletionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Complete Service</h3>
        <p className="text-gray-600">Review and finalize the service report</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">Service Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Site:</span> {visit?.siteName}
          </div>
          <div>
            <span className="font-medium">Projector:</span> {visit?.projectorSerial}
          </div>
          <div>
            <span className="font-medium">Service Type:</span> {visit?.visitType}
          </div>
          <div>
            <span className="font-medium">Status:</span> Ready for Completion
          </div>
          <div>
            <span className="font-medium">Photos Captured:</span> {workflowData.photos?.length || 0}
          </div>
          <div>
            <span className="font-medium">Issues Found:</span> {workflowData.issuesFound?.length || 0}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button 
          onClick={onComplete} 
          size="lg"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Completing Service...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete Service
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
