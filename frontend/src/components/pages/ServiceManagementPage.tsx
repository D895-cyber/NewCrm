import { useState, useEffect } from "react";
import { 
  // Monitor,
  // Clock,
  // Search,
  Plus,
  Edit,
  Eye,
  // RefreshCw,
  Wrench,
  // FileText,
  Download,
  // Building,
  // Users,
  Loader2,
  // X
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { apiClient } from "../../utils/api/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { convertToCSV, downloadCSV } from "../../utils/export";

interface ServiceVisit {
  _id?: string;
  visitId?: string;
  siteName?: string;
  site?: string;
  projectorSerial?: string;
  serialNumber?: string;
  fseName?: string;
  fse?: string;
  technician?: string;
  visitType?: string;
  type?: string;
  scheduledDate?: string;
  status?: string;
  priority?: string;
  description?: string;
  completedDate?: string;
  notes?: string;
}

interface ServicePlan {
  _id?: string;
  siteId: string;
  siteName: string;
  projectorSerial: string;
  projectorModel: string;
  selectedProjectors: string[];
  type: string;
  amcPeriod: string;
  date: string;
  technician: string;
  fseId: string;
  fseName: string;
  status: string;
  notes: string;
  recommendations: {
    spareParts: any[];
    rmaParts: any[];
  };
  cost: number;
  hours: number;
  nextServiceDate: string;
  warrantyStatus: string;
}

export function ServiceManagementPage() {
  const { sites, projectors, fses, serviceVisits, refreshServiceVisits } = useData();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("planning");
  
  // Service Planning states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [, setSelectedService] = useState<any>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  
  // Site-based selection state for planning
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [siteProjectors, setSiteProjectors] = useState<any[]>([]);
  const [selectedFSE, setSelectedFSE] = useState<any>(null);
  const [selectedProjectors, setSelectedProjectors] = useState<string[]>([]);
  
  const [newService, setNewService] = useState<ServicePlan>({
    siteId: "",
    siteName: "",
    projectorSerial: "",
    projectorModel: "",
    selectedProjectors: [],
    type: "AMC Service 1",
    amcPeriod: "AMC Period 1",
    date: "",
    technician: "",
    fseId: "",
    fseName: "",
    status: "Scheduled",
    notes: "",
    recommendations: {
      spareParts: [],
      rmaParts: []
    },
    cost: 0,
    hours: 0,
    nextServiceDate: "",
    warrantyStatus: "Under Warranty"
  });

  // Service Visits states
  const [filteredVisits, setFilteredVisits] = useState<ServiceVisit[]>([]);
  const [searchTermVisits, setSearchTermVisits] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedVisit, setSelectedVisit] = useState<ServiceVisit | null>(null);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [showEditVisitModal, setShowEditVisitModal] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [newVisit, setNewVisit] = useState({
    siteName: '',
    projectorSerial: '',
    selectedProjectors: [] as string[],
    fseName: '',
    visitType: 'Scheduled Maintenance',
    scheduledDate: '',
    priority: 'Medium',
    description: '',
    notes: ''
  });
  const [filteredProjectors, setFilteredProjectors] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterVisits();
  }, [serviceVisits, searchTermVisits, statusFilter, priorityFilter]);

  // projectors when site is selected for planning
  useEffect(() => {
    if (selectedSite) {
      const filteredProjectors = projectors.filter(p => p.site === selectedSite.name);
      setSiteProjectors(filteredProjectors);
      setNewService(prev => ({
        ...prev,
        siteId: selectedSite._id,
        siteName: selectedSite.name
      }));
    } else {
      setSiteProjectors([]);
    }
  }, [selectedSite, projectors]);

  // Update FSE info when FSE is selected for planning
  useEffect(() => {
    if (selectedFSE) {
      setNewService(prev => ({
        ...prev,
        fseId: selectedFSE.fseId,
        fseName: selectedFSE.name,
        technician: selectedFSE.name
      }));
    }
  }, [selectedFSE]);

  // projectors based on selected site for visits
  useEffect(() => {
    if (newVisit.siteName && projectors.length > 0) {
      const siteProjectors = projectors.filter(projector => 
        projector.siteName === newVisit.siteName || 
        projector.siteName === newVisit.siteName
      );
      setFilteredProjectors(siteProjectors);
      
      // Clear selected projector if it's not available for the new site
      if (newVisit.projectorSerial && !siteProjectors.find(p => p.serialNumber === newVisit.projectorSerial)) {
        setNewVisit(prev => ({ ...prev, projectorSerial: '' }));
      }
    } else {
      setFilteredProjectors([]);
    }
  }, [newVisit.siteName, projectors]);

  // Service Planning Functions
  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await apiClient.getServices();
      setServices(response || []);
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Failed to load services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleAddService = async () => {
    setIsLoadingServices(true);
    try {
      // If multiple projectors are selected, create separate service plans for each
      const projectorsToService = selectedProjectors.length > 0 
        ? selectedProjectors 
        : [newService.projectorSerial];

      for (const projectorSerial of projectorsToService) {
        if (!projectorSerial) continue;

        const serviceData = {
          ...newService,
          projectorSerial,
          selectedProjectors: [projectorSerial]
        };
        
        await apiClient.createService(serviceData);
      }

      await loadServices();
      setShowAddServiceModal(false);
      resetServiceForm();
    } catch (error) {
      console.error('Error adding service:', error);
      setError('Failed to add service');
    } finally {
      setIsLoadingServices(false);
    }
  };

  const resetServiceForm = () => {
    setNewService({
      siteId: "",
      siteName: "",
      projectorSerial: "",
      projectorModel: "",
      selectedProjectors: [],
      type: "AMC Service 1",
      amcPeriod: "AMC Period 1",
      date: "",
      technician: "",
      fseId: "",
      fseName: "",
      status: "Scheduled",
      notes: "",
      recommendations: {
        spareParts: [],
        rmaParts: []
      },
      cost: 0,
      hours: 0,
      nextServiceDate: "",
      warrantyStatus: "Under Warranty"
    });
    setSelectedSite(null);
    setSelectedFSE(null);
    setSelectedProjectors([]);
  };

  const exportServices = () => {
    const csvData = services.map(service => ({
      'Site Name': service.siteName,
      'Projector Serial': service.projectorSerial,
      'Type': service.type,
      'Date': service.date,
      'FSE': service.fseName,
      'Status': service.status,
      'Cost': service.cost,
      'Hours': service.hours
    }));
    
    const csv = convertToCSV(csvData);
    downloadCSV(services, 'service-planning-data.csv');
  };

  // Service Visits Functions
  const filterVisits = () => {
    let filtered = serviceVisits || [];

    if (searchTermVisits) {
      filtered = filtered.filter(visit =>
        visit.siteName?.toLowerCase().includes(searchTermVisits.toLowerCase()) ||
        visit.projectorSerial?.toLowerCase().includes(searchTermVisits.toLowerCase()) ||
        visit.fseName?.toLowerCase().includes(searchTermVisits.toLowerCase()) ||
        visit.visitType?.toLowerCase().includes(searchTermVisits.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(visit => visit.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(visit => visit.priority === priorityFilter);
    }

    setFilteredVisits(filtered);
  };

  const handleAddVisit = async () => {
    setLoadingVisits(true);
    try {
      // Validate required fields
      if (!newVisit.siteName || !newVisit.fseName || !newVisit.scheduledDate) {
        alert('Please fill in all required fields: Site, FSE, and Scheduled Date');
        return;
      }

      // Find the actual FSE ID based on the selected FSE name
      const selectedFSE = fses.find(fse => fse.name === newVisit.fseName);
      if (!selectedFSE) {
        alert('Selected FSE not found. Please select a valid FSE.');
        return;
      }

      // Find the actual site ID based on the selected site name
      const selectedSite = sites.find(site => site.name === newVisit.siteName);
      if (!selectedSite) {
        alert('Selected site not found. Please select a valid site.');
        return;
      }

      // If multiple projectors are selected, create separate visits for each
      const projectorsToVisit = newVisit.selectedProjectors.length > 0 
        ? newVisit.selectedProjectors 
        : [newVisit.projectorSerial];

      if (projectorsToVisit.length === 0 || (projectorsToVisit.length === 1 && !projectorsToVisit[0])) {
        alert('Please select at least one projector.');
        return;
      }

      for (const projectorSerial of projectorsToVisit) {
        if (!projectorSerial) continue;

        const visitData = {
          visitId: `VISIT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          siteId: selectedSite._id,
          siteName: newVisit.siteName,
          projectorSerial: projectorSerial,
          fseId: selectedFSE.fseId,
          fseName: newVisit.fseName,
          visitType: newVisit.visitType,
          scheduledDate: new Date(newVisit.scheduledDate).toISOString(),
          priority: newVisit.priority,
          description: newVisit.description || '',
          notes: newVisit.notes || '',
          status: 'Scheduled',
          amcServiceInterval: 'Outside AMC'
        };

        console.log('Creating visit with data:', visitData);
        await apiClient.createServiceVisit(visitData);
      }

      await refreshServiceVisits();
      setShowAddVisitModal(false);
      resetVisitForm();
    } catch (error) {
      console.error('Error adding visit:', error);
      alert('Failed to create service visit. Please try again.');
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleEditVisit = async () => {
    if (!selectedVisit?._id) return;
    
    setLoadingVisits(true);
    try {
      await apiClient.updateServiceVisit(selectedVisit._id, selectedVisit);
      await refreshServiceVisits();
      setShowEditVisitModal(false);
      setSelectedVisit(null);
    } catch (error) {
      console.error('Error updating visit:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm('Are you sure you want to delete this visit?')) return;
    
    setLoadingVisits(true);
    try {
      await apiClient.deleteServiceVisit(visitId);
      await refreshServiceVisits();
    } catch (error) {
      console.error('Error deleting visit:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  const resetVisitForm = () => {
    setNewVisit({
      siteName: '',
      projectorSerial: '',
      selectedProjectors: [],
      fseName: '',
      visitType: 'Scheduled Maintenance',
      scheduledDate: '',
      priority: 'Medium',
      description: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-2">Plan services and manage service visits in one place</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <div className="h-4 w-4" />
            Service Planning
          </TabsTrigger>
          <TabsTrigger value="visits" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Service Visits
          </TabsTrigger>
        </TabsList>

        {/* Service Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-5 w-5" />
                    Service Planning
                  </CardTitle>
                  <CardDescription>
                    Plan and schedule maintenance services for projectors
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportServices} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setShowAddServiceModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="AMC Service 1">AMC Service 1</SelectItem>
                    <SelectItem value="AMC Service 2">AMC Service 2</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Services Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Projector</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>FSE</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingServices ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No service plans found
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((service) => (
                        <TableRow key={service._id}>
                          <TableCell>{service.siteName}</TableCell>
                          <TableCell>{service.projectorSerial}</TableCell>
                          <TableCell>{service.type}</TableCell>
                          <TableCell>{new Date(service.date).toLocaleDateString()}</TableCell>
                          <TableCell>{service.fseName}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(service.status)}>
                              {service.status}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{service.cost}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Visits Tab */}
        <TabsContent value="visits" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Service Visits
                  </CardTitle>
                  <CardDescription>
                    Manage and track service visits for field engineers
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddVisitModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Visit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search visits..."
                    value={searchTermVisits}
                    onChange={(e) => setSearchTermVisits(e.target.value)}
                    className="max-w-sm text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visits Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Projector</TableHead>
                      <TableHead>FSE</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingVisits ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredVisits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No service visits found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVisits.map((visit) => (
                        <TableRow key={visit._id}>
                          <TableCell>{visit.siteName}</TableCell>
                          <TableCell>{visit.projectorSerial}</TableCell>
                          <TableCell>{visit.fseName}</TableCell>
                          <TableCell>{visit.visitType}</TableCell>
                          <TableCell>
                            {visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(visit.status || '')}>
                              {visit.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(visit.priority || '')}>
                              {visit.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedVisit(visit);
                                  setShowEditVisitModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteVisit(visit._id!)}
                              >
                                <div className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Service Plan Modal */}
      <Dialog open={showAddServiceModal} onOpenChange={setShowAddServiceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Service Plan</DialogTitle>
            <DialogDescription>
              Create a new service plan for projector maintenance
            </DialogDescription>
          </DialogHeader>
                      <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Site</label>
                  <Select onValueChange={(value) => {
                    const site = sites.find(s => s._id === value);
                    setSelectedSite(site);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site._id} value={site._id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">FSE</label>
                  <Select onValueChange={(value) => {
                    const fse = fses.find(f => f._id === value);
                    setSelectedFSE(fse);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select FSE" />
                    </SelectTrigger>
                    <SelectContent>
                      {fses.map((fse) => (
                        <SelectItem key={fse._id} value={fse._id}>
                          {fse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Projector Selection for Service Planning */}
              {selectedSite && (
                <div>
                  <label className="text-sm font-medium">Projector Selection</label>
                  <Select onValueChange={(value) => {
                    if (value === 'all') {
                      // Select all projectors for the site
                      const allProjectors = siteProjectors.map(p => p.serialNumber);
                      setSelectedProjectors(allProjectors);
                      setNewService(prev => ({ ...prev, projectorSerial: '' }));
                    } else if (value === 'single') {
                      // Clear multiple selection, allow single selection
                      setSelectedProjectors([]);
                      setNewService(prev => ({ ...prev, projectorSerial: '' }));
                    } else {
                      // Single projector selected
                      setSelectedProjectors([]);
                      setNewService(prev => ({ ...prev, projectorSerial: value }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select projectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        🎯 Select All Projectors ({siteProjectors.length})
                      </SelectItem>
                      <SelectItem value="single">
                        📋 Select Individual Projector
                      </SelectItem>
                      {siteProjectors.map((projector) => (
                        <SelectItem key={projector._id} value={projector.serialNumber}>
                          {projector.serialNumber} - {projector.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Show selected projectors */}
                  {(selectedProjectors.length > 0 || newService.projectorSerial) && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-2">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Selected Projectors:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProjectors.length > 0 ? (
                          selectedProjectors.map((serial, index) => {
                            const projector = siteProjectors.find(p => p.serialNumber === serial);
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {serial} - {projector?.model || 'Unknown Model'}
                              </Badge>
                            );
                          })
                        ) : (
                          newService.projectorSerial && (
                            <Badge variant="secondary" className="text-xs">
                              {newService.projectorSerial} - {siteProjectors.find(p => p.serialNumber === newService.projectorSerial)?.model || 'Unknown Model'}
                            </Badge>
                          )
                        )}
                      </div>
                      {selectedProjectors.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          💡 {selectedProjectors.length} service plan(s) will be created for the selected projectors
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <Select onValueChange={(value) => setNewService(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMC Service 1">AMC Service 1</SelectItem>
                    <SelectItem value="AMC Service 2">AMC Service 2</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newService.date}
                  onChange={(e) => setNewService(prev => ({ ...prev, date: e.target.value }))}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                placeholder="Enter service notes..."
                value={newService.notes}
                onChange={(e) => setNewService(prev => ({ ...prev, notes: e.target.value }))}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddServiceModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={isLoadingServices}>
              {isLoadingServices ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Visit Modal */}
      <Dialog open={showAddVisitModal} onOpenChange={setShowAddVisitModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Service Visit</DialogTitle>
            <DialogDescription>
              Schedule a new service visit for field engineers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Site</label>
                  <Select onValueChange={(value) => setNewVisit(prev => ({ ...prev, siteName: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site._id} value={site.name}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Projector Selection</label>
                  <Select onValueChange={(value) => {
                    if (value === 'all') {
                      // Select all projectors for the site
                      const allProjectors = filteredProjectors.map(p => p.serialNumber);
                      setNewVisit(prev => ({ 
                        ...prev, 
                        selectedProjectors: allProjectors,
                        projectorSerial: '' 
                      }));
                    } else if (value === 'single') {
                      // Clear multiple selection, allow single selection
                      setNewVisit(prev => ({ 
                        ...prev, 
                        selectedProjectors: [],
                        projectorSerial: '' 
                      }));
                    } else {
                      // Single projector selected
                      setNewVisit(prev => ({ 
                        ...prev, 
                        projectorSerial: value,
                        selectedProjectors: []
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select projectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        🎯 Select All Projectors ({filteredProjectors.length})
                      </SelectItem>
                      <SelectItem value="single">
                        📋 Select Individual Projector
                      </SelectItem>
                      {filteredProjectors.map((projector) => (
                        <SelectItem key={projector._id} value={projector.serialNumber}>
                          {projector.serialNumber} - {projector.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Show selected projectors */}
              {(newVisit.selectedProjectors.length > 0 || newVisit.projectorSerial) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selected Projectors:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {newVisit.selectedProjectors.length > 0 ? (
                      newVisit.selectedProjectors.map((serial, index) => {
                        const projector = filteredProjectors.find(p => p.serialNumber === serial);
                        return (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {serial} - {projector?.model || 'Unknown Model'}
                          </Badge>
                        );
                      })
                    ) : (
                      newVisit.projectorSerial && (
                        <Badge variant="secondary" className="text-xs">
                          {newVisit.projectorSerial} - {filteredProjectors.find(p => p.serialNumber === newVisit.projectorSerial)?.model || 'Unknown Model'}
                        </Badge>
                      )
                    )}
                  </div>
                  {newVisit.selectedProjectors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      💡 {newVisit.selectedProjectors.length} visit(s) will be created for the selected projectors
                    </p>
                  )}
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">FSE</label>
                <Select onValueChange={(value) => setNewVisit(prev => ({ ...prev, fseName: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select FSE" />
                  </SelectTrigger>
                  <SelectContent>
                    {fses.map((fse) => (
                      <SelectItem key={fse._id} value={fse.name}>
                        {fse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Visit Type</label>
                <Select onValueChange={(value) => setNewVisit(prev => ({ ...prev, visitType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled Maintenance">Scheduled Maintenance</SelectItem>
                    <SelectItem value="Emergency Repair">Emergency Repair</SelectItem>
                    <SelectItem value="Installation">Installation</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Scheduled Date</label>
                <Input
                  type="datetime-local"
                  value={newVisit.scheduledDate}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select onValueChange={(value) => setNewVisit(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter visit description..."
                value={newVisit.description}
                onChange={(e) => setNewVisit(prev => ({ ...prev, description: e.target.value }))}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                placeholder="Enter additional notes..."
                value={newVisit.notes}
                onChange={(e) => setNewVisit(prev => ({ ...prev, notes: e.target.value }))}
                className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddVisitModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVisit} disabled={loadingVisits}>
              {loadingVisits ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Visit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Modal */}
      <Dialog open={showEditVisitModal} onOpenChange={setShowEditVisitModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service Visit</DialogTitle>
            <DialogDescription>
              Update service visit details
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Site</label>
                  <Input value={selectedVisit.siteName || ''} readOnly className="text-white bg-gray-800 border-gray-600" />
                </div>
                <div>
                  <label className="text-sm font-medium">Projector</label>
                  <Input value={selectedVisit.projectorSerial || ''} readOnly className="text-white bg-gray-800 border-gray-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">FSE</label>
                  <Input value={selectedVisit.fseName || ''} readOnly className="text-white bg-gray-800 border-gray-600" />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={selectedVisit.status || ''} 
                    onValueChange={(value) => setSelectedVisit(prev => prev ? { ...prev, status: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Enter notes..."
                  value={selectedVisit.notes || ''}
                  onChange={(e) => setSelectedVisit(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditVisitModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVisit} disabled={loadingVisits}>
              {loadingVisits ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Visit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
