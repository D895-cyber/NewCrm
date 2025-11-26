import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { apiClient } from '../utils/api/client';

interface ImportResult {
  success: boolean;
  message: string;
  summary?: {
    totalProcessed: number;
    inserted: number;
    duplicates: number;
    errors: number;
  };
  errors?: Array<{
    row?: number;
    rmaNumber?: string;
    error: string;
    data?: any;
  }>;
}

export function ImportRMA({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        alert('Please select a CSV file');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('/api/import/rma/csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // Refresh RMA data
        if (onImportComplete) {
          onImportComplete();
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: 'Import failed: ' + (error as Error).message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/import/rma/template');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rma-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setImportResult(null);
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import RMAs
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Import RMA Data</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Import Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template to see the required format</li>
                  <li>Fill in your RMA data using the template</li>
                  <li>Upload the completed CSV file</li>
                  <li>Review the import results</li>
                </ol>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">CSV Template</p>
                    <p className="text-sm text-gray-600">Download the template with all required fields</p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </Button>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                      </p>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={closeModal}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import RMAs
                    </>
                  )}
                </Button>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className={`p-4 rounded-lg ${
                  importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        importResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {importResult.success ? 'Import Successful' : 'Import Failed'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        importResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {importResult.message}
                      </p>
                      
                      {importResult.summary && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Processed:</span>
                            <span className="ml-2">{importResult.summary.totalProcessed}</span>
                          </div>
                          <div>
                            <span className="font-medium">Successfully Inserted:</span>
                            <span className="ml-2 text-green-600">{importResult.summary.inserted}</span>
                          </div>
                          <div>
                            <span className="font-medium">Duplicates Skipped:</span>
                            <span className="ml-2 text-yellow-600">{importResult.summary.duplicates}</span>
                          </div>
                          <div>
                            <span className="font-medium">Errors:</span>
                            <span className="ml-2 text-red-600">{importResult.summary.errors}</span>
                          </div>
                        </div>
                      )}

                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-red-900 mb-2">Error Details:</h5>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {importResult.errors.slice(0, 10).map((error, index) => (
                              <div key={index} className="text-xs text-red-700 bg-red-100 p-2 rounded">
                                <strong>Row {error.row || 'Unknown'}:</strong> {error.error}
                                {error.rmaNumber && <span className="ml-2">(RMA: {error.rmaNumber})</span>}
                              </div>
                            ))}
                            {importResult.errors.length > 10 && (
                              <p className="text-xs text-red-600 italic">
                                ... and {importResult.errors.length - 10} more errors
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}











































