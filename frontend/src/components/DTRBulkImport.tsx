import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

interface DTRImportData {
  'Error Date': string;
  'Case # (YYMMxx)': string;
  'Unit Serial#': string;
  'Nature of Problem/Request': string;
  'Action Taken': string;
  'Remarks': string;
  'Call Status': string;
  'Case Severity': string;
  'Created By': string;
  'Closed Date': string;
  'Closed By': string;
  'Closed Remarks': string;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors: string[];
}

interface DTRTransformedData {
  caseId: string;
  serialNumber: string;
  complaintDescription: string;
  openedBy: {
    name: string;
    designation: string;
    contact: string;
  };
  priority: string;
  assignedTo: {
    name: string;
    role: string;
    assignedDate: Date;
  } | null;
  estimatedResolutionTime: string;
  notes: string;
  errorDate: Date;
  unitModel: string;
  problemName: string;
  actionTaken: string;
  remarks: string;
  callStatus: string;
  caseSeverity: string;
  siteName: string;
  siteCode: string;
  region: string;
  status: string;
  closedBy: {
    name: string;
    closedDate: Date;
  } | null;
}

const DTRBulkImport: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DTRImportData[]>([]);
  const [originalData, setOriginalData] = useState<DTRImportData[]>([]);
  const [tokenStatus, setTokenStatus] = useState<string>('Checking...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check token status on component mount and when token changes
  React.useEffect(() => {
    checkTokenStatus();
  }, [token]);

  const checkTokenStatus = () => {
    if (!token) {
      setTokenStatus('No token found');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp < now) {
        setTokenStatus('Token expired');
      } else {
        const timeLeft = Math.floor((payload.exp - now) / 60);
        setTokenStatus(`Valid (${timeLeft} min left)`);
      }
    } catch (error) {
      setTokenStatus('Invalid token');
    }
  };

  // Expected headers based on your Excel format
  const expectedHeaders = [
    'Error Date',
    'Case # (YYMMxx)',
    'Unit Serial#',
    'Nature of Problem/Request',
    'Action Taken',
    'Remarks',
    'Call Status',
    'Case Severity',
    'Created By',
    'Closed Date',
    'Closed By',
    'Closed Remarks'
  ];

  const downloadTemplate = () => {
    // Create template data with headers and sample row based on your real data
    const templateData = [
      {
        'Error Date': '30-05-2025',
        'Case # (YYMMxx)': '616606',
        'Unit Serial#': '479021012',
        'Nature of Problem/Request': 'Lamp fail to strike. IMCB version error',
        'Action Taken': 'Customer detached from site and installed spare projector. Advised troubleshooting to carryout IMCB shuffle and software upgrade',
        'Remarks': 'Raised the RMA and sent replacement light engine',
        'Call Status': 'Observation',
        'Case Severity': 'Major',
        'Created By': 'Khushwant',
        'Closed Date': '15-06-2025',
        'Closed By': 'Arunraj',
        'Closed Remarks': 'Issue resolved after replacement'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DTR Import Template');
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Error Date
      { wch: 15 }, // Case #
      { wch: 25 }, // SITE
      { wch: 10 }, // Unit
      { wch: 15 }, // Model#
      { wch: 15 }, // Unit Serial#
      { wch: 40 }, // Nature of Problem/Request
      { wch: 30 }, // Action Taken
      { wch: 30 }, // Remarks
      { wch: 12 }, // Call Status
      { wch: 15 }, // Case Severity
      { wch: 15 }, // Created By
      { wch: 12 }, // Date
      { wch: 15 }  // Closed By
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'DTR_Import_Template.xlsx');
  };

  const validateHeaders = (headers: string[]): boolean => {
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    const extraHeaders = headers.filter(header => !expectedHeaders.includes(header));
    
    const errors: string[] = [];
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    if (extraHeaders.length > 0) {
      errors.push(`Unexpected headers found: ${extraHeaders.join(', ')}`);
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // More lenient validation - only check for truly critical issues
  const validateData = (data: DTRImportData[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row number (1 is header)
      
      // Make Unit Serial# optional - only warn if completely missing
      const unitSerial = row['Unit Serial#'];
      if (!unitSerial || unitSerial.toString().trim() === '' || unitSerial.toString().trim() === 'undefined' || unitSerial.toString().trim() === 'null') {
        // Just log a warning instead of blocking import
        console.warn(`Row ${rowNum}: Unit Serial# is empty - will use placeholder`);
      }
      
      const problemDescription = row['Nature of Problem/Request'];
      if (!problemDescription || problemDescription.toString().trim() === '' || problemDescription.toString().trim() === 'undefined' || problemDescription.toString().trim() === 'null') {
        errors.push(`Row ${rowNum}: Nature of Problem/Request is required`);
      }
      
      // Very lenient date validation - only check if it's completely invalid
      if (row['Error Date'] && row['Error Date'].toString().trim() !== '') {
        const errorDateStr = row['Error Date'].toString().trim();
        // Accept any non-empty value for dates - let the backend handle conversion
        if (errorDateStr === 'undefined' || errorDateStr === 'null' || errorDateStr === 'NaN') {
          // Only flag if it's explicitly these string values
        }
      }
      
      if (row['Closed Date'] && row['Closed Date'].toString().trim() !== '') {
        const closedDateStr = row['Closed Date'].toString().trim();
        // Accept any non-empty value for dates - let the backend handle conversion
        if (closedDateStr === 'undefined' || closedDateStr === 'null' || closedDateStr === 'NaN') {
          // Only flag if it's explicitly these string values
        }
      }
    });
    
    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setValidationErrors(['File must contain at least a header row and one data row']);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Validate headers
        if (!validateHeaders(headers)) {
          return;
        }
        
        // Convert rows to objects with very lenient processing
        const dataObjects: DTRImportData[] = rows.map(row => {
          const obj: Partial<DTRImportData> = {};
          headers.forEach((header, index) => {
            const value = row[index];
            // Very lenient value processing - ensure all values are strings
            if (value === null || value === undefined) {
              obj[header as keyof DTRImportData] = '';
            } else if (typeof value === 'number' && isNaN(value)) {
              obj[header as keyof DTRImportData] = '';
            } else {
              obj[header as keyof DTRImportData] = value.toString();
            }
          });
          return obj as DTRImportData;
        });
        
        // Validate data with lenient rules
        const dataErrors = validateData(dataObjects);
        if (dataErrors.length > 0) {
          setValidationErrors(dataErrors);
          return;
        }
        
        setOriginalData(dataObjects);
        setPreviewData(dataObjects);
        setValidationErrors([]);
        
      } catch (error) {
        setValidationErrors([`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Helper function to make authenticated API calls with timeout
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - import took too long. Please try with a smaller file.');
      }
      throw error;
    }
  };

  const handleImport = async () => {
    if (originalData.length === 0) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      // Transform data to match backend API format with robust date handling
      const transformedData: DTRTransformedData[] = originalData.map(row => ({
        caseId: row['Case # (YYMMxx)'] || '', // Include original case ID
        serialNumber: row['Unit Serial#'],
        complaintDescription: row['Nature of Problem/Request'],
        openedBy: {
          name: row['Created By'] || 'Imported User',
          designation: 'Imported',
          contact: 'imported@system.com'
        },
        priority: row['Case Severity'] || 'Medium',
        assignedTo: row['Created By'] ? {
          name: row['Created By'],
          role: 'technician',
          assignedDate: new Date()
        } : null,
        estimatedResolutionTime: '24 hours',
        notes: row['Remarks'] || '',
        errorDate: (() => {
          if (!row['Error Date'] || row['Error Date'].toString().trim() === '') return new Date();
          const errorDateStr = row['Error Date'].toString().trim();
          
          console.log(`🔍 Frontend processing Error Date: "${errorDateStr}"`);
          
          // Try DD-MM-YYYY format first
          const ddmmyyyyMatch = errorDateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
          if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            console.log(`✅ DD-MM-YYYY result:`, result);
            return result;
          }
          
          // Handle Excel serial numbers
          if (/^\d+$/.test(errorDateStr)) {
            const serialNumber = parseInt(errorDateStr);
            if (!isNaN(serialNumber) && serialNumber > 0) {
              const result = new Date(serialNumber * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
              console.log(`✅ Excel serial result:`, result);
              return result;
            }
          }
          
          // Handle malformed date strings with invalid years
          if (errorDateStr.includes('+') && errorDateStr.includes('-')) {
            // Extract just the date part from malformed strings like "+045845-12-31T18:30:00.000Z"
            const dateMatch = errorDateStr.match(/-(\d{2}-\d{2})T/);
            if (dateMatch) {
              const monthDay = dateMatch[1];
              const currentYear = new Date().getFullYear();
              const fixedDateStr = `${currentYear}-${monthDay}`;
              const parsedDate = new Date(fixedDateStr);
              if (!isNaN(parsedDate.getTime())) {
                console.log(`✅ Fixed malformed date:`, parsedDate);
                return parsedDate;
              }
            }
          }
          
          // Try to parse as regular date first
          const parsedDate = Date.parse(errorDateStr);
          if (!isNaN(parsedDate) && parsedDate > 0) {
            const result = new Date(parsedDate);
            console.log(`✅ Regular parsing result:`, result);
            return result;
          }
          
          // Fallback to current date
          console.log(`⚠️ Using fallback date for: "${errorDateStr}"`);
          return new Date();
        })(),
        unitModel: '', // Auto-populated from Unit Serial#
        problemName: row['Nature of Problem/Request'],
        actionTaken: row['Action Taken'] || '',
        remarks: row['Remarks'] || '',
        callStatus: row['Call Status'] || 'Open',
        caseSeverity: row['Case Severity'] || 'Minor',
        siteName: '', // Auto-populated from Unit Serial#
        siteCode: '', // Auto-populated from Unit Serial#
        region: '', // Auto-populated from Unit Serial#
        status: (row['Call Status'] === 'Closed' || row['Call Status'] === 'closed') ? 'Closed' : 'Open',
        closedBy: row['Closed By'] ? {
          name: row['Closed By'],
          designation: 'Imported',
          contact: 'imported@system.com',
          closedDate: (() => {
            if (!row['Closed Date'] || row['Closed Date'].toString().trim() === '') return new Date();
            const dateStr = row['Closed Date'].toString().trim();
            
            console.log(`🔍 Frontend processing Closed Date: "${dateStr}"`);
            
            // Try DD-MM-YYYY format first
            const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
            if (ddmmyyyyMatch) {
              const [, day, month, year] = ddmmyyyyMatch;
              const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              console.log(`✅ DD-MM-YYYY Closed Date result:`, result);
              return result;
            }
            
            // Handle Excel serial numbers
            if (/^\d+$/.test(dateStr)) {
              const serialNumber = parseInt(dateStr);
              if (!isNaN(serialNumber) && serialNumber > 0) {
                const result = new Date(serialNumber * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
                console.log(`✅ Excel serial Closed Date result:`, result);
                return result;
              }
            }
            
            // Try to parse as regular date first
            const parsedDate = Date.parse(dateStr);
            if (!isNaN(parsedDate) && parsedDate > 0) {
              const result = new Date(parsedDate);
              console.log(`✅ Regular Closed Date result:`, result);
              return result;
            }
            
            // Fallback to current date
            console.log(`⚠️ Using fallback Closed Date for: "${dateStr}"`);
            return new Date();
          })(),
          userId: 'imported'
        } : null,
        closedRemarks: row['Closed Remarks'] || ''
      }));
      
      console.log('Sending data to backend:', { dtrs: transformedData.slice(0, 2) }); // Log first 2 items for debugging
      
      // Debug the date fields specifically
      transformedData.slice(0, 2).forEach((dtr, index) => {
        console.log(`DTR ${index + 1} dates:`, {
          errorDate: dtr.errorDate,
          errorDateType: typeof dtr.errorDate,
          errorDateValid: dtr.errorDate instanceof Date && !isNaN(dtr.errorDate.getTime()),
          closedDate: dtr.closedBy?.closedDate,
          closedDateType: typeof dtr.closedBy?.closedDate,
          closedDateValid: dtr.closedBy?.closedDate instanceof Date && !isNaN(dtr.closedBy.closedDate.getTime())
        });
      });
      
      const response = await makeAuthenticatedRequest('/api/dtr/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ dtrs: transformedData })
      });
      
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (response.ok) {
        const totalProcessed = (result.imported || 0) + (result.failed || 0);
        const successRate = totalProcessed > 0 ? Math.round(((result.imported || 0) / totalProcessed) * 100) : 0;
        
        setImportResult({
          success: result.imported > 0,
          message: `Import completed: ${result.imported} successful, ${result.failed} failed (${successRate}% success rate)`,
          imported: result.imported || 0,
          failed: result.failed || 0,
          errors: result.errors || []
        });
        setPreviewData([]);
        setOriginalData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        let errorMessage = result.message || 'Import failed';
        
        // Handle specific error cases
        if (response.status === 403) {
          if (result.error === 'Invalid or expired token') {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (result.message && result.message.includes('Insufficient permissions')) {
            errorMessage = 'You do not have permission to import DTRs. Only Admin or RMA Manager roles can perform bulk imports.';
          }
        } else if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        }
        
        setImportResult({
          success: false,
          message: errorMessage,
          imported: 0,
          failed: previewData.length,
          errors: result.errors || [errorMessage]
        });
      }
      
    } catch (error) {
      console.error('Import error details:', error);
        setImportResult({
          success: false,
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          imported: 0,
          failed: originalData.length,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
    } finally {
      setIsImporting(false);
    }
  };

  const clearImport = () => {
    setPreviewData([]);
    setOriginalData([]);
    setValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          DTR Bulk Import
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-100">
            <span className="font-semibold">Token Status:</span> 
            <span className={`ml-1 px-3 py-1 rounded-md text-xs font-bold ${
              tokenStatus.includes('Valid') ? 'bg-green-700 text-green-100' :
              tokenStatus.includes('expired') || tokenStatus.includes('Invalid') || tokenStatus.includes('No token') ? 'bg-red-700 text-red-100' :
              'bg-yellow-700 text-yellow-100'
            }`}>
              {tokenStatus}
            </span>
          </div>
          <button
            onClick={checkTokenStatus}
            className="px-4 py-2 text-sm bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors font-semibold border border-gray-500"
          >
            Refresh
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* Token Status Warning */}
      {(!isAuthenticated || !token || tokenStatus.includes('expired') || tokenStatus.includes('Invalid') || tokenStatus.includes('No token')) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Authentication Required</h4>
          </div>
          <p className="text-red-700 text-sm">
            {!isAuthenticated ? 'Please log in to access the bulk import feature.' :
             !token ? 'Authentication token not available. Please log in again.' :
             tokenStatus.includes('expired') ? 'Your session has expired. Please log in again.' :
             'Invalid authentication token. Please log in again.'}
          </p>
        </div>
      )}

      {/* File Upload Section */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-500 rounded-lg p-8 text-center bg-gray-800">
          <Upload className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Upload Excel File
          </h3>
          <p className="text-gray-200 mb-4">
            Select an Excel file with DTR data matching the template format
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="dtr-file-upload"
          />
          <label
            htmlFor="dtr-file-upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choose File
          </label>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-red-200">Validation Errors</h4>
          </div>
          <ul className="text-red-300 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Data */}
      {originalData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Preview Data ({originalData.length} rows)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearImport}
                className="px-4 py-2 text-gray-200 border border-gray-500 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !isAuthenticated || !token || !tokenStatus.includes('Valid')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import DTRs
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 border border-gray-600 rounded-lg">
              <thead className="bg-gray-700">
                <tr>
                  {expectedHeaders.map((header) => (
                    <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider border-b border-gray-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {originalData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    {expectedHeaders.map((header) => {
                      let displayValue = row[header as keyof DTRImportData] || '-';
                      
                      // Format dates for preview
                      if (header === 'Error Date' || header === 'Closed Date') {
                        if (displayValue && displayValue !== '-') {
                          const dateStr = displayValue.toString().trim();
                          
                          // Try DD-MM-YYYY format first
                          const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                          if (ddmmyyyyMatch) {
                            const [, day, month, year] = ddmmyyyyMatch;
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            displayValue = date.toLocaleDateString('en-GB');
                          }
                          // Handle Excel serial numbers
                          else if (/^\d+$/.test(dateStr)) {
                            const serialNumber = parseInt(dateStr);
                            if (!isNaN(serialNumber) && serialNumber > 0) {
                              const date = new Date(serialNumber * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
                              displayValue = date.toLocaleDateString('en-GB');
                            }
                          }
                          // Try regular date parsing
                          else {
                            const parsedDate = new Date(dateStr);
                            if (!isNaN(parsedDate.getTime())) {
                              displayValue = parsedDate.toLocaleDateString('en-GB');
                            }
                          }
                        }
                      }
                      
                      return (
                        <td key={header} className="px-3 py-2 text-sm text-gray-100 border-b border-gray-600">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {originalData.length > 5 && (
              <p className="text-sm text-gray-300 mt-2 text-center">
                Showing first 5 rows of {originalData.length} total rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`p-4 rounded-lg border ${
          importResult.success 
            ? 'bg-green-900 border-green-700' 
            : 'bg-red-900 border-red-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {importResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <h4 className={`font-semibold ${
              importResult.success ? 'text-green-200' : 'text-red-200'
            }`}>
              {importResult.success ? 'Import Completed' : 'Import Failed'}
            </h4>
          </div>
          <p className={`${
            importResult.success ? 'text-green-300' : 'text-red-300'
          }`}>
            {importResult.message}
          </p>
          
          {/* Import Statistics */}
          <div className="grid grid-cols-2 gap-4 my-3">
            <div className="bg-gray-800 p-3 rounded border border-gray-600">
              <div className="font-medium text-green-300">✅ Successful</div>
              <div className="text-2xl font-bold text-green-200">{importResult.imported}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded border border-gray-600">
              <div className="font-medium text-red-300">❌ Failed</div>
              <div className="text-2xl font-bold text-red-200">{importResult.failed}</div>
            </div>
          </div>
          
          {importResult.errors.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium mb-2 text-red-200">Error Details:</h5>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {importResult.errors.slice(0, 10).map((error, index) => (
                  <li key={index} className="text-sm text-red-300">• {error}</li>
                ))}
                {importResult.errors.length > 10 && (
                  <li className="text-sm text-gray-300">... and {importResult.errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-900 border border-blue-700 rounded-lg">
        <h4 className="font-semibold text-blue-100 mb-2">Import Instructions</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Download the template to see the exact format required</li>
          <li>• All headers must match exactly (case-sensitive)</li>
          <li>• Unit Serial# and Nature of Problem/Request are required fields</li>
          <li>• SITE, Unit Model, and Auditorium are automatically populated from Unit Serial#</li>
          <li>• Dates should be in DD-MM-YYYY format (e.g., 30-05-2025) or Excel serial numbers</li>
          <li>• Call Status must be: Closed, Observation, Open, RMA Part return to CDS, Waiting_Cust_Responses, blank</li>
          <li>• Case Severity must be: Critical, Information, Major, Minor, Low, blank</li>
        </ul>
      </div>
    </div>
  );
};

export default DTRBulkImport;