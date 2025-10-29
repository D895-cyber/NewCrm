import { useState, useEffect } from "react";
import { 
  Plus, 
  Filter, 
  User, 
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Wrench,
  Monitor,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { apiClient } from "../../utils/api/client";
import { useAuth } from "../../contexts/AuthContext";
import DTRBulkImport from "../DTRBulkImport";

interface DTR {
  _id: string;
  caseId: string;
  serialNumber: string;
  siteName: string;
  siteCode: string;
  region: string;
  auditorium: string;
  complaintDescription: string;
  complaintDate: string;
  // New fields from the image
  errorDate: string;
  unitModel: string;
  problemName: string;
  actionTaken: string;
  remarks: string;
  callStatus: string;
  caseSeverity: string;
  openedBy: {
    name: string;
    designation: string;
    contact: string;
    userId?: string;
  };
  closedBy?: {
    name: string;
    designation: string;
    contact: string;
    userId?: string;
    closedDate: string;
  };
  status: string;
  closedReason?: string;
  closedRemarks?: string;
  rmaCaseNumber?: string;
  priority: string;
  assignedTo?: string | { name: string; role?: string; assignedDate?: Date };
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  notes?: string;
  attachments: string[];
  projectorDetails?: {
    model: string;
    brand: string;
    installDate: string;
    warrantyEnd: string;
    lastService: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectorInfo {
  serialNumber: string;
  model: string;
  brand: string;
  installDate: string;
  warrantyEnd: string;
  lastService: string;
  auditoriumId?: string;
  site: {
    name: string;
    code: string;
    region: string;
    address: any;
    auditoriums: any[];
  };
}

export function DTRPage() {
  const { token, isAuthenticated, user } = useAuth();
  const [technicalHeads, setTechnicalHeads] = useState<any[]>([]);
  const [isLoadingTechnicalHeads, setIsLoadingTechnicalHeads] = useState(false);
  const [dtrs, setDtrs] = useState<DTR[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDTR, setSelectedDTR] = useState<DTR | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("");
  const [serialFilter, setSerialFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // New filter states
  const [callStatusFilter, setCallStatusFilter] = useState("all");
  const [caseSeverityFilter, setCaseSeverityFilter] = useState("all");

  // Form states
  const [formData, setFormData] = useState({
    serialNumber: "",
    complaintDescription: "",
    openedBy: {
      name: "",
      designation: "",
      contact: ""
    },
    priority: "Medium",
    assignedTo: "unassigned",
    estimatedResolutionTime: "",
    notes: "",
    // New fields
    errorDate: new Date().toISOString().split('T')[0],
    unitModel: "",
    problemName: "",
    actionTaken: "",
    remarks: "",
    callStatus: "Open",
    caseSeverity: "Minor"
  });

  const [editFormData, setEditFormData] = useState({
    status: "",
    closedReason: undefined as string | undefined,
    closedBy: {
      name: "",
      designation: "",
      contact: ""
    },
    assignedTo: "",
    priority: "",
    estimatedResolutionTime: "",
    actualResolutionTime: "",
    notes: "",
    // New fields
    callStatus: "",
    caseSeverity: "",
    actionTaken: "",
    remarks: "",
    closedRemarks: ""
  });

  const [projectorInfo, setProjectorInfo] = useState<ProjectorInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDTRForAssignment, setSelectedDTRForAssignment] = useState<DTR | null>(null);
  const [assignFormData, setAssignFormData] = useState({
    assignedTo: "",
    files: [] as File[]
  });

  // Bulk delete state
  const [selectedDTRs, setSelectedDTRs] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // DTR to RMA conversion state
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedDTRForConversion, setSelectedDTRForConversion] = useState<DTR | null>(null);
  const [conversionReason, setConversionReason] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    console.log('DTR Page useEffect triggered with:', {
      currentPage,
      statusFilter,
      priorityFilter,
      siteFilter,
      serialFilter,
      startDate,
      endDate,
      callStatusFilter,
      caseSeverityFilter
    });
    
    // Load data when component mounts or when filters change
    loadDTRs();
    
    // Always load stats
    loadStats();
  }, [currentPage, statusFilter, priorityFilter, siteFilter, serialFilter, startDate, endDate, callStatusFilter, caseSeverityFilter]);

  // Set auth token in API client when component mounts
  useEffect(() => {
    console.log('API Client base URL:', apiClient.getBaseUrl());
    if (token) {
      console.log('Setting auth token:', token.substring(0, 20) + '...');
      apiClient.setAuthToken(token);
      console.log('Auth token set in API client');
    } else {
      console.log('No auth token available');
    }
  }, [token]);

  // Reset form when Create DTR dialog opens
  useEffect(() => {
    if (showCreateDialog) {
      console.log('Create DTR dialog opened, resetting form...');
      resetForm();
    }
  }, [showCreateDialog]);

  // Load technical heads when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadTechnicalHeads();
    }
  }, [isAuthenticated]);

  const loadTechnicalHeads = async () => {
    setIsLoadingTechnicalHeads(true);
    try {
      const response = await apiClient.get('/dtr/users/technical-heads');
      console.log('🔍 Technical Heads API Response:', response);
      console.log('🔍 Technical Heads loaded:', response.data || response);
      
      // Debug: Check roles of loaded users
      const users = response.data || response;
      console.log('🔍 User roles:', users.map((user: any) => ({
        userId: user.userId,
        username: user.username,
        role: user.role,
        email: user.email
      })));
      
      setTechnicalHeads(users);
    } catch (error) {
      console.error('Error loading technical heads:', error);
    } finally {
      setIsLoadingTechnicalHeads(false);
    }
  };

  const loadDTRs = async () => {
    console.log('loadDTRs called with:', { isAuthenticated, hasToken: !!token });
    if (!isAuthenticated || !token) {
      setError('Please log in to view DTRs');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
      if (siteFilter) params.append("siteName", siteFilter);
      if (serialFilter) params.append("serialNumber", serialFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      // New filters
      if (callStatusFilter && callStatusFilter !== "all") params.append("callStatus", callStatusFilter);
      if (caseSeverityFilter && caseSeverityFilter !== "all") params.append("caseSeverity", caseSeverityFilter);

      const endpoint = `/dtr?${params.toString()}`;
      console.log('Making API request to:', endpoint);
      
      const response = await apiClient.get(endpoint);
      console.log('DTR API Response:', response); // Debug log
      
      // The API client returns the parsed JSON data directly
      if (response && response.dtrs) {
        setDtrs(response.dtrs);
        setTotalPages(response.totalPages || 1);
      } else {
        // Fallback - empty response
        console.warn('Unexpected API response structure:', response);
        setDtrs([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error loading DTRs:", error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to load DTRs: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    try {
      const response = await apiClient.get("/dtr/stats/overview");
      console.log('Stats API Response:', response); // Debug log
      setStats(response);
    } catch (error: any) {
      console.error("Error loading stats:", error);
      // Don't show error for stats as it's not critical
      // But set default stats to prevent UI issues
      setStats({
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        shiftedToRMA: 0,
        priorityBreakdown: [],
        monthlyTrend: []
      });
    }
  };

  const handleSerialNumberLookup = async (serialNumber: string) => {
    if (!isAuthenticated || !token) {
      setError('Please log in to lookup projector information');
      return;
    }

    if (!serialNumber.trim()) {
      setProjectorInfo(null);
      return;
    }

    try {
      setLookupLoading(true);
      const response = await apiClient.get(`/dtr/lookup/projector/${serialNumber}`);
      console.log('Projector lookup response:', response); // Debug log
      setProjectorInfo(response);
    } catch (error) {
      console.error("Error looking up projector:", error);
      setProjectorInfo(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const validateForm = () => {
    console.log('Validating form with data:', formData);
    console.log('Serial number:', formData.serialNumber, 'trimmed:', formData.serialNumber?.trim());
    console.log('Complaint description:', formData.complaintDescription, 'trimmed:', formData.complaintDescription?.trim());
    console.log('Opened by name:', formData.openedBy.name, 'trimmed:', formData.openedBy.name?.trim());
    
    if (!formData.serialNumber?.trim()) return "Serial number is required";
    if (!formData.complaintDescription?.trim()) return "Complaint description is required";
    if (!formData.openedBy.name?.trim()) return "Opened by name is required";
    
    console.log('Form validation passed');
    return null;
  };

  const handleCreateDTR = async () => {
    console.log('handleCreateDTR called with formData:', formData);
    console.log('Authentication status:', { isAuthenticated, hasToken: !!token });
    
    if (!isAuthenticated || !token) {
      setError('Please log in to create DTRs');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      console.log('Validation error:', validationError);
      setError(validationError);
      return;
    }

    console.log('Form validation passed, submitting...');
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert "unassigned" back to empty string for API
      const submitData = {
        ...formData,
        assignedTo: formData.assignedTo === "unassigned" ? "" : formData.assignedTo
      };
      console.log('Making API request to /dtr with data:', submitData);
      const response = await apiClient.post("/dtr", submitData);
      console.log('Create DTR response:', response); // Debug log
      setDtrs([response, ...dtrs]);
      setShowCreateDialog(false);
      resetForm();
      loadStats();
    } catch (error: any) {
      console.error("Error creating DTR:", error);
      setError(error.message || "Failed to create DTR. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDTR = async () => {
    console.log('handleUpdateDTR called with:', { selectedDTR, editFormData });
    console.log('Authentication status:', { isAuthenticated, hasToken: !!token });
    
    if (!isAuthenticated || !token) {
      setError('Please log in to update DTRs');
      return;
    }

    if (!selectedDTR) {
      console.error('No selected DTR to update');
      setError('No DTR selected for update');
      return;
    }

    console.log('Starting DTR update...');
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare update data with proper closedReason handling
      const updateData = { 
        ...editFormData,
        assignedTo: editFormData.assignedTo === "unassigned" ? "" : editFormData.assignedTo
      };
      
      // Handle closedReason based on status - only set if it's not empty
      if (updateData.status === 'Shifted to RMA') {
        updateData.closedReason = 'Shifted to RMA';
      } else if (updateData.status === 'Closed' && !updateData.closedReason) {
        updateData.closedReason = 'Resolved'; // Default for closed status
      } else if (updateData.closedReason === '' || updateData.closedReason === undefined) {
        // Remove empty or undefined closedReason to avoid validation error
        delete updateData.closedReason;
      }
      
      console.log('Making API request to update DTR:', selectedDTR._id);
      console.log('Update data:', updateData);
      
      const response = await apiClient.put(`/dtr/${selectedDTR._id}`, updateData);
      console.log('Update DTR response:', response); // Debug log
      
      // Update the DTRs list with the updated DTR
      setDtrs(dtrs.map(dtr => dtr._id === selectedDTR._id ? response : dtr));
      setShowEditDialog(false);
      setSelectedDTR(null);
      loadStats();
      
      console.log('DTR updated successfully');
    } catch (error: any) {
      console.error("Error updating DTR:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.message || "Failed to update DTR. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDTR = async (dtrId: string) => {
    if (!isAuthenticated || !token) {
      setError('Please log in to delete DTRs');
      return;
    }

    if (!confirm("Are you sure you want to delete this DTR?")) return;

    try {
      await apiClient.delete(`/dtr/${dtrId}`);
      setDtrs(dtrs.filter(dtr => dtr._id !== dtrId));
      loadStats();
    } catch (error) {
      console.error("Error deleting DTR:", error);
    }
  };

  const handleAssignDTR = async () => {
    if (!isAuthenticated || !token) {
      setError('Please log in to assign DTRs');
      return;
    }

    if (!selectedDTRForAssignment) {
      setError('No DTR selected for assignment');
      return;
    }

    if (!assignFormData.assignedTo) {
      setError('Please select a technical head');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get technical head details
      const technicalHead = technicalHeads.find(th => th.userId === assignFormData.assignedTo);
      if (!technicalHead) {
        throw new Error('Selected technical head not found');
      }

      console.log('🔍 Selected Technical Head:', {
        userId: technicalHead.userId,
        username: technicalHead.username,
        role: technicalHead.role,
        email: technicalHead.email
      });

      const assignmentData = {
        technicalHeadId: technicalHead.userId,
        technicalHeadName: technicalHead.profile?.firstName && technicalHead.profile?.lastName
          ? `${technicalHead.profile.firstName} ${technicalHead.profile.lastName}`
          : technicalHead.username,
        technicalHeadEmail: technicalHead.email,
        assignedBy: 'rma_handler'
      };

      console.log('🔍 Assignment Data:', assignmentData);

      const response = await apiClient.post(`/dtr/${selectedDTRForAssignment._id}/assign-technical-head`, assignmentData);
      console.log('🔍 Assignment Response:', response);

      // Upload files if any
      if (assignFormData.files.length > 0) {
        const formData = new FormData();
        assignFormData.files.forEach((file) => {
          formData.append('files', file);
        });
        
        try {
          await apiClient.post(`/dtr/${selectedDTRForAssignment._id}/upload-files`, formData);
          console.log('Files uploaded successfully');
        } catch (fileError) {
          console.warn('Assignment successful but file upload failed:', fileError);
          // Don't fail the entire operation if file upload fails
        }
      }

      // Refresh DTRs to get the updated assignment from server
      await loadDTRs();
      setShowAssignDialog(false);
      setSelectedDTRForAssignment(null);
      setAssignFormData({ assignedTo: "", files: [] });
      await loadStats();
      
      console.log('DTR assigned successfully');
    } catch (error: any) {
      console.error("Error assigning DTR:", error);
      setError(error.message || "Failed to assign DTR. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAssignFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setAssignFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Bulk delete functions
  const handleSelectDTR = (dtrId: string) => {
    setSelectedDTRs(prev => 
      prev.includes(dtrId) 
        ? prev.filter(id => id !== dtrId)
        : [...prev, dtrId]
    );
  };

  const handleSelectAllDTRs = () => {
    if (selectedDTRs.length === dtrs.length) {
      setSelectedDTRs([]);
    } else {
      setSelectedDTRs(dtrs.map(dtr => dtr._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!isAuthenticated || !token) {
      setError('Please log in to delete DTRs');
      return;
    }

    if (selectedDTRs.length === 0) {
      setError('Please select DTRs to delete');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('🔐 Current token:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('🔐 Is authenticated:', isAuthenticated);
      
      // Ensure token is set in API client
      if (token) {
        apiClient.setAuthToken(token);
        console.log('🔐 Token set in API client');
      } else {
        throw new Error('No authentication token available');
      }
      
      const response = await apiClient.delete('/dtr/bulk-delete', {
        data: { dtrIds: selectedDTRs }
      });

      console.log('Bulk delete response:', response);
      
      // Check if response exists and has the expected structure
      if (response && (response.deletedCount !== undefined || response.data?.deletedCount !== undefined)) {
        const deletedCount = response.deletedCount || response.data?.deletedCount || 0;
        
        // Refresh the data
        await loadDTRs();
        await loadStats();
        
        // Clear selection and close dialog
        setSelectedDTRs([]);
        setShowBulkDeleteDialog(false);
        
        console.log(`Successfully deleted ${deletedCount} DTRs`);
      } else {
        console.error('Invalid response structure:', response);
        setError('Invalid response from server');
      }
    } catch (error: any) {
      console.error("Error bulk deleting DTRs:", error);
      setError(error.response?.data?.message || "Failed to delete DTRs. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConvertToRMA = async () => {
    if (!isAuthenticated || !token || !selectedDTRForConversion) {
      setError('Please log in and select a DTR to convert');
      return;
    }

    if (!conversionReason.trim()) {
      setError('Please provide a reason for converting to RMA');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      console.log('Converting DTR to RMA:', selectedDTRForConversion._id);
      
      // Ensure token is set in API client
      if (token) {
        apiClient.setAuthToken(token);
      }

      const conversionData = {
        conversionReason: conversionReason.trim(),
        convertedBy: user?.username || 'Unknown',
        convertedDate: new Date().toISOString()
      };

      const response = await apiClient.convertDTRToRMA(selectedDTRForConversion._id, conversionData);

      console.log('Conversion response:', response);

      if (response && response.success) {
        // Refresh the data
        await loadDTRs();
        await loadStats();
        
        // Close dialog and reset form
        setShowConvertDialog(false);
        setSelectedDTRForConversion(null);
        setConversionReason("");
        
        // Show success message
        alert(`DTR ${selectedDTRForConversion.caseId} successfully converted to RMA ${response.rmaNumber}`);
      } else {
        throw new Error(response?.message || 'Failed to convert DTR to RMA');
      }
    } catch (error: any) {
      console.error('Error converting DTR to RMA:', error);
      setError(error.message || 'Failed to convert DTR to RMA');
    } finally {
      setIsConverting(false);
    }
  };

  const openConvertDialog = (dtr: DTR) => {
    setSelectedDTRForConversion(dtr);
    setConversionReason("");
    setShowConvertDialog(true);
  };

  const resetForm = () => {
    setFormData({
      serialNumber: "",
      complaintDescription: "",
      openedBy: {
        name: "",
        designation: "",
        contact: ""
      },
      priority: "Medium",
      assignedTo: "unassigned",
      estimatedResolutionTime: "",
      notes: "",
      // New fields
      errorDate: new Date().toISOString().split('T')[0],
      unitModel: "",
      problemName: "",
      actionTaken: "",
      remarks: "",
      callStatus: "Open",
      caseSeverity: "Minor"
    });
    setProjectorInfo(null);
  };

  const openEditDialog = (dtr: DTR) => {
    setSelectedDTR(dtr);
    setEditFormData({
      status: dtr.status || 'Open',
      closedReason: dtr.closedReason || undefined,
      closedBy: dtr.closedBy || {
        name: "",
        designation: "",
        contact: ""
      },
      assignedTo: typeof dtr.assignedTo === 'string' ? dtr.assignedTo : dtr.assignedTo?.name || "unassigned",
      priority: dtr.priority || 'Medium',
      estimatedResolutionTime: dtr.estimatedResolutionTime || "",
      actualResolutionTime: dtr.actualResolutionTime || "",
      notes: dtr.notes || "",
      // New fields
      callStatus: dtr.callStatus || 'Open',
      caseSeverity: dtr.caseSeverity || 'Minor',
      actionTaken: dtr.actionTaken || "",
      remarks: dtr.remarks || "",
      closedRemarks: dtr.closedRemarks || ""
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (dtr: DTR) => {
    setSelectedDTR(dtr);
    setShowViewDialog(true);
  };

  const openAssignDialog = (dtr: DTR) => {
    setSelectedDTRForAssignment(dtr);
    
    // Auto-select current user if they are a technical head
    const currentUserAsTechnicalHead = technicalHeads.find(th => th.userId === user?.userId);
    const defaultAssignee = currentUserAsTechnicalHead ? user?.userId : (typeof dtr.assignedTo === 'string' ? dtr.assignedTo : dtr.assignedTo?.name || "");
    
    setAssignFormData({
      assignedTo: defaultAssignee || "",
      files: []
    });
    setShowAssignDialog(true);
  };


  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-500 text-white";
    switch (status) {
      case "Open": return "bg-red-500 text-white";
      case "In Progress": return "bg-yellow-500 text-white";
      case "Closed": return "bg-green-500 text-white";
      case "Shifted to RMA": return "bg-purple-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return "bg-gray-500 text-white";
    switch (priority) {
      case "Critical": return "bg-red-500 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-white";
      case "Low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    // SIMPLE DIRECT FIX - Handle malformed dates first
    if (typeof dateString === 'string') {
      const trimmedDate = dateString.trim();
      
      // Direct check for malformed date patterns
      if (trimmedDate.includes('+') && trimmedDate.includes('-12-31T18:30:00.000Z')) {
        console.log('🔧 SIMPLE FIX: Found malformed date:', trimmedDate);
        
        // Extract the number part
        const numberMatch = trimmedDate.match(/^\+(\d{6})-/);
        if (numberMatch) {
          const serialNumber = parseInt(numberMatch[1]);
          console.log('🔧 SIMPLE FIX: Serial number:', serialNumber);
          
          // Convert Excel serial to date
          const excelEpoch = new Date(1900, 0, 1);
          const daysSinceEpoch = serialNumber - 2;
          const fixedDate = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
          
          console.log('🔧 SIMPLE FIX: Fixed date:', fixedDate);
          console.log('🔧 SIMPLE FIX: Formatted:', fixedDate.toLocaleDateString('en-GB'));
          
          return fixedDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      }
    }
    
    try {
      let date: Date;
      
      // Handle different input types
      if (dateString && typeof dateString === 'object' && 'getTime' in dateString) {
        // It's a Date object
        date = dateString as Date;
      } else if (typeof dateString === 'string') {
        const trimmedDate = dateString.trim();
        
        // SPECIAL FIX: Handle the specific malformed date string
        if (trimmedDate === "+045825-12-31T18:30:00.000Z") {
          console.log('🔧 FIXING malformed date:', trimmedDate);
          // Extract 045825 and convert as Excel serial number
          const serialNumber = 45825;
          const excelEpoch = new Date(1900, 0, 1);
          const daysSinceEpoch = serialNumber - 2;
          date = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
          console.log('🔧 Fixed date:', date);
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
        
        // Handle ISO date strings (from MongoDB)
        if (trimmedDate.includes('T') || trimmedDate.includes('Z')) {
          date = new Date(trimmedDate);
        }
        // Handle DD/MM/YYYY format
        else if (trimmedDate.includes('/') && trimmedDate.split('/').length === 3) {
          const parts = trimmedDate.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            // Validate the parts
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              date = new Date(year, month - 1, day);
            } else {
              return 'Invalid Date';
            }
          } else {
            date = new Date(trimmedDate);
          }
        }
        // Handle DD-MM-YYYY format
        else if (trimmedDate.includes('-') && trimmedDate.split('-').length === 3) {
          const parts = trimmedDate.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            // Validate the parts
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              date = new Date(year, month - 1, day);
            } else {
              return 'Invalid Date';
            }
          } else {
            date = new Date(trimmedDate);
          }
        }
        // Handle DDMMYY format (6 digits) - like "250623", "250624"
        else if (/^\d{6}$/.test(trimmedDate)) {
          // This looks like DDMMYY format
          const day = parseInt(trimmedDate.substring(0, 2));
          const month = parseInt(trimmedDate.substring(2, 4));
          const year = parseInt(trimmedDate.substring(4, 6));
          
          // Convert 2-digit year to 4-digit year
          const fullYear = year < 50 ? 2000 + year : 1900 + year;
          
          // Validate the parts
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
            date = new Date(fullYear, month - 1, day);
          } else {
            return 'Invalid Date';
          }
        }
        // Handle other Excel serial numbers (pure numbers)
        else if (/^\d+$/.test(trimmedDate)) {
          const serialNumber = parseInt(trimmedDate);
          if (!isNaN(serialNumber) && serialNumber > 0 && serialNumber < 100000) {
            // Convert Excel serial number to date
            date = new Date(serialNumber * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
          } else {
            return 'Invalid Date';
          }
        }
        // Handle malformed date strings like "+045825-12-31T18:30:00.000Z"
        else if (trimmedDate.includes('+') && trimmedDate.includes('-12-31T18:30:00.000Z')) {
          console.log('🔧 Processing malformed date:', trimmedDate);
          // Extract the number part before the malformed date
          const numberMatch = trimmedDate.match(/^\+(\d+)-/);
          if (numberMatch) {
            const numberStr = numberMatch[1];
            console.log('🔧 Extracted number:', numberStr);
            // This is an Excel serial number, convert it properly
            const serialNumber = parseInt(numberStr);
            if (!isNaN(serialNumber) && serialNumber > 0) {
              console.log('🔧 Serial number:', serialNumber);
              // Excel serial number conversion (Excel epoch is 1900-01-01)
              const excelEpoch = new Date(1900, 0, 1);
              const daysSinceEpoch = serialNumber - 2; // Excel leap year bug correction
              date = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
              console.log('🔧 Converted date:', date);
              console.log('🔧 Formatted date:', date.toLocaleDateString('en-GB'));
            } else {
              console.log('🔧 Invalid serial number');
              return 'Invalid Date';
            }
          } else {
            console.log('🔧 No number match found');
            return 'Invalid Date';
          }
        }
        // Handle other string formats
        else {
          date = new Date(trimmedDate);
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      // Check for reasonable date range
      if (date.getFullYear() > 2100 || date.getFullYear() < 1900) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      let date: Date;
      
      // SPECIAL FIX: Handle the specific malformed date string
      if (typeof dateString === 'string' && dateString.trim() === "+045825-12-31T18:30:00.000Z") {
        console.log('🔧 FIXING malformed date in formatDateTime:', dateString);
        const serialNumber = 45825;
        const excelEpoch = new Date(1900, 0, 1);
        const daysSinceEpoch = serialNumber - 2;
        date = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
        console.log('🔧 Fixed date:', date);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle different input types
      if (dateString && typeof dateString === 'object' && 'getTime' in dateString) {
        date = dateString as Date;
      } else if (typeof dateString === 'string') {
        const trimmedDate = dateString.trim();
        
        // Handle ISO date strings (from MongoDB)
        if (trimmedDate.includes('T') || trimmedDate.includes('Z')) {
          date = new Date(trimmedDate);
        }
        // Handle DD/MM/YYYY format
        else if (trimmedDate.includes('/') && trimmedDate.split('/').length === 3) {
          const parts = trimmedDate.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            // Validate the parts
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              date = new Date(year, month - 1, day);
            } else {
              return 'Invalid Date';
            }
          } else {
            date = new Date(trimmedDate);
          }
        }
        // Handle DD-MM-YYYY format
        else if (trimmedDate.includes('-') && trimmedDate.split('-').length === 3) {
          const parts = trimmedDate.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            // Validate the parts
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              date = new Date(year, month - 1, day);
            } else {
              return 'Invalid Date';
            }
          } else {
            date = new Date(trimmedDate);
          }
        }
        // Handle DDMMYY format (6 digits) - like "250623", "250624"
        else if (/^\d{6}$/.test(trimmedDate)) {
          // This looks like DDMMYY format
          const day = parseInt(trimmedDate.substring(0, 2));
          const month = parseInt(trimmedDate.substring(2, 4));
          const year = parseInt(trimmedDate.substring(4, 6));
          
          // Convert 2-digit year to 4-digit year
          const fullYear = year < 50 ? 2000 + year : 1900 + year;
          
          // Validate the parts
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
            date = new Date(fullYear, month - 1, day);
          } else {
            return 'Invalid Date';
          }
        }
        // Handle other Excel serial numbers (pure numbers)
        else if (/^\d+$/.test(trimmedDate)) {
          const serialNumber = parseInt(trimmedDate);
          if (!isNaN(serialNumber) && serialNumber > 0 && serialNumber < 100000) {
            // Convert Excel serial number to date
            date = new Date(serialNumber * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
          } else {
            return 'Invalid Date';
          }
        }
        // Handle malformed date strings like "+045825-12-31T18:30:00.000Z"
        else if (trimmedDate.includes('+') && trimmedDate.includes('-12-31T18:30:00.000Z')) {
          console.log('🔧 Processing malformed date:', trimmedDate);
          // Extract the number part before the malformed date
          const numberMatch = trimmedDate.match(/^\+(\d+)-/);
          if (numberMatch) {
            const numberStr = numberMatch[1];
            console.log('🔧 Extracted number:', numberStr);
            // This is an Excel serial number, convert it properly
            const serialNumber = parseInt(numberStr);
            if (!isNaN(serialNumber) && serialNumber > 0) {
              console.log('🔧 Serial number:', serialNumber);
              // Excel serial number conversion (Excel epoch is 1900-01-01)
              const excelEpoch = new Date(1900, 0, 1);
              const daysSinceEpoch = serialNumber - 2; // Excel leap year bug correction
              date = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
              console.log('🔧 Converted date:', date);
              console.log('🔧 Formatted date:', date.toLocaleDateString('en-GB'));
            } else {
              console.log('🔧 Invalid serial number');
              return 'Invalid Date';
            }
          } else {
            console.log('🔧 No number match found');
            return 'Invalid Date';
          }
        }
        // Handle other string formats
        else {
          date = new Date(trimmedDate);
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      // Check for obviously wrong dates (like year 45846)
      if (date.getFullYear() > 2100 || date.getFullYear() < 1900) {
        return 'Invalid Date';
      }
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('DateTime formatting error:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  };

  return (
    <div className="mx-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 max-w-full overflow-x-hidden px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daily Trouble Reports</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage and track daily trouble reports from sites</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => window.location.hash = '#dtr-reports'} 
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50 text-xs sm:text-sm"
            disabled={!isAuthenticated}
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reports & Analytics</span>
            <span className="sm:hidden">Reports</span>
          </Button>
          <Button 
            onClick={() => setShowBulkImport(true)} 
            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            disabled={!isAuthenticated}
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Bulk Import</span>
            <span className="sm:hidden">Import</span>
          </Button>
          {selectedDTRs.length > 0 && (
            <Button 
              onClick={() => setShowBulkDeleteDialog(true)} 
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
              disabled={!isAuthenticated}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Delete Selected ({selectedDTRs.length})</span>
              <span className="sm:hidden">Delete ({selectedDTRs.length})</span>
            </Button>
          )}
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
            disabled={!isAuthenticated}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New DTR</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Authentication Check */}
      {!isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">Please log in to access DTR functionality</span>
          </div>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800">
              Authenticated as: {user?.username || user?.profile?.firstName || 'Unknown'} 
              (Role: {user?.role || 'Unknown'})
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-700">
            <strong>User ID:</strong> {user?.userId || 'N/A'} | 
            <strong> Email:</strong> {user?.email || 'N/A'}
          </div>
          {technicalHeads.length > 0 && (
            <div className="mt-2 text-xs text-blue-700">
              <strong>Available Technical Heads:</strong> {technicalHeads.length} 
              {technicalHeads.map((th, index) => (
                <span key={th.userId}>
                  {index > 0 && ', '}
                  {th.username} ({th.userId})
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  loadDTRs();
                }}
                className="text-red-600 hover:text-red-700 border-red-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && isAuthenticated && (
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          <Card className="min-w-0 overflow-hidden p-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate leading-tight mb-1">Total DTRs</div>
            <div className="text-xs sm:text-sm lg:text-base font-bold truncate">{stats.total}</div>
          </Card>
          <Card className="min-w-0 overflow-hidden p-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate leading-tight mb-1">Open</div>
            <div className="text-xs sm:text-sm lg:text-base font-bold text-red-600 truncate">{stats.open}</div>
          </Card>
          <Card className="min-w-0 overflow-hidden p-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate leading-tight mb-1">In Progress</div>
            <div className="text-xs sm:text-sm lg:text-base font-bold text-yellow-600 truncate">{stats.inProgress}</div>
          </Card>
          <Card className="min-w-0 overflow-hidden p-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate leading-tight mb-1">Closed</div>
            <div className="text-xs sm:text-sm lg:text-base font-bold text-green-600 truncate">{stats.closed}</div>
          </Card>
          <Card className="min-w-0 overflow-hidden p-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate leading-tight mb-1">Shifted</div>
            <div className="text-xs sm:text-sm lg:text-base font-bold text-purple-600 truncate">{stats.shiftedToRMA}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-dark-card border-dark-color">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-visible">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {/* First Row - Search and Basic Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
              <div>
                <Label className="text-sm font-medium text-visible">Search</Label>
                <Input
                  placeholder="Search DTRs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!isAuthenticated}
                  className="w-full bg-dark-card border-dark-color text-visible placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-visible">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!isAuthenticated}>
                  <SelectTrigger className="w-full bg-dark-card border-dark-color text-visible">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="all" className="text-visible hover:bg-dark-hover">All Status</SelectItem>
                    <SelectItem value="Open" className="text-visible hover:bg-dark-hover">Open</SelectItem>
                    <SelectItem value="In Progress" className="text-visible hover:bg-dark-hover">In Progress</SelectItem>
                    <SelectItem value="Resolved" className="text-visible hover:bg-dark-hover">Resolved</SelectItem>
                    <SelectItem value="Closed" className="text-visible hover:bg-dark-hover">Closed</SelectItem>
                    <SelectItem value="Escalated" className="text-visible hover:bg-dark-hover">Escalated</SelectItem>
                    <SelectItem value="Shifted to RMA" className="text-visible hover:bg-dark-hover">Shifted to RMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-visible">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={!isAuthenticated}>
                  <SelectTrigger className="w-full bg-dark-card border-dark-color text-visible">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="all" className="text-visible hover:bg-dark-hover">All Priority</SelectItem>
                    <SelectItem value="Low" className="text-visible hover:bg-dark-hover">Low</SelectItem>
                    <SelectItem value="Medium" className="text-visible hover:bg-dark-hover">Medium</SelectItem>
                    <SelectItem value="High" className="text-visible hover:bg-dark-hover">High</SelectItem>
                    <SelectItem value="Critical" className="text-visible hover:bg-dark-hover">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-visible">Call Status</Label>
                <Select value={callStatusFilter} onValueChange={setCallStatusFilter} disabled={!isAuthenticated}>
                  <SelectTrigger className="w-full bg-dark-card border-dark-color text-visible">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="all" className="text-visible hover:bg-dark-hover">All Status</SelectItem>
                    <SelectItem value="Open" className="text-visible hover:bg-dark-hover">Open</SelectItem>
                    <SelectItem value="Closed" className="text-visible hover:bg-dark-hover">Closed</SelectItem>
                    <SelectItem value="Observation" className="text-visible hover:bg-dark-hover">Observation</SelectItem>
                    <SelectItem value="RMA Part return to CDS" className="text-visible hover:bg-dark-hover">RMA Part return to CDS</SelectItem>
                    <SelectItem value="Waiting_Cust_Responses" className="text-visible hover:bg-dark-hover">Waiting_Cust_Responses</SelectItem>
                    <SelectItem value="blank" className="text-visible hover:bg-dark-hover">Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row - Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
              <div>
                <Label className="text-sm font-medium text-visible">Case Severity</Label>
                <Select value={caseSeverityFilter} onValueChange={setCaseSeverityFilter} disabled={!isAuthenticated}>
                  <SelectTrigger className="w-full bg-dark-card border-dark-color text-visible">
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="all" className="text-visible hover:bg-dark-hover">All Severity</SelectItem>
                    <SelectItem value="Critical" className="text-visible hover:bg-dark-hover">Critical</SelectItem>
                    <SelectItem value="Information" className="text-visible hover:bg-dark-hover">Information</SelectItem>
                    <SelectItem value="Major" className="text-visible hover:bg-dark-hover">Major</SelectItem>
                    <SelectItem value="Minor" className="text-visible hover:bg-dark-hover">Minor</SelectItem>
                    <SelectItem value="Low" className="text-visible hover:bg-dark-hover">Low</SelectItem>
                    <SelectItem value="blank" className="text-visible hover:bg-dark-hover">Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-visible">Site</Label>
                <Input
                  placeholder="Site name..."
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  disabled={!isAuthenticated}
                  className="w-full bg-dark-card border-dark-color text-visible placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-visible">Serial Number</Label>
                <Input
                  placeholder="Serial number..."
                  value={serialFilter}
                  onChange={(e) => setSerialFilter(e.target.value)}
                  disabled={!isAuthenticated}
                  className="w-full bg-dark-card border-dark-color text-visible placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-visible">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!isAuthenticated}
                  className="w-full bg-dark-card border-dark-color text-visible"
                />
              </div>
            </div>

            {/* Third Row - End Date and Clear Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
              <div>
                <Label className="text-sm font-medium text-visible">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!isAuthenticated}
                  className="w-full bg-dark-card border-dark-color text-visible"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setSiteFilter("");
                    setSerialFilter("");
                    setStartDate("");
                    setEndDate("");
                    setCallStatusFilter("all");
                    setCaseSeverityFilter("all");
                  }}
                  variant="outline"
                  disabled={!isAuthenticated}
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DTR List */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trouble Reports</CardTitle>
          <CardDescription>
            Showing {dtrs.length} DTRs (Page {currentPage} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="text-center py-8 text-gray-500">Please log in to view DTRs</div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading DTRs...</p>
            </div>
          ) : dtrs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {statusFilter === "all" && dtrs.length === 0 ? (
                <>
                  <p className="text-lg font-medium mb-2">No DTRs Found</p>
                  <p className="text-sm">No DTR records are available. Try selecting a specific status to filter the results.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No DTRs found</p>
                  <p className="text-sm">Try adjusting your filters or create a new DTR</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile/Tablet Card View */}
              <div className="block lg:hidden space-y-4">
                {dtrs.map((dtr) => (
                  <Card key={dtr._id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedDTRs.includes(dtr._id)}
                            onChange={() => handleSelectDTR(dtr._id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="font-semibold text-blue-400 text-sm">
                            {dtr.caseId || 'N/A'}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(dtr)}
                            className="p-1 h-8 w-8 hover:bg-blue-600/20 border-blue-400/30 text-blue-400 hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(dtr)}
                            className="p-1 h-8 w-8 hover:bg-green-600/20 border-green-400/30 text-green-400 hover:text-green-300"
                            title="Edit DTR"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(dtr)}
                            className="p-1 h-8 w-8 hover:bg-purple-600/20 border-purple-400/30 text-purple-400 hover:text-purple-300"
                            title="Assign Technician"
                          >
                            <User className="w-3 h-3" />
                          </Button>
                          {dtr.status === 'Ready for RMA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConvertDialog(dtr)}
                              className="p-1 h-8 w-8 hover:bg-orange-600/20 border-orange-400/30 text-orange-400 hover:text-orange-300"
                              title="Convert to RMA"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDTR(dtr._id)}
                            className="p-1 h-8 w-8 hover:bg-red-600/20 border-red-400/30 text-red-400 hover:text-red-300"
                            title="Delete DTR"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">Error Date:</span>
                          <div className="text-white font-medium">{dtr.errorDate ? formatDate(dtr.errorDate) : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Site:</span>
                          <div className="text-white font-medium truncate">{dtr.siteName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Serial:</span>
                          <div className="text-white font-medium font-mono">{dtr.serialNumber || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Model:</span>
                          <div className="text-white font-medium truncate">{dtr.unitModel || dtr.projectorDetails?.model || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Call Status:</span>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(dtr.callStatus === 'blank' ? '' : dtr.callStatus || 'Open')}`}>
                            {dtr.callStatus === 'blank' ? 'N/A' : dtr.callStatus || 'Open'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Severity:</span>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(dtr.caseSeverity === 'blank' ? '' : dtr.caseSeverity || 'Minor')}`}>
                            {dtr.caseSeverity === 'blank' ? 'N/A' : dtr.caseSeverity || 'Minor'}
                          </div>
                        </div>
                      </div>
                      
                      {dtr.problemName && (
                        <div className="mt-3">
                          <span className="text-gray-400 text-xs">Problem:</span>
                          <div className="text-white text-sm mt-1">{dtr.problemName}</div>
                        </div>
                      )}
                      
                      {dtr.complaintDescription && (
                        <div className="mt-3">
                          <span className="text-gray-400 text-xs">Description:</span>
                          <div className="text-white text-sm mt-1 line-clamp-2">{dtr.complaintDescription}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-dark-bg to-dark-tag border-b-2 border-dark-color">
                      <th className="text-center font-bold text-white py-4 px-2 border-r border-dark-color text-xs uppercase tracking-wide">
                        <input
                          type="checkbox"
                          checked={selectedDTRs.length === dtrs.length && dtrs.length > 0}
                          onChange={handleSelectAllDTRs}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Error Date</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Case # YYMMxx</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">SITE</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Unit Model</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Unit Serial #</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Nature of Problem / Request</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Action Taken</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Remarks</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Call Status</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Case Severity</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Created By</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Closed Date</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Closed By</th>
                      <th className="text-left font-bold text-white py-4 px-4 border-r border-dark-color text-xs uppercase tracking-wide">Closed Remarks</th>
                      <th className="text-center font-bold text-white py-4 px-4 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {dtrs.map((dtr, index) => (
                    <tr key={dtr._id} className={`border-b border-dark-color transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-bg'
                    } hover:bg-dark-tag hover:shadow-sm`}>
                      {/* Checkbox */}
                      <td className="py-4 px-2 border-r border-dark-color text-center">
                        <input
                          type="checkbox"
                          checked={selectedDTRs.includes(dtr._id)}
                          onChange={() => handleSelectDTR(dtr._id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>
                      {/* Error Date */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm">
                          {dtr.errorDate ? formatDate(dtr.errorDate) : 'N/A'}
                        </div>
                      </td>
                      
                      {/* Case # YYMMxx */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="font-semibold text-blue-400 hover:text-blue-300 cursor-pointer text-sm">
                          {dtr.caseId || 'N/A'}
                        </div>
                        {dtr.rmaCaseNumber && (
                          <div className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" />
                            RMA: {dtr.rmaCaseNumber}
                          </div>
                        )}
                      </td>
                      
                      {/* SITE */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="font-medium text-white text-sm">
                          {dtr.siteName || 'N/A'}
                        </div>
                        {dtr.siteCode && (
                          <div className="text-xs text-gray-300 mt-1">
                            Code: {dtr.siteCode}
                          </div>
                        )}
                        {dtr.region && (
                          <div className="text-xs text-gray-300">
                            {dtr.region}
                          </div>
                        )}
                        {/* Show auditorium if available */}
                        {dtr.auditorium && dtr.auditorium !== 'Unknown Auditorium' && dtr.auditorium.trim() !== '' && (
                          <div className="text-xs text-blue-300 mt-1">
                            Auditorium: {dtr.auditorium}
                          </div>
                        )}
                        {/* Show serial number for debugging */}
                        <div className="text-xs text-gray-500 mt-1">
                          Serial: {dtr.serialNumber}
                        </div>
                      </td>
                      
                      {/* Unit Model */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm">
                          {dtr.unitModel || dtr.projectorDetails?.model || 'N/A'}
                        </div>
                        {dtr.projectorDetails?.brand && (
                          <div className="text-xs text-gray-300 mt-1">
                            {dtr.projectorDetails.brand}
                          </div>
                        )}
                      </td>
                      
                      {/* Unit Serial # */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="font-medium text-white font-mono text-sm">
                          {dtr.serialNumber || 'N/A'}
                        </div>
                      </td>
                      
                      {/* Nature of Problem / Request */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm max-w-xs">
                          <div className="font-medium">{dtr.problemName || 'N/A'}</div>
                          {dtr.complaintDescription && (
                            <div className="text-xs text-gray-300 mt-1 line-clamp-2" title={dtr.complaintDescription}>
                              {dtr.complaintDescription}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Action Taken */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm max-w-xs">
                          {dtr.actionTaken ? (
                            <div className="line-clamp-2" title={dtr.actionTaken}>
                              {dtr.actionTaken}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not specified</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Remarks */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm max-w-xs">
                          {dtr.remarks ? (
                            <div className="line-clamp-2" title={dtr.remarks}>
                              {dtr.remarks}
                            </div>
                          ) : (
                            <span className="text-gray-400">No remarks</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Call Status */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusColor(dtr.callStatus === 'blank' ? '' : dtr.callStatus || 'Open')}`}>
                          {dtr.callStatus === 'blank' ? 'N/A' : dtr.callStatus || 'Open'}
                        </div>
                      </td>
                      
                      {/* Case Severity */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${getPriorityColor(dtr.caseSeverity === 'blank' ? '' : dtr.caseSeverity || 'Minor')}`}>
                          {dtr.caseSeverity === 'blank' ? 'N/A' : dtr.caseSeverity || 'Minor'}
                        </div>
                      </td>
                      
                      {/* Created By */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm">
                          {dtr.openedBy?.name || 'N/A'}
                        </div>
                        {dtr.openedBy?.designation && (
                          <div className="text-xs text-gray-300 mt-1">
                            {dtr.openedBy.designation}
                          </div>
                        )}
                      </td>
                      
                      {/* Closed Date */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm">
                          {dtr.status === 'Closed' && dtr.closedBy?.closedDate ? formatDate(dtr.closedBy.closedDate) : 'N/A'}
                        </div>
                      </td>
                      
                      {/* Closed By */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm">
                          {dtr.status === 'Closed' && dtr.closedBy?.name ? dtr.closedBy.name : 'N/A'}
                        </div>
                        {dtr.status === 'Closed' && dtr.closedBy?.designation && (
                          <div className="text-xs text-gray-300 mt-1">
                            {dtr.closedBy.designation}
                          </div>
                        )}
                      </td>
                      
                      {/* Closed Remarks */}
                      <td className="py-4 px-4 border-r border-dark-color">
                        <div className="text-white text-sm max-w-xs">
                          {dtr.status === 'Closed' && dtr.closedRemarks ? (
                            <div className="line-clamp-2" title={dtr.closedRemarks}>
                              {dtr.closedRemarks}
                            </div>
                          ) : (
                            <span className="text-gray-400">No remarks</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(dtr)}
                            className="p-2 hover:bg-blue-600/20 border-blue-400/30 text-blue-400 hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(dtr)}
                            className="p-2 hover:bg-green-600/20 border-green-400/30 text-green-400 hover:text-green-300"
                            title="Edit DTR"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(dtr)}
                            className="p-2 hover:bg-purple-600/20 border-purple-400/30 text-purple-400 hover:text-purple-300"
                            title="Assign Technician"
                          >
                            <User className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDTR(dtr._id)}
                            className="p-2 hover:bg-red-600/20 border-red-400/30 text-red-400 hover:text-red-300"
                            title="Delete DTR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && isAuthenticated && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create DTR Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">Create New DTR</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Register a new daily trouble report from a site
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Serial Number *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter projector serial number"
                  value={formData.serialNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, serialNumber: e.target.value });
                    handleSerialNumberLookup(e.target.value);
                  }}
                  className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  variant="outline"
                  onClick={() => handleSerialNumberLookup(formData.serialNumber)}
                  disabled={lookupLoading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {lookupLoading ? "..." : "Lookup"}
                </Button>
              </div>
            </div>

            {/* Projector Info Display */}
            {projectorInfo && (
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Projector Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 p-2 rounded"><strong>Model:</strong> {projectorInfo.model}</div>
                    <div className="bg-white/50 p-2 rounded"><strong>Brand:</strong> {projectorInfo.brand}</div>
                    <div className="bg-white/50 p-2 rounded"><strong>Site:</strong> {projectorInfo.site.name}</div>
                    <div className="bg-white/50 p-2 rounded"><strong>Region:</strong> {projectorInfo.site.region}</div>
                    {projectorInfo.auditoriumId && (
                      <div className="bg-white/50 p-2 rounded"><strong>Auditorium:</strong> {projectorInfo.auditoriumId}</div>
                    )}
                    <div className="bg-white/50 p-2 rounded"><strong>Install Date:</strong> {formatDate(projectorInfo.installDate)}</div>
                    <div className="bg-white/50 p-2 rounded"><strong>Warranty End:</strong> {formatDate(projectorInfo.warrantyEnd)}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Complaint Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Complaint Details
              </h3>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Complaint Description *</Label>
                <Textarea
                  placeholder="Describe the complaint or issue..."
                  value={formData.complaintDescription}
                  onChange={(e) => setFormData({ ...formData, complaintDescription: e.target.value })}
                  rows={3}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Personnel Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personnel Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Opened By Name *</Label>
                  <Input
                    placeholder="Name of person opening the DTR"
                    value={formData.openedBy.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      openedBy: { ...formData.openedBy, name: e.target.value }
                    })}
                    className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Designation</Label>
                <Input
                  placeholder="Designation"
                  value={formData.openedBy.designation}
                  onChange={(e) => setFormData({
                    ...formData,
                    openedBy: { ...formData.openedBy, designation: e.target.value }
                  })}
                  className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Contact</Label>
              <Input
                placeholder="Phone or email"
                value={formData.openedBy.contact}
                onChange={(e) => setFormData({
                  ...formData,
                  openedBy: { ...formData.openedBy, contact: e.target.value }
                })}
                className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

            {/* Assignment & Resolution Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-green-600" />
                Assignment & Resolution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Assigned To</Label>
                <Select 
                  value={formData.assignedTo} 
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  disabled={isLoadingTechnicalHeads}
                >
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
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
                  <p className="text-base text-red-700 font-bold mt-1 bg-red-100 px-2 py-1 rounded">
                    No technical heads found.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Estimated Resolution Time</Label>
              <Input
                placeholder="e.g., 2 hours, 1 day"
                value={formData.estimatedResolutionTime}
                onChange={(e) => setFormData({ ...formData, estimatedResolutionTime: e.target.value })}
                className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

            {/* Additional Details Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Additional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Error Date *</Label>
                  <Input
                    type="date"
                    value={formData.errorDate}
                    onChange={(e) => setFormData({ ...formData, errorDate: e.target.value })}
                    required
                    className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Unit Model</Label>
                <Input
                  placeholder="Projector model"
                  value={formData.unitModel}
                  onChange={(e) => setFormData({ ...formData, unitModel: e.target.value })}
                  className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Name of Problem / Request *</Label>
              <Input
                placeholder="Describe the problem or request"
                value={formData.problemName}
                onChange={(e) => setFormData({ ...formData, problemName: e.target.value })}
                required
                className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Action Taken</Label>
              <Textarea
                placeholder="Describe what action was taken..."
                value={formData.actionTaken}
                onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                rows={2}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Remarks</Label>
              <Textarea
                placeholder="Additional remarks..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Call Status</Label>
                <Select value={formData.callStatus} onValueChange={(value) => setFormData({ ...formData, callStatus: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Observation">Observation</SelectItem>
                    <SelectItem value="RMA Part return to CDS">RMA Part return to CDS</SelectItem>
                    <SelectItem value="Waiting_Cust_Responses">Waiting_Cust_Responses</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Case Severity</Label>
                <Select value={formData.caseSeverity} onValueChange={(value) => setFormData({ ...formData, caseSeverity: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Information">Information</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              console.log('Create DTR button clicked!');
              console.log('Current form data:', formData);
              console.log('Button disabled state:', !formData.serialNumber || !formData.complaintDescription || !formData.openedBy.name || isSubmitting);
              handleCreateDTR();
            }}
            disabled={!formData.serialNumber || !formData.complaintDescription || !formData.openedBy.name || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create DTR'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Edit DTR Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit DTR - {selectedDTR?.caseId}</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Update the DTR status and details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Status</Label>
                <Select value={editFormData.status} onValueChange={(value) => {
                  const newData = { ...editFormData, status: value };
                  
                  // Auto-set closedReason based on status
                  if (value === 'Shifted to RMA') {
                    newData.closedReason = 'Shifted to RMA';
                  } else if (value === 'Closed' && !newData.closedReason) {
                    newData.closedReason = 'Resolved';
                  }
                  
                  setEditFormData(newData);
                }}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Shifted to RMA">Shifted to RMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Priority</Label>
                <Select value={editFormData.priority} onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editFormData.status === "Closed" && (
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Closed Reason</Label>
                <Select value={editFormData.closedReason} onValueChange={(value) => setEditFormData({ ...editFormData, closedReason: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="No Action Required">No Action Required</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {editFormData.status === "Shifted to RMA" && (
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Closed Reason</Label>
                <Select value={editFormData.closedReason} onValueChange={(value) => setEditFormData({ ...editFormData, closedReason: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shifted to RMA">Shifted to RMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(editFormData.status === "Closed" || editFormData.status === "Shifted to RMA") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Closed By Name</Label>
                  <Input
                    placeholder="Name of person closing the DTR"
                    value={editFormData.closedBy?.name || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      closedBy: { ...editFormData.closedBy, name: e.target.value }
                    })}
                    className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Designation</Label>
                  <Input
                    placeholder="Designation"
                    value={editFormData.closedBy?.designation || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      closedBy: { ...editFormData.closedBy, designation: e.target.value }
                    })}
                    className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Assigned To</Label>
                <Select 
                  value={editFormData.assignedTo} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, assignedTo: value })}
                  disabled={isLoadingTechnicalHeads}
                >
                  <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
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
                  <p className="text-base text-red-700 font-bold mt-1 bg-red-100 px-2 py-1 rounded">
                    No technical heads found.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Estimated Resolution Time</Label>
                <Input
                  placeholder="e.g., 2 hours, 1 day"
                  value={editFormData.estimatedResolutionTime}
                  onChange={(e) => setEditFormData({ ...editFormData, estimatedResolutionTime: e.target.value })}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {editFormData.status === "Closed" && (
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Actual Resolution Time</Label>
                <Input
                  placeholder="e.g., 2 hours, 1 day"
                  value={editFormData.actualResolutionTime}
                  onChange={(e) => setEditFormData({ ...editFormData, actualResolutionTime: e.target.value })}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={3}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* New fields from the image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Call Status</Label>
                <Select value={editFormData.callStatus} onValueChange={(value) => setEditFormData({ ...editFormData, callStatus: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Observation">Observation</SelectItem>
                    <SelectItem value="RMA Part return to CDS">RMA Part return to CDS</SelectItem>
                    <SelectItem value="Waiting_Cust_Responses">Waiting_Cust_Responses</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Case Severity</Label>
                <Select value={editFormData.caseSeverity} onValueChange={(value) => setEditFormData({ ...editFormData, caseSeverity: value })}>
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Information">Information</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Action Taken</Label>
              <Textarea
                placeholder="Describe what action was taken..."
                value={editFormData.actionTaken}
                onChange={(e) => setEditFormData({ ...editFormData, actionTaken: e.target.value })}
                rows={2}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">Closed Remarks</Label>
              <Textarea
                placeholder="Additional remarks after closing..."
                value={editFormData.closedRemarks}
                onChange={(e) => setEditFormData({ ...editFormData, closedRemarks: e.target.value })}
                rows={2}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              console.log('Update DTR button clicked!');
              console.log('Current edit form data:', editFormData);
              console.log('Selected DTR:', selectedDTR);
              console.log('Form data validation:', {
                hasStatus: !!editFormData.status,
                hasPriority: !!editFormData.priority,
                hasAssignedTo: !!editFormData.assignedTo,
                hasNotes: !!editFormData.notes
              });
              handleUpdateDTR();
            }} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update DTR'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View DTR Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
          <DialogHeader className="border-b border-dark-color pb-4">
            <DialogTitle className="text-2xl font-bold text-visible">DTR Details - {selectedDTR?.caseId}</DialogTitle>
            <DialogDescription className="text-visible-secondary mt-2">
              View complete DTR information
            </DialogDescription>
          </DialogHeader>
          
          {selectedDTR && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-visible-secondary">Case ID:</span>
                      <div className="font-mono font-medium text-visible">{selectedDTR.caseId || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Status:</span>
                      <Badge className={getStatusColor(selectedDTR.status || 'Open')}>
                        {selectedDTR.status || 'Open'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Priority:</span>
                      <Badge className={getPriorityColor(selectedDTR.priority || 'Medium')}>
                        {selectedDTR.priority || 'Medium'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Complaint Date:</span>
                      <div className="font-medium text-visible">{selectedDTR.complaintDate ? formatDateTime(selectedDTR.complaintDate) : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projector & Site Information */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Projector & Site Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-visible-secondary">Serial Number:</span>
                      <div className="font-medium text-visible">{selectedDTR.serialNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Site Name:</span>
                      <div className="font-medium text-visible">{selectedDTR.siteName || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Site Code:</span>
                      <div className="font-medium text-visible">{selectedDTR.siteCode || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Region:</span>
                      <div className="font-medium text-visible">{selectedDTR.region || 'N/A'}</div>
                    </div>
                  </div>
                  
                  {selectedDTR.projectorDetails && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Projector Details:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div><strong>Model:</strong> {selectedDTR.projectorDetails.model || 'N/A'}</div>
                        <div><strong>Brand:</strong> {selectedDTR.projectorDetails.brand || 'N/A'}</div>
                        <div><strong>Install Date:</strong> {selectedDTR.projectorDetails.installDate ? formatDate(selectedDTR.projectorDetails.installDate) : 'N/A'}</div>
                        <div><strong>Warranty End:</strong> {selectedDTR.projectorDetails.warrantyEnd ? formatDate(selectedDTR.projectorDetails.warrantyEnd) : 'N/A'}</div>
                        <div><strong>Last Service:</strong> {selectedDTR.projectorDetails.lastService ? formatDate(selectedDTR.projectorDetails.lastService) : 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Complaint Details */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Complaint Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <span className="text-sm text-visible-secondary">Description:</span>
                    <div className="font-medium mt-1 text-visible">{selectedDTR.complaintDescription || 'N/A'}</div>
                  </div>
                  {selectedDTR.problemName && (
                    <div className="mt-4">
                      <span className="text-sm text-visible-secondary">Problem Name:</span>
                      <div className="font-medium mt-1 text-visible">{selectedDTR.problemName}</div>
                    </div>
                  )}
                  {selectedDTR.actionTaken && (
                    <div className="mt-4">
                      <span className="text-sm text-visible-secondary">Action Taken:</span>
                      <div className="font-medium mt-1 text-visible">{selectedDTR.actionTaken}</div>
                    </div>
                  )}
                  {selectedDTR.remarks && (
                    <div className="mt-4">
                      <span className="text-sm text-visible-secondary">Remarks:</span>
                      <div className="font-medium mt-1 text-visible">{selectedDTR.remarks}</div>
                    </div>
                  )}
                  {selectedDTR.notes && (
                    <div className="mt-4">
                      <span className="text-sm text-visible-secondary">Notes:</span>
                      <div className="font-medium mt-1 text-visible">{selectedDTR.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Fields Information */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-visible-secondary">Error Date:</span>
                      <div className="font-medium text-visible">{selectedDTR.errorDate ? formatDate(selectedDTR.errorDate) : 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Unit Model:</span>
                      <div className="font-medium text-visible">{selectedDTR.unitModel || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Call Status:</span>
                      <Badge className={getStatusColor(selectedDTR.callStatus === 'blank' ? '' : selectedDTR.callStatus || selectedDTR.status || 'Open')}>
                        {selectedDTR.callStatus === 'blank' ? 'N/A' : selectedDTR.callStatus || selectedDTR.status || 'Open'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-visible-secondary">Case Severity:</span>
                      <Badge className={getPriorityColor(selectedDTR.caseSeverity === 'blank' ? '' : selectedDTR.caseSeverity || selectedDTR.priority || 'Minor')}>
                        {selectedDTR.caseSeverity === 'blank' ? 'N/A' : selectedDTR.caseSeverity || selectedDTR.priority || 'Minor'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personnel Information */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Personnel Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 text-visible">Opened By:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-visible"><strong>Name:</strong> {selectedDTR.openedBy?.name || 'N/A'}</div>
                        <div className="text-visible"><strong>Designation:</strong> {selectedDTR.openedBy?.designation || 'N/A'}</div>
                        <div className="text-visible"><strong>Contact:</strong> {selectedDTR.openedBy?.contact || 'N/A'}</div>
                      </div>
                    </div>
                    
                    {selectedDTR.closedBy && (
                      <div>
                        <h4 className="font-medium mb-2 text-visible">Closed By:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="text-visible"><strong>Name:</strong> {selectedDTR.closedBy.name || 'N/A'}</div>
                          <div className="text-visible"><strong>Designation:</strong> {selectedDTR.closedBy.designation || 'N/A'}</div>
                          <div className="text-visible"><strong>Contact:</strong> {selectedDTR.closedBy.contact || 'N/A'}</div>
                          <div className="text-visible"><strong>Closed Date:</strong> {selectedDTR.closedBy.closedDate ? formatDateTime(selectedDTR.closedBy.closedDate) : 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedDTR.assignedTo && (
                    <div className="mt-4 pt-4 border-t border-dark-color">
                      <span className="text-sm text-visible-secondary">Assigned To:</span>
                      <div className="font-medium text-visible">
                        {typeof selectedDTR.assignedTo === 'string' ? selectedDTR.assignedTo : 
                         typeof selectedDTR.assignedTo === 'object' && selectedDTR.assignedTo?.name ? selectedDTR.assignedTo.name : 
                         'N/A'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resolution Information */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Resolution Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDTR.estimatedResolutionTime && (
                      <div>
                        <span className="text-sm text-visible-secondary">Estimated Resolution Time:</span>
                        <div className="font-medium text-visible">{selectedDTR.estimatedResolutionTime}</div>
                      </div>
                    )}
                    {selectedDTR.actualResolutionTime && (
                      <div>
                        <span className="text-sm text-visible-secondary">Actual Resolution Time:</span>
                        <div className="font-medium text-visible">{selectedDTR.actualResolutionTime}</div>
                      </div>
                    )}
                    {selectedDTR.closedReason && (
                      <div>
                        <span className="text-sm text-visible-secondary">Closed Reason:</span>
                        <div className="font-medium text-visible">{selectedDTR.closedReason}</div>
                      </div>
                    )}
                    {selectedDTR.closedRemarks && (
                      <div>
                        <span className="text-sm text-visible-secondary">Closed Remarks:</span>
                        <div className="font-medium text-visible">{selectedDTR.closedRemarks}</div>
                      </div>
                    )}
                  </div>
                  
                  {selectedDTR.rmaCaseNumber && (
                    <div className="mt-4 pt-4 border-t border-dark-color">
                      <span className="text-sm text-visible-secondary">RMA Case Number:</span>
                      <div className="font-medium text-visible-cta flex items-center gap-2">
                        {selectedDTR.rmaCaseNumber}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card className="bg-dark-card border-dark-color">
                <CardHeader>
                  <CardTitle className="text-lg text-visible">Timestamps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-visible-secondary">Error Date:</span>
                      <div className="font-medium text-visible">{formatDateTime(selectedDTR.errorDate)}</div>
                    </div>
                    <div>
                      <span className="text-visible-secondary">Last Updated:</span>
                      <div className="font-medium text-visible">{formatDateTime(selectedDTR.updatedAt)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="border-dark-color text-visible hover:bg-dark-hover">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Import DTRs</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Import multiple DTRs from an Excel file using the exact template format
            </DialogDescription>
          </DialogHeader>
          <DTRBulkImport />
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Bulk Delete
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Are you sure you want to delete {selectedDTRs.length} DTR(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                This will permanently delete {selectedDTRs.length} DTR record(s) and all associated data.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isDeleting}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedDTRs.length} DTR(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign DTR to Technical Head Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white"
        >
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6" />
              Assign DTR to Technical Head
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Assign this DTR case to a technical head for resolution
            </DialogDescription>
          </DialogHeader>
          
          {selectedDTRForAssignment && (
            <div className="space-y-6 py-4">
              {/* DTR Case ID */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-900" />
                  <span className="font-bold text-black text-lg">DTR Case ID:</span>
                </div>
                <div className="font-mono text-2xl font-black text-blue-900 bg-blue-100 px-3 py-2 rounded">
                  {selectedDTRForAssignment.caseId || 'N/A'}
                </div>
              </div>

              {/* Current Assignment */}
              <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-blue-900" />
                  <span className="font-bold text-black text-lg">Currently assigned to:</span>
                </div>
                <div className="text-xl font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded">
                  {selectedDTRForAssignment.assignedTo ? 
                    (typeof selectedDTRForAssignment.assignedTo === 'string' ? 
                      selectedDTRForAssignment.assignedTo : 
                      selectedDTRForAssignment.assignedTo?.name || 'N/A') : 
                    'N/A'}
                </div>
              </div>

              {/* File Attachment Section */}
              <div>
                <Label className="text-black font-bold text-lg mb-2 block">Attach Files (Images & Logs)</Label>
                <div className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center hover:border-gray-600 transition-colors bg-gray-50">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-700" />
                    <div className="text-gray-900">
                      <p className="font-bold text-lg text-gray-900">Click to select files or drag and drop</p>
                      <p className="text-base text-gray-800 mt-1 font-medium">
                        Supported: Images (JPEG, PNG, GIF, WebP) and ZIP files (max 50MB each)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.webp,.zip"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mt-2"
                    >
                      Choose Files
                    </Button>
                  </div>
                </div>
                
                {/* Display selected files */}
                {assignFormData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-gray-700 font-medium">Selected Files:</Label>
                    {assignFormData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Head Selection */}
              <div>
                <Label className="text-black font-bold text-lg mb-2 block">Select Technical Head *</Label>
                <Select 
                  value={assignFormData.assignedTo} 
                  onValueChange={(value) => setAssignFormData({ ...assignFormData, assignedTo: value })}
                  disabled={isLoadingTechnicalHeads}
                >
                  <SelectTrigger className="border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder={isLoadingTechnicalHeads ? "Loading technical heads..." : "Select Technical Head"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {technicalHeads.map((technicalHead) => (
                      <SelectItem key={technicalHead.userId} value={technicalHead.userId} className="text-gray-900">
                        {technicalHead.profile?.firstName && technicalHead.profile?.lastName 
                          ? `${technicalHead.profile.firstName} ${technicalHead.profile.lastName}`
                          : technicalHead.username} ({technicalHead.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {technicalHeads.length === 0 && !isLoadingTechnicalHeads && (
                  <p className="text-base text-red-700 font-bold mt-1 bg-red-100 px-2 py-1 rounded">
                    No technical heads found.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignDTR}
              disabled={!assignFormData.assignedTo || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                'Assign to Technical Head'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DTR to RMA Conversion Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ExternalLink className="w-6 h-6" />
              Convert DTR to RMA
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Convert this DTR case to an RMA for hardware replacement
            </DialogDescription>
          </DialogHeader>
          
          {selectedDTRForConversion && (
            <div className="space-y-6 py-4">
              {/* DTR Case ID */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-800" />
                  <span className="font-semibold text-gray-900">DTR Case ID:</span>
                </div>
                <div className="font-mono text-xl font-bold text-blue-700">
                  {selectedDTRForConversion.caseId || 'N/A'}
                </div>
              </div>

              {/* DTR Details */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">Serial Number:</span>
                    <div className="text-gray-800 font-medium">{selectedDTRForConversion.serialNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Site:</span>
                    <div className="text-gray-800 font-medium">{selectedDTRForConversion.siteName || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Problem:</span>
                    <div className="text-gray-800 font-medium">{selectedDTRForConversion.problemName || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Status:</span>
                    <div className="text-gray-800 font-medium">{selectedDTRForConversion.status || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Conversion Reason */}
              <div>
                <Label className="text-gray-900 font-semibold mb-2 block">Conversion Reason *</Label>
                <Textarea
                  value={conversionReason}
                  onChange={(e) => setConversionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for converting this DTR to RMA..."
                  className="border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be included in the RMA record and help track why the conversion was necessary.
                </p>
              </div>

              {/* Warning Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Important Notice</span>
                </div>
                <div className="text-sm text-amber-700">
                  <p>Converting this DTR to RMA will:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Create a new RMA record with all DTR information</li>
                    <li>Change the DTR status to "Shifted to RMA"</li>
                    <li>Preserve all troubleshooting history</li>
                    <li>Assign the RMA to an RMA manager</li>
                  </ul>
                  <p className="mt-2 font-medium">This action cannot be undone.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToRMA}
              disabled={!conversionReason.trim() || isConverting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                'Convert to RMA'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
