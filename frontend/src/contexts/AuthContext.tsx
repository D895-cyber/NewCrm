import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api/client';

interface User {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'fse';
  fseId?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
  permissions: string[];
  fseDetails?: any;
  isImpersonation?: boolean;
  impersonatedBy?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<User['profile']>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isFSE: boolean;
  isImpersonating: boolean;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth called outside of AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
          // Set token in API client
          apiClient.setAuthToken(storedToken);
          // Verify token and get user profile
          await verifyToken(storedToken);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${apiClient.getBaseUrl()}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(authToken);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiClient.getBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        // Set token in API client
        apiClient.setAuthToken(data.token);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('authToken');
    // Clear token from API client
    apiClient.clearAuthToken();
  }, []);

  const updateProfile = async (profile: Partial<User['profile']>): Promise<boolean> => {
    try {
      if (!token) return false;

      const response = await fetch(`${apiClient.getBaseUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...profile } } : null);
        return true;
      } else {
        setError(data.error || 'Profile update failed');
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error. Please try again.');
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!token) return false;

      const response = await fetch(`${apiClient.getBaseUrl()}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        setError(data.error || 'Password change failed');
        return false;
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError('Network error. Please try again.');
      return false;
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isFSE = user?.role === 'fse';
  const isAuthenticated = !!user && !!token;
  const isImpersonating = user?.isImpersonation === true;

  const stopImpersonation = useCallback(() => {
    // Clear impersonation data
    localStorage.removeItem('impersonation');
    localStorage.removeItem('impersonatedBy');
    
    // Logout and redirect to login
    logout();
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    isAdmin,
    isFSE,
    isImpersonating,
    stopImpersonation
  };

  // Don't render children until the provider is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 