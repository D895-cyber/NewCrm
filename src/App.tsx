import React, { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ToastContainer } from "./components/ui/toast";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { FSEDashboardPage } from "./components/pages/FSEDashboardPage";
import { FSEMobileApp } from "./components/mobile/FSEMobileApp";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#0F172A', 
          color: 'white', 
          minHeight: '100vh',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
                  <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Application Error</h1>
          <p className="text-gray-300 mb-4">
            An unexpected error occurred. Please try refreshing the page or contact support.
          </p>
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 font-mono text-sm">{this.state.error?.message}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState('main');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // FSE users get their own dashboard
  if (user?.role === 'fse') {
    console.log('FSE user detected, pathname:', window.location.pathname, 'hash:', window.location.hash);
    
    // Check if user wants mobile view
    if (window.location.pathname === '/mobile-fse' || window.location.hash === '#mobile-fse') {
      console.log('Showing mobile FSE app');
      return (
        <ErrorBoundary>
          <DataProvider>
            <FSEMobileApp />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }
    
    console.log('Showing FSE dashboard');
    return (
      <ErrorBoundary>
        <DataProvider>
          <FSEDashboardPage />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Admin users get the full dashboard
  return (
    <ErrorBoundary>
      <DataProvider>
        <Dashboard />
      </DataProvider>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
} 