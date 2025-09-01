import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Award, 
  Clock, 
  Edit,
  Eye,
  Download,
  FileText,
  Users,
  Wrench,
  Star,
  Briefcase,
  Shield,
  X,
  Loader2
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useData } from "../../contexts/DataContext";
import { apiClient } from "../../utils/api/client";

interface FSE {
  _id: string;
  fseId: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  specialization: string[];
  assignedTerritory: string[];
  status: string;
  experience: number;
  certifications: Array<{
    name: string;
    issuer: string;
    validUntil: Date;
  }>;
  supervisor: {
    name: string;
    email: string;
    phone: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FSEMetrics {
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  averageRating: number;
  totalHours: number;
  recommendations: number;
  territories: string[];
  specializations: string[];
}

export function FSEPage() {
  const { fses, services, serviceVisits } = useData();
  const [filteredFSEs, setFilteredFSEs] = useState<FSE[]>([]);
  const [selectedFSE, setSelectedFSE] = useState<FSE | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTerritory, setFilterTerritory] = useState("All");
  const [selectedFSEMetrics, setSelectedFSEMetrics] = useState<FSEMetrics | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [fseReports, setFseReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  const [fseStats, setFseStats] = useState({
    totalFSEs: 0,
    activeFSEs: 0,
    onDutyFSEs: 0,
    onLeaveFSEs: 0,
    totalServices: 0,
    averageRating: 0
  });

  const [newFSE, setNewFSE] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    designation: "Field Service Engineer",
    specialization: [] as string[],
    assignedTerritory: [] as string[],
    status: "Active",
    experience: 0,
    certifications: [] as any[],
    supervisor: {
      name: "",
      email: "",
      phone: ""
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: ""
    }
  });

  // Calculate FSE metrics
  const calculateFSEMetrics = (fse: FSE): FSEMetrics => {
    const fseServices = services.filter(service => service.technician === fse.name);
    const fseVisits = serviceVisits.filter(visit => visit.fseId === fse._id);
    
    const completedServices = fseServices.filter(s => s.status === 'Completed').length;
    const pendingServices = fseServices.filter(s => s.status === 'Scheduled' || s.status === 'In Progress').length;
    
    // Calculate recommendations
    const recommendations = fseServices.reduce((total, service) => {
      const spareParts = service.recommendations?.spareParts?.length || 0;
      const rmaParts = service.recommendations?.rmaParts?.length || 0;
      return total + spareParts + rmaParts;
    }, 0);

    // Calculate average rating (mock data for now)
    const averageRating = 4.2 + (Math.random() * 0.8); // 4.2-5.0 range

    return {
      totalServices: fseServices.length,
      completedServices,
      pendingServices,
      averageRating: Math.round(averageRating * 10) / 10,
      totalHours: fseServices.reduce((total, service) => total + (service.hours || 0), 0),
      recommendations,
      territories: fse.assignedTerritory,
      specializations: fse.specialization
    };
  };

  // Load FSE stats
  useEffect(() => {
    if (fses.length > 0) {
      const stats = {
        totalFSEs: fses.length,
        activeFSEs: fses.filter(f => f.status === 'Active').length,
        onDutyFSEs: fses.filter(f => f.status === 'On Duty').length,
        onLeaveFSEs: fses.filter(f => f.status === 'On Leave').length,
        totalServices: services.length,
        averageRating: 4.5
      };
      setFseStats(stats);
    }
  }, [fses, services]);

