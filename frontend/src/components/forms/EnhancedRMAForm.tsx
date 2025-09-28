import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Save, 
  X, 
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface DeliveryProvider {
  id: string;
  name: string;
  code: string;
  displayName: string;
  supportedServices: any[];
  trackingFormat: any;
  performance: any;
}

interface RMAFormData {
  // Core RMA Information
  callLogNumber: string;
  rmaOrderNumber: string;
  ascompRaisedDate: string;
  customerErrorDate: string;
  siteName: string;
  productName: string;
  productPartNumber: string;
  serialNumber: string;
  
  // Defective Part Details
  defectivePartNumber: string;
  defectivePartName: string;
  defectiveSerialNumber: string;
  symptoms: string;
  
  // Replacement Part Details
  replacedPartNumber: string;
  replacedPartName: string;
  replacedPartSerialNumber: string;
  replacementNotes: string;
  
  // Enhanced Shipping Information
  shipping: {
    outbound: {
      trackingNumber: string;
      carrier: string;
      carrierService: string;
      shippedDate: string;
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
      insuranceValue: number;
      requiresSignature: boolean;
    };
    return: {
      trackingNumber: string;
      carrier: string;
      carrierService: string;
      shippedDate: string;
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
      insuranceValue: number;
      requiresSignature: boolean;
    };
  };
  
  // Additional Information
  remarks: string;
  createdBy: string;
  caseStatus: string;
  priority: string;
  warrantyStatus: string;
  estimatedCost: number;
  notes: string;
}

interface EnhancedRMAFormProps {
  rma?: any;
  onSubmit: (data: RMAFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EnhancedRMAForm({ rma, onSubmit, onCancel, isLoading = false }: EnhancedRMAFormProps) {
  const [formData, setFormData] = useState<RMAFormData>({
    callLogNumber: '',
    rmaOrderNumber: '',
    ascompRaisedDate: '',
    customerErrorDate: '',
    siteName: '',
    productName: '',
    productPartNumber: '',
    serialNumber: '',
    defectivePartNumber: '',
    defectivePartName: '',
    defectiveSerialNumber: '',
    symptoms: '',
    replacedPartNumber: '',
    replacedPartName: '',
    replacedPartSerialNumber: '',
    replacementNotes: '',
    shipping: {
      outbound: {
        trackingNumber: '',
        carrier: '',
        carrierService: '',
        shippedDate: '',
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        insuranceValue: 0,
        requiresSignature: false
      },
      return: {
        trackingNumber: '',
        carrier: '',
        carrierService: '',
        shippedDate: '',
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        insuranceValue: 0,
        requiresSignature: false
      }
    },
    remarks: '',
    createdBy: '',
    caseStatus: 'Under Review',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 0,
    notes: ''
  });

  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDeliveryProviders();
    
    if (rma) {
      // Populate form with existing RMA data
      setFormData({
        callLogNumber: rma.callLogNumber || '',
        rmaOrderNumber: rma.rmaOrderNumber || '',
        ascompRaisedDate: rma.ascompRaisedDate ? new Date(rma.ascompRaisedDate).toISOString().split('T')[0] : '',
        customerErrorDate: rma.customerErrorDate ? new Date(rma.customerErrorDate).toISOString().split('T')[0] : '',
        siteName: rma.siteName || '',
        productName: rma.productName || '',
        productPartNumber: rma.productPartNumber || '',
        serialNumber: rma.serialNumber || '',
        defectivePartNumber: rma.defectivePartNumber || '',
        defectivePartName: rma.defectivePartName || '',
        defectiveSerialNumber: rma.defectiveSerialNumber || '',
        symptoms: rma.symptoms || '',
        replacedPartNumber: rma.replacedPartNumber || '',
        replacedPartName: rma.replacedPartName || '',
        replacedPartSerialNumber: rma.replacedPartSerialNumber || '',
        replacementNotes: rma.replacementNotes || '',
        shipping: {
          outbound: {
            trackingNumber: rma.shipping?.outbound?.trackingNumber || '',
            carrier: rma.shipping?.outbound?.carrier || '',
            carrierService: rma.shipping?.outbound?.carrierService || '',
            shippedDate: rma.shipping?.outbound?.shippedDate ? new Date(rma.shipping.outbound.shippedDate).toISOString().split('T')[0] : '',
            weight: rma.shipping?.outbound?.weight || 0,
            dimensions: rma.shipping?.outbound?.dimensions || { length: 0, width: 0, height: 0 },
            insuranceValue: rma.shipping?.outbound?.insuranceValue || 0,
            requiresSignature: rma.shipping?.outbound?.requiresSignature || false
          },
          return: {
            trackingNumber: rma.shipping?.return?.trackingNumber || '',
            carrier: rma.shipping?.return?.carrier || '',
            carrierService: rma.shipping?.return?.carrierService || '',
            shippedDate: rma.shipping?.return?.shippedDate ? new Date(rma.shipping.return.shippedDate).toISOString().split('T')[0] : '',
            weight: rma.shipping?.return?.weight || 0,
            dimensions: rma.shipping?.return?.dimensions || { length: 0, width: 0, height: 0 },
            insuranceValue: rma.shipping?.return?.insuranceValue || 0,
            requiresSignature: rma.shipping?.return?.requiresSignature || false
          }
        },
        remarks: rma.remarks || '',
        createdBy: rma.createdBy || '',
        caseStatus: rma.caseStatus || 'Under Review',
        priority: rma.priority || 'Medium',
        warrantyStatus: rma.warrantyStatus || 'In Warranty',
        estimatedCost: rma.estimatedCost || 0,
        notes: rma.notes || ''
      });
    }
  }, [rma]);

