import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  FileText, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  Wrench,
  Upload,
  Download,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  Send
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceVisit {
  _id: string;
  visitId: string;
  fseId: string;
  fseName: string;
  siteId: string;
  siteName: string;
  projectorSerial: string;
  visitType: string;
  amcContractId?: string;
  amcServiceInterval: string;
  scheduledDate: string;
  actualDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  priority: string;
  description?: string;
  workPerformed?: string;
  partsUsed: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    cost: number;
  }>;
  totalCost: number;
  customerFeedback?: {
    rating: number;
    comments: string;
  };
  photos: Array<{
    filename: string;
    originalName: string;
    cloudUrl: string;
    publicId: string;
    uploadedAt: string;
    description: string;
    category: string;
    fileSize: number;
    mimeType: string;
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
  nextVisitDate?: string;
  travelDistance?: number;
  travelTime?: number;
  expenses: {
    fuel: number;
    food: number;
    accommodation: number;
    other: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Site {
  _id: string;
  siteId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Projector {
  _id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  siteId: string;
  siteName: string;
  installationDate: string;
  warrantyExpiry: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const RealFSEWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceVisits, setServiceVisits] = useState<ServiceVisit[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<ServiceVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState({
    visitId: '',
    siteId: '',
    projectorSerial: '',
    workPerformed: '',
    partsUsed: [] as Array<{
      partNumber: string;
      partName: string;
      quantity: number;
      cost: number;
    }>,
    issuesFound: [] as Array<{
      description: string;
      severity: string;
      resolved: boolean;
    }>,
    recommendations: [] as Array<{
      description: string;
      priority: string;
    }>,
    photos: [] as Array<{
      file: File;
      category: string;
      description: string;
    }>,
    customerFeedback: {
      rating: 5,
      comments: ''
    },
    expenses: {
      fuel: 0,
      food: 0,
      accommodation: 0,
      other: 0
    },
    unableToCompleteReason: '',
    unableToCompleteCategory: 'Other'
  });

  const steps = [
    { id: 1, title: 'Select Service Visit', description: 'Choose the service visit to work on' },
    { id: 2, title: 'Start Service', description: 'Begin the service work' },
    { id: 3, title: 'Capture Photos', description: 'Take photos during service' },
    { id: 4, title: 'Record Work Details', description: 'Document work performed and parts used' },
    { id: 5, title: 'Generate Report', description: 'Create service report' },
    { id: 6, title: 'Site In-charge Signature', description: 'Get digital signature from site in-charge' },
    { id: 7, title: 'Complete Service', description: 'Finish and submit service' },
    { id: 8, title: 'Unable to Complete', description: 'Mark service as unable to complete with reason' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load service visits
      try {
        const visits = await apiClient.getAllServiceVisits();
        setServiceVisits(visits || []);
      } catch (visitError) {
        console.log('Service visits not available, showing empty state');
        // Show empty state instead of demo data for new FSE users
        setServiceVisits([]);
      }

      // Load sites
      try {
        const sitesData = await apiClient.getAllSites();
        setSites(sitesData || []);
      } catch (siteError) {
        console.log('Sites not available, using demo data');
        const demoSites: Site[] = [
          {
            _id: 'site-1',
            siteId: 'SITE-001',
            name: 'Downtown Office Building',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            contactPerson: 'Jane Doe',
            contactPhone: '+1-555-0123',
            contactEmail: 'jane.doe@company.com',
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setSites(demoSites);
      }

      // Load projectors
      try {
        const projectorsData = await apiClient.getAllProjectors();
        setProjectors(projectorsData || []);
      } catch (projectorError) {
        console.log('Projectors not available, using demo data');
        const demoProjectors: Projector[] = [
          {
            _id: 'projector-1',
            serialNumber: 'PROJ-001',
            model: 'Christie DHD800',
            manufacturer: 'Christie',
            siteId: 'SITE-001',
            siteName: 'Downtown Office Building',
            installationDate: '2023-01-15',
            warrantyExpiry: '2025-01-15',
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setProjectors(demoProjectors);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVisitSelect = (visit: ServiceVisit) => {
    setSelectedVisit(visit);
    setWorkflowData(prev => ({
      ...prev,
      visitId: visit._id,
      siteId: visit.siteId,
      projectorSerial: visit.projectorSerial
    }));
    setCurrentStep(2);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(file => ({
        file,
        category: 'During Service',
        description: ''
      }));
      setWorkflowData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    }
  };

  const handlePartAdd = () => {
    setWorkflowData(prev => ({
      ...prev,
      partsUsed: [...prev.partsUsed, {
        partNumber: '',
        partName: '',
        quantity: 1,
        cost: 0
      }]
    }));
  };

  const handlePartUpdate = (index: number, field: string, value: any) => {
    setWorkflowData(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleIssueAdd = () => {
    setWorkflowData(prev => ({
      ...prev,
      issuesFound: [...prev.issuesFound, {
        description: '',
        severity: 'Low',
        resolved: false
      }]
    }));
  };

  const handleIssueUpdate = (index: number, field: string, value: any) => {
    setWorkflowData(prev => ({
      ...prev,
      issuesFound: prev.issuesFound.map((issue, i) => 
        i === index ? { ...issue, [field]: value } : issue
      )
    }));
  };

  const handleRecommendationAdd = () => {
    setWorkflowData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, {
        description: '',
        priority: 'Medium'
      }]
    }));
  };

  const handleRecommendationUpdate = (index: number, field: string, value: any) => {
    setWorkflowData(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((rec, i) => 
        i === index ? { ...rec, [field]: value } : rec
      )
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Update service visit status
      if (selectedVisit) {
        await apiClient.updateServiceVisit(selectedVisit._id, {
          status: 'Completed',
          actualDate: new Date().toISOString(),
          workPerformed: workflowData.workPerformed,
          partsUsed: workflowData.partsUsed,
          totalCost: workflowData.partsUsed.reduce((sum, part) => sum + (part.cost * part.quantity), 0),
          issuesFound: workflowData.issuesFound,
          recommendations: workflowData.recommendations,
          customerFeedback: workflowData.customerFeedback,
          expenses: workflowData.expenses
        });

        // Upload photos
        if (workflowData.photos.length > 0) {
          const formData = new FormData();
          workflowData.photos.forEach((photo, index) => {
            formData.append('photos', photo.file);
            formData.append('category', photo.category);
            formData.append('description', photo.description);
          });
          
          await apiClient.uploadServiceVisitPhotosAutomated(
            selectedVisit._id, 
            formData, 
            'During Service'
          );
        }

        // Create service report
        const serviceReportResponse = await apiClient.createServiceReport({
          visitId: selectedVisit._id,
          fseId: selectedVisit.fseId,
          fseName: selectedVisit.fseName,
          siteId: selectedVisit.siteId,
          siteName: selectedVisit.siteName,
          projectorSerial: selectedVisit.projectorSerial,
          reportDate: new Date().toISOString(),
          serviceType: selectedVisit.visitType,
          workPerformed: workflowData.workPerformed,
          partsUsed: workflowData.partsUsed,
          totalCost: workflowData.partsUsed.reduce((sum, part) => sum + (part.cost * part.quantity), 0),
          customerFeedback: workflowData.customerFeedback,
          issuesFound: workflowData.issuesFound,
          recommendations: workflowData.recommendations,
          nextVisitDate: workflowData.recommendations.some(rec => rec.description.toLowerCase().includes('next'))
            ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
            : undefined
        });

        if (serviceReportResponse.generatedDoc || serviceReportResponse.generatedPdf) {
          setWorkflowData(prev => ({
            ...prev,
            generatedDocReport: serviceReportResponse.generatedDoc,
            generatedPdfReport: serviceReportResponse.generatedPdf,
          }));
        }

        alert('Service completed successfully!');
        setCurrentStep(1);
        setSelectedVisit(null);
        setWorkflowData({
          visitId: '',
          siteId: '',
          projectorSerial: '',
          workPerformed: '',
          partsUsed: [],
          issuesFound: [],
          recommendations: [],
          photos: [],
          customerFeedback: { rating: 5, comments: '' },
          expenses: { fuel: 0, food: 0, accommodation: 0, other: 0 },
          unableToCompleteReason: ''
        });
      }
    } catch (err) {
      console.error('Error submitting service:', err);
      alert('Failed to submit service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnableToComplete = async () => {
    try {
      setLoading(true);
      
      // Enhanced validation
      if (!workflowData.unableToCompleteReason.trim()) {
        alert('Please provide a reason for being unable to complete the service.');
        return;
      }

      if (workflowData.unableToCompleteReason.trim().length < 10) {
        alert('Please provide a more detailed reason (at least 10 characters).');
        return;
      }

      if (workflowData.unableToCompleteReason.trim().length > 1000) {
        alert('Reason is too long. Please keep it under 1000 characters.');
        return;
      }

      if (selectedVisit) {
        const result = await apiClient.markServiceVisitUnableToComplete(
          selectedVisit._id, 
          workflowData.unableToCompleteReason,
          workflowData.unableToCompleteCategory
        );

        // Show success message with more details
        alert(`Service marked as unable to complete successfully!\n\nVisit ID: ${result.visit.visitId}\nStatus: ${result.visit.status}\nUpdated by: ${result.visit.updatedBy || 'You'}`);
        
        // Reset form and go back to step 1
        setCurrentStep(1);
        setSelectedVisit(null);
        setWorkflowData({
          visitId: '',
          siteId: '',
          projectorSerial: '',
          workPerformed: '',
          partsUsed: [],
          issuesFound: [],
          recommendations: [],
          photos: [],
          customerFeedback: { rating: 5, comments: '' },
          expenses: { fuel: 0, food: 0, accommodation: 0, other: 0 },
          unableToCompleteReason: '',
          unableToCompleteCategory: 'Other'
        });
      }
    } catch (err: any) {
      console.error('Error marking service as unable to complete:', err);
      
      // Enhanced error handling
      let errorMessage = 'Failed to mark service as unable to complete. Please try again.';
      
      if (err.message) {
        if (err.message.includes('ALREADY_COMPLETED')) {
          errorMessage = 'This service has already been completed and cannot be marked as unable to complete.';
        } else if (err.message.includes('ALREADY_CANCELLED')) {
          errorMessage = 'This service has already been cancelled and cannot be marked as unable to complete.';
        } else if (err.message.includes('REASON_TOO_SHORT')) {
          errorMessage = 'Please provide a more detailed reason (at least 10 characters).';
        } else if (err.message.includes('REASON_TOO_LONG')) {
          errorMessage = 'Reason is too long. Please keep it under 1000 characters.';
        } else if (err.message.includes('VISIT_NOT_FOUND')) {
          errorMessage = 'Service visit not found. Please refresh and try again.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Unable to Complete': return 'text-orange-600 bg-orange-100';
      default: return 'text-dark-secondary bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-dark-secondary">Loading FSE Workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-dark-bg shadow-sm border-b border-dark-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center mr-3">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-primary">FSE Workflow</h1>
                <p className="text-sm text-dark-secondary">Service → Photo → Report → Signature</p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center px-4 py-2 text-dark-secondary hover:text-dark-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-dark-bg border-b border-dark-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-dark-secondary'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-6 w-12 h-0.5 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Select Service Visit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceVisits.map((visit) => (
                <div
                  key={visit._id}
                  onClick={() => handleVisitSelect(visit)}
                  className="bg-dark-card rounded-lg shadow-lg border border-dark-color p-6 cursor-pointer hover:border-blue-500/50 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-dark-primary">{visit.siteName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-dark-secondary">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      {visit.projectorSerial}
                    </p>
                    <p className="text-sm text-dark-secondary">
                      <Clock className="h-4 w-4 inline mr-2" />
                      {formatDate(visit.scheduledDate)}
                    </p>
                    <p className="text-sm text-dark-secondary">
                      <Wrench className="h-4 w-4 inline mr-2" />
                      {visit.visitType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && selectedVisit && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Start Service</h2>
            <div className="bg-dark-card rounded-lg shadow-lg border border-dark-color p-6">
              <h3 className="text-lg font-medium text-dark-primary mb-4">Service Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Site</label>
                  <p className="mt-1 text-sm text-black">{selectedVisit.siteName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Projector</label>
                  <p className="mt-1 text-sm text-black">{selectedVisit.projectorSerial}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Visit Type</label>
                  <p className="mt-1 text-sm text-black">{selectedVisit.visitType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Priority</label>
                  <p className="mt-1 text-sm text-black">{selectedVisit.priority}</p>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-dark-secondary">Work Performed</label>
                <textarea
                  value={workflowData.workPerformed}
                  onChange={(e) => setWorkflowData(prev => ({ ...prev, workPerformed: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the work performed..."
                />
              </div>
              
              {/* Unable to Complete Quick Access */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-orange-900">Unable to Complete Service?</h4>
                        <p className="text-xs text-orange-700">If you cannot complete this service, you can mark it as unable to complete.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(8)}
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 flex items-center"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Unable to Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Capture Photos</h2>
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-secondary mb-2">Upload Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {workflowData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo.file)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setWorkflowData(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Record Work Details</h2>
            
            {/* Parts Used */}
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-dark-primary">Parts Used</h3>
                <button
                  onClick={handlePartAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </button>
              </div>
              <div className="space-y-4">
                {workflowData.partsUsed.map((part, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Part Number"
                      value={part.partNumber}
                      onChange={(e) => handlePartUpdate(index, 'partNumber', e.target.value)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Part Name"
                      value={part.partName}
                      onChange={(e) => handlePartUpdate(index, 'partName', e.target.value)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={part.quantity}
                      onChange={(e) => handlePartUpdate(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Cost"
                      value={part.cost}
                      onChange={(e) => handlePartUpdate(index, 'cost', parseFloat(e.target.value) || 0)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Issues Found */}
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-dark-primary">Issues Found</h3>
                <button
                  onClick={handleIssueAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Issue
                </button>
              </div>
              <div className="space-y-4">
                {workflowData.issuesFound.map((issue, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Issue Description"
                      value={issue.description}
                      onChange={(e) => handleIssueUpdate(index, 'description', e.target.value)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={issue.severity}
                      onChange={(e) => handleIssueUpdate(index, 'severity', e.target.value)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={issue.resolved}
                        onChange={(e) => handleIssueUpdate(index, 'resolved', e.target.checked)}
                        className="mr-2"
                      />
                      Resolved
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-dark-primary">Recommendations</h3>
                <button
                  onClick={handleRecommendationAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recommendation
                </button>
              </div>
              <div className="space-y-4">
                {workflowData.recommendations.map((rec, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Recommendation Description"
                      value={rec.description}
                      onChange={(e) => handleRecommendationUpdate(index, 'description', e.target.value)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={rec.priority}
                      onChange={(e) => handleRecommendationUpdate(index, 'priority', e.target.value)}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Generate Report</h2>
            <div className="bg-dark-card rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-dark-primary mb-4">Service Report Preview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Customer Feedback Rating</label>
                  <select
                    value={workflowData.customerFeedback.rating}
                    onChange={(e) => setWorkflowData(prev => ({
                      ...prev,
                      customerFeedback: { ...prev.customerFeedback, rating: parseInt(e.target.value) }
                    }))}
                    className="mt-1 block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Fair</option>
                    <option value={3}>3 - Good</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Customer Comments</label>
                  <textarea
                    value={workflowData.customerFeedback.comments}
                    onChange={(e) => setWorkflowData(prev => ({
                      ...prev,
                      customerFeedback: { ...prev.customerFeedback, comments: e.target.value }
                    }))}
                    rows={3}
                    className="mt-1 block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Customer feedback comments..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary">Expenses</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <input
                      type="number"
                      placeholder="Fuel"
                      value={workflowData.expenses.fuel}
                      onChange={(e) => setWorkflowData(prev => ({
                        ...prev,
                        expenses: { ...prev.expenses, fuel: parseFloat(e.target.value) || 0 }
                      }))}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Food"
                      value={workflowData.expenses.food}
                      onChange={(e) => setWorkflowData(prev => ({
                        ...prev,
                        expenses: { ...prev.expenses, food: parseFloat(e.target.value) || 0 }
                      }))}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Accommodation"
                      value={workflowData.expenses.accommodation}
                      onChange={(e) => setWorkflowData(prev => ({
                        ...prev,
                        expenses: { ...prev.expenses, accommodation: parseFloat(e.target.value) || 0 }
                      }))}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Other"
                      value={workflowData.expenses.other}
                      onChange={(e) => setWorkflowData(prev => ({
                        ...prev,
                        expenses: { ...prev.expenses, other: parseFloat(e.target.value) || 0 }
                      }))}
                      className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Site In-charge Signature</h2>
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-dark-primary mb-2">Digital Signature Required</h3>
                <p className="text-dark-secondary mb-6">
                  Please have the site in-charge sign this service report to confirm completion.
                </p>
                <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Signature pad will be displayed here</p>
                </div>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Capture Signature
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Complete Service</h2>
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium text-dark-primary mb-2">Service Summary</h3>
                <div className="space-y-2 text-sm text-black mb-6">
                  <p>Site: {selectedVisit?.siteName}</p>
                  <p>Projector: {selectedVisit?.projectorSerial}</p>
                  <p>Parts Used: {workflowData.partsUsed.length}</p>
                  <p>Photos Taken: {workflowData.photos.length}</p>
                  <p>Issues Found: {workflowData.issuesFound.length}</p>
                  <p>Total Cost: ${workflowData.partsUsed.reduce((sum, part) => sum + ((part.cost || 0) * (part.quantity || 0)), 0).toFixed(2)}</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center mx-auto"
                >
                  {loading ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Complete Service
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-primary">Unable to Complete Service</h2>
            <div className="bg-dark-card rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-orange-600" />
                <h3 className="text-lg font-medium text-dark-primary mb-2">Service Cannot Be Completed</h3>
                <p className="text-dark-secondary">
                  Please provide a detailed reason why this service cannot be completed.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Category *
                  </label>
                  <select
                    value={workflowData.unableToCompleteCategory}
                    onChange={(e) => setWorkflowData(prev => ({ 
                      ...prev, 
                      unableToCompleteCategory: e.target.value 
                    }))}
                    className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Missing Parts">Missing Parts</option>
                    <option value="Equipment Failure">Equipment Failure</option>
                    <option value="Access Issues">Access Issues</option>
                    <option value="Customer Request">Customer Request</option>
                    <option value="Safety Concerns">Safety Concerns</option>
                    <option value="Technical Complexity">Technical Complexity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Reason for Unable to Complete *
                  </label>
                  <textarea
                    value={workflowData.unableToCompleteReason}
                    onChange={(e) => setWorkflowData(prev => ({ 
                      ...prev, 
                      unableToCompleteReason: e.target.value 
                    }))}
                    rows={6}
                    className="block w-full border-dark-color rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a detailed explanation of why the service cannot be completed..."
                    required
                    maxLength={1000}
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    {workflowData.unableToCompleteReason.length}/1000 characters
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium">Important:</p>
                      <p>Once marked as "Unable to Complete", this service visit will be closed and may require rescheduling or alternative arrangements.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleUnableToComplete}
                  disabled={loading || !workflowData.unableToCompleteReason.trim()}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark as Unable to Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-gray-300 text-dark-secondary rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealFSEWorkflow;
