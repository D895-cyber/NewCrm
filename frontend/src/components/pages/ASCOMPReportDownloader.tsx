import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Eye, RefreshCw, AlertCircle, CheckCircle, FileText, Code } from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/loading-spinner';
import { exportASCOMPReportToPDF } from '../../utils/ascomp-pdf-export';

interface FileInfo {
  filename?: string;
  cloudUrl: string;
  generatedAt?: string;
}

interface ServiceReport {
  _id: string;
  reportNumber: string;
  cinemaName: string;
  engineer: {
    name: string;
  };
  reportType?: string;
  date: string;
  projectorModelSerialAndHours?: string;
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
      
      console.log('🔍 Loading ASCOMP reports... (v3.0 - ASCOMP format only)');
      
      // Load ONLY ASCOMP reports - NO old format reports
      // Add timestamp to prevent caching
      const response = await apiClient.getAllASCOMPReports();
      let ascompReports = response || [];
      
      console.log('📦 Raw response received:', {
        count: ascompReports.length,
        firstReportNumber: ascompReports[0]?.reportNumber,
        hasOldFormat: ascompReports.some((r: any) => r.reportNumber?.startsWith('REPORT-'))
      });
      
      // FILTER OUT any old format reports that somehow got in
      ascompReports = ascompReports.filter((r: any) => {
        const isASCOMP = r.reportNumber?.startsWith('ASCOMP-');
        if (!isASCOMP) {
          console.warn('⚠️ Filtering out non-ASCOMP report:', r.reportNumber);
        }
        return isASCOMP;
      });
      
      console.log('📊 ASCOMP reports loaded:', {
        total: ascompReports.length,
        migrated: ascompReports.filter((r: any) => r.reportNumber?.includes('ASCOMP-EW-')).length,
        original: ascompReports.filter((r: any) => r.reportNumber?.startsWith('ASCOMP-') && !r.reportNumber?.includes('ASCOMP-EW-')).length
      });
      
      setReports(ascompReports);
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
      
      console.log('📥 Starting ASCOMP report download for:', report._id, 'Report Number:', report.reportNumber);
      
      // Validate report format
      if (!report.reportNumber?.startsWith('ASCOMP-')) {
        setError(`Invalid report format: ${report.reportNumber}. Only ASCOMP format reports can be downloaded.`);
        setDownloading(null);
        return;
      }
      
      // Ensure authentication token is set
      if (token) {
        apiClient.setAuthToken(token);
      } else {
        throw new Error('No authentication token available');
      }
      
      // Check if pre-generated PDF is available
      if (report.generatedPdfReport?.cloudUrl) {
        console.log('✅ Using pre-generated PDF at:', report.generatedPdfReport.cloudUrl);
        downloadFromUrl(report.generatedPdfReport.cloudUrl, `${report.reportNumber}.pdf`);
        setSuccess(`Report ${report.reportNumber} downloaded successfully!`);
        setTimeout(() => setSuccess(null), 3000);
        return;
      }
      
