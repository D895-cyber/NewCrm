import React, { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { ToastContainer } from "./components/ui/toast";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { FSEDashboardPage } from "./components/pages/FSEDashboardPage";
import { WorkingPhotoCapture } from "./components/WorkingPhotoCapture";
import { SimplePhotoCapture } from "./components/SimplePhotoCapture";
import { MobileTestPage } from "./components/mobile/MobileTestPage";
import { FSEWorkflow } from "./components/mobile/FSEWorkflow";
import { FSEDebugPanel } from "./components/mobile/FSEDebugPanel";
import { SimpleFSEDashboard } from "./components/mobile/SimpleFSEDashboard";
import { FSEMobileApp } from "./components/mobile/FSEMobileApp";
import RealFSEDashboard from "./components/mobile/RealFSEDashboard";
import RealFSEWorkflow from "./components/mobile/RealFSEWorkflow";
import { AssignmentWorkflow } from "./components/mobile/AssignmentWorkflow";

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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device and screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    
    // Mobile-first: Show mobile interface for FSE users on mobile devices
    if (isMobile || window.location.pathname === '/mobile-fse' || window.location.hash === '#mobile-fse') {
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
    
    // Check if user wants working photo capture testing
    if (window.location.hash === '#working-photo') {
      console.log('Showing working photo capture');
      return (
        <ErrorBoundary>
          <DataProvider>
            <WorkingPhotoCapture />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }
    
    // Check if user wants simple photo testing
    if (window.location.hash === '#simple-photo') {
      console.log('Showing simple photo capture');
      return (
        <ErrorBoundary>
          <DataProvider>
            <SimplePhotoCapture />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants mobile test page
    if (window.location.hash === '#mobile-test') {
      console.log('Showing mobile test page');
      return (
        <ErrorBoundary>
          <DataProvider>
            <MobileTestPage />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants FSE workflow
    if (window.location.hash === '#fse-workflow') {
      console.log('Showing FSE workflow');
      return (
        <ErrorBoundary>
          <DataProvider>
            <FSEWorkflow />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants FSE debug panel
    if (window.location.hash === '#fse-debug') {
      console.log('Showing FSE debug panel');
      return (
        <ErrorBoundary>
          <DataProvider>
            <FSEDebugPanel />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants simple FSE dashboard
    if (window.location.hash === '#simple-fse') {
      console.log('Showing simple FSE dashboard');
      return (
        <ErrorBoundary>
          <DataProvider>
            <SimpleFSEDashboard />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants real FSE dashboard
    if (window.location.hash === '#real-fse') {
      console.log('Showing real FSE dashboard');
      return (
        <ErrorBoundary>
          <DataProvider>
            <RealFSEDashboard />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants real FSE workflow
    if (window.location.hash === '#real-fse-workflow') {
      console.log('Showing real FSE workflow');
      return (
        <ErrorBoundary>
          <DataProvider>
            <RealFSEWorkflow />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants assignment workflow
    if (window.location.hash === '#assignment-workflow') {
      console.log('Showing assignment workflow');
      return (
        <ErrorBoundary>
          <DataProvider>
            <AssignmentWorkflow />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }

    // Check if user wants desktop FSE dashboard
    if (window.location.hash === '#fse-desktop') {
      console.log('Showing FSE desktop dashboard');
      return (
        <ErrorBoundary>
          <DataProvider>
            <FSEDashboardPage />
          </DataProvider>
          <ToastContainer />
        </ErrorBoundary>
      );
    }
    
    // Default: Show mobile FSE app for FSE users
    console.log('Showing FSE mobile app by default');
    return (
      <ErrorBoundary>
        <DataProvider>
          <FSEMobileApp />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants mobile test page
  if (window.location.hash === '#mobile-test') {
    console.log('Showing mobile test page for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <MobileTestPage />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants FSE workflow
  if (window.location.hash === '#fse-workflow') {
    console.log('Showing FSE workflow for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <FSEWorkflow />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants FSE debug panel
  if (window.location.hash === '#fse-debug') {
    console.log('Showing FSE debug panel for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <FSEDebugPanel />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants simple FSE dashboard
  if (window.location.hash === '#simple-fse') {
    console.log('Showing simple FSE dashboard for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <SimpleFSEDashboard />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants FSE mobile app
  if (window.location.hash === '#mobile-fse') {
    console.log('Showing FSE mobile app for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <FSEMobileApp />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants real FSE dashboard
  if (window.location.hash === '#real-fse') {
    console.log('Showing real FSE dashboard for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <RealFSEDashboard />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Check if admin user wants real FSE workflow
  if (window.location.hash === '#real-fse-workflow') {
    console.log('Showing real FSE workflow for admin');
    return (
      <ErrorBoundary>
        <DataProvider>
          <RealFSEWorkflow />
        </DataProvider>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Admin users get the full dashboard with mobile-first responsive design
  return (
    <ErrorBoundary>
      <DataProvider>
        <Dashboard isMobile={isMobile} />
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