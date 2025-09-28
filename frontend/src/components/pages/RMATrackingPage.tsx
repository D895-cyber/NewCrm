import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Navigation
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface TrackingData {
  rmaNumber: string;
  outbound: any;
  return: any;
  trackingHistory: any[];
  lastUpdated: string;
}

interface Shipment {
  rmaId: string;
  rmaNumber: string;
  siteName: string;
  productName: string;
  outbound: any;
  return: any;
}

interface DeliveryProvider {
  id: string;
  name: string;
  code: string;
  displayName: string;
  isActive: boolean;
  supportedServices: any[];
  trackingFormat: any;
  performance: any;
}

export function RMATrackingPage() {
  const [rmas, setRmas] = useState<any[]>([]);
  const [selectedRMA, setSelectedRMA] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');

  // Load initial data
  useEffect(() => {
    loadRMAs();
    loadActiveShipments();
    loadDeliveryProviders();
  }, []);

  const loadRMAs = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/rma');
      setRmas(response.data);
    } catch (error) {
      console.error('Error loading RMAs:', error);
      setError('Failed to load RMA records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveShipments = async () => {
    try {
      const response = await apiClient.get('/rma/tracking/active');
      setActiveShipments(response.data.shipments || []);
    } catch (error) {
      console.error('Error loading active shipments:', error);
    }
  };

  const loadDeliveryProviders = async () => {
    try {
      const response = await apiClient.get('/rma/tracking/providers');
      setDeliveryProviders(response.data.providers || []);
    } catch (error) {
      console.error('Error loading delivery providers:', error);
    }
  };

  const fetchTrackingData = async (rmaId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/rma/${rmaId}/tracking`);
      setTrackingData(response.data.tracking);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setError('Failed to fetch tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTracking = async (rmaId: string) => {
    try {
      setIsLoading(true);
      await apiClient.post('/rma/tracking/update-all');
      await fetchTrackingData(rmaId);
      await loadActiveShipments();
    } catch (error) {
      console.error('Error updating tracking:', error);
      setError('Failed to update tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      case 'exception':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'out_for_delivery':
        return <Navigation className="w-4 h-4" />;
      case 'picked_up':
        return <Package className="w-4 h-4" />;
      case 'exception':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRMAs = (rmas || []).filter(rma => {
    const matchesSearch = rma.rmaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rma.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rma.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (rma.shipping?.outbound?.status === statusFilter) ||
                         (rma.shipping?.return?.status === statusFilter);
    
    const matchesCarrier = carrierFilter === 'all' ||
                          (rma.shipping?.outbound?.carrier === carrierFilter) ||
                          (rma.shipping?.return?.carrier === carrierFilter);
    
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  // Show loading state while data is being fetched
  if (isLoading && (!rmas || rmas.length === 0)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading RMA tracking data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RMA Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and track RMA shipments in real-time</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => updateTracking(selectedRMA?._id)}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by RMA, site, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="exception">Exception</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Carrier</label>
              <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  {(deliveryProviders || []).map((provider) => (
                    <SelectItem key={provider.code} value={provider.code}>
                      {provider.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCarrierFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Shipments</TabsTrigger>
          <TabsTrigger value="tracking">Detailed Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total RMAs</p>
                    <p className="text-2xl font-bold text-gray-900">{rmas?.length || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Shipments</p>
                    <p className="text-2xl font-bold text-gray-900">{activeShipments?.length || 0}</p>
                  </div>
                  <Truck className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered Today</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(rmas || []).filter(rma => 
                        rma.shipping?.outbound?.status === 'delivered' || 
                        rma.shipping?.return?.status === 'delivered'
                      ).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Exceptions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(rmas || []).filter(rma => 
                        rma.shipping?.outbound?.status === 'exception' || 
                        rma.shipping?.return?.status === 'exception'
                      ).length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RMA List */}
          <Card>
            <CardHeader>
              <CardTitle>RMA Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRMAs.map((rma) => (
                  <div
                    key={rma._id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSelectedRMA(rma);
                      fetchTrackingData(rma._id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{rma.rmaNumber}</h3>
                          <Badge variant="outline">{rma.caseStatus}</Badge>
                        </div>
                        <p className="text-gray-600 mb-1">
                          <strong>Site:</strong> {rma.siteName}
                        </p>
                        <p className="text-gray-600 mb-1">
                          <strong>Product:</strong> {rma.productName}
                        </p>
                        <p className="text-gray-600">
                          <strong>Serial:</strong> {rma.serialNumber}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        {rma.shipping?.outbound?.trackingNumber && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Outbound:</span>
                            <Badge className={getStatusColor(rma.shipping.outbound.status)}>
                              {getStatusIcon(rma.shipping.outbound.status)}
                              <span className="ml-1">{rma.shipping.outbound.status}</span>
                            </Badge>
                          </div>
                        )}
                        {rma.shipping?.return?.trackingNumber && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Return:</span>
                            <Badge className={getStatusColor(rma.shipping.return.status)}>
                              {getStatusIcon(rma.shipping.return.status)}
                              <span className="ml-1">{rma.shipping.return.status}</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(activeShipments || []).map((shipment) => (
                  <div key={shipment.rmaId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{shipment.rmaNumber}</h3>
                        <p className="text-gray-600">{shipment.siteName} - {shipment.productName}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const rma = rmas.find(r => r._id === shipment.rmaId);
                          if (rma) {
                            setSelectedRMA(rma);
                            fetchTrackingData(shipment.rmaId);
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shipment.outbound && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Outbound Shipment</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Tracking:</span>
                              <span className="font-mono text-sm">{shipment.outbound.trackingNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Carrier:</span>
                              <span className="text-sm">{shipment.outbound.carrier}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <Badge className={getStatusColor(shipment.outbound.status)}>
                                {getStatusIcon(shipment.outbound.status)}
                                <span className="ml-1">{shipment.outbound.status}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {shipment.return && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Return Shipment</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Tracking:</span>
                              <span className="font-mono text-sm">{shipment.return.trackingNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Carrier:</span>
                              <span className="text-sm">{shipment.return.carrier}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <Badge className={getStatusColor(shipment.return.status)}>
                                {getStatusIcon(shipment.return.status)}
                                <span className="ml-1">{shipment.return.status}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {selectedRMA && trackingData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tracking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Details - {selectedRMA.rmaNumber}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Outbound Tracking */}
                  {trackingData.outbound && (
                    <div>
                      <h3 className="font-medium mb-3 text-blue-900">Outbound Shipment</h3>
                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Tracking Number:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono">{trackingData.outbound.trackingNumber}</span>
                            {trackingData.outbound.trackingUrl && (
                              <a
                                href={trackingData.outbound.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Status:</span>
                          <Badge className={getStatusColor(trackingData.outbound.status)}>
                            {getStatusIcon(trackingData.outbound.status)}
                            <span className="ml-1">{trackingData.outbound.status}</span>
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Carrier:</span>
                          <span>{trackingData.outbound.carrier}</span>
                        </div>
                        {trackingData.outbound.estimatedDelivery && (
                          <div className="flex justify-between items-center">
                            <span>Estimated Delivery:</span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(trackingData.outbound.estimatedDelivery).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}
                        {trackingData.outbound.actualDelivery && (
                          <div className="flex justify-between items-center">
                            <span>Actual Delivery:</span>
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{new Date(trackingData.outbound.actualDelivery).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Return Tracking */}
                  {trackingData.return && (
                    <div>
                      <h3 className="font-medium mb-3 text-green-900">Return Shipment</h3>
                      <div className="bg-green-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Tracking Number:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono">{trackingData.return.trackingNumber}</span>
                            {trackingData.return.trackingUrl && (
                              <a
                                href={trackingData.return.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:underline"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Status:</span>
                          <Badge className={getStatusColor(trackingData.return.status)}>
                            {getStatusIcon(trackingData.return.status)}
                            <span className="ml-1">{trackingData.return.status}</span>
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Carrier:</span>
                          <span>{trackingData.return.carrier}</span>
                        </div>
                        {trackingData.return.estimatedDelivery && (
                          <div className="flex justify-between items-center">
                            <span>Estimated Delivery:</span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(trackingData.return.estimatedDelivery).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}
                        {trackingData.return.actualDelivery && (
                          <div className="flex justify-between items-center">
                            <span>Actual Delivery:</span>
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{new Date(trackingData.return.actualDelivery).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingData.trackingHistory && trackingData.trackingHistory.length > 0 ? (
                      trackingData.trackingHistory
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((event, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">{event.status}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(event.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              {event.location && (
                                <p className="text-sm text-gray-500 flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{event.location}</span>
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.direction}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {event.carrier}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No tracking history available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No RMA Selected</h3>
                <p className="text-gray-600">
                  Select an RMA from the overview tab to view detailed tracking information
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
