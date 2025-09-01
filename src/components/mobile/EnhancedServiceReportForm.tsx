import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { Camera, Upload, Save, Send, Wrench, Package, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EnvironmentalField, TechnicalField, ValidationSummary } from '../../ui/ValidationField';
import { validateEnvironmentalConditions, validateTechnicalParameters, ValidationError } from '../../utils/validation/reportValidation';

interface ServiceTicket {
  _id: string;
  ticketNumber: string;
  clientName: string;
  siteName: string;
  projectorSerial: string;
  projectorModel: string;
  projectorBrand: string;
  serviceType: string;
  serviceSchedule: string;
  scheduledDate: string;
  assignedFSE: {
    fseId: string;
    fseName: string;
  };
}

interface SparePart {
  _id: string;
  partNumber: string;
  partName: string;
  stockQuantity: number;
  unitPrice: number;
  isRMA: boolean;
}

interface ServiceReportFormData {
  ticketId: string;
  reportTitle: string;
  serviceWorkPerformed: string;
  sparePartsUsed: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    isRMA: boolean;
    rmaNumber?: string;
  }>;
  sparePartsRequired: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  }>;
  observations: string;
  recommendations: string;
  customerSignature: string;
  photos: Array<{
    filename: string;
    description: string;
    beforeAfter: 'BEFORE' | 'AFTER';
  }>;
}