  // FSEs
  useEffect(() => {
    let filtered = fses;
    
    if (searchTerm) {
      filtered = filtered.filter(fse => 
        fse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fse.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fse.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== "All") {
      filtered = filtered.filter(fse => fse.status === filterStatus);
    }
    
    if (filterTerritory !== "All") {
      filtered = filtered.filter(fse => 
        fse.assignedTerritory.includes(filterTerritory)
      );
    }
    
    setFilteredFSEs(filtered);
  }, [fses, searchTerm, filterStatus, filterTerritory]);

  const handleCreateFSE = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required fields
      if (!newFSE.name || !newFSE.email || !newFSE.phone || !newFSE.employeeId) {
        setError('Please fill in all required fields');
        return;
      }

      await apiClient.createFSE(newFSE);
      
      setShowAddModal(false);
      setNewFSE({
        name: "",
        email: "",
        phone: "",
        employeeId: "",
        designation: "Field Service Engineer",
        specialization: [],
        assignedTerritory: [],
        status: "Active",
        experience: 0,
        certifications: [],
        supervisor: {
          name: "",
          email: "",
          phone: ""
        },
        emergencyContact: {
          name: "",
          relationship: "",
          phone: ""
        }
      });

      (window as any).showToast?.({
        type: 'success',
        title: 'FSE Created',
        message: `${newFSE.name} has been added successfully`
      });
    } catch (err: any) {
      console.error('Error creating FSE:', err);
      setError('Failed to create FSE: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFSE = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!selectedFSE) {
        console.error('No FSE selected for update');
        return;
      }
      
      console.log('Updating FSE:', selectedFSE._id, selectedFSE);
      
      const result = await apiClient.updateFSE(selectedFSE._id, selectedFSE);
      console.log('Update result:', result);
      
      setShowEditModal(false);
      setSelectedFSE(null);

      (window as any).showToast?.({
        type: 'success',
        title: 'FSE Updated',
        message: `${selectedFSE.name} has been updated successfully`
      });
    } catch (err: any) {
      console.error('Error updating FSE:', err);
      setError('Failed to update FSE: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFSE = async (fseId: string) => {
    if (!confirm('Are you sure you want to delete this FSE?')) return;
    
    try {
      setIsLoading(true);
      await apiClient.deleteFSE(fseId);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'FSE Deleted',
        message: 'FSE has been deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting FSE:', err);
      setError('Failed to delete FSE: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMetrics = (fse: FSE) => {
    setSelectedFSE(fse);
    setSelectedFSEMetrics(calculateFSEMetrics(fse));
    setShowMetricsModal(true);
  };

  const handleViewReports = async (fse: FSE) => {
    try {
      setLoadingReports(true);
      setSelectedFSE(fse);
      
      // Load service reports for this FSE
      const response = await apiClient.getAllServiceReports();
      const fseReports = response.filter((report: any) => 
        report.engineer?.name === fse.name || 
        report.engineer?.email === fse.email
      );
      
      setFseReports(fseReports);
      setShowReportsModal(true);
    } catch (err: any) {
      console.error('Error loading FSE reports:', err);
      setError('Failed to load FSE reports: ' + err.message);
    } finally {
      setLoadingReports(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-600";
      case "Inactive":
        return "bg-gray-600";
      case "On Leave":
        return "bg-orange-600";
      case "On Duty":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTerritoryColor = (territory: string) => {
    const colors = [
      "bg-blue-600", "bg-green-600", "bg-purple-600", 
      "bg-orange-600", "bg-red-600", "bg-indigo-600"
    ];
    return colors[territory.length % colors.length];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">FSE Management</h1>
            <p className="text-sm text-dark-secondary mt-1">Manage Field Service Engineers and their assignments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Add FSE
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total FSEs</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{fseStats.totalFSEs}</div>
              <p className="text-xs text-dark-secondary">
                {fseStats.activeFSEs} active, {fseStats.onDutyFSEs} on duty
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total Services</CardTitle>
              <Wrench className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{fseStats.totalServices}</div>
              <p className="text-xs text-dark-secondary">
                Across all FSEs
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{fseStats.averageRating}</div>
              <p className="text-xs text-dark-secondary">
                Customer satisfaction
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">On Leave</CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{fseStats.onLeaveFSEs}</div>
              <p className="text-xs text-dark-secondary">
                Currently unavailable
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">
                <span className="text-green-400">Reports Filled</span>
              </div>
              <p className="text-xs text-dark-secondary">
                Click "Reports" on any FSE card to view
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary w-4 h-4" />
              <Input
                placeholder="Search FSEs by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-card border-dark-color text-dark-primary"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="On Duty">On Duty</option>
            </select>
            <select
              value={filterTerritory}
              onChange={(e) => setFilterTerritory(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Territories</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="Central">Central</option>
            </select>
          </div>
        </div>

        {/* FSE List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFSEs.map((fse) => (
            <Card key={fse._id} className="dark-card hover:dark-shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-dark-tag rounded-lg flex items-center justify-center relative">
                      <div className="w-6 h-6 text-blue-400" />
                      {/* Reports indicator dot */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-bg flex items-center justify-center">
                        <FileText className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-dark-primary">{fse.name}</CardTitle>
                      <CardDescription className="text-dark-secondary">{fse.designation}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(fse.status)}>
                      {fse.status}
                    </Badge>
                    <Badge className="bg-green-600 text-white text-xs">
                      Reports Available
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{fse.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{fse.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{fse.employeeId}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{fse.experience} years exp.</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {fse.assignedTerritory.map((territory, index) => (
                      <Badge key={index} className={`${getTerritoryColor(territory)} text-white text-xs`}>
                        {territory}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">
                      {fse.certifications.length} certifications
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">
                      <span className="text-green-400 font-medium">Reports Available</span> - Click "Reports" to view
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-dark-color">
                  <Button
                    onClick={() => {
                      setSelectedFSE(fse);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 dark-button-secondary"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleViewMetrics(fse)}
                    className="flex-1 dark-button-primary"
                    size="sm"
                  >
                    <div className="w-4 h-4 mr-1" />
                    Metrics
                  </Button>
                  <Button
                    onClick={() => handleViewReports(fse)}
                    className="flex-1 dark-button-secondary"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Reports
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedFSE(fse);
                      setShowEditModal(true);
                    }}
                    className="flex-1 dark-button-secondary"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFSEs.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-dark-secondary" />
            <p className="text-dark-secondary">No FSEs found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add FSE Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Add New FSE</h2>
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
                  <label className="text-sm font-medium text-dark-secondary">Name *</label>
                  <Input
                    value={newFSE.name}
                    onChange={(e) => setNewFSE({...newFSE, name: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Email *</label>
                  <Input
                    type="email"
                    value={newFSE.email}
                    onChange={(e) => setNewFSE({...newFSE, email: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Phone *</label>
                  <Input
                    value={newFSE.phone}
                    onChange={(e) => setNewFSE({...newFSE, phone: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Employee ID *</label>
                  <Input
                    value={newFSE.employeeId}
                    onChange={(e) => setNewFSE({...newFSE, employeeId: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Designation</label>
                  <select
                    value={newFSE.designation}
                    onChange={(e) => setNewFSE({...newFSE, designation: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Field Service Engineer">Field Service Engineer</option>
                    <option value="Senior FSE">Senior FSE</option>
                    <option value="Lead FSE">Lead FSE</option>
                    <option value="Technical Specialist">Technical Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Experience (Years)</label>
                  <Input
                    type="number"
                    value={newFSE.experience}
                    onChange={(e) => setNewFSE({...newFSE, experience: Number(e.target.value)})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Status</label>
                <select
                  value={newFSE.status}
                  onChange={(e) => setNewFSE({...newFSE, status: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="On Duty">On Duty</option>
                </select>
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
                onClick={handleCreateFSE}
                disabled={isLoading || !newFSE.name || !newFSE.email || !newFSE.phone || !newFSE.employeeId}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create FSE'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FSE Metrics Modal */}
      {showMetricsModal && selectedFSE && selectedFSEMetrics && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">
                Performance Metrics - {selectedFSE.name}
              </h2>
              <button 
                onClick={() => setShowMetricsModal(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-secondary">Total Services</CardTitle>
                  <Wrench className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dark-primary">{selectedFSEMetrics.totalServices}</div>
                  <p className="text-xs text-dark-secondary">
                    {selectedFSEMetrics.completedServices} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-secondary">Rating</CardTitle>
                  <Star className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dark-primary">{selectedFSEMetrics.averageRating}/5.0</div>
                  <p className="text-xs text-dark-secondary">
                    Customer satisfaction
                  </p>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-secondary">Total Hours</CardTitle>
                  <Clock className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dark-primary">{selectedFSEMetrics.totalHours}h</div>
                  <p className="text-xs text-dark-secondary">
                    Service hours logged
                  </p>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-secondary">Recommendations</CardTitle>
                  <div className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dark-primary">{selectedFSEMetrics.recommendations}</div>
                  <p className="text-xs text-dark-secondary">
                    Parts & services suggested
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-dark-primary">Territories</CardTitle>
                  <CardDescription className="text-dark-secondary">Assigned service areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedFSEMetrics.territories.map((territory, index) => (
                      <Badge key={index} className={`${getTerritoryColor(territory)} text-white`}>
                        {territory}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-dark-primary">Specializations</CardTitle>
                  <CardDescription className="text-dark-secondary">Technical expertise areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedFSEMetrics.specializations.map((spec, index) => (
                      <Badge key={index} className="bg-indigo-600 text-white">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowMetricsModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowMetricsModal(false);
                  setSelectedFSE(selectedFSE);
                  setShowDetailModal(true);
                }}
                className="flex-1 dark-button-primary"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit FSE Modal */}
      {showEditModal && selectedFSE && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Edit FSE</h2>
              <button 
                onClick={() => setShowEditModal(false)}
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
                  <label className="text-sm font-medium text-dark-secondary">Name *</label>
                  <Input
                    value={selectedFSE.name}
                    onChange={(e) => setSelectedFSE({...selectedFSE, name: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Email *</label>
                  <Input
                    type="email"
                    value={selectedFSE.email}
                    onChange={(e) => setSelectedFSE({...selectedFSE, email: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Phone *</label>
                  <Input
                    value={selectedFSE.phone}
                    onChange={(e) => setSelectedFSE({...selectedFSE, phone: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Employee ID *</label>
                  <Input
                    value={selectedFSE.employeeId}
                    onChange={(e) => setSelectedFSE({...selectedFSE, employeeId: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Designation</label>
                  <select
                    value={selectedFSE.designation}
                    onChange={(e) => setSelectedFSE({...selectedFSE, designation: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Field Service Engineer">Field Service Engineer</option>
                    <option value="Senior FSE">Senior FSE</option>
                    <option value="Lead FSE">Lead FSE</option>
                    <option value="Technical Specialist">Technical Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Experience (Years)</label>
                  <Input
                    type="number"
                    value={selectedFSE.experience}
                    onChange={(e) => setSelectedFSE({...selectedFSE, experience: Number(e.target.value)})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Status</label>
                <select
                  value={selectedFSE.status}
                  onChange={(e) => setSelectedFSE({...selectedFSE, status: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="On Duty">On Duty</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Assigned Territories</label>
                <div className="mt-2 space-y-2">
                  {['North', 'South', 'East', 'West', 'Central', 'NCR'].map((territory) => (
                    <label key={territory} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFSE.assignedTerritory.includes(territory)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFSE({
                              ...selectedFSE,
                              assignedTerritory: [...selectedFSE.assignedTerritory, territory]
                            });
                          } else {
                            setSelectedFSE({
                              ...selectedFSE,
                              assignedTerritory: selectedFSE.assignedTerritory.filter(t => t !== territory)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-dark-primary">{territory}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Specializations</label>
                <div className="mt-2 space-y-2">
                  {['Projector Installation', 'Maintenance', 'Repair', 'Network Setup', 'Software Configuration', 'Hardware Troubleshooting'].map((spec) => (
                    <label key={spec} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFSE.specialization.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFSE({
                              ...selectedFSE,
                              specialization: [...selectedFSE.specialization, spec]
                            });
                          } else {
                            setSelectedFSE({
                              ...selectedFSE,
                              specialization: selectedFSE.specialization.filter(s => s !== spec)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-dark-primary">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Supervisor Name</label>
                  <Input
                    value={selectedFSE.supervisor.name}
                    onChange={(e) => setSelectedFSE({
                      ...selectedFSE,
                      supervisor: {...selectedFSE.supervisor, name: e.target.value}
                    })}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Supervisor name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Supervisor Email</label>
                  <Input
                    type="email"
                    value={selectedFSE.supervisor.email}
                    onChange={(e) => setSelectedFSE({
                      ...selectedFSE,
                      supervisor: {...selectedFSE.supervisor, email: e.target.value}
                    })}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Supervisor email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Emergency Contact Name</label>
                  <Input
                    value={selectedFSE.emergencyContact.name}
                    onChange={(e) => setSelectedFSE({
                      ...selectedFSE,
                      emergencyContact: {...selectedFSE.emergencyContact, name: e.target.value}
                    })}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Emergency Contact Phone</label>
                  <Input
                    value={selectedFSE.emergencyContact.phone}
                    onChange={(e) => setSelectedFSE({
                      ...selectedFSE,
                      emergencyContact: {...selectedFSE.emergencyContact, phone: e.target.value}
                    })}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Emergency Contact Relationship</label>
                <Input
                  value={selectedFSE.emergencyContact.relationship}
                  onChange={(e) => setSelectedFSE({
                    ...selectedFSE,
                    emergencyContact: {...selectedFSE.emergencyContact, relationship: e.target.value}
                  })}
                  className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
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
                onClick={handleUpdateFSE}
                disabled={isLoading || !selectedFSE.name || !selectedFSE.email || !selectedFSE.phone || !selectedFSE.employeeId}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update FSE'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FSE Reports Modal */}
      {showReportsModal && selectedFSE && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">
                Service Reports - {selectedFSE.name}
              </h2>
              <button 
                onClick={() => setShowReportsModal(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingReports ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-dark-secondary">Loading reports...</p>
              </div>
            ) : fseReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-dark-secondary" />
                <h3 className="text-lg font-medium text-dark-primary mb-2">No Reports Found</h3>
                <p className="text-dark-secondary">
                  {selectedFSE.name} hasn't submitted any service reports yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-dark-primary">
                    Service Reports ({fseReports.length})
                  </h3>
                  <Badge className="bg-green-600 text-white">
                    Reports Filled: {fseReports.length}
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {fseReports.map((report) => (
                    <Card key={report._id} className="dark-card hover:dark-shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-dark-primary text-lg">
                                {report.reportNumber}
                              </h4>
                              <p className="text-sm text-dark-secondary">
                                {report.reportTitle} - {report.reportType}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-600 text-white">
                            Completed
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-dark-card p-3 rounded-lg border border-dark-color">
                            <div className="text-dark-secondary font-medium">Site</div>
                            <div className="text-dark-primary">{report.siteName}</div>
                          </div>
                          <div className="bg-dark-card p-3 rounded-lg border border-dark-color">
                            <div className="text-dark-secondary font-medium">Projector</div>
                            <div className="text-dark-primary">{report.brand} {report.projectorModel}</div>
                          </div>
                          <div className="bg-dark-card p-3 rounded-lg border border-dark-color">
                            <div className="text-dark-secondary font-medium">Serial Number</div>
                            <div className="text-dark-primary">{report.projectorSerial}</div>
                          </div>
                          <div className="bg-dark-card p-3 rounded-lg border border-dark-color">
                            <div className="text-dark-secondary font-medium">Date</div>
                            <div className="text-dark-primary">{formatDate(report.date)}</div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-dark-color">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-dark-secondary">Opticals: {report.sections?.opticals?.length || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-dark-secondary">Electronics: {report.sections?.electronics?.length || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-dark-secondary">Mechanical: {report.sections?.mechanical?.length || 0}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="dark-button-secondary"
                                onClick={() => {
                                  // Open report in new tab for viewing
                                  window.open(`/service-reports/${report._id}`, '_blank');
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Report
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="dark-button-primary"
                                onClick={() => {
                                  // Export PDF functionality
                                  (window as any).showToast?.({
                                    type: 'success',
                                    title: 'Report Export',
                                    message: 'PDF export functionality will be implemented here.'
                                  });
                                }}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Export PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-blue-400 mb-2">Report Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-300">Total Reports</div>
                      <div className="text-white font-semibold">{fseReports.length}</div>
                    </div>
                    <div>
                      <div className="text-blue-300">Latest Report</div>
                      <div className="text-white font-semibold">
                        {fseReports.length > 0 ? formatDate(fseReports[0].date) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-300">Report Types</div>
                      <div className="text-white font-semibold">
                        {[...new Set(fseReports.map(r => r.reportType))].join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-300">Sites Covered</div>
                      <div className="text-white font-semibold">
                        {[...new Set(fseReports.map(r => r.siteName))].length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowReportsModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowReportsModal(false);
                  setSelectedFSE(selectedFSE);
                  setShowMetricsModal(true);
                }}
                className="flex-1 dark-button-primary"
              >
                View Performance Metrics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 