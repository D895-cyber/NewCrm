import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { exportServiceReportToPDF } from '../../utils/export';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/loading-spinner';

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

  const downloadReport = async (reportId: string, reportNumber: string) => {
    try {
      setDownloading(reportId);
      setError(null);
      setSuccess(null);
      
      console.log('📥 Starting ASCOMP report download for:', reportId);
      
      // Ensure authentication token is set before making the request
      if (token) {
        apiClient.setAuthToken(token);
      } else {
        throw new Error('No authentication token available');
      }
      
      // First try to download original PDF if available
      try {
        const response = await fetch(`http://localhost:4000/api/service-reports/${reportId}/download-original-pdf`, {
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
          link.download = `Original_${reportNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          setSuccess(`Original FSE PDF for ${reportNumber} downloaded successfully!`);
          setTimeout(() => setSuccess(null), 3000);
          return;
        }
      } catch (originalPdfError) {
        console.log('No original PDF found, generating new one...');
      }
      
      // Generate comprehensive PDF from complete report data
      console.log('🔄 Fetching complete report data for comprehensive PDF generation...');
      const fullReport = await apiClient.getServiceReport(reportId);
      console.log('📊 Full report data received:', {
        hasSections: !!fullReport.sections,
        sectionsKeys: fullReport.sections ? Object.keys(fullReport.sections) : 'No sections',
        hasImageEvaluation: !!fullReport.imageEvaluation,
        hasObservations: !!fullReport.observations,
        hasPhotos: !!fullReport.photos,
        reportKeys: Object.keys(fullReport)
      });
      
      // Generate comprehensive PDF with all sections
      await exportServiceReportToPDF(fullReport);
      console.log('✅ Comprehensive ASCOMP PDF export completed');
      
      setSuccess(`Comprehensive ASCOMP report ${reportNumber} downloaded successfully with all sections!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error('❌ Download failed:', err);
      setError(`Failed to download report ${reportNumber}: ${err.message}`);
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
          <p className="mt-4 text-gray-600">Loading ASCOMP reports...</p>
        </div>
      </div>
    );
  }

  if (error && !reports.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ASCOMP Report Downloader</h1>
          <p className="text-gray-600">Download comprehensive ASCOMP service reports as PDF with all sections and technical details</p>
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
                  <p className="text-sm text-gray-600">
                    <strong>Projector:</strong> {report.projectorModel}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Serial:</strong> {report.projectorSerial}
                  </p>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>PDF includes:</strong> Complete service checklists, technical measurements, environmental data, photos, signatures, and all sections
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
                    onClick={() => downloadReport(report._id, report.reportNumber)}
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
                        Download Full PDF
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ASCOMP Reports Found</h3>
            <p className="text-gray-600">No service reports are available for download.</p>
          </div>
        )}
      </div>
    </div>
  );
}
