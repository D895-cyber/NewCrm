import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceReport {
  _id: string;
  reportNumber: string;
  siteName: string;
  date: string;
  engineer: {
    name: string;
  };
  originalPdfReport?: {
    filename: string;
    originalName: string;
    uploadedAt: string;
    uploadedBy: string;
  };
}

export function UploadOriginalPDF() {
  const { token } = useAuth();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'success' | 'error'}>({});
  const [errorMessage, setErrorMessage] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (token) {
      apiClient.setAuthToken(token);
      loadReports();
    }
  }, [token]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllServiceReports();
      setReports(response.data || response || []);
    } catch (error: any) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (reportId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrorMessage(prev => ({ ...prev, [reportId]: 'Please select a PDF file' }));
      setUploadStatus(prev => ({ ...prev, [reportId]: 'error' }));
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(prev => ({ ...prev, [reportId]: 'File size must be less than 50MB' }));
      setUploadStatus(prev => ({ ...prev, [reportId]: 'error' }));
      return;
    }

    try {
      setUploading(reportId);
      setUploadStatus(prev => ({ ...prev, [reportId]: 'idle' }));
      setErrorMessage(prev => ({ ...prev, [reportId]: '' }));

      // Ensure authentication token is set
      if (token) {
        apiClient.setAuthToken(token);
      } else {
        throw new Error('No authentication token available');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('pdf', file);

      // Upload the PDF
      const response = await fetch(`http://localhost:4000/api/service-reports/${reportId}/upload-original-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadStatus(prev => ({ ...prev, [reportId]: 'success' }));
        await loadReports(); // Refresh the reports list
        
        // Clear the file input
        event.target.value = '';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(prev => ({ ...prev, [reportId]: error.message || 'Upload failed' }));
      setUploadStatus(prev => ({ ...prev, [reportId]: 'error' }));
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Original PDF Reports</h1>
          <p className="text-gray-600">Upload the original PDF reports that were filled out during service visits</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {reports.length} Reports Available
            </span>
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
                    <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
                    {report.originalPdfReport && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-700">
                          <strong>✓ Original PDF uploaded</strong>
                        </p>
                        <p className="text-xs text-green-600">
                          By: {report.originalPdfReport.uploadedBy}
                        </p>
                        <p className="text-xs text-green-600">
                          On: {new Date(report.originalPdfReport.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`pdf-upload-${report._id}`} className="text-sm font-medium">
                      Select PDF File
                    </label>
                    <input
                      id={`pdf-upload-${report._id}`}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => handleFileUpload(report._id, e)}
                      disabled={uploading === report._id}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum file size: 50MB. Only PDF files are allowed.
                    </p>
                  </div>

                  {uploading === report._id && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Uploading PDF...</span>
                    </div>
                  )}

                  {uploadStatus[report._id] === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">PDF uploaded successfully!</span>
                    </div>
                  )}

                  {uploadStatus[report._id] === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{errorMessage[report._id]}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Reports Found</h3>
            <p className="text-gray-600">No service reports are available for PDF upload.</p>
          </div>
        )}
      </div>
    </div>
  );
}
