import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useData } from '../contexts/DataContext';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  X,
  Eye,
  BarChart3
} from 'lucide-react';

interface ImportResult {
  totalProcessed: number;
  inserted: number;
  updated: number;
  duplicates: number;
  errors: number;
  errorDetails: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

interface ImportStatus {
  totalRMAs: number;
  recentImports: Array<{
    rmaNumber: string;
    siteName: string;
    productName: string;
    caseStatus: string;
    createdAt: string;
  }>;
}

const RMAImport: React.FC = () => {
  const { refreshRMA } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load import status on component mount
  React.useEffect(() => {
    loadImportStatus();
  }, []);

  const loadImportStatus = async () => {
    try {
      const response = await fetch('/api/import/rma/status');
      const data = await response.json();
      if (data.success) {
        setImportStatus(data);
      }
    } catch (error) {
      console.error('Error loading import status:', error);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const downloadTemplate = async () => {
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
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/import/rma/csv', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();
      
      if (result.success) {
        setImportResult(result.summary);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh import status and RMA data
        await loadImportStatus();
        // Force refresh RMA data to show all imported records
        console.log('🔄 Refreshing RMA data after successful import...');
        await refreshRMA();
        console.log('✅ RMA data refreshed');
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Sent to CDS': 'bg-blue-100 text-blue-800',
      'CDS Approved': 'bg-green-100 text-green-800',
      'Replacement Shipped': 'bg-purple-100 text-purple-800',
      'Replacement Received': 'bg-indigo-100 text-indigo-800',
      'Faulty Part Returned': 'bg-orange-100 text-orange-800',
      'CDS Confirmed Return': 'bg-teal-100 text-teal-800',
      'Completed': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RMA Data Import</h2>
          <p className="text-gray-600">Upload your Excel/CSV data to import RMA records</p>
        </div>
        <Button onClick={loadImportStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Import Statistics */}
      {importStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total RMAs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{importStatus.totalRMAs}</div>
              <p className="text-xs text-muted-foreground">
                Total RMA records in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Imports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{importStatus.recentImports.length}</div>
              <p className="text-xs text-muted-foreground">
                Imports in last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Import</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {importStatus.recentImports.length > 0 
                  ? new Date(importStatus.recentImports[0].createdAt).toLocaleDateString()
                  : 'No recent imports'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent import date
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Download Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Download the CSV template with the correct column headers and sample data.
            This template matches your Excel structure with all 26 columns.
          </p>
          <Button onClick={downloadTemplate} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileText className="h-12 w-12 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Button onClick={uploadFile} disabled={isUploading} className="bg-green-600 hover:bg-green-700">
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                  <Button onClick={clearFile} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.totalProcessed}</div>
                <div className="text-sm text-gray-600">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.inserted}</div>
                <div className="text-sm text-gray-600">New Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm text-gray-600">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-gray-600">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {importResult.errors > 0 && (
              <div className="mt-4">
                <Button 
                  onClick={() => setShowErrors(!showErrors)}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showErrors ? 'Hide' : 'Show'} Error Details ({importResult.errors})
                </Button>
                
                {showErrors && (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {importResult.errorDetails.map((error, index) => (
                      <div key={index} className="border border-red-600 rounded-lg p-3 mb-2 bg-red-900">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-100">
                              Row {error.row}: {error.error}
                            </p>
                            <pre className="text-xs text-red-200 mt-2 bg-red-800 p-2 rounded border border-red-700 overflow-x-auto">
                              {JSON.stringify(error.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Imports */}
      {importStatus && importStatus.recentImports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importStatus.recentImports.slice(0, 5).map((rma, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{rma.rmaNumber}</p>
                    <p className="text-sm text-gray-600">{rma.siteName} - {rma.productName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(rma.caseStatus)}>
                      {rma.caseStatus}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(rma.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>Download the template and fill it with your RMA data</p>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>Ensure all required fields are filled: Site Name, Product Name, Serial Number</p>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>Use the correct date format: MM/DD/YYYY or YYYY-MM-DD</p>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>RMA numbers will be auto-generated if not provided</p>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>Existing RMAs will be updated, new ones will be created</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RMAImport;
