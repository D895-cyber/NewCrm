import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';

interface BulkImportResult {
  total: number;
  success: number;
  failed: number;
  reports: Array<{
    row: number;
    reportNumber: string;
    reportId: string;
    hasOriginalPdf: boolean;
    hasGeneratedPdf: boolean;
  }>;
  errors: Array<{
    row: number;
    reportNumber?: string;
    error?: string;
    errors?: string[];
    warning?: string;
  }>;
}

export function ASCOMPBulkImport({ onImportComplete }: { onImportComplete?: () => void }) {
  const { token, logout } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('📥 Downloading CSV template...');
      
      const response = await fetch('/api/ascomp-reports/csv-template', {
        method: 'GET',
        cache: 'no-cache'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Server error: ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ascomp_report_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading template:', error);
      alert(`Failed to download template: ${error.message}`);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file first');
      return;
    }

    if (!token) {
      alert('You are not logged in. Please log in and try again.');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/ascomp-reports/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        // Check if it's an auth error
        if (response.status === 401 || response.status === 403) {
          alert('Your session has expired. Please log in again.');
          logout();
          return;
        }
        
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();
      setImportResult(result.results);
      
      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error: any) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <Button
        onClick={openModal}
        variant="default"
        className="bg-green-600 hover:bg-green-700"
      >
        <Upload className="w-4 h-4 mr-2" />
        Bulk Import ASCOMP Reports
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Bulk Import ASCOMP Reports
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a CSV file with report data and Google Drive links
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <Card className="bg-blue-50 border-blue-200 p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">How to use bulk import:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Download the CSV template below</li>
                      <li>Fill in your report data (required: cinemaName, engineer_name, date)</li>
                      <li>Add Google Drive sharing links in the 'driveLink' column (optional)</li>
                      <li>Upload the completed CSV file</li>
                      <li>System will import data, download PDFs from Drive, and generate new formatted PDFs</li>
                    </ol>
                    <p className="mt-2 font-medium">
                      ⚠️ Make sure Google Drive links are publicly accessible or shared with view permissions
                    </p>
                  </div>
                </div>
              </Card>

              {/* Download Template */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">CSV Template</p>
                    <p className="text-sm text-gray-600">
                      Download the template with all required columns
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  {selectedFile && (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Import Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Importing reports...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Please wait... Processing data, downloading PDFs from Drive, and generating reports
                  </p>
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          {importResult.total}
                        </p>
                        <p className="text-sm text-gray-600">Total Rows</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {importResult.success}
                        </p>
                        <p className="text-sm text-gray-600">Successful</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-red-50 border-red-200">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">
                          {importResult.failed}
                        </p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    </Card>
                  </div>

                  {/* Success Details */}
                  {importResult.reports.length > 0 && (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Successfully Imported Reports ({importResult.reports.length})
                      </h3>
                      <div className="max-h-60 overflow-y-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-green-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left">Row</th>
                              <th className="px-3 py-2 text-left">Report Number</th>
                              <th className="px-3 py-2 text-center">Original PDF</th>
                              <th className="px-3 py-2 text-center">Generated PDF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.reports.map((report, idx) => (
                              <tr key={idx} className="border-t border-green-200">
                                <td className="px-3 py-2">{report.row}</td>
                                <td className="px-3 py-2 font-medium">{report.reportNumber}</td>
                                <td className="px-3 py-2 text-center">
                                  {report.hasOriginalPdf ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 inline" />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {report.hasGeneratedPdf ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 inline" />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Errors & Warnings ({importResult.errors.length})
                      </h3>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {importResult.errors.map((error, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border border-red-200">
                            <p className="font-medium text-red-900">
                              Row {error.row}
                              {error.reportNumber && ` - ${error.reportNumber}`}
                            </p>
                            {error.error && (
                              <p className="text-sm text-red-700 mt-1">{error.error}</p>
                            )}
                            {error.errors && (
                              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                                {error.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            )}
                            {error.warning && (
                              <p className="text-sm text-orange-600 mt-1">⚠️ {error.warning}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={closeModal}
                  variant="outline"
                  disabled={isImporting}
                >
                  {importResult ? 'Close' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ASCOMPBulkImport;

