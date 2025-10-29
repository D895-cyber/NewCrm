import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { apiClient } from '../utils/api/client';

export function DiagnosticComponent() {
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addDiagnostic = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setDiagnostics(prev => [...prev, {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setDiagnostics([]);
    
    addDiagnostic('Starting diagnostics...', 'info');

    try {
      // Test 1: Basic connectivity
      addDiagnostic('Testing basic connectivity...', 'info');
      const response = await fetch('http://localhost:4000/api/rma', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        addDiagnostic('✅ Basic connectivity test passed', 'success');
        const data = await response.json();
        addDiagnostic(`✅ Received ${data.length} RMA records`, 'success');
      } else {
        addDiagnostic(`❌ Basic connectivity test failed: ${response.status} ${response.statusText}`, 'error');
      }
    } catch (error: any) {
      addDiagnostic(`❌ Basic connectivity test failed: ${error.message}`, 'error');
    }

    try {
      // Test 2: API Client
      addDiagnostic('Testing API client...', 'info');
      const data = await apiClient.getAllRMA();
      addDiagnostic(`✅ API client test passed: ${data.length} records`, 'success');
    } catch (error: any) {
      addDiagnostic(`❌ API client test failed: ${error.message}`, 'error');
    }

    try {
      // Test 3: CORS
      addDiagnostic('Testing CORS...', 'info');
      const corsResponse = await fetch('http://localhost:4000/api/rma', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      if (corsResponse.ok) {
        addDiagnostic('✅ CORS test passed', 'success');
      } else {
        addDiagnostic(`❌ CORS test failed: ${corsResponse.status}`, 'error');
      }
    } catch (error: any) {
      addDiagnostic(`❌ CORS test failed: ${error.message}`, 'error');
    }

    addDiagnostic('Diagnostics completed', 'info');
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>RMA System Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          
          <div className="space-y-2">
            {diagnostics.map((diag) => (
              <div
                key={diag.id}
                className={`p-3 rounded border ${
                  diag.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                  diag.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{diag.message}</span>
                  <span className="text-sm opacity-70">{diag.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



