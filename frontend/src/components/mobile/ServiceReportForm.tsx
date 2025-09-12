import React, { useState } from 'react';
import { 
  Camera, 
  Save, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Upload,
  Download,
  Printer,
  Share2,
  MapPin,
  Clock,
  Wrench,
  Monitor,
  Settings,
  Thermometer,
  Droplets,
  Wind,
  Lightbulb,
  Gauge,
  Palette,
  Ruler,
  FileText,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  Plus,
  Minus,
  X,
  Zap,
  Eye,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { EnvironmentalField, TechnicalField, ValidationSummary } from '../ui/ValidationField';
import { validateEnvironmentalConditions, validateTechnicalParameters, ValidationError } from '../../utils/validation/reportValidation';

interface ServiceReportFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function ServiceReportForm({ onSubmit, initialData }: ServiceReportFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [formData, setFormData] = useState(initialData || {
    // Basic Information
    reportNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    fseName: '',
    fseId: '',
    customerName: '',
    siteName: '',
    siteAddress: '',
    contactPerson: '',
    contactPhone: '',
    
    // Projector Details
    projectorModel: '',
    serialNumber: '',
    installationDate: '',
    warrantyStatus: '',
    lastServiceDate: '',
    softwareVersion: '',
    projectorRunningHours: '',
    lampModel: '',
    lampRunningHours: '',
    currentLampHours: '',
    replacementRequired: false,
    
    // Service Details
    serviceType: '',
    issueDescription: '',
    workPerformed: '',
    partsUsed: '',
    recommendations: '',
    
    // Technical Specifications
    brightness: '',
    contrast: '',
    resolution: '',
    colorTemperature: '',
    keystone: '',
    focus: '',
    
    // Environmental Conditions
    temperature: '',
    humidity: '',
    ventilation: '',
    lighting: '',
    dustLevel: '',
    
    // Image Quality Assessment
    imageSharpness: '',
    colorAccuracy: '',
    uniformity: '',
    noiseLevel: '',
    
    // Voltage Parameters
    voltagePN: '',
    voltagePE: '',
    voltageNE: '',
    
    // Content Server
    contentPlayingServer: '',
    
    // Brightness Measurements
    flBeforePM: '',
    flAfterPM: '',
    
    // Screen Information
    screenScopeHeight: '',
    screenScopeWidth: '',
    screenScopeGain: '',
    screenFlatHeight: '',
    screenFlatWidth: '',
    screenFlatGain: '',
    screenMake: '',
    throwDistance: '',
    
    // Air Quality Parameters
    airPollutionLevel: '',
    hcho: '',
    tvoc: '',
    pm1: '',
    pm25: '',
    pm10: '',
    
    // Light Engine Status
    leStatus: '',
    acStatus: '',
    
    // NEW: Advanced Technical Measurements
    advancedMeasurements: {
      colorGamut: '',
      gammaCorrection: '',
      colorSpace: '',
      refreshRate: '',
      responseTime: '',
      inputLag: '',
      powerConsumption: '',
      standbyPower: '',
      noiseLevel: '',
      vibrationLevel: ''
    },
    
    // NEW: Performance Metrics
    performanceMetrics: {
      uptimePercentage: '',
      meanTimeBetweenFailures: '',
      meanTimeToRepair: '',
      availabilityScore: '',
      reliabilityIndex: '',
      efficiencyRating: ''
    },
    
    // NEW: Quality Assurance
    qualityAssurance: {
      calibrationStatus: '',
      calibrationDate: '',
      nextCalibrationDue: '',
      qualityScore: '',
      complianceStatus: '',
      certificationLevel: '',
      testResults: '',
      passFailStatus: ''
    },
    
    // NEW: Safety & Compliance
    safetyCompliance: {
      safetyChecksCompleted: false,
      safetyIssuesFound: '',
      complianceStatus: '',
      riskAssessment: '',
      safetyRecommendations: '',
      emergencyProcedures: '',
      personalProtectiveEquipment: '',
      lockoutTagout: false
    },
    
    // NEW: Customer Communication
    customerCommunication: {
      customerSatisfaction: '',
      customerFeedback: '',
      communicationQuality: '',
      responseTime: '',
      followUpRequired: false,
      followUpDate: '',
      customerSignature: '',
      customerComments: ''
    },
    
    // NEW: Documentation & Photos
    documentation: {
      photosTaken: 0,
      photoCategories: [],
      videosRecorded: false,
      audioNotes: false,
      diagramsDrawn: false,
      measurementsDocumented: false,
      testResultsRecorded: false,
      customerDocuments: []
    },
    
    // NEW: Environmental Monitoring
    environmentalMonitoring: {
      roomTemperature: '',
      roomHumidity: '',
      airQuality: '',
      lightingConditions: '',
      noiseLevel: '',
      vibrationLevel: '',
      electromagneticInterference: '',
      powerQuality: '',
      groundingStatus: '',
      ventilationStatus: ''
    },
    
    // NEW: Maintenance History
    maintenanceHistory: {
      previousIssues: [],
      recurringProblems: '',
      maintenanceTrends: '',
      partsReplacementHistory: [],
      serviceInterval: '',
      nextServiceDue: '',
      warrantyClaims: '',
      upgradeHistory: []
    },
    
    // NEW: Cost Analysis
    costAnalysis: {
      laborCost: '',
      partsCost: '',
      travelCost: '',
      totalCost: '',
      costSavings: '',
      roiCalculation: '',
      budgetImpact: '',
      costJustification: ''
    },
    
    // NEW: Training & Knowledge Transfer
    trainingKnowledge: {
      customerTrainingProvided: false,
      trainingTopics: [],
      customerSkillLevel: '',
      documentationProvided: false,
      followUpTraining: false,
      knowledgeTransfer: '',
      customerQuestions: [],
      trainingEffectiveness: ''
    },
    
    // NEW: Future Recommendations
    futureRecommendations: {
      upgradeRecommendations: [],
      preventiveMeasures: [],
      optimizationSuggestions: [],
      technologyTrends: '',
      competitiveAnalysis: '',
      longTermPlanning: '',
      investmentPriorities: []
    },
    
    // Checklist Items - Updated for projector parts
    checklist: {
      // Optical Components
      reflector: true,
      uvFilter: false,
      integratorRod: false,
      coldMirror: false,
      foldMirror: false,
      
      // Electronic Components
      touchPanel: false,
      evbBoard: false,
      imcbBoard: false,
      pibBoard: false,
      icpBoard: false,
      imbBoard: false,
      
      // Serial Number Verification
      serialNumberVerified: false,
      
      // Disposable Consumables
      airIntakeLadRad: false,
      
      // Coolant
      coolantLevelColor: false,
      
      // Light Engine Test Patterns
      whitePattern: false,
      redPattern: false,
      greenPattern: false,
      bluePattern: false,
      blackPattern: false,
      
      // Mechanical Components
      acBlowerVaneSwitch: false,
      extractorVaneSwitch: false,
      exhaustCfm: '',
      lightEngineFans: false,
      cardCageFans: false,
      radiatorFanPump: false,
      connectorHosePump: false,
      securityLampHouseLock: false,
      lampLocMechanism: false,
      
      // Image Evaluation
      focusBoresight: false,
      integratorPosition: false,
      spotOnScreen: false,
      screenCropping: false,
      
      // NEW: Enhanced Checklist Items
      advancedChecklist: {
        // Power Systems
        powerSupply: false,
        voltageRegulation: false,
        grounding: false,
        surgeProtection: false,
        
        // Network & Connectivity
        networkConnection: false,
        wifiStatus: false,
        bluetoothStatus: false,
        remoteControl: false,
        
        // Audio Systems
        audioOutput: false,
        speakerStatus: false,
        audioQuality: false,
        volumeControl: false,
        
        // Security Features
        securityLock: false,
        accessControl: false,
        encryptionStatus: false,
        firmwareSecurity: false,
        
        // Environmental Controls
        temperatureControl: false,
        humidityControl: false,
        dustProtection: false,
        ventilationSystem: false
      }
    },
    
    // Photos
    photos: [],
    
    // Signature
    customerSignature: '',
    fseSignature: '',
    
    // Status
    status: 'pending',
    completionTime: '',
    customerSatisfaction: '',
    
    // Observations
    observations: '',
    
    // Recommended Parts
    recommendedParts: []
  });

  const totalSteps = 11;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Run validation for environmental and technical fields
    const newFormData = { ...formData, [field]: value };
    
    // Validate environmental conditions
    if (field === 'temperature' || field === 'humidity' || 
        field === 'hcho' || field === 'tvoc' || field === 'pm1' || 
        field === 'pm25' || field === 'pm10') {
      const environmentalValidation = validateEnvironmentalConditions(newFormData);
      const technicalValidation = validateTechnicalParameters(newFormData);
      
      setValidationErrors([
        ...environmentalValidation.errors,
        ...environmentalValidation.warnings,
        ...environmentalValidation.suggestions,
        ...technicalValidation.errors,
        ...technicalValidation.warnings,
        ...technicalValidation.suggestions
      ]);
    }
    
    // Validate technical parameters
    if (field === 'voltagePN' || field === 'voltagePE' || field === 'voltageNE' ||
        field === 'projectorRunningHours' || field === 'lampRunningHours') {
      const technicalValidation = validateTechnicalParameters(newFormData);
      const environmentalValidation = validateEnvironmentalConditions(newFormData);
      
      setValidationErrors([
        ...technicalValidation.errors,
        ...technicalValidation.warnings,
        ...technicalValidation.suggestions,
        ...environmentalValidation.errors,
        ...environmentalValidation.warnings,
        ...environmentalValidation.suggestions
      ]);
    }
  };

  const handleChecklistChange = (item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [item]: checked
      }
    }));
  };

  const handlePhotoCapture = () => {
    console.log('Photo capture triggered');
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        file,
        url: URL.createObjectURL(file),
        description: '',
        timestamp: new Date().toISOString()
      }));
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Report</h1>
              <p className="text-gray-600">Complete service documentation</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Form Steps */}
      <div className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportNumber">Report Number</Label>
                <Input
                  id="reportNumber"
                  value={formData.reportNumber}
                  onChange={(e) => handleInputChange('reportNumber', e.target.value)}
                  placeholder="Auto-generated"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Projector Details */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Projector Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectorModel">Projector Model</Label>
                <Input
                  id="projectorModel"
                  value={formData.projectorModel}
                  onChange={(e) => handleInputChange('projectorModel', e.target.value)}
                  placeholder="e.g., CP2220"
                />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Projector serial number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Service Details */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                    <SelectItem value="corrective">Corrective Maintenance</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="issueDescription">Issue Description</Label>
                <Textarea
                  id="issueDescription"
                  value={formData.issueDescription}
                  onChange={(e) => handleInputChange('issueDescription', e.target.value)}
                  placeholder="Describe the issue or problem reported"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Technical Specifications */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <TechnicalField
                label="Brightness"
                value={formData.brightness}
                onChange={(value) => handleInputChange('brightness', value)}
                placeholder="e.g., 3000"
                validationErrors={validationErrors}
                unit="lumens"
              />
              <TechnicalField
                label="Contrast"
                value={formData.contrast}
                onChange={(value) => handleInputChange('contrast', value)}
                placeholder="e.g., 10000"
                validationErrors={validationErrors}
                unit=":1"
              />
            </div>
            
            {/* Voltage Parameters */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Voltage Parameters</h3>
              <div className="grid grid-cols-3 gap-4">
                <TechnicalField
                  label="Voltage P-N"
                  value={formData.voltagePN || ''}
                  onChange={(value) => handleInputChange('voltagePN', value)}
                  placeholder="e.g., 230"
                  validationErrors={validationErrors}
                  unit="V"
                />
                <TechnicalField
                  label="Voltage P-E"
                  value={formData.voltagePE || ''}
                  onChange={(value) => handleInputChange('voltagePE', value)}
                  placeholder="e.g., 230"
                  validationErrors={validationErrors}
                  unit="V"
                />
                <TechnicalField
                  label="Voltage N-E"
                  value={formData.voltageNE || ''}
                  onChange={(value) => handleInputChange('voltageNE', value)}
                  placeholder="e.g., 0"
                  validationErrors={validationErrors}
                  unit="V"
                />
              </div>
            </div>
            
            {/* Running Hours */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Running Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <TechnicalField
                  label="Projector Running Hours"
                  value={formData.projectorRunningHours}
                  onChange={(value) => handleInputChange('projectorRunningHours', value)}
                  placeholder="e.g., 5000"
                  validationErrors={validationErrors}
                  unit="hours"
                />
                <TechnicalField
                  label="Lamp Running Hours"
                  value={formData.lampRunningHours}
                  onChange={(value) => handleInputChange('lampRunningHours', value)}
                  placeholder="e.g., 2000"
                  validationErrors={validationErrors}
                  unit="hours"
                />
              </div>
            </div>
            
            {/* Validation Summary */}
            {validationErrors.length > 0 && (
              <div className="mt-6">
                <ValidationSummary validationErrors={validationErrors} />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Environmental Conditions */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Environmental Conditions</h2>
            <div className="grid grid-cols-2 gap-4">
              <EnvironmentalField
                label="Temperature"
                value={formData.temperature}
                onChange={(value) => handleInputChange('temperature', value)}
                placeholder="e.g., 22"
                validationErrors={validationErrors}
              />
              <EnvironmentalField
                label="Humidity"
                value={formData.humidity}
                onChange={(value) => handleInputChange('humidity', value)}
                placeholder="e.g., 45"
                validationErrors={validationErrors}
              />
            </div>
            
            {/* Air Quality Parameters */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Air Quality Parameters</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <TechnicalField
                  label="HCHO"
                  value={formData.hcho || ''}
                  onChange={(value) => handleInputChange('hcho', value)}
                  placeholder="e.g., 0.05"
                  validationErrors={validationErrors}
                  unit="mg/m³"
                />
                <TechnicalField
                  label="TVOC"
                  value={formData.tvoc || ''}
                  onChange={(value) => handleInputChange('tvoc', value)}
                  placeholder="e.g., 0.2"
                  validationErrors={validationErrors}
                  unit="mg/m³"
                />
                <TechnicalField
                  label="PM1"
                  value={formData.pm1 || ''}
                  onChange={(value) => handleInputChange('pm1', value)}
                  placeholder="e.g., 15"
                  validationErrors={validationErrors}
                  unit="μg/m³"
                />
                <TechnicalField
                  label="PM2.5"
                  value={formData.pm25 || ''}
                  onChange={(value) => handleInputChange('pm25', value)}
                  placeholder="e.g., 25"
                  validationErrors={validationErrors}
                  unit="μg/m³"
                />
                <TechnicalField
                  label="PM10"
                  value={formData.pm10 || ''}
                  onChange={(value) => handleInputChange('pm10', value)}
                  placeholder="e.g., 50"
                  validationErrors={validationErrors}
                  unit="μg/m³"
                />
              </div>
            </div>
            
            {/* Validation Summary */}
            {validationErrors.length > 0 && (
              <div className="mt-6">
                <ValidationSummary validationErrors={validationErrors} />
              </div>
            )}
          </div>
        )}

        {/* Step 6: Projector Parts Evaluation */}
        {currentStep === 6 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Projector Parts Evaluation</h2>
            
            {/* OPTICALS Section */}
            <div className="space-y-3 mb-6">
              <h3 className="font-medium text-gray-900 border-b pb-2">OPTICALS</h3>
              <div className="grid grid-cols-2 gap-4">
                {['reflector', 'uvFilter', 'integratorRod', 'coldMirror', 'foldMirror'].map((item) => (
                  <div key={item} className="space-y-2">
                    <Label htmlFor={item} className="text-sm font-medium text-gray-700 capitalize">
                      {item.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Select 
                      value={formData.checklist[item] ? 'ok' : 'not_ok'} 
                      onValueChange={(value) => {
                        const newChecklist = { ...formData.checklist };
                        newChecklist[item] = value === 'ok';
                        handleInputChange('checklist', newChecklist);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">OK</SelectItem>
                        <SelectItem value="not_ok">Not OK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* ELECTRONICS Section */}
            <div className="space-y-3 mb-6">
              <h3 className="font-medium text-gray-900 border-b pb-2">ELECTRONICS</h3>
              <div className="grid grid-cols-2 gap-4">
                {['touchPanel', 'evbBoard', 'imcbBoard', 'pibBoard', 'icpBoard', 'imbBoard'].map((item) => (
                  <div key={item} className="space-y-2">
                    <Label htmlFor={item} className="text-sm font-medium text-gray-700 capitalize">
                      {item.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Select 
                      value={formData.checklist[item] ? 'ok' : 'not_ok'} 
                      onValueChange={(value) => {
                        const newChecklist = { ...formData.checklist };
                        newChecklist[item] = value === 'ok';
                        handleInputChange('checklist', newChecklist);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">OK</SelectItem>
                        <SelectItem value="not_ok">Not OK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* MECHANICAL Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 border-b pb-2">MECHANICAL</h3>
              <div className="grid grid-cols-2 gap-4">
                {['acBlowerVaneSwitch', 'extractorVaneSwitch', 'lightEngineFans', 'cardCageFans', 'radiatorFanPump', 'connectorHosePump', 'securityLampHouseLock', 'lampLocMechanism'].map((item) => (
                  <div key={item} className="space-y-2">
                    <Label htmlFor={item} className="text-sm font-medium text-gray-700 capitalize">
                      {item.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Select 
                      value={formData.checklist[item] ? 'ok' : 'not_ok'} 
                      onValueChange={(value) => {
                        const newChecklist = { ...formData.checklist };
                        newChecklist[item] = value === 'ok';
                        handleInputChange('checklist', newChecklist);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">OK</SelectItem>
                        <SelectItem value="not_ok">Not OK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Image Evaluation */}
        {currentStep === 7 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Image Evaluation</h2>
            <div className="grid grid-cols-2 gap-4">
              {['focusBoresight', 'integratorPosition', 'screenCropping', 'convergenceChecked', 'channelsChecked', 'pixelDefects', 'imageVibration', 'liteLoc'].map((item) => (
                <div key={item} className="space-y-2">
                  <Label htmlFor={item} className="text-sm font-medium text-gray-700 capitalize">
                    {item.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Select 
                    value={formData.checklist[item] ? 'yes' : 'no'} 
                    onValueChange={(value) => {
                      const newChecklist = { ...formData.checklist };
                      newChecklist[item] = value === 'yes';
                      handleInputChange('checklist', newChecklist);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: System Parameters */}
        {currentStep === 8 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Parameters</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="voltagePN">P vs N (V)</Label>
                <Input
                  id="voltagePN"
                  type="number"
                  value={formData.voltagePN}
                  onChange={(e) => handleInputChange('voltagePN', e.target.value)}
                  placeholder="e.g., 228"
                />
              </div>
              <div>
                <Label htmlFor="voltagePE">P vs E (V)</Label>
                <Input
                  id="voltagePE"
                  type="number"
                  value={formData.voltagePE}
                  onChange={(e) => handleInputChange('voltagePE', e.target.value)}
                  placeholder="e.g., 230"
                />
              </div>
              <div>
                <Label htmlFor="voltageNE">N vs E (V)</Label>
                <Input
                  id="voltageNE"
                  type="number"
                  value={formData.voltageNE}
                  onChange={(e) => handleInputChange('voltageNE', e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Screen Information */}
        {currentStep === 9 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Screen Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="screenScopeHeight">SCOPE Height (m)</Label>
                <Input
                  id="screenScopeHeight"
                  type="number"
                  step="0.01"
                  value={formData.screenScopeHeight}
                  onChange={(e) => handleInputChange('screenScopeHeight', e.target.value)}
                  placeholder="e.g., 5.53"
                />
              </div>
              <div>
                <Label htmlFor="screenScopeWidth">SCOPE Width (m)</Label>
                <Input
                  id="screenScopeWidth"
                  type="number"
                  step="0.01"
                  value={formData.screenScopeWidth}
                  onChange={(e) => handleInputChange('screenScopeWidth', e.target.value)}
                  placeholder="e.g., 13.21"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 10: Photos & Documentation */}
        {currentStep === 10 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Photos & Documentation</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button onClick={handlePhotoCapture} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>
            
            {formData.photos.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Captured Photos ({formData.photos.length})</h3>
                <div className="grid grid-cols-2 gap-4">
                  {formData.photos.map((photo: any) => (
                    <div key={photo.id} className="border rounded-lg p-3 space-y-2">
                      <img
                        src={photo.url}
                        alt="Service photo"
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Input
                        placeholder="Photo description"
                        value={photo.description}
                        onChange={(e) => {
                          const updatedPhotos = formData.photos.map((p: any) =>
                            p.id === photo.id ? { ...p, description: e.target.value } : p
                          );
                          handleInputChange('photos', updatedPhotos);
                        }}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 11: Review & Submit */}
        {currentStep === 11 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Report Number:</span>
                  <p className="text-gray-900">{formData.reportNumber || 'Auto-generated'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Date:</span>
                  <p className="text-gray-900">{formData.date}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Projector Model:</span>
                  <p className="text-gray-900">{formData.projectorModel}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Service Type:</span>
                  <p className="text-gray-900 capitalize">{formData.serviceType}</p>
                </div>
              </div>
              
              <Button onClick={handleSubmit} className="w-full" size="lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Service Report
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex-1 mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={nextStep} className="flex-1 ml-2">
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 ml-2">
              Submit Report
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
