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
      // For Vercel (static hosting), backend must be on a separate service
      const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel.com');
      if (isVercel) {
        // Vercel is static-only, so backend must be on Render or another service
        // Check for environment variable first, then try common Render backend pattern
        try {
          const viteEnv = (import.meta as any).env;
          const backendUrl = viteEnv?.VITE_BACKEND_URL || viteEnv?.VITE_API_URL;
          if (backendUrl) {
            const vercelBackendUrl = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl.replace(/\/$/, '')}/api`;
            console.log('🌍 Vercel deployment detected, using backend URL from env:', vercelBackendUrl);
            return vercelBackendUrl;
          }
        } catch (error) {
          // Ignore env access errors
        }
        // Fallback to Render backend (update this to your actual backend URL)
        const vercelBackendUrl = 'https://newcrm-zjnk.onrender.com/api';
        console.log('🌍 Vercel deployment detected, using fallback backend URL:', vercelBackendUrl);
        return vercelBackendUrl;
      }
      
      // For Render or similar platforms where backend serves both API and frontend
      // Since we're using a unified service, backend is on the same domain
      const isRender = hostname.includes('onrender.com') || hostname.includes('render.com');
      if (isRender) {
        // For unified Render service, API is on the same domain
        const renderApiUrl = `${protocol}//${host}/api`;
        console.log('🌍 Render unified service detected, using API URL:', renderApiUrl);
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