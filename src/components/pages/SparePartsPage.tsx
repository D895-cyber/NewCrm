import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { 
  Package, 
  Plus, 
  Search, 
  Download,
  Edit,
  Trash2,
  Eye,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Box,
  Tag,
  Calendar,
  MapPin,
  Monitor,
  Loader2,
  RefreshCw,
  X,
  Upload,
  FileText
} from "lucide-react";
import { apiClient } from "../../utils/api/client";
import { convertToCSV, downloadCSV, generateLabel, printLabel } from "../../utils/export";

export function SparePartsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState<string>("");
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([]);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'paste' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [problemRows, setProblemRows] = useState<{row: number, content: string, expected: number, actual: number}[]>([]);
  const [showProblemRows, setShowProblemRows] = useState(false);
  const [newPart, setNewPart] = useState({
    partNumber: "",
    partName: "",
    category: "Spare Parts",
    brand: "",
    projectorModel: "",
    stockQuantity: 0,
    reorderLevel: 5,
    unitPrice: 0,
    supplier: "",
    location: "",
    description: ""
  });

  useEffect(() => {
    loadSpareParts();
  }, []);

  const loadSpareParts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const parts = await apiClient.getAllSpareParts();
      setSpareParts(parts);
      console.log('Loaded spare parts:', parts.length);
    } catch (err: any) {
      console.error('Error loading spare parts:', err);
      setError('Failed to load spare parts data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPart = async () => {
    try {
      setIsLoading(true);
      await apiClient.createSparePart(newPart);
      setShowAddModal(false);
      setNewPart({
        partNumber: "",
        partName: "",
        category: "Spare Parts",
        brand: "",
        projectorModel: "",
        stockQuantity: 0,
        reorderLevel: 5,
        unitPrice: 0,
        supplier: "",
        location: "",
        description: ""
      });
      await loadSpareParts(); // Reload the list
      
  
      (window as any).showToast?.({
        type: 'success',
        title: 'Part Added Successfully',
        message: `${newPart.partName} has been added to inventory`
      });
    } catch (err: any) {
      console.error('Error adding part:', err);
      setError('Failed to add new part.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      setIsLoading(true);
      setBulkUploadError(null);
      
      // Parse CSV data
      const lines = bulkUploadData.trim().split('\n');
      if (lines.length < 2) {
        setBulkUploadError('CSV must have at least a header row and one data row');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const expectedHeaders = ['partNumber', 'partName', 'category', 'projectorModel'];
      
      // Validate headers (case-insensitive and handle quotes)
      const normalizedHeaders = headers.map(h => h.toLowerCase());
      const normalizedExpected = expectedHeaders.map(h => h.toLowerCase());
      
      if (!normalizedExpected.every(h => normalizedHeaders.includes(h))) {
        setBulkUploadError(`CSV must have these exact headers: ${expectedHeaders.join(', ')}. Found: ${headers.join(', ')}`);
        return;
      }
      
      // Parse data rows
      const parts = lines.slice(1).map((line, index) => {
        // Handle CSV with quoted values
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length !== headers.length) {
          throw new Error(`Row ${index + 2} has ${values.length} columns, expected ${headers.length}`);
        }
        
        // Map category to valid enum values
        const categoryMapping: { [key: string]: string } = {
          'TEST': 'Spare Parts',
          'Lamps': 'Spare Parts',
          'Filters': 'Spare Parts',
          'Boards': 'Spare Parts',
          'Cables': 'Spare Parts',
          'Other': 'Spare Parts',
          'RMA': 'RMA'
        };
        
        const csvCategory = values[headers.indexOf('category')];
        const mappedCategory = categoryMapping[csvCategory] || 'Spare Parts';
        
        // Create part object with all required fields explicitly set
        const part: any = {
          // CSV fields
          partNumber: values[headers.indexOf('partNumber')],
          partName: values[headers.indexOf('partName')],
          category: mappedCategory, // Use mapped category
          projectorModel: values[headers.indexOf('projectorModel')],
          
          // Required default fields
          stockQuantity: 0,
          reorderLevel: 5,
          unitPrice: 1,
          status: 'In Stock',
          brand: 'Christie',
          supplier: 'TBD',
          location: 'Warehouse',
          description: ''
        };
        
        // Verify all required fields are present
        const requiredFields = ['partNumber', 'partName', 'category', 'projectorModel', 'brand', 'unitPrice', 'supplier', 'location'];
        const missingFields = requiredFields.filter(field => !part[field]);
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          console.error('Part object:', part);
        }
        
        // Log the complete part object to verify all fields are present
        console.log('Complete part object before API call:', JSON.stringify(part, null, 2));
        
        // Explicitly check each required field
        console.log('Field check - brand:', part.brand);
        console.log('Field check - unitPrice:', part.unitPrice);
        console.log('Field check - supplier:', part.supplier);
        console.log('Field check - location:', part.location);
        
        return part;
      });
      
      // Check for duplicate part numbers in the CSV
      const partNumbers = parts.map(p => p.partNumber);
      const duplicatePartNumbers = partNumbers.filter((item, index) => partNumbers.indexOf(item) !== index);
      if (duplicatePartNumbers.length > 0) {
        const uniqueDuplicates = [...new Set(duplicatePartNumbers)];
        console.warn('Duplicate part numbers found in CSV:', uniqueDuplicates);
      }
      
      // Check for existing part numbers in database
      try {
        const existingParts = await apiClient.getAllSpareParts();
        const existingPartNumbers = existingParts.map(p => p.partNumber);
        const conflictingPartNumbers = partNumbers.filter(pn => existingPartNumbers.includes(pn));
        if (conflictingPartNumbers.length > 0) {
          console.warn('Part numbers already exist in database:', conflictingPartNumbers);
        }
      } catch (error) {
        console.warn('Could not check existing part numbers:', error);
      }
      
      // Debug: Check first part structure
      if (parts.length > 0) {
        console.log('First part structure:', parts[0]);
        console.log('First part keys:', Object.keys(parts[0]));
      }
      
      // Create all parts
      const createdParts = [];
      const failedParts = [];
      
      console.log('Starting bulk upload with', parts.length, 'parts');
      console.log('First few parts:', parts.slice(0, 3));
      
      for (const part of parts) {
        try {
          console.log('Creating part:', part.partNumber, part.partName);
          const created = await apiClient.createSparePart(part);
          createdParts.push(created);
          console.log('Successfully created:', part.partNumber);
        } catch (error: any) {
          console.error(`Failed to create part ${part.partNumber}:`, error);
          console.error('Part data that failed:', part);
          failedParts.push({
            partNumber: part.partNumber,
            error: error.message || 'Unknown error',
            details: error.response?.data || error.data || 'No additional details'
          });
          // Continue with other parts
        }
      }
      
      console.log('Bulk upload completed. Created:', createdParts.length, 'Failed:', failedParts.length);
      if (failedParts.length > 0) {
        console.log('Failed parts:', failedParts.slice(0, 5)); // Show first 5 failures
      }
      
      setShowBulkUploadModal(false);
      setBulkUploadData("");
      setBulkUploadPreview([]);
      await loadSpareParts();
      
      if (createdParts.length === 0 && failedParts.length > 0) {
        // Show error if no parts were created
        (window as any).showToast?.({
          type: 'error',
          title: 'Bulk Upload Failed',
          message: `Failed to add any spare parts. Check console for details.`
        });
      } else if (failedParts.length > 0) {
        // Show partial success
        (window as any).showToast?.({
          type: 'warning',
          title: 'Bulk Upload Partial Success',
          message: `Successfully added ${createdParts.length} out of ${parts.length} spare parts. ${failedParts.length} failed.`
        });
      } else {
        // Show full success
        (window as any).showToast?.({
          type: 'success',
          title: 'Bulk Upload Successful',
          message: `Successfully added ${createdParts.length} out of ${parts.length} spare parts`
        });
      }
      
    } catch (err: any) {
      console.error('Error in bulk upload:', err);
      setBulkUploadError(err.message || 'Failed to process bulk upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
      setSelectedFile(file);
      setBulkUploadError(null);
      setIsFileUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('File content length:', content.length);
        setBulkUploadData(content);
        // Process the content immediately since we have it
        processCSVContent(content);
        setIsFileUploading(false);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setBulkUploadError('Error reading file. Please try again.');
        setIsFileUploading(false);
      };
      reader.readAsText(file);
    }
  };

  const processCSVContent = (content: string) => {
    try {
      setBulkUploadError(null);
      
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        setBulkUploadError('CSV must have at least a header row and one data row');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const expectedHeaders = ['partNumber', 'partName', 'category', 'projectorModel'];
      
      // Validate headers (case-insensitive and handle quotes)
      const normalizedHeaders = headers.map(h => h.toLowerCase());
      const normalizedExpected = expectedHeaders.map(h => h.toLowerCase());
      
      if (!normalizedExpected.every(h => normalizedHeaders.includes(h))) {
        setBulkUploadError(`CSV must have these exact headers: ${expectedHeaders.join(', ')}. Found: ${headers.join(', ')}`);
        return;
      }
      
      // Check for rows with incorrect number of columns
      const invalidRows: number[] = [];
      lines.slice(1).forEach((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length !== headers.length) {
          invalidRows.push(index + 2); // +2 because we start from row 2 (after header) and want 1-based row numbers
        }
      });
      
      if (invalidRows.length > 0) {
        const rowList = invalidRows.slice(0, 5).join(', '); // Show first 5 invalid rows
        const moreText = invalidRows.length > 5 ? ` and ${invalidRows.length - 5} more` : '';
        setBulkUploadError(`Rows ${rowList}${moreText} have incorrect number of columns. Expected ${headers.length}, found different. Click "Show Problem Rows" to see details.`);
        
        // Store problem rows for detailed view
        const problemRowsData = invalidRows.map(rowNum => {
          const lineIndex = rowNum - 2; // Convert back to 0-based index
          const line = lines[lineIndex + 1]; // +1 because we skipped header
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          return {
            row: rowNum,
            content: line,
            expected: headers.length,
            actual: values.length
          };
        });
        setProblemRows(problemRowsData);
        return;
      }
      
      const preview = lines.slice(1, 6).map((line, index) => {
        // Handle CSV with quoted values
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const part: any = {};
        headers.forEach((header, i) => {
          part[header] = values[i];
        });
        return part;
      });
      
      setBulkUploadPreview(preview);
      
    } catch (err: any) {
      setBulkUploadError(err.message || 'Failed to process CSV data');
    }
  };

  const handleBulkUploadPreview = () => {
    processCSVContent(bulkUploadData);
  };

  const handleExportInventory = async () => {
    try {
      setIsLoading(true);
      const csvContent = convertToCSV(spareParts, [
        'partNumber', 'partName', 'category', 'brand', 'projectorModel', 'stockQuantity', 'unitPrice', 'status'
      ]);
      downloadCSV(csvContent, `spare_parts_inventory_${new Date().toISOString().split('T')[0]}.csv`);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Export Successful',
        message: 'Spare parts inventory exported to CSV file'
      });
    } catch (err: any) {
      console.error('Error exporting inventory:', err);
      setError('Failed to export inventory: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };



  const handlePrintLabel = async (partId: string) => {
    try {
      const part = spareParts.find(p => p._id === partId);
      if (!part) {
        setError('Part not found');
        return;
      }
      
      const labelContent = generateLabel(part, 'part');
      printLabel(labelContent);
      
      (window as any).showToast?.({
        type: 'success',
        title: 'Label Printed',
        message: `Part label for ${part.partNumber} sent to printer`
      });
    } catch (err: any) {
      console.error('Error printing label:', err);
      setError('Failed to print label: ' + err.message);
    }
  };

  const filteredParts = spareParts.filter(part => {
    // Only show spare parts, not RMA items
    if (part.category === "RMA") {
      return false;
    }
    
    const matchesSearch = (part.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.brand?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false;
    const matchesCategory = filterCategory === "All" || part.category === filterCategory;
    const matchesStatus = filterStatus === "All" || part.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-600";
      case "Low Stock":
        return "bg-orange-600";
      case "Out of Stock":
        return "bg-red-600";
      case "On Order":
        return "bg-blue-600";
      case "Discontinued":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Spare Parts":
        return "bg-blue-600";
      case "Lamps":
        return "bg-yellow-600";
      case "Filters":
        return "bg-green-600";
      case "Boards":
        return "bg-purple-600";
      case "Cables":
        return "bg-orange-600";
      case "Other":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Stock":
        return <CheckCircle className="w-4 h-4" />;
      case "Low Stock":
        return <AlertTriangle className="w-4 h-4" />;
      case "Out of Stock":
        return <AlertTriangle className="w-4 h-4" />;
      case "On Order":
        return <Clock className="w-4 h-4" />;
      case "Discontinued":
        return <X className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const updatePartStock = async (partId: string, stockQuantity: number) => {
    try {
      await apiClient.updateSparePartStock(partId, stockQuantity);
      await loadSpareParts(); // Reload data
      console.log('Part stock updated successfully');
    } catch (err: any) {
      console.error('Error updating part stock:', err);
      setError('Failed to update part stock.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Spare Parts Inventory</h1>
            <p className="text-sm text-dark-secondary mt-1">Manage spare parts inventory, stock levels, suppliers, and reorder alerts</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={loadSpareParts}
              className="dark-button-secondary gap-2 flex items-center"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button 
              onClick={() => setShowBulkUploadModal(true)}
              className="dark-button-secondary gap-2 flex items-center"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </button>
            <button 
              onClick={handleExportInventory}
              disabled={isLoading}
              className="dark-button-secondary gap-2 flex items-center"
            >
              <Download className="w-4 h-4" />
              Export Inventory
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Add Part
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary w-4 h-4" />
            <Input
              placeholder="Search parts, numbers, or brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-card border-dark-color text-dark-primary"
            />
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-dark-card border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
          >
            <option value="All">All Categories</option>
            <option value="Spare Parts">Spare Parts</option>
            <option value="Lamps">Lamps</option>
            <option value="Filters">Filters</option>
            <option value="Boards">Boards</option>
            <option value="Cables">Cables</option>
            <option value="Other">Other</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-dark-card border border-dark-color rounded-xl text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
          >
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="On Order">On Order</option>
            <option value="Discontinued">Discontinued</option>
          </select>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-dark-secondary">MongoDB + Express.js</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="dark-card text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-primary mb-1">{spareParts.length}</h3>
            <p className="text-sm text-dark-secondary">Total Parts</p>
          </div>
          
          <div className="dark-card text-center">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-primary mb-1">
              {spareParts.filter(p => p.status === "In Stock").length}
            </h3>
            <p className="text-sm text-dark-secondary">In Stock</p>
          </div>
          
          <div className="dark-card text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-primary mb-1">
              {spareParts.filter(p => p.status === "Low Stock").length}
            </h3>
            <p className="text-sm text-dark-secondary">Low Stock</p>
          </div>
          
          <div className="dark-card text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-primary mb-1">
              {spareParts.filter(p => p.status === "Low Stock").length}
            </h3>
            <p className="text-sm text-dark-secondary">Low Stock Alerts</p>
          </div>
          
          <div className="dark-card text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-600 flex items-center justify-center mx-auto mb-4">
              <Box className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-primary mb-1">
              {spareParts.reduce((total, part) => total + (part.stockQuantity || 0), 0)}
            </h3>
            <p className="text-sm text-dark-secondary">Total Stock</p>
          </div>
        </div>

        {/* Parts Table */}
        <div className="dark-card">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-dark-secondary mx-auto mb-4 animate-spin" />
              <p className="text-dark-secondary">Loading spare parts...</p>
            </div>
          ) : filteredParts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-color">
                    <th className="text-left font-semibold text-dark-primary pb-4">Part Details</th>
                    <th className="text-left font-semibold text-dark-primary pb-4">Brand & Model</th>
                    <th className="text-center font-semibold text-dark-primary pb-4">Category</th>
                    <th className="text-center font-semibold text-dark-primary pb-4">Stock</th>
                    <th className="text-center font-semibold text-dark-primary pb-4">Status</th>
                    <th className="text-right font-semibold text-dark-primary pb-4">Price</th>
                    <th className="text-center font-semibold text-dark-primary pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part, index) => (
                    <tr key={part._id} className="border-b border-dark-color hover:bg-dark-table-hover transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="text-sm font-semibold text-dark-primary">{part.partName}</p>
                          <p className="text-xs text-dark-secondary flex items-center gap-1 mt-1">
                            <Tag className="w-3 h-3" />
                            {part.partNumber}
                          </p>
                          <p className="text-xs text-dark-secondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Updated: {formatDate(part.updatedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm font-medium text-dark-primary">{part.brand}</p>
                          <p className="text-xs text-dark-secondary flex items-center gap-1 mt-1">
                            <Monitor className="w-3 h-3" />
                            {part.projectorModel}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className={`dark-tag ${getCategoryColor(part.category)} flex items-center gap-1 justify-center`}>
                          {part.category === "RMA" ? <RotateCcw className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          {part.category}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div>
                          <span className="text-sm font-semibold text-dark-primary">{part.stockQuantity || 0}</span>
                          <p className="text-xs text-dark-secondary">Min: {part.reorderLevel || 0}</p>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className={`dark-tag ${getStatusColor(part.status)} flex items-center gap-1 justify-center`}>
                          {getStatusIcon(part.status)}
                          {part.status}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-semibold text-dark-primary">
                          ₹{(part.unitPrice || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                            onClick={() => setSelectedPart(part)}
                          >
                            <Eye className="w-4 h-4 text-dark-secondary" />
                          </button>
                          <button className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-dark-secondary" />
                          </button>
                          {part.category === "RMA" && (
                            <button className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
                              <RotateCcw className="w-4 h-4 text-blue-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-dark-secondary mx-auto mb-4" />
              <h3 className="text-xl font-medium text-dark-primary mb-2">No Parts Found</h3>
              <p className="text-dark-secondary">
                {searchTerm || filterCategory !== "All" || filterStatus !== "All" 
                  ? "No parts match your current filters." 
                  : "No spare parts have been added to the system yet."}
              </p>
            </div>
          )}
        </div>

        {/* Part Detail Modal */}
        {selectedPart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-primary">Part Details</h2>
                <button 
                  onClick={() => setSelectedPart(null)}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-dark-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Part Name</label>
                        <p className="text-dark-primary font-semibold">{selectedPart.partName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Part Number</label>
                        <p className="text-dark-primary">{selectedPart.partNumber}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-dark-secondary">Brand</label>
                          <p className="text-dark-primary">{selectedPart.brand}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-dark-secondary">Model</label>
                          <p className="text-dark-primary">{selectedPart.projectorModel}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Category</label>
                        <div className={`dark-tag ${getCategoryColor(selectedPart.category)} inline-flex items-center gap-1 mt-1`}>
                          {selectedPart.category === "RMA" ? <RotateCcw className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          {selectedPart.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Stock Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Current Stock</label>
                        <p className="text-dark-primary font-semibold text-xl">{selectedPart.stockQuantity || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Reorder Level</label>
                        <p className="text-dark-primary font-semibold text-xl">{selectedPart.reorderLevel || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Unit Price</label>
                        <p className="text-dark-primary font-semibold">₹{(selectedPart.unitPrice || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Status</label>
                        <div className={`dark-tag ${getStatusColor(selectedPart.status)} inline-flex items-center gap-1 mt-1`}>
                          {getStatusIcon(selectedPart.status)}
                          {selectedPart.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-primary mb-4">Additional Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Supplier</label>
                        <p className="text-dark-primary">{selectedPart.supplier || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Location</label>
                        <p className="text-dark-primary flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-dark-secondary" />
                          {selectedPart.location || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Last Updated</label>
                        <p className="text-dark-primary flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-dark-secondary" />
                          {formatDate(selectedPart.updatedAt)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-secondary">Description</label>
                        <p className="text-dark-primary">{selectedPart.description || 'No description available'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 mt-6 border-t border-dark-color">
                <button 
                  className="flex-1 dark-button-secondary"
                  onClick={() => {
                    const newStock = prompt('Enter new stock quantity:', selectedPart.stockQuantity?.toString() || '0');
                    if (newStock && !isNaN(Number(newStock))) {
                      updatePartStock(selectedPart._id, Number(newStock));
                      setSelectedPart(null);
                    }
                  }}
                >
                  Update Stock
                </button>
                {selectedPart.category === "RMA" && (
                  <button className="flex-1 dark-button-primary">Process RMA</button>
                )}
                {selectedPart.status === "Low Stock" && (
                  <button className="flex-1 dark-button-primary">Reorder Stock</button>
                )}
                <button 
                  onClick={() => handlePrintLabel(selectedPart._id)}
                  className="dark-button-secondary px-6"
                >
                  Print Label
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Add New Part</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Part Number *</label>
                  <Input
                    value={newPart.partNumber}
                    onChange={(e) => setNewPart({...newPart, partNumber: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter part number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Part Name *</label>
                  <Input
                    value={newPart.partName}
                    onChange={(e) => setNewPart({...newPart, partName: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter part name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Brand *</label>
                  <Input
                    value={newPart.brand}
                    onChange={(e) => setNewPart({...newPart, brand: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter brand"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Projector Model *</label>
                  <Input
                    value={newPart.projectorModel}
                    onChange={(e) => setNewPart({...newPart, projectorModel: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter projector model"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Stock Quantity</label>
                  <Input
                    type="number"
                    value={newPart.stockQuantity}
                    onChange={(e) => setNewPart({...newPart, stockQuantity: Number(e.target.value)})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Reorder Level</label>
                  <Input
                    type="number"
                    value={newPart.reorderLevel}
                    onChange={(e) => setNewPart({...newPart, reorderLevel: Number(e.target.value)})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Unit Price (₹)</label>
                  <Input
                    type="number"
                    value={newPart.unitPrice}
                    onChange={(e) => setNewPart({...newPart, unitPrice: Number(e.target.value)})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Category</label>
                  <select
                    value={newPart.category}
                    onChange={(e) => setNewPart({...newPart, category: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  >
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="RMA">RMA Items</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-secondary">Supplier</label>
                  <Input
                    value={newPart.supplier}
                    onChange={(e) => setNewPart({...newPart, supplier: e.target.value})}
                    className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                    placeholder="Enter supplier"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Location</label>
                <Input
                  value={newPart.location}
                  onChange={(e) => setNewPart({...newPart, location: e.target.value})}
                  className="mt-1 bg-dark-card border-dark-color text-dark-primary"
                  placeholder="Enter storage location"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark-secondary">Description</label>
                <textarea
                  value={newPart.description}
                  onChange={(e) => setNewPart({...newPart, description: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-dark-card border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta"
                  rows={3}
                  placeholder="Enter part description"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-dark-color">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 dark-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddPart}
                disabled={isLoading || !newPart.partNumber || !newPart.partName || !newPart.brand || !newPart.projectorModel}
                className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Part'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-color rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Bulk Upload Spare Parts</h2>
              <button 
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setBulkUploadData("");
                                    setBulkUploadPreview([]);
                  setBulkUploadError(null);
                  setSelectedFile(null);
                  setUploadMethod('file');
                  setIsFileUploading(false);
                  setProblemRows([]);
                  setShowProblemRows(false);
                }}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-400">CSV Format Instructions</h3>

                </div>
                <p className="text-blue-300 text-sm mb-2">
                  Upload a CSV file with exactly 4 columns for reference purposes:
                </p>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li><strong>partNumber:</strong> Manufacturer part number (e.g., LMP-001)</li>
                  <li><strong>partName:</strong> Name of the spare part (e.g., Lamp Module)</li>
                  <li><strong>category:</strong> Category (e.g., Lamps, Filters, Boards, Cables, Other)</li>
                  <li><strong>projectorModel:</strong> Compatible projector model (e.g., CP2220, CP2230, CP4220, CP4230, CP2215, CP4425-RGB)</li>
                </ul>
                <div className="mt-3 p-2 bg-dark-bg rounded border border-blue-600">
                  <p className="text-blue-300 text-xs font-mono">
                    partNumber,partName,category,projectorModel<br/>
                    LMP-001,Lamp Module,Lamps,CP2220<br/>
                    FLT-002,Air Filter,Filters,CP2230<br/>
                    BRD-003,Main Board,Boards,CP4220
                  </p>
                </div>
              </div>

              {/* Upload Method Toggle */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    uploadMethod === 'file'
                      ? 'bg-dark-cta border-dark-cta text-white'
                      : 'bg-dark-bg border-dark-color text-dark-secondary hover:text-dark-primary'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload File
                </button>
                <button
                  onClick={() => setUploadMethod('paste')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    uploadMethod === 'paste'
                      ? 'bg-dark-cta border-dark-cta text-white'
                      : 'bg-dark-bg border-dark-color text-dark-secondary hover:text-dark-primary'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Paste Data
                </button>
              </div>

              {/* File Upload */}
              {uploadMethod === 'file' && (
                <div>
                  <label className="text-sm font-medium text-dark-secondary mb-2 block">
                    Upload CSV File
                  </label>
                  <div className="border-2 border-dashed border-dark-color rounded-lg p-6 text-center hover:border-dark-cta transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-file-upload"
                      disabled={isFileUploading}
                    />
                    <label htmlFor="csv-file-upload" className={`cursor-pointer ${isFileUploading ? 'opacity-50' : ''}`}>
                      {isFileUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 mx-auto mb-2 text-dark-secondary animate-spin" />
                          <p className="text-dark-secondary mb-1">Processing file...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-dark-secondary" />
                          <p className="text-dark-secondary mb-1">
                            {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                          </p>
                          <p className="text-xs text-dark-secondary">
                            or drag and drop your CSV file here
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* CSV Input */}
              {uploadMethod === 'paste' && (
                <div>
                  <label className="text-sm font-medium text-dark-secondary mb-2 block">
                    Paste CSV Data
                  </label>
                  <textarea
                    value={bulkUploadData}
                    onChange={(e) => setBulkUploadData(e.target.value)}
                    className="w-full h-48 px-3 py-2 bg-dark-bg border border-dark-color rounded-lg text-dark-primary focus:outline-none focus:ring-2 focus:ring-dark-cta font-mono text-sm"
                    placeholder="partNumber,partName,category,projectorModel"
                  />
                </div>
              )}

              {/* Error Display */}
              {bulkUploadError && (
                <div className="p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 text-sm">{bulkUploadError}</p>
                    </div>
                    {problemRows.length > 0 && (
                      <button
                        onClick={() => setShowProblemRows(true)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                      >
                        Show Problem Rows
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              {bulkUploadPreview.length > 0 && (
                <div>
                  <h3 className="font-semibold text-dark-primary mb-3">Preview (First 5 rows)</h3>
                  <div className="bg-dark-bg border border-dark-color rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                                              <thead className="bg-dark-color">
                          <tr>
                            <th className="px-3 py-2 text-left text-dark-secondary">Part Number</th>
                            <th className="px-3 py-2 text-left text-dark-secondary">Part Name</th>
                            <th className="px-3 py-2 text-left text-dark-secondary">Category</th>
                            <th className="px-3 py-2 text-left text-dark-secondary">Projector Model</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkUploadPreview.map((part, index) => (
                            <tr key={index} className="border-t border-dark-color">
                              <td className="px-3 py-2 text-dark-primary">{part.partNumber}</td>
                              <td className="px-3 py-2 text-dark-primary">{part.partName}</td>
                              <td className="px-3 py-2 text-dark-primary">{part.category}</td>
                              <td className="px-3 py-2 text-dark-primary">{part.projectorModel}</td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-dark-color">
                <button 
                  onClick={handleBulkUploadPreview}
                  className="flex-1 dark-button-secondary gap-2 flex items-center justify-center"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button 
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadData("");
                    setBulkUploadPreview([]);
                    setBulkUploadError(null);
                    setSelectedFile(null);
                    setUploadMethod('file');
                    setIsFileUploading(false);
                  }}
                  className="flex-1 dark-button-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkUpload}
                  disabled={isLoading || !bulkUploadData.trim()}
                  className="flex-1 dark-button-primary disabled:opacity-50 disabled:cursor-not-allowed gap-2 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Parts
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problem Rows Modal */}
      {showProblemRows && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-color rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-primary">Problem Rows in CSV</h2>
              <button 
                onClick={() => setShowProblemRows(false)}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-400 mb-2">How to Fix:</h3>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• Each row must have exactly 4 columns: partNumber, partName, category, projectorModel</li>
                  <li>• Remove any extra commas or columns</li>
                  <li>• If a value contains commas, wrap it in quotes: "Part, Name"</li>
                  <li>• Check for trailing commas at the end of rows</li>
                </ul>
              </div>

              <div className="bg-dark-bg border border-dark-color rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-dark-color">
                    <tr>
                      <th className="px-3 py-2 text-left text-dark-secondary">Row #</th>
                      <th className="px-3 py-2 text-left text-dark-secondary">Expected Columns</th>
                      <th className="px-3 py-2 text-left text-dark-secondary">Actual Columns</th>
                      <th className="px-3 py-2 text-left text-dark-secondary">Row Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problemRows.map((problem, index) => (
                      <tr key={index} className="border-t border-dark-color">
                        <td className="px-3 py-2 text-red-400 font-mono">{problem.row}</td>
                        <td className="px-3 py-2 text-green-400 font-mono">{problem.expected}</td>
                        <td className="px-3 py-2 text-red-400 font-mono">{problem.actual}</td>
                        <td className="px-3 py-2 text-dark-primary font-mono text-xs break-all">
                          {problem.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-dark-color">
                <button 
                  onClick={() => setShowProblemRows(false)}
                  className="dark-button-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}