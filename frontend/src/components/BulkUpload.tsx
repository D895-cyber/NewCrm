import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  MapPin,
  Monitor,
  Users,
  Building2,
  FileUp,
  AlertCircle
} from "lucide-react";
import { apiClient } from "../utils/api/client";

interface BulkUploadData {
  sites: Array<{
    name: string;
    siteCode: string;
    region: string;
    state: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    contactPerson: {
      name: string;
      email: string;
      phone: string;
      designation: string;
    };
    businessHours: {
      openTime: string;
      closeTime: string;
      workingDays: string[];
    };
    siteType: string;
    status: string;
                  amcContract: {
                contractNumber: string;
                contractStartDate: string;
                contractEndDate: string;
                contractValue: number;
                contractManager: string;
                status: string;
                serviceLevel: string;
              };
    auditoriums: Array<{
      audiNumber: string;
      name: string;
      capacity: number;
      screenSize: string;
      status: string;
    }>;
    projectors: Array<{
      projectorNumber: string;
      serialNumber: string;
      model: string;
      brand: string;
      auditoriumId: string;
      auditoriumName: string;
      installDate: string;
      warrantyEnd: string;
      status: string;
      condition: string;
      expectedLife: number;
      amcContract?: {
        contractNumber: string;
        contractStartDate: string;
        contractEndDate: string;
        contractValue: number;
        contractManager: string;
        status: string;
      };
    }>;
  }>;
}