      // Generate PDF on the fly using ASCOMP format
      try {
        console.log('🔄 Fetching ASCOMP report data for PDF generation...');
        const fullReport = await apiClient.getASCOMPReport(report._id);
        
        // Validate report has required data
        if (!fullReport || !fullReport.cinemaName) {
          throw new Error('Report is missing required data (cinema name). Please edit and complete the report first.');
        }
        
        console.log('📄 Generating ASCOMP PDF in exact format...', {
          reportNumber: fullReport.reportNumber,
          cinema: fullReport.cinemaName,
          hasOpticals: !!fullReport.opticals,
          hasElectronics: !!fullReport.electronics
        });
        
        await exportASCOMPReportToPDF(fullReport);
        
        setSuccess(`ASCOMP report ${report.reportNumber} downloaded successfully in exact format!`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (pdfError: any) {
        console.error('❌ PDF generation failed:', pdfError);
        const errorMsg = pdfError.message || 'Unknown error';
        if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          setError(`Report ${report.reportNumber} not found. It may have been deleted.`);
        } else if (errorMsg.includes('missing required data')) {
          setError(`Report ${report.reportNumber} is incomplete. ${errorMsg}`);
        } else {
          setError(`Could not generate PDF for ${report.reportNumber}. ${errorMsg}`);
        }
      }
      
    } catch (err: any) {
      console.error('❌ Download failed:', err);
      setError(`Failed to download report ${report.reportNumber}: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  const viewReport = (reportId: string) => {
    console.log('🔍 Opening ASCOMP report for viewing:', reportId);
    window.location.hash = `#/service-reports/${reportId}?readonly=1`;
  };

  const downloadWordReport = async (report: ServiceReport) => {
    try {
      setDownloading(report._id);
      setError(null);
      setSuccess(null);

      console.log('📝 Starting Word document download for:', report._id);

      // Validate report format
      if (!report.reportNumber?.startsWith('ASCOMP-')) {
        setError(`Invalid report format: ${report.reportNumber}. Only ASCOMP format reports can be downloaded.`);
        setDownloading(null);
        return;
      }

      // Ensure authentication token is set
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Use default template name (admin should have uploaded this)
      const templateName = 'ASCOMP_EW_Report';

      const response = await fetch(`http://localhost:4000/api/word-templates/generate/${report._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate Word document');
      }

      // Download the Word document
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.reportNumber}_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`Word document for ${report.reportNumber} downloaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Word download failed:', err);
      setError(`Failed to download Word document: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  const downloadHtmlPdfReport = async (report: ServiceReport) => {
    try {
      setDownloading(report._id);
      setError(null);
      setSuccess(null);

      console.log('🎨 Starting HTML template PDF generation for:', report._id);

      // Validate report format
      if (!report.reportNumber?.startsWith('ASCOMP-')) {
        setError(`Invalid report format: ${report.reportNumber}. Only ASCOMP format reports can be downloaded.`);
        setDownloading(null);
        return;
      }

      // Ensure authentication token is set
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Use the complete ASCOMP report template
      const templateName = 'ascomp_complete_report'; // Your custom template with all fields

      console.log('📋 Template name:', templateName);
      
      // Get proper API URL (works in dev and production)
      const apiUrl = apiClient['baseUrl'] || 'http://localhost:4000/api';
      const requestUrl = `${apiUrl}/html-to-pdf/generate/${report._id}`;
      
      console.log('📤 Sending request to:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          templateName,
          pdfOptions: {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm'
            }
          }
        })
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📄 Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to generate PDF from HTML template';
        
        try {
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error('❌ Server error (JSON):', errorData);
          } else {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
            console.error('❌ Server error (Text):', errorText);
          }
        } catch (parseError) {
          console.error('❌ Could not parse error response');
        }
        
        throw new Error(errorMessage);
      }

      // Verify it's actually a PDF
      const contentType = response.headers.get('content-type');
      console.log('✅ Response OK, Content-Type:', contentType);
      
      if (!contentType?.includes('application/pdf')) {
        console.error('❌ Response is not a PDF! Content-Type:', contentType);
        const text = await response.text();
        console.error('Response body:', text.substring(0, 500));
        throw new Error('Server did not return a PDF file. Check backend logs.');
      }

      // Download the PDF
      const blob = await response.blob();
      console.log('📦 PDF blob created, size:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.reportNumber}_HTML_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF download triggered successfully!');

      setSuccess(`PDF generated from HTML template for ${report.reportNumber}!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ HTML PDF generation failed:', err);
      setError(`Failed to generate PDF: ${err.message || 'Unknown error'}. Make sure you have uploaded an HTML template.`);
    } finally {
      setDownloading(null);
    }
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
                    <p><strong>Cinema:</strong> {report.cinemaName}</p>
                    <p><strong>Engineer:</strong> {report.engineer?.name || 'N/A'}</p>
                    <p><strong>Type:</strong> {report.reportType}</p>
                    <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <strong>Projector:</strong> {report.projectorModelSerialAndHours || 'N/A'}
                  </p>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Report includes:</strong> Complete service checklists, technical measurements, environmental data, photos, and signatures
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 mt-4">
                  <div className="flex space-x-2">
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
                          PDF
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadWordReport(report)}
                    disabled={downloading === report._id}
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  >
                    {downloading === report._id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-1" />
                        Download as Word (.docx)
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadHtmlPdfReport(report)}
                    disabled={downloading === report._id}
                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    {downloading === report._id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code className="w-4 h-4 mr-1" />
                        PDF from HTML Template
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
