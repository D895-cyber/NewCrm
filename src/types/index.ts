// Core Types
export interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'fse' | 'user';
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    designation?: string;
  };
  fseId?: string;
  fseDetails?: {
    designation: string;
    assignedTerritory?: string[];
  };
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  _id: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson?: {
    name: string;
    phone: string;
    email: string;
  };
  location: {
    latitude?: number;
    longitude?: number;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Projector {
  _id: string;
  serialNumber: string;
  model: string;
  brand: string;
  site: string;
  siteName: string;
  installDate: string;
  warrantyEnd: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastService?: string;
  nextService?: string;
  runningHours?: number;
  lampHours?: number;
  softwareVersion?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceVisit {
  _id: string;
  visitId: string;
  fseId: string;
  fseName?: string;
  siteId: string;
  siteName?: string;
  projectorSerial: string;
  visitType: 'scheduled' | 'emergency' | 'maintenance';
  scheduledDate: string;
  actualDate?: string;
  startTime?: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  workPerformed?: string;
  photos: Array<{
    filename: string;
    originalName: string;
    path: string;
    cloudUrl?: string;
    uploadedAt: string;
    description: string;
    category: string;
  }>;
  issuesFound: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
  }>;
  recommendations: Array<{
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  customerFeedback?: {
    rating: number;
    comments: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReport {
  _id: string;
  reportNumber: string;
  reportTitle?: string;
  reportType: 'First' | 'Second' | 'Third' | 'Fourth' | 'Emergency' | 'Installation';
  date: string;
  siteId: string;
  siteName: string;
  siteIncharge?: {
    name: string;
    contact: string;
  };
  projectorSerial: string;
  projectorModel: string;
  brand: string;
  engineer?: {
    name: string;
    phone: string;
    email: string;
  };
  sections?: {
    opticals?: Array<{
      description: string;
      status: string;
      result: string;
    }>;
    electronics?: Array<{
      description: string;
      status: string;
      result: string;
    }>;
    mechanical?: Array<{
      description: string;
      status: string;
      result: string;
    }>;
  };
  observations?: Array<{
    number: number;
    description: string;
  }>;
  photos?: Array<{
    filename: string;
    originalName: string;
    path: string;
    cloudUrl?: string;
    description: string;
    category: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface FSE {
  _id: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  assignedTerritory: string[];
  specialization: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  customerSite: string;
  customer: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  items: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  orderDate: string;
  expectedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  _id: string;
  partNumber: string;
  partName: string;
  category: string;
  brand: string;
  projectorModel: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  supplier: string;
  location: string;
  description?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  createdAt: string;
  updatedAt: string;
}

export interface RMA {
  _id: string;
  rmaNumber: string;
  serialNumber: string;
  siteName: string;
  issueDescription: string;
  reportedDate: string;
  status: 'pending' | 'under-review' | 'sent-to-cds' | 'replacement-shipped' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  notes?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Types
export interface DashboardStats {
  sites: number;
  projectors: number;
  pendingPOs: number;
  servicesThisWeek: number;
  warrantyAlerts: any[];
}

// Form Types
export interface FormData {
  [key: string]: any;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

// Filter Types
export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  [key: string]: any;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  filename?: string;
  includeHeaders?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
} 