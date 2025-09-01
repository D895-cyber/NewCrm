import React, { useState, useEffect } from 'react';
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
  Activity,
  Building,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  Hash,
  Package,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { exportServiceReportToPDF } from '../utils/export';
import { apiClient } from '../utils/api/client';
import { EnvironmentalField, TechnicalField, ValidationSummary } from './ui/ValidationField';
import { validateEnvironmentalConditions, validateTechnicalParameters, ValidationError } from '../utils/validation/reportValidation';

// Service Report Data Interface
interface ServiceReportData {
  reportNumber: string;
  reportTitle: string;
  reportType: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyContact: {
    desk: string;
    mobile: string;
    email: string;
    website: string;
  };
  siteId: string;
  visitId: string;
  siteName: string;
  siteIncharge: {
    name: string;
    contact: string;
  };
  projectorSerial: string;
  projectorModel: string;
  brand: string;
  softwareVersion: string;
  projectorRunningHours: string;
  lampModel: string;
  lampRunningHours: string;
  currentLampHours: string;
  replacementRequired: boolean;
  engineer: {
    name: string;
    phone: string;
    email: string;
  };
  sections: {
    opticals: Array<{ description: string; status: string; result: string }>;
    electronics: Array<{ description: string; status: string; result: string }>;
    mechanical: Array<{ description: string; status: string; result: string }>;
    disposableConsumables: Array<{ description: string; status: string; result: string }>;
    coolant: Array<{ description: string; status: string; result: string }>;
    lightEngineTestPatterns: Array<{ description: string; status: string; result: string }>;
    serialNumberVerified: { description: string; status: string; result: string };
  };
  imageEvaluation: {
    focusBoresight: string;
    integratorPosition: string;
    spotOnScreen: string;
    screenCropping: string;
    convergenceChecked: string;
    channelsChecked: string;
    pixelDefects: string;
    imageVibration: string;
    liteLoc: string;
  };
  measuredColorCoordinates: Array<{ testPattern: string; fl: string; x: string; y: string }>;
  cieColorAccuracy: Array<{ testPattern: string; x: string; y: string; fl: string }>;
  screenAndVoltage: {
    screenType: string;
    screenSize: string;
    screenGain: string;
    voltage: string;
    frequency: string;
  };
  environmentAndSystem: {
    temperature: string;
    humidity: string;
    airQuality: string;
    systemStatus: string;
  };
  observations: Array<{ number: string; description: string }>;
  recommendedParts: Array<{ partName: string; partNumber: string; quantity: number; notes: string }>;
  photos: Array<{ url: string; description: string; category: string }>;
  notes: string;
}

// Deeply merge provided overrides into defaults to ensure nested structures always exist
function mergeWithDefaults<T>(defaults: T, overrides: any): T {
  if (overrides == null) return defaults;
  if (Array.isArray(defaults)) {
    // For arrays, only use overrides if they contain items; otherwise keep defaults
    if (Array.isArray(overrides) && overrides.length > 0) {
      return overrides as unknown as T;
    }
    return defaults as unknown as T;
  }
  if (typeof defaults === 'object') {
    const result: any = { ...(defaults as any) };
    for (const key of Object.keys(overrides)) {
      const overrideValue = overrides[key];
      const defaultValue = (defaults as any)[key];
      if (overrideValue === undefined) {
        continue;
      }
      if (
        defaultValue &&
        typeof defaultValue === 'object' &&
        !Array.isArray(defaultValue) &&
        overrideValue &&
        typeof overrideValue === 'object' &&
        !Array.isArray(overrideValue)
      ) {
        result[key] = mergeWithDefaults(defaultValue, overrideValue);
      } else {
        result[key] = overrideValue;
      }
    }
    return result as T;
  }
  return (overrides as T) ?? defaults;
}

interface ASCOMPServiceReportFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onClose?: () => void;
  readonly?: boolean;
}

