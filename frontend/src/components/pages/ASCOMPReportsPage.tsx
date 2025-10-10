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
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
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
import { ASCOMPExactFormatForm } from '../ASCOMPExactFormatForm';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';
import { exportASCOMPReportToPDF } from '../../utils/ascomp-pdf-export';

interface ASCOMPReport {
  _id: string;
  reportNumber: string;
  date: string;
  cinemaName: string;
  address: string;
  location: string;
  engineer: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';
  createdAt: string;
  updatedAt: string;
}

export function ASCOMPReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ASCOMPReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalReports: 0,
    todayReports: 0,
    monthlyReports: 0,
    statusBreakdown: {} as Record<string, number>
  });

  useEffect(() => {
    loadReports();
    loadStats();
  }, [filterStatus]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await apiClient.getAllASCOMPReports(filters);
      setReports(response || []);
    } catch (error) {
      console.error('Error loading ASCOMP reports:', error);
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load reports. Please try again.'
        });
      }
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
      await apiClient.createASCOMPReport(reportData);
      setShowForm(false);
      loadReports();
      loadStats();
      
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
          message: 'Failed to create report. Please try again.'
        });
      }
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this ASCOMP report? This action cannot be undone.')) {
      try {
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
            message: 'Failed to delete report. Please try again.'
          });
        }
      }
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await apiClient.approveASCOMPReport(reportId);
      loadReports();
      loadStats();
      
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'success',
          title: 'Report Approved',
          message: 'ASCOMP report approved successfully!'
        });
      }
    } catch (error) {
      console.error('Error approving report:', error);
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to approve report. Please try again.'
        });
      }
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'info',
          title: 'Generating PDF',
          message: 'Please wait while we generate your report...'
        });
      }
      
      // Fetch complete report data
      const fullReport = await apiClient.getASCOMPReport(reportId);
      
      // Generate and download PDF
      await exportASCOMPReportToPDF(fullReport);
      
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'success',
          title: 'PDF Downloaded',
          message: 'ASCOMP report has been downloaded successfully!'
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Failed to download report. Please try again.'
        });
      }
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.cinemaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Submitted': 'bg-blue-100 text-blue-800',
      'Reviewed': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Reviewed':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
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
              <h1 className="text-3xl font-bold text-gray-900">ASCOMP EW Reports</h1>
              <p className="text-gray-600">Preventive Maintenance Report Management</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Report
            </Button>
          </div>

          {/* Stats Cards */}
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
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.statusBreakdown['Approved'] || 0}
                    </p>
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by report #, cinema, engineer, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline"
                onClick={() => {
                  loadReports();
                  loadStats();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ASCOMP reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ASCOMP reports found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first ASCOMP EW report'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(report.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.reportNumber}
                        </h3>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Cinema</p>
                            <p className="text-sm font-medium text-gray-900">{report.cinemaName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Engineer</p>
                            <p className="text-sm font-medium text-gray-900">{report.engineer.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium text-gray-900">{report.location || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          window.location.hash = `#/ascomp-reports/${report._id}?readonly=1`;
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReport(report._id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                      
                      {(user?.role === 'admin' || user?.role === 'manager') && report.status === 'Submitted' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApproveReport(report._id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      
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

