import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/loading-spinner';

interface FileInfo {
  filename?: string;
  cloudUrl: string;
  generatedAt?: string;
}

interface ServiceReport {
  _id: string;
  reportNumber: string;
  siteName: string;
  engineer: {
    name: string;
  };
  reportType: string;
  date: string;
  projectorModel: string;
  projectorSerial: string;
  generatedPdfReport?: FileInfo | null;
  generatedDocReport?: FileInfo | null;
  originalPdfReport?: FileInfo | null;
}

export function ASCOMPReportDownloader() {
  const { user, token, logout } = useAuth();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }
    
    apiClient.setAuthToken(token);
    loadReports();
  }, [token]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading ASCOMP reports...');
      const response = await apiClient.get('/service-reports');
      console.log('📊 Reports loaded:', response);
      
      setReports(response || []);
    } catch (err: any) {
      console.error('❌ Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadFromUrl = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReport = async (report: ServiceReport) => {
    try {
      setDownloading(report._id);
      setError(null);
      setSuccess(null);
      
      console.log('📥 Starting ASCOMP report download for:', report._id);
      
      // Prefer generated PDF if available
      if (report.generatedPdfReport?.cloudUrl) {
        console.log('✅ Using generated PDF at:', report.generatedPdfReport.cloudUrl);
        downloadFromUrl(report.generatedPdfReport.cloudUrl, `${report.reportNumber}.pdf`);
        setSuccess(`Report ${report.reportNumber} downloaded successfully!`);
        setTimeout(() => setSuccess(null), 3000);
        return;
      }

      // Ensure authentication token is set before making the request
      if (token) {
        apiClient.setAuthToken(token);
      } else {
        throw new Error('No authentication token available');
      }
      
      // Try to download original PDF if available
      try {
        const apiBaseUrl = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:4000';
        const response = await fetch(`${apiBaseUrl}/api/service-reports/${report._id}/download-original-pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Original PDF found, download it
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ASCOMP_${report.reportNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          setSuccess(`ASCOMP report ${report.reportNumber} downloaded successfully!`);
          setTimeout(() => setSuccess(null), 3000);
          return;
        } else {
          throw new Error('No PDF available for this report');
        }
      } catch (downloadError) {
        console.error('❌ Download failed:', downloadError);
        setError(`No PDF available for report ${report.reportNumber}. Please contact support.`);
      }
      
    } catch (err: any) {
      console.error('❌ Download failed:', err);
      setError(`Failed to download report ${report.reportNumber}: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const viewReport = (reportId: string) => {
    console.log('🔍 Opening ASCOMP report for viewing:', reportId);
    window.location.hash = `#/service-reports/${reportId}?readonly=1`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-300">Loading ASCOMP reports...</p>
        </div>
      </div>
    );
  }

  if (error && !reports.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Reports</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={loadReports} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ASCOMP Report Downloader</h1>
          <p className="text-gray-300">View and download ASCOMP service reports</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              {reports.length} Reports Available
            </Badge>
            <Badge variant="outline" className="text-sm">
              User: {user?.username || 'Unknown'}
            </Badge>
          </div>
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{report.reportNumber}</CardTitle>
                <CardDescription>
                  <div className="space-y-1">
                    <p><strong>Site:</strong> {report.siteName}</p>
                    <p><strong>Engineer:</strong> {report.engineer?.name || 'N/A'}</p>
                    <p><strong>Type:</strong> {report.reportType}</p>
                    <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <strong>Projector:</strong> {report.projectorModel}
                  </p>
                  <p className="text-sm text-gray-300">
                    <strong>Serial:</strong> {report.projectorSerial}
                  </p>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Report includes:</strong> Complete service checklists, technical measurements, environmental data, photos, and signatures
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewReport(report._id)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadReport(report)}
                    disabled={downloading === report._id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {downloading === report._id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Download Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No ASCOMP Reports Found</h3>
            <p className="text-gray-300">No service reports are available for download.</p>
          </div>
        )}
      </div>
    </div>
  );
}
