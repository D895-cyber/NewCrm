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
  // First priority: Environment variables
  const envApiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.REACT_APP_API_URL;

  if (envApiUrl && typeof envApiUrl === 'string') {
    console.log('🌐 Using environment API URL:', envApiUrl);
    return envApiUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol, host } = window.location;

    // Production detection: if not localhost, try to use same domain
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // For Render deployments, try common backend URL patterns
      if (hostname.includes('onrender.com')) {
        // If frontend is on Render, backend might be on a different Render service
        // This should be overridden by VITE_API_URL environment variable
        console.log('🚀 Detected Render deployment, using environment or fallback API URL');
        return `${protocol}//${host}/api`; // Fallback to same domain
      }
      
      // Generic production fallback
      console.log('🌍 Production environment detected, using same domain API');
      return `${protocol}//${host}/api`;
    }

    // Browser-configured API URL
    const browserConfigured = (window as any).ENV?.API_URL;
    if (browserConfigured) {
      console.log('🔧 Using browser-configured API URL:', browserConfigured);
      return browserConfigured;
    }
  }

  // Development fallback
  console.log('🛠️ Using development API URL:', config.api.baseUrl);
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