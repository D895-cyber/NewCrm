import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Bug, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Wifi,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api/client';

interface DebugInfo {
  user: any;
  apiStatus: 'checking' | 'success' | 'error';
  apiError?: string;
  apiResponse?: any;
  timestamp: string;
}

export function FSEDebugPanel() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const timestamp = new Date().toISOString();
    
    setDebugInfo({
      user,
      apiStatus: 'checking',
      timestamp
    });

    try {
      // Test API connectivity
      const response = await apiClient.getAllServiceVisits();
      
      setDebugInfo(prev => ({
        ...prev!,
        apiStatus: 'success',
        apiResponse: response,
        timestamp: new Date().toISOString()
      }));
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev!,
        apiStatus: 'error',
        apiError: error.message,
        timestamp: new Date().toISOString()
      }));
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checking':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              FSE Dashboard Debug Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>

            {/* API Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5" />
                API Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">API Connectivity</span>
                  <div className="flex items-center gap-2">
                    {debugInfo && getStatusIcon(debugInfo.apiStatus)}
                    <Badge className={debugInfo ? getStatusColor(debugInfo.apiStatus) : 'bg-gray-100 text-gray-800'}>
                      {debugInfo?.apiStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {debugInfo?.apiError && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-1">API Error</h4>
                    <p className="text-sm text-red-700">{debugInfo.apiError}</p>
                  </div>
                )}

                {debugInfo?.apiResponse && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">API Response</h4>
                    <pre className="text-sm text-green-700 overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={runDiagnostics} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.hash = '#mobile-fse'}
                className="flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                Back to FSE Dashboard
              </Button>
            </div>

            {/* Debug Information */}
            {debugInfo && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Debug Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Timestamp:</span> {debugInfo.timestamp}
                    </div>
                    <div>
                      <span className="font-medium">User Role:</span> {user?.role || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">FSE ID:</span> {user?.fseId || 'Not Set'}
                    </div>
                    <div>
                      <span className="font-medium">API Base URL:</span> {apiClient.baseUrl || 'Not Set'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Fixes */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Fixes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Cache & Reload
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.location.hash = '#mobile-test';
                  }}
                  className="flex items-center gap-2"
                >
                  <Wifi className="w-4 h-4" />
                  Test Mobile Features
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