export function ASCOMPServiceReportForm({ onSubmit, initialData, onClose, readonly = false }: ASCOMPServiceReportFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const defaultFormData = {
    // Report Header Information
    reportNumber: `ASCOMP-${Date.now()}`,
    reportTitle: 'Projector Service Report',
    reportType: 'First',
    date: new Date().toISOString().split('T')[0],
    
    // Company Information (Pre-filled as per ASCOMP)
    companyName: 'ASCOMP INC.',
    companyAddress: '9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064',
    companyContact: {
      desk: '011-45501226',
      mobile: '8882475207',
      email: 'helpdesk@ascompinc.in',
      website: 'WWW.ASCOMPINC.IN'
    },
    
    // Site Information
    siteName: 'Default Site',
    siteIncharge: {
      name: 'Default In-charge',
      contact: 'Default Contact'
    },
    
    // Projector Information
    projectorModel: 'Default Model',
    projectorSerial: 'Default Serial',
    brand: 'Default Brand',
    softwareVersion: '',
    projectorRunningHours: '',
    
    // Lamp Information
    lampModel: '',
    lampRunningHours: '',
    currentLampHours: '',
    replacementRequired: false,
    
    // Engineer Information
    engineer: {
      name: '',
      phone: '',
      email: ''
    },
    
    // Service Checklist Sections - EXACTLY as per ASCOMP format
    sections: {
      // OPTICALS Section
      opticals: [
        { description: 'Reflector', status: '-', result: 'OK' },
        { description: 'UV filter', status: '-', result: 'OK' },
        { description: 'Integrator Rod', status: '-', result: 'OK' },
        { description: 'Cold Mirror', status: '-', result: 'OK' },
        { description: 'Fold Mirror', status: '-', result: 'OK' }
      ],
      
      // ELECTRONICS Section
      electronics: [
        { description: 'Touch Panel', status: '-', result: 'OK' },
        { description: 'EVB Board', status: '-', result: 'OK' },
        { description: 'IMCB Board/s', status: '-', result: 'OK' },
        { description: 'PIB Board', status: '-', result: 'OK' },
        { description: 'ICP Board', status: '-', result: 'OK' },
        { description: 'IMB/S Board', status: '-', result: 'OK' }
      ],
      
      // Serial Number Verification
      serialNumberVerified: {
        description: 'Chassis label vs Touch Panel',
        status: '-',
        result: 'OK'
      },
      
      // Disposable Consumables
      disposableConsumables: [
        { description: 'Air Intake, LAD and RAD', status: 'Replaced', result: 'OK' }
      ],
      
      // Coolant
      coolant: {
        description: 'Level and Color',
        status: '-',
        result: 'OK'
      },
      
      // Light Engine Test Patterns
      lightEngineTestPatterns: [
        { color: 'White', status: '-', result: 'OK' },
        { color: 'Red', status: '-', result: 'OK' },
        { color: 'Green', status: '-', result: 'OK' },
        { color: 'Blue', status: '-', result: 'OK' },
        { color: 'Black', status: '-', result: 'OK' }
      ],
      
      // MECHANICAL Section
      mechanical: [
        { description: 'AC blower and Vane Switch', status: '-', result: 'OK' },
        { description: 'Extractor Vane Switch', status: '-', result: 'OK' },
        { description: 'Exhaust CFM', status: '7.5 M/S', result: 'OK' },
        { description: 'Light Engine 4 fans with LAD fan', status: '-', result: 'OK' },
        { description: 'Card Cage Top and Bottom fans', status: '-', result: 'OK' },
        { description: 'Radiator fan and Pump', status: '-', result: 'OK' },
        { description: 'Connector and hose for the Pump', status: '-', result: 'OK' },
        { description: 'Security and lamp house lock switch', status: '-', result: 'OK' },
        { description: 'Lamp LOC Mechanism X, Y and Z movement', status: '-', result: 'OK' }
      ]
    },
    
    // Image Evaluation - EXACTLY as per ASCOMP format
    imageEvaluation: {
      focusBoresight: 'Yes',
      integratorPosition: 'Yes',
      spotOnScreen: 'No',
      screenCropping: 'Yes',
      convergenceChecked: 'Yes',
      channelsChecked: 'Yes',
      pixelDefects: 'No',
      imageVibration: 'No',
      liteLoc: 'No'
    },
    
    // Recommended Parts
    recommendedParts: [],
    
    // Measured Color Coordinates (MCGD)
    measuredColorCoordinates: [
      { testPattern: 'White 2K', fl: '', x: '', y: '' },
      { testPattern: 'White 4K', fl: '', x: '', y: '' },
      { testPattern: 'Red 2K', fl: '', x: '', y: '' },
      { testPattern: 'Red 4K', fl: '', x: '', y: '' },
      { testPattern: 'Green 2K', fl: '', x: '', y: '' },
      { testPattern: 'Green 4K', fl: '', x: '', y: '' },
      { testPattern: 'Blue 2K', fl: '', x: '', y: '' },
      { testPattern: 'Blue 4K', fl: '', x: '', y: '' }
    ],
    
    // CIE XYZ Color Accuracy
    cieColorAccuracy: [
      { testPattern: 'BW Step-10 2K', fl: '', x: '', y: '' },
      { testPattern: 'BW Step-10 4K', fl: '', x: '', y: '' }
    ],
    
    // Screen Information
    screenInfo: {
      scope: { height: '', width: '', gain: '' },
      flat: { height: '', width: '', gain: '' },
      screenMake: '',
      throwDistance: ''
    },
    
    // Voltage Parameters
    voltageParameters: {
      pVsN: '',
      pVsE: '',
      nVsE: ''
    },
    
    // Content Playing Server
    contentPlayingServer: '',
    
    // Lamp Power Measurements
    lampPowerMeasurements: {
      flBeforePM: '',
      flAfterPM: ''
    },
    
    // Environment Status
    environmentStatus: {
      projectorPlacement: 'ok',
      room: 'ok',
      environment: 'ok'
    },
    
    // Observations and Remarks
    observations: [
      { number: 1, description: '' },
      { number: 2, description: '' },
      { number: 3, description: '' },
      { number: 4, description: '' },
      { number: 5, description: '' },
      { number: 6, description: '' }
    ],
    
    // Air Pollution Level
    airPollutionLevel: {
      hcho: '',
      tvoc: '',
      pm1: '',
      pm25: '',
      pm10: '',
      overall: ''
    },
    
    // Environmental Conditions
    environmentalConditions: {
      temperature: '',
      humidity: ''
    },
    
    // System Status
    systemStatus: {
      leStatus: '',
      acStatus: ''
    },
    
    // Photos
    photos: [],
    
    // Notes
    notes: ''
  };
  const [formData, setFormData] = useState(() => mergeWithDefaults(defaultFormData, initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [availableSpareParts, setAvailableSpareParts] = useState<any[]>([]);
  const [loadingSpareParts, setLoadingSpareParts] = useState(false);

  const totalSteps = 12;

  // Load available spare parts when component mounts
  useEffect(() => {
    loadAvailableSpareParts();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] || {}),
          [child]: value
        }
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const loadAvailableSpareParts = async () => {
    try {
      setLoadingSpareParts(true);
      const parts = await apiClient.getAllSpareParts();
      // Filter out RMA items and only show spare parts for reference
      const spareParts = parts.filter((part: any) => part.category !== 'RMA');
      setAvailableSpareParts(spareParts);
    } catch (error) {
      console.error('Error loading spare parts:', error);
    } finally {
      setLoadingSpareParts(false);
    }
  };

  // Get spare parts filtered by projector model
  const getSparePartsForProjector = (projectorModel: string) => {
    if (!projectorModel) return availableSpareParts;
    return availableSpareParts.filter((part: any) => 
      part.projectorModel === projectorModel
    );
  };

  const handleAddSparePart = (selectedPart: any) => {
    const newParts = [...formData.recommendedParts, { 
      partName: selectedPart.partName, 
      partNumber: selectedPart.partNumber, 
      quantity: 1, 
      notes: '' 
    }];
    setFormData(prev => ({ ...prev, recommendedParts: newParts }));
  };

  const handleSectionItemChange = (section: string, index: number, field: string, value: string) => {
    const newSections: any = { ...((formData as any).sections) };
    if (Array.isArray(newSections[section])) {
      newSections[section][index] = { ...newSections[section][index], [field]: value };
    } else {
      newSections[section] = { ...newSections[section], [field]: value };
    }
    setFormData((prev: any) => ({
      ...prev,
      sections: newSections
    }));
  };

  const handleArrayItemChange = (field: string, index: number, subField: string, value: string) => {
    const sourceArray = [ ...(((formData as any)[field]) as any[]) ];
    const newArray = [...sourceArray];
    newArray[index] = { ...newArray[index], [subField]: value };
    setFormData((prev: any) => ({
      ...prev,
      [field]: newArray
    }));
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

  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      // Submit the report
      onSubmit(formData);
      
      // Set success state
      setIsSubmitted(true);
      setSubmittedReport(formData);
      setShowDownloadModal(true);
      
      // Show success toast
      (window as any).showToast?.({
        type: 'success',
        title: 'Report Submitted Successfully!',
        message: 'Your service report has been completed and saved.'
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      (window as any).showToast?.({
        type: 'error',
        title: 'Submission Failed',
        message: 'There was an error submitting your report. Please try again.'
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

  const getStepTitle = (step: number) => {
    const titles: { [key: number]: string } = {
      1: 'Report Header',
      2: 'Site & Projector Info',
      3: 'Opticals & Electronics',
      4: 'Mechanical & Consumables',
      5: 'Image Evaluation',
      6: 'Color Measurements',
      7: 'Screen & Voltage',
      8: 'Environment & System',
      9: 'Observations & Air Quality',
      10: 'Photos & Documentation',
      11: 'Review & Submit'
    };
    return titles[step] || `Step ${step}`;
  };

  const loadStandardChecklist = () => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        opticals: [
          { description: 'Reflector', status: '-', result: 'OK' },
          { description: 'UV filter', status: '-', result: 'OK' },
          { description: 'Integrator Rod', status: '-', result: 'OK' },
          { description: 'Cold Mirror', status: '-', result: 'OK' },
          { description: 'Fold Mirror', status: '-', result: 'OK' }
        ],
        electronics: [
          { description: 'Touch Panel', status: '-', result: 'OK' },
          { description: 'EVB Board', status: '-', result: 'OK' },
          { description: 'IMCB Board/s', status: '-', result: 'OK' },
          { description: 'PIB Board', status: '-', result: 'OK' },
          { description: 'ICP Board', status: '-', result: 'OK' },
          { description: 'IMB/S Board', status: '-', result: 'OK' }
        ],
        mechanical: [
          { description: 'AC blower and Vane Switch', status: '-', result: 'OK' },
          { description: 'Extractor Vane Switch', status: '-', result: 'OK' },
          { description: 'Exhaust CFM', status: '7.5 M/S', result: 'OK' },
          { description: 'Light Engine 4 fans with LAD fan', status: '-', result: 'OK' },
          { description: 'Card Cage Top and Bottom fans', status: '-', result: 'OK' },
          { description: 'Radiator fan and Pump', status: '-', result: 'OK' },
          { description: 'Connector and hose for the Pump', status: '-', result: 'OK' },
          { description: 'Security and lamp house lock switch', status: '-', result: 'OK' },
          { description: 'Lamp LOC Mechanism X, Y and Z movement', status: '-', result: 'OK' }
        ],
        disposableConsumables: [
          { description: 'Air Intake, LAD and RAD', status: 'Replaced', result: 'OK' }
        ],
        coolant: {
          description: 'Level and Color',
          status: '-',
          result: 'OK'
        },
        lightEngineTestPatterns: [
          { color: 'White', status: '-', result: 'OK' },
          { color: 'Red', status: '-', result: 'OK' },
          { color: 'Green', status: '-', result: 'OK' },
          { color: 'Blue', status: '-', result: 'OK' },
          { color: 'Black', status: '-', result: 'OK' }
        ],
        serialNumberVerified: {
          description: 'Chassis label vs Touch Panel',
          status: '-',
          result: 'OK'
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* CHRISTIE Logo */}
          <div className="flex justify-center mb-4">
            <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" className="w-48 h-14">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              
              {/* CHRISTIE Text */}
              <text x="100" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
                    font-style="italic" text-anchor="middle" fill="black" filter="url(#shadow)">
                CHRISTIE
              </text>
              
              {/* Stylized "I" with diagonal cuts */}
              <g transform="translate(155, 15)">
                {/* Upper part of "I" with diagonal cut */}
                <path d="M 0 0 L 8 0 L 6 8 L 2 8 Z" fill="black"/>
                {/* Lower part of "I" with diagonal cut */}
                <path d="M 0 20 L 8 20 L 6 12 L 2 12 Z" fill="black"/>
                {/* Middle gap */}
                <rect x="2" y="8" width="4" height="4" fill="white"/>
              </g>
              
              {/* Trademark symbol */}
              <circle cx="185" cy="8" r="6" fill="black"/>
              <text x="185" y="12" font-family="Arial, sans-serif" font-size="8" 
                    text-anchor="middle" fill="white" font-weight="bold">®</text>
            </svg>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ASCOMP Service Report</h1>
              <p className="text-gray-600">Professional Projector Service Report Form</p>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{getStepTitle(currentStep)}</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>
        </div>

        {/* Form Steps */}
        <div className="space-y-6">
          {/* Step 1: Report Header */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Header Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={formData.reportType} onValueChange={(value) => handleInputChange('reportType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First">First</SelectItem>
                        <SelectItem value="Second">Second</SelectItem>
                        <SelectItem value="Third">Third</SelectItem>
                        <SelectItem value="Fourth">Fourth</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Installation">Installation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="date">Report Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>

                {/* Company Information (Read-only) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Company:</span>
                      <p className="text-gray-900">{formData.companyName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Address:</span>
                      <p className="text-gray-900">{formData.companyAddress}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Desk:</span>
                      <p className="text-gray-900">{formData.companyContact?.desk || ''}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Mobile:</span>
                      <p className="text-gray-900">{formData.companyContact?.mobile || ''}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Site & Projector Info */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Site & Projector Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={formData.siteName}
                      onChange={(e) => handleInputChange('siteName', e.target.value)}
                      placeholder="e.g., PVR INOX Cinema City Mall Yamuna Nagar - Auditorium 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteInchargeName">Site In-charge Name</Label>
                    <Input
                      id="siteInchargeName"
                      value={formData.siteIncharge.name}
                      onChange={(e) => handleInputChange('siteIncharge.name', e.target.value)}
                      placeholder="e.g., Mr. Sanjeev Kumar"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="siteInchargeContact">Site In-charge Contact</Label>
                  <Input
                    id="siteInchargeContact"
                    value={formData.siteIncharge.contact}
                    onChange={(e) => handleInputChange('siteIncharge.contact', e.target.value)}
                    placeholder="e.g., 8398986112"
                  />
                </div>

                <Separator />

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
                    <Label htmlFor="projectorSerial">Serial Number</Label>
                    <Input
                      id="projectorSerial"
                      value={formData.projectorSerial}
                      onChange={(e) => handleInputChange('projectorSerial', e.target.value)}
                      placeholder="e.g., 265533001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="e.g., Christie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="softwareVersion">Software Version</Label>
                    <Input
                      id="softwareVersion"
                      value={formData.softwareVersion}
                      onChange={(e) => handleInputChange('softwareVersion', e.target.value)}
                      placeholder="e.g., 4.3.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectorRunningHours">Projector Running Hours</Label>
                    <Input
                      id="projectorRunningHours"
                      value={formData.projectorRunningHours}
                      onChange={(e) => handleInputChange('projectorRunningHours', e.target.value)}
                      placeholder="e.g., 71027"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lampModel">Lamp Model</Label>
                    <Input
                      id="lampModel"
                      value={formData.lampModel}
                      onChange={(e) => handleInputChange('lampModel', e.target.value)}
                      placeholder="e.g., OSRAM - 3KW DTS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lampRunningHours">Lamp Running Hours</Label>
                    <Input
                      id="lampRunningHours"
                      value={formData.lampRunningHours}
                      onChange={(e) => handleInputChange('lampRunningHours', e.target.value)}
                      placeholder="e.g., 57629"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentLampHours">Current Lamp Hours</Label>
                    <Input
                      id="currentLampHours"
                      value={formData.currentLampHours}
                      onChange={(e) => handleInputChange('currentLampHours', e.target.value)}
                      placeholder="e.g., 322"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="replacementRequired"
                    checked={formData.replacementRequired}
                    onCheckedChange={(checked) => handleInputChange('replacementRequired', checked)}
                  />
                  <Label htmlFor="replacementRequired">Lamp Replacement Required</Label>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="engineerName">Engineer Name</Label>
                    <Input
                      id="engineerName"
                      value={formData.engineer.name}
                      onChange={(e) => handleInputChange('engineer.name', e.target.value)}
                      placeholder="e.g., Pramod Kumar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="engineerPhone">Engineer Phone</Label>
                    <Input
                      id="engineerPhone"
                      value={formData.engineer.phone}
                      onChange={(e) => handleInputChange('engineer.phone', e.target.value)}
                      placeholder="Engineer contact number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Opticals & Electronics */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Opticals & Electronics Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={loadStandardChecklist}>
                    Load standard checklist items
                  </Button>
                </div>
                {/* OPTICALS Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">OPTICALS Section</h3>
                  <div className="space-y-3">
                    {formData.sections.opticals.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            {item.description}
                          </Label>
                        </div>
                        <div>
                          <Input
                            value={item.status}
                            onChange={(e) => handleSectionItemChange('opticals', index, 'status', e.target.value)}
                            placeholder="Status"
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Select 
                            value={item.result} 
                            onValueChange={(value) => handleSectionItemChange('opticals', index, 'result', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not OK">Not OK</SelectItem>
                              <SelectItem value="Replaced">Replaced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* ELECTRONICS Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">ELECTRONICS Section</h3>
                  <div className="space-y-3">
                    {formData.sections.electronics.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            {item.description}
                          </Label>
                        </div>
                        <div>
                          <Input
                            value={item.status}
                            onChange={(e) => handleSectionItemChange('electronics', index, 'status', e.target.value)}
                            placeholder="Status"
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Select 
                            value={item.result} 
                            onValueChange={(value) => handleSectionItemChange('electronics', index, 'result', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not OK">Not OK</SelectItem>
                              <SelectItem value="Replaced">Replaced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Serial Number Verification */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Serial Number Verification</h3>
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        {formData.sections.serialNumberVerified.description}
                      </Label>
                    </div>
                    <div>
                      <Input
                        value={formData.sections.serialNumberVerified.status}
                        onChange={(e) => handleInputChange('sections.serialNumberVerified.status', e.target.value)}
                        placeholder="Status"
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Select 
                        value={formData.sections.serialNumberVerified.result} 
                        onValueChange={(value) => handleInputChange('sections.serialNumberVerified.result', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OK">OK</SelectItem>
                          <SelectItem value="Not OK">Not OK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue with more steps... */}
          {/* I'll add the remaining steps in the next part */}

          {/* Step 4: Mechanical & Consumables */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Mechanical & Consumables Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* MECHANICAL Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">MECHANICAL Section</h3>
                  <div className="space-y-3">
                    {formData.sections.mechanical.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            {item.description}
                          </Label>
                        </div>
                        <div>
                          <Input
                            value={item.status}
                            onChange={(e) => handleSectionItemChange('mechanical', index, 'status', e.target.value)}
                            placeholder="Status"
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Select 
                            value={item.result} 
                            onValueChange={(value) => handleSectionItemChange('mechanical', index, 'result', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not OK">Not OK</SelectItem>
                              <SelectItem value="Replaced">Replaced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Disposable Consumables */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Disposable Consumables</h3>
                  <div className="space-y-3">
                    {formData.sections.disposableConsumables.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            {item.description}
                          </Label>
                        </div>
                        <div>
                          <Input
                            value={item.status}
                            onChange={(e) => handleSectionItemChange('disposableConsumables', index, 'status', e.target.value)}
                            placeholder="Status"
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Select 
                            value={item.result} 
                            onValueChange={(value) => handleSectionItemChange('disposableConsumables', index, 'result', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not OK">Not OK</SelectItem>
                              <SelectItem value="Replaced">Replaced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Coolant */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Coolant</h3>
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        {formData.sections.coolant.description}
                      </Label>
                    </div>
                    <div>
                      <Input
                        value={formData.sections.coolant.status}
                        onChange={(e) => handleInputChange('sections.coolant.status', e.target.value)}
                        placeholder="Status"
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Select 
                        value={formData.sections.coolant.result} 
                        onValueChange={(value) => handleInputChange('sections.coolant.result', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OK">OK</SelectItem>
                          <SelectItem value="Not OK">Not OK</SelectItem>
                          <SelectItem value="Replaced">Replaced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Light Engine Test Patterns */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Light Engine Test Patterns</h3>
                  <div className="space-y-3">
                    {formData.sections.lightEngineTestPatterns.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            {item.color}
                          </Label>
                        </div>
                        <div>
                          <Input
                            value={item.status}
                            onChange={(e) => handleSectionItemChange('lightEngineTestPatterns', index, 'status', e.target.value)}
                            placeholder="Status"
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Select 
                            value={item.result} 
                            onValueChange={(value) => handleSectionItemChange('lightEngineTestPatterns', index, 'result', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not OK">Not OK</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Image Evaluation */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Image Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="focusBoresight">Focus/boresight</Label>
                      <Select 
                        value={formData.imageEvaluation.focusBoresight} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.focusBoresight', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="integratorPosition">Integrator Position</Label>
                      <Select 
                        value={formData.imageEvaluation.integratorPosition} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.integratorPosition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="spotOnScreen">Any Spot on the Screen after PPM</Label>
                      <Select 
                        value={formData.imageEvaluation.spotOnScreen} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.spotOnScreen', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="screenCropping">Check Screen Cropping - FLAT and SCOPE</Label>
                      <Select 
                        value={formData.imageEvaluation.screenCropping} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.screenCropping', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="convergenceChecked">Convergence Checked</Label>
                      <Select 
                        value={formData.imageEvaluation.convergenceChecked} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.convergenceChecked', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="channelsChecked">Channels Checked - Scope, Flat, Alternative</Label>
                      <Select 
                        value={formData.imageEvaluation.channelsChecked} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.channelsChecked', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="pixelDefects">Pixel defects</Label>
                      <Select 
                        value={formData.imageEvaluation.pixelDefects} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.pixelDefects', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="imageVibration">Excessive image vibration</Label>
                      <Select 
                        value={formData.imageEvaluation.imageVibration} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.imageVibration', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="liteLoc">LiteLOC</Label>
                      <Select 
                        value={formData.imageEvaluation.liteLoc} 
                        onValueChange={(value) => handleInputChange('imageEvaluation.liteLoc', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Color Measurements */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Measured Color Coordinates (MCGD) */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Measured Color Coordinates (MCGD)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">Test Pattern</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">fL</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">x</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">y</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.measuredColorCoordinates.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2 font-medium">{item.testPattern}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              <Input
                                value={item.fl}
                                onChange={(e) => handleArrayItemChange('measuredColorCoordinates', index, 'fl', e.target.value)}
                                placeholder="fL"
                                className="text-center border-0"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <Input
                                value={item.x}
                                onChange={(e) => handleArrayItemChange('measuredColorCoordinates', index, 'x', e.target.value)}
                                placeholder="x"
                                className="text-center border-0"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <Input
                                value={item.y}
                                onChange={(e) => handleArrayItemChange('measuredColorCoordinates', index, 'y', e.target.value)}
                                placeholder="y"
                                className="text-center border-0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                {/* CIE XYZ Color Accuracy */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">CIE XYZ Color Accuracy</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">Test Pattern</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">x</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">y</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">fL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.cieColorAccuracy.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2 font-medium">{item.testPattern}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              <Input
                                value={item.x}
                                onChange={(e) => handleArrayItemChange('cieColorAccuracy', index, 'x', e.target.value)}
                                placeholder="x"
                                className="text-center border-0"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <Input
                                value={item.y}
                                onChange={(e) => handleArrayItemChange('cieColorAccuracy', index, 'y', e.target.value)}
                                placeholder="y"
                                className="text-center border-0"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <Input
                                value={item.fl}
                                onChange={(e) => handleArrayItemChange('cieColorAccuracy', index, 'fl', e.target.value)}
                                placeholder="fL"
                                className="text-center border-0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Screen & Voltage */}
          {currentStep === 7 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Screen Information & Voltage Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Screen Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Screen Information in metres</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {/* SCOPE Screen */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">SCOPE</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="scopeHeight">Height</Label>
                          <Input
                            id="scopeHeight"
                            value={formData.screenInfo.scope.height}
                            onChange={(e) => handleInputChange('screenInfo.scope.height', e.target.value)}
                            placeholder="e.g., 5.53"
                          />
                        </div>
                        <div>
                          <Label htmlFor="scopeWidth">Width</Label>
                          <Input
                            id="scopeWidth"
                            value={formData.screenInfo.scope.width}
                            onChange={(e) => handleInputChange('screenInfo.scope.width', e.target.value)}
                            placeholder="e.g., 13.21"
                          />
                        </div>
                        <div>
                          <Label htmlFor="scopeGain">Gain</Label>
                          <Input
                            id="scopeGain"
                            value={formData.screenInfo.scope.gain}
                            onChange={(e) => handleInputChange('screenInfo.scope.gain', e.target.value)}
                            placeholder="Gain value"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FLAT Screen */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">FLAT</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="flatHeight">Height</Label>
                          <Input
                            id="flatHeight"
                            value={formData.screenInfo.flat.height}
                            onChange={(e) => handleInputChange('screenInfo.flat.height', e.target.value)}
                            placeholder="Height value"
                          />
                        </div>
                        <div>
                          <Label htmlFor="flatWidth">Width</Label>
                          <Input
                            id="flatWidth"
                            value={formData.screenInfo.flat.width}
                            onChange={(e) => handleInputChange('screenInfo.flat.width', e.target.value)}
                            placeholder="Width value"
                          />
                        </div>
                        <div>
                          <Label htmlFor="flatGain">Gain</Label>
                          <Input
                            id="flatGain"
                            value={formData.screenInfo.flat.gain}
                            onChange={(e) => handleInputChange('screenInfo.flat.gain', e.target.value)}
                            placeholder="Gain value"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="screenMake">Screen Make</Label>
                      <Input
                        id="screenMake"
                        value={formData.screenInfo.screenMake}
                        onChange={(e) => handleInputChange('screenInfo.screenMake', e.target.value)}
                        placeholder="Screen manufacturer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="throwDistance">Throw Distance</Label>
                      <Input
                        id="throwDistance"
                        value={formData.screenInfo.throwDistance}
                        onChange={(e) => handleInputChange('screenInfo.throwDistance', e.target.value)}
                        placeholder="e.g., 19.9"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Voltage Parameters */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Voltage Parameters</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="pVsN">P vs N</Label>
                      <Input
                        id="pVsN"
                        value={formData.voltageParameters.pVsN}
                        onChange={(e) => handleInputChange('voltageParameters.pVsN', e.target.value)}
                        placeholder="e.g., 228"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pVsE">P vs E</Label>
                      <Input
                        id="pVsE"
                        value={formData.voltageParameters.pVsE}
                        onChange={(e) => handleInputChange('voltageParameters.pVsE', e.target.value)}
                        placeholder="e.g., 230"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nVsE">N vs E</Label>
                      <Input
                        id="nVsE"
                        value={formData.voltageParameters.nVsE}
                        onChange={(e) => handleInputChange('voltageParameters.nVsE', e.target.value)}
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Content Playing Server */}
                <div>
                  <Label htmlFor="contentPlayingServer">Content Playing Server</Label>
                  <Input
                    id="contentPlayingServer"
                    value={formData.contentPlayingServer}
                    onChange={(e) => handleInputChange('contentPlayingServer', e.target.value)}
                    placeholder="e.g., Dolby IMS3000"
                  />
                </div>

                {/* Lamp Power Measurements */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Lamp Power Measurements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="flBeforePM">fL on 100% lamp power before PM</Label>
                      <Input
                        id="flBeforePM"
                        value={formData.lampPowerMeasurements.flBeforePM}
                        onChange={(e) => handleInputChange('lampPowerMeasurements.flBeforePM', e.target.value)}
                        placeholder="e.g., 10.3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="flAfterPM">fL on 100% lamp power after PM</Label>
                      <Input
                        id="flAfterPM"
                        value={formData.lampPowerMeasurements.flAfterPM}
                        onChange={(e) => handleInputChange('lampPowerMeasurements.flAfterPM', e.target.value)}
                        placeholder="e.g., 13.4"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 8: Environment & System */}
          {currentStep === 8 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Environment & System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Environment Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Environment Status</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="projectorPlacement">Projector placement</Label>
                      <Select 
                        value={formData.environmentStatus.projectorPlacement} 
                        onValueChange={(value) => handleInputChange('environmentStatus.projectorPlacement', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ok">OK</SelectItem>
                          <SelectItem value="not ok">Not OK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room">Room</Label>
                      <Select 
                        value={formData.environmentStatus.room} 
                        onValueChange={(value) => handleInputChange('environmentStatus.room', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ok">OK</SelectItem>
                          <SelectItem value="not ok">Not OK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="environment">Environment</Label>
                      <Select 
                        value={formData.environmentStatus.environment} 
                        onValueChange={(value) => handleInputChange('environmentStatus.environment', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ok">OK</SelectItem>
                          <SelectItem value="not ok">Not OK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">System Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leStatus">LE Status During PM</Label>
                      <Input
                        id="leStatus"
                        value={formData.systemStatus.leStatus}
                        onChange={(e) => handleInputChange('systemStatus.leStatus', e.target.value)}
                        placeholder="e.g., Removed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acStatus">AC Status</Label>
                      <Input
                        id="acStatus"
                        value={formData.systemStatus.acStatus}
                        onChange={(e) => handleInputChange('systemStatus.acStatus', e.target.value)}
                        placeholder="e.g., Working"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Environmental Conditions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Environmental Conditions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temperature">Temperature</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="temperature"
                          value={formData.environmentalConditions.temperature}
                          onChange={(e) => handleInputChange('environmentalConditions.temperature', e.target.value)}
                          placeholder="e.g., 25"
                        />
                        <span className="text-gray-500">°C</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="humidity">Humidity</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="humidity"
                          value={formData.environmentalConditions.humidity}
                          onChange={(e) => handleInputChange('environmentalConditions.humidity', e.target.value)}
                          placeholder="e.g., 32"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 9: Observations & Air Quality */}
          {currentStep === 9 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Observations & Air Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Observations and Remarks */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Observations and Remarks</h3>
                  <div className="space-y-3">
                    {formData.observations.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {item.number}
                        </div>
                        <div className="flex-1">
                          <Textarea
                            value={item.description}
                            onChange={(e) => {
                              const newObservations = [...formData.observations];
                              newObservations[index].description = e.target.value;
                              setFormData(prev => ({ ...prev, observations: newObservations }));
                            }}
                            placeholder="Enter observation details..."
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spare Parts Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Spare Parts Recommendations</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Select from available spare parts for {formData.projectorModel || 'the selected projector'}. These recommendations will be visible in the Service Recommendations panel and included in the PDF export
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => {
                        const selectedPart = availableSpareParts.find(p => p._id === value);
                        if (selectedPart) {
                          handleAddSparePart(selectedPart);
                        }
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select spare part" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingSpareParts ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading...
                            </SelectItem>
                          ) : getSparePartsForProjector(formData.projectorModel).length === 0 ? (
                            <SelectItem value="none" disabled>
                              {formData.projectorModel ? `No parts for ${formData.projectorModel}` : 'No spare parts available'}
                            </SelectItem>
                          ) : (
                            getSparePartsForProjector(formData.projectorModel).map((part) => (
                              <SelectItem key={part._id} value={part._id}>
                                {part.partName} ({part.partNumber})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newParts = [...formData.recommendedParts, { partName: '', partNumber: '', quantity: 1, notes: '' }];
                          setFormData(prev => ({ ...prev, recommendedParts: newParts }));
                        }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Custom
                      </Button>
                    </div>
                  </div>
                  
                  {formData.recommendedParts.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No spare parts recommended yet</p>
                      <p className="text-gray-400 text-xs">Click "Add Part" to add recommendations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.recommendedParts.map((part, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <Label htmlFor={`partName-${index}`}>Part Name *</Label>
                              <Input
                                id={`partName-${index}`}
                                value={part.partName}
                                onChange={(e) => {
                                  const newParts = [...formData.recommendedParts];
                                  newParts[index].partName = e.target.value;
                                  setFormData(prev => ({ ...prev, recommendedParts: newParts }));
                                }}
                                placeholder="e.g., Lamp Module, Filter, Lens"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`partNumber-${index}`}>Part Number</Label>
                              <Input
                                id={`partNumber-${index}`}
                                value={part.partNumber}
                                onChange={(e) => {
                                  const newParts = [...formData.recommendedParts];
                                  newParts[index].partNumber = e.target.value;
                                  setFormData(prev => ({ ...prev, recommendedParts: newParts }));
                                }}
                                placeholder="e.g., LMP-001, FLT-002"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                value={part.quantity || 1}
                                onChange={(e) => {
                                  const newParts = [...formData.recommendedParts];
                                  newParts[index].quantity = parseInt(e.target.value) || 1;
                                  setFormData(prev => ({ ...prev, recommendedParts: newParts }));
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`notes-${index}`}>Notes</Label>
                              <Input
                                id={`partNotes-${index}`}
                                value={part.notes || ''}
                                onChange={(e) => {
                                  const newParts = [...formData.recommendedParts];
                                  newParts[index].notes = e.target.value;
                                  setFormData(prev => ({ ...prev, recommendedParts: newParts }));
                                }}
                                placeholder="e.g., Urgent, Optional, Next service"
                                className="w-full"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newParts = formData.recommendedParts.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, recommendedParts: newParts }));
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Air Pollution Level */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Air Pollution Level</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hcho">HCHO</Label>
                      <Input
                        id="hcho"
                        value={formData.airPollutionLevel.hcho}
                        onChange={(e) => handleInputChange('airPollutionLevel.hcho', e.target.value)}
                        placeholder="e.g., 0.108"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tvoc">TVOC</Label>
                      <Input
                        id="tvoc"
                        value={formData.airPollutionLevel.tvoc}
                        onChange={(e) => handleInputChange('airPollutionLevel.tvoc', e.target.value)}
                        placeholder="e.g., 0.456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pm1">PM 1.0</Label>
                      <Input
                        id="pm1"
                        value={formData.airPollutionLevel.pm1}
                        onChange={(e) => handleInputChange('airPollutionLevel.pm1', e.target.value)}
                        placeholder="e.g., 9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pm25">PM 2.5</Label>
                      <Input
                        id="pm25"
                        value={formData.airPollutionLevel.pm25}
                        onChange={(e) => handleInputChange('airPollutionLevel.pm25', e.target.value)}
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pm10">PM 10</Label>
                      <Input
                        id="pm10"
                        value={formData.airPollutionLevel.pm10}
                        onChange={(e) => handleInputChange('airPollutionLevel.pm10', e.target.value)}
                        placeholder="e.g., 13"
                      />
                    </div>
                    <div>
                      <Label htmlFor="overall">Overall Air Pollution Level</Label>
                      <Input
                        id="overall"
                        value={formData.airPollutionLevel.overall}
                        onChange={(e) => handleInputChange('airPollutionLevel.overall', e.target.value)}
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 10: Photos & Documentation */}
          {currentStep === 10 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos & Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Photo Documentation</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm text-gray-600 mb-4">
                      <p className="font-medium">Upload Photos</p>
                      <p>Drag and drop photos here, or click to browse</p>
                    </div>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Note: The ODD file number is BEFORE and EVEN file number is AFTER, PM
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Review Photos Link */}
                <div>
                  <Label htmlFor="reviewPhotos">Review Photos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reviewPhotos"
                      value="Click Here"
                      readOnly
                      className="bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100"
                    />
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes or comments..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 11: Review & Submit */}
          {currentStep === 11 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Review & Submit Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Report Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Report Number:</span>
                      <p className="text-gray-900">{formData.reportNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Report Type:</span>
                      <p className="text-gray-900">{formData.reportType}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Site:</span>
                      <p className="text-gray-900">{formData.siteName || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Projector:</span>
                      <p className="text-gray-900">{formData.projectorModel} - {formData.projectorSerial}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Engineer:</span>
                      <p className="text-gray-900">{formData.engineer.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <p className="text-gray-900">{formData.date}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Checklist Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Checklist Summary</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Opticals</h4>
                      <div className="space-y-1 text-sm">
                        {formData.sections.opticals.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className={`h-4 w-4 ${item.result === 'OK' ? 'text-green-500' : 'text-red-500'}`} />
                            <span>{item.description}: {item.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Electronics</h4>
                      <div className="space-y-1 text-sm">
                        {formData.sections.electronics.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className={`h-4 w-4 ${item.result === 'OK' ? 'text-green-500' : 'text-red-500'}`} />
                            <span>{item.description}: {item.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Final Confirmation */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Ready to Submit</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Please review all information above. Once submitted, this report will be saved and cannot be edited.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 12: Final Submit */}
          {currentStep === 12 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Submit Service Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Ready for Submission</h3>
                  <p className="text-gray-600 mb-6">
                    Your ASCOMP Service Report has been completed and is ready to be submitted.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                      <Send className="h-4 w-4 mr-2" />
                      Submit Report
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep(11)}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Review Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
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

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Completed Successfully!</h3>
              <p className="text-gray-600 mb-6">
                Your ASCOMP Service Report has been submitted and saved. You can now download a PDF copy of the report.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleDownloadReport} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDownloadModal(false);
                    if (onClose) onClose();
                  }}
                >
                  Close
                </Button>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>• The report has been saved to the system</p>
                <p>• You can access it later from the reports section</p>
                <p>• The PDF includes all service details and photos</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
