// Configuration for the projector warranty management system

export const config = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:4000/api',
    timeout: 30000, // 30 seconds
  },
  
  // Application Settings
  app: {
    name: 'Projector Warranty Management',
    version: '1.0.0',
  },
  
  // Default pagination and limits
  defaults: {
    pageSize: 20,
    maxSearchResults: 100,
  },
  
  // Feature flags
  features: {
    realTimeUpdates: true,
    exportFeatures: true,
    advancedSearch: true,
  }
};

// Helper function to get API URL with fallback
export const getApiUrl = (): string => {
  const envApiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.REACT_APP_API_URL;

  if (envApiUrl && typeof envApiUrl === 'string') {
    return envApiUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol, host } = window.location;

    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${host}/api`;
    }

    const browserConfigured = (window as any).ENV?.API_URL;
    if (browserConfigured) {
      return browserConfigured;
    }
  }

  return config.api.baseUrl;
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  try {
    return typeof window !== 'undefined' 
      ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      : false;
  } catch {
    return true; // Default to development if we can't determine
  }
};

export default config;