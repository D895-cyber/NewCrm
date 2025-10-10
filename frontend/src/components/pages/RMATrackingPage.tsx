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
import { useData } from '../../contexts/DataContext';

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
  const { rma: rmaItems, refreshRMA, isLoading: dataLoading } = useData();
  const [selectedRMA, setSelectedRMA] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');

  // Map backend data to frontend display format (same as RMA page)
  const mapBackendDataToFrontend = (backendRMA: any) => {
    return {
      _id: backendRMA._id,
      rmaNumber: backendRMA.rmaNumber || 'N/A',
      siteName: backendRMA.siteName || 'N/A',
      productName: backendRMA.productName || 'N/A',
      serialNumber: backendRMA.serialNumber || 'N/A',
      caseStatus: backendRMA.caseStatus || 'Under Review',
      shipping: backendRMA.shipping || { outbound: {}, return: {} },
      // Include legacy tracking fields
      trackingNumber: backendRMA.trackingNumber || '',
      rmaReturnTrackingNumber: backendRMA.rmaReturnTrackingNumber || '',
      shippedThru: backendRMA.shippedThru || '',
      rmaReturnShippedThru: backendRMA.rmaReturnShippedThru || ''
    };
  };

  // Use RMA data from DataContext with proper mapping
  const rmas = (rmaItems || []).map(mapBackendDataToFrontend);

  // Helper function to check if RMA has tracking information
  const hasTrackingInfo = (rma: any) => {
    // Check all possible tracking number fields
    const hasOutboundTracking = rma.shipping?.outbound?.trackingNumber && rma.shipping.outbound.trackingNumber !== '';
    const hasReturnTracking = rma.shipping?.return?.trackingNumber && rma.shipping.return.trackingNumber !== '';
    const hasLegacyTracking = rma.trackingNumber && rma.trackingNumber !== '';
    const hasReturnLegacyTracking = rma.rmaReturnTrackingNumber && rma.rmaReturnTrackingNumber !== '';
    
    console.log('🔍 Checking tracking info for RMA:', rma.rmaNumber, {
      hasOutboundTracking,
      hasReturnTracking,
      hasLegacyTracking,
      hasReturnLegacyTracking,
      outboundTracking: rma.shipping?.outbound?.trackingNumber,
      returnTracking: rma.shipping?.return?.trackingNumber,
      legacyTracking: rma.trackingNumber,
      returnLegacyTracking: rma.rmaReturnTrackingNumber
    });
    
    return hasOutboundTracking || hasReturnTracking || hasLegacyTracking || hasReturnLegacyTracking;
  };

  // Load initial data
  useEffect(() => {
    setError(null); // Clear any previous errors
    loadActiveShipments();
    loadDeliveryProviders();
  }, []);

  // Clear error when data loads
  useEffect(() => {
    if (rmas.length > 0) {
      setError(null); // Clear error when RMA data is available
    }
  }, [rmas.length]);

  // Debug: Log RMA data
  useEffect(() => {
    console.log('🔍 RMA Tracking Page Debug:');
    console.log('  - rmaItems from DataContext:', rmaItems?.length || 0, 'items');
    console.log('  - rmas after mapping:', rmas.length, 'items');
    console.log('  - dataLoading:', dataLoading);
    
    if (rmaItems && rmaItems.length > 0) {
      console.log('  - Raw rmaItems[0]:', rmaItems[0]);
      console.log('  - Raw rmaItems[0] keys:', Object.keys(rmaItems[0]));
      console.log('  - Raw rmaItems[0] _id:', rmaItems[0]._id);
    }
    
    if (rmas.length > 0) {
      console.log('  - Mapped rmas[0]:', rmas[0]);
      console.log('  - Mapped rmas[0] keys:', Object.keys(rmas[0]));
      console.log('  - Mapped rmas[0] _id:', rmas[0]._id);
      console.log('  - RMAs with tracking info:', rmas.filter(hasTrackingInfo).length);
    }
  }, [rmas, rmaItems, dataLoading]);

  const loadActiveShipments = async () => {
    try {
      console.log('🔍 Loading active shipments...');
      console.log('🔍 API Client base URL:', apiClient.baseUrl || 'Not set');
      
      // Add cache-busting parameter to ensure fresh data
      const response = await apiClient.get(`/rma/tracking/active?t=${Date.now()}&refresh=true`);
      console.log('✅ Active shipments response received');
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response keys:', Object.keys(response || {}));
      console.log('✅ Response success:', response?.success);
      console.log('✅ Response count:', response?.count);
      console.log('✅ Response shipments length:', response?.shipments?.length);
      
      // The API client returns the response directly, not wrapped in a data property
      if (response && response.shipments) {
        // Direct response structure: { success: true, count: 1, shipments: [...] }
        const shipments = response.shipments || [];
        console.log('✅ Processing direct response structure');
        console.log('✅ Shipments count:', shipments.length);
        console.log('✅ First shipment sample:', shipments[0]);
        setActiveShipments(shipments);
        setError(null); // Clear any previous errors
      } else if (response && response.data && response.data.shipments) {
        // Nested response structure: { data: { success: true, count: 1, shipments: [...] } }
        const shipments = response.data.shipments || [];
        console.log('✅ Processing nested response structure');
        console.log('✅ Shipments count:', shipments.length);
        setActiveShipments(shipments);
        setError(null); // Clear any previous errors
      } else if (response && Array.isArray(response)) {
        console.log('✅ Processing direct array response');
        console.log('✅ Array length:', response.length);
        setActiveShipments(response);
        setError(null); // Clear any previous errors
      } else {
        console.warn('⚠️ Unexpected response structure for active shipments');
        console.warn('Response structure:', response);
        console.warn('Response keys:', Object.keys(response || {}));
        setActiveShipments([]);
        setError('Unexpected response structure from server');
      }
    } catch (error) {
      console.error('❌ Error loading active shipments:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setActiveShipments([]); // Set empty array on error
      setError(`Failed to load active shipments: ${error.message}`);
    }
  };

  const loadDeliveryProviders = async () => {
    try {
      console.log('🔍 Loading delivery providers...');
      const response = await apiClient.get('/rma/tracking/providers');
      console.log('✅ Delivery providers response:', response);
      console.log('✅ Delivery providers data:', response.data);
      
      // Handle different response structures
      if (response && response.data) {
        setDeliveryProviders(response.data.providers || []);
      } else if (response && Array.isArray(response)) {
        setDeliveryProviders(response);
      } else {
        console.warn('⚠️ Unexpected response structure for delivery providers');
        setDeliveryProviders([]);
      }
    } catch (error) {
      console.error('❌ Error loading delivery providers:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setDeliveryProviders([]); // Set empty array on error
    }
  };

  const fetchTrackingData = async (rmaId: string) => {
    try {
      console.log('🔍 Fetching tracking data for RMA ID:', rmaId);
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      if (!rmaId) {
        throw new Error('RMA ID is required');
      }
      
      // Add cache-busting parameter to ensure fresh data
      const response = await apiClient.get(`/rma/${rmaId}/tracking?t=${Date.now()}&refresh=true`);
      console.log('✅ Tracking data response:', response);
      console.log('✅ Tracking data response.data:', response.data);
      
      // Handle different response structures
      if (response && response.data) {
        console.log('✅ Tracking data from response.data.tracking:', response.data.tracking);
        setTrackingData(response.data.tracking || null);
      } else if (response && response.tracking) {
        console.log('✅ Tracking data from response.tracking:', response.tracking);
        setTrackingData(response.tracking);
      } else {
        console.warn('⚠️ Unexpected response structure for tracking data');
        console.warn('Response structure:', response);
        setTrackingData(null);
      }
    } catch (error) {
      console.error('❌ Error fetching tracking data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setError(`Failed to fetch tracking data: ${error.message}`);
      setTrackingData(null); // Set null on error
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
      // Refresh RMA data from DataContext
      await refreshRMA();
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
        return 'bg-green-600 text-white border border-green-500';
      case 'in_transit':
        return 'bg-blue-600 text-white border border-blue-500';
      case 'out_for_delivery':
        return 'bg-yellow-600 text-white border border-yellow-500';
      case 'picked_up':
        return 'bg-purple-600 text-white border border-purple-500';
      case 'exception':
        return 'bg-red-600 text-white border border-red-500';
      case 'returned':
        return 'bg-orange-600 text-white border border-orange-500';
      default:
        return 'bg-gray-600 text-white border border-gray-500';
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

  // Open TracKCourier.io for tracking - auto-detects courier from tracking number
  const openTrackCourier = (trackingNumber: string) => {
    if (trackingNumber) {
      // TracKCourier.io automatically detects the courier, no need to specify provider
      window.open(`https://trackcourier.io/#${encodeURIComponent(trackingNumber)}`, '_blank');
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
  if ((isLoading || dataLoading) && (!rmas || rmas.length === 0)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading RMA tracking data...</p>
            <p className="text-sm text-gray-500 mt-2">
              DataContext loading: {dataLoading ? 'Yes' : 'No'} | 
              RMA items: {rmaItems?.length || 0} | 
              Mapped RMAs: {rmas.length}
            </p>
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
            onClick={async () => {
              await refreshRMA();
              if (selectedRMA?._id) {
                await updateTracking(selectedRMA._id);
              } else {
                console.log('No RMA selected, skipping tracking update');
              }
            }}
            disabled={isLoading || dataLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoading || dataLoading) ? 'animate-spin' : ''}`} />
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
                    <p className="text-2xl font-bold text-gray-900">
                      {rmas.filter(rma => hasTrackingInfo(rma) && 
                        (rma.shipping?.outbound?.status === 'in_transit' || 
                         rma.shipping?.outbound?.status === 'out_for_delivery' ||
                         rma.shipping?.return?.status === 'in_transit' || 
                         rma.shipping?.return?.status === 'out_for_delivery')).length}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {rmas.filter(rma => 
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
                      {rmas.filter(rma => 
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
                    key={rma._id || rma.id || rma.rmaNumber}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      const rmaId = rma._id || rma.id;
                      console.log('🖱️ RMA clicked:', {
                        rmaNumber: rma.rmaNumber,
                        _id: rma._id,
                        id: rma.id,
                        selectedId: rmaId,
                        allKeys: Object.keys(rma)
                      });
                      setSelectedRMA(rma);
                      if (rmaId) {
                        fetchTrackingData(rmaId);
                      } else {
                        console.warn('⚠️ RMA has no valid ID field, cannot fetch tracking data');
                        console.warn('Available fields:', Object.keys(rma));
                        console.warn('RMA object:', rma);
                        setError('RMA ID not found - check console for details');
                      }
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
                        {hasTrackingInfo(rma) ? (
                          <>
                            {/* New shipping structure tracking */}
                            {rma.shipping?.outbound?.trackingNumber && rma.shipping.outbound.trackingNumber !== '' && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Outbound:</span>
                                <Badge className={getStatusColor(rma.shipping.outbound.status || 'pending')}>
                                  {getStatusIcon(rma.shipping.outbound.status || 'pending')}
                                  <span className="ml-1">{rma.shipping.outbound.status || 'pending'}</span>
                                </Badge>
                              </div>
                            )}
                            {rma.shipping?.return?.trackingNumber && rma.shipping.return.trackingNumber !== '' && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Return:</span>
                                <Badge className={getStatusColor(rma.shipping.return.status || 'pending')}>
                                  {getStatusIcon(rma.shipping.return.status || 'pending')}
                                  <span className="ml-1">{rma.shipping.return.status || 'pending'}</span>
                                </Badge>
                              </div>
                            )}
                            
                            {/* Legacy tracking fields */}
                            {rma.trackingNumber && rma.trackingNumber !== '' && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Tracking:</span>
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Package className="w-4 h-4" />
                                  <span className="ml-1">{rma.trackingNumber}</span>
                                </Badge>
                                {rma.shippedThru && (
                                  <span className="text-xs text-gray-500">via {rma.shippedThru}</span>
                                )}
                              </div>
                            )}
                            {rma.rmaReturnTrackingNumber && rma.rmaReturnTrackingNumber !== '' && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Return:</span>
                                <Badge className="bg-green-100 text-green-800">
                                  <Package className="w-4 h-4" />
                                  <span className="ml-1">{rma.rmaReturnTrackingNumber}</span>
                                </Badge>
                                {rma.rmaReturnShippedThru && (
                                  <span className="text-xs text-gray-500">via {rma.rmaReturnShippedThru}</span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No tracking info
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
              <div className="flex justify-between items-center">
                <CardTitle>Active Shipments</CardTitle>
                <Button
                  onClick={async () => {
                    console.log('🔄 Force refreshing active shipments...');
                    await loadActiveShipments();
                  }}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeShipments && activeShipments.length > 0 ? (
                  activeShipments.map((shipment) => (
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
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 shadow-lg">
                          <h4 className="font-semibold text-white mb-4 text-lg flex items-center">
                            <Truck className="w-5 h-5 mr-2 text-blue-400" />
                            Outbound Shipment
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-600">
                              <span className="text-sm font-medium text-gray-300">Tracking Number</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-sm font-semibold text-white bg-gray-700 px-3 py-1 rounded-md border border-gray-500">{shipment.outbound.trackingNumber}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTrackCourier(shipment.outbound.trackingNumber)}
                                  className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                                  title="Track on TracKCourier.io"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-600">
                              <span className="text-sm font-medium text-gray-300">Carrier</span>
                              <span className="text-sm font-semibold text-blue-300 bg-blue-900 px-3 py-1 rounded-md border border-blue-600">{shipment.outbound.carrier}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm font-medium text-gray-300">Status</span>
                              <Badge className={`${getStatusColor(shipment.outbound.status)} text-sm font-medium px-3 py-1`}>
                                {getStatusIcon(shipment.outbound.status)}
                                <span className="ml-1">{shipment.outbound.status}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {shipment.return && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 shadow-lg">
                          <h4 className="font-semibold text-white mb-4 text-lg flex items-center">
                            <Package className="w-5 h-5 mr-2 text-green-400" />
                            Return Shipment
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-600">
                              <span className="text-sm font-medium text-gray-300">Tracking Number</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-sm font-semibold text-white bg-gray-700 px-3 py-1 rounded-md border border-gray-500">{shipment.return.trackingNumber}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTrackCourier(shipment.return.trackingNumber)}
                                  className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white border-green-500"
                                  title="Track on TracKCourier.io"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-600">
                              <span className="text-sm font-medium text-gray-300">Carrier</span>
                              <span className="text-sm font-semibold text-blue-300 bg-blue-900 px-3 py-1 rounded-md border border-blue-600">{shipment.return.carrier}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm font-medium text-gray-300">Status</span>
                              <Badge className={`${getStatusColor(shipment.return.status)} text-sm font-medium px-3 py-1`}>
                                {getStatusIcon(shipment.return.status)}
                                <span className="ml-1">{shipment.return.status}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Truck className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Shipments</h3>
                    <p className="text-gray-600 mb-4">
                      {activeShipments === null ? 'Loading active shipments...' : 'No shipments are currently in transit.'}
                    </p>
                    <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-3">🔧 Debug Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Active shipments:</span>
                          <span className="text-blue-400 font-mono">{activeShipments?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Loading:</span>
                          <span className={`font-mono ${isLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                            {isLoading ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Error:</span>
                          <span className={`font-mono ${error ? 'text-red-400' : 'text-green-400'}`}>
                            {error || 'None'}
                          </span>
                        </div>
                        {activeShipments && activeShipments.length > 0 && (
                          <div className="mt-3">
                            <span className="text-gray-300 block mb-2">Sample Data:</span>
                            <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto border border-gray-600">
                              {JSON.stringify(activeShipments.slice(0, 2), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                  <div className="flex justify-between items-center">
                    <CardTitle>Tracking Details - {selectedRMA.rmaNumber}</CardTitle>
                    <Button
                      onClick={async () => {
                        console.log('🔄 Force refreshing tracking data...');
                        if (selectedRMA?._id) {
                          await fetchTrackingData(selectedRMA._id);
                        }
                      }}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </Button>
                  </div>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openTrackCourier(trackingData.outbound.trackingNumber)}
                              className="h-7 px-2"
                              title="Track on TracKCourier.io"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              <span className="text-xs">Track</span>
                            </Button>
                            {trackingData.outbound.trackingUrl && (
                              <a
                                href={trackingData.outbound.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                                title="Carrier tracking page"
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openTrackCourier(trackingData.return.trackingNumber)}
                              className="h-7 px-2"
                              title="Track on TracKCourier.io"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              <span className="text-xs">Track</span>
                            </Button>
                            {trackingData.return.trackingUrl && (
                              <a
                                href={trackingData.return.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:underline"
                                title="Carrier tracking page"
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
                        {trackingData.return.actualDelivery && (
                          <div className="flex justify-between items-center">
                            <span>Actual Delivery:</span>
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{new Date(trackingData.return.actualDelivery).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}
                        {trackingData.return.estimatedDelivery && !trackingData.return.actualDelivery && (
                          <div className="flex justify-between items-center">
                            <span>Estimated Delivery:</span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(trackingData.return.estimatedDelivery).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}
                        {trackingData.return.referenceNumber && (
                          <div className="flex justify-between items-center">
                            <span>Reference Number:</span>
                            <span className="font-mono text-sm">{trackingData.return.referenceNumber}</span>
                          </div>
                        )}
                        {trackingData.return.transitTime && (
                          <div className="flex justify-between items-center">
                            <span>Transit Time:</span>
                            <span>{trackingData.return.transitTime} days</span>
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
                    {/* Check for timeline in return tracking data */}
                    {trackingData.return?.timeline && trackingData.return.timeline.length > 0 ? (
                      trackingData.return.timeline
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((event, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">{event.description}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(event.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">Status: {event.status}</p>
                              {event.location && event.location !== 'Unknown' && (
                                <p className="text-sm text-gray-500 flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{event.location}</span>
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Return
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {trackingData.return.carrier}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : trackingData.trackingHistory && trackingData.trackingHistory.length > 0 ? (
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
        <div className="fixed bottom-4 right-4 bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-md">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-100 font-bold text-lg leading-none ml-2"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
