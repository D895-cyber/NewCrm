import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { 
  Plus, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  RefreshCw,
  CalendarDays,
  Clock3,
  RotateCcw,
  Settings
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';

interface AMCContract {
  _id: string;
  contractNumber: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  auditoriumId: string;
  auditoriumName: string;
  projectorId: string;
  projectorNumber: string;
  projectorSerial: string;
  projectorModel: string;
  projectorBrand: string;
  contractStartDate: string;
  contractEndDate: string;
  contractDuration: number;
  status: string;
  contractValue: number;
  paymentStatus: string;
  assignedFSE: {
    fseId: string;
    fseName: string;
  };
  serviceSchedule: Array<{
    serviceNumber: number;
    scheduledDate: string;
    actualDate?: string;
    status: string;
    serviceVisitId?: string;
    technician?: string;
    notes?: string;
  }>;
  contractStatus: string;
  nextServiceDue?: {
    service: string;
    date: string;
    daysUntil: number;
  };
  overdueServices: Array<{
    service: string;
    scheduledDate: string;
    daysOverdue: number;
  }>;
  completedServices: number;
  pendingServices: number;
}

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  suspendedContracts: number;
  expiringSoon: number;
  overdueServices: number;
  upcomingServices: number;
  revenue: {
    totalValue: number;
    averageValue: number;
    paidValue: number;
    pendingValue: number;
  };
}

interface ProjectorItem {
  _id: string;
  serialNumber: string;
  model?: string;
  brand?: string;
  siteId: string;
}

interface SiteItem {
  _id: string;
  name: string;
  code?: string;
}

interface FSEItem {
  _id: string;
  fseId?: string;
  fseName: string;
}

