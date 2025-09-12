import { apiCache } from './cache';

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class OptimizedApiClient {
  private pendingRequests = new Map<string, PendingRequest>();
  private requestTimeout = 30000; // 30 seconds

  private async makeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache: boolean = true,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    if (useCache) {
      const cached = apiCache.get<T>(key);
      if (cached) {
        return cached;
      }
    }

    // Check for pending request
    const pending = this.pendingRequests.get(key);
    if (pending && Date.now() - pending.timestamp < this.requestTimeout) {
      return pending.promise;
    }

    // Make new request
    const promise = requestFn().then((data) => {
      if (useCache) {
        apiCache.set(key, data, ttl);
      }
      this.pendingRequests.delete(key);
      return data;
    }).catch((error) => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  // Optimized methods with caching
  async getAllSites() {
    return this.makeRequest('sites', () => fetch('/api/sites').then(r => r.json()));
  }

  async getAllProjectors() {
    return this.makeRequest('projectors', () => fetch('/api/projectors').then(r => r.json()));
  }

  async getAllServices() {
    return this.makeRequest('services', () => fetch('/api/services').then(r => r.json()));
  }

  async getAllPurchaseOrders() {
    return this.makeRequest('purchase-orders', () => fetch('/api/purchase-orders').then(r => r.json()));
  }

  async getAllFSEs() {
    return this.makeRequest('fse', () => fetch('/api/fse').then(r => r.json()));
  }

  async getAllServiceVisits() {
    return this.makeRequest('service-visits', () => fetch('/api/service-visits').then(r => r.json()));
  }

  async getAllRMA() {
    return this.makeRequest('rma', () => fetch('/api/rma').then(r => r.json()));
  }

  async getAllSpareParts() {
    return this.makeRequest('spare-parts', () => fetch('/api/spare-parts').then(r => r.json()));
  }

  // Invalidate cache when data changes
  invalidateCache(pattern: string) {
    apiCache.invalidate(pattern);
  }

  // Clear all cache
  clearCache() {
    apiCache.clear();
  }
}

export const optimizedApiClient = new OptimizedApiClient(); 