const EnhancedServiceReportForm: React.FC = () => {
  const { user } = useAuth();
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [formData, setFormData] = useState<ServiceReportFormData>({
    ticketId: '',
    reportTitle: '',
    serviceWorkPerformed: '',
    sparePartsUsed: [],
    sparePartsRequired: [],
    observations: '',
    recommendations: '',
    customerSignature: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    fetchServiceTickets();
    fetchSpareParts();
  }, []);

  const fetchServiceTickets = async () => {
    try {
      const response = await fetch('/api/service-tickets?status=Scheduled,Assigned,In Progress');
      const data = await response.json();
      setServiceTickets(data.serviceTickets || []);
    } catch (error) {
      console.error('Error fetching service tickets:', error);
    }
  };

  const fetchSpareParts = async () => {
    try {
      const response = await fetch('/api/spare-parts');
      const data = await response.json();
      setSpareParts(data.spareParts || []);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    }
  };

  const handleTicketSelect = (ticketId: string) => {
    const ticket = serviceTickets.find(t => t._id === ticketId);
    setSelectedTicket(ticket || null);
    setFormData(prev => ({
      ...prev,
      ticketId,
      reportTitle: `Service Report - ${ticket?.ticketNumber || ''}`
    }));
  };

  const addSparePartUsed = () => {
    setFormData(prev => ({
      ...prev,
      sparePartsUsed: [
        ...prev.sparePartsUsed,
        {
          partNumber: '',
          partName: '',
          quantity: 1,
          isRMA: false
        }
      ]
    }));
  };

  const removeSparePartUsed = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sparePartsUsed: prev.sparePartsUsed.filter((_, i) => i !== index)
    }));
  };

  const updateSparePartUsed = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sparePartsUsed: prev.sparePartsUsed.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const addSparePartRequired = () => {
    setFormData(prev => ({
      ...prev,
      sparePartsRequired: [
        ...prev.sparePartsRequired,
        {
          partNumber: '',
          partName: '',
          quantity: 1,
          urgency: 'Medium' as const
        }
      ]
    }));
  };

  const removeSparePartRequired = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sparePartsRequired: prev.sparePartsRequired.filter((_, i) => i !== index)
    }));
  };

  const updateSparePartRequired = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sparePartsRequired: prev.sparePartsRequired.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handlePartNumberChange = (index: number, partNumber: string, isUsed: boolean) => {
    const part = spareParts.find(p => p.partNumber === partNumber);
    if (part) {
      if (isUsed) {
        updateSparePartUsed(index, 'partName', part.partName);
        updateSparePartUsed(index, 'isRMA', part.isRMA);
      } else {
        updateSparePartRequired(index, 'partName', part.partName);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedTicket) {
      alert('Please select a service ticket');
      return;
    }

    try {
      setLoading(true);
      
      // Create service report
      const reportResponse = await fetch('/api/service-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ticketId: selectedTicket._id,
          reportNumber: `SR-${Date.now()}`,
          siteName: selectedTicket.siteName,
          projectorSerial: selectedTicket.projectorSerial,
          projectorModel: selectedTicket.projectorModel,
          brand: selectedTicket.projectorBrand,
          engineer: {
            name: user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : user?.username || '',
                          phone: user?.profile?.phone || '',
            email: user?.email || ''
          }
        })
      });

      if (reportResponse.ok) {
        const report = await reportResponse.json();
        
        // Update service ticket status
        await fetch(`/api/service-tickets/${selectedTicket._id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completionNotes: formData.observations,
            sparePartsUsed: formData.sparePartsUsed,
            sparePartsRequired: formData.sparePartsRequired
          })
        });

        alert('Service report submitted successfully!');
        // Reset form
        setFormData({
          ticketId: '',
          reportTitle: '',
          serviceWorkPerformed: '',
          sparePartsUsed: [],
          sparePartsRequired: [],
          observations: '',
          recommendations: '',
          customerSignature: '',
          photos: []
        });
        setSelectedTicket(null);
      } else {
        throw new Error('Failed to submit service report');
      }
    } catch (error) {
      console.error('Error submitting service report:', error);
      alert('Error submitting service report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Service Report Form</h1>
        <p className="text-gray-600">Submit your service report for completed work</p>
      </div>

      {/* Service Ticket Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Select Service Ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleTicketSelect} value={formData.ticketId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a service ticket" />
            </SelectTrigger>
            <SelectContent>
              {serviceTickets.map((ticket) => (
                <SelectItem key={ticket._id} value={ticket._id}>
                  {ticket.ticketNumber} - {ticket.clientName} ({ticket.siteName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTicket && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Selected Ticket Details</h4>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <div><strong>Client:</strong> {selectedTicket.clientName}</div>
                <div><strong>Site:</strong> {selectedTicket.siteName}</div>
                <div><strong>Projector:</strong> {selectedTicket.projectorModel} ({selectedTicket.projectorSerial})</div>
                <div><strong>Service Type:</strong> {selectedTicket.serviceType}</div>
                <div><strong>Scheduled Date:</strong> {new Date(selectedTicket.scheduledDate).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle>Service Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="parts">Parts</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportTitle">Report Title</Label>
                  <Input
                    id="reportTitle"
                    value={formData.reportTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportTitle: e.target.value }))}
                    placeholder="Enter report title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceWork">Service Work Performed</Label>
                  <Textarea
                    id="serviceWork"
                    value={formData.serviceWorkPerformed}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceWorkPerformed: e.target.value }))}
                    placeholder="Describe the service work performed"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observations</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Any observations during service"
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Parts Used Tab */}
              <TabsContent value="parts" className="space-y-4">
                {/* Spare Parts Used */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Spare Parts Used</Label>
                    <Button onClick={addSparePartUsed} size="sm" variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Add Part
                    </Button>
                  </div>
                  
                  {formData.sparePartsUsed.map((part, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={part.partNumber}
                          onValueChange={(value) => {
                            updateSparePartUsed(index, 'partNumber', value);
                            handlePartNumberChange(index, value, true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select part number" />
                          </SelectTrigger>
                          <SelectContent>
                            {spareParts.map((sp) => (
                              <SelectItem key={sp._id} value={sp.partNumber}>
                                {sp.partNumber} - {sp.partName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => removeSparePartUsed(index)}
                          size="sm"
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={part.quantity}
                            onChange={(e) => updateSparePartUsed(index, 'quantity', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`rma-${index}`}
                            checked={part.isRMA}
                            onCheckedChange={(checked) => updateSparePartUsed(index, 'isRMA', checked)}
                          />
                          <Label htmlFor={`rma-${index}`}>RMA Part</Label>
                        </div>
                      </div>
                      
                      {part.isRMA && (
                        <div>
                          <Label>RMA Number</Label>
                          <Input
                            value={part.rmaNumber || ''}
                            onChange={(e) => updateSparePartUsed(index, 'rmaNumber', e.target.value)}
                            placeholder="Enter RMA number"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Spare Parts Required */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Spare Parts Required</Label>
                    <Button onClick={addSparePartRequired} size="sm" variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Add Part
                    </Button>
                  </div>
                  
                  {formData.sparePartsRequired.map((part, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={part.partNumber}
                          onValueChange={(value) => {
                            updateSparePartRequired(index, 'partNumber', value);
                            handlePartNumberChange(index, value, false);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select part number" />
                          </SelectTrigger>
                          <SelectContent>
                            {spareParts.map((sp) => (
                              <SelectItem key={sp._id} value={sp.partNumber}>
                                {sp.partNumber} - {sp.partName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => removeSparePartRequired(index)}
                          size="sm"
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={part.quantity}
                            onChange={(e) => updateSparePartRequired(index, 'quantity', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Urgency</Label>
                          <Select
                            value={part.urgency}
                            onValueChange={(value) => updateSparePartRequired(index, 'urgency', value)}
                          >
                            <SelectTrigger>
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
                  ))}
                </div>
              </TabsContent>

              {/* Additional Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                    placeholder="Any recommendations for future service"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerSignature">Customer Signature</Label>
                  <Input
                    id="customerSignature"
                    value={formData.customerSignature}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerSignature: e.target.value }))}
                    placeholder="Customer name for signature"
                  />
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Photo upload functionality will be implemented here. For now, you can add photo descriptions.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Photo Descriptions</Label>
                  <div className="space-y-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={photo.description}
                          onChange={(e) => {
                            const newPhotos = [...formData.photos];
                            newPhotos[index].description = e.target.value;
                            setFormData(prev => ({ ...prev, photos: newPhotos }));
                          }}
                          placeholder="Photo description"
                        />
                        <Select
                          value={photo.beforeAfter}
                          onValueChange={(value) => {
                            const newPhotos = [...formData.photos];
                            newPhotos[index].beforeAfter = value as 'BEFORE' | 'AFTER';
                            setFormData(prev => ({ ...prev, photos: newPhotos }));
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BEFORE">Before</SelectItem>
                            <SelectItem value="AFTER">After</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            const newPhotos = formData.photos.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, photos: newPhotos }));
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      photos: [...prev.photos, { filename: '', description: '', beforeAfter: 'BEFORE' }]
                    }))}
                    variant="outline"
                    size="sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photo Description
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {selectedTicket && (
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Submit Report
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>
      )}

      {/* Summary */}
      {selectedTicket && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Parts Used:</span>
                <Badge variant="secondary">{formData.sparePartsUsed.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Parts Required:</span>
                <Badge variant="secondary">{formData.sparePartsRequired.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Photos:</span>
                <Badge variant="secondary">{formData.photos.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>RMA Parts:</span>
                <Badge variant="destructive">
                  {formData.sparePartsUsed.filter(p => p.isRMA).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedServiceReportForm;
