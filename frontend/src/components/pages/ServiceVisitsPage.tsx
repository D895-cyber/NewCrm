import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  User, 
  Monitor, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { apiClient } from '../../utils/api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

export function ServiceVisitsPage() {
  const { serviceVisits, refreshServiceVisits } = useData();
  const [filteredVisits, setFilteredVisits] = useState<ServiceVisit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedVisit, setSelectedVisit] = useState<ServiceVisit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newVisit, setNewVisit] = useState({
    siteName: '',
    projectorSerial: '',
    fseName: '',
    visitType: 'Scheduled Maintenance',
    scheduledDate: '',
    priority: 'Medium',
    description: '',
    notes: ''
  });
  const [sites, setSites] = useState<any[]>([]);
  const [projectors, setProjectors] = useState<any[]>([]);
  const [fses, setFses] = useState<any[]>([]);
  const [filteredProjectors, setFilteredProjectors] = useState<any[]>([]);

  useEffect(() => {
    filterVisits();
  }, [serviceVisits, searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    console.log('Current state - sites:', sites.length, 'projectors:', projectors.length, 'fses:', fses.length);
  }, [sites, projectors, fses]);

  // Filter projectors based on selected site
  useEffect(() => {
    if (newVisit.siteName && projectors.length > 0) {
      const siteProjectors = projectors.filter(projector => 
        projector.siteName === newVisit.siteName || 
        projector.siteName === newVisit.siteName
      );
      setFilteredProjectors(siteProjectors);
      console.log(`Filtered projectors for site "${newVisit.siteName}":`, siteProjectors.length);
      
      // Clear selected projector if it's not available for the new site
      if (newVisit.projectorSerial && !siteProjectors.find(p => p.serialNumber === newVisit.projectorSerial)) {
        setNewVisit(prev => ({ ...prev, projectorSerial: '' }));
      }
    } else {
      setFilteredProjectors([]);
    }
  }, [newVisit.siteName, projectors]);

  const loadData = async () => {
    console.log('loadData function called');
    try {
      console.log('Starting to fetch data...');
      
      // Load sites, projectors, and FSEs for the form using apiClient
      const [sitesResponse, projectorsResponse, fsesResponse] = await Promise.all([
        apiClient.getAllSites(),
        apiClient.getAllProjectors(),
        apiClient.getAllFSEs()
      ]);
      
      console.log('Sites response:', sitesResponse);
      console.log('Projectors response:', projectorsResponse);
      console.log('FSEs response:', fsesResponse);
      
      console.log('Setting state with data...');
      setSites(sitesResponse || []);
      setProjectors(projectorsResponse || []);
      setFses(fsesResponse || []);
      console.log('State set successfully');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterVisits = () => {
    let filtered = [...serviceVisits];

    if (searchTerm) {
      filtered = filtered.filter(visit =>
        visit.visitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.projectorSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.fseName.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddVisit = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!newVisit.siteName || !newVisit.projectorSerial || !newVisit.fseName || !newVisit.scheduledDate) {
        alert('Please fill in all required fields');
        return;
      }

      // Generate unique visit ID
      const visitId = `VISIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Find the actual FSE ID based on the selected FSE name
      const selectedFSE = fses.find(fse => fse.name === newVisit.fseName);
      const fseId = selectedFSE ? selectedFSE.fseId : `FSE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
  
      const siteId = `SITE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      const visitData = {
        ...newVisit,
        visitId,
        siteId,
        fseId,
        status: 'Scheduled',
        amcServiceInterval: 'Outside AMC',
        createdAt: new Date().toISOString()
      };

      // Create the service visit
      const response = await fetch('/api/service-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });

      if (response.ok) {
        const createdVisit = await response.json();
        
        // Reset form and close modal
        setNewVisit({
          siteName: '',
          projectorSerial: '',
          fseName: '',
          visitType: 'Scheduled Maintenance',
          scheduledDate: '',
          priority: 'Medium',
          description: '',
          notes: ''
        });
        setShowAddModal(false);
        
        // Refresh the visits list
        if (refreshServiceVisits) {
          refreshServiceVisits();
        }
        
        // Show success message
        alert('Service visit created successfully!');
      } else {
        throw new Error('Failed to create service visit');
      }
    } catch (error) {
      console.error('Error creating service visit:', error);
      alert('Failed to create service visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVisit = (visit: ServiceVisit) => {
    setSelectedVisit(visit);
    setShowEditModal(true);
  };



  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const resetForm = () => {
    setNewVisit({
      siteName: '',
      projectorSerial: '',
      fseName: '',
      visitType: 'Scheduled Maintenance',
      scheduledDate: '',
      priority: 'Medium',
      description: '',
      notes: ''
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshServiceVisits();
    } catch (error) {
      console.error('Error refreshing service visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!visitId || visitId === '') {
      console.error('Cannot delete visit: no valid ID provided');
      return;
    }
    if (confirm('Are you sure you want to delete this service visit?')) {
      try {
        const response = await fetch(`/api/service-visits/${visitId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Refresh the visits list
          if (refreshServiceVisits) {
            refreshServiceVisits();
          }
          alert('Service visit deleted successfully!');
        } else {
          throw new Error('Failed to delete service visit');
        }
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Failed to delete service visit. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Visits</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all service visits</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Workflow:</strong> Admin schedules visit → FSE completes visit → Service report generated → Projector data updated
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Visit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceVisits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceVisits.filter(v => v.status === 'Scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceVisits.filter(v => v.status === 'In Progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceVisits.filter(v => v.status === 'Completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search visits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-foreground bg-input-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="text-foreground bg-input-background">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Results</label>
              <div className="text-sm text-gray-600 pt-2">
                {filteredVisits.length} of {serviceVisits.length} visits
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Visits</CardTitle>
          <CardDescription>
            Manage all scheduled and completed service visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit ID</TableHead>
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
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No service visits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => (
                    <TableRow key={visit._id || visit.visitId || Math.random()}>
                      <TableCell className="font-mono text-sm">{visit.visitId || visit._id || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{visit.siteName || visit.site || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">{visit.projectorSerial || visit.serialNumber || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{visit.fseName || visit.fse || visit.technician || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{visit.visitType || visit.type || 'Service Visit'}</TableCell>
                      <TableCell>{visit.scheduledDate ? formatDate(visit.scheduledDate) : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(visit.status || 'Scheduled')}>
                          {visit.status || 'Scheduled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(visit.priority || 'Medium')}>
                          {visit.priority || 'Medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVisit(visit)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditVisit(visit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVisit(visit._id || visit.visitId || '')}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add Visit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service Visit</DialogTitle>
            <DialogDescription>
              Schedule a new service visit for a projector. This will create a visit that FSE engineers can then complete and convert to service reports.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Site Name *</label>
                <Select value={newVisit.siteName || undefined} onValueChange={(value) => setNewVisit({...newVisit, siteName: value})}>
                  <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.length === 0 ? (
                      <SelectItem value="no-sites" disabled>
                        No sites available
                      </SelectItem>
                    ) : (
                      sites.map((site) => (
                        <SelectItem key={site._id} value={site.name}>
                          {site.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {sites.length === 0 && (
                  <p className="text-xs text-red-500">Loading sites... Please wait or check console for errors.</p>
                )}
                <p className="text-xs text-gray-500">Sites loaded: {sites.length}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Projector Serial *</label>
                <Select 
                  value={newVisit.projectorSerial || undefined} 
                  onValueChange={(value) => setNewVisit({...newVisit, projectorSerial: value})}
                  disabled={!newVisit.siteName}
                >
                  <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder={newVisit.siteName ? "Select a projector" : "Select a site first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!newVisit.siteName ? (
                      <SelectItem value="no-site-selected" disabled>
                        Please select a site first
                      </SelectItem>
                    ) : filteredProjectors.length === 0 ? (
                      <SelectItem value="no-projectors" disabled>
                        No projectors found for this site
                      </SelectItem>
                    ) : (
                      filteredProjectors.map((projector) => (
                        <SelectItem key={projector._id} value={projector.serialNumber}>
                          {projector.serialNumber} - {projector.model}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {newVisit.siteName && (
                  <p className="text-xs text-gray-500">
                    Projectors for {newVisit.siteName}: {filteredProjectors.length}
                  </p>
                )}
                {projectors.length === 0 && (
                  <p className="text-xs text-red-500">Loading projectors... Please wait or check console for errors.</p>
                )}
                <p className="text-xs text-gray-500">Projectors loaded: {projectors.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">FSE Engineer *</label>
                <Select value={newVisit.fseName || undefined} onValueChange={(value) => setNewVisit({...newVisit, fseName: value})}>
                  <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select an FSE" />
                  </SelectTrigger>
                  <SelectContent>
                    {fses.length === 0 ? (
                      <SelectItem value="no-fses" disabled>
                        No FSEs available
                      </SelectItem>
                    ) : (
                      fses.map((fse) => (
                        <SelectItem key={fse._id} value={fse.name}>
                          {fse.name} - {fse.designation}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fses.length === 0 && (
                  <p className="text-xs text-red-500">Loading FSEs... Please wait or check console for errors.</p>
                )}
                <p className="text-xs text-gray-500">FSEs loaded: {fses.length}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Visit Type</label>
                <Select value={newVisit.visitType || undefined} onValueChange={(value) => setNewVisit({...newVisit, visitType: value})}>
                  <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled Maintenance">Scheduled Maintenance</SelectItem>
                    <SelectItem value="Emergency Repair">Emergency Repair</SelectItem>
                    <SelectItem value="Installation">Installation</SelectItem>
                    <SelectItem value="Preventive Maintenance">Preventive Maintenance</SelectItem>
                    <SelectItem value="Corrective Maintenance">Corrective Maintenance</SelectItem>
                    <SelectItem value="Warranty Service">Warranty Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Date *</label>
                <Input
                  type="datetime-local"
                  value={newVisit.scheduledDate}
                  onChange={(e) => setNewVisit({...newVisit, scheduledDate: e.target.value})}
                  className="w-full text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={newVisit.priority || undefined} onValueChange={(value) => setNewVisit({...newVisit, priority: value})}>
                  <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of the service required"
                value={newVisit.description}
                onChange={(e) => setNewVisit({...newVisit, description: e.target.value})}
                className="w-full text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Input
                placeholder="Any additional information or special instructions"
                value={newVisit.notes}
                onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                className="w-full text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Visit Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Site:</span> {newVisit.siteName || 'Not selected'}
                </div>
                <div>
                  <span className="font-medium">Projector:</span> {newVisit.projectorSerial || 'Not selected'}
                </div>
                <div>
                  <span className="font-medium">FSE:</span> {newVisit.fseName || 'Not selected'}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {newVisit.visitType}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {newVisit.scheduledDate ? new Date(newVisit.scheduledDate).toLocaleString() : 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> {newVisit.priority}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddVisit}
                disabled={loading || !newVisit.siteName || !newVisit.projectorSerial || !newVisit.fseName || !newVisit.scheduledDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Visit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service Visit</DialogTitle>
            <DialogDescription>
              Modify the details of this service visit
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visit ID</label>
                  <Input value={selectedVisit.visitId || 'N/A'} disabled className="bg-gray-800 text-white border-gray-600" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={selectedVisit.status || 'Scheduled'} 
                    onValueChange={(value) => setSelectedVisit({...selectedVisit, status: value})}
                  >
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Site Name</label>
                  <Select 
                    value={selectedVisit.siteName || undefined} 
                    onValueChange={(value) => {
                      const updatedVisit = {...selectedVisit, siteName: value};
                      // Clear selected projector if it's not available for the new site
                      if (selectedVisit.projectorSerial) {
                        const siteProjectors = projectors.filter(projector => 
                          projector.siteName === value
                        );
                        if (!siteProjectors.find(p => p.serialNumber === selectedVisit.projectorSerial)) {
                          updatedVisit.projectorSerial = '';
                        }
                      }
                      setSelectedVisit(updatedVisit);
                    }}
                  >
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select a site" />
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Projector Serial</label>
                  <Select 
                    value={selectedVisit.projectorSerial || undefined} 
                    onValueChange={(value) => setSelectedVisit({...selectedVisit, projectorSerial: value})}
                    disabled={!selectedVisit.siteName}
                  >
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder={selectedVisit.siteName ? "Select a projector" : "Select a site first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!selectedVisit.siteName ? (
                        <SelectItem value="no-site-selected" disabled>
                          Please select a site first
                        </SelectItem>
                      ) : (() => {
                        const siteProjectors = projectors.filter(projector => 
                          projector.siteName === selectedVisit.siteName || 
                          projector.siteName === selectedVisit.siteName
                        );
                        return siteProjectors.length === 0 ? (
                          <SelectItem value="no-projectors" disabled>
                            No projectors found for this site
                          </SelectItem>
                        ) : (
                          siteProjectors.map((projector) => (
                            <SelectItem key={projector._id} value={projector.serialNumber}>
                              {projector.serialNumber} - {projector.model}
                            </SelectItem>
                          ))
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  {selectedVisit.siteName && (
                    <p className="text-xs text-gray-500">
                      Projectors for {selectedVisit.siteName}: {projectors.filter(p => 
                        p.siteName === selectedVisit.siteName || p.site === selectedVisit.siteName
                      ).length}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">FSE Engineer</label>
                  <Select 
                    value={selectedVisit.fseName || undefined} 
                    onValueChange={(value) => setSelectedVisit({...selectedVisit, fseName: value})}
                  >
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select an FSE" />
                    </SelectTrigger>
                    <SelectContent>
                      {fses.map((fse) => (
                        <SelectItem key={fse._id} value={fse.name}>
                          {fse.name} - {fse.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visit Type</label>
                  <Select 
                    value={selectedVisit.visitType || 'Scheduled Maintenance'} 
                    onValueChange={(value) => setSelectedVisit({...selectedVisit, visitType: value})}
                  >
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled Maintenance">Scheduled Maintenance</SelectItem>
                      <SelectItem value="Emergency Repair">Emergency Repair</SelectItem>
                      <SelectItem value="Installation">Installation</SelectItem>
                      <SelectItem value="Preventive Maintenance">Preventive Maintenance</SelectItem>
                      <SelectItem value="Corrective Maintenance">Corrective Maintenance</SelectItem>
                      <SelectItem value="Warranty Service">Warranty Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scheduled Date</label>
                  <Input
                    type="datetime-local"
                    value={selectedVisit.scheduledDate ? selectedVisit.scheduledDate.slice(0, 16) : ''}
                    onChange={(e) => setSelectedVisit({...selectedVisit, scheduledDate: e.target.value})}
                    className="w-full text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={selectedVisit.priority || 'Medium'} 
                    onValueChange={(value) => setSelectedVisit({...selectedVisit, priority: value})}
                  >
                    <SelectTrigger className="text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description of the service required"
                  value={selectedVisit.description || ''}
                  onChange={(e) => setSelectedVisit({...selectedVisit, description: e.target.value})}
                  className="w-full text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes</label>
                <Input
                  placeholder="Any additional information or special instructions"
                  value={selectedVisit.notes || ''}
                  onChange={(e) => setSelectedVisit({...selectedVisit, notes: e.target.value})}
                  className="w-full text-white bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const response = await fetch(`/api/service-visits/${selectedVisit._id || selectedVisit.visitId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selectedVisit),
                      });
                      
                      if (response.ok) {
                        setShowEditModal(false);
                        if (refreshServiceVisits) refreshServiceVisits();
                        alert('Service visit updated successfully!');
                      } else {
                        throw new Error('Failed to update service visit');
                      }
                    } catch (error) {
                      console.error('Error updating service visit:', error);
                      alert('Failed to update service visit. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Visit Modal */}
      <Dialog open={!!selectedVisit && !showEditModal} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Visit Details</DialogTitle>
            <DialogDescription>
              View detailed information about this service visit
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Visit ID:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.visitId}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.status}</p>
                </div>
                <div>
                  <span className="font-medium">Site:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.siteName}</p>
                </div>
                <div>
                  <span className="font-medium">Projector:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.projectorSerial}</p>
                </div>
                <div>
                  <span className="font-medium">FSE:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.fseName}</p>
                </div>
                <div>
                  <span className="font-medium">Visit Type:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.visitType}</p>
                </div>
                <div>
                  <span className="font-medium">Scheduled Date:</span>
                  <p className="text-sm text-gray-600">{formatDate(selectedVisit.scheduledDate) || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <p className="text-sm text-gray-600">{selectedVisit.priority}</p>
                </div>
              </div>
              {selectedVisit.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedVisit.description}</p>
                </div>
              )}
              {selectedVisit.notes && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedVisit.notes}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedVisit(null)}>
                  Close
                </Button>
                <Button onClick={() => handleEditVisit(selectedVisit)}>
                  Edit Visit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
