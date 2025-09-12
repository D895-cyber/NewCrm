import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
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
  Activity
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV, generateLabel, printLabel } from "../../utils/export";
import { useData } from "../../contexts/DataContext";



export function RMAPage() {
  const { rma: rmaItems, refreshRMA, isLoading: dataLoading } = useData();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [localRMAItems, setLocalRMAItems] = useState<any[]>([]);
  
  // Map backend data to frontend display format
  const mapBackendDataToFrontend = (backendRMA: any) => {
    return {
      _id: backendRMA._id,
      rmaNumber: backendRMA.rmaNumber || backendRMA.rmaNumber || 'N/A',
      callLogNumber: backendRMA.callLogNumber || backendRMA.callLogNumber || 'N/A',
      rmaOrderNumber: backendRMA.rmaOrderNumber || backendRMA.rmaOrderNumber || 'N/A',
      ascompRaisedDate: backendRMA.ascompRaisedDate ? new Date(backendRMA.ascompRaisedDate).toLocaleDateString() : 
                        backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
      customerErrorDate: backendRMA.customerErrorDate ? new Date(backendRMA.customerErrorDate).toLocaleDateString() : 
                         backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
      siteName: backendRMA.siteName || backendRMA.customerSite || 'N/A',
      productName: backendRMA.productName || backendRMA.projectorModel || 'N/A',
      productPartNumber: backendRMA.productPartNumber || backendRMA.partNumber || 'N/A',
      serialNumber: backendRMA.serialNumber || backendRMA.projectorSerial || 'N/A',
      defectivePartNumber: backendRMA.defectivePartNumber || backendRMA.partNumber || 'N/A',
      defectivePartName: backendRMA.defectivePartName || backendRMA.partName || 'Projector Component',
      defectiveSerialNumber: backendRMA.defectiveSerialNumber || backendRMA.projectorSerial || 'N/A',
      symptoms: backendRMA.symptoms || backendRMA.failureDescription || backendRMA.reason || 'N/A',
      replacedPartNumber: backendRMA.replacedPartNumber || 'N/A',
      replacedPartName: backendRMA.replacedPartName || 'N/A',
      replacedPartSerialNumber: backendRMA.replacedPartSerialNumber || 'N/A',
      replacementNotes: backendRMA.replacementNotes || 'N/A',
      shippedDate: backendRMA.shippedDate ? new Date(backendRMA.shippedDate).toLocaleDateString() : 'N/A',
      trackingNumber: backendRMA.trackingNumber || 'N/A',
      shippedThru: backendRMA.shippedThru || 'N/A',
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
      console.log('Mapped RMA data:', mappedData);
    } else {
      setLocalRMAItems([]);
    }
  }, [rmaItems]);
  
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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [selectedRMA, setSelectedRMA] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRMA, setEditingRMA] = useState<any>(null);
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

  const filteredRMAs = (localRMAItems || []).filter(rma => {
    const matchesSearch = (rma.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.rmaNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rma.defectivePartName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || rma.caseStatus === filterStatus;
    const matchesPriority = filterPriority === "All" || rma.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Review":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "Replacement Approved":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Repair In Progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Completed":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border border-red-200";
      case "Sent to CDS":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "CDS Approved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Replacement Shipped":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
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
      case "Replacement Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Repair In Progress":
        return <AlertTriangle className="w-4 h-4" />;
      case "In Progress":
        return <AlertTriangle className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <RotateCcw className="w-4 h-4" />;
    }
  };

  const handleCreateRMA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
        rmaNumber: newRMA.rmaNumber,
        callLogNumber: newRMA.callLogNumber,
        rmaOrderNumber: newRMA.rmaOrderNumber,
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
      
      setEditingRMA(freshRMA);
      console.log('Set editingRMA to fresh data:', freshRMA);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch fresh RMA data:', error);
      // Fallback to using the passed RMA data
      setEditingRMA({ ...rma });
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
      
      // Update RMA via API
      await apiClient.updateRMA(editingRMA._id, editingRMA);
      
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

  const handleExportRMA = async () => {
    try {
      setIsLoading(true);
      const csvContent = convertToCSV(rmaItems || [], [
        'rmaNumber', 'projectorSerial', 'partName', 'brand', 'projectorModel', 'customerSite', 'status', 'priority', 'estimatedCost', 'warrantyStatus'
      ]);
      downloadCSV(csvContent, `rma_report_${new Date().toISOString().split('T')[0]}.csv`);
      
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
      
      const labelContent = generateLabel(rma, 'rma');
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
                await refreshRMA();
                setForceUpdate(prev => prev + 1);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-blue-400/30 hover:shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
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
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100 opacity-90">In Progress</p>
                <p className="text-3xl font-bold text-white">{localRMAItems.filter(r => r.caseStatus === 'In Progress' || r.caseStatus === 'Repair In Progress').length}</p>
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
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-gray-50">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search RMA number, serial number, part, or site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 h-11"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px] h-11"
              >
                <option value="All">All Status</option>
                <option value="Under Review">Under Review</option>
                <option value="Replacement Approved">Replacement Approved</option>
                <option value="Repair In Progress">Repair In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="In Progress">In Progress</option>
              </select>
              
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px] h-11"
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
              }}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 px-6"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || filterStatus !== "All" || filterPriority !== "All") && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
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
              </div>
            </div>
          )}
        </div>

              {/* RMA Table */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">RMA Records</h2>
          <p className="text-sm text-gray-600 mt-1">Showing {filteredRMAs.length} RMA records</p>
        </div>
        <div className="overflow-x-auto">
          {filteredRMAs.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RMAs Found</h3>
              <p className="text-gray-500 mb-4">No RMA records match your current filters.</p>
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
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-200">
                  <th className="text-left font-bold text-gray-800 py-4 px-4 border-r border-gray-200 text-sm uppercase tracking-wide">RMA #</th>
                  <th className="text-left font-bold text-gray-800 py-4 px-4 border-r border-gray-200 text-sm uppercase tracking-wide">Site & Product</th>
                  <th className="text-left font-bold text-gray-800 py-4 px-4 border-r border-gray-200 text-sm uppercase tracking-wide">Defective Part</th>
                  <th className="text-left font-bold text-gray-800 py-4 px-4 border-r border-gray-200 text-sm uppercase tracking-wide">Replacement Part</th>
                  <th className="text-left font-bold text-gray-800 py-4 px-4 border-r border-gray-200 text-sm uppercase tracking-wide">Status & Priority</th>
                  <th className="text-left font-bold text-gray-800 py-4 px-4 border-r border-gray-200 text-sm uppercase tracking-wide">Dates & Tracking</th>
                  <th className="text-center font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody key={`rma-tbody-${forceUpdate}`}>
                {filteredRMAs.map((rma, index) => (
                  <tr key={`${rma._id}-${forceUpdate}`} className={`border-b border-gray-100 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 hover:shadow-sm`}>
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="space-y-1">
                        <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer text-base">
                          {rma.rmaNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Call: {rma.callLogNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Order: {rma.rmaOrderNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-800 text-sm">
                          {rma.siteName || 'N/A'}
                        </div>
                        <div className="text-gray-700 text-sm">
                          {rma.productName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 font-mono">
                          SN: {rma.serialNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Part: {rma.productPartNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="space-y-1">
                        <div className="text-gray-700 text-sm">
                          {rma.defectivePartName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Part: {rma.defectivePartNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Serial: {rma.defectiveSerialNumber || 'N/A'}
                        </div>
                        {rma.symptoms && rma.symptoms !== 'N/A' && (
                          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded" title={rma.symptoms}>
                            {rma.symptoms}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="space-y-1">
                        <div className="text-gray-700 text-sm">
                          {rma.replacedPartName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Part: {rma.replacedPartNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Serial: {rma.replacedPartSerialNumber || 'N/A'}
                        </div>
                        {rma.replacementNotes && rma.replacementNotes !== 'N/A' && (
                          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded" title={rma.replacementNotes}>
                            {rma.replacementNotes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rma.caseStatus || 'Under Review')}`}>
                          {rma.caseStatus || 'Under Review'}
                        </span>
                        <div className="text-xs text-gray-600">
                          Priority: <span className={`font-semibold ${getPriorityColor(rma.priority || 'Medium')}`}>
                            {rma.priority || 'Medium'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Created by: {rma.createdBy || 'System'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="space-y-1 text-xs">
                        <div className="text-gray-600">
                          <span className="font-medium">Raised:</span> {rma.ascompRaisedDate || 'N/A'}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Error:</span> {rma.customerErrorDate || 'N/A'}
                        </div>
                        {rma.shippedDate && rma.shippedDate !== 'N/A' && (
                          <div className="text-green-600">
                            <span className="font-medium">Shipped:</span> {rma.shippedDate}
                          </div>
                        )}
                        {rma.trackingNumber && rma.trackingNumber !== 'N/A' && (
                          <div className="text-blue-600 font-mono">
                            <span className="font-medium">Track:</span> {rma.trackingNumber}
                          </div>
                        )}
                        {rma.shippedThru && rma.shippedThru !== 'N/A' && (
                          <div className="text-gray-600">
                            <span className="font-medium">Via:</span> {rma.shippedThru}
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
                      <p className="text-dark-primary">{selectedRMA.partName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Part Number</label>
                      <p className="text-dark-primary">{selectedRMA.productPartNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Serial Number</label>
                      <p className="text-dark-primary">{selectedRMA.serialNumber}</p>
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
                      <p className="text-dark-primary">{selectedRMA.assignedTo}</p>
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
                      <p className="text-dark-primary font-semibold">₹{selectedRMA.estimatedCost.toLocaleString()}</p>
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
      </main>

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
                  <label className="text-sm font-medium text-dark-secondary">RMA Number *</label>
                  <Input
                    value={newRMA.rmaNumber}
                    onChange={(e) => setNewRMA({...newRMA, rmaNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="RMA-2024-XXX"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Brand *</label>
                  <Input
                    value={newRMA.brand}
                    onChange={(e) => setNewRMA({...newRMA, brand: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Projector Model *</label>
                  <Input
                    value={newRMA.productName}
                    onChange={(e) => setNewRMA({...newRMA, productName: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter projector model"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Serial Number</label>
                  <div className="flex gap-2">
                    <Input
                      value={newRMA.serialNumber}
                      onChange={(e) => setNewRMA({...newRMA, serialNumber: e.target.value})}
                      className="mt-1 flex-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Enter serial number"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSerialNumberSelector(true)}
                      className="mt-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Select
                    </button>
                  </div>
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
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Technician</label>
                  <Input
                    value={newRMA.technician}
                    onChange={(e) => setNewRMA({...newRMA, technician: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter technician name"
                  />
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
                disabled={isLoading || !newRMA.rmaNumber || !newRMA.productPartNumber || !newRMA.productName || !newRMA.rmaReason}
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
                      onChange={(e) => setEditingRMA({...editingRMA, rmaNumber: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="RMA-2024-XXX"
                    />
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
                      <option value="Under Review">Under Review</option>
                      <option value="Sent to CDS">Sent to CDS</option>
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
                    <Input
                      value={editingRMA.assignedTo || ''}
                      onChange={(e) => setEditingRMA({...editingRMA, assignedTo: e.target.value})}
                      className="mt-1 bg-dark-bg border-dark-color text-dark-primary"
                      placeholder="Assigned to"
                    />
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
                  (projector.site || '').toLowerCase().includes(serialNumberSearch.toLowerCase())
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
                            <p className="text-dark-primary font-medium">{projector.site}</p>
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
    </>
  );
}