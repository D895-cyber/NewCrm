import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Monitor,
  User,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  Table as TableIcon,
  Grid3X3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ASCOMPExactFormatForm } from '../ASCOMPExactFormatForm';
import { apiClient } from '../../utils/api/client';
import { exportASCOMPReportToPDF } from '../../utils/ascomp-pdf-export';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceReport {
  _id: string;
  reportNumber: string;
  reportType?: string;
  date: string;
  cinemaName: string;
  address?: string;
  location?: string;
  projectorModelSerialAndHours?: string;
  engineer: {
    name: string;
    phone: string;
    email: string;
  };
  status?: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';
  opticals?: any;
  electronics?: any;
  mechanical?: any;
  lampInfo?: any;
  imageEvaluation?: any;
  createdAt: string;
  updatedAt: string;
}

export function FSEASCOMPReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalReports: 0,
    todayReports: 0,
    monthlyReports: 0
  });

  // Restrict access to FSE users only
  if (user?.role !== 'fse') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            This page is only available to Field Service Engineers (FSE).
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadReports();
    loadStats();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Use new ASCOMP reports API
      const response = await apiClient.getAllASCOMPReports();
      setReports(response || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.getASCOMPReportStats();
      setStats(response.data || response || {});
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateReport = async (reportData: any) => {
    try {
      // Use new ASCOMP reports API
      await apiClient.createASCOMPReport(reportData);
      setShowForm(false);
      loadReports();
      loadStats();
      
      // Show success message
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'success',
          title: 'Report Created',
          message: `ASCOMP report created successfully!`
        });
      }
    } catch (error) {
      console.error('Error creating report:', error);
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to create ASCOMP report. Please try again.'
        });
      }
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        // Use new ASCOMP reports API
        await apiClient.deleteASCOMPReport(reportId);
        loadReports();
        loadStats();
        
        if ((window as any).showToast) {
          (window as any).showToast({
            type: 'success',
            title: 'Report Deleted',
            message: 'ASCOMP report deleted successfully!'
          });
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        if ((window as any).showToast) {
          (window as any).showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to delete ASCOMP report. Please try again.'
          });
        }
      }
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.cinemaName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.engineer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || report.reportType === filterType;
    const matchesSite = filterSite === 'all' || report.cinemaName === filterSite;
    
    return matchesSearch && matchesType && matchesSite;
  });

  const getReportTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'First': 'bg-blue-100 text-blue-800',
      'Second': 'bg-green-100 text-green-800',
      'Third': 'bg-yellow-100 text-yellow-800',
      'Fourth': 'bg-purple-100 text-purple-800',
      'Emergency': 'bg-red-100 text-red-800',
      'Installation': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (result: string) => {
    switch (result) {
      case 'OK':
        return 'text-green-600';
      case 'FAIL':
        return 'text-red-600';
      case 'REPLACE':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const toggleRowExpansion = (reportId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedRows(newExpanded);
  };

  const renderDetailedTableRow = (report: ServiceReport) => {
    const isExpanded = expandedRows.has(report._id);
    
    return (
      <React.Fragment key={report._id}>
        <TableRow className="hover:bg-gray-50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRowExpansion(report._id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {report.reportNumber}
            </div>
          </TableCell>
          <TableCell>
            <Badge className={getReportTypeColor(report.reportType)}>
              {report.reportType}
            </Badge>
          </TableCell>
          <TableCell>{report.cinemaName}</TableCell>
          <TableCell colSpan={2}>{report.projectorModelSerialAndHours || 'N/A'}</TableCell>
          <TableCell>{report.engineer?.name || 'N/A'}</TableCell>
          <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
          <TableCell>
            <div className="flex gap-1">
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(report.sections.opticals.filter(o => o.result === 'OK').length === report.sections.opticals.length ? 'OK' : 'FAIL')}`}>
                {report.sections.opticals.filter(o => o.result === 'OK').length}/{report.sections.opticals.length}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.hash = `#/service-reports/${report._id}?readonly=1`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    // Use new ASCOMP reports API and PDF export
                    const full = await apiClient.getASCOMPReport(report._id);
                    await exportASCOMPReportToPDF(full);
                    (window as any).showToast?.({
                      type: 'success',
                      title: 'Report Downloaded',
                      message: 'ASCOMP report has been downloaded as PDF in exact format.'
                    });
                  } catch (e) {
                    console.error('Export failed', e);
                    (window as any).showToast?.({ 
                      type: 'error', 
                      title: 'Export Failed', 
                      message: 'Could not download report. Please try again.' 
                    });
                  }
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        
        {isExpanded && (
          <TableRow>
            <TableCell colSpan={9} className="bg-gray-50 p-0">
              <div className="p-4 space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Projector Details</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Model:</span> {report.projectorModel}</div>
                      <div><span className="font-medium">Serial:</span> {report.projectorSerial}</div>
                      <div><span className="font-medium">Software:</span> {report.softwareVersion || 'N/A'}</div>
                      <div><span className="font-medium">Hours:</span> {report.projectorRunningHours || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Lamp Information</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Model:</span> {report.lampModel || 'N/A'}</div>
                      <div><span className="font-medium">Hours:</span> {report.lampRunningHours || 'N/A'}</div>
                      <div><span className="font-medium">Current:</span> {report.currentLampHours || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Voltage Parameters</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">P vs N:</span> {report.voltageParameters?.pVsN || 'N/A'}</div>
                      <div><span className="font-medium">P vs E:</span> {report.voltageParameters?.pVsE || 'N/A'}</div>
                      <div><span className="font-medium">N vs E:</span> {report.voltageParameters?.nVsE || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Lamp Power</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Before PM:</span> {report.lampPowerMeasurements?.flBeforePM || 'N/A'}</div>
                      <div><span className="font-medium">After PM:</span> {report.lampPowerMeasurements?.flAfterPM || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Opticals Check</h4>
                    <div className="space-y-1">
                      {report.sections.opticals.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span className={`font-medium ${getStatusColor(item.result)}`}>
                            {item.result || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Electronics Check</h4>
                    <div className="space-y-1">
                      {report.sections.electronics.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span className={`font-medium ${getStatusColor(item.result)}`}>
                            {item.result || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Mechanical Check</h4>
                    <div className="space-y-1">
                      {report.sections.mechanical.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span className={`font-medium ${getStatusColor(item.result)}`}>
                            {item.result || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image Evaluation */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Image Evaluation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {report.imageEvaluation && Object.entries(report.imageEvaluation).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className={`font-medium ${getStatusColor(value)}`}>
                          {value || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Environmental Data */}
                {(report.airPollutionLevel || report.environmentalConditions) && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Environmental Conditions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {report.airPollutionLevel && (
                        <>
                          <div><span className="font-medium">Air Quality:</span> {report.airPollutionLevel.overall || 'N/A'}</div>
                          <div><span className="font-medium">HCHO:</span> {report.airPollutionLevel.hcho || 'N/A'}</div>
                          <div><span className="font-medium">TVOC:</span> {report.airPollutionLevel.tvoc || 'N/A'}</div>
                          <div><span className="font-medium">PM2.5:</span> {report.airPollutionLevel.pm25 || 'N/A'}</div>
                        </>
                      )}
                      {report.environmentalConditions && (
                        <>
                          <div><span className="font-medium">Temperature:</span> {report.environmentalConditions.temperature || 'N/A'}°C</div>
                          <div><span className="font-medium">Humidity:</span> {report.environmentalConditions.humidity || 'N/A'}%</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {report.observations && report.observations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Observations</h4>
                    <div className="space-y-1 text-sm">
                      {report.observations.map((obs, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-medium">{idx + 1}.</span>
                          <span>{obs.description || obs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  if (showForm) {
    return (
      <ASCOMPExactFormatForm
        onSubmit={handleCreateReport}
        onClose={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ASCOMP Service Reports</h1>
              <p className="text-gray-600">Professional Projector Service Report Management</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Report
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayReports}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.monthlyReports}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search reports by number, site, projector, or engineer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="First">First</SelectItem>
                  <SelectItem value="Second">Second</SelectItem>
                  <SelectItem value="Third">Third</SelectItem>
                  <SelectItem value="Fourth">Fourth</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Installation">Installation</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterSite} onValueChange={setFilterSite}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {Array.from(new Set(reports.map(r => r.cinemaName))).map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-l-none"
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' || filterSite !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first service report'
                }
              </p>
              {!searchTerm && filterType === 'all' && filterSite === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Projector Model</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => renderDetailedTableRow(report))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Card View */
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.reportNumber}
                        </h3>
                        <Badge className={getReportTypeColor(report.reportType)}>
                          {report.reportType}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{report.cinemaName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {report.projectorModelSerialAndHours || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{report.engineer.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {report.sections.opticals.filter(o => o.result === 'OK').length}/{report.sections.opticals.length} Opticals OK
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick Status Summary */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Opticals:</span>
                          <div className="flex gap-1 mt-1">
                            {report.sections.opticals.map((item, idx) => (
                              <CheckCircle 
                                key={idx} 
                                className={`h-4 w-4 ${getStatusColor(item.result)}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Electronics:</span>
                          <div className="flex gap-1 mt-1">
                            {report.sections.electronics.map((item, idx) => (
                              <CheckCircle 
                                key={idx} 
                                className={`h-4 w-4 ${getStatusColor(item.result)}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Mechanical:</span>
                          <div className="flex gap-1 mt-1">
                            {report.sections.mechanical.map((item, idx) => (
                              <CheckCircle 
                                key={idx} 
                                className={`h-4 w-4 ${getStatusColor(item.result)}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Open read-only editor view using hash route
                          window.location.hash = `#/service-reports/${report._id}?readonly=1`;
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            console.log('🔄 Fetching complete ASCOMP report data for exact format PDF generation...');
                            // Use new ASCOMP reports API
                            const full = await apiClient.getASCOMPReport(report._id);
                            console.log('📊 Full ASCOMP report data received:', {
                              hasOpticals: !!full.opticals,
                              hasElectronics: !!full.electronics,
                              hasMechanical: !!full.mechanical,
                              hasLampInfo: !!full.lampInfo,
                              hasSoftwareVersion: !!full.softwareVersion,
                              reportKeys: Object.keys(full)
                            });
                            
                            // Use new ASCOMP PDF export with exact format
                            await exportASCOMPReportToPDF(full);
                            (window as any).showToast?.({
                              type: 'success',
                              title: 'ASCOMP Report Downloaded',
                              message: 'Complete ASCOMP report in exact format has been downloaded as PDF.'
                            });
                          } catch (e) {
                            console.error('Export failed', e);
                            (window as any).showToast?.({ 
                              type: 'error', 
                              title: 'Export Failed', 
                              message: 'Could not download report. Please try again.' 
                            });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export Full PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteReport(report._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
