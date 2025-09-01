import { getApiUrl, isDevelopment } from '../config';

// API client for Express.js backend
class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = getApiUrl();
    this.headers = {
      'Content-Type': 'application/json',
    };

    // Log API URL in development mode
    if (isDevelopment()) {
      console.log('API Client initialized with base URL:', this.baseUrl);
    }
  }

  // Method to set authentication token
  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  // Method to clear authentication token
  clearAuthToken() {
    delete this.headers['Authorization'];
  }

  async request(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Detect FormData bodies to avoid incorrect headers
      const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
      
      if (isDevelopment()) {
        console.log(`API ${options.method || 'GET'} request to:`, url, isFormData ? '(multipart)' : '');
      }

      // Merge headers, but drop JSON content-type for FormData so the browser sets boundary automatically
      const mergedHeaders: Record<string, string> = {
        ...this.headers,
        ...(options.headers as Record<string, string> | undefined),
      } as Record<string, string>;
      if (isFormData && mergedHeaders['Content-Type']) {
        delete mergedHeaders['Content-Type'];
      }

      const response = await fetch(url, {
        ...options,
        headers: mergedHeaders,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as any).error || `HTTP error! status: ${response.status}`;
        
        if (isDevelopment()) {
          console.error(`API error for ${endpoint}:`, errorMessage);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (isDevelopment()) {
        console.log(`API response for ${endpoint}:`, data);
      }
      
      return data;
    } catch (error) {
      console.error(`API ${options.method || 'GET'} error for ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data: any) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  
  async initializeDatabase() {
    return this.post('/settings/initialize', {});
  }

  async clearAllData() {
    return this.post('/clear-all-data', {});
  }

  async healthCheck() {
    return this.get('/health');
  }

  // Authentication methods
  async login(username: string, password: string) {
    return this.post('/auth/login', { username, password });
  }

  async register(userData: any) {
    return this.post('/auth/register', userData);
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData: any) {
    return this.put('/auth/profile', profileData);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.put('/auth/change-password', { currentPassword, newPassword });
  }

  async logout() {
    return this.post('/auth/logout', {});
  }

  // FSE methods
  async getAllFSEs() {
    return this.get('/fse');
  }

  async createFSE(fseData: any) {
    return this.post('/fse', fseData);
  }

  async updateFSE(id: string, updates: any) {
    return this.put(`/fse/${encodeURIComponent(id)}`, updates);
  }

  async deleteFSE(id: string) {
    return this.delete(`/fse/${encodeURIComponent(id)}`);
  }

  async getFSEsByStatus(status: string) {
    return this.get(`/fse/status/${encodeURIComponent(status)}`);
  }

  async getFSEsByTerritory(territory: string) {
    return this.get(`/fse/territory/${encodeURIComponent(territory)}`);
  }

  async searchFSEs(query: string) {
    return this.get(`/fse/search/${encodeURIComponent(query)}`);
  }


  async getSiteStats() {
    const response = await this.get('/sites/stats/overview');
    return response;
  }

  async getFSEStats() {
    return this.get('/fse/stats/overview');
  }

  // Sites methods
  async getAllSites() {
    return this.get('/sites');
  }

  async getSite(id: string) {
    return this.get(`/sites/${encodeURIComponent(id)}`);
  }

  async createSite(siteData: any) {
    return this.post('/sites', siteData);
  }

  async updateSite(id: string, updates: any) {
    return this.put(`/sites/${encodeURIComponent(id)}`, updates);
  }

  async deleteSite(id: string) {
    return this.delete(`/sites/${encodeURIComponent(id)}`);
  }

  // Projectors methods
  async getAllProjectors() {
    return this.get('/projectors');
  }

  async getProjector(id: string) {
    return this.get(`/projectors/${encodeURIComponent(id)}`);
  }

  async createProjector(projectorData: any) {
    return this.post('/projectors', projectorData);
  }

  async updateProjector(id: string, updates: any) {
    return this.put(`/projectors/${encodeURIComponent(id)}`, updates);
  }

  async deleteProjector(id: string) {
    return this.delete(`/projectors/${encodeURIComponent(id)}`);
  }

  // Services methods
  async getAllServices() {
    return this.get('/services');
  }


  async getServices() {
    const response = await this.get('/services');
    return response;
  }

  async getService(id: string) {
    return this.get(`/services/${encodeURIComponent(id)}`);
  }

  async createService(serviceData: any) {
    return this.post('/services', serviceData);
  }

  async updateService(id: string, updates: any) {
    return this.put(`/services/${encodeURIComponent(id)}`, updates);
  }

  async deleteService(id: string) {
    return this.delete(`/services/${encodeURIComponent(id)}`);
  }

  // Purchase Orders methods
  async getAllPurchaseOrders() {
    return this.get('/purchase-orders');
  }

  async getPurchaseOrder(id: string) {
    return this.get(`/purchase-orders/${encodeURIComponent(id)}`);
  }

  async createPurchaseOrder(purchaseOrderData: any) {
    return this.post('/purchase-orders', purchaseOrderData);
  }

  async updatePurchaseOrder(id: string, updates: any) {
    return this.put(`/purchase-orders/${encodeURIComponent(id)}`, updates);
  }

  async deletePurchaseOrder(id: string) {
    return this.delete(`/purchase-orders/${encodeURIComponent(id)}`);
  }

  // RMA methods
  async getAllRMA() {
    console.log('API Client: Getting all RMA data');
    const data = await this.get('/rma');
    console.log('API Client: Received RMA data:', data.length, 'items');
    console.log('API Client: First RMA:', data[0]);
    return data;
  }

  async getRMA(id: string) {
    return this.get(`/rma/${encodeURIComponent(id)}`);
  }

  async createRMA(rmaData: any) {
    return this.post('/rma', rmaData);
  }

  async updateRMA(id: string, updates: any) {
    console.log('API Client: Updating RMA with ID:', id);
    console.log('API Client: Updates data:', updates);
    return this.put(`/rma/${encodeURIComponent(id)}`, updates);
  }

  async deleteRMA(id: string) {
    return this.delete(`/rma/${encodeURIComponent(id)}`);
  }

  async getRMAHistoryByProjector(projectorSerial: string) {
    return this.get(`/rma/projector/${encodeURIComponent(projectorSerial)}`);
  }

  // Service Visit methods
  async getAllServiceVisits() {
    return this.get('/service-visits');
  }

  async getServiceVisit(id: string) {
    return this.get(`/service-visits/${encodeURIComponent(id)}`);
  }

  async createServiceVisit(visitData: any) {
    return this.post('/service-visits', visitData);
  }

  async updateServiceVisit(id: string, updates: any) {
    return this.put(`/service-visits/${encodeURIComponent(id)}`, updates);
  }

  async deleteServiceVisit(id: string) {
    return this.delete(`/service-visits/${encodeURIComponent(id)}`);
  }

  async getServiceVisitsByFSE(fseId: string) {
    return this.get(`/service-visits/fse/${encodeURIComponent(fseId)}`);
  }

  async getServiceVisitsBySite(siteId: string) {
    return this.get(`/service-visits/site/${encodeURIComponent(siteId)}`);
  }

  async getServiceVisitsByProjector(serialNumber: string) {
    return this.get(`/service-visits/projector/${encodeURIComponent(serialNumber)}`);
  }

  async getServiceVisitsByStatus(status: string) {
    return this.get(`/service-visits/status/${encodeURIComponent(status)}`);
  }

  async getServiceVisitsByDateRange(startDate: string, endDate: string) {
    return this.get(`/service-visits/date-range/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`);
  }

  async getServiceVisitStats() {
    return this.get('/service-visits/stats/overview');
  }

  async uploadServiceVisitPhotos(visitId: string, formData: FormData) {
    console.log('API Client: Uploading photos (legacy) to visit:', visitId);
    return this.post(`/service-visits/${encodeURIComponent(visitId)}/photos`, formData);
  }

  async uploadServiceVisitPhotosAutomated(visitId: string, formData: FormData, category: string = 'Other') {
    console.log('API Client: Uploading photos (automated) to visit:', visitId, 'with category:', category);
    formData.append('category', category);
    return this.post(`/service-visits/${encodeURIComponent(visitId)}/photos/automated`, formData);
  }

  async getServiceVisitPhotos(visitId: string) {
    return this.get(`/service-visits/${encodeURIComponent(visitId)}/photos`);
  }

  async getCloudStats() {
    return this.get('/service-visits/cloud-stats');
  }

  // Service Report methods
  async getAllServiceReports() {

    const originalHeaders = { ...this.headers };
    delete this.headers['Authorization'];
    try {
      const result = await this.get('/service-reports');
      return result;
    } finally {
      this.headers = originalHeaders;
    }
  }

  async getFSEServiceReports() {
    const originalHeaders = { ...this.headers };
    delete this.headers['Authorization'];
    try {
      const result = await this.get('/service-reports');
      return result;
    } finally {
      this.headers = originalHeaders;
    }
  }

  async getCompletedServiceVisits() {
    // Get completed service visits from FSE engineers
    const originalHeaders = { ...this.headers };
    delete this.headers['Authorization'];
    try {
      const result = await this.get('/service-visits');
      // Filter to only show completed visits
      const completedVisits = result.filter((visit: any) => {
        return visit.status === 'Completed';
      });
      return completedVisits;
    } finally {
      this.headers = originalHeaders;
    }
  }

  async getServiceReport(id: string) {
    return this.get(`/service-reports/${encodeURIComponent(id)}`);
  }

  async createServiceReport(reportData: any) {
    return this.post('/service-reports', reportData);
  }

  async updateServiceReport(id: string, updates: any) {
    return this.put(`/service-reports/${encodeURIComponent(id)}`, updates);
  }

  async deleteServiceReport(id: string) {
    return this.delete(`/service-reports/${encodeURIComponent(id)}`);
  }

  async getServiceReportsByProjector(projectorSerial: string) {
    return this.get(`/service-reports/projector/${encodeURIComponent(projectorSerial)}`);
  }

  async getServiceReportsByEngineer(engineerName: string) {
    return this.get(`/service-reports/engineer/${encodeURIComponent(engineerName)}`);
  }

  async getServiceReportsBySite(siteName: string) {
    return this.get(`/service-reports/site/${encodeURIComponent(siteName)}`);
  }

  async getServiceReportsByVisit(visitId: string) {
    return this.get(`/service-reports/visit/${encodeURIComponent(visitId)}`);
  }

  async getServiceReportsByDateRange(startDate: string, endDate: string) {
    return this.get(`/service-reports/date-range/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`);
  }

  async getServiceReportDashboardStats() {

    const originalHeaders = { ...this.headers };
    delete this.headers['Authorization'];
    try {
      const result = await this.get('/service-reports/stats/dashboard');
      return result;
    } finally {
      this.headers = originalHeaders;
    }
  }

  // FSE Analytics methods
  async getFSEAnalytics() {
    return this.get('/service-reports/analytics/fse');
  }

  async getDetailedServiceReports(limit = 50, skip = 0) {
    return this.get(`/service-reports/analytics/detailed?limit=${limit}&skip=${skip}`);
  }

  // AMC Contract methods
  async createAMCContract(contractData: any) {
    return this.post('/amc-contracts', contractData);
  }

  async getAllAMCContracts() {
    return this.get('/amc-contracts');
  }

  async getAMCContract(id: string) {
    return this.get(`/amc-contracts/${encodeURIComponent(id)}`);
  }

  async updateAMCContract(id: string, updates: any) {
    return this.put(`/amc-contracts/${encodeURIComponent(id)}`, updates);
  }

  async deleteAMCContract(id: string) {
    return this.delete(`/amc-contracts/${encodeURIComponent(id)}`);
  }

  async getAMCContractsByProjector(projectorSerial: string) {
    return this.get(`/amc-contracts/projector/${encodeURIComponent(projectorSerial)}`);
  }

  async getAMCContractsByStatus(status: string) {
    return this.get(`/amc-contracts/status/${encodeURIComponent(status)}`);
  }

  async getAMCContractsByFSE(fseId: string) {
    return this.get(`/amc-contracts/fse/${encodeURIComponent(fseId)}`);
  }

  async getAMCContractsExpiringSoon(days: number) {
    return this.get(`/amc-contracts/expiring/${days}`);
  }

  async getOverdueAMCServices() {
    return this.get('/amc-contracts/overdue/services');
  }

  async getAMCDashboardStats() {
    return this.get('/amc-contracts/stats/dashboard');
  }

  async updateAMCServiceStatus(contractId: string, serviceType: 'first' | 'second', updates: any) {
    return this.put(`/amc-contracts/${encodeURIComponent(contractId)}/service/${serviceType}/status`, updates);
  }

  async renewAMCContract(contractId: string, renewalPeriod: number) {
    return this.post(`/amc-contracts/${encodeURIComponent(contractId)}/renew`, { renewalPeriod });
  }

  // Recommended Spares queue (Admin)
  async getRecommendedSpares(params?: { status?: string; siteId?: string; projectorSerial?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.siteId) q.set('siteId', params.siteId);
    if (params?.projectorSerial) q.set('projectorSerial', params.projectorSerial);
    const qs = q.toString();
    return this.get(`/service-reports/recommended-spares${qs ? `?${qs}` : ''}`);
  }

  async updateRecommendedSpare(id: string, updates: any) {
    return this.put(`/recommended-spares/${encodeURIComponent(id)}`, updates);
  }

  async createRecommendedSpare(data: any) {
    return this.post('/recommended-spares', data);
  }

  // Spare Parts methods
  async getAllSpareParts() {
    return this.get('/spare-parts');
  }

  async getSparePart(id: string) {
    return this.get(`/spare-parts/${encodeURIComponent(id)}`);
  }

  async createSparePart(sparePartData: any) {
    return this.post('/spare-parts', sparePartData);
  }

  async updateSparePart(id: string, updates: any) {
    return this.put(`/spare-parts/${encodeURIComponent(id)}`, updates);
  }

  async deleteSparePart(id: string) {
    return this.delete(`/spare-parts/${encodeURIComponent(id)}`);
  }

  async getSparePartsByCategory(category: string) {
    return this.get(`/spare-parts/category/${encodeURIComponent(category)}`);
  }

  async getSparePartsByStatus(status: string) {
    return this.get(`/spare-parts/status/${encodeURIComponent(status)}`);
  }

  async getLowStockSpareParts() {
    return this.get('/spare-parts/alerts/low-stock');
  }

  async searchSpareParts(query: string) {
    return this.get(`/spare-parts/search/${encodeURIComponent(query)}`);
  }

  async updateSparePartStock(id: string, stockQuantity: number) {
    return this.patch(`/spare-parts/${encodeURIComponent(id)}/stock`, { stockQuantity });
  }



  // Utility methods
  getBaseUrl(): string {
    return this.baseUrl;
  }


}

export const apiClient = new ApiClient();
export default apiClient;