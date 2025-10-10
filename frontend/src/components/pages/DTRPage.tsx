import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Camera, 
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Wrench,
  Monitor,
  Building,
  Car,
  DollarSign,
  Star,
  Image,
  Play,
  Pause,
  AlertCircle,
  CheckSquare,
  Square,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
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
  };
  closedBy?: {
    name: string;
    designation: string;
    contact: string;
    closedDate: string;
  };
  status: string;
  closedReason?: string;
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
  site: {
    name: string;
    code: string;
    region: string;
    address: any;
  };
}

export function DTRPage() {
  const { token, isAuthenticated, user } = useAuth();
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
    assignedTo: "",
    estimatedResolutionTime: "",
    notes: "",
    // New fields
    errorDate: new Date().toISOString().split('T')[0],
    unitModel: "",
    problemName: "",
    actionTaken: "",
    remarks: "",
    callStatus: "Open",
    caseSeverity: "Medium"
  });

  const [editFormData, setEditFormData] = useState({
    status: "",
    closedReason: "",
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
    remarks: ""
  });

  const [projectorInfo, setProjectorInfo] = useState<ProjectorInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

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
    loadDTRs();
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
      console.log('Making API request to /dtr with data:', formData);
      const response = await apiClient.post("/dtr", formData);
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
      const updateData = { ...editFormData };
      
      // Handle closedReason based on status
      if (updateData.status === 'Shifted to RMA') {
        updateData.closedReason = 'Shifted to RMA';
      } else if (updateData.status === 'Closed' && !updateData.closedReason) {
        updateData.closedReason = 'Resolved'; // Default for closed status
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
      assignedTo: "",
      estimatedResolutionTime: "",
      notes: "",
      // New fields
      errorDate: new Date().toISOString().split('T')[0],
      unitModel: "",
      problemName: "",
      actionTaken: "",
      remarks: "",
      callStatus: "Open",
      caseSeverity: "Medium"
    });
    setProjectorInfo(null);
  };

  const openEditDialog = (dtr: DTR) => {
    setSelectedDTR(dtr);
    setEditFormData({
      status: dtr.status || 'Open',
      closedReason: dtr.closedReason || "",
      closedBy: dtr.closedBy || {
        name: "",
        designation: "",
        contact: ""
      },
      assignedTo: dtr.assignedTo || "",
      priority: dtr.priority || 'Medium',
      estimatedResolutionTime: dtr.estimatedResolutionTime || "",
      actualResolutionTime: dtr.actualResolutionTime || "",
      notes: dtr.notes || "",
      // New fields
      callStatus: dtr.callStatus || 'Open',
      caseSeverity: dtr.caseSeverity || 'Medium',
      actionTaken: dtr.actionTaken || "",
      remarks: dtr.remarks || ""
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (dtr: DTR) => {
    setSelectedDTR(dtr);
    setShowViewDialog(true);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "Open": return "bg-red-100 text-red-800";
      case "In Progress": return "bg-yellow-100 text-yellow-800";
      case "Closed": return "bg-green-100 text-green-800";
      case "Shifted to RMA": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Trouble Reports</h1>
          <p className="text-gray-600">Manage and track daily trouble reports from sites</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowBulkImport(true)} 
            className="bg-green-600 hover:bg-green-700"
            disabled={!isAuthenticated}
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!isAuthenticated}
          >
            <Plus className="w-4 h-4 mr-2" />
            New DTR
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total DTRs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Shifted to RMA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.shiftedToRMA}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search DTRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!isAuthenticated}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                  <SelectItem value="Shifted to RMA">Shifted to RMA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={!isAuthenticated}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Call Status</Label>
              <Select value={callStatusFilter} onValueChange={setCallStatusFilter} disabled={!isAuthenticated}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Case Severity</Label>
              <Select value={caseSeverityFilter} onValueChange={setCaseSeverityFilter} disabled={!isAuthenticated}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Site</Label>
              <Input
                placeholder="Site name..."
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input
                placeholder="Serial number..."
                value={serialFilter}
                onChange={(e) => setSerialFilter(e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!isAuthenticated}
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
              >
                Clear Filters
              </Button>
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
              <p className="text-lg font-medium mb-2">No DTRs found</p>
              <p className="text-sm">Try adjusting your filters or create a new DTR</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dtrs.map((dtr) => (
                <div key={dtr._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(dtr.status || 'Open')}>
                          {dtr.status || 'Open'}
                        </Badge>
                        <Badge className={getPriorityColor(dtr.priority || 'Medium')}>
                          {dtr.priority || 'Medium'}
                        </Badge>
                        <span className="text-sm text-gray-600 font-mono">
                          {dtr.caseId || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Serial Number:</span>
                          <div className="font-medium">{dtr.serialNumber || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Site:</span>
                          <div className="font-medium">{dtr.siteName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Region:</span>
                          <div className="font-medium">{dtr.region || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Date:</span>
                          <div className="font-medium">{dtr.complaintDate ? formatDate(dtr.complaintDate) : 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* New fields display */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Unit Model:</span>
                          <div className="font-medium">{dtr.unitModel || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Problem:</span>
                          <div className="font-medium">{dtr.problemName || dtr.complaintDescription || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Call Status:</span>
                          <Badge className={getStatusColor(dtr.callStatus || dtr.status || 'Open')}>
                            {dtr.callStatus || dtr.status || 'Open'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Case Severity:</span>
                          <Badge className={getPriorityColor(dtr.caseSeverity || dtr.priority || 'Medium')}>
                            {dtr.caseSeverity || dtr.priority || 'Medium'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm text-gray-500">Complaint:</span>
                        <div className="font-medium">{dtr.complaintDescription || 'N/A'}</div>
                      </div>
                      
                      {dtr.actionTaken && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-500">Action Taken:</span>
                          <div className="font-medium">{dtr.actionTaken}</div>
                        </div>
                      )}
                      
                      {dtr.remarks && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-500">Remarks:</span>
                          <div className="font-medium">{dtr.remarks}</div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Opened By:</span>
                          <div className="font-medium">{dtr.openedBy?.name || 'N/A'}</div>
                        </div>
                        {dtr.assignedTo && (
                          <div>
                            <span className="text-sm text-gray-500">Assigned To:</span>
                            <div className="font-medium">
                              {typeof dtr.assignedTo === 'string' ? dtr.assignedTo : 
                               typeof dtr.assignedTo === 'object' && dtr.assignedTo?.name ? dtr.assignedTo.name : 
                               'N/A'}
                            </div>
                          </div>
                        )}
                        {dtr.rmaCaseNumber && (
                          <div>
                            <span className="text-sm text-gray-500">RMA Case:</span>
                            <div className="font-medium text-purple-600 flex items-center gap-1">
                              {dtr.rmaCaseNumber}
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(dtr)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(dtr)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDTR(dtr._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
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
                <Input
                  placeholder="Technician name"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
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
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
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
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
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
                <Input
                  placeholder="Technician name"
                  value={editFormData.assignedTo}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
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
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
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
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
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
              <Label className="text-gray-700 font-medium mb-2 block">Remarks</Label>
              <Textarea
                placeholder="Additional remarks..."
                value={editFormData.remarks}
                onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">DTR Details - {selectedDTR?.caseId}</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              View complete DTR information
            </DialogDescription>
          </DialogHeader>
          
          {selectedDTR && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Case ID:</span>
                      <div className="font-mono font-medium">{selectedDTR.caseId || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge className={getStatusColor(selectedDTR.status || 'Open')}>
                        {selectedDTR.status || 'Open'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Priority:</span>
                      <Badge className={getPriorityColor(selectedDTR.priority || 'Medium')}>
                        {selectedDTR.priority || 'Medium'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Complaint Date:</span>
                      <div className="font-medium">{selectedDTR.complaintDate ? formatDateTime(selectedDTR.complaintDate) : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projector & Site Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Projector & Site Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Serial Number:</span>
                      <div className="font-medium">{selectedDTR.serialNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Site Name:</span>
                      <div className="font-medium">{selectedDTR.siteName || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Site Code:</span>
                      <div className="font-medium">{selectedDTR.siteCode || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Region:</span>
                      <div className="font-medium">{selectedDTR.region || 'N/A'}</div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Complaint Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <span className="text-sm text-gray-500">Description:</span>
                    <div className="font-medium mt-1">{selectedDTR.complaintDescription || 'N/A'}</div>
                  </div>
                  {selectedDTR.problemName && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Problem Name:</span>
                      <div className="font-medium mt-1">{selectedDTR.problemName}</div>
                    </div>
                  )}
                  {selectedDTR.actionTaken && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Action Taken:</span>
                      <div className="font-medium mt-1">{selectedDTR.actionTaken}</div>
                    </div>
                  )}
                  {selectedDTR.remarks && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Remarks:</span>
                      <div className="font-medium mt-1">{selectedDTR.remarks}</div>
                    </div>
                  )}
                  {selectedDTR.notes && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Notes:</span>
                      <div className="font-medium mt-1">{selectedDTR.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Fields Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Error Date:</span>
                      <div className="font-medium">{selectedDTR.errorDate ? formatDate(selectedDTR.errorDate) : 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Unit Model:</span>
                      <div className="font-medium">{selectedDTR.unitModel || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Call Status:</span>
                      <Badge className={getStatusColor(selectedDTR.callStatus || selectedDTR.status || 'Open')}>
                        {selectedDTR.callStatus || selectedDTR.status || 'Open'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Case Severity:</span>
                      <Badge className={getPriorityColor(selectedDTR.caseSeverity || selectedDTR.priority || 'Medium')}>
                        {selectedDTR.caseSeverity || selectedDTR.priority || 'Medium'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personnel Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personnel Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Opened By:</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Name:</strong> {selectedDTR.openedBy?.name || 'N/A'}</div>
                        <div><strong>Designation:</strong> {selectedDTR.openedBy?.designation || 'N/A'}</div>
                        <div><strong>Contact:</strong> {selectedDTR.openedBy?.contact || 'N/A'}</div>
                      </div>
                    </div>
                    
                    {selectedDTR.closedBy && (
                      <div>
                        <h4 className="font-medium mb-2">Closed By:</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Name:</strong> {selectedDTR.closedBy.name || 'N/A'}</div>
                          <div><strong>Designation:</strong> {selectedDTR.closedBy.designation || 'N/A'}</div>
                          <div><strong>Contact:</strong> {selectedDTR.closedBy.contact || 'N/A'}</div>
                          <div><strong>Closed Date:</strong> {selectedDTR.closedBy.closedDate ? formatDateTime(selectedDTR.closedBy.closedDate) : 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedDTR.assignedTo && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-500">Assigned To:</span>
                      <div className="font-medium">
                        {typeof selectedDTR.assignedTo === 'string' ? selectedDTR.assignedTo : 
                         typeof selectedDTR.assignedTo === 'object' && selectedDTR.assignedTo?.name ? selectedDTR.assignedTo.name : 
                         'N/A'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resolution Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resolution Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDTR.estimatedResolutionTime && (
                      <div>
                        <span className="text-sm text-gray-500">Estimated Resolution Time:</span>
                        <div className="font-medium">{selectedDTR.estimatedResolutionTime}</div>
                      </div>
                    )}
                    {selectedDTR.actualResolutionTime && (
                      <div>
                        <span className="text-sm text-gray-500">Actual Resolution Time:</span>
                        <div className="font-medium">{selectedDTR.actualResolutionTime}</div>
                      </div>
                    )}
                    {selectedDTR.closedReason && (
                      <div>
                        <span className="text-sm text-gray-500">Closed Reason:</span>
                        <div className="font-medium">{selectedDTR.closedReason}</div>
                      </div>
                    )}
                  </div>
                  
                  {selectedDTR.rmaCaseNumber && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-500">RMA Case Number:</span>
                      <div className="font-medium text-purple-600 flex items-center gap-2">
                        {selectedDTR.rmaCaseNumber}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timestamps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">{formatDateTime(selectedDTR.createdAt)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <div className="font-medium">{formatDateTime(selectedDTR.updatedAt)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">Bulk Import DTRs</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Import multiple DTRs from an Excel file using the exact template format
            </DialogDescription>
          </DialogHeader>
          <DTRBulkImport />
        </DialogContent>
      </Dialog>
    </div>
  );
}
