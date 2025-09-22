import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../utils/api/client';
import { apiCache } from '../utils/api/cache';

interface DataContextType {
  // Data
  sites: any[];
  projectors: any[];
  services: any[];
  purchaseOrders: any[];
  fses: any[];
  serviceVisits: any[];
  rma: any[];
  spareParts: any[];
  
  // Loading states
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshSites: () => Promise<void>;
  refreshProjectors: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshPurchaseOrders: () => Promise<void>;
  refreshFSEs: () => Promise<void>;
  refreshServiceVisits: () => Promise<void>;
  refreshRMA: () => Promise<void>;
  refreshSpareParts: () => Promise<void>;
  
  // Computed data
  dashboardData: {
    sites: number;
    projectors: number;
    pendingPOs: number;
    servicesThisWeek: number;
    warrantyAlerts: any[];
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [sites, setSites] = useState<any[]>([]);
  const [projectors, setProjectors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [fses, setFSEs] = useState<any[]>([]);
  const [serviceVisits, setServiceVisits] = useState<any[]>([]);
  const [rma, setRMA] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Debug: Log when RMA state changes
  useEffect(() => {
    console.log('RMA state updated:', rma.length, 'items');
    if (rma.length > 0) {
      console.log('Current RMA statuses:', rma.map(r => ({ rmaNumber: r.rmaNumber, status: r.status })));
    }
  }, [rma]);
  const [error, setError] = useState<string | null>(null);

  // Memoized dashboard data calculations
  const dashboardData = useMemo(() => {
    const now = new Date();
    // Calculate start and end of current week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Debug week calculation
    console.log('Week calculation debug:');
    console.log('Current date:', now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    console.log('Current day of week (0=Sunday):', now.getDay());
    console.log('Start of week:', startOfWeek.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    console.log('End of week:', endOfWeek.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    const pendingPOs = purchaseOrders.filter((po: any) => po.status === 'Pending').length;
    
    // Count services scheduled for this week (both services and service visits)
    // Also include services scheduled for today or in the near future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const servicesThisWeekData = [
      ...services.filter((service: any) => {
        const serviceDate = new Date(service.date);
        // Include services from start of week to end of week, OR services scheduled for today/future
        return (serviceDate >= startOfWeek && serviceDate <= endOfWeek) || 
               (serviceDate >= today);
      }),
      ...serviceVisits.filter((visit: any) => {
        const visitDate = new Date(visit.scheduledDate);
        // Include visits from start of week to end of week, OR visits scheduled for today/future
        return ((visitDate >= startOfWeek && visitDate <= endOfWeek) || 
                (visitDate >= today)) && visit.status === 'Scheduled';
      })
    ];
    
    const servicesThisWeek = servicesThisWeekData.length;
    
    // Debug logging
    console.log('Dashboard calculation debug:');
    console.log('Current date:', now.toISOString());
    console.log('Start of week:', startOfWeek.toISOString());
    console.log('End of week:', endOfWeek.toISOString());
    console.log('Total services:', services.length);
    console.log('Total service visits:', serviceVisits.length);
    
    // Check if we have any data at all
    if (services.length === 0 && serviceVisits.length === 0) {
      console.log('⚠️ No services or service visits found in database');
    }
    
    // Check services array
    if (services.length > 0) {
      console.log('Services array sample:', services.slice(0, 3).map(s => ({
        id: s.serviceId || s._id,
        date: s.date,
        dateType: typeof s.date,
        parsedDate: new Date(s.date),
        isValidDate: !isNaN(new Date(s.date).getTime())
      })));
    }
    
    // Check service visits array
    if (serviceVisits.length > 0) {
      console.log('Service visits array sample:', serviceVisits.slice(0, 3).map(v => ({
        id: v.visitId || v._id,
        scheduledDate: v.scheduledDate,
        scheduledDateType: typeof v.scheduledDate,
        parsedDate: new Date(v.scheduledDate),
        isValidDate: !isNaN(new Date(v.scheduledDate).getTime()),
        status: v.status
      })));
    }
    
    console.log('Services this week (from services):', services.filter((service: any) => {
      const serviceDate = new Date(service.date);
      return (serviceDate >= startOfWeek && serviceDate <= endOfWeek) || (serviceDate >= today);
    }).length);
    console.log('Services this week (from service visits):', serviceVisits.filter((visit: any) => {
      const visitDate = new Date(visit.scheduledDate);
      return ((visitDate >= startOfWeek && visitDate <= endOfWeek) || (visitDate >= today)) && visit.status === 'Scheduled';
    }).length);
    console.log('Total services this week:', servicesThisWeek);
    
    // Log sample data for debugging
    if (services.length > 0) {
      console.log('Sample service data:', services.slice(0, 2).map(s => ({
        id: s.serviceId || s._id,
        date: s.date,
        dateType: typeof s.date,
        parsedDate: new Date(s.date)
      })));
    }
    
    if (serviceVisits.length > 0) {
      console.log('Sample service visit data:', serviceVisits.slice(0, 2).map(v => ({
        id: v.visitId || v._id,
        scheduledDate: v.scheduledDate,
        scheduledDateType: typeof v.scheduledDate,
        parsedDate: new Date(v.scheduledDate),
        status: v.status
      })));
    }
    
    // Log services found for this week
    const servicesThisWeekFromServices = services.filter((service: any) => {
      const serviceDate = new Date(service.date);
      return (serviceDate >= startOfWeek && serviceDate <= endOfWeek) || (serviceDate >= today);
    });
    
    const servicesThisWeekFromVisits = serviceVisits.filter((visit: any) => {
      const visitDate = new Date(visit.scheduledDate);
      return ((visitDate >= startOfWeek && visitDate <= endOfWeek) || (visitDate >= today)) && visit.status === 'Scheduled';
    });
    
    console.log('Services found for this week (from services):', servicesThisWeekFromServices.map(s => ({
      id: s.serviceId || s._id,
      date: s.date,
      type: s.type
    })));
    
    console.log('Services found for this week (from visits):', servicesThisWeekFromVisits.map(v => ({
      id: v.visitId || v._id,
      scheduledDate: v.scheduledDate,
      visitType: v.visitType,
      status: v.status
    })));
    
    // Test: Show all services and their dates to see what we're working with
    console.log('All services with dates:');
    services.forEach((service: any, index: number) => {
      const serviceDate = new Date(service.date);
      const isThisWeek = (serviceDate >= startOfWeek && serviceDate <= endOfWeek) || (serviceDate >= today);
      console.log(`Service ${index + 1}:`, {
        id: service.serviceId || service._id,
        date: service.date,
        parsedDate: serviceDate.toISOString(),
        isThisWeek,
        type: service.type
      });
    });
    
    console.log('All service visits with dates:');
    serviceVisits.forEach((visit: any, index: number) => {
      const visitDate = new Date(visit.scheduledDate);
      const isThisWeek = ((visitDate >= startOfWeek && visitDate <= endOfWeek) || (visitDate >= today)) && visit.status === 'Scheduled';
      console.log(`Visit ${index + 1}:`, {
        id: visit.visitId || visit._id,
        scheduledDate: visit.scheduledDate,
        parsedDate: visitDate.toISOString(),
        isThisWeek,
        status: visit.status,
        visitType: visit.visitType
      });
    });

    const warrantyAlerts = projectors
      .filter((projector: any) => {
        const warrantyEnd = new Date(projector.warrantyEnd);
        const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return warrantyEnd <= now || daysUntilExpiry <= 30;
      })
      .map((projector: any) => {
        const warrantyEnd = new Date(projector.warrantyEnd);
        const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: `warranty-${projector.serialNumber}`,
          message: warrantyEnd <= now 
            ? `Warranty for ${projector.model} (${projector.serialNumber}) has expired`
            : `Warranty for ${projector.model} (${projector.serialNumber}) expires in ${daysUntilExpiry} days`,
          type: warrantyEnd <= now ? 'error' : 'warning',
          timestamp: new Date()
        };
      });

    return {
      sites: sites.length,
      projectors: projectors.length,
      pendingPOs,
      servicesThisWeek,
      warrantyAlerts
    };
  }, [sites, projectors, services, serviceVisits, purchaseOrders]);

  // Optimized data loading with caching
  const loadData = useCallback(async (dataType: string, loader: () => Promise<any[]>, bypassCache: boolean = false) => {
    const cacheKey = `data-${dataType}`;
    
    if (!bypassCache) {
      const cached = apiCache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const data = await loader();
      if (!bypassCache) {
        apiCache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes cache
      }
      return data;
    } catch (error) {
      console.error(`Error loading ${dataType}:`, error);
      throw error;
    }
  }, []);

  // Individual refresh functions
  const refreshSites = useCallback(async () => {
    try {
      const data = await loadData('sites', () => apiClient.getAllSites());
      setSites(data);
    } catch (err: any) {
      setError(`Failed to load sites: ${err.message}`);
    }
  }, [loadData]);

  const refreshProjectors = useCallback(async () => {
    try {
      const data = await loadData('projectors', () => apiClient.getAllProjectors());
      setProjectors(data);
    } catch (err: any) {
      setError(`Failed to load projectors: ${err.message}`);
    }
  }, [loadData]);

  const refreshServices = useCallback(async () => {
    try {
      console.log('Refreshing services...');
      const data = await loadData('services', () => apiClient.getAllServices());
      console.log('Services loaded:', data.length, 'items');
      if (data.length > 0) {
        console.log('Sample service:', data[0]);
      }
      setServices(data);
    } catch (err: any) {
      setError(`Failed to load services: ${err.message}`);
    }
  }, [loadData]);

  const refreshPurchaseOrders = useCallback(async () => {
    try {
      const data = await loadData('purchase-orders', () => apiClient.getAllPurchaseOrders());
      setPurchaseOrders(data);
    } catch (err: any) {
      setError(`Failed to load purchase orders: ${err.message}`);
    }
  }, [loadData]);

  const refreshFSEs = useCallback(async () => {
    try {
      // Clear FSE cache to ensure fresh data
      apiCache.delete('data-fse');
      const data = await loadData('fse', () => apiClient.getAllFSEs(), true);
      setFSEs(data);
    } catch (err: any) {
      setError(`Failed to load FSEs: ${err.message}`);
    }
  }, [loadData]);

  const refreshServiceVisits = useCallback(async () => {
    try {
      console.log('Refreshing service visits...');
      const data = await loadData('service-visits', () => apiClient.getAllServiceVisits());
      console.log('Service visits loaded:', data.length, 'items');
      if (data.length > 0) {
        console.log('Sample service visit:', data[0]);
      }
      setServiceVisits(data);
    } catch (err: any) {
      setError(`Failed to load service visits: ${err.message}`);
    }
  }, [loadData]);

  const refreshRMA = useCallback(async () => {
    try {
      console.log('Refreshing RMA data...');
      // Clear ALL caches to ensure fresh data
      apiCache.delete('data-rma');
      apiCache.delete('data-sites');
      apiCache.delete('data-projectors');
      apiCache.delete('data-services');
      apiCache.delete('data-purchase-orders');
      apiCache.delete('data-fse');
      apiCache.delete('data-service-visits');
      apiCache.delete('data-spare-parts');
      // Add a longer delay to ensure cache is cleared
      await new Promise(resolve => setTimeout(resolve, 500));
      // Force fresh data by calling API directly without any caching
      const data = await apiClient.getAllRMA();
      console.log('RMA data refreshed:', data.length, 'items');
      console.log('First RMA item:', data[0]);
      console.log('RMA statuses:', data.map(r => ({ rmaNumber: r.rmaNumber, status: r.status })));
      console.log('Setting RMA state with', data.length, 'items');
      setRMA([...data]); // Force a new array reference
    } catch (err: any) {
      setError(`Failed to load RMA: ${err.message}`);
    }
  }, [loadData]);

  const refreshSpareParts = useCallback(async () => {
    try {
      const data = await loadData('spare-parts', () => apiClient.getAllSpareParts());
      setSpareParts(data);
    } catch (err: any) {
      setError(`Failed to load spare parts: ${err.message}`);
    }
  }, [loadData]);

  // Load all data in parallel with priority order
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    try {
      // Load critical data first (sites, projectors, FSEs)
      console.log('Loading critical data...');
      setLoadingProgress(20);
      await Promise.all([
        refreshSites(),
        refreshProjectors(),
        refreshFSEs()
      ]);
      setLoadingProgress(60);
      
      // Load secondary data in background
      console.log('Loading secondary data...');
      Promise.all([
        refreshServices(),
        refreshPurchaseOrders(),
        refreshServiceVisits(),
        refreshRMA(),
        refreshSpareParts()
      ]).then(() => {
        setLoadingProgress(100);
      }).catch(err => {
        console.warn('Some secondary data failed to load:', err);
        setLoadingProgress(100);
      });
      
    } catch (err: any) {
      setError(`Failed to load critical data: ${err.message}`);
      setLoadingProgress(100);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSites, refreshProjectors, refreshServices, refreshPurchaseOrders, refreshFSEs, refreshServiceVisits, refreshRMA, refreshSpareParts]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value: DataContextType = {
    sites,
    projectors,
    services,
    purchaseOrders,
    fses,
    serviceVisits,
    rma,
    spareParts,
    isLoading,
    loadingProgress,
    error,
    refreshData,
    refreshSites,
    refreshProjectors,
    refreshServices,
    refreshPurchaseOrders,
    refreshFSEs,
    refreshServiceVisits,
    refreshRMA,
    refreshSpareParts,
    dashboardData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 