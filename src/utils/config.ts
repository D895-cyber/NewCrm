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
  // Try multiple sources for API URL configuration
  const sources = [
    // Environment variable (if available)
    typeof window !== 'undefined' ? (window as any).ENV?.API_URL : null,
    typeof globalThis !== 'undefined' ? globalThis.process?.env?.REACT_APP_API_URL : null,
    // Default fallback
    config.api.baseUrl
  ];

  for (const source of sources) {
    if (source && typeof source === 'string') {
      return source;
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