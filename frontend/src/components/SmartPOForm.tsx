import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { 
  Building, 
  Monitor, 
  AlertTriangle,
  Calculator,
  FileText,
  Loader2,
  X
} from "lucide-react";
import { apiClient } from "../utils/api/client";

interface Projector {
  _id: string;
  serialNumber: string;
  model: string;
  brand: string;
  location: string;
  site: string;
  status: string;
  warrantyEnd?: string;
  amcContractId?: string;
}

interface Site {
  _id: string;
  name: string;
  address: {
    city: string;
    state: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface SmartPOFormProps {
  onClose: () => void;
  onPOCreated: (po: any) => void;
  editMode?: boolean;
  existingPO?: any;
  onPOUpdated?: (po: any) => void;
}

export function SmartPOForm({ onClose, onPOCreated, editMode = false, existingPO, onPOUpdated }: SmartPOFormProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedProjectors, setSelectedProjectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PO Form Data
  const [poData, setPoData] = useState({
    customer: "",
    customerSite: "",
    siteId: "",
    projectors: [] as any[],
    totalAmount: 0,
    status: "Pending",
    priority: "Medium",
    dateRaised: new Date().toISOString().split('T')[0],
    expectedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    description: "AMC Warranty Contract",
    customerContact: {
      name: "",
      phone: "",
      email: ""
    }
  });

  // Load sites on component mount
  useEffect(() => {
    loadSites();
  }, []);

  // Initialize form data for edit mode
  useEffect(() => {
    if (editMode && existingPO) {
      console.log('Initializing edit mode with PO:', existingPO);
      
      // Find the site by name
      const site = sites.find(s => s.name === existingPO.customerSite || existingPO.site);
      if (site) {
        setSelectedSite(site);
        
        // Set PO data
        setPoData({
          customer: existingPO.customer || '',
          customerSite: existingPO.customerSite || existingPO.site || '',
          siteId: site._id,
          projectors: existingPO.projectors || existingPO.lineItems || [],
          totalAmount: existingPO.totalAmount || 0,
          status: existingPO.status || 'Pending',
          priority: existingPO.priority || 'Medium',
          dateRaised: existingPO.dateRaised ? new Date(existingPO.dateRaised).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          expectedDelivery: existingPO.expectedDelivery ? new Date(existingPO.expectedDelivery).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: existingPO.description || 'AMC Warranty Contract',
          customerContact: {
            name: existingPO.customerContact?.name || existingPO.contact?.name || '',
            phone: existingPO.customerContact?.phone || existingPO.contact?.phone || '',
            email: existingPO.customerContact?.email || existingPO.contact?.email || ''
          }
        });

        // Set selected projectors
        const projectorSerials = (existingPO.projectors || existingPO.lineItems || []).map((p: any) => 
          p.serialNumber || p.partNumber || p.model
        );
        setSelectedProjectors(projectorSerials);
      }
    }
  }, [editMode, existingPO, sites]);

  // Load projectors when site changes
  useEffect(() => {
    if (selectedSite) {
      loadProjectorsBySite(selectedSite.name);
      setPoData(prev => ({
        ...prev,
        customerSite: selectedSite.name,
        siteId: selectedSite._id,
        customer: selectedSite.contactPerson?.name || selectedSite.name
      }));
    }
  }, [selectedSite]);

  // Calculate total amount when projectors selection changes
  useEffect(() => {
    if (selectedProjectors.length > 0) {
      const total = selectedProjectors.length * 10000; // ₹10,000 per projector (AMC rate)
      setPoData(prev => ({
        ...prev,
        totalAmount: total,
        projectors: selectedProjectors.map(serial => {
          const projector = projectors.find(p => p.serialNumber === serial);
          return {
            serialNumber: serial,
            model: projector?.model || '',
            location: projector?.location || '',
            service: 'AMC Warranty'
          };
        })
      }));
    } else {
      setPoData(prev => ({
        ...prev,
        totalAmount: 0,
        projectors: []
      }));
    }
  }, [selectedProjectors, projectors]);

  const loadSites = async () => {
    try {
      setIsLoadingSites(true);
      console.log('Loading sites...');
      const sitesData = await apiClient.getAllSites();
      console.log('Sites loaded:', sitesData);
      setSites(sitesData);
    } catch (err: any) {
      console.error('Error loading sites:', err);
      setError('Failed to load sites: ' + err.message);
    } finally {
      setIsLoadingSites(false);
    }
  };

  const loadProjectorsBySite = async (siteName: string) => {
    try {
      setIsLoading(true);
      const projectorsData = await apiClient.getAllProjectors();
      const siteProjectors = projectorsData.filter((p: Projector) => p.site === siteName);
      setProjectors(siteProjectors);
    } catch (err: any) {
      setError('Failed to load projectors: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectorToggle = (serialNumber: string) => {
    setSelectedProjectors(prev => 
      prev.includes(serialNumber)
        ? prev.filter(s => s !== serialNumber)
        : [...prev, serialNumber]
    );
  };

  const handleSelectAllProjectors = () => {
    if (selectedProjectors.length === projectors.length) {
      setSelectedProjectors([]);
    } else {
      setSelectedProjectors(projectors.map(p => p.serialNumber));
    }
  };

  const handleCreatePO = async () => {
    try {
      if (selectedProjectors.length === 0) {
        setError('Please select at least one projector');
        return;
      }

      setIsLoading(true);
      setError(null);

      const poDataToSend = {
        ...poData,
        poNumber: editMode ? existingPO.poNumber || existingPO.id : `PO-${Date.now()}`,
        dateRaised: new Date(poData.dateRaised),
        expectedDelivery: new Date(poData.expectedDelivery),
        lineItems: poData.projectors.map(projector => ({
          description: `AMC Warranty Contract for ${projector.model}`,
          quantity: 1,
          unitPrice: 10000,
          total: 10000,
          partNumber: projector.serialNumber,
          serviceType: 'AMC Warranty'
        })),
        subtotal: poData.totalAmount,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        totalAmount: poData.totalAmount
      };

      console.log('Sending PO data:', poDataToSend);

      let resultPO;
      
      if (editMode && existingPO) {
        // Update existing PO
        resultPO = await apiClient.updatePurchaseOrder(existingPO._id || existingPO.id, poDataToSend);
        console.log('PO updated:', resultPO);
        
        if (onPOUpdated) {
          onPOUpdated(resultPO);
        }
      } else {
        // Create new PO
        resultPO = await apiClient.createPurchaseOrder(poDataToSend);
        console.log('PO created:', resultPO);
        
        // Auto-create AMC contract for selected projectors
        await createAMCContracts(resultPO);
        
        if (onPOCreated) {
          onPOCreated(resultPO);
        }
      }
      
      onClose();
    } catch (err: any) {
      console.error('PO operation error:', err);
      let errorMessage = editMode ? 'Failed to update PO' : 'Failed to create PO';
      
      if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      if (err.response) {
        try {
          const errorData = await err.response.json();
          if (errorData.error) {
            errorMessage += ': ' + errorData.error;
          }
          if (errorData.details) {
            errorMessage += ' - ' + errorData.details;
          }
        } catch (parseErr) {
          // Ignore JSON parse errors
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createAMCContracts = async (po: any) => {
    try {
      console.log('Creating AMC contracts for PO:', po);
      // Create AMC contracts for each selected projector
      for (const projectorSerial of selectedProjectors) {
        const projector = projectors.find(p => p.serialNumber === projectorSerial);
        if (projector) {
          const amcContract = {
            contractNumber: `AMC-${Date.now()}-${projectorSerial}`,
            customerName: po.customer,
            customerSite: po.customerSite,
            projector: projector._id, // ObjectId reference
            site: po.siteId, // ObjectId reference
            projectorSerial: projectorSerial,
            projectorModel: projector.model,
            projectorBrand: projector.brand,
            siteName: po.customerSite,
            contractStartDate: new Date(po.dateRaised),
            contractEndDate: new Date(new Date(po.dateRaised).getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
            contractDuration: 12,
            contractValue: 10000, // ₹10,000 per projector
            paymentStatus: 'Pending',
            contractManager: 'System',
            assignedFSE: {
              fseId: '',
              fseName: ''
            }
          };

          console.log('Creating AMC contract:', amcContract);
          const createdContract = await apiClient.createAMCContract(amcContract);
          console.log('AMC contract created:', createdContract);
        }
      }
    } catch (err: any) {
      console.error('Error creating AMC contracts:', err);
      // Don't throw here, just log the error
      // The PO was created successfully, so we don't want to fail the whole operation
    }
  };

  const getProjectorStatus = (projector: Projector) => {
    if (projector.amcContractId) {
      return { status: 'AMC Active', color: 'bg-green-100 text-green-800' };
    }
    if (projector.warrantyEnd && new Date(projector.warrantyEnd) > new Date()) {
      return { status: 'Under Warranty', color: 'bg-blue-100 text-blue-800' };
    }
    return { status: 'No Coverage', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              {editMode ? 'Edit Smart PO' : 'Smart PO Creation'}
            </CardTitle>
            <CardDescription>
              {editMode ? 'Update existing PO with new details' : 'Create PO with automatic projector selection and AMC contract generation'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Site Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Site</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {sites.length === 0 ? (
                <div className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  {isLoadingSites ? 'Loading sites...' : 'No sites available'}
                </div>
              ) : (
                <select
                  value={selectedSite?._id || ''}
                  onChange={(e) => {
                    const site = sites.find(s => s._id === e.target.value);
                    setSelectedSite(site || null);
                    setSelectedProjectors([]);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a site...</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.name} - {site.address.city}, {site.address.state}
                      {site.contactPerson?.name ? ` (${site.contactPerson.name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {sites.length === 0 && !isLoadingSites && (
              <p className="text-sm text-gray-500">
                No sites found. Please check if the server is running and sites are available.
              </p>
            )}
          </div>

          {/* Projectors Selection */}
          {selectedSite && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Projectors at {selectedSite.name}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllProjectors}
                  className="text-xs"
                >
                  {selectedProjectors.length === projectors.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading projectors...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {projectors.map((projector) => {
                    const status = getProjectorStatus(projector);
                    const isSelected = selectedProjectors.includes(projector.serialNumber);
                    
                    return (
                      <div
                        key={projector._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleProjectorToggle(projector.serialNumber)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleProjectorToggle(projector.serialNumber)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Monitor className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-sm truncate">
                                {projector.model}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>Serial: {projector.serialNumber}</p>
                              <p>Location: {projector.location}</p>
                              <p>Brand: {projector.brand}</p>
                            </div>
                            <Badge className={`mt-2 text-xs ${status.color}`}>
                              {status.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {projectors.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No projectors found at this site</p>
                </div>
              )}
            </div>
          )}

          {/* PO Summary */}
          {selectedProjectors.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">PO Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Selected Projectors:</span>
                  <p className="font-semibold text-blue-900">{selectedProjectors.length}</p>
                </div>
                <div>
                  <span className="text-blue-700">Per Projector Rate:</span>
                  <p className="font-semibold text-blue-900">₹10,000</p>
                </div>
                <div>
                  <span className="text-blue-700">Total Amount:</span>
                  <p className="font-semibold text-blue-900">₹{poData.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-blue-700">Contract Period:</span>
                  <p className="font-semibold text-blue-900">1 Year</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm font-medium">Contact Name</Label>
              <Input
                value={poData.customerContact.name}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  customerContact: { ...prev.customerContact, name: e.target.value }
                }))}
                placeholder="Contact person name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium"></Label>
              <Input
                value={poData.customerContact.phone}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  customerContact: { ...prev.customerContact, phone: e.target.value }
                }))}
                placeholder=" number"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input
                value={poData.customerContact.email}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  customerContact: { ...prev.customerContact, email: e.target.value }
                }))}
                placeholder="Email address"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Date Raised</Label>
              <Input
                type="date"
                value={poData.dateRaised}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  dateRaised: e.target.value
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Expected Delivery</Label>
              <Input
                type="date"
                value={poData.expectedDelivery}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  expectedDelivery: e.target.value
                }))}
                className="mt-1"
              />
            </div>
          </div>


          {/* Description, Status, and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Input
                value={poData.description}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="PO description or special requirements"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <select
                value={poData.status}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  status: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <select
                value={poData.priority}
                onChange={(e) => setPoData(prev => ({
                  ...prev,
                  priority: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePO} 
              disabled={isLoading || selectedProjectors.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editMode ? 'Updating PO...' : 'Creating PO...'}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {editMode ? 'Update PO' : 'Create PO & AMC Contracts'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
