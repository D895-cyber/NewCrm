import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  BarChart3, 
  PieChart, 
  Calendar,
  MapPin,
  Monitor,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  Table,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  RefreshCw
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
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow} from '../ui/table';
import { apiClient } from '../../utils/api/client';
import { exportServiceReportToPDF } from '../../utils/export';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceReport {
  _id: string;
  reportNumber: string;
  reportType: string;
  date: string;
  siteName: string;
  projectorModel: string;
  projectorSerial: string;
  softwareVersion: string;
  projectorRunningHours: string;
  lampModel: string;
  lampRunningHours: string;
  currentLampHours: string;
  engineer: {
    name: string;
    phone: string;
    email: string;
  };
  sections: {
    opticals: Array<{ description: string; status: string; result: string }>;
    electronics: Array<{ description: string; status: string; result: string }>;
    mechanical: Array<{ description: string; status: string; result: string }>;
  };
  imageEvaluation: {
    focusBoresight: string;
    integratorPosition: string;
    spotOnScreen: string;
    screenCropping: string;
    convergenceChecked: string;
    channelsChecked: string;
    pixelDefects: string;
    imageVibration: string;
    liteLoc: string;
  };
  voltageParameters: {
    pVsN: string;
    pVsE: string;
    nVsE: string;
  };
  contentPlayingServer: string;
  lampPowerMeasurements: {
    flBeforePM: string;
    flAfterPM: string;
  };
  projectorPlacement: string;
  observations: Array<{ number: number; description: string }>;
  airPollutionLevel: {
    overall: string;
    hcho: string;
    tvoc: string;
    pm1: string;
    pm25: string;
    pm10: string;
  };
  environmentalConditions: {
    temperature: string;
    humidity: string;
  };
  systemStatus: {
    leStatus: string;
    acStatus: string;
  };
  screenInfo: {
    scope: { height: string; width: string; gain: string };
    flat: { height: string; width: string; gain: string };
    screenMake: string;
    throwDistance: string;
  };
  measuredColorCoordinates: Array<{
    testPattern: string;
    fl: string;
    x: string;
    y: string;
  }>;
  cieColorAccuracy: Array<{
    testPattern: string;
    x: string;
    y: string;
    fl: string;
  }>;
  visitId: string;
  createdAt: string;
  updatedAt: string;
}