export function AMCContractsPage() {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<AMCContract[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState<AMCContract | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Masters for create form
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [projectors, setProjectors] = useState<ProjectorItem[]>([]);
  const [fses, setFSEs] = useState<FSEItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newContract, setNewContract] = useState({
    siteId: '',
    auditoriumId: '',
    projectorId: '',
    contractManager: '',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: 12,
    contractValue: 0,
    paymentStatus: 'Pending',
    fseId: ''
  });
  
  // Bulk operations state
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [showBulkDateDialog, setShowBulkDateDialog] = useState(false);
  const [showBulkServiceDialog, setShowBulkServiceDialog] = useState(false);
  const [showBulkRenewalDialog, setShowBulkRenewalDialog] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkRenewalPeriod, setBulkRenewalPeriod] = useState(12);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filtered projectors for selected site
  const filteredProjectorsForSite = newContract.siteId
    ? projectors.filter((p) => p.siteId === newContract.siteId)
    : [];

  useEffect(() => {
    loadContracts();
    loadStats();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter]);

  // Load masters when opening create dialog
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [sitesRes, projRes, fseRes] = await Promise.all([
          apiClient.get('/sites'),
          apiClient.get('/projectors'),
          apiClient.get('/fse')
        ]);
        setSites(sitesRes);
        setProjectors(projRes);
        setFSEs(fseRes);
      } catch (e) {
        console.error('Failed loading masters', e);
      }
    };
    if (showCreateDialog) fetchMasters();
  }, [showCreateDialog]);

  // Auto-calc end date when start/duration change
  useEffect(() => {
    if (!newContract.contractStartDate || !newContract.contractDuration) return;
    const start = new Date(newContract.contractStartDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(newContract.contractDuration));
    const yyyy = end.getFullYear();
    const mm = String(end.getMonth() + 1).padStart(2, '0');
    const dd = String(end.getDate()).padStart(2, '0');
    setNewContract((prev) => ({ ...prev, contractEndDate: `${yyyy}-${mm}-${dd}` }));
  }, [newContract.contractStartDate, newContract.contractDuration]);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/amc-contracts');
      setContracts(response);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/amc-contracts/stats/dashboard');
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterContracts = () => {
    let filtered = contracts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.auditoriumName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.projectorSerial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Expired': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'Suspended': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Terminated': { color: 'bg-gray-100 text-gray-800', icon: FileText }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Active'];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getServiceStatusBadge = (status: string) => {
    const statusConfig = {
      'Scheduled': { color: 'bg-blue-100 text-blue-800' },
      'In Progress': { color: 'bg-yellow-100 text-yellow-800' },
      'Completed': { color: 'bg-green-100 text-green-800' },
      'Overdue': { color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Scheduled'];

    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Bulk operations functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(new Set(filteredContracts.map(c => c._id)));
    } else {
      setSelectedContracts(new Set());
    }
  };

  const handleSelectContract = (contractId: string, checked: boolean) => {
    const newSelected = new Set(selectedContracts);
    if (checked) {
      newSelected.add(contractId);
    } else {
      newSelected.delete(contractId);
    }
    setSelectedContracts(newSelected);
  };

  const handleBulkDateUpdate = async () => {
    if (selectedContracts.size === 0) return;
    
    try {
      setIsBulkProcessing(true);
      const contractIds = Array.from(selectedContracts);
      
      // Update each contract with new dates
      for (const contractId of contractIds) {
        await apiClient.put(`/amc-contracts/${contractId}`, {
          contractStartDate: bulkStartDate,
          contractEndDate: bulkEndDate
        });
      }
      
      // Reload contracts and reset
      await loadContracts();
      setSelectedContracts(new Set());
      setShowBulkDateDialog(false);
      setBulkStartDate('');
      setBulkEndDate('');
      
      alert(`Successfully updated ${contractIds.length} contracts`);
    } catch (error) {
      console.error('Error updating bulk dates:', error);
      alert('Error updating contracts. Please try again.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkServiceSchedule = async () => {
    if (selectedContracts.size === 0) return;
    
    try {
      setIsBulkProcessing(true);
      const contractIds = Array.from(selectedContracts);
      
      // Update each contract's service schedule
      for (const contractId of contractIds) {
        const contract = contracts.find(c => c._id === contractId);
        if (contract) {
          const startDate = new Date(contract.contractStartDate);
          const firstServiceDate = new Date(startDate);
          firstServiceDate.setMonth(startDate.getMonth() + 6);
          
          const secondServiceDate = new Date(startDate);
          secondServiceDate.setMonth(startDate.getMonth() + 12);
          
          await apiClient.put(`/amc-contracts/${contractId}`, {
            'serviceSchedule.firstService.scheduledDate': firstServiceDate.toISOString(),
            'serviceSchedule.secondService.scheduledDate': secondServiceDate.toISOString()
          });
        }
      }
      
      // Reload contracts and reset
      await loadContracts();
      setSelectedContracts(new Set());
      setShowBulkServiceDialog(false);
      
      alert(`Successfully scheduled services for ${contractIds.length} contracts`);
    } catch (error) {
      console.error('Error scheduling bulk services:', error);
      alert('Error scheduling services. Please try again.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkRenewal = async () => {
    if (selectedContracts.size === 0) return;
    
    try {
      setIsBulkProcessing(true);
      const contractIds = Array.from(selectedContracts);
      
      // Renew each contract
      for (const contractId of contractIds) {
        await apiClient.post(`/amc-contracts/${contractId}/renew`, {
          renewalPeriod: bulkRenewalPeriod
        });
      }
      
      // Reload contracts and reset
      await loadContracts();
      setSelectedContracts(new Set());
      setShowBulkRenewalDialog(false);
      setBulkRenewalPeriod(12);
      
      alert(`Successfully renewed ${contractIds.length} contracts`);
    } catch (error) {
      console.error('Error renewing bulk contracts:', error);
      alert('Error renewing contracts. Please try again.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newContract.customerName || !newContract.siteId || !newContract.projectorId || !newContract.contractManager || !newContract.contractStartDate || !newContract.contractEndDate) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        customerName: newContract.customerName,
        customerSite: sites.find(s => s._id === newContract.siteId)?.name || '',
        projector: newContract.projectorId,
        site: newContract.siteId,
        contractManager: newContract.contractManager,
        contractStartDate: newContract.contractStartDate,
        contractEndDate: newContract.contractEndDate,
        contractDuration: Number(newContract.contractDuration),
        contractValue: Number(newContract.contractValue),
        paymentStatus: newContract.paymentStatus,
        assignedFSE: newContract.fseId ? { fseId: newContract.fseId, fseName: fses.find(f => f._id === newContract.fseId)?.fseName || '' } : undefined
      };
      await apiClient.post('/amc-contracts', payload);
      setShowCreateDialog(false);
      setNewContract({
        customerName: '',
        siteId: '',
        projectorId: '',
        contractManager: '',
        contractStartDate: '',
        contractEndDate: '',
        contractDuration: 12,
        contractValue: 0,
        paymentStatus: 'Pending',
        fseId: ''
      });
      await loadContracts();
    } catch (e) {
      console.error('Create AMC failed', e);
      alert('Failed to create AMC contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AMC Contracts</h1>
          <p className="text-gray-600">Manage Annual Maintenance Contracts and 6-month service schedules</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeContracts} active, {stats.expiredContracts} expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expiringSoon} expiring soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Status</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingServices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdueServices} overdue services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.revenue.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.revenue.pendingValue)} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contracts, customers, or projectors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      {selectedContracts.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Bulk Operations ({selectedContracts.size} contracts selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDateDialog(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Update Dates
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkServiceDialog(true)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Clock3 className="w-4 h-4 mr-2" />
                Schedule Services
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkRenewalDialog(true)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Renew Contracts
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContracts(new Set())}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Contracts ({filteredContracts.length})</CardTitle>
            {selectedContracts.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>{selectedContracts.size} selected</span>
                <div className="h-4 w-px bg-blue-300"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContracts(new Set())}
                  className="text-blue-700 hover:text-blue-800 p-1 h-6"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContracts.size === filteredContracts.length && filteredContracts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Projector</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>First Service</TableHead>
                <TableHead>Second Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContracts.has(contract._id)}
                      onCheckedChange={(checked) => handleSelectContract(contract._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.contractNumber}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(contract.contractStartDate)} - {formatDate(contract.contractEndDate)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.customerName}</div>
                      <div className="text-sm text-gray-500">{contract.customerSite}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.projectorSerial}</div>
                      <div className="text-sm text-gray-500">
                        {contract.projectorBrand} {contract.projectorModel}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {contract.contractDuration} months
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {formatDate(contract.serviceSchedule.firstService.scheduledDate)}
                      </div>
                      {getServiceStatusBadge(contract.serviceSchedule.firstService.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {formatDate(contract.serviceSchedule.secondService.scheduledDate)}
                      </div>
                      {getServiceStatusBadge(contract.serviceSchedule.secondService.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(contract.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(contract.contractValue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contract.paymentStatus}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedContract(contract)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Contract Details - {selectedContract?.contractNumber}</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedContract.customerName}</div>
                      <div><span className="font-medium">Site:</span> {selectedContract.customerSite}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Projector Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Serial:</span> {selectedContract.projectorSerial}</div>
                      <div><span className="font-medium">Model:</span> {selectedContract.projectorBrand} {selectedContract.projectorModel}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">First Service (6 months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div><span className="font-medium">Scheduled:</span> {formatDate(selectedContract.serviceSchedule.firstService.scheduledDate)}</div>
                        <div><span className="font-medium">Status:</span> {getServiceStatusBadge(selectedContract.serviceSchedule.firstService.status)}</div>
                        {selectedContract.serviceSchedule.firstService.actualDate && (
                          <div><span className="font-medium">Completed:</span> {formatDate(selectedContract.serviceSchedule.firstService.actualDate)}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Second Service (12 months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div><span className="font-medium">Scheduled:</span> {formatDate(selectedContract.serviceSchedule.secondService.scheduledDate)}</div>
                        <div><span className="font-medium">Status:</span> {getServiceStatusBadge(selectedContract.serviceSchedule.secondService.status)}</div>
                        {selectedContract.serviceSchedule.secondService.actualDate && (
                          <div><span className="font-medium">Completed:</span> {formatDate(selectedContract.serviceSchedule.secondService.actualDate)}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedContract.nextServiceDue && (
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">Next Service Due</div>
                          <div className="text-sm text-blue-700">
                            {selectedContract.nextServiceDue.service} - {formatDate(selectedContract.nextServiceDue.date)}
                            {selectedContract.nextServiceDue.daysUntil > 0 && (
                              <span> (in {selectedContract.nextServiceDue.daysUntil} days)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedContract.overdueServices.length > 0 && (
                  <Card className="bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-medium text-red-900">Overdue Services</div>
                          {selectedContract.overdueServices.map((service, index) => (
                            <div key={index} className="text-sm text-red-700">
                              {service.service} - {formatDate(service.scheduledDate)} ({service.daysOverdue} days overdue)
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contract Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedContract.contractValue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Duration: {selectedContract.contractDuration} months
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={
                        selectedContract.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        selectedContract.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        selectedContract.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {selectedContract.paymentStatus}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="text-sm text-gray-600">
                  Contract history will be displayed here when implemented.
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Contract Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New AMC Contract</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Customer Name</Label>
              <Input
                value={newContract.customerName}
                onChange={(e) => setNewContract({ ...newContract, customerName: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Contract Manager</Label>
              <Input
                value={newContract.contractManager}
                onChange={(e) => setNewContract({ ...newContract, contractManager: e.target.value })}
                placeholder="Manager name"
              />
            </div>
            <div>
              <Label>Site</Label>
              <Select value={newContract.siteId} onValueChange={(v) => setNewContract({ ...newContract, siteId: v, projectorId: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Projector</Label>
              <Select value={newContract.projectorId} onValueChange={(v) => setNewContract({ ...newContract, projectorId: v })}>
                <SelectTrigger disabled={!newContract.siteId}>
                  <SelectValue placeholder={newContract.siteId ? 'Select projector' : 'Select site first'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjectorsForSite.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.serialNumber} {p.brand ? `- ${p.brand}` : ''} {p.model ? p.model : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!newContract.siteId && (
                <div className="text-xs text-gray-500 mt-1">Select a site to see its projectors.</div>
              )}
            </div>
            <div>
              <Label>Assigned FSE (optional)</Label>
              <Select value={newContract.fseId} onValueChange={(v) => setNewContract({ ...newContract, fseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select FSE" />
                </SelectTrigger>
                <SelectContent>
                  {fses.map((f) => (
                    <SelectItem key={f._id} value={f._id}>{f.fseName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contract Value</Label>
              <Input
                type="number"
                min={0}
                value={newContract.contractValue}
                onChange={(e) => setNewContract({ ...newContract, contractValue: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={newContract.paymentStatus} onValueChange={(v) => setNewContract({ ...newContract, paymentStatus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newContract.contractStartDate}
                onChange={(e) => setNewContract({ ...newContract, contractStartDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (months)</Label>
              <Select value={String(newContract.contractDuration)} onValueChange={(v) => setNewContract({ ...newContract, contractDuration: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={newContract.contractEndDate}
                onChange={(e) => setNewContract({ ...newContract, contractEndDate: e.target.value })}
              />
              <div className="text-xs text-gray-500 mt-1">Auto-calculated from start date and duration. You can override if needed.</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Date Update Dialog */}
      <Dialog open={showBulkDateDialog} onOpenChange={setShowBulkDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Update Contract Dates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkStartDate">Contract Start Date</Label>
              <Input
                id="bulkStartDate"
                type="date"
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="bulkEndDate">Contract End Date</Label>
              <Input
                id="bulkEndDate"
                type="date"
                value={bulkEndDate}
                onChange={(e) => setBulkEndDate(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-gray-600">
              This will update {selectedContracts.size} selected contracts with the new start and end dates.
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkDateDialog(false)}
                disabled={isBulkProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDateUpdate}
                disabled={!bulkStartDate || !bulkEndDate || isBulkProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isBulkProcessing ? 'Updating...' : 'Update Dates'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Service Schedule Dialog */}
      <Dialog open={showBulkServiceDialog} onOpenChange={setShowBulkServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Schedule Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              This will automatically schedule the first service at 6 months and second service at 12 months from each contract's start date for {selectedContracts.size} selected contracts.
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-blue-800">
                <div>• First Service: 6 months from contract start</div>
                <div>• Second Service: 12 months from contract start</div>
                <div>• Service dates will be automatically calculated</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkServiceDialog(false)}
                disabled={isBulkProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkServiceSchedule}
                disabled={isBulkProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isBulkProcessing ? 'Scheduling...' : 'Schedule Services'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Renewal Dialog */}
      <Dialog open={showBulkRenewalDialog} onOpenChange={setShowBulkRenewalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Renew Contracts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkRenewalPeriod">Renewal Period (months)</Label>
              <Select value={bulkRenewalPeriod.toString()} onValueChange={(value) => setBulkRenewalPeriod(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              This will renew {selectedContracts.size} selected contracts for the specified period. New contracts will be created with updated dates and service schedules.
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkRenewalDialog(false)}
                disabled={isBulkProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkRenewal}
                disabled={isBulkProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isBulkProcessing ? 'Renewing...' : 'Renew Contracts'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