  const loadDeliveryProviders = async () => {
    try {
      const response = await apiClient.get('/rma/tracking/providers');
      setDeliveryProviders(response.data.providers || []);
    } catch (error) {
      console.error('Error loading delivery providers:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleShippingChange = (direction: 'outbound' | 'return', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [direction]: {
          ...prev.shipping[direction],
          [field]: value
        }
      }
    }));
  };

  const handleCarrierChange = (direction: 'outbound' | 'return', carrierCode: string) => {
    const provider = deliveryProviders.find(p => p.code === carrierCode);
    setSelectedProvider(provider || null);
    
    handleShippingChange(direction, 'carrier', carrierCode);
    handleShippingChange(direction, 'carrierService', ''); // Reset service when carrier changes
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.siteName) newErrors.siteName = 'Site name is required';
    if (!formData.productName) newErrors.productName = 'Product name is required';
    if (!formData.serialNumber) newErrors.serialNumber = 'Serial number is required';
    if (!formData.ascompRaisedDate) newErrors.ascompRaisedDate = 'ASCOMP raised date is required';
    if (!formData.customerErrorDate) newErrors.customerErrorDate = 'Customer error date is required';

    // Date validation
    if (formData.ascompRaisedDate && formData.customerErrorDate) {
      const raisedDate = new Date(formData.ascompRaisedDate);
      const errorDate = new Date(formData.customerErrorDate);
      if (raisedDate < errorDate) {
        newErrors.ascompRaisedDate = 'ASCOMP raised date must be after customer error date';
      }
    }

    // Tracking number validation
    if (formData.shipping.outbound.trackingNumber && formData.shipping.outbound.carrier) {
      const provider = deliveryProviders.find(p => p.code === formData.shipping.outbound.carrier);
      if (provider && !provider.trackingFormat.pattern) {
        // If no pattern defined, accept any format
      } else if (provider && provider.trackingFormat.pattern) {
        const regex = new RegExp(provider.trackingFormat.pattern);
        if (!regex.test(formData.shipping.outbound.trackingNumber)) {
          newErrors['shipping.outbound.trackingNumber'] = `Invalid tracking number format for ${provider.displayName}`;
        }
      }
    }

    if (formData.shipping.return.trackingNumber && formData.shipping.return.carrier) {
      const provider = deliveryProviders.find(p => p.code === formData.shipping.return.carrier);
      if (provider && !provider.trackingFormat.pattern) {
        // If no pattern defined, accept any format
      } else if (provider && provider.trackingFormat.pattern) {
        const regex = new RegExp(provider.trackingFormat.pattern);
        if (!regex.test(formData.shipping.return.trackingNumber)) {
          newErrors['shipping.return.trackingNumber'] = `Invalid tracking number format for ${provider.displayName}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getProviderServices = (carrierCode: string) => {
    const provider = (deliveryProviders || []).find(p => p.code === carrierCode);
    return provider?.supportedServices || [];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {rma ? 'Edit RMA' : 'Create New RMA'}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="parts">Parts Details</TabsTrigger>
            <TabsTrigger value="shipping">Shipping & Tracking</TabsTrigger>
            <TabsTrigger value="additional">Additional Info</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="callLogNumber">Call Log Number</Label>
                    <Input
                      id="callLogNumber"
                      value={formData.callLogNumber}
                      onChange={(e) => handleInputChange('callLogNumber', e.target.value)}
                      placeholder="Enter call log number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rmaOrderNumber">RMA Order Number</Label>
                    <Input
                      id="rmaOrderNumber"
                      value={formData.rmaOrderNumber}
                      onChange={(e) => handleInputChange('rmaOrderNumber', e.target.value)}
                      placeholder="Enter RMA order number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ascompRaisedDate">ASCOMP Raised Date *</Label>
                    <Input
                      id="ascompRaisedDate"
                      type="date"
                      value={formData.ascompRaisedDate}
                      onChange={(e) => handleInputChange('ascompRaisedDate', e.target.value)}
                      className={errors.ascompRaisedDate ? 'border-red-500' : ''}
                    />
                    {errors.ascompRaisedDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.ascompRaisedDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerErrorDate">Customer Error Date *</Label>
                    <Input
                      id="customerErrorDate"
                      type="date"
                      value={formData.customerErrorDate}
                      onChange={(e) => handleInputChange('customerErrorDate', e.target.value)}
                      className={errors.customerErrorDate ? 'border-red-500' : ''}
                    />
                    {errors.customerErrorDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerErrorDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name *</Label>
                    <Input
                      id="siteName"
                      value={formData.siteName}
                      onChange={(e) => handleInputChange('siteName', e.target.value)}
                      placeholder="Enter site name"
                      className={errors.siteName ? 'border-red-500' : ''}
                    />
                    {errors.siteName && (
                      <p className="text-red-500 text-sm mt-1">{errors.siteName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => handleInputChange('productName', e.target.value)}
                      placeholder="Enter product name"
                      className={errors.productName ? 'border-red-500' : ''}
                    />
                    {errors.productName && (
                      <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productPartNumber">Product Part Number</Label>
                    <Input
                      id="productPartNumber"
                      value={formData.productPartNumber}
                      onChange={(e) => handleInputChange('productPartNumber', e.target.value)}
                      placeholder="Enter product part number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number *</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                      placeholder="Enter serial number"
                      className={errors.serialNumber ? 'border-red-500' : ''}
                    />
                    {errors.serialNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.serialNumber}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="caseStatus">Case Status</Label>
                    <Select value={formData.caseStatus} onValueChange={(value) => handleInputChange('caseStatus', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Sent to CDS">Sent to CDS</SelectItem>
                        <SelectItem value="CDS Approved">CDS Approved</SelectItem>
                        <SelectItem value="Replacement Shipped">Replacement Shipped</SelectItem>
                        <SelectItem value="Replacement Received">Replacement Received</SelectItem>
                        <SelectItem value="Installation Complete">Installation Complete</SelectItem>
                        <SelectItem value="Faulty Part Returned">Faulty Part Returned</SelectItem>
                        <SelectItem value="CDS Confirmed Return">CDS Confirmed Return</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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
                  <div>
                    <Label htmlFor="warrantyStatus">Warranty Status</Label>
                    <Select value={formData.warrantyStatus} onValueChange={(value) => handleInputChange('warrantyStatus', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Warranty">In Warranty</SelectItem>
                        <SelectItem value="Extended Warranty">Extended Warranty</SelectItem>
                        <SelectItem value="Out of Warranty">Out of Warranty</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Defective Part Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">Defective Part Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="defectivePartNumber">Defective Part Number</Label>
                    <Input
                      id="defectivePartNumber"
                      value={formData.defectivePartNumber}
                      onChange={(e) => handleInputChange('defectivePartNumber', e.target.value)}
                      placeholder="Enter defective part number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defectivePartName">Defective Part Name</Label>
                    <Input
                      id="defectivePartName"
                      value={formData.defectivePartName}
                      onChange={(e) => handleInputChange('defectivePartName', e.target.value)}
                      placeholder="Enter defective part name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defectiveSerialNumber">Defective Serial Number</Label>
                    <Input
                      id="defectiveSerialNumber"
                      value={formData.defectiveSerialNumber}
                      onChange={(e) => handleInputChange('defectiveSerialNumber', e.target.value)}
                      placeholder="Enter defective serial number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="symptoms">Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      value={formData.symptoms}
                      onChange={(e) => handleInputChange('symptoms', e.target.value)}
                      placeholder="Describe the symptoms or issues"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Replacement Part Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Replacement Part Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="replacedPartNumber">Replaced Part Number</Label>
                    <Input
                      id="replacedPartNumber"
                      value={formData.replacedPartNumber}
                      onChange={(e) => handleInputChange('replacedPartNumber', e.target.value)}
                      placeholder="Enter replaced part number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="replacedPartName">Replaced Part Name</Label>
                    <Input
                      id="replacedPartName"
                      value={formData.replacedPartName}
                      onChange={(e) => handleInputChange('replacedPartName', e.target.value)}
                      placeholder="Enter replaced part name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="replacedPartSerialNumber">Replaced Part Serial Number</Label>
                    <Input
                      id="replacedPartSerialNumber"
                      value={formData.replacedPartSerialNumber}
                      onChange={(e) => handleInputChange('replacedPartSerialNumber', e.target.value)}
                      placeholder="Enter replaced part serial number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="replacementNotes">Replacement Notes</Label>
                    <Textarea
                      id="replacementNotes"
                      value={formData.replacementNotes}
                      onChange={(e) => handleInputChange('replacementNotes', e.target.value)}
                      placeholder="Additional notes about the replacement"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Outbound Shipping */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <Truck className="w-5 h-5" />
                    <span>Outbound Shipment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="outboundTrackingNumber">Tracking Number</Label>
                    <Input
                      id="outboundTrackingNumber"
                      value={formData.shipping.outbound.trackingNumber}
                      onChange={(e) => handleShippingChange('outbound', 'trackingNumber', e.target.value)}
                      placeholder="Enter tracking number"
                      className={errors['shipping.outbound.trackingNumber'] ? 'border-red-500' : ''}
                    />
                    {errors['shipping.outbound.trackingNumber'] && (
                      <p className="text-red-500 text-sm mt-1">{errors['shipping.outbound.trackingNumber']}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="outboundCarrier">Carrier</Label>
                    <Select 
                      value={formData.shipping.outbound.carrier} 
                      onValueChange={(value) => handleCarrierChange('outbound', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {(deliveryProviders || []).map((provider) => (
                          <SelectItem key={provider.code} value={provider.code}>
                            {provider.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.shipping.outbound.carrier && (
                    <div>
                      <Label htmlFor="outboundCarrierService">Service Type</Label>
                      <Select 
                        value={formData.shipping.outbound.carrierService} 
                        onValueChange={(value) => handleShippingChange('outbound', 'carrierService', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProviderServices(formData.shipping.outbound.carrier).map((service) => (
                            <SelectItem key={service.code} value={service.code}>
                              {service.name} - {service.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="outboundShippedDate">Shipped Date</Label>
                    <Input
                      id="outboundShippedDate"
                      type="date"
                      value={formData.shipping.outbound.shippedDate}
                      onChange={(e) => handleShippingChange('outbound', 'shippedDate', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="outboundWeight">Weight (kg)</Label>
                      <Input
                        id="outboundWeight"
                        type="number"
                        step="0.1"
                        value={formData.shipping.outbound.weight}
                        onChange={(e) => handleShippingChange('outbound', 'weight', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outboundInsurance">Insurance Value (₹)</Label>
                      <Input
                        id="outboundInsurance"
                        type="number"
                        value={formData.shipping.outbound.insuranceValue}
                        onChange={(e) => handleShippingChange('outbound', 'insuranceValue', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Length"
                        type="number"
                        value={formData.shipping.outbound.dimensions.length}
                        onChange={(e) => handleShippingChange('outbound', 'dimensions', {
                          ...formData.shipping.outbound.dimensions,
                          length: parseFloat(e.target.value) || 0
                        })}
                      />
                      <Input
                        placeholder="Width"
                        type="number"
                        value={formData.shipping.outbound.dimensions.width}
                        onChange={(e) => handleShippingChange('outbound', 'dimensions', {
                          ...formData.shipping.outbound.dimensions,
                          width: parseFloat(e.target.value) || 0
                        })}
                      />
                      <Input
                        placeholder="Height"
                        type="number"
                        value={formData.shipping.outbound.dimensions.height}
                        onChange={(e) => handleShippingChange('outbound', 'dimensions', {
                          ...formData.shipping.outbound.dimensions,
                          height: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return Shipping */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <Truck className="w-5 h-5" />
                    <span>Return Shipment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="returnTrackingNumber">Tracking Number</Label>
                    <Input
                      id="returnTrackingNumber"
                      value={formData.shipping.return.trackingNumber}
                      onChange={(e) => handleShippingChange('return', 'trackingNumber', e.target.value)}
                      placeholder="Enter tracking number"
                      className={errors['shipping.return.trackingNumber'] ? 'border-red-500' : ''}
                    />
                    {errors['shipping.return.trackingNumber'] && (
                      <p className="text-red-500 text-sm mt-1">{errors['shipping.return.trackingNumber']}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="returnCarrier">Carrier</Label>
                    <Select 
                      value={formData.shipping.return.carrier} 
                      onValueChange={(value) => handleCarrierChange('return', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {(deliveryProviders || []).map((provider) => (
                          <SelectItem key={provider.code} value={provider.code}>
                            {provider.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.shipping.return.carrier && (
                    <div>
                      <Label htmlFor="returnCarrierService">Service Type</Label>
                      <Select 
                        value={formData.shipping.return.carrierService} 
                        onValueChange={(value) => handleShippingChange('return', 'carrierService', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProviderServices(formData.shipping.return.carrier).map((service) => (
                            <SelectItem key={service.code} value={service.code}>
                              {service.name} - {service.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="returnShippedDate">Shipped Date</Label>
                    <Input
                      id="returnShippedDate"
                      type="date"
                      value={formData.shipping.return.shippedDate}
                      onChange={(e) => handleShippingChange('return', 'shippedDate', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="returnWeight">Weight (kg)</Label>
                      <Input
                        id="returnWeight"
                        type="number"
                        step="0.1"
                        value={formData.shipping.return.weight}
                        onChange={(e) => handleShippingChange('return', 'weight', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnInsurance">Insurance Value (₹)</Label>
                      <Input
                        id="returnInsurance"
                        type="number"
                        value={formData.shipping.return.insuranceValue}
                        onChange={(e) => handleShippingChange('return', 'insuranceValue', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Length"
                        type="number"
                        value={formData.shipping.return.dimensions.length}
                        onChange={(e) => handleShippingChange('return', 'dimensions', {
                          ...formData.shipping.return.dimensions,
                          length: parseFloat(e.target.value) || 0
                        })}
                      />
                      <Input
                        placeholder="Width"
                        type="number"
                        value={formData.shipping.return.dimensions.width}
                        onChange={(e) => handleShippingChange('return', 'dimensions', {
                          ...formData.shipping.return.dimensions,
                          width: parseFloat(e.target.value) || 0
                        })}
                      />
                      <Input
                        placeholder="Height"
                        type="number"
                        value={formData.shipping.return.dimensions.height}
                        onChange={(e) => handleShippingChange('return', 'dimensions', {
                          ...formData.shipping.return.dimensions,
                          height: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5" />
                  <span>Additional Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="createdBy">Created By</Label>
                  <Input
                    id="createdBy"
                    value={formData.createdBy}
                    onChange={(e) => handleInputChange('createdBy', e.target.value)}
                    placeholder="Enter creator name"
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => handleInputChange('estimatedCost', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Enter any remarks"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter additional notes"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : (rma ? 'Update RMA' : 'Create RMA')}
          </Button>
        </div>
      </form>
    </div>
  );
}