export function BulkUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'json' | 'csv'>('json');
  const [jsonData, setJsonData] = useState('');
  const [csvData, setCsvData] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    sites: { success: number; failed: number; errors: string[] };
    projectors: { success: number; failed: number; errors: string[] };
    summary?: {
      totalSites: number;
      totalProjectors: number;
      processedSites: number;
      processedProjectors: number;
    };
  }>({ sites: { success: 0, failed: 0, errors: [] }, projectors: { success: 0, failed: 0, errors: [] } });
  const [showResults, setShowResults] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);





  const clearUploadData = () => {
    setJsonData('');
    setCsvData('');
    setJsonFile(null);
    setCsvFile(null);
    setShowResults(false);
  };

  const handleJsonUpload = async () => {
    try {
      setIsLoading(true);
      setShowResults(false);
      
      const data: BulkUploadData = JSON.parse(jsonData);
      const results = { sites: { success: 0, failed: 0, errors: [] }, projectors: { success: 0, failed: 0, errors: [] } };

      // Upload sites and their projectors
      for (const siteData of data.sites) {
        try {
          // Create site
          const site = await apiClient.createSite(siteData);
          results.sites.success++;
          
          // Create projectors for this site
          for (const projectorData of siteData.projectors) {
            try {
              const projector = await apiClient.createProjector({
                ...projectorData,
                siteId: site._id
              });
              results.projectors.success++;
            } catch (error: any) {
              results.projectors.failed++;
              results.projectors.errors.push(`Projector ${projectorData.serialNumber}: ${error.message}`);
            }
          }
        } catch (error: any) {
          results.sites.failed++;
          results.sites.errors.push(`Site ${siteData.name}: ${error.message}`);
        }
      }

      setUploadStatus(results);
      setShowResults(true);
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      alert('Error parsing JSON data. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    try {
      setIsLoading(true);
      setShowResults(false);
      
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      console.log('CSV Headers:', headers);
      console.log('First data row:', lines[1]);
      
      const results = { sites: { success: 0, failed: 0, errors: [] }, projectors: { success: 0, failed: 0, errors: [] } };

      // Group by site name
      const siteGroups = new Map();
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines
        
        // Handle quoted values properly
        const values = parseCSVLine(line);
        console.log(`Row ${i} values:`, values);
        
        if (values.length < 47) {
          results.sites.errors.push(`Row ${i}: Insufficient columns. Expected 47, got ${values.length}`);
          continue;
        }
        
        const siteName = values[0];
        if (!siteName) {
          results.sites.errors.push(`Row ${i}: Missing site name`);
          continue;
        }
        
        if (!siteGroups.has(siteName)) {
          siteGroups.set(siteName, {
            siteData: {
              name: siteName,
              siteCode: values[1] || `SITE-${Date.now()}`,
              region: values[2] || 'North',
              state: values[3] || '',
              address: {
                street: values[4] || '',
                city: values[5] || '',
                state: values[6] || '',
                pincode: values[7] || '',
                country: values[8] || 'India'
              },
              contactPerson: {
                name: values[9] || '',
                email: values[10] || '',
                phone: values[11] || '',
                designation: values[12] || ''
              },
              businessHours: {
                openTime: values[13] || '09:00',
                closeTime: values[14] || '18:00',
                workingDays: values[15] ? values[15].replace(/"/g, '').split(',') : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
              },
              siteType: values[16] || 'Mall',
              status: values[17] || 'Active',
              amcContract: {
                contractNumber: values[18] || `AMC-${Date.now()}`,
                contractStartDate: values[19] || new Date().toISOString().split('T')[0],
                contractEndDate: values[20] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                contractValue: parseFloat(values[21]) || 0,
                contractManager: values[22] || 'Unassigned',
                status: values[23] || 'Active',
                serviceLevel: values[24] || 'Standard'
              },
              auditoriums: [{
                audiNumber: values[25] || 'AUDI-01',
                name: values[26] || 'Main Auditorium',
                capacity: parseInt(values[27]) || 100,
                screenSize: values[28] || 'Standard',
                status: values[29] || 'Active'
              }],
              projectors: []
            },
            projectors: []
          });
        }

        // Add projector data
        const projectorData = {
          projectorNumber: values[30] || `PROJ-${Date.now()}-${i}`,
          serialNumber: values[31] || `SER-${Date.now()}-${i}`,
          model: values[32] || 'Unknown Model',
          brand: values[33] || 'Unknown Brand',
          auditoriumId: values[34] || 'AUDI-01',
          auditoriumName: values[35] || 'Main Auditorium',
          installDate: values[36] || new Date().toISOString().split('T')[0],
          warrantyEnd: values[37] || new Date(Date.now() + 3 * 365 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: values[38] || 'Active',
          condition: values[39] || 'Good',
          expectedLife: parseInt(values[40]) || 10000,
          siteName: siteName,
          siteCode: siteGroups.get(siteName).siteData.siteCode,
          amcContract: values[41] ? {
            contractNumber: values[41] || `AMC-${Date.now()}`,
            contractStartDate: values[42] || new Date().toISOString().split('T')[0],
            contractEndDate: values[43] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            contractValue: parseFloat(values[44]) || 0,
            contractManager: values[45] || 'Unassigned',
            status: values[46] || 'Active'
          } : undefined
        };

        siteGroups.get(siteName).projectors.push(projectorData);
      }
      
      // Debug: Show what we're about to process
      console.log('CSV Processing Summary:');
      for (const [siteName, data] of siteGroups) {
        console.log(`Site: "${siteName}" - ${data.projectors.length} projectors`);
        console.log('Projectors:', data.projectors.map((p: any) => p.serialNumber));
      }

      // Pre-fetch existing data once to avoid multiple API calls
      console.log('Fetching existing sites and projectors...');
      const [existingSites, existingProjectors] = await Promise.all([
        apiClient.getAllSites(),
        apiClient.getAllProjectors()
      ]);
      
      console.log(`Found ${existingSites.length} existing sites and ${existingProjectors.length} existing projectors`);
      
      // Debug: Show what sites we're trying to create
      console.log('Sites to process:', Array.from(siteGroups.keys()));
      console.log('Existing site names:', Array.from(existingSites.map((s: any) => s.name)));
      
      // Create lookup sets for faster checking
      const existingSiteNames = new Set(existingSites.map((site: any) => site.name));
      const existingProjectorSerials = new Set(existingProjectors.map((proj: any) => proj.serialNumber));
      
      // Upload sites and projectors
      let processedCount = 0;
      const totalItems = siteGroups.size;
      
      for (const [siteName, data] of siteGroups) {
        processedCount++;
        setUploadProgress(`Processing site ${processedCount}/${totalItems}: ${siteName}`);
        
        try {
          // Check if site already exists (using Set for O(1) lookup)
          if (existingSiteNames.has(siteName)) {
            console.log(`Site "${siteName}" already exists. Adding projectors to existing site.`);
            // Don't skip - we'll add projectors to the existing site
            const existingSite = existingSites.find((site: any) => site.name === siteName);
            if (!existingSite) {
              results.sites.failed++;
              results.sites.errors.push(`Site "${siteName}" exists but not found. Skipping.`);
              continue;
            }
            
            // Add projectors to existing site
            for (const projectorData of data.projectors) {
              try {
                // Check if projector already exists (using Set for O(1) lookup)
                if (existingProjectorSerials.has(projectorData.serialNumber)) {
                  results.projectors.failed++;
                  results.projectors.errors.push(`Projector ${projectorData.serialNumber}: Already exists. Skipping.`);
                  continue;
                }
                
                console.log(`Creating projector: ${projectorData.serialNumber} for existing site: ${siteName}`);
                
                // Create projector first
                const projector = await apiClient.createProjector({
                  ...projectorData,
                  siteId: existingSite._id,
                  siteName: siteName,
                  siteCode: siteGroups.get(siteName).siteData.siteCode
                });
                console.log(`Projector created successfully:`, projector);
                results.projectors.success++;
                
                // Create AMC contract if provided
                if (projectorData.amcContract) {
                  try {
                    const amcContract = await apiClient.createAMCContract({
                      contractNumber: projectorData.amcContract.contractNumber,
                      projectorSerial: projectorData.serialNumber,
                      contractStartDate: projectorData.amcContract.contractStartDate,
                      contractEndDate: projectorData.amcContract.contractEndDate,
                      contractValue: projectorData.amcContract.contractValue,
                      contractManager: projectorData.amcContract.contractManager,
                      status: projectorData.amcContract.status
                    });
                    console.log(`AMC contract created successfully:`, amcContract);
                  } catch (amcError: any) {
                    console.warn(`Failed to create AMC contract for projector ${projectorData.serialNumber}:`, amcError.message);
                  }
                }
              } catch (error: any) {
                results.projectors.failed++;
                results.projectors.errors.push(`Projector ${projectorData.serialNumber}: ${error.message}`);
              }
            }
            continue; // Skip site creation since it already exists
          }
          
          console.log(`Creating site: ${siteName}`);
          const site = await apiClient.createSite(data.siteData);
          results.sites.success++;
          
          for (const projectorData of data.projectors) {
            try {
              // Check if projector already exists (using Set for O(1) lookup)
              if (existingProjectorSerials.has(projectorData.serialNumber)) {
                results.projectors.failed++;
                results.projectors.errors.push(`Projector ${projectorData.serialNumber}: Already exists. Skipping.`);
                continue;
              }
              
                              console.log(`Creating projector: ${projectorData.serialNumber} for site: ${siteName}`);
                
                // Create projector first
                const projector = await apiClient.createProjector({
                  ...projectorData,
                  siteId: site._id,
                  siteName: siteName,
                  siteCode: siteGroups.get(siteName).siteData.siteCode
                });
                console.log(`Projector created successfully:`, projector);
                results.projectors.success++;
                
                // Create AMC contract if provided
                if (projectorData.amcContract) {
                  try {
                    const amcContract = await apiClient.createAMCContract({
                      contractNumber: projectorData.amcContract.contractNumber,
                      projectorSerial: projectorData.serialNumber,
                      contractStartDate: projectorData.amcContract.contractStartDate,
                      contractEndDate: projectorData.amcContract.contractEndDate,
                      contractValue: projectorData.amcContract.contractValue,
                      contractManager: projectorData.amcContract.contractManager,
                      status: projectorData.amcContract.status
                    });
                    console.log(`AMC contract created successfully:`, amcContract);
                  } catch (amcError: any) {
                    console.warn(`Failed to create AMC contract for projector ${projectorData.serialNumber}:`, amcError.message);
                  }
                }
            } catch (error: any) {
              results.projectors.failed++;
              results.projectors.errors.push(`Projector ${projectorData.serialNumber}: ${error.message}`);
            }
          }
          
          // Update site's projector count
          try {
            const siteProjectors = finalProjectors.filter((proj: any) => proj.site === siteName);
            console.log(`Updating site "${siteName}" with ${siteProjectors.length} projectors`);
            
            // Note: This would require a backend endpoint to update site projector counts
            // For now, we'll rely on the backend to calculate this automatically
          } catch (error: any) {
            console.warn(`Could not update projector count for site ${siteName}:`, error);
          }
        } catch (error: any) {
          results.sites.failed++;
          results.sites.errors.push(`Site ${siteName}: ${error.message}`);
        }
      }

      // Add summary information
      const totalSites = siteGroups.size;
      const totalProjectors = Array.from(siteGroups.values()).reduce((sum, data) => sum + data.projectors.length, 0);
      
      // Verify the upload by checking the created data
      console.log('Verifying upload results...');
      const [finalSites, finalProjectors] = await Promise.all([
        apiClient.getAllSites(),
        apiClient.getAllProjectors()
      ]);
      
      console.log(`Final count - Sites: ${finalSites.length}, Projectors: ${finalProjectors.length}`);
      
      // Check if our new sites have projectors
      const newSites = finalSites.filter((site: any) => 
        Array.from(siteGroups.keys()).includes(site.name)
      );
      
      for (const site of newSites) {
        const siteProjectors = finalProjectors.filter((proj: any) => proj.site === site.name);
        console.log(`Site "${site.name}" has ${siteProjectors.length} projectors:`, siteProjectors.map((p: any) => p.serialNumber));
      }
      
      setUploadStatus({
        ...results,
        summary: {
          totalSites,
          totalProjectors,
          processedSites: results.sites.success + results.sites.failed,
          processedProjectors: results.projectors.success + results.projectors.failed
        }
      });
      setShowResults(true);
      
      // Show success message if upload was successful
      if (results.sites.success > 0 || results.projectors.success > 0) {
        // Force refresh the sites page data
        try {
          console.log('Forcing refresh of sites data...');
          const refreshedSites = await apiClient.getAllSites();
          console.log('Refreshed sites data:', refreshedSites.map((site: any) => ({
            name: site.name,
            totalProjectors: site.totalProjectors,
            activeProjectors: site.activeProjectors
          })));
        } catch (error) {
          console.error('Error refreshing sites:', error);
        }
        
        alert(`Upload completed successfully!\n\nSites created: ${results.sites.success}\nProjectors created: ${results.projectors.success}\n\nNext steps:\n1. Click "Check Database" button to verify data\n2. Go to Sites page and click "Refresh" button\n3. Check browser console for detailed logs\n\nIf counts are still 0, the issue is in the backend calculation.`);
      }
    } catch (error: any) {
      console.error('CSV upload error:', error);
      alert('Error processing CSV data. Please check the format.');
    } finally {
      setIsLoading(false);
      setUploadProgress('');
    }
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
        console.log('CSV file loaded:', file.name, 'Size:', file.size, 'Content length:', content.length);
      };
      reader.onerror = () => {
        alert('Error reading CSV file');
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file (.csv extension)');
    }
  };

  const handleJsonFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json'))) {
      setJsonFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonData(content);
        console.log('JSON file loaded:', file.name, 'Size:', file.size, 'Content length:', content.length);
      };
      reader.onerror = () => {
        alert('Error reading JSON file');
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid JSON file (.json extension)');
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
        console.log('CSV file dropped:', file.name, 'Size:', file.size, 'Content length:', content.length);
      };
      reader.onerror = () => {
        alert('Error reading CSV file');
      };
      reader.readAsText(file);
    } else {
      alert('Please drop a valid CSV file (.csv extension)');
    }
  };

  const handleJsonFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json'))) {
      setJsonFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonData(content);
        console.log('JSON file dropped:', file.name, 'Size:', file.size, 'Content length:', content.length);
      };
      reader.onerror = () => {
        alert('Error reading JSON file');
      };
      reader.readAsText(file);
    } else {
      alert('Please drop a valid JSON file (.json extension)');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Function to parse CSV line with proper handling of quoted values
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  return (
    <div className="p-8 bg-dark-bg min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark-primary mb-2">Bulk Upload Sites & Projectors</h1>
          <p className="text-dark-secondary">Upload multiple sites and their projectors at once using JSON or CSV format</p>
        </div>

        {/* Upload Type Selection */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-dark-primary">Upload Format</CardTitle>
            <CardDescription className="text-dark-secondary">Choose your preferred upload format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  setUploadType('json');
                  clearUploadData();
                }}
                className={`flex-1 ${uploadType === 'json' ? 'dark-button-primary' : 'dark-button-secondary'}`}
              >
                <FileText className="w-4 h-4 mr-2" />
                JSON Format
              </Button>
              <Button
                onClick={() => {
                  setUploadType('csv');
                  clearUploadData();
                }}
                className={`flex-1 ${uploadType === 'csv' ? 'dark-button-primary' : 'dark-button-secondary'}`}
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV Format
              </Button>
            </div>
          </CardContent>
        </Card>



        {/* Upload Area */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-dark-primary">Upload Data</CardTitle>
                      <CardDescription className="text-dark-secondary">
            {uploadType === 'json' 
              ? 'Paste your JSON data below (should include sites array with nested projectors and AMC contracts)'
              : 'Upload a CSV file or paste CSV data below (one row per projector, grouped by site). CSV should have 47 columns including site details, site AMC contracts, auditorium info, projector data, and projector AMC contracts.'
            }
          </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadType === 'csv' && (
                <div className="space-y-4">
                  {/* File Upload Area */}
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors"
                  >
                    <FileUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-dark-primary mb-2">Upload CSV File</h3>
                    <p className="text-dark-secondary mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="dark-button-secondary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose CSV File
                    </Button>
                    {csvFile && (
                      <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded-lg">
                        <p className="text-green-400 text-sm">
                          ✅ File loaded: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                                    {/* Action Buttons - Moved here for better visibility */}
                  {uploadType === 'csv' && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h4 className="text-lg font-semibold text-dark-primary mb-4">Upload Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={handleCsvUpload}
                          disabled={isLoading || !csvData.trim()}
                          className={`${isLoading || !csvData.trim() 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'} px-6 py-3 rounded-lg font-semibold transition-colors border-2 border-blue-500`}
                          style={{ minWidth: '150px', fontSize: '16px' }}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {isLoading ? 'Uploading...' : 'Upload Data'}
                        </Button>
                        
                        <Button
                          onClick={() => {
                            const csvTemplate = `Site Name,Site Code,Region,State,Street,City,State,Pincode,Country,Contact Name,Contact Email,Contact Phone,Contact Designation,Open Time,Close Time,Working Days,Site Type,Status,Site AMC Contract Number,Site AMC Start Date,Site AMC End Date,Site AMC Value,Site AMC Manager,Site AMC Status,Site AMC Service Level,Auditorium Number,Auditorium Name,Auditorium Capacity,Screen Size,Auditorium Status,Projector Number,Serial Number,Model,Brand,Auditorium ID,Auditorium Name,Install Date,Warranty End,Status,Condition,Expected Life,Projector AMC Contract Number,Projector AMC Start Date,Projector AMC End Date,Projector AMC Value,Projector AMC Manager,Projector AMC Status
Example Mall,SM001,North,Delhi,123 Main St,New Delhi,Delhi,110001,India,John Doe,john@example.com,+91-9876543210,Manager,09:00,18:00,"Monday,Tuesday,Wednesday,Thursday,Friday",Mall,Active,AMC-SITE-001,2024-01-01,2025-01-01,50000,John Manager,Active,Standard,AUDI-01,Main Hall,100,Standard,Active,PROJ001,SER001,Epson EB-2250U,Epson,AUDI-01,Main Hall,2024-01-01,2027-01-01,Active,Good,10000,AMC-PROJ-001,2024-01-01,2025-01-01,10000,AMC Manager,Active`;
                            const blob = new Blob([csvTemplate], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'bulk_upload_template.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                          variant="outline"
                          className="dark-button-secondary"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download CSV Template
                        </Button>
                        
                        <Button
                          onClick={clearUploadData}
                          variant="outline"
                          className="dark-button-secondary"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Clear Data
                        </Button>
                        
                        {isLoading && uploadProgress && (
                          <div className="w-full mt-3 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
                            <div className="text-blue-400 text-sm font-medium">{uploadProgress}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <span className="text-dark-secondary">OR</span>
                  </div>
                  
                  {/* CSV Structure Info */}
                  <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">CSV Structure (47 columns)</h4>
                    <div className="text-sm text-blue-200 space-y-1">
                      <p><strong>Columns 1-24:</strong> Site Information (Name, Code, Region, State, Address, Contact, Business Hours, Type, Status)</p>
                      <p><strong>Columns 25-29:</strong> Site AMC Contract (Contract Number, Start/End Dates, Value, Manager, Status, Service Level)</p>
                      <p><strong>Columns 30-40:</strong> Auditorium & Projector Information (Auditorium Details, Projector Number, Serial, Model, Brand, Dates, Status, Condition, Life)</p>
                      <p><strong>Columns 41-47:</strong> Projector AMC Contract (Contract Number, Start/End Dates, Value, Manager, Status)</p>
                      <p className="text-xs mt-2">💡 <strong>Tip:</strong> Download the CSV template above to see the exact format. Each row represents one projector, and sites are automatically grouped.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {uploadType === 'json' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-dark-primary">JSON Data</h4>
                    <Button
                      onClick={() => {
                        const jsonTemplate = {
                          sites: [
                            {
                              name: "Example Mall",
                              siteCode: "SM001",
                              region: "North",
                              state: "Delhi",
                              address: {
                                street: "123 Main Street",
                                city: "New Delhi",
                                state: "Delhi",
                                pincode: "110001",
                                country: "India"
                              },
                              contactPerson: {
                                name: "John Doe",
                                email: "john@example.com",
                                phone: "+91-9876543210",
                                designation: "Manager"
                              },
                              businessHours: {
                                openTime: "09:00",
                                closeTime: "18:00",
                                workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                              },
                              siteType: "Mall",
                              status: "Active",
                              amcContract: {
                                contractNumber: "AMC-SITE-001",
                                contractStartDate: "2024-01-01",
                                contractEndDate: "2025-01-01",
                                contractValue: 50000,
                                contractManager: "John Manager",
                                status: "Active",
                                serviceLevel: "Standard"
                              },
                              auditoriums: [
                                {
                                  audiNumber: "AUDI-01",
                                  name: "Main Auditorium",
                                  capacity: 100,
                                  screenSize: "Standard",
                                  status: "Active"
                                }
                              ],
                              projectors: [
                                {
                                  projectorNumber: "PROJ001",
                                  serialNumber: "SER001",
                                  model: "Epson EB-2250U",
                                  brand: "Epson",
                                  auditoriumId: "AUDI-01",
                                  auditoriumName: "Main Auditorium",
                                  installDate: "2024-01-01",
                                  warrantyEnd: "2027-01-01",
                                  status: "Active",
                                  condition: "Good",
                                  expectedLife: 10000,
                                  amcContract: {
                                    contractNumber: "AMC001",
                                    contractStartDate: "2024-01-01",
                                    contractEndDate: "2025-01-01",
                                    contractValue: 10000,
                                    contractManager: "AMC Manager",
                                    status: "Active"
                                  }
                                }
                              ]
                            }
                          ]
                        };
                        const jsonString = JSON.stringify(jsonTemplate, null, 2);
                        const blob = new Blob([jsonString], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'bulk_upload_template.json';
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      variant="outline"
                      className="dark-button-secondary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON Template
                    </Button>
                  </div>
                  
                  {/* JSON File Upload Area */}
                  <div
                    onDrop={handleJsonFileDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors"
                  >
                    <FileUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-dark-primary mb-2">Upload JSON File</h3>
                    <p className="text-dark-secondary mb-4">
                      Drag and drop your JSON file here, or click to browse
                    </p>
                    <input
                      ref={jsonFileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => jsonFileInputRef.current?.click()}
                      className="dark-button-secondary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose JSON File
                    </Button>
                    {jsonFile && (
                      <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded-lg">
                        <p className="text-green-400 text-sm">
                          ✅ File loaded: {jsonFile.name} ({(jsonFile.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-green-400 text-sm mt-1">
                          📊 Data loaded: {jsonData.length} characters
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <span className="text-dark-secondary">OR</span>
                  </div>
                  
                  <Textarea
                    placeholder="Paste JSON data here..."
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  
                  {/* Action Buttons for JSON */}
                  {uploadType === 'json' && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h4 className="text-lg font-semibold text-dark-primary mb-4">Upload Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={handleJsonUpload}
                          disabled={isLoading || !jsonData.trim()}
                          className={`${isLoading || !jsonData.trim() 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'} px-6 py-3 rounded-lg font-semibold transition-colors border-2 border-blue-500`}
                          style={{ minWidth: '150px', fontSize: '16px' }}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {isLoading ? 'Uploading...' : 'Upload Data'}
                        </Button>
                        
                        <Button
                          onClick={clearUploadData}
                          variant="outline"
                          className="dark-button-secondary"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Clear Data
                        </Button>
                        
                        {isLoading && uploadProgress && (
                          <div className="w-full mt-3 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
                            <div className="text-blue-400 text-sm font-medium">{uploadProgress}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {uploadType === 'csv' && (
                <Textarea
                  placeholder="Paste CSV data here..."
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
              
                              {/* Data Status Indicator */}
                {uploadType === 'csv' && (
                  <div className="flex items-center space-x-2 text-sm mt-4">
                    {csvData.trim() ? (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>CSV data loaded ({csvData.split('\n').length} lines)</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>No CSV data loaded</span>
                      </div>
                    )}
                  </div>
                )}
                
                {uploadType === 'json' && (
                  <div className="flex items-center space-x-2 text-sm mt-4">
                    {jsonData.trim() ? (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {jsonFile ? `JSON file loaded: ${jsonFile.name} (${(jsonFile.size / 1024).toFixed(1)} KB)` : `JSON data loaded (${jsonData.length} characters)`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>No JSON data loaded</span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {showResults && (
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-dark-primary">Upload Results</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              {uploadStatus.summary && (
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-lg font-semibold text-dark-primary mb-3">Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-dark-secondary">Total Sites:</span>
                      <div className="text-dark-primary font-semibold">{uploadStatus.summary.totalSites}</div>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Total Projectors:</span>
                      <div className="text-dark-primary font-semibold">{uploadStatus.summary.totalProjectors}</div>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Processed Sites:</span>
                      <div className="text-dark-primary font-semibold">{uploadStatus.summary.processedSites}</div>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Processed Projectors:</span>
                      <div className="text-dark-primary font-semibold">{uploadStatus.summary.processedProjectors}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sites Results */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-dark-primary">Sites</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-dark-secondary">Successfully uploaded: {uploadStatus.sites.success}</span>
                    </div>
                    {uploadStatus.sites.failed > 0 && (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-dark-secondary">Failed: {uploadStatus.sites.failed}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Projectors Results */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-dark-primary">Projectors</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-dark-secondary">Successfully uploaded: {uploadStatus.projectors.success}</span>
                    </div>
                    {uploadStatus.projectors.failed > 0 && (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-dark-secondary">Failed: {uploadStatus.projectors.failed}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {(uploadStatus.sites.errors.length > 0 || uploadStatus.projectors.errors.length > 0) && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-dark-primary mb-3">Error Details</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadStatus.sites.errors.map((error, index) => (
                      <div key={`site-${index}`} className="text-red-400 text-sm">
                        {error}
                      </div>
                    ))}
                    {uploadStatus.projectors.errors.map((error, index) => (
                      <div key={`projector-${index}`} className="text-red-400 text-sm">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 