export function ServiceReportsAnalysisPage() {
  const { user, token, logout } = useAuth();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [filterEngineer, setFilterEngineer] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'analytics'>('table');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalReports: 0,
    todayReports: 0,
    monthlyReports: 0,
    reportTypes: [] as Array<{ _id: string; count: number }>
  });

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    // Set the auth token in the API client
    apiClient.setAuthToken(token);
    loadReports();
    loadStats();
  }, [token]);

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING SERVICE REPORTS ===');
      console.log('Loading service reports...');
      
      // Test direct fetch first
      console.log('Testing direct fetch...');
      try {
        const directResponse = await fetch('http://localhost:4000/api/service-reports');
        console.log('Direct fetch status:', directResponse.status);
        const directData = await directResponse.json();
        console.log('Direct fetch data:', directData);
        console.log('Direct fetch data length:', directData?.length);
      } catch (directError) {
        console.error('Direct fetch error:', directError);
      }
      
      const response = await apiClient.getAllServiceReports();
      console.log('Service reports response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Reports data:', response.data);
      console.log('Reports data type:', typeof response.data);
      console.log('Number of reports:', response.data?.length || 0);
      
      if (response && response.data) {
        console.log('Setting reports:', response.data);
        setReports(response.data);
      } else if (Array.isArray(response)) {
        console.log('Response is array, setting directly:', response);
        setReports(response);
      } else {
        console.log('No valid data found in response');
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('=== LOADING DASHBOARD STATS ===');
      
      // Test direct fetch first
      console.log('Testing direct fetch for stats...');
      try {
        const directResponse = await fetch('http://localhost:4000/api/service-reports/stats/dashboard');
        console.log('Direct fetch stats status:', directResponse.status);
        const directData = await directResponse.json();
        console.log('Direct fetch stats data:', directData);
      } catch (directError) {
        console.error('Direct fetch stats error:', directError);
      }
      
      const response = await apiClient.getServiceReportDashboardStats();
      console.log('Dashboard stats response:', response);
      console.log('Stats data:', response.data);
      setStats(response.data || {});
    } catch (error: any) {
      console.error('Error loading stats:', error);
      console.error('Stats error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.projectorSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.engineer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || report.reportType === filterType;
    const matchesSite = filterSite === 'all' || report.siteName === filterSite;
    const matchesEngineer = filterEngineer === 'all' || report.engineer.name === filterEngineer;
    
    return matchesSearch && matchesType && matchesSite && matchesEngineer;
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

  const toggleReportSelection = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const selectAllReports = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r._id)));
    }
  };

  const exportSelectedReports = async () => {
    // Ensure authentication token is set before making requests
    if (!token) {
      console.error('No authentication token available for bulk export');
      return;
    }
    
    apiClient.setAuthToken(token);
    
    for (const reportId of selectedReports) {
      try {
        const report = await apiClient.getServiceReport(reportId);
        exportServiceReportToPDF(report);
      } catch (error) {
        console.error(`Error exporting report ${reportId}:`, error);
      }
    }
  };

  const renderDetailedTableRow = (report: ServiceReport) => {
    const isExpanded = expandedRows.has(report._id);
    const isSelected = selectedReports.has(report._id);
    
    return (
      <React.Fragment key={report._id}>
        <TableRow className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
          <TableCell className="text-gray-900">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleReportSelection(report._id)}
              className="rounded border-gray-300"
            />
          </TableCell>
          <TableCell className="font-medium text-gray-900">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRowExpansion(report._id)}
                className="h-6 w-6 p-0 text-gray-700 hover:text-gray-900"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <span className="text-gray-900">{report.reportNumber}</span>
            </div>
          </TableCell>
          <TableCell className="text-gray-900">
            <Badge className={getReportTypeColor(report.reportType || 'First')}>
              {report.reportType || 'N/A'}
            </Badge>
          </TableCell>
          <TableCell className="text-gray-900">{report.siteName || 'N/A'}</TableCell>
          <TableCell className="text-gray-900">{report.projectorModel || 'N/A'}</TableCell>
          <TableCell className="text-gray-900">{report.projectorSerial || 'N/A'}</TableCell>
          <TableCell className="text-gray-900">{report.engineer?.name || 'N/A'}</TableCell>
          <TableCell className="text-gray-900">{report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</TableCell>
          <TableCell className="text-gray-900">
            <div className="flex gap-1">
              {report.sections?.opticals ? (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(report.sections.opticals.filter((o: any) => o.result === 'OK').length === report.sections.opticals.length ? 'OK' : 'FAIL')}`}>
                  {report.sections.opticals.filter((o: any) => o.result === 'OK').length}/{report.sections.opticals.length}
                </span>
              ) : (
                <span className="text-gray-500 text-xs">-</span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-gray-900">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.hash = `#/service-reports/${report._id}?readonly=1`}
                className="text-gray-700 hover:text-gray-900 border-gray-300"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-gray-700 hover:text-gray-900 border-gray-300"
                onClick={async () => {
                  try {
                    // Ensure authentication token is set before making the request
                    if (token) {
                      apiClient.setAuthToken(token);
                    } else {
                      throw new Error('No authentication token available');
                    }
                    
                    // First try to download original PDF if available
                    try {
                      const response = await fetch(`http://localhost:4000/api/service-reports/${report._id}/download-original-pdf`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      if (response.ok) {
                        // Original PDF found, download it
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Original_${report.reportNumber}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        
                        (window as any).showToast?.({ 
                          type: 'success', 
                          title: 'Download', 
                          message: 'Original FSE PDF downloaded successfully' 
                        });
                        return;
                      }
                    } catch (originalPdfError) {
                      console.log('No original PDF found, generating new one...');
                    }
                    
                    // Fallback: Generate new PDF from data
                    const full = await apiClient.getServiceReport(report._id);
                    exportServiceReportToPDF(full);
                  } catch (e) {
                    console.error('Export failed', e);
                    (window as any).showToast?.({ type: 'error', title: 'Export', message: 'Could not export report' });
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
            <TableCell colSpan={10} className="bg-gray-50 p-0">
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Projector Details</h4>
                    <div className="text-sm space-y-2">
                      <div><span className="font-medium">Model:</span> {report.projectorModel}</div>
                      <div><span className="font-medium">Serial:</span> {report.projectorSerial}</div>
                      <div><span className="font-medium">Software:</span> {report.softwareVersion || 'N/A'}</div>
                      <div><span className="font-medium">Hours:</span> {report.projectorRunningHours || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Lamp Information</h4>
                    <div className="text-sm space-y-2">
                      <div><span className="font-medium">Model:</span> {report.lampModel || 'N/A'}</div>
                      <div><span className="font-medium">Hours:</span> {report.lampRunningHours || 'N/A'}</div>
                      <div><span className="font-medium">Current:</span> {report.currentLampHours || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Voltage Parameters</h4>
                    <div className="text-sm space-y-2">
                      <div><span className="font-medium">P vs N:</span> {report.voltageParameters?.pVsN || 'N/A'}</div>
                      <div><span className="font-medium">P vs E:</span> {report.voltageParameters?.pVsE || 'N/A'}</div>
                      <div><span className="font-medium">N vs E:</span> {report.voltageParameters?.nVsE || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Lamp Power</h4>
                    <div className="text-sm space-y-2">
                      <div><span className="font-medium">Before PM:</span> {report.lampPowerMeasurements?.flBeforePM || 'N/A'}</div>
                      <div><span className="font-medium">After PM:</span> {report.lampPowerMeasurements?.flAfterPM || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Technical Check Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Opticals Check</h4>
                    <div className="space-y-2">
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
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Electronics Check</h4>
                    <div className="space-y-2">
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
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Mechanical Check</h4>
                    <div className="space-y-2">
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
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Image Evaluation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Environmental Conditions</h4>
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
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Observations</h4>
                    <div className="space-y-2 text-sm">
                      {report.observations.map((obs, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-medium">{obs.number || idx + 1}.</span>
                          <span>{typeof obs === 'string' ? obs : obs.description || ''}</span>
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

  const renderAnalytics = () => {
    const reportTypeStats = stats.reportTypes || [];
    const siteStats = Array.from(new Set(reports.map(r => r.siteName))).map(site => ({
      site,
      count: reports.filter(r => r.siteName === site).length
    }));

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sites</p>
                  <p className="text-2xl font-bold text-gray-900">{siteStats.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Report Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportTypeStats.map((type) => (
                  <div key={type._id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{type._id}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(type.count / stats.totalReports) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports by Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {siteStats.slice(0, 5).map((site) => (
                  <div key={site.site} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{site.site}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(site.count / Math.max(...siteStats.map(s => s.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{site.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading service reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Reports Analysis</h1>
              <p className="text-gray-600">Comprehensive analysis and management of FSE service reports</p>
              <p className="text-sm text-gray-500 mt-1">
                Total Reports: {stats.totalReports} | Today: {stats.todayReports} | This Month: {stats.monthlyReports}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('Manual refresh triggered');
                  loadReports();
                  loadStats();
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
              {selectedReports.size > 0 && (
                <Button 
                  onClick={exportSelectedReports}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Selected ({selectedReports.size})
                </Button>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-r-none"
              >
                <Table className="h-4 w-4 mr-2" />
                Table View
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-l-none rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Cards View
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('analytics')}
                className="rounded-l-none"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {viewMode !== 'analytics' && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder=" reports by number, site, projector, or engineer..."
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
                    {Array.from(new Set(reports.map(r => r.siteName))).map(site => (
                      <SelectItem key={site} value={site}>{site}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEngineer} onValueChange={setFilterEngineer}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Engineers</SelectItem>
                    {Array.from(new Set(reports.map(r => r.engineer.name))).map(engineer => (
                      <SelectItem key={engineer} value={engineer}>{engineer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info - Show when no reports found */}
        {!loading && reports.length === 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-orange-900 mb-2">No Service Reports Found</h3>
                <p className="text-orange-700 mb-4">
                  No service reports are currently available. This could be due to:
                </p>
                <ul className="text-sm text-orange-600 text-left max-w-md mx-auto space-y-1">
                  <li>• No reports have been created yet</li>
                  <li>• Authentication issues preventing data access</li>
                  <li>• Database connection problems</li>
                  <li>• Reports are being filtered out</li>
                </ul>
                <div className="mt-4">
                  <Button 
                    onClick={() => {
                      console.log('Debug: Reloading reports...');
                      loadReports();
                      loadStats();
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {viewMode === 'analytics' ? (
          renderAnalytics()
        ) : viewMode === 'table' ? (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                      onChange={selectAllReports}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">
                      {selectedReports.size} of {filteredReports.length} reports selected
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredReports.length} reports
                  </div>
                </div>
              </div>
              <UITable>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-12 text-gray-900 font-semibold">Select</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Report #</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Type</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Site</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Projector Model</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Serial #</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Engineer</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => renderDetailedTableRow(report))}
                </TableBody>
              </UITable>
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
                          <span className="text-sm text-gray-600">{report.siteName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {report.projectorModel} - {report.projectorSerial}
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
                          console.log('🔍 Opening report for viewing:', report._id);
                          console.log('🔗 Hash URL:', `#/service-reports/${report._id}?readonly=1`);
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
                            console.log('📥 Starting ASCOMP report download for:', report._id);
                            console.log('📋 Report details:', {
                              reportNumber: report.reportNumber,
                              siteName: report.siteName,
                              engineer: report.engineer?.name
                            });
                            
                            // Ensure authentication token is set before making the request
                            if (token) {
                              apiClient.setAuthToken(token);
                            } else {
                              throw new Error('No authentication token available');
                            }
                            
                            // First try to download original PDF if available
                            try {
                              const response = await fetch(`http://localhost:4000/api/service-reports/${report._id}/download-original-pdf`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (response.ok) {
                                // Original PDF found, download it
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `Original_${report.reportNumber}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                                
                                (window as any).showToast?.({ 
                                  type: 'success', 
                                  title: 'Download', 
                                  message: 'Original FSE PDF downloaded successfully' 
                                });
                                return;
                              }
                            } catch (originalPdfError) {
                              console.log('No original PDF found, generating new one...');
                            }
                            
                            // Generate comprehensive PDF from complete report data
                            console.log('🔄 Fetching complete report data for comprehensive PDF generation...');
                            const full = await apiClient.getServiceReport(report._id);
                            console.log('📊 Full report data received:', {
                              hasSections: !!full.sections,
                              sectionsKeys: full.sections ? Object.keys(full.sections) : 'No sections',
                              hasImageEvaluation: !!full.imageEvaluation,
                              hasObservations: !!full.observations,
                              hasPhotos: !!full.photos,
                              reportKeys: Object.keys(full)
                            });
                            
                            // Validate report data
                            if (!full || !full.reportNumber) {
                              throw new Error('Invalid report data received from server');
                            }
                            
                            await exportServiceReportToPDF(full);
                            console.log('✅ Comprehensive ASCOMP PDF export initiated');
                            
                            (window as any).showToast?.({ 
                              type: 'success', 
                              title: 'Comprehensive Export Started', 
                              message: 'Complete ASCOMP report with all sections download initiated. Check your downloads folder.' 
                            });
                          } catch (e: any) {
                            console.error('❌ ASCOMP export failed:', e);
                            console.error('❌ Error details:', {
                              message: e.message,
                              stack: e.stack,
                              reportId: report._id
                            });
                            
                            (window as any).showToast?.({ 
                              type: 'error', 
                              title: 'Export Failed', 
                              message: `Could not export ASCOMP report: ${e.message || 'Unknown error'}` 
                            });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' || filterSite !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No service reports available'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
