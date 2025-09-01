import { useState, useEffect } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

import { 
  Package, 
  Plus, 
  Search, 
  Download,
  Edit,
  Eye,
  AlertTriangle,
  Tag,
  Calendar,
  User,
  Monitor,
  Loader2,
  X,
  Target,
  TrendingUp,
  Zap,
  Lightbulb,
  CheckSquare
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { useData } from "../../contexts/DataContext";

interface ServiceRecommendation {
  id: string;
  serviceId: string;
  projectorSerial: string;
  fseId: string;
  fseName: string;
  partNumber: string;
  partName: string;
  type: "Spare Part" | "RMA Part" | "Preventive Maintenance" | "Upgrade";
  priority: "High" | "Medium" | "Low";
  reason: string;
  estimatedCost: number;
  status: "Pending" | "Approved" | "Rejected" | "Ordered" | "Received" | "Installed";
  technician: string;
  serviceDate: string;
  notes: string;
  customerFeedback?: string;
  actualCost?: number;
  installationDate?: string;
  warrantyInfo?: string;
}

export function ServiceRecommendationsPage() {
  const { services, fses, serviceVisits, projectors } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterFSE, setFilterFSE] = useState("All");
  const [selectedRecommendation, setSelectedRecommendation] = useState<ServiceRecommendation | null>(null);
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [newRecommendation, setNewRecommendation] = useState({
    serviceId: "",
    projectorSerial: "",
    fseId: "",
    fseName: "",
    partNumber: "",
    partName: "",
    type: "Spare Part" as const,
    priority: "Medium" as const,
    reason: "",
    estimatedCost: 0,
    status: "Pending" as const,
    technician: "",
    serviceDate: "",
    notes: ""
  });

  const [testRecommendation, setTestRecommendation] = useState({
    projectorSerial: "",
    serviceType: "AMC Service 1" as const,
    issues: [] as string[],
    fseId: "",
    customerFeedback: "",
    recommendations: [] as any[]
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch live queue from backend
      const items = await apiClient.getRecommendedSpares();
      const mapStatus = (s: string): ServiceRecommendation['status'] => {
        switch (s) {
          case 'Approved': return 'Approved';
          case 'Ordered': return 'Ordered';
          case 'Issued': return 'Installed';
          case 'Rejected': return 'Rejected';
          default: return 'Pending'; // New/Reviewed/Archived => Pending
        }
      };
      const mapped: ServiceRecommendation[] = (items || []).map((it: any) => ({
        id: it._id,
        serviceId: it.visitId || '',
        projectorSerial: it.projectorSerial || '',
        fseId: it.requestedBy?.userId || '',
        fseName: it.requestedBy?.name || 'FSE',
        partNumber: it.partNumber || '',
        partName: it.partName || '',
        type: 'Spare Part',
        priority: 'Medium',
        reason: it.notes || '',
        estimatedCost: 0,
        status: mapStatus(it.status),
        technician: it.requestedBy?.name || '',
        serviceDate: it.createdAt ? new Date(it.createdAt).toISOString().split('T')[0] : '',
        notes: it.notes || ''
      }));
      setRecommendations(mapped);
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecommendation = async () => {
    try {
      setIsLoading(true);
      
      const newRec: ServiceRecommendation = {
        id: `rec-${Date.now()}`,
        ...newRecommendation,
        fseName: fses.find(f => f._id === newRecommendation.fseId)?.name || newRecommendation.fseName
      };
      
      setRecommendations(prev => [newRec, ...prev]);
      setShowAddModal(false);
      setNewRecommendation({
        serviceId: "",
        projectorSerial: "",
        fseId: "",
        fseName: "",
        partNumber: "",
        partName: "",
        type: "Spare Part",
        priority: "Medium",
        reason: "",
        estimatedCost: 0,
        status: "Pending",
        technician: "",
        serviceDate: "",
        notes: ""
      });

      (window as any).showToast?.({
        type: 'success',
        title: 'Recommendation Added',
        message: 'New recommendation has been added successfully'
      });
    } catch (err: any) {
      console.error('Error adding recommendation:', err);
      setError('Failed to add new recommendation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRecommendation = async () => {
    try {
      setIsLoading(true);
      
      // Simple AI mock: create one recommended spare and persist to backend queue
      const aiItem = {
        reportId: `AI-${Date.now()}`,
        visitId: `SRV-AI-${Date.now()}`,
        projectorSerial: testRecommendation.projectorSerial,
        partNumber: 'LAMP-001',
        partName: 'Projector Lamp',
        quantity: 1,
        notes: `AI-generated recommendation based on ${testRecommendation.serviceType}${testRecommendation.customerFeedback ? ` | Feedback: ${testRecommendation.customerFeedback}` : ''}`,
        status: 'New'
      } as any;

      await apiClient.createRecommendedSpare(aiItem);
      // Reload from backend so UI shows persisted item
      await loadRecommendations();
      setShowTestModal(false);
      setTestRecommendation({
        projectorSerial: "",
        serviceType: "AMC Service 1",
        issues: [],
        fseId: "",
        customerFeedback: "",
        recommendations: []
      });

      (window as any).showToast?.({
        type: 'success',
        title: 'AI Recommendation Generated',
        message: 'Saved to Recommended Spares queue'
      });
    } catch (err: any) {
      console.error('Error testing recommendation:', err);
      setError('Failed to generate test recommendation.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-600";
      case "Medium":
        return "bg-yellow-600";
      case "Low":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Spare Part":
        return "bg-blue-600";
      case "RMA Part":
        return "bg-red-600";
      case "Preventive Maintenance":
        return "bg-green-600";
      case "Upgrade":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-600";
      case "Approved":
        return "bg-green-600";
      case "Rejected":
        return "bg-red-600";
      case "Ordered":
        return "bg-blue-600";
      case "Received":
        return "bg-indigo-600";
      case "Installed":
        return "bg-green-700";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = 
      rec.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.projectorSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.fseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "All" || rec.type === filterType;
    const matchesPriority = filterPriority === "All" || rec.priority === filterPriority;
    const matchesStatus = filterStatus === "All" || rec.status === filterStatus;
    const matchesFSE = filterFSE === "All" || rec.fseId === filterFSE;

    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesFSE;
  });

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Service Recommendations</h1>
            <p className="text-sm text-dark-secondary mt-1">FSE recommendations and AI-powered suggestions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowTestModal(true)}
              className="dark-button-secondary gap-2 flex items-center"
            >
              <Zap className="w-4 h-4" />
              Test AI
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Add Recommendation
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total Recommendations</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{recommendations.length}</div>
              <p className="text-xs text-dark-secondary">
                {recommendations.filter(r => r.status === 'Approved').length} approved
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">
                {recommendations.filter(r => r.priority === 'High').length}
              </div>
              <p className="text-xs text-dark-secondary">
                Urgent attention required
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">
                ₹{recommendations.reduce((sum, r) => sum + r.estimatedCost, 0).toLocaleString()}
              </div>
              <p className="text-xs text-dark-secondary">
                Estimated total cost
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">AI Generated</CardTitle>
              <Lightbulb className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">
                {recommendations.filter(r => r.notes?.includes('AI-generated')).length}
              </div>
              <p className="text-xs text-dark-secondary">
                AI-powered suggestions
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
                placeholder="Search recommendations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-card border-dark-color text-dark-primary"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Types</option>
              <option value="Spare Part">Spare Parts</option>
              <option value="RMA Part">RMA Parts</option>
              <option value="Preventive Maintenance">Preventive Maintenance</option>
              <option value="Upgrade">Upgrades</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Ordered">Ordered</option>
              <option value="Received">Received</option>
              <option value="Installed">Installed</option>
            </select>
            <select
              value={filterFSE}
              onChange={(e) => setFilterFSE(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All FSEs</option>
              {fses.map(fse => (
                <option key={fse._id} value={fse._id}>{fse.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="dark-card hover:dark-shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-dark-tag rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-dark-primary">{rec.partName}</CardTitle>
                      <CardDescription className="text-dark-secondary">{rec.partNumber}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <Badge className={getTypeColor(rec.type)}>
                      {rec.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{rec.projectorSerial}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{rec.fseName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{formatDate(rec.serviceDate)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">₹{rec.estimatedCost.toLocaleString()}</span>
                  </div>

                  <div className="text-sm text-dark-secondary line-clamp-2">
                    {rec.reason}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(rec.status)}>
                      {rec.status}
                    </Badge>
                    {rec.customerFeedback && (
                      <Badge className="bg-green-600 text-white">
                        Customer Approved
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-dark-color">
                  <Button
                    onClick={() => {
                      setSelectedRecommendation(rec);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 dark-button-secondary"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedRecommendation(rec);
                      // Handle approval logic
                    }}
                    className="flex-1 dark-button-primary"
                    size="sm"
                    disabled={rec.status !== 'Pending'}
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto mb-4 text-dark-secondary" />
            <p className="text-dark-secondary">No recommendations found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Test AI Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Test AI Recommendations</h2>
              <button 
                onClick={() => setShowTestModal(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-dark-secondary">Projector Serial</label>
                <select
                  value={testRecommendation.projectorSerial}
                  onChange={(e) => setTestRecommendation({ ...testRecommendation, projectorSerial: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                >
                  <option value="">Select projector</option>
                  {projectors.map((p: any) => (
                    <option key={p._id || p.serialNumber} value={p.serialNumber}>
                      {p.serialNumber} {p.brand ? `- ${p.brand}` : ''} {p.model ? ` ${p.model}` : ''} {p.site ? `- ${p.site}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Service Type</label>
                <select
                  value={testRecommendation.serviceType}
                  onChange={(e) => setTestRecommendation({...testRecommendation, serviceType: e.target.value as any})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                >
                  <option value="AMC Service 1">AMC Service 1</option>
                  <option value="AMC Service 2">AMC Service 2</option>
                  <option value="Special Service">Special Service</option>
                  <option value="Emergency Repair">Emergency Repair</option>
                  <option value="Preventive Maintenance">Preventive Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">FSE</label>
                <select
                  value={testRecommendation.fseId}
                  onChange={(e) => setTestRecommendation({...testRecommendation, fseId: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                >
                  <option value="">Select FSE</option>
                  {fses.map(fse => (
                    <option key={fse._id} value={fse._id}>{fse.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Customer Feedback (Optional)</label>
                <textarea
                  value={testRecommendation.customerFeedback}
                  onChange={(e) => setTestRecommendation({...testRecommendation, customerFeedback: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  rows={3}
                  placeholder="Any customer feedback or issues reported..."
                />
              </div>

              <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-blue-400">AI Analysis</span>
                </div>
                <p className="text-sm text-blue-300">
                  The AI will analyze the service data and generate recommendations based on:
                </p>
                <ul className="text-sm text-blue-300 mt-2 space-y-1">
                  <li>• Projector usage patterns and maintenance history</li>
                  <li>• Common failure patterns and preventive measures</li>
                  <li>• Manufacturer recommendations and warranty status</li>
                  <li>• Cost-benefit analysis of recommended parts</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowTestModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleTestRecommendation}
                disabled={isLoading || !testRecommendation.projectorSerial || !testRecommendation.fseId}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate AI Recommendations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Detail Modal */}
      {showDetailModal && selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">
                Recommendation Details - {selectedRecommendation.partName}
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Part Number</label>
                    <p className="text-dark-primary font-medium">{selectedRecommendation.partNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Projector Serial</label>
                    <p className="text-dark-primary">{selectedRecommendation.projectorSerial}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">FSE</label>
                    <p className="text-dark-primary">{selectedRecommendation.fseName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Service Date</label>
                    <p className="text-dark-primary">{formatDate(selectedRecommendation.serviceDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Reason</label>
                    <p className="text-dark-primary">{selectedRecommendation.reason}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-primary mb-4">Status & Cost</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedRecommendation.status)}>
                      {selectedRecommendation.status}
                    </Badge>
                    <Badge className={getPriorityColor(selectedRecommendation.priority)}>
                      {selectedRecommendation.priority} Priority
                    </Badge>
                    <Badge className={getTypeColor(selectedRecommendation.type)}>
                      {selectedRecommendation.type}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Estimated Cost</label>
                    <p className="text-dark-primary font-medium">₹{selectedRecommendation.estimatedCost.toLocaleString()}</p>
                  </div>
                  
                  {selectedRecommendation.actualCost && (
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Actual Cost</label>
                      <p className="text-dark-primary font-medium">₹{selectedRecommendation.actualCost.toLocaleString()}</p>
                    </div>
                  )}

                  {selectedRecommendation.customerFeedback && (
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Customer Feedback</label>
                      <p className="text-dark-primary">{selectedRecommendation.customerFeedback}</p>
                    </div>
                  )}

                  {selectedRecommendation.warrantyInfo && (
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Warranty Status</label>
                      <p className="text-dark-primary">{selectedRecommendation.warrantyInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dark-color">
              <div className="flex space-x-3">
                <Button className="dark-button-primary">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Approve Recommendation
                </Button>
                <Button className="dark-button-secondary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button className="dark-button-secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Report Spare Parts Section */}
      <div className="mt-12">
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Spare Parts from Service Reports
            </CardTitle>
            <CardDescription>
              Spare parts recommended by FSEs during service visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceReportSpareParts />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Component to display spare parts from service reports
function ServiceReportSpareParts() {
  const [serviceReports, setServiceReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceReportSpareParts();
  }, []);

  const loadServiceReportSpareParts = async () => {
    try {
      setLoading(true);
      const reports = await apiClient.getAllServiceReports();
      setServiceReports(reports || []);
    } catch (error) {
      console.error('Error loading service reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract all spare parts from service reports
  const allSpareParts = serviceReports.flatMap(report => 
    (report.recommendedParts || []).map((part: any) => ({
      ...part,
      reportNumber: report.reportNumber,
      siteName: report.siteName,
      projectorSerial: report.projectorSerial,
      engineerName: report.engineer?.name || 'Unknown',
      reportDate: report.date,
      reportType: report.reportType
    }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-dark-secondary" />
        <span className="ml-2 text-dark-secondary">Loading spare parts...</span>
      </div>
    );
  }

  if (allSpareParts.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No spare parts recommended in service reports yet</p>
        <p className="text-gray-400 text-sm">FSEs can add spare part recommendations when creating service reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allSpareParts.map((part, index) => (
        <div key={index} className="border border-dark-color rounded-lg p-4 bg-dark-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-dark-secondary">Part Name</label>
              <p className="text-dark-primary font-medium">{part.partName || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-secondary">Part Number</label>
              <p className="text-dark-primary">{part.partNumber || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-secondary">Quantity</label>
              <p className="text-dark-primary">{part.quantity || 1}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-secondary">Notes</label>
              <p className="text-dark-primary">{part.notes || 'No notes'}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-dark-color">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-dark-secondary">Report: </span>
                <span className="text-dark-primary">{part.reportNumber}</span>
              </div>
              <div>
                <span className="text-dark-secondary">Site: </span>
                <span className="text-dark-primary">{part.siteName}</span>
              </div>
              <div>
                <span className="text-dark-secondary">Projector: </span>
                <span className="text-dark-primary">{part.projectorSerial}</span>
              </div>
              <div>
                <span className="text-dark-secondary">Engineer: </span>
                <span className="text-dark-primary">{part.engineerName}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 