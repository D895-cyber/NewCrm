import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  Plus, 
  Search, 
  Download,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Monitor,
  Calculator,
  Loader2,
  MapPin,
  X
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV, generatePDF, downloadPDF } from "../../utils/export";
import { useData } from "../../contexts/DataContext";
import { SmartPOForm } from "../SmartPOForm";




export function PurchaseOrdersPage() {
  const { sites, projectors } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmartPOForm, setShowSmartPOForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [newPO, setNewPO] = useState({
    id: "",
    customer: "",
    site: "",
    siteId: "",
    projectors: [] as any[],
    priority: "Medium",
    status: "Pending",
    totalAmount: 0,
    dateRaised: "",
    expectedService: "",
    description: "",
    contact: {
      name: "",
      phone: "",
      email: ""
    }
  });

  // Load purchase orders from API
  const loadPurchaseOrders = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAllPurchaseOrders();
      setPurchaseOrders(data);
    } catch (err: any) {
      console.error('Error loading purchase orders:', err);
      // Set empty array if API fails
      setPurchaseOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load purchase orders on component mount
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Handle site selection
  const handleSiteSelection = (siteId: string) => {
    const site = sites.find(s => s._id === siteId);
    if (site) {
      setSelectedSite(site);
      const siteProjectors = projectors.filter(p => p.site === site.name);
      setNewPO({
        ...newPO,
        siteId: site._id,
        site: site.name,
        customer: site.customer || site.name,
        projectors: siteProjectors,
        contact: {
          name: String(site.contactPerson || ""),
          phone: String(site.contactPhone || ""),
          email: String(site.contactEmail || "")
        }
      });
    }
  };

  const handleEditPO = (po: any) => {
    setEditingPO(po);
    setShowEditModal(true);
  };

  const handlePOUpdated = (updatedPO: any) => {
    // Update the PO in the local state
    setPurchaseOrders(prev => 
      prev.map(po => 
        po._id === updatedPO._id || po.id === updatedPO.id ? updatedPO : po
      )
    );
    
    // Show success message
    (window as any).showToast?.({
      type: 'success',
      title: 'PO Updated',
      message: `PO ${updatedPO.poNumber || updatedPO.id} updated successfully`
    });
    
    setShowEditModal(false);
    setEditingPO(null);
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || po.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-600";
      case "Pending":
        return "bg-orange-600";
      case "In Progress":
        return "bg-blue-600";
      case "Completed":
        return "bg-gray-600";
      case "Rejected":
        return "bg-red-600";
      default:
        return "bg-gray-600";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "In Progress":
        return <AlertTriangle className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleCreatePO = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate PO ID if not provided
      const poData = {
        ...newPO,
        id: newPO.id || `PO-${Date.now()}`,
        dateRaised: newPO.dateRaised || new Date().toISOString().split('T')[0]
      };
      
      // Create PO via API
      await apiClient.createPurchaseOrder(poData);
      
      setShowAddModal(false);//False data send kardo
      setNewPO({
        id: "",
        customer: "",
        site: "",
        siteId: "",
        projectors: [] as any[],
        priority: "Medium",
        status: "Pending",
        totalAmount: 0,
        dateRaised: "",
        expectedService: "",
        description: "",
        contact: {
          name: "",
          phone: "",
          email: ""
        }
      });
      
      // Reload the PO list to show the new PO
      await loadPurchaseOrders();
      
      // Show success message
      (window as any).showToast?.({
        type: 'success',
        title: 'Purchase Order Created',
        message: `PO ${poData.id} has been created successfully`
      });
    } catch (err: any) {
      console.error('Error creating PO:', err);
      setError('Failed to create purchase order: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPOs = async () => {
    try {
      setIsLoading(true);
      const csvContent = convertToCSV(purchaseOrders, [
        'id', 'customer', 'site', 'status', 'priority', 'totalAmount', 'dateRaised', 'expectedService'
      ]);
      downloadCSV(csvContent, `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Export Successful',
        message: 'Purchase orders exported to CSV file'
      });
    } catch (err: any) {
      console.error('Error exporting POs:', err);
      setError('Failed to export purchase orders: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (poId: string) => {
    try {
      const po = purchaseOrders.find(p => p.id === poId);
      if (!po) {
        setError('Purchase order not found');
        return;
      }
      
      const pdfContent = await generatePDF(po, 'Purchase Order');
      downloadPDF(pdfContent, `PO_${poId}.pdf`);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Purchase order ${poId} PDF downloaded successfully`
      });
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF: ' + err.message);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Purchase Orders</h1>
            <p className="text-sm text-dark-secondary mt-1">Manage service requests and purchase orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleExportPOs}
              disabled={isLoading}
              className="dark-button-secondary gap-2 flex items-center"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Create PO
            </button>
            <button 
              onClick={() => setShowSmartPOForm(true)}
              className="dark-button-primary gap-2 flex items-center bg-green-600 hover:bg-green-700"
            >
              <Calculator className="w-4 h-4" />
              Smart PO
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Search and  */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary w-4 h-4" />
            <Input
              placeholder="Search PO ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-card border-dark-color text-dark-primary"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-dark-card border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="dark-card text-center">
            <h3 className="text-2xl font-bold text-dark-primary mb-1">{purchaseOrders.length}</h3>
            <p className="text-sm text-dark-secondary">Total POs</p>
          </div>
          
          <div className="dark-card text-center">
            <h3 className="text-2xl font-bold text-orange-400 mb-1">
              {purchaseOrders.filter(po => po.status === "Pending").length}
            </h3>
            <p className="text-sm text-dark-secondary">Pending</p>
          </div>
          
          <div className="dark-card text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-1">
              {purchaseOrders.filter(po => po.status === "Approved").length}
            </h3>
            <p className="text-sm text-dark-secondary">Approved</p>
          </div>
          
          <div className="dark-card text-center">
            <h3 className="text-2xl font-bold text-blue-400 mb-1">
              {purchaseOrders.filter(po => po.status === "In Progress").length}
            </h3>
            <p className="text-sm text-dark-secondary">In Progress</p>
          </div>
          
          <div className="dark-card text-center">
            <h3 className="text-2xl font-bold text-gray-400 mb-1">
              {purchaseOrders.filter(po => po.status === "Completed").length}
            </h3>
            <p className="text-sm text-dark-secondary">Completed</p>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="dark-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-color">
                  <th className="text-left font-semibold text-dark-primary pb-4">PO Details</th>
                  <th className="text-left font-semibold text-dark-primary pb-4">Customer & Site</th>
                  <th className="text-center font-semibold text-dark-primary pb-4">Projectors</th>
                  <th className="text-center font-semibold text-dark-primary pb-4">Priority</th>
                  <th className="text-center font-semibold text-dark-primary pb-4">Status</th>
                  <th className="text-right font-semibold text-dark-primary pb-4">Amount</th>
                  <th className="text-center font-semibold text-dark-primary pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po, index) => (
                  <tr key={index} className="border-b border-dark-color hover:bg-dark-table-hover transition-colors">
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-semibold text-dark-primary">{po.id}</p>
                        <p className="text-xs text-dark-secondary flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Raised: {po.dateRaised}
                        </p>
                        <p className="text-xs text-dark-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expected: {po.expectedService}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium text-dark-primary">{po.customer}</p>
                        <p className="text-xs text-dark-secondary flex items-center gap-1 mt-1">
                          {/* Assuming MapPin is not imported, using a placeholder or removing if not needed */}
                          {/* <MapPin className="w-3 h-3" /> */}
                          {po.site}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center">
                        {/* Assuming Monitor is not imported, using a placeholder or removing if not needed */}
                        {/* <Monitor className="w-4 h-4 text-dark-secondary mr-1" /> */}
                        <span className="text-sm font-medium text-dark-primary">
                          {po.projectors.length}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`text-sm font-semibold ${getPriorityColor(po.priority)}`}>
                        {po.priority}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className={`dark-tag ${getStatusColor(po.status)} flex items-center gap-1 justify-center`}>
                        {getStatusIcon(po.status)}
                        {po.status}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end">
                        {/* Assuming IndianRupee is not imported, using a placeholder or removing if not needed */}
                        {/* <IndianRupee className="w-4 h-4 text-dark-secondary" /> */}
                        <span className="text-sm font-semibold text-dark-primary">
                          {po.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                          onClick={() => setSelectedPO(po)}
                        >
                          <Eye className="w-4 h-4 text-dark-secondary" />
                        </button>
                        <button 
                          className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                          onClick={() => handleEditPO(po)}
                        >
                          <Edit className="w-4 h-4 text-dark-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PO Detail Modal */}
        {selectedPO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-primary">Purchase Order Details</h2>
                <button 
                  onClick={() => setSelectedPO(null)}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-dark-secondary" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">PO ID</label>
                    <p className="text-dark-primary font-semibold">{selectedPO.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Status</label>
                    <div className={`dark-tag ${getStatusColor(selectedPO.status)} inline-flex items-center gap-1 mt-1`}>
                      {getStatusIcon(selectedPO.status)}
                      {selectedPO.status}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Priority</label>
                    <p className={`font-semibold ${getPriorityColor(selectedPO.priority)}`}>
                      {selectedPO.priority}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Total Amount</label>
                    <p className="text-dark-primary font-semibold">₹{selectedPO.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Customer</label>
                      <p className="text-dark-primary">{selectedPO.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Site Location</label>
                      <p className="text-dark-primary">{selectedPO.site}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Contact Person</label>
                      <p className="text-dark-primary">
                        {selectedPO.contact && typeof selectedPO.contact === 'object' 
                          ? String(selectedPO.contact.name || 'Not specified')
                          : String(selectedPO.contact || 'Not specified')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary"></label>
                      <p className="text-dark-primary">
                        {selectedPO.contact && typeof selectedPO.contact === 'object'
                          ? String(selectedPO.contact.phone || 'Not specified')
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Projectors */}
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-3">Projectors & Services</h3>
                  <div className="space-y-3">
                    {selectedPO.projectors.map((projector: any, idx: number) => (
                      <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-color">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-dark-secondary">Model</label>
                            <p className="text-dark-primary">{projector.model}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-dark-secondary">Location</label>
                            <p className="text-dark-primary">{projector.location}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-dark-secondary">Service</label>
                            <p className="text-dark-primary">{projector.service}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Description</label>
                  <p className="text-dark-primary mt-1">{selectedPO.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  {selectedPO.status === "Pending" && (
                    <>
                      <button className="flex-1 dark-button-primary">Approve PO</button>
                      <button className="flex-1 dark-button-secondary">Request Changes</button>
                    </>
                  )}
                  {selectedPO.status === "Approved" && (
                    <button className="flex-1 dark-button-primary">Schedule Service</button>
                  )}
                  <button 
                    onClick={() => handleDownloadPDF(selectedPO.id)}
                    className="dark-button-secondary px-6"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Create New Purchase Order</h2>
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
                  <label className="text-sm font-medium text-dark-secondary">PO ID</label>
                  <Input
                    value={newPO.id}
                    onChange={(e) => setNewPO({...newPO, id: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="PO-2024-XXX (auto-generated if empty)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Customer *</label>
                  <Input
                    value={newPO.customer}
                    onChange={(e) => setNewPO({...newPO, customer: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter customer name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Site *</label>
                  <select
                    value={newPO.siteId}
                    onChange={(e) => handleSiteSelection(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="">Select a site</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.name} - {site.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Priority</label>
                  <select
                    value={newPO.priority}
                    onChange={(e) => setNewPO({...newPO, priority: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Site Details Display */}
              {selectedSite && (
                <div className="bg-dark-card-secondary rounded-lg p-4 border border-dark-color">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-dark-primary">Site Details</h3>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-dark-secondary">{selectedSite.location}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-dark-secondary">Total Projectors:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Monitor className="w-4 h-4 text-green-400" />
                        <span className="text-dark-primary font-medium">
                          {projectors.filter(p => p.site === selectedSite.name).length}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Site Type:</span>
                      <div className="mt-1">
                        <Badge className="bg-blue-600 text-white text-xs">
                          {selectedSite.siteType || 'Commercial'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Contact Person:</span>
                      <div className="mt-1 text-dark-primary">
                        {selectedSite.contactPerson ? String(selectedSite.contactPerson) : 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Working Hours:</span>
                      <div className="mt-1 text-dark-primary">
                        {selectedSite.openTime} - {selectedSite.closeTime}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Date Raised</label>
                  <Input
                    type="date"
                    value={newPO.dateRaised}
                    onChange={(e) => setNewPO({...newPO, dateRaised: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Expected Service Date</label>
                  <Input
                    type="date"
                    value={newPO.expectedService}
                    onChange={(e) => setNewPO({...newPO, expectedService: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Total Amount (₹)</label>
                  <Input
                    type="number"
                    value={newPO.totalAmount}
                    onChange={(e) => setNewPO({...newPO, totalAmount: Number(e.target.value)})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Status</label>
                  <select
                    value={newPO.status}
                    onChange={(e) => setNewPO({...newPO, status: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Description *</label>
                <textarea
                  value={newPO.description}
                  onChange={(e) => setNewPO({...newPO, description: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  rows={3}
                  placeholder="Describe the service request or purchase order"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-primary mb-3">Contact Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Contact Name</label>
                    <Input
                      value={newPO.contact.name}
                      onChange={(e) => setNewPO({...newPO, contact: {...newPO.contact, name: e.target.value}})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary"></label>
                    <Input
                      value={newPO.contact.phone}
                      onChange={(e) => setNewPO({...newPO, contact: {...newPO.contact, phone: e.target.value}})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Email</label>
                    <Input
                      type="email"
                      value={newPO.contact.email}
                      onChange={(e) => setNewPO({...newPO, contact: {...newPO.contact, email: e.target.value}})}
                      className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      placeholder="Enter email address"
                    />
                  </div>
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
                onClick={handleCreatePO}
                disabled={isLoading || !newPO.customer || !newPO.site || !newPO.description}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create PO'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart PO Form Modal */}
      {showSmartPOForm && (
        <SmartPOForm
          onClose={() => setShowSmartPOForm(false)}
          onPOCreated={(po) => {
            setShowSmartPOForm(false);
            // Refresh PO list
            loadPurchaseOrders();
            // Show success message
            (window as any).showToast?.({
              type: 'success',
              title: 'Smart PO Created',
              message: `PO ${po.poNumber || po.id} created with ${po.projectors?.length || po.lineItems?.length || 0} projectors and AMC contracts`
            });
          }}
        />
      )}

      {/* Edit PO Modal */}
      {showEditModal && editingPO && (
        <SmartPOForm
          editMode={true}
          existingPO={editingPO}
          onClose={() => {
            setShowEditModal(false);
            setEditingPO(null);
          }}
          onPOUpdated={handlePOUpdated}
          onPOCreated={() => {}} // Not used in edit mode
        />
      )}
    </>
  );
}