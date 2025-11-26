import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Download,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Package,
  X,
  Loader2,
  Activity,
  Truck,
  AlertCircle,
  Calendar
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV, generateLabel, printLabel } from "../../utils/export";
import { useData } from "../../contexts/DataContext";
import { ImportOptions } from "../ImportOptions";
import RMAImport from "../RMAImport";
import { AdvancedRMASearch } from "../AdvancedRMASearch";
import { AssignDTRToTechnicalHeadDialog } from "../dialogs/AssignDTRToTechnicalHeadDialog";
import { useAuth } from "../../contexts/AuthContext";
import { RMAOverdueAnalysis } from "../analytics/RMAOverdueAnalysis";
import { SimpleRMAAnalytics } from "../analytics/SimpleRMAAnalytics";
import { DiagnosticComponent } from "../DiagnosticComponent";



export function RMAPage() {
  const { rma: rmaItems, refreshRMA, refreshData, isLoading: dataLoading } = useData();
  const { user } = useAuth();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [localRMAItems, setLocalRMAItems] = useState<any[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  
  // Map backend data to frontend display format
  const mapBackendDataToFrontend = (backendRMA: any) => {
    // Debug logging for field mapping issues
    if (backendRMA.rmaNumber === '705313' || backendRMA.defectivePartNumber || backendRMA.defectivePartName) {
      console.log('🔍 DEBUG - RMA field mapping analysis:', {
        rmaNumber: backendRMA.rmaNumber,
        originalDefectivePartNumber: backendRMA.defectivePartNumber,
        originalDefectivePartName: backendRMA.defectivePartName,
        originalReplacedPartName: backendRMA.replacedPartName,
        symptoms: backendRMA.symptoms
      });
    }
    
    // Fix field mapping issues - swap defective part number and name if they appear to be swapped
    let correctedDefectivePartNumber = backendRMA.defectivePartNumber || 'N/A';
    let correctedDefectivePartName = backendRMA.defectivePartName || 'Projector Component';
    
    // Check if the fields appear to be swapped (number field contains descriptive text, name field contains numbers)
    const isNumberFieldDescriptive = correctedDefectivePartNumber && 
      (correctedDefectivePartNumber.toLowerCase().includes('kit') || 
       correctedDefectivePartNumber.toLowerCase().includes('harn') ||
       correctedDefectivePartNumber.toLowerCase().includes('temps') ||
       correctedDefectivePartNumber.toLowerCase().includes('assy') ||
       correctedDefectivePartNumber.toLowerCase().includes('assembly') ||
       correctedDefectivePartNumber.toLowerCase().includes('tpc') ||
       correctedDefectivePartNumber.toLowerCase().includes('light engine') ||
       correctedDefectivePartNumber.toLowerCase().includes('ballast') ||
       correctedDefectivePartNumber.length > 10);
    
    const isNameFieldNumeric = correctedDefectivePartName && 
      (/^\d{3}-\d{6}-\d{2}$/.test(correctedDefectivePartName) || // Pattern like "003-005682-01"
       /^\d{3}-\d{6}-\d{2}$/.test(correctedDefectivePartName) || // Pattern like "000-101329-03"
       /^\d{3}-\d{6}-\d{2}$/.test(correctedDefectivePartName)); // Pattern like "004-102075-02"
    
    // If fields appear swapped, swap them back
    if (isNumberFieldDescriptive && isNameFieldNumeric) {
      console.log('🔄 DEBUG - Swapping defective part fields:', {
        rmaNumber: backendRMA.rmaNumber,
        originalNumber: correctedDefectivePartNumber,
        originalName: correctedDefectivePartName,
        swappedNumber: correctedDefectivePartName,
        swappedName: correctedDefectivePartNumber
      });
      
      const temp = correctedDefectivePartNumber;
      correctedDefectivePartNumber = correctedDefectivePartName;
      correctedDefectivePartName = temp;
    }
    
    return {
      _id: backendRMA._id,
      rmaNumber: backendRMA.rmaNumber || 'N/A', 
      callLogNumber: backendRMA.callLogNumber || 'N/A',
      rmaOrderNumber: backendRMA.rmaOrderNumber || 'N/A',
      ascompRaisedDate: backendRMA.ascompRaisedDate ? new Date(backendRMA.ascompRaisedDate).toLocaleDateString() : 
                        backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
      ascompRaisedDateRaw: backendRMA.ascompRaisedDate || backendRMA.issueDate || backendRMA.createdAt, // Keep raw date for filtering
      customerErrorDate: backendRMA.customerErrorDate ? new Date(backendRMA.customerErrorDate).toLocaleDateString() : 
                         backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
      siteName: backendRMA.siteName || backendRMA.customerSite || 'N/A',
      productName: backendRMA.productName || backendRMA.projectorModel || 'N/A',
      productPartNumber: backendRMA.productPartNumber || backendRMA.partNumber || 'N/A',
      serialNumber: backendRMA.serialNumber || backendRMA.projectorSerial || 'N/A',
      defectivePartNumber: correctedDefectivePartNumber,
      defectivePartName: correctedDefectivePartName,
      defectiveSerialNumber: backendRMA.defectiveSerialNumber || backendRMA.projectorSerial || 'N/A',
      symptoms: backendRMA.symptoms || backendRMA.failureDescription || backendRMA.reason || 'N/A',
      replacedPartNumber: backendRMA.replacedPartNumber || 'N/A',
      replacedPartName: (() => {
        const replacedName = backendRMA.replacedPartName || 'N/A';
        const defectiveName = correctedDefectivePartName;
        
        // Check if replacement part name contains symptoms instead of part name
        const symptomPatterns = [
          'integrator rod chipped',
          'prism chipped', 
          'segmen prism',
          'connection lost',
          'power cycle',
          'marriage failure',
          'imb marriage',
          'imb marriage failure',
          'red dmd temperature sensor error',
          'temperature sensor error',
          'dmd error',
          'chipped',
          'marriage',
          'tpc touchpanel faulty',
          'tpc booting failure',
          'cyan horizontal lines',
          'cyan vertical lines',
          'green color missing',
          'horizontal lines',
          'vertical lines',
          'lines noticed',
          'booting failure',
          'touchpanel faulty',
          'faulty',
          'failure',
          'error',
          'missing',
          'noticed'
        ];
        
        // Check if it's a symptom description or a part number (should be part name)
        const isSymptomDescription = replacedName === 'N/A' || 
          symptomPatterns.some(pattern => replacedName.toLowerCase().includes(pattern.toLowerCase())) ||
          (replacedName.toLowerCase().includes('error') && replacedName.toLowerCase().includes('sensor')) ||
          (replacedName.toLowerCase().includes('chipped') && replacedName.toLowerCase().includes('rod')) ||
          (replacedName.toLowerCase().includes('marriage') && replacedName.toLowerCase().includes('failure'));
        
        // Also check if replacement part name is a part number (should be part name)
        const isReplacementPartNumber = replacedName && /^\d{3}-\d{6}-\d{2}$/.test(replacedName);
        
        if (isSymptomDescription || isReplacementPartNumber) {
          console.log('🔄 DEBUG - Replacing replacement part name with defective part name:', {
            rmaNumber: backendRMA.rmaNumber,
            originalReplacedName: replacedName,
            newReplacedName: defectiveName,
            reason: isSymptomDescription ? 'Symptom pattern detected' : 'Part number detected, should be part name'
          });
          return defectiveName;
        }
        
        return replacedName;
      })(),
      replacedPartSerialNumber: backendRMA.replacedPartSerialNumber || 'N/A',
      replacementNotes: backendRMA.replacementNotes || 'N/A',
      shippedDate: backendRMA.shippedDate ? new Date(backendRMA.shippedDate).toLocaleDateString() : 'N/A',
      trackingNumber: backendRMA.trackingNumber || 'N/A',
      shippedThru: backendRMA.shippedThru || 'N/A',
      // Include shipping data for proper tracking display
      shipping: backendRMA.shipping || null,
      remarks: backendRMA.remarks || backendRMA.notes || 'N/A',
      createdBy: backendRMA.createdBy || backendRMA.technician || 'System',
      caseStatus: backendRMA.caseStatus || backendRMA.status || 'Under Review',
      rmaReturnShippedDate: backendRMA.rmaReturnShippedDate ? new Date(backendRMA.rmaReturnShippedDate).toLocaleDateString() : 'N/A',
      rmaReturnTrackingNumber: backendRMA.rmaReturnTrackingNumber || 'N/A',
      rmaReturnShippedThru: backendRMA.rmaReturnShippedThru || 'N/A',
      daysCountShippedToSite: backendRMA.daysCountShippedToSite || 0,
      daysCountReturnToCDS: backendRMA.daysCountReturnToCDS || 0,
      priority: backendRMA.priority || 'Medium',
      warrantyStatus: backendRMA.warrantyStatus || 'In Warranty',
      estimatedCost: backendRMA.estimatedCost || 0,
      notes: backendRMA.notes || 'N/A',
      brand: backendRMA.brand || 'N/A',
      projectorModel: backendRMA.projectorModel || 'N/A',
      customerSite: backendRMA.customerSite || 'N/A',
      technician: backendRMA.technician || 'N/A',
      physicalCondition: backendRMA.physicalCondition || 'Good',
      logicalCondition: backendRMA.logicalCondition || 'Good',
      issueDescription: backendRMA.issueDescription || backendRMA.failureDescription || backendRMA.reason || 'N/A',
      rmaReason: backendRMA.rmaReason || backendRMA.reason || 'N/A',
      approvalStatus: backendRMA.approvalStatus || 'Pending Review',
      assignedTo: backendRMA.assignedTo || backendRMA.technician || 'N/A'
    };
  };

  // Update local RMA items when data changes
  useEffect(() => {
    if (rmaItems && rmaItems.length > 0) {
      const mappedData = rmaItems.map(mapBackendDataToFrontend);
      setLocalRMAItems(mappedData);
      setHasLoadedData(true);
      console.log('Mapped RMA data:', mappedData);
      
      // Debug: Check for specific RMA with integrator rod issue
      const integratorRodRMAs = mappedData.filter(rma => 
        (rma.replacedPartName || '').toLowerCase().includes('integrator rod')
      );
      if (integratorRodRMAs.length > 0) {
        console.log('🔍 Found RMAs with integrator rod:', integratorRodRMAs);
      }
      
      // Debug: Check for RMA 705313 specifically
      const rma705313 = mappedData.find(rma => rma.rmaNumber === '705313');
      if (rma705313) {
        console.log('🔍 DEBUG - RMA 705313 details:', {
          rmaNumber: rma705313.rmaNumber,
          defectivePartName: rma705313.defectivePartName,
          replacedPartName: rma705313.replacedPartName,
          symptoms: rma705313.symptoms
        });
      }
    } else {
      setLocalRMAItems([]);
      setHasLoadedData(false);
    }
  }, [rmaItems]);

  // Load technical heads when component mounts
  useEffect(() => {
    loadTechnicalHeads();
    loadReadyForRMADTRs();
  }, []);

  // Load data when component mounts
  useEffect(() => {
    if (!hasLoadedData) {
      console.log('Loading RMA data on component mount');
      refreshRMA();
    }
  }, [hasLoadedData, refreshRMA]);
  
  // Debug: Log component render
  console.log('RMAPage rendered with', rmaItems?.length || 0, 'items');
  console.log('Local RMA items:', localRMAItems?.length || 0, 'items');
  
  // Force re-render when RMA data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [rmaItems]);
  
  // Debug: Log RMA data structure
  useEffect(() => {
    console.log('RMA Items length:', rmaItems?.length || 0);
    if (rmaItems && rmaItems.length > 0) {
      console.log('RMA Items from DataContext:', rmaItems[0]);
      console.log('First RMA _id:', rmaItems[0]._id);
      console.log('All RMA _ids:', rmaItems.map(r => r._id));
      console.log('All RMA statuses:', rmaItems.map(r => ({ rmaNumber: r.rmaNumber, status: r.status, caseStatus: r.caseStatus })));
    }
  }, [rmaItems]);
  
  const [selectedRMA, setSelectedRMA] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportComponent, setShowImportComponent] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [editingRMA, setEditingRMA] = useState<any>(null);
  const [showAssignDTRDialog, setShowAssignDTRDialog] = useState(false);
  const [selectedDTRForAssignment, setSelectedDTRForAssignment] = useState<any>(null);
  const [readyForRMADTRs, setReadyForRMADTRs] = useState<any[]>([]);
  const [isLoadingReadyDTRs, setIsLoadingReadyDTRs] = useState(false);
  const [technicalHeads, setTechnicalHeads] = useState<any[]>([]);
  const [isLoadingTechnicalHeads, setIsLoadingTechnicalHeads] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSerialNumberSelector, setShowSerialNumberSelector] = useState(false);
  const [serialNumberSearch, setSerialNumberSearch] = useState("");
  const [availableProjectors, setAvailableProjectors] = useState<any[]>([]);
  
  // Updated newRMA state to match your requirements
  const [newRMA, setNewRMA] = useState({
    rmaNumber: "",
    callLogNumber: "",
    rmaOrderNumber: "",
    sxNumber: "",
    ascompRaisedDate: "",
    customerErrorDate: "",
    siteName: "",
    productName: "",
    productPartNumber: "",
    serialNumber: "",
    defectivePartNumber: "",
    defectivePartName: "",
    defectiveSerialNumber: "",
    symptoms: "",
    replacedPartNumber: "",
    replacedPartName: "",
    replacedPartSerialNumber: "",
    replacementNotes: "",
    shippedDate: "",
    trackingNumber: "",
    shippedThru: "",
    remarks: "",
    createdBy: "",
    caseStatus: "Under Review",
    rmaReturnShippedDate: "",
    rmaReturnTrackingNumber: "",
    rmaReturnShippedThru: "",
    daysCountShippedToSite: 0,
    daysCountReturnToCDS: 0,
    priority: "Medium",
    warrantyStatus: "In Warranty",
    estimatedCost: 0,
    notes: "",
    brand: "",
    projectorModel: "",
    customerSite: "",
    technician: "",
    physicalCondition: "Good",
    logicalCondition: "Good",
    issueDescription: "",
    rmaReason: ""
  });

  // Load available projectors for serial number selection
  useEffect(() => {
    loadAvailableProjectors();
  }, []);

  const loadAvailableProjectors = async () => {
    try {
      const projectors = await apiClient.getAllProjectors();
      setAvailableProjectors(projectors);
    } catch (err: any) {
      console.error('Error loading projectors:', err);
      setError('Failed to load projector data.');
    }
  };

  const handleSerialNumberSelect = (selectedProjector: any) => {
    // Map projector warranty status to RMA warranty status
    const mapWarrantyStatus = (projectorStatus: string) => {
      switch (projectorStatus) {
        case 'Active':
          return 'In Warranty';
        case 'Expired':
          return 'Expired';
        case 'Expiring Soon':
          return 'Extended Warranty';
        default:
          return 'In Warranty';
      }
    };

    setNewRMA({
      ...newRMA,
      serialNumber: selectedProjector.serialNumber,
      productName: selectedProjector.model,
      siteName: selectedProjector.site,
      createdBy: selectedProjector.technician || 'System'
    });
    setShowSerialNumberSelector(false);
    setSerialNumberSearch("");
  };

  // Only show these specific statuses - filtered by date if date filter is active
  const availableStatuses = React.useMemo(() => {
    const allowedStatuses = [
      'Completed',
      'Faulty Transit to CDS', 
      'RMA Raised Yet to Deliver',
      'Open',
      'Under Review'
    ];
    
    // First filter by date if date filter is active
    let rmasToCount = localRMAItems || [];
    if (filterStartDate || filterEndDate) {
      console.log('🔍 Date Filter Active:', { filterStartDate, filterEndDate });
      rmasToCount = rmasToCount.filter(rma => {
        // Use raw date field for accurate filtering
        const rawDate = rma.ascompRaisedDateRaw || rma.ascompRaisedDate || rma.raisedDate || rma.createdAt;
        if (!rawDate || rawDate === 'N/A') return false;
        
        const rmaDate = new Date(rawDate);
        if (isNaN(rmaDate.getTime())) {
          console.warn('⚠️ Invalid date for RMA:', rma.rmaNumber, rawDate);
          return false; // Invalid date
        }
        
        if (filterStartDate && filterEndDate) {
          const start = new Date(filterStartDate);
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          return rmaDate >= start && rmaDate <= end;
        } else if (filterStartDate) {
          const start = new Date(filterStartDate);
          return rmaDate >= start;
        } else if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          return rmaDate <= end;
        }
        return true;
      });
      
      console.log('📊 Filtered RMAs count:', rmasToCount.length);
      if (rmasToCount.length > 0) {
        console.log('📅 Sample dates:', rmasToCount.slice(0, 5).map(rma => ({
          rmaNumber: rma.rmaNumber,
          rawDate: rma.ascompRaisedDateRaw,
          displayDate: rma.ascompRaisedDate,
          year: new Date(rma.ascompRaisedDateRaw).getFullYear()
        })));
      }
    }
    
    const statusCounts = rmasToCount.reduce((acc, rma) => {
      const status = rma.caseStatus || 'Unknown';
      if (allowedStatuses.includes(status)) {
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return allowedStatuses
      .filter(status => statusCounts[status] > 0)
      .map(status => ({ status, count: statusCounts[status] }))
      .sort((a, b) => b.count - a.count);
  }, [localRMAItems, filterStartDate, filterEndDate]);

  // Calculate total count for date-filtered RMAs (for "All Status" display)
  const dateFilteredRMAsCount = React.useMemo(() => {
    if (!filterStartDate && !filterEndDate) {
      return localRMAItems?.length || 0;
    }
    
    let count = 0;
    (localRMAItems || []).forEach(rma => {
      // Use raw date field for accurate filtering
      const rawDate = rma.ascompRaisedDateRaw || rma.ascompRaisedDate || rma.raisedDate || rma.createdAt;
      if (!rawDate || rawDate === 'N/A') return;
      
      const rmaDate = new Date(rawDate);
      if (isNaN(rmaDate.getTime())) return; // Invalid date
      
      if (filterStartDate && filterEndDate) {
        const start = new Date(filterStartDate);
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (rmaDate >= start && rmaDate <= end) count++;
      } else if (filterStartDate) {
        const start = new Date(filterStartDate);
        if (rmaDate >= start) count++;
      } else if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (rmaDate <= end) count++;
      }
    });
    
    return count;
  }, [localRMAItems, filterStartDate, filterEndDate]);

  const filteredRMAs = (localRMAItems || []).filter(rma => {
    // Normalize search term - handle case-insensitive and special characters
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Date filter
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      // Use raw date field for accurate filtering
      const rawDate = rma.ascompRaisedDateRaw || rma.ascompRaisedDate || rma.raisedDate || rma.createdAt;
      if (!rawDate || rawDate === 'N/A') {
        matchesDate = false;
      } else {
        const rmaDate = new Date(rawDate);
        if (isNaN(rmaDate.getTime())) {
          matchesDate = false; // Invalid date
        } else {
          if (filterStartDate && filterEndDate) {
            const start = new Date(filterStartDate);
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            matchesDate = rmaDate >= start && rmaDate <= end;
          } else if (filterStartDate) {
            const start = new Date(filterStartDate);
            matchesDate = rmaDate >= start;
          } else if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            matchesDate = rmaDate <= end;
          }
        }
      }
    }
    
    if (!normalizedSearch) {
      // If search is empty, match all (subject to filters)
      const matchesStatus = filterStatus === "All" || rma.caseStatus === filterStatus;
      const matchesPriority = filterPriority === "All" || rma.priority === filterPriority;
      return matchesDate && matchesStatus && matchesPriority;
    }
    
    // Search across all relevant fields including replaced part name
    const matchesSearch = 
      (rma.productName || '').toLowerCase().includes(normalizedSearch) ||
      (rma.rmaNumber || '').toLowerCase().includes(normalizedSearch) ||
      (rma.siteName || '').toLowerCase().includes(normalizedSearch) ||
      (rma.serialNumber || '').toLowerCase().includes(normalizedSearch) ||
      (rma.defectivePartName || '').toLowerCase().includes(normalizedSearch) ||
      (rma.replacedPartName || '').toLowerCase().includes(normalizedSearch) ||
      (rma.productPartNumber || '').toLowerCase().includes(normalizedSearch) ||
      (rma.defectivePartNumber || '').toLowerCase().includes(normalizedSearch) ||
      (rma.replacedPartNumber || '').toLowerCase().includes(normalizedSearch) ||
      (rma.replacedPartSerialNumber || '').toLowerCase().includes(normalizedSearch) ||
      (rma.defectiveSerialNumber || '').toLowerCase().includes(normalizedSearch);
    
    const matchesStatus = filterStatus === "All" || rma.caseStatus === filterStatus;
    const matchesPriority = filterPriority === "All" || rma.priority === filterPriority;
    return matchesDate && matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-600 text-white border border-blue-500 shadow-sm";
      case "Under Review":
        return "bg-yellow-500 text-yellow-900 border border-yellow-400 shadow-sm";
      case "RMA Raised Yet to Deliver":
        return "bg-orange-500 text-white border border-orange-400 shadow-sm";
      case "Sent to CDS":
        return "bg-purple-600 text-white border border-purple-500 shadow-sm";
      case "Faulty Transit to CDS":
        return "bg-red-600 text-white border border-red-500 shadow-sm";
      case "CDS Approved":
        return "bg-emerald-600 text-white border border-emerald-500 shadow-sm";
      case "Replacement Shipped":
        return "bg-indigo-600 text-white border border-indigo-500 shadow-sm";
      case "Replacement Received":
        return "bg-cyan-600 text-white border border-cyan-500 shadow-sm";
      case "Installation Complete":
        return "bg-teal-600 text-white border border-teal-500 shadow-sm";
      case "Faulty Part Returned":
        return "bg-rose-600 text-white border border-rose-500 shadow-sm";
      case "CDS Confirmed Return":
        return "bg-violet-600 text-white border border-violet-500 shadow-sm";
      case "Completed":
        return "bg-green-600 text-white border border-green-500 shadow-sm";
      case "Rejected":
        return "bg-red-700 text-white border border-red-600 shadow-sm";
      case "Replacement Approved":
        return "bg-green-600 text-white border border-green-500 shadow-sm";
      case "Repair In Progress":
        return "bg-blue-600 text-white border border-blue-500 shadow-sm";
      default:
        return "bg-gray-600 text-white border border-gray-500 shadow-sm";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-400";
      case "Medium":
        return "text-orange-400";
      case "Low":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getWarrantyColor = (warranty: string) => {
    switch (warranty) {
      case "In Warranty":
        return "text-green-400";
      case "Extended Warranty":
        return "text-blue-400";
      case "Out of Warranty":
        return "text-orange-400";
      case "Expired":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Under Review":
        return <Clock className="w-4 h-4" />;
      case "RMA Raised Yet to Deliver":
        return <Package className="w-4 h-4" />;
      case "Sent to CDS":
        return <Truck className="w-4 h-4" />;
      case "Faulty Transit to CDS":
        return <AlertCircle className="w-4 h-4" />;
      case "CDS Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Replacement Shipped":
        return <Package className="w-4 h-4" />;
      case "Replacement Received":
        return <CheckCircle className="w-4 h-4" />;
      case "Installation Complete":
        return <CheckCircle className="w-4 h-4" />;
      case "Faulty Part Returned":
        return <AlertCircle className="w-4 h-4" />;
      case "CDS Confirmed Return":
        return <CheckCircle className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      case "Replacement Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Repair In Progress":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <RotateCcw className="w-4 h-4" />;
    }
  };

  const handleCreateRMA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required fields
      const requiredFields = [
        'ascompRaisedDate',
        'customerErrorDate', 
        'siteName',
        'productName',
        'serialNumber',
        'createdBy'
      ];
      
      const missingFields = requiredFields.filter(field => !newRMA[field as keyof typeof newRMA] || newRMA[field as keyof typeof newRMA] === '');
      
      if (missingFields.length > 0) {
        setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }
      
      // Map warranty status to ensure it's valid for RMA
      const mapWarrantyStatus = (status: string) => {
        switch (status) {
          case 'Active':
            return 'In Warranty';
          case 'Expired':
            return 'Expired';
          case 'Expiring Soon':
            return 'Extended Warranty';
          case 'Extended Warranty':
          case 'Out of Warranty':
            return status;
          default:
            return 'In Warranty';
        }
      };

      // Prepare RMA data for backend
      const rmaData = {
        // rmaNumber: newRMA.rmaNumber, // Remove this - let backend auto-generate
        callLogNumber: newRMA.callLogNumber,
        rmaOrderNumber: newRMA.rmaOrderNumber,
        sxNumber: newRMA.sxNumber,
        ascompRaisedDate: newRMA.ascompRaisedDate,
        customerErrorDate: newRMA.customerErrorDate,
        siteName: newRMA.siteName,
        productName: newRMA.productName,
        productPartNumber: newRMA.productPartNumber,
        serialNumber: newRMA.serialNumber,
        defectivePartNumber: newRMA.defectivePartNumber,
        defectivePartName: newRMA.defectivePartName,
        defectiveSerialNumber: newRMA.defectiveSerialNumber,
        symptoms: newRMA.symptoms,
        replacedPartNumber: newRMA.replacedPartNumber,
        replacedPartSerialNumber: newRMA.replacedPartSerialNumber,
        shippedDate: newRMA.shippedDate,
        trackingNumber: newRMA.trackingNumber,
        shippedThru: newRMA.shippedThru,
        remarks: newRMA.remarks,
        createdBy: newRMA.createdBy,
        caseStatus: newRMA.caseStatus,
        rmaReturnShippedDate: newRMA.rmaReturnShippedDate,
        rmaReturnTrackingNumber: newRMA.rmaReturnTrackingNumber,
        rmaReturnShippedThru: newRMA.rmaReturnShippedThru,
        daysCountShippedToSite: newRMA.daysCountShippedToSite,
        daysCountReturnToCDS: newRMA.daysCountReturnToCDS,
        priority: newRMA.priority,
        warrantyStatus: newRMA.warrantyStatus,
        estimatedCost: newRMA.estimatedCost,
        notes: newRMA.notes,
        brand: newRMA.brand,
        projectorModel: newRMA.projectorModel,
        customerSite: newRMA.customerSite,
        technician: newRMA.technician,
        physicalCondition: newRMA.physicalCondition,
        logicalCondition: newRMA.logicalCondition,
        issueDescription: newRMA.issueDescription,
        rmaReason: newRMA.rmaReason
      };
      
      await apiClient.createRMA(rmaData);
      setShowAddModal(false);
      setNewRMA({
        rmaNumber: "",
        callLogNumber: "",
        rmaOrderNumber: "",
        sxNumber: "",
        ascompRaisedDate: "",
        customerErrorDate: "",
        siteName: "",
        productName: "",
        productPartNumber: "",
        serialNumber: "",
        defectivePartNumber: "",
        defectivePartName: "",
        defectiveSerialNumber: "",
        symptoms: "",
        replacedPartNumber: "",
        replacedPartName: "",
        replacedPartSerialNumber: "",
        replacementNotes: "",
        shippedDate: "",
        trackingNumber: "",
        shippedThru: "",
        remarks: "",
        createdBy: "",
        caseStatus: "",
        rmaReturnShippedDate: "",
        rmaReturnTrackingNumber: "",
        rmaReturnShippedThru: "",
        daysCountShippedToSite: 0,
        daysCountReturnToCDS: 0,
        priority: "Medium",
        warrantyStatus: "In Warranty",
        estimatedCost: 0,
        notes: "",
        brand: "",
        projectorModel: "",
        customerSite: "",
        technician: "",
        physicalCondition: "Good",
        logicalCondition: "Good",
        issueDescription: "",
        rmaReason: ""
      });
      
      // Refresh the RMA list to show the newly created RMA
      await refreshRMA();
    } catch (err: any) {
      console.error('Error creating RMA:', err);
      setError('Failed to create RMA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRMA = async (rma: any) => {
    console.log('Editing RMA:', rma);
    console.log('RMA _id:', rma._id);
    console.log('RMA keys:', Object.keys(rma));
    console.log('RMA status:', rma.status);
    console.log('RMA approvalStatus:', rma.approvalStatus);
    console.log('Full RMA object:', JSON.stringify(rma, null, 2));
    
    // Ensure we have a valid RMA object
    if (!rma._id) {
      console.error('RMA object missing _id field:', rma);
      setError('Invalid RMA data. Cannot edit this RMA.');
      return;
    }
    
    // Fetch fresh data from API to ensure we have the latest status
    try {
      console.log('Fetching fresh RMA data from API...');
      const response = await fetch(`http://localhost:4000/api/rma/${rma._id}`);
      const freshRMA = await response.json();
      console.log('Fresh RMA data from API:', freshRMA);
      
      setEditingRMA({ 
        ...freshRMA, 
        assignedTo: freshRMA.assignedTo || "unassigned" 
      });
      console.log('Set editingRMA to fresh data:', freshRMA);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch fresh RMA data:', error);
      // Fallback to using the passed RMA data
      setEditingRMA({ 
        ...rma, 
        assignedTo: rma.assignedTo || "unassigned" 
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateRMA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Updating RMA with data:', editingRMA);
      console.log('RMA ID:', editingRMA._id);
      console.log('RMA Status being updated to:', editingRMA.status);
      console.log('Full editingRMA object:', JSON.stringify(editingRMA, null, 2));
      
      // Check if _id is available
      if (!editingRMA._id) {
        throw new Error('RMA ID is missing. Cannot update RMA.');
      }
      
      // Prepare update data with proper field mapping
      const updateData = {
        ...editingRMA,
        assignedTo: editingRMA.assignedTo === "unassigned" ? "" : editingRMA.assignedTo,
        // Ensure we have proper status fields
        caseStatus: editingRMA.caseStatus || editingRMA.status || 'Under Review',
        approvalStatus: editingRMA.approvalStatus || 'Pending Review',
        priority: editingRMA.priority || 'Medium'
      };
      
      // Update RMA via API
      await apiClient.updateRMA(editingRMA._id, updateData);
      
      // Immediately update the local state
      console.log('Updating local state for RMA:', editingRMA._id);
      console.log('New status:', editingRMA.status);
      setLocalRMAItems(prev => {
        const updated = prev.map(rma => 
          rma._id === editingRMA._id ? { ...rma, ...editingRMA } : rma
        );
        console.log('Updated local RMA items:', updated.map(r => ({ rmaNumber: r.rmaNumber, status: r.status })));
        return updated;
      });
      setForceUpdate(prev => prev + 1);
      
      setShowEditModal(false);
      setEditingRMA(null);
      
      // Show success message
      (window as any).showToast?.({
        type: 'success',
        title: 'RMA Updated',
        message: `RMA ${editingRMA.rmaNumber} has been updated successfully`
      });
      
      // Refresh the RMA list to show the updated RMA
      await refreshRMA();
      
      // Force a complete data refresh
      setTimeout(async () => {
        console.log('Forcing complete data refresh...');
        await refreshRMA();
        setForceUpdate(prev => prev + 1); // Force re-render
        console.log('RMA data after forced refresh:', rmaItems);
        console.log('RMA statuses after forced refresh:', (rmaItems || []).map(r => ({ rmaNumber: r.rmaNumber, status: r.status, priority: r.priority })));
      }, 1000);
    } catch (err: any) {
      console.error('Error updating RMA:', err);
      setError('Failed to update RMA: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDTRAssigned = async () => {
    // Refresh data after assignment
    await refreshRMA();
    await refreshData();
    setShowAssignDTRDialog(false);
    setSelectedDTRForAssignment(null);
  };

  const loadTechnicalHeads = async () => {
    setIsLoadingTechnicalHeads(true);
    try {
      const response = await apiClient.get('/dtr/users/technical-heads');
      setTechnicalHeads(response.data || response);
    } catch (error) {
      console.error('Error loading technical heads:', error);
    } finally {
      setIsLoadingTechnicalHeads(false);
    }
  };

  const loadReadyForRMADTRs = async () => {
    try {
      setIsLoadingReadyDTRs(true);
      const response = await apiClient.get('/dtr?limit=1000');
      if (response && response.dtrs) {
        const readyDTRs = response.dtrs.filter((dtr: any) => dtr.status === 'Ready for RMA');
        setReadyForRMADTRs(readyDTRs);
      }
    } catch (error) {
      console.error('Error loading DTRs ready for RMA:', error);
    } finally {
      setIsLoadingReadyDTRs(false);
    }
  };

  const handleConvertDTRToRMA = async (dtr: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post(`/dtr/${dtr._id}/convert-to-rma`, {
        rmaManagerId: user?.userId, // Current user as RMA manager
        rmaManagerName: user?.username || user?.email,
        rmaManagerEmail: user?.email
      });

      if (response.success) {
        await refreshData();
        await loadReadyForRMADTRs();
        setError(null);
      } else {
        setError(response.message || 'Failed to convert DTR to RMA');
      }
    } catch (error: any) {
      console.error('Error converting DTR to RMA:', error);
      setError(error.response?.data?.message || 'Error converting DTR to RMA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportRMA = async () => {
    try {
      setIsLoading(true);
      const csvContent = convertToCSV(rmaItems || [], [
        'rmaNumber', 'projectorSerial', 'partName', 'brand', 'projectorModel', 'customerSite', 'status', 'priority', 'estimatedCost', 'warrantyStatus'
      ]);
      downloadCSV(rmaItems || [], `rma_report_${new Date().toISOString().split('T')[0]}.csv`);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Export Successful',
        message: 'RMA report exported to CSV file'
      });
    } catch (err: any) {
      console.error('Error exporting RMA:', err);
      setError('Failed to export RMA report: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintLabel = async (rmaId: string) => {
    try {
      const rma = (rmaItems || []).find(r => r._id === rmaId);
      if (!rma) {
        setError('RMA not found');
        return;
      }
      
      const labelContent = generateLabel(rma);
      printLabel(labelContent);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Label Printed',
        message: `RMA label for ${rma.rmaNumber} sent to printer`
      });
    } catch (err: any) {
      console.error('Error printing label:', err);
      setError('Failed to print label: ' + err.message);
    }
  };

  const handleDeleteAllRMAs = async () => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: This will permanently delete ALL ${localRMAItems.length} RMA records!\n\n` +
      `This action CANNOT be undone.\n\n` +
      `Are you absolutely sure you want to proceed?`
    );
    
    if (!confirmDelete) {
      return;
    }

    const doubleConfirm = window.confirm(
      `This is your final confirmation.\n\n` +
      `Type 'DELETE ALL' in the next prompt to confirm deletion of all RMA records.`
    );
    
    if (!doubleConfirm) {
      return;
    }

    const finalConfirmation = window.prompt(
      'Please type DELETE ALL to confirm:'
    );

    if (finalConfirmation !== 'DELETE ALL') {
      setError('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Delete all RMAs one by one
      const deletePromises = localRMAItems.map(rma => 
        apiClient.delete(`/rma/${rma._id}`)
      );

      await Promise.all(deletePromises);

      (window as any).showToast?.({
        type: 'success',
        title: 'All RMAs Deleted',
        message: `Successfully deleted ${localRMAItems.length} RMA records`
      });

      // Refresh the RMA list
      await refreshRMA();
      await refreshData();
    } catch (err: any) {
      console.error('Error deleting all RMAs:', err);
      setError('Failed to delete all RMAs: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-8 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-3">RMA Management</h1>
            <p className="text-xl text-blue-100 opacity-90">Manage Return Merchandise Authorization requests</p>
          </div>
          <div className="flex items-center space-x-4">
            {dataLoading && (
              <div className="flex items-center gap-2 text-blue-100 bg-blue-800/50 px-4 py-2 rounded-lg border border-blue-400/30">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
            <button 
              onClick={async () => {
                console.log('Manual refresh clicked');
                console.log('Current RMA count before refresh:', rmaItems?.length || 0);
                await refreshRMA();
                console.log('Current RMA count after refresh:', rmaItems?.length || 0);
                setForceUpdate(prev => prev + 1);
                
                // Force a complete re-render by clearing and reloading data
                setTimeout(async () => {
                  console.log('Force reloading data...');
                  await refreshData();
                  setForceUpdate(prev => prev + 1);
                }, 1000);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-blue-400/30 hover:shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
            <button 
              onClick={() => window.location.hash = '#rma-reports'}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-purple-400/30 hover:shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Reports & Analytics
            </button>
            <button 
              onClick={async () => {
                console.log('Force refresh clicked - clearing all caches');
                console.log('Current RMA count before force refresh:', rmaItems?.length || 0);
                // Clear all caches and force refresh
                await refreshData();
                console.log('Current RMA count after force refresh:', rmaItems?.length || 0);
                setForceUpdate(prev => prev + 1);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-orange-400/30 hover:shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Force Refresh
            </button>
            <button 
              onClick={handleExportRMA}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-green-400/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={handleDeleteAllRMAs}
              disabled={isLoading || localRMAItems.length === 0}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-red-400/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete all RMA records"
            >
              <XCircle className="w-4 h-4" />
              Delete All
            </button>
            <ImportOptions onImportComplete={refreshRMA} />
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              New RMA
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">Total RMAs</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">Under Review</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.filter(r => r.caseStatus === 'Under Review').length}</p>
              </div>
            </div>
          </div>
          
          {/* Faulty Transit to CDS */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">Faulty Transit to CDS</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.filter(r => r.caseStatus === 'Faulty Transit to CDS').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">Completed</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.filter(r => r.caseStatus === 'Completed').length}</p>
              </div>
            </div>


            {/* RMA Raised Yet to Deliver */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4 flex items-center">
              <div className="bg-orange-500 p-3 rounded-full">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">Yet to Deliver</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.filter(r => r.caseStatus === 'RMA Raised Yet to Deliver').length}</p>
              </div>
            </div>

            {/* Faulty Transit to CDS */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-4 flex items-center">
              <div className="bg-red-500 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">Faulty Transit</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.filter(r => r.caseStatus === 'Faulty Transit to CDS').length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Search and Filters */}
        <div className="bg-dark-card rounded-xl shadow-lg p-6 mb-8 border border-dark-color">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search RMA number, serial number, part, or site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-bg border-dark-color text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-11"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-dark-bg border border-dark-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px] h-11"
              >
                <option value="All">
                  All Status ({dateFilteredRMAsCount})
                  {(() => {
                    const startDate = filterStartDate;
                    const endDate = filterEndDate;
                    const yearMatch = startDate && endDate && startDate.match(/^(\d{4})-01-01$/) && endDate.match(/^(\d{4})-12-31$/);
                    if (yearMatch && startDate.substring(0, 4) === endDate.substring(0, 4)) {
                      return ` - ${startDate.substring(0, 4)}`;
                    }
                    return '';
                  })()}
                </option>
                {availableStatuses.map(({ status, count }) => (
                  <option key={status} value={status}>
                    {status} ({count})
                  </option>
                ))}
              </select>
              
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 bg-dark-bg border border-dark-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px] h-11"
              >
                <option value="All">All Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
            
            <Button 
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("All");
                setFilterPriority("All");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 px-6"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
            
            <Button 
              onClick={() => setShowImportComponent(true)}
              className="bg-green-600 hover:bg-green-700 text-white h-11 px-6"
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            
            <Button 
              onClick={() => setShowAdvancedSearch(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6"
            >
              <Search className="w-4 h-4 mr-2" />
              Advanced Search
            </Button>
            
          </div>
          
          {/* Date Filter Section */}
          <div className="mt-4 pt-4 border-t border-dark-color">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                📅 Date Filter (Filter by Year/Month)
              </h3>
              
              {/* Year Buttons */}
              <div className="flex flex-wrap gap-2">
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => {
                  const isSelected = filterStartDate === `${year}-01-01` && filterEndDate === `${year}-12-31`;
                  return (
                    <Button
                      key={year}
                      onClick={() => {
                        setFilterStartDate(`${year}-01-01`);
                        setFilterEndDate(`${year}-12-31`);
                      }}
                      size="sm"
                      className={`h-9 px-4 ${
                        isSelected
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-400'
                          : 'bg-dark-bg border border-dark-color text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {year}
                    </Button>
                  );
                })}
                {(filterStartDate || filterEndDate) && (
                  <Button
                    onClick={() => {
                      setFilterStartDate("");
                      setFilterEndDate("");
                    }}
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white border-red-400"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Date
                  </Button>
                )}
              </div>
              
              {/* Manual Date Inputs */}
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="bg-dark-bg border-dark-color text-white h-9"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="bg-dark-bg border-dark-color text-white h-9"
                  />
                </div>
              </div>
              
              {/* Status Breakdown for Filtered Date */}
              {(filterStartDate || filterEndDate) && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border-2 border-blue-500/50">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    📊 Status Breakdown {(() => {
                      const startDate = filterStartDate;
                      const endDate = filterEndDate;
                      const yearMatch = startDate && endDate && startDate.match(/^(\d{4})-01-01$/) && endDate.match(/^(\d{4})-12-31$/);
                      if (yearMatch && startDate.substring(0, 4) === endDate.substring(0, 4)) {
                        return `for Year ${startDate.substring(0, 4)}`;
                      }
                      return '';
                    })()}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(() => {
                      // Calculate status breakdown for filtered RMAs
                      const statusCounts: { [key: string]: number } = {};
                      filteredRMAs.forEach(rma => {
                        const status = rma.caseStatus || 'Unknown';
                        statusCounts[status] = (statusCounts[status] || 0) + 1;
                      });
                      
                      // Get top statuses
                      return Object.entries(statusCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([status, count]) => (
                          <div key={status} className="bg-dark-bg/50 rounded-lg p-3 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1 truncate" title={status}>{status}</p>
                            <p className="text-2xl font-bold text-white">{count}</p>
                          </div>
                        ));
                    })()}
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-lg font-bold text-white">
                      Total: {filteredRMAs.length} RMA{filteredRMAs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || filterStatus !== "All" || filterPriority !== "All" || filterStartDate || filterEndDate) && (
            <div className="mt-4 pt-4 border-t border-dark-color">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="font-medium">Active Filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
                {filterStatus !== "All" && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Status: {filterStatus}
                  </span>
                )}
                {filterPriority !== "All" && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    Priority: {filterPriority}
                  </span>
                )}
                {(filterStartDate || filterEndDate) && (
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold">
                    📅 Date: {(() => {
                      const startDate = filterStartDate;
                      const endDate = filterEndDate;
                      const yearMatch = startDate && endDate && startDate.match(/^(\d{4})-01-01$/) && endDate.match(/^(\d{4})-12-31$/);
                      
                      if (yearMatch && startDate.substring(0, 4) === endDate.substring(0, 4)) {
                        return `Year ${startDate.substring(0, 4)}`;
                      } else if (startDate && endDate) {
                        return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
                      } else if (startDate) {
                        return `From ${new Date(startDate).toLocaleDateString()}`;
                      } else {
                        return `Until ${new Date(endDate).toLocaleDateString()}`;
                      }
                    })()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DTRs Ready for RMA Conversion */}
        {readyForRMADTRs.length > 0 && (
          <div className="bg-dark-card rounded-xl shadow-xl border border-dark-color overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 border-b border-dark-color">
              <h2 className="text-xl font-semibold text-white">DTRs Ready for RMA Conversion</h2>
              <p className="text-sm text-green-100 mt-1">Showing {readyForRMADTRs.length} DTRs ready for conversion</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {readyForRMADTRs.map((dtr: any) => (
                  <div key={dtr._id} className="flex items-center justify-between p-4 bg-dark-hover rounded-lg border border-dark-color">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-dark-primary">Case ID: {dtr.caseId}</p>
                          <p className="text-sm text-dark-secondary">Serial: {dtr.serialNumber}</p>
                          <p className="text-sm text-dark-secondary">Site: {dtr.siteName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-dark-secondary">Problem: {dtr.problemName || dtr.complaintDescription}</p>
                          <p className="text-sm text-dark-secondary">Status: <span className="text-green-400">{dtr.status}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConvertDTRToRMA(dtr)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Converting...' : 'Convert to RMA'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RMA Management Tabs */}
        <Tabs defaultValue="rma-list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="rma-list">RMA Records</TabsTrigger>
            <TabsTrigger value="overdue-analysis">Overdue Analysis</TabsTrigger>
            <TabsTrigger value="simple-analytics">Simple Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="rma-list">
            {/* Diagnostic Component - Remove this after fixing the issue */}
            <div className="mb-6">
              <DiagnosticComponent />
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
                <div className="mt-2 flex gap-2">
                  <button 
                    onClick={() => setError(null)}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={async () => {
                      setError(null);
                      await refreshRMA();
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-dark-card rounded-xl shadow-xl border border-dark-color overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-dark-bg to-dark-tag border-b border-dark-color">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">RMA Records</h2>
                    <p className="text-sm text-gray-300 mt-1">Showing {filteredRMAs.length} RMA records</p>
                  </div>
                </div>
              </div>
        <div className="overflow-x-auto">
          {filteredRMAs.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-dark-tag rounded-full flex items-center justify-center mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              {filterStatus === "All" && localRMAItems.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-white mb-2">No RMAs Found</h3>
                  <p className="text-gray-300 mb-4">No RMA records are available. Try selecting a specific status to filter the results.</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-white mb-2">No RMAs Found</h3>
                  <p className="text-gray-300 mb-4">No RMA records match your current filters.</p>
                </>
              )}
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New RMA
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm" key={`rma-table-${forceUpdate}`}>
              <thead>
                <tr className="bg-gradient-to-r from-dark-bg to-dark-tag border-b-2 border-dark-color">
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">RMA #</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Site & Product</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Defective Part</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Replacement Part</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Status & Priority</th>
                  <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-sm uppercase tracking-wide">Dates & Tracking</th>
                  <th className="text-center font-bold text-white py-4 px-4 text-sm uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody key={`rma-tbody-${forceUpdate}`}>
                {filteredRMAs.map((rma, index) => (
                  <tr key={`${rma._id}-${forceUpdate}`} className={`border-b border-dark-color transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-bg'
                  } hover:bg-dark-tag hover:shadow-sm`}>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="font-semibold text-blue-400 hover:text-blue-300 cursor-pointer text-base">
                          {rma.rmaNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Call: {rma.callLogNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Order: {rma.rmaOrderNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm">
                          {rma.siteName || 'N/A'}
                        </div>
                        <div className="text-gray-300 text-sm">
                          {rma.productName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300 font-mono">
                          SN: {rma.serialNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Part: {rma.productPartNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="text-gray-300 text-sm">
                          {rma.defectivePartNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Part: {rma.defectivePartName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Serial: {rma.defectivePartNumber || 'N/A'}
                        </div>
                        {rma.symptoms && rma.symptoms !== 'N/A' && (
                          <div className="text-xs text-gray-100 bg-gray-700 px-2 py-1 rounded border border-gray-600" title={rma.symptoms}>
                            {rma.symptoms}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1">
                        <div className="text-gray-300 text-sm">
                          {(() => {
                            const replacedName = rma.replacedPartName || 'N/A';
                            const defectiveName = rma.defectivePartName || 'N/A';
                            
                            // Only replace if the replacement part name is clearly a symptom description
                            const clearSymptomPatterns = [
                              'integrator rod chipped',
                              'prism chipped', 
                              'segmen prism',
                              'connection lost',
                              'power cycle',
                              'marriage failure',
                              'imb marriage',
                              'imb marriage failure'
                            ];
                            
                            // Check if it's exactly a symptom pattern or contains clear symptom indicators
                            const isSymptomDescription = replacedName === 'N/A' || 
                              clearSymptomPatterns.some(pattern => replacedName.toLowerCase().includes(pattern.toLowerCase())) ||
                              (replacedName.toLowerCase().includes('chipped') && replacedName.toLowerCase().includes('rod')) ||
                              (replacedName.toLowerCase().includes('marriage') && replacedName.toLowerCase().includes('failure'));
                            
                            if (isSymptomDescription) {
                              console.log('🔄 DEBUG - Table display: Replacing symptom name with defective part name:', {
                                rmaNumber: rma.rmaNumber,
                                originalReplacedName: replacedName,
                                newReplacedName: defectiveName,
                                reason: 'Clear symptom pattern detected'
                              });
                              return defectiveName;
                            }
                            return replacedName;
                          })()}
                        </div>
                        <div className="text-xs text-gray-300">
                          Part: {rma.replacedPartNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Serial: {rma.replacedPartSerialNumber || 'N/A'}
                        </div>
                        {rma.replacementNotes && rma.replacementNotes !== 'N/A' && (
                          <div className="text-xs text-gray-100 bg-gray-700 px-2 py-1 rounded border border-gray-600" title={rma.replacementNotes}>
                            {rma.replacementNotes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-2">
                        <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusColor(rma.caseStatus || 'Under Review')}`}>
                          {rma.caseStatus || 'Under Review'}
                        </div>
                        <div className="text-xs text-gray-300">
                          Priority: <span className={`font-semibold ${getPriorityColor(rma.priority || 'Medium')}`}>
                            {rma.priority || 'Medium'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300">
                          Created by: {rma.createdBy || 'System'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-dark-color">
                      <div className="space-y-1 text-xs">
                        <div className="text-gray-300">
                          <span className="font-medium">Raised:</span> {rma.ascompRaisedDate || 'N/A'}
                        </div>
                        <div className="text-gray-300">
                          <span className="font-medium">Error:</span> {rma.customerErrorDate || 'N/A'}
                        </div>
                        
                        {/* Replacement Part Tracking */}
                        {(rma.shipping?.outbound?.trackingNumber || rma.trackingNumber) && (
                          <div className="border-t border-gray-600 pt-1 mt-2">
                            <div className="text-xs text-green-400 font-semibold">Replacement Shipped:</div>
                            <div className="text-xs text-gray-300">
                              {(rma.shipping?.outbound?.shippedDate ? new Date(rma.shipping.outbound.shippedDate).toLocaleDateString() : rma.shippedDate) || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-600 font-mono">
                              <span className="font-medium">Track:</span> {rma.shipping?.outbound?.trackingNumber || rma.trackingNumber}
                            </div>
                            <div className="text-xs text-gray-300">
                              <span className="font-medium">Via:</span> {rma.shipping?.outbound?.carrier || rma.shippedThru || 'N/A'}
                            </div>
                            {(rma.shipping?.outbound?.status || rma.trackingNumber) && (
                              <div className="text-xs text-gray-300">
                                <span className="font-medium">Status:</span> <span className={`px-1 py-0.5 rounded text-xs ${
                                  // If RMA is completed and has tracking details, show delivered
                                  (rma.caseStatus === 'Completed' && (rma.shipping?.outbound?.trackingNumber || rma.trackingNumber)) ? 'bg-green-600' :
                                  (rma.shipping?.outbound?.status === 'delivered') ? 'bg-green-600' :
                                  (rma.shipping?.outbound?.status === 'in_transit') ? 'bg-blue-600' :
                                  (rma.shipping?.outbound?.status === 'exception') ? 'bg-red-600' :
                                  rma.trackingNumber ? 'bg-blue-600' :
                                  'bg-gray-600'
                                }`}>
                                  {(() => {
                                    // If RMA is completed and has tracking details, show delivered
                                    if (rma.caseStatus === 'Completed' && (rma.shipping?.outbound?.trackingNumber || rma.trackingNumber)) {
                                      return 'delivered';
                                    }
                                    return rma.shipping?.outbound?.status ? rma.shipping.outbound.status.replace('_', ' ') : 'Shipped';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Defective Part Return Tracking */}
                        {(rma.shipping?.return?.trackingNumber || rma.rmaReturnTrackingNumber) && (
                          <div className="border-t border-gray-600 pt-1 mt-2">
                            <div className="text-xs text-orange-400 font-semibold">Defective Return:</div>
                            <div className="text-xs text-gray-300">
                              {(rma.shipping?.return?.shippedDate ? new Date(rma.shipping.return.shippedDate).toLocaleDateString() : rma.rmaReturnShippedDate) || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-600 font-mono">
                              <span className="font-medium">Track:</span> {rma.shipping?.return?.trackingNumber || rma.rmaReturnTrackingNumber}
                            </div>
                            <div className="text-xs text-gray-300">
                              <span className="font-medium">Via:</span> {rma.shipping?.return?.carrier || rma.rmaReturnShippedThru || 'N/A'}
                            </div>
                            {(rma.shipping?.return?.status || rma.rmaReturnTrackingNumber) && (
                              <div className="text-xs text-gray-300">
                                <span className="font-medium">Status:</span> <span className={`px-1 py-0.5 rounded text-xs ${
                                  // If RMA is completed and has return tracking details, show delivered
                                  (rma.caseStatus === 'Completed' && (rma.shipping?.return?.trackingNumber || rma.rmaReturnTrackingNumber)) ? 'bg-green-600' :
                                  (rma.shipping?.return?.status === 'delivered') ? 'bg-green-600' :
                                  (rma.shipping?.return?.status === 'in_transit') ? 'bg-blue-600' :
                                  (rma.shipping?.return?.status === 'exception') ? 'bg-red-600' :
                                  rma.rmaReturnTrackingNumber ? 'bg-blue-600' :
                                  'bg-gray-600'
                                }`}>
                                  {(() => {
                                    // If RMA is completed and has return tracking details, show delivered
                                    if (rma.caseStatus === 'Completed' && (rma.shipping?.return?.trackingNumber || rma.rmaReturnTrackingNumber)) {
                                      return 'delivered';
                                    }
                                    return rma.shipping?.return?.status ? rma.shipping.return.status.replace('_', ' ') : 'Shipped';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300"
                          onClick={() => setSelectedRMA(rma)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300"
                          onClick={() => handleEditRMA(rma)}
                          title="Edit RMA"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-300" 
                          title="View Documents"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
            </div>
          </TabsContent>

          <TabsContent value="overdue-analysis">
            <RMAOverdueAnalysis />
          </TabsContent>

          <TabsContent value="simple-analytics">
            <SimpleRMAAnalytics />
          </TabsContent>
        </Tabs>

        {/* RMA Detail Modal */}
        {selectedRMA && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-primary">RMA Details - {selectedRMA.rmaNumber}</h2>
                <button 
                  onClick={() => setSelectedRMA(null)}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-dark-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">RMA Number</label>
                      <p className="text-dark-primary font-semibold">{selectedRMA.rmaNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Part Name</label>
                      <p className="text-dark-primary">{selectedRMA.productName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Part Number</label>
                      <p className="text-dark-primary">{selectedRMA.productPartNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Serial Number</label>
                      <p className="text-dark-primary">SN: {selectedRMA.serialNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Brand & Model</label>
                      <p className="text-dark-primary">{selectedRMA.brand} {selectedRMA.productName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Customer Site</label>
                      <p className="text-dark-primary">{selectedRMA.siteName}</p>
                    </div>
                  </div>
                </div>

                {/* Issue & Status */}
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-4">Issue & Status</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Issue Description</label>
                      <p className="text-dark-primary text-sm">{selectedRMA.symptoms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">RMA Reason</label>
                      <p className="text-dark-primary">{selectedRMA.rmaReason}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Current Status</label>
                      <div className={`dark-tag ${getStatusColor(selectedRMA.caseStatus)} inline-flex items-center gap-1 mt-1`}>
                        {getStatusIcon(selectedRMA.caseStatus)}
                        {selectedRMA.caseStatus}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Priority</label>
                      <span className={`font-semibold ${getPriorityColor(selectedRMA.priority)}`}>
                        {selectedRMA.priority}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Approval Status</label>
                      <p className="text-dark-primary">{selectedRMA.approvalStatus}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Assigned To</label>
                      <p className="text-dark-primary">
                        {typeof selectedRMA.assignedTo === 'string' ? selectedRMA.assignedTo : 
                         typeof selectedRMA.assignedTo === 'object' && selectedRMA.assignedTo?.name ? selectedRMA.assignedTo.name : 
                         'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-4">Additional Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">RMA Date</label>
                      <p className="text-dark-primary">{selectedRMA.ascompRaisedDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Expected Resolution</label>
                      <p className="text-dark-primary">{selectedRMA.expectedResolution}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Estimated Cost</label>
                      <p className="text-dark-primary font-semibold">₹{(selectedRMA.estimatedCost || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Warranty Status</label>
                      <span className={`font-semibold ${getWarrantyColor(selectedRMA.warrantyStatus)}`}>
                        {selectedRMA.warrantyStatus}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Physical Condition</label>
                      <p className="text-dark-primary">{selectedRMA.physicalCondition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Logical Condition</label>
                      <p className="text-dark-primary">{selectedRMA.logicalCondition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Service Report</label>
                      <p className="text-dark-primary">{selectedRMA.serviceReport}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Technician</label>
                      <p className="text-dark-primary">{selectedRMA.technician}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="text-sm font-medium text-dark-secondary">Notes</label>
                <p className="text-dark-primary mt-2 p-4 bg-dark-bg rounded-lg border border-dark-color text-sm">
                  {selectedRMA.notes}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 mt-6 border-t border-dark-color">
                {selectedRMA.caseStatus === "Under Review" && (
                  <>
                    <button className="flex-1 dark-button-primary">Approve RMA</button>
                    <button className="flex-1 dark-button-secondary">Request More Info</button>
                  </>
                )}
                {selectedRMA.caseStatus === "Replacement Approved" && (
                  <button className="flex-1 dark-button-primary">Process Replacement</button>
                )}
                {selectedRMA.caseStatus === "Repair In Progress" && (
                  <button className="flex-1 dark-button-primary">Update Progress</button>
                )}
                <button className="dark-button-secondary px-6">Download RMA Report</button>
                <button 
                                          onClick={() => handlePrintLabel(selectedRMA._id)}
                  className="dark-button-secondary px-6"
                >
                  Print Label
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Create RMA Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Create New RMA</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">RMA Number</label>
                  <Input
                    value="Auto-generated"
                    readOnly
                    className="mt-1 bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                    placeholder="Will be auto-generated"
                  />
                  <p className="text-xs text-gray-500 mt-1">RMA number will be automatically generated when you create the RMA</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Call Log Number</label>
                  <Input
                    value={newRMA.callLogNumber}
                    onChange={(e) => setNewRMA({...newRMA, callLogNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter call log number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">RMA Order Number</label>
                  <Input
                    value={newRMA.rmaOrderNumber}
                    onChange={(e) => setNewRMA({...newRMA, rmaOrderNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter RMA order number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">SX Number</label>
                  <Input
                    value={newRMA.sxNumber}
                    onChange={(e) => setNewRMA({...newRMA, sxNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter SX number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Part Number *</label>
                  <Input
                    value={newRMA.productPartNumber}
                    onChange={(e) => setNewRMA({...newRMA, productPartNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter part number"
                    required
                  />
                  {!newRMA.productPartNumber && (
                    <p className="text-xs text-red-400 mt-1">Part Number is required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Part Name *</label>
                  <Input
                    value={newRMA.productName}
                    onChange={(e) => setNewRMA({...newRMA, productName: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter part name"
                    required
                  />
                  {!newRMA.productName && (
                    <p className="text-xs text-red-400 mt-1">Part Name is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Brand *</label>
                  <Input
                    value={newRMA.brand}
                    onChange={(e) => setNewRMA({...newRMA, brand: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter brand"
                    required
                  />
                  {!newRMA.brand && (
                    <p className="text-xs text-red-400 mt-1">Brand is required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Projector Model *</label>
                  <Input
                    value={newRMA.projectorModel}
                    onChange={(e) => setNewRMA({...newRMA, projectorModel: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter projector model"
                    required
                  />
                  {!newRMA.projectorModel && (
                    <p className="text-xs text-red-400 mt-1">Projector Model is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Customer Site *</label>
                  <Input
                    value={newRMA.siteName}
                    onChange={(e) => setNewRMA({...newRMA, siteName: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter customer site"
                    required
                  />
                  {!newRMA.siteName && (
                    <p className="text-xs text-red-400 mt-1">Customer Site is required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Created By *</label>
                  <Input
                    value={newRMA.createdBy}
                    onChange={(e) => setNewRMA({...newRMA, createdBy: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter creator name"
                    required
                  />
                  {!newRMA.createdBy && (
                    <p className="text-xs text-red-400 mt-1">Created By is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Technician</label>
                  <Input
                    value={newRMA.technician}
                    onChange={(e) => setNewRMA({...newRMA, technician: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter technician name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Serial Number *</label>
                  <div className="flex gap-2">
                    <Input
                      value={newRMA.serialNumber}
                      onChange={(e) => setNewRMA({...newRMA, serialNumber: e.target.value})}
                      className="mt-1 flex-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Enter serial number"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSerialNumberSelector(true)}
                      className="mt-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Select
                    </button>
                  </div>
                  {!newRMA.serialNumber && (
                    <p className="text-xs text-red-400 mt-1">Serial Number is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">ASCOMP Raised Date *</label>
                  <Input
                    type="date"
                    value={newRMA.ascompRaisedDate}
                    onChange={(e) => setNewRMA({...newRMA, ascompRaisedDate: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    required
                  />
                  {!newRMA.ascompRaisedDate && (
                    <p className="text-xs text-red-400 mt-1">ASCOMP Raised Date is required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Customer Error Date *</label>
                  <Input
                    type="date"
                    value={newRMA.customerErrorDate}
                    onChange={(e) => setNewRMA({...newRMA, customerErrorDate: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    required
                  />
                  {!newRMA.customerErrorDate && (
                    <p className="text-xs text-red-400 mt-1">Customer Error Date is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Priority</label>
                  <select
                    value={newRMA.priority}
                    onChange={(e) => setNewRMA({...newRMA, priority: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Warranty Status</label>
                  <select
                    value={newRMA.warrantyStatus}
                    onChange={(e) => setNewRMA({...newRMA, warrantyStatus: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="In Warranty">In Warranty</option>
                    <option value="Extended Warranty">Extended Warranty</option>
                    <option value="Out of Warranty">Out of Warranty</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Physical Condition</label>
                  <select
                    value={newRMA.physicalCondition}
                    onChange={(e) => setNewRMA({...newRMA, physicalCondition: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Logical Condition</label>
                  <select
                    value={newRMA.logicalCondition}
                    onChange={(e) => setNewRMA({...newRMA, logicalCondition: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Good">Good</option>
                    <option value="Faulty">Faulty</option>
                    <option value="Degraded">Degraded</option>
                    <option value="Partial Failure">Partial Failure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Issue Description *</label>
                <textarea
                  value={newRMA.symptoms}
                  onChange={(e) => setNewRMA({...newRMA, symptoms: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  rows={3}
                  placeholder="Describe the issue with the part"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Case Status *</label>
                  <select
                    value={newRMA.caseStatus}
                    onChange={(e) => setNewRMA({...newRMA, caseStatus: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Open">Open</option>
                    <option value="Under Review">Under Review</option>
                    <option value="RMA Raised Yet to Deliver">RMA Raised Yet to Deliver</option>
                    <option value="Sent to CDS">Sent to CDS</option>
                    <option value="Faulty Transit to CDS">Faulty Transit to CDS</option>
                    <option value="CDS Approved">CDS Approved</option>
                    <option value="Replacement Shipped">Replacement Shipped</option>
                    <option value="Replacement Received">Replacement Received</option>
                    <option value="Installation Complete">Installation Complete</option>
                    <option value="Faulty Part Returned">Faulty Part Returned</option>
                    <option value="CDS Confirmed Return">CDS Confirmed Return</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  {!newRMA.caseStatus && (
                    <p className="text-xs text-red-400 mt-1">Case Status is required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Priority</label>
                  <select
                    value={newRMA.priority}
                    onChange={(e) => setNewRMA({...newRMA, priority: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">RMA Reason *</label>
                <textarea
                  value={newRMA.rmaReason}
                  onChange={(e) => setNewRMA({...newRMA, rmaReason: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  rows={2}
                  placeholder="Reason for RMA request"
                  required
                />
                {!newRMA.rmaReason && (
                  <p className="text-xs text-red-400 mt-1">RMA Reason is required</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Estimated Cost (₹)</label>
                <Input
                  type="number"
                  value={newRMA.estimatedCost}
                  onChange={(e) => setNewRMA({...newRMA, estimatedCost: Number(e.target.value)})}
                  className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Notes</label>
                <textarea
                  value={newRMA.notes}
                  onChange={(e) => setNewRMA({...newRMA, notes: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Defective Part Name</label>
                  <Input
                    value={newRMA.defectivePartName}
                    onChange={(e) => setNewRMA({...newRMA, defectivePartName: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter defective part name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Defective Part Number</label>
                  <Input
                    value={newRMA.defectivePartNumber}
                    onChange={(e) => setNewRMA({...newRMA, defectivePartNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter defective part number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Defective Serial Number</label>
                  <Input
                    value={newRMA.defectiveSerialNumber}
                    onChange={(e) => setNewRMA({...newRMA, defectiveSerialNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter defective serial number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Symptoms</label>
                  <Input
                    value={newRMA.symptoms}
                    onChange={(e) => setNewRMA({...newRMA, symptoms: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter symptoms"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Replacement Part Name</label>
                  <Input
                    value={newRMA.replacedPartName}
                    onChange={(e) => setNewRMA({...newRMA, replacedPartName: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter replacement part name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Replacement Part Number</label>
                  <Input
                    value={newRMA.replacedPartNumber}
                    onChange={(e) => setNewRMA({...newRMA, replacedPartNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter replacement part number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Replacement Serial Number</label>
                  <Input
                    value={newRMA.replacedPartSerialNumber}
                    onChange={(e) => setNewRMA({...newRMA, replacedPartSerialNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter replacement serial number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Replacement Notes</label>
                  <Input
                    value={newRMA.replacementNotes}
                    onChange={(e) => setNewRMA({...newRMA, replacementNotes: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter replacement notes"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateRMA}
                disabled={isLoading || !newRMA.productPartNumber || !newRMA.productName || !newRMA.rmaReason}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create RMA'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

                      {/* Edit RMA Modal */}
        {showEditModal && editingRMA && (() => {
          console.log('Rendering edit modal with editingRMA:', editingRMA);
          console.log('editingRMA.status:', editingRMA.caseStatus);
          console.log('editingRMA.approvalStatus:', editingRMA.approvalStatus);
          return (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-primary">Edit RMA - {editingRMA.rmaNumber}</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-secondary" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Number</label>
                    <Input
                      value={editingRMA.rmaNumber || ''}
                      readOnly
                      className="mt-1 bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                      placeholder="RMA-2024-XXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">RMA number cannot be changed after creation</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Call Log Number</label>
                    <Input
                      value={editingRMA.callLogNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, callLogNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Call log number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Order Number</label>
                    <Input
                      value={editingRMA.rmaOrderNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, rmaOrderNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Order number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Site Name</label>
                    <Input
                      value={editingRMA.siteName || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, siteName: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Site name"
                    />
                  </div>
                </div>
              </div>

              {/* Product Information Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Product Name</label>
                    <Input
                      value={editingRMA.productName || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, productName: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Product Part Number</label>
                    <Input
                      value={editingRMA.productPartNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, productPartNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Part number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Serial Number</label>
                    <Input
                      value={editingRMA.serialNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, serialNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Serial number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Brand</label>
                    <Input
                      value={editingRMA.brand || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, brand: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Brand"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Projector Model</label>
                    <Input
                      value={editingRMA.projectorModel || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, projectorModel: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Model"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Customer Site</label>
                    <Input
                      value={editingRMA.customerSite || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, customerSite: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Customer site"
                    />
                  </div>
                </div>
              </div>

              {/* Defective Part Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Defective Part Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Defective Part Number</label>
                    <Input
                      value={editingRMA.defectivePartNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, defectivePartNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Defective part number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Defective Part Name</label>
                    <Input
                      value={editingRMA.defectivePartName || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, defectivePartName: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Defective part name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Defective Serial Number</label>
                    <Input
                      value={editingRMA.defectiveSerialNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, defectiveSerialNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Defective serial number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Symptoms</label>
                    <textarea
                      value={editingRMA.symptoms || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, symptoms: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={2}
                      placeholder="Describe symptoms"
                    />
                  </div>
                </div>
              </div>

              {/* Replacement Part Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Replacement Part Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Replaced Part Number</label>
                    <Input
                      value={editingRMA.replacedPartNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, replacedPartNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Replaced part number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Replaced Part Name</label>
                    <Input
                      value={editingRMA.replacedPartName || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, replacedPartName: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Replaced part name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Replaced Part Serial Number</label>
                    <Input
                      value={editingRMA.replacedPartSerialNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, replacedPartSerialNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Replaced part serial"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Replacement Notes</label>
                    <textarea
                      value={editingRMA.replacementNotes || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, replacementNotes: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={2}
                      placeholder="Replacement notes"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Information Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Shipped Date</label>
                    <Input
                      type="date"
                      value={editingRMA.shippedDate ? editingRMA.shippedDate.split('T')[0] : ''}
                      onChange={(e) => setEditingRMA({...editingRMA, shippedDate: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Tracking Number</label>
                    <Input
                      value={editingRMA.trackingNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, trackingNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Tracking number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Shipped Through</label>
                    <Input
                      value={editingRMA.shippedThru || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, shippedThru: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Shipping carrier"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Return Shipped Date</label>
                    <Input
                      type="date"
                      value={editingRMA.rmaReturnShippedDate ? editingRMA.rmaReturnShippedDate.split('T')[0] : ''}
                      onChange={(e) => setEditingRMA({...editingRMA, rmaReturnShippedDate: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Return Tracking Number</label>
                    <Input
                      value={editingRMA.rmaReturnTrackingNumber || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, rmaReturnTrackingNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Return tracking number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Return Shipped Through</label>
                    <Input
                      value={editingRMA.rmaReturnShippedThru || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, rmaReturnShippedThru: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Return shipping carrier"
                    />
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Important Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">ASCOMP Raised Date</label>
                    <Input
                      type="date"
                      value={editingRMA.ascompRaisedDate ? editingRMA.ascompRaisedDate.split('T')[0] : ''}
                      onChange={(e) => setEditingRMA({...editingRMA, ascompRaisedDate: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Customer Error Date</label>
                    <Input
                      type="date"
                      value={editingRMA.customerErrorDate ? editingRMA.customerErrorDate.split('T')[0] : ''}
                      onChange={(e) => setEditingRMA({...editingRMA, customerErrorDate: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Workflow Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Status & Workflow</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Status *</label>
                    <div className="text-xs text-red-400 mb-1">Debug: Current status value = "{editingRMA.caseStatus}"</div>
                    <select
                      value={editingRMA.caseStatus}
                      onChange={(e) => {
                        console.log('Status changed from', editingRMA.caseStatus, 'to', e.target.value);
                        setEditingRMA({...editingRMA, caseStatus: e.target.value});
                      }}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      onFocus={() => console.log('Status dropdown focused, current value:', editingRMA.caseStatus)}
                      onMouseEnter={() => console.log('Status dropdown hovered, current value:', editingRMA.caseStatus)}
                    >
                      <option value="Open">Open</option>
                      <option value="Under Review">Under Review</option>
                      <option value="RMA Raised Yet to Deliver">RMA Raised Yet to Deliver</option>
                      <option value="Sent to CDS">Sent to CDS</option>
                      <option value="Faulty Transit to CDS">Faulty Transit to CDS</option>
                      <option value="CDS Approved">CDS Approved</option>
                      <option value="Replacement Shipped">Replacement Shipped</option>
                      <option value="Replacement Received">Replacement Received</option>
                      <option value="Installation Complete">Installation Complete</option>
                      <option value="Faulty Part Returned">Faulty Part Returned</option>
                      <option value="CDS Confirmed Return">CDS Confirmed Return</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Priority</label>
                    <select
                      value={editingRMA.priority}
                      onChange={(e) => setEditingRMA({...editingRMA, priority: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Warranty Status</label>
                    <select
                      value={editingRMA.warrantyStatus}
                      onChange={(e) => setEditingRMA({...editingRMA, warrantyStatus: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="In Warranty">In Warranty</option>
                      <option value="Extended Warranty">Extended Warranty</option>
                      <option value="Out of Warranty">Out of Warranty</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Approval Status</label>
                    <div className="text-xs text-blue-400 mb-1">Debug: Current approvalStatus = "{editingRMA.approvalStatus}"</div>
                    <select
                      value={editingRMA.approvalStatus}
                      onChange={(e) => setEditingRMA({...editingRMA, approvalStatus: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Under Investigation">Under Investigation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Condition and Assessment Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Condition & Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Physical Condition</label>
                    <select
                      value={editingRMA.physicalCondition}
                      onChange={(e) => setEditingRMA({...editingRMA, physicalCondition: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Logical Condition</label>
                    <select
                      value={editingRMA.logicalCondition}
                      onChange={(e) => setEditingRMA({...editingRMA, logicalCondition: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="Good">Good</option>
                      <option value="Faulty">Faulty</option>
                      <option value="Degraded">Degraded</option>
                      <option value="Partial Failure">Partial Failure</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Created By</label>
                    <Input
                      value={editingRMA.createdBy || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, createdBy: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Created by"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Technician</label>
                    <Input
                      value={editingRMA.technician || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, technician: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Technician name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Assigned To</label>
                    <Select 
                      value={editingRMA.assignedTo || ''} 
                      onValueChange={(value) => setEditingRMA({...editingRMA, assignedTo: value})}
                      disabled={isLoadingTechnicalHeads}
                    >
                      <SelectTrigger className="mt-1 bg-dark-bg border-dark-color text-dark-primary">
                        <SelectValue placeholder={isLoadingTechnicalHeads ? "Loading technical heads..." : "Select Technical Head"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {technicalHeads.map((technicalHead) => (
                          <SelectItem key={technicalHead.userId} value={technicalHead.userId}>
                            {technicalHead.profile?.firstName && technicalHead.profile?.lastName 
                              ? `${technicalHead.profile.firstName} ${technicalHead.profile.lastName}`
                              : technicalHead.username} ({technicalHead.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {technicalHeads.length === 0 && !isLoadingTechnicalHeads && (
                      <p className="text-xs text-amber-600 mt-1">
                        No technical heads found.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Estimated Cost (₹)</label>
                    <Input
                      type="number"
                      value={editingRMA.estimatedCost || 0}
                      onChange={(e) => setEditingRMA({...editingRMA, estimatedCost: Number(e.target.value)})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Days Count Shipped to Site</label>
                    <Input
                      type="number"
                      value={editingRMA.daysCountShippedToSite || 0}
                      onChange={(e) => setEditingRMA({...editingRMA, daysCountShippedToSite: Number(e.target.value)})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Days Count Return to CDS</label>
                    <Input
                      type="number"
                      value={editingRMA.daysCountReturnToCDS || 0}
                      onChange={(e) => setEditingRMA({...editingRMA, daysCountReturnToCDS: Number(e.target.value)})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Text Fields Section */}
              <div className="bg-dark-card p-4 rounded-lg border border-dark-color">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Text Fields</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Remarks</label>
                    <textarea
                      value={editingRMA.remarks || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, remarks: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={2}
                      placeholder="Additional remarks"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Issue Description</label>
                    <textarea
                      value={editingRMA.issueDescription || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, issueDescription: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={2}
                      placeholder="Issue description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">RMA Reason</label>
                    <textarea
                      value={editingRMA.rmaReason || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, rmaReason: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={2}
                      placeholder="RMA reason"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Notes</label>
                    <textarea
                      value={editingRMA.notes || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, notes: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={3}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateRMA}
                disabled={isLoading}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update RMA'
                )}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Serial Number Selector Modal */}
      {showSerialNumberSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Select Serial Number</h2>
              <button 
                onClick={() => {
                  setShowSerialNumberSelector(false);
                  setSerialNumberSearch("");
                }}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Search serial numbers, part names, or brands..."
                value={serialNumberSearch}
                onChange={(e) => setSerialNumberSearch(e.target.value)}
                className="w-full bg-dark-card border-dark-color text-dark-primary"
              />
            </div>

                        <div className="space-y-3">
              {(() => {
                const filteredProjectors = (availableProjectors || []).filter(projector => 
                  (projector.serialNumber || '').toLowerCase().includes(serialNumberSearch.toLowerCase()) ||
                  (projector.model || '').toLowerCase().includes(serialNumberSearch.toLowerCase()) ||
                  (projector.brand || '').toLowerCase().includes(serialNumberSearch.toLowerCase()) ||
                  (projector.siteName || '').toLowerCase().includes(serialNumberSearch.toLowerCase())
                );
                
                if (filteredProjectors.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-dark-secondary mx-auto mb-4" />
                      <p className="text-dark-secondary">No projectors found matching your search.</p>
                    </div>
                  );
                }
                
                return filteredProjectors.map((projector, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSerialNumberSelect(projector)}
                    className="p-4 border border-dark-color rounded-lg hover:bg-dark-hover cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-blue-400">{projector.serialNumber}</span>
                          <Badge className={`text-white text-xs ${
                            projector.status === 'Active' ? 'bg-green-600' : 
                            projector.status === 'Under Service' ? 'bg-yellow-600' : 
                            projector.status === 'Needs Repair' ? 'bg-red-600' : 'bg-gray-600'
                          }`}>
                            {projector.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-dark-secondary">Model:</span>
                            <p className="text-dark-primary font-medium">{projector.model}</p>
                          </div>
                          <div>
                            <span className="text-dark-secondary">Brand:</span>
                            <p className="text-dark-primary font-medium">{projector.brand}</p>
                          </div>
                          <div>
                            <span className="text-dark-secondary">Site:</span>
                            <p className="text-dark-primary font-medium">{projector.siteName || 'Site not linked'}</p>
                          </div>
                          <div>
                            <span className="text-dark-secondary">Location:</span>
                            <p className="text-dark-primary font-medium">{projector.location}</p>
                          </div>
                          <div>
                            <span className="text-dark-secondary">Technician:</span>
                            <p className="text-dark-primary font-medium">{projector.technician}</p>
                          </div>
                          <div>
                            <span className="text-dark-secondary">Warranty:</span>
                            <p className="text-dark-primary font-medium">{projector.warrantyStatus || 'Active'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => {
                  setShowSerialNumberSelector(false);
                  setSerialNumberSearch("");
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Component Modal */}
      {showImportComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">RMA Data Import</h2>
              <Button 
                onClick={() => {
                  setShowImportComponent(false);
                  refreshRMA(); // Refresh RMA data after import
                }}
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <RMAImport />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Advanced RMA Search</h2>
              <Button 
                onClick={() => setShowAdvancedSearch(false)}
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <AdvancedRMASearch 
                onRmaSelect={(rma) => {
                  setSelectedRMA(rma);
                  setShowAdvancedSearch(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* DTR Assignment Dialog */}
      {showAssignDTRDialog && selectedDTRForAssignment && (
        <AssignDTRToTechnicalHeadDialog
          open={showAssignDTRDialog}
          onOpenChange={setShowAssignDTRDialog}
          dtrId={selectedDTRForAssignment._id}
          dtrCaseId={selectedDTRForAssignment.caseId}
          currentAssignee={selectedDTRForAssignment.assignedTo}
          onAssigned={handleDTRAssigned}
        />
      )}
      </main>
    </>
  );
}