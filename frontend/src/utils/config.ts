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
  // First priority: Environment variables (Vite uses import.meta.env)
  // Note: Only Vite env variables prefixed with VITE_ are exposed to the browser
  try {
    // Check for Vite env variables (safe browser access)
    const viteEnv = (import.meta as any).env;
    const envApiUrl = viteEnv?.VITE_API_URL;
    
    if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim() !== '') {
      console.log('🌐 Using environment API URL:', envApiUrl);
      // Ensure URL ends with /api
      return envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/$/, '')}/api`;
    }
  } catch (error) {
    // Ignore errors accessing env vars (safe fallback)
    // This catch prevents "Node cannot be found" errors
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, host, port } = window.location;

    // Production detection: if not localhost, try to use same domain
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // For Render or similar platforms where backend is on same domain or subdomain
      // Try common patterns: api.yourdomain.com or yourdomain.com/api
      const isRender = hostname.includes('onrender.com') || hostname.includes('render.com');
      if (isRender) {
        // For Render, backend is usually on a separate service
        // Check for environment variable or try common Render pattern
        const renderApiUrl = (window as any).__RENDER_API_URL__ || 
                           `https://${hostname.replace(/^[^.]+/, 'newcrm-backend')}/api` ||
                           `${protocol}//${host.split('.')[0]}-backend.onrender.com/api`;
        console.log('🌍 Render environment detected, using API URL:', renderApiUrl);
        return renderApiUrl;
      }
      
      // For other deployments, assume backend is on same domain with /api path
      console.log('🌍 Production environment detected, using same domain API');
      return `${protocol}//${host}/api`;
    }

    // Browser-configured API URL (for custom deployments)
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