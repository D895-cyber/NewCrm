import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Copy, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
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
    index?: number;
    rmaNumber?: string;
    error: string;
  }>;
}

interface RMAData {
  rmaNumber: string;
  siteName: string;
  productName: string;
  serialNumber: string;
  caseStatus: string;
  createdBy: string;
  warrantyStatus: string;
  [key: string]: any;
}

export function BulkImportRMA({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [jsonData, setJsonData] = useState<string>('');
  const [parsedData, setParsedData] = useState<RMAData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sample JSON template
  const sampleTemplate = [
    {
      rmaNumber: "RMA-2024-001",
      callLogNumber: "CL-2024-001",
      rmaOrderNumber: "PO-2024-001",
      ascompRaisedDate: "2024-01-15",
      customerErrorDate: "2024-01-10",
      siteName: "Sample Site A",
      productName: "Projector Model X",
      productPartNumber: "PART-001",
      serialNumber: "SN-001",
      defectivePartNumber: "DEFECT-001",
      defectivePartName: "Lamp Assembly",
      defectiveSerialNumber: "DEF-SN-001",
      symptoms: "No display output",
      replacedPartNumber: "REPLACE-001",
      replacedPartName: "New Lamp Assembly",
      replacedPartSerialNumber: "REPL-SN-001",
      replacementNotes: "Replaced under warranty",
      shippedDate: "2024-01-20",
      trackingNumber: "TRK-001",
      shippedThru: "Blue Dart",
      remarks: "Urgent replacement needed",
      createdBy: "John Doe",
      caseStatus: "Under Review",
      approvalStatus: "Pending Review",
      rmaReturnShippedDate: "2024-02-01",
      rmaReturnTrackingNumber: "TRK-002",
      rmaReturnShippedThru: "Blue Dart",
      daysCountShippedToSite: 5,
      daysCountReturnToCDS: 12,
      projectorSerial: "SN-001",
      brand: "Brand X",
      projectorModel: "Model X",
      customerSite: "Site A",
      priority: "High",
      warrantyStatus: "In Warranty",
      estimatedCost: 5000,
      notes: "Replaced lamp assembly",
      shipping: {
        outbound: {
          trackingNumber: "TRK-001",
          carrier: "BLUE_DART",
          carrierService: "EXPRESS",
          shippedDate: "2024-01-20",
          estimatedDelivery: "2024-01-23",
          actualDelivery: "2024-01-22",
          status: "delivered",
          trackingUrl: "https://bluedart.com/track/TRK-001",
          weight: 2.5,
          insuranceValue: 5000,
          requiresSignature: true
        },
        return: {
          trackingNumber: "TRK-002",
          carrier: "BLUE_DART",
          carrierService: "EXPRESS",
          shippedDate: "2024-02-01",
          estimatedDelivery: "2024-02-04",
          status: "in_transit",
          trackingUrl: "https://bluedart.com/track/TRK-002",
          weight: 2.5,
          insuranceValue: 5000,
          requiresSignature: true
        }
      },
      sla: {
        targetDeliveryDays: 3,
        actualDeliveryDays: 2,
        slaBreached: false
      }
    },
    {
      rmaNumber: "RMA-2024-002",
      callLogNumber: "CL-2024-002",
      rmaOrderNumber: "PO-2024-002",
      ascompRaisedDate: "2024-01-16",
      customerErrorDate: "2024-01-11",
      siteName: "Sample Site B",
      productName: "Projector Model Y",
      productPartNumber: "PART-002",
      serialNumber: "SN-002",
      defectivePartNumber: "DEFECT-002",
      defectivePartName: "Power Supply",
      defectiveSerialNumber: "DEF-SN-002",
      symptoms: "Power issues",
      replacedPartNumber: "REPLACE-002",
      replacedPartName: "New Power Supply",
      replacedPartSerialNumber: "REPL-SN-002",
      replacementNotes: "Power supply replacement",
      shippedDate: "2024-01-25",
      trackingNumber: "TRK-003",
      shippedThru: "DTDC",
      remarks: "Power supply replacement",
      createdBy: "Jane Smith",
      caseStatus: "Replacement Shipped",
      approvalStatus: "Approved",
      rmaReturnShippedDate: "2024-02-05",
      rmaReturnTrackingNumber: "TRK-004",
      rmaReturnShippedThru: "DTDC",
      daysCountShippedToSite: 9,
      daysCountReturnToCDS: 11,
      projectorSerial: "SN-002",
      brand: "Brand Y",
      projectorModel: "Model Y",
      customerSite: "Site B",
      priority: "Medium",
      warrantyStatus: "In Warranty",
      estimatedCost: 7500,
      notes: "Power supply replacement"
    }
  ];

  const validateRMAData = (data: any[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((rma, index) => {
      // Required fields validation
      const requiredFields = ['siteName', 'productName', 'serialNumber', 'createdBy'];
      requiredFields.forEach(field => {
        if (!rma[field] || rma[field].trim() === '') {
          errors.push(`Row ${index + 1}: ${field} is required`);
        }
      });

      // Date validation
      if (rma.ascompRaisedDate && isNaN(Date.parse(rma.ascompRaisedDate))) {
        errors.push(`Row ${index + 1}: Invalid ascompRaisedDate format`);
      }
      if (rma.customerErrorDate && isNaN(Date.parse(rma.customerErrorDate))) {
        errors.push(`Row ${index + 1}: Invalid customerErrorDate format`);
      }

      // Status validation
      const validCaseStatuses = ['Under Review', 'Sent to CDS', 'CDS Approved', 'Replacement Shipped', 'Replacement Received', 'Installation Complete', 'Faulty Part Returned', 'CDS Confirmed Return', 'Completed', 'Rejected'];
      if (rma.caseStatus && !validCaseStatuses.includes(rma.caseStatus)) {
        errors.push(`Row ${index + 1}: Invalid caseStatus. Must be one of: ${validCaseStatuses.join(', ')}`);
      }

      const validWarrantyStatuses = ['In Warranty', 'Extended Warranty', 'Out of Warranty', 'Expired'];
      if (rma.warrantyStatus && !validWarrantyStatuses.includes(rma.warrantyStatus)) {
        errors.push(`Row ${index + 1}: Invalid warrantyStatus. Must be one of: ${validWarrantyStatuses.join(', ')}`);
      }

      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (rma.priority && !validPriorities.includes(rma.priority)) {
        errors.push(`Row ${index + 1}: Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    });

    return errors;
  };

  const handleJsonInput = (value: string) => {
    setJsonData(value);
    setValidationErrors([]);
    setImportResult(null);

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setParsedData(parsed);
        const errors = validateRMAData(parsed);
        setValidationErrors(errors);
      } else {
        setValidationErrors(['JSON must be an array of RMA objects']);
        setParsedData([]);
      }
    } catch (error) {
      setValidationErrors(['Invalid JSON format']);
      setParsedData([]);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await apiClient.post('/import/rma/bulk', {
        rmas: parsedData
      });

      setImportResult(response);

      if (response.success) {
        // Refresh RMA data
        if (onImportComplete) {
          onImportComplete();
        }
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      setImportResult({
        success: false,
        message: 'Bulk import failed: ' + (error as Error).message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const loadSampleData = () => {
    setJsonData(JSON.stringify(sampleTemplate, null, 2));
    setParsedData(sampleTemplate);
    setValidationErrors([]);
  };

  const clearData = () => {
    setJsonData('');
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleTemplate, null, 2));
  };

  const closeModal = () => {
    setShowModal(false);
    setJsonData('');
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Upload className="w-4 h-4 mr-2" />
        Bulk Import
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Bulk Import RMA Data</h2>
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
                <h3 className="font-semibold text-blue-900 mb-2">Bulk Import Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Use the sample template below as a reference</li>
                  <li>Paste your RMA data in JSON format</li>
                  <li>Validate the data format</li>
                  <li>Import the validated data</li>
                </ol>
              </div>

              {/* Sample Template */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Sample Template</h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={loadSampleData}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Load Sample</span>
                    </Button>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-700">
{`[
  {
    "rmaNumber": "RMA-2024-001",
    "siteName": "Sample Site A",
    "productName": "Projector Model X",
    "serialNumber": "SN-001",
    "createdBy": "John Doe",
    "caseStatus": "Under Review",
    "warrantyStatus": "In Warranty",
    "ascompRaisedDate": "2024-01-15",
    "customerErrorDate": "2024-01-10"
  }
]`}
                  </pre>
                </div>
              </div>

              {/* JSON Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    RMA Data (JSON Array)
                  </label>
                  <Button
                    onClick={clearData}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </Button>
                </div>
                
                <textarea
                  value={jsonData}
                  onChange={(e) => handleJsonInput(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste your RMA data in JSON format here..."
                />
              </div>

              {/* Validation Results */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">Validation Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {parsedData.length > 0 && validationErrors.length === 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Data Preview ({parsedData.length} RMAs)
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {parsedData.slice(0, 5).map((rma, index) => (
                        <div key={index} className="bg-white p-2 rounded border">
                          <div className="font-medium text-gray-900">{rma.rmaNumber}</div>
                          <div className="text-gray-600">{rma.siteName} - {rma.productName}</div>
                          <div className="text-gray-500">SN: {rma.serialNumber}</div>
                        </div>
                      ))}
                      {parsedData.length > 5 && (
                        <div className="bg-white p-2 rounded border text-center text-gray-500">
                          ... and {parsedData.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={parsedData.length === 0 || validationErrors.length > 0 || isImporting}
                  className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {parsedData.length} RMAs
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
                        {importResult.success ? 'Bulk Import Successful' : 'Bulk Import Failed'}
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
                                <strong>Item {error.index || 'Unknown'}:</strong> {error.error}
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
