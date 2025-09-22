import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  Calendar, 
  Plus, 
  Search, 
  Download,
  Edit,
  Eye,
  FileText,
  User,
  Wrench,
  Monitor,
  Shield,
  Loader2,
  X,
  MapPin,
  Building,
  Users
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV } from "../../utils/export";
import { useData } from "../../contexts/DataContext";

export function ServicePlanningPage() {
  const { sites, projectors, fses } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  
  // Site-based selection state
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [siteProjectors, setSiteProjectors] = useState<any[]>([]);
  const [selectedFSE, setSelectedFSE] = useState<any>(null);
  const [selectedProjectors, setSelectedProjectors] = useState<string[]>([]);
  
  const [newService, setNewService] = useState({
    siteId: "",
    siteName: "",
    projectorSerial: "",
    projectorModel: "",
    selectedProjectors: [] as string[],
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

  useEffect(() => {
    loadServices();
  }, []);

  //  projectors when site is selected
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

  // Update FSE info when FSE is selected
  useEffect(() => {
    if (selectedFSE) {
      setNewService(prev => ({
        ...prev,
        fseId: selectedFSE.fseId, // Use fseId (String) instead of _id (ObjectId)
        fseName: selectedFSE.name,
        technician: selectedFSE.name
      }));
    }
  }, [selectedFSE]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAllServices();
      setServices(data);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setError('Failed to load services data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Creating service with data:', newService);

      // Validate required fields
      if (!newService.siteId || !newService.selectedProjectors.length || !newService.date || !newService.fseId) {
        console.error('Validation failed:', {
          siteId: newService.siteId,
          selectedProjectors: newService.selectedProjectors,
          date: newService.date,
          fseId: newService.fseId
        });
        setError('Please fill in all required fields');
        return;
      }

      // Create services for each selected projector
      const servicePromises = newService.selectedProjectors.map(async (projectorSerial) => {
        const projector = siteProjectors.find(p => p.serialNumber === projectorSerial);
        const serviceData = {
          projectorSerial: projectorSerial,
          siteName: newService.siteName,
          type: newService.type,
          amcPeriod: newService.amcPeriod,
          date: new Date(newService.date),
          technician: newService.fseName,
          status: newService.status,
          notes: newService.notes,
          recommendations: {
            spareParts: [],
            rmaParts: []
          },
          cost: newService.cost || 0,
          hours: newService.hours || 0,
          nextServiceDate: newService.nextServiceDate ? new Date(newService.nextServiceDate) : undefined,
          warrantyStatus: newService.warrantyStatus
        };

        console.log('Creating service for projector:', projectorSerial, serviceData);
        return apiClient.createService(serviceData);
      });

      // Create services for each selected projector
      const createdServices = await Promise.all(servicePromises);
      console.log('Services created successfully:', createdServices);
      
      // Automatically create service visits for each created service
      try {
        console.log('Creating service visits with FSE data:', {
          fseId: newService.fseId,
          fseName: newService.fseName
        });
        
        const visitPromises = createdServices.map(async (service) => {
          const serviceVisitData = {
            fseId: newService.fseId || "",
            fseName: newService.fseName,
            siteId: newService.siteId || "",
            siteName: newService.siteName,
            projectorSerial: service.projectorSerial,
            visitType: "Scheduled Maintenance",
            scheduledDate: service.date,
            priority: "Medium",
            description: service.notes || `Service: ${service.type} - ${service.amcPeriod}`,
            status: "Scheduled"
          };

          console.log('Creating service visit:', serviceVisitData);
          return apiClient.createServiceVisit(serviceVisitData);
        });

        await Promise.all(visitPromises);
      } catch (visitError) {
        console.error('Error creating service visits:', visitError);
        // Don't fail the entire operation if service visits fail
        // Services were created successfully, just log the visit creation error
      }
      
      setShowAddModal(false);
      setSelectedSite(null);
      setSelectedFSE(null);
      setSiteProjectors([]);
      setSelectedProjectors([]);
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

      await loadServices();

      (window as any).showToast?.({
        type: 'success',
        title: 'Services & Visits Created',
        message: `${newService.selectedProjectors.length} services and corresponding visits have been scheduled for ${newService.siteName}`
      });
    } catch (err: any) {
      console.error('Error creating services:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        data: newService
      });
      
      // Handle specific MongoDB duplicate key errors
      if (err.message && err.message.includes('E11000 duplicate key error')) {
        setError('Some services could not be created due to duplicate IDs. Please try again.');
      } else if (err.message && err.message.includes('Failed to create service')) {
        setError('Failed to create services. Please check that all required fields are filled correctly.');
      } else {
        setError(`Failed to create services: ${err.message}. Please check that all required fields are filled correctly.`);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleExportSchedule = async () => {
    try {
      const csvData = services.map(service => ({
        'Service ID': service.serviceId,
        'Site': service.siteName || 'N/A',
        'Projector Serial': service.projectorSerial,
        'Service Type': service.type,
        'Date': formatDate(service.date),
        'Technician': service.technician,
        'Status': service.status,
        'AMC Period': service.amcPeriod,
        'Next Service': service.nextServiceDate ? formatDate(service.nextServiceDate) : 'N/A'
      }));

      const csv = convertToCSV(csvData);
      downloadCSV(csvData, 'service_schedule');
    } catch (err) {
      console.error('Error exporting schedule:', err);
      setError('Failed to export schedule.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-600";
      case "In Progress":
        return "bg-yellow-600";
      case "Completed":
        return "bg-green-600";
      case "Cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "AMC Service 1":
        return "bg-green-600";
      case "AMC Service 2":
        return "bg-blue-600";
      case "Special Service":
        return "bg-purple-600";
      case "Emergency Repair":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getWarrantyColor = (status: string) => {
    switch (status) {
      case "Under Warranty":
        return "bg-green-600";
      case "AMC Active":
        return "bg-blue-600";
      case "Expired":
        return "bg-red-600";
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

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.serviceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.projectorSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.technician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.siteName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "All" || service.type === filterType;
    const matchesStatus = filterStatus === "All" || service.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Service Planning</h1>
            <p className="text-sm text-dark-secondary mt-1">Schedule and manage AMC services by site</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleExportSchedule}
              className="dark-button-secondary gap-2 flex items-center"
            >
              <Download className="w-4 h-4" />
              Export Schedule
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Schedule Service
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total Services</CardTitle>
              <Wrench className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{services.length}</div>
              <p className="text-xs text-dark-secondary">
                {services.filter(s => s.status === 'Scheduled').length} scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Active Sites</CardTitle>
              <Building className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{sites.length}</div>
              <p className="text-xs text-dark-secondary">
                {sites.filter(s => s.status === 'Active').length} with active contracts
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Total Projectors</CardTitle>
              <Monitor className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{projectors.length}</div>
              <p className="text-xs text-dark-secondary">
                {projectors.filter(p => p.status === 'Active').length} active
              </p>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-secondary">Available FSEs</CardTitle>
              <Users className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-primary">{fses.length}</div>
              <p className="text-xs text-dark-secondary">
                {fses.filter(f => f.status === 'Active').length} active
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
                placeholder="Search services by ID, projector, technician, or site..."
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
              <option value="AMC Service 1">AMC Service 1</option>
              <option value="AMC Service 2">AMC Service 2</option>
              <option value="Special Service">Special Service</option>
              <option value="Emergency Repair">Emergency Repair</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
            >
              <option value="All">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service._id} className="dark-card hover:dark-shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-dark-tag rounded-lg flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-dark-primary">{service.serviceId}</CardTitle>
                      <CardDescription className="text-dark-secondary">{service.siteName || 'Site N/A'}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                    <Badge className={getTypeColor(service.type)}>
                      {service.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{service.projectorSerial}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{service.technician}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{formatDate(service.date)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-dark-secondary" />
                    <span className="text-sm text-dark-primary">{service.siteName || 'Site N/A'}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-dark-secondary" />
                    <Badge className={getWarrantyColor(service.warrantyStatus)}>
                      {service.warrantyStatus}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-dark-color">
                  <Button
                    onClick={() => setSelectedService(service)}
                    className="flex-1 dark-button-secondary"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedService(service);
                      // Handle edit logic
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

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-dark-secondary" />
            <p className="text-dark-secondary">No services found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Schedule AMC Service</h2>
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

            <div className="space-y-6">
              {/* Step 1: Site Selection */}
              <div>
                <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-400" />
                  Step 1: Select Site
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Site *</label>
                    <select
                      value={selectedSite?._id || ""}
                      onChange={(e) => {
                        const site = sites.find(s => s._id === e.target.value);
                        setSelectedSite(site || null);
                      }}
                      className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                    >
                      <option value="">Select Site</option>
                      {sites.filter(site => site.status === 'Active').map(site => (
                        <option key={site._id} value={site._id}>
                          {site.name} - {site.address.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedSite && (
                    <div className="bg-dark-card rounded-lg p-4">
                      <h4 className="text-sm font-medium text-dark-primary mb-2">Site Details</h4>
                      <div className="space-y-1 text-xs text-dark-secondary">
                        <p><strong>Address:</strong> {selectedSite.address.street}, {selectedSite.address.city}</p>
                        <p><strong>Contact:</strong> {selectedSite.contactPerson.name} ({selectedSite.contactPerson.phone})</p>
                        <p><strong>Type:</strong> {selectedSite.siteType}</p>
                        <p><strong>Projectors:</strong> {siteProjectors.length} installed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

                             {/* Step 2: Projector Selection */}
               {selectedSite && (
                 <div>
                                        <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                       <Monitor className="w-5 h-5 mr-2 text-green-400" />
                       Step 2: Select Projectors {selectedProjectors.length > 0 && `(${selectedProjectors.length} selected)`}
                     </h3>
                   <div className="space-y-4">
                     <div>
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-dark-secondary">Select Projectors *</label>
                         <div className="flex items-center space-x-2">
                           <button
                             type="button"
                             onClick={() => {
                               const allSerials = siteProjectors.map(p => p.serialNumber);
                               setSelectedProjectors(allSerials);
                               setNewService(prev => ({
                                 ...prev,
                                 selectedProjectors: allSerials
                               }));
                             }}
                             className="text-xs text-blue-400 hover:text-blue-300"
                           >
                             Select All
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               setSelectedProjectors([]);
                               setNewService(prev => ({
                                 ...prev,
                                 selectedProjectors: []
                               }));
                             }}
                             className="text-xs text-red-400 hover:text-red-300"
                           >
                             Clear All
                           </button>
                         </div>
                       </div>
                       
                       <div className="bg-dark-card rounded-lg p-4 max-h-60 overflow-y-auto">
                         <div className="grid grid-cols-1 gap-2">
                           {siteProjectors.map(projector => (
                             <label key={projector.serialNumber} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-color cursor-pointer">
                               <input
                                 type="checkbox"
                                 checked={selectedProjectors.includes(projector.serialNumber)}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     const newSelected = [...selectedProjectors, projector.serialNumber];
                                     setSelectedProjectors(newSelected);
                                     setNewService(prev => ({
                                       ...prev,
                                       selectedProjectors: newSelected
                                     }));
                                   } else {
                                     const newSelected = selectedProjectors.filter(p => p !== projector.serialNumber);
                                     setSelectedProjectors(newSelected);
                                     setNewService(prev => ({
                                       ...prev,
                                       selectedProjectors: newSelected
                                     }));
                                   }
                                 }}
                                 className="rounded border-dark-color text-blue-500 focus:ring-blue-500"
                               />
                               <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                   <span className="text-sm font-medium text-dark-primary">
                                     {projector.serialNumber} - {projector.model}
                                   </span>
                                   <Badge className={projector.status === 'Active' ? 'bg-green-600' : 'bg-yellow-600'}>
                                     {projector.status}
                                   </Badge>
                                 </div>
                                 <div className="text-xs text-dark-secondary mt-1">
                                   <span className="flex items-center space-x-1">
                                     <MapPin className="w-3 h-3" />
                                     <span>{projector.location}</span>
                                   </span>
                                 </div>
                               </div>
                             </label>
                           ))}
                         </div>
                       </div>
                     </div>
                     
                     {selectedProjectors.length > 0 && (
                       <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4">
                         <h4 className="text-sm font-medium text-blue-400 mb-2">Selected Projectors ({selectedProjectors.length})</h4>
                         <div className="space-y-1">
                           {selectedProjectors.map(serial => {
                             const projector = siteProjectors.find(p => p.serialNumber === serial);
                             return (
                               <div key={serial} className="flex items-center justify-between text-xs">
                                 <span className="text-blue-300">{serial} - {projector?.model}</span>
                                 <span className="text-blue-400">{projector?.location}</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

                             {/* Step 3: Service Details */}
               {selectedProjectors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                    <Wrench className="w-5 h-5 mr-2 text-purple-400" />
                    Step 3: Service Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Service Type *</label>
                      <select
                        value={newService.type}
                        onChange={(e) => setNewService({...newService, type: e.target.value})}
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
                      <label className="text-sm font-medium text-dark-secondary">AMC Period</label>
                      <select
                        value={newService.amcPeriod}
                        onChange={(e) => setNewService({...newService, amcPeriod: e.target.value})}
                        className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      >
                        <option value="AMC Period 1">AMC Period 1</option>
                        <option value="AMC Period 2">AMC Period 2</option>
                        <option value="Outside AMC">Outside AMC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Service Date *</label>
                      <Input
                        type="date"
                        value={newService.date}
                        onChange={(e) => setNewService({...newService, date: e.target.value})}
                        className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Next Service Date</label>
                      <Input
                        type="date"
                        value={newService.nextServiceDate}
                        onChange={(e) => setNewService({...newService, nextServiceDate: e.target.value})}
                        className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: FSE Assignment */}
              {newService.date && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-orange-400" />
                    Step 4: Assign FSE
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-secondary">Field Service Engineer *</label>
                      <select
                        value={selectedFSE?._id || ""}
                        onChange={(e) => {
                          const fse = fses.find(f => f._id === e.target.value);
                          setSelectedFSE(fse || null);
                        }}
                        className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      >
                        <option value="">Select FSE</option>
                        {fses.filter(fse => fse.status === 'Active' || fse.status === 'On Duty').map(fse => (
                          <option key={fse._id} value={fse._id}>
                            {fse.name} - {fse.designation}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedFSE && (
                      <div className="bg-dark-card rounded-lg p-4">
                        <h4 className="text-sm font-medium text-dark-primary mb-2">FSE Details</h4>
                        <div className="space-y-1 text-xs text-dark-secondary">
                          <p><strong>Name:</strong> {selectedFSE.name}</p>
                          <p><strong>Designation:</strong> {selectedFSE.designation}</p>
                          <p><strong>Experience:</strong> {selectedFSE.experience} years</p>
                          <p><strong>Status:</strong> {selectedFSE.status}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Notes */}
              {selectedFSE && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-yellow-400" />
                    Step 5: Service Notes
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-dark-secondary">Notes</label>
                    <textarea
                      value={newService.notes}
                      onChange={(e) => setNewService({...newService, notes: e.target.value})}
                      className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                      rows={3}
                      placeholder="Service notes, special instructions, and recommendations..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateService}
                disabled={isLoading || !newService.siteId || !selectedProjectors.length || !newService.date || !newService.fseId}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Service'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}