import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Building, 
  FileText, 
  RefreshCw,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  ArrowLeft,
  MessageSquare,
  User
} from 'lucide-react';
import { apiClient } from '../../utils/api/client';
import { RMACommentSystem } from '../RMACommentSystem';

interface OverdueRMA {
  _id: string;
  rmaNumber: string;
  siteName: string;
  productName: string;
  productPartNumber: string;
  defectivePartNumber: string;
  defectivePartName: string;
  replacedPartNumber: string;
  replacedPartName: string;
  ascompRaisedDate: string;
  caseStatus: string;
  priority: string;
  warrantyStatus: string;
  estimatedCost: number;
  notes: string;
  daysOverdue: number;
  raisedDate: string;
  isCritical: boolean;
  isUrgent: boolean;
  // Comment fields will be added later when the backend is updated
  publicComments?: Array<any>;
  totalComments?: number;
  lastUpdate?: any;
}

interface OverdueAnalysis {
  summary: {
    totalOverdue: number;
    criticalCount: number;
    urgentCount: number;
    averageDaysOverdue: number;
    cutoffDate: string;
    analysisDate: string;
  };
  breakdown: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    bySite: Record<string, number>;
  };
  overdueRMAs: OverdueRMA[];
  recommendations: Array<{
    type: string;
    message: string;
    action: string;
  }>;
}

export function RMAOverdueAnalysis() {
  const [analysis, setAnalysis] = useState<OverdueAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState(30);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set());
  const [selectedRMA, setSelectedRMA] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const loadAnalysis = async () => {
    try {
      console.log('🔄 loadAnalysis called - refreshing overdue analysis...');
      setLoading(true);
      setError(null);
      
      // Try the new endpoint with comments first, fallback to original if it fails
      let data;
      // Use the working analytics endpoint directly
      data = await apiClient.getOverdueRMAAnalysis(daysFilter, statusFilter);
      
      // Transform the data to match the expected format
      const transformedData = {
        summary: {
          totalOverdue: data.summary?.totalOverdue || data.overdueRMAs?.length || 0,
          criticalCount: data.summary?.criticalCount || data.overdueRMAs?.filter((rma: OverdueRMA) => rma.isCritical).length || 0,
          urgentCount: data.summary?.urgentCount || data.overdueRMAs?.filter((rma: OverdueRMA) => rma.isUrgent).length || 0,
          averageDaysOverdue: data.summary?.averageDaysOverdue || (data.overdueRMAs?.length > 0 ? 
            Math.round(data.overdueRMAs.reduce((sum: number, rma: OverdueRMA) => sum + rma.daysOverdue, 0) / data.overdueRMAs.length) : 0)
        },
        breakdown: {
          byStatus: data.overdueByStatus || {},
          byPriority: data.overdueByPriority || {},
          bySite: data.overdueBySite || {}
        },
        overdueByStatus: data.overdueByStatus || {},
        overdueByPriority: data.overdueByPriority || {},
        overdueBySite: data.overdueBySite || {},
        overdueRMAs: data.overdueRMAs || [],
        recommendations: data.recommendations || []
      };

      // Calculate statistics if not provided
      if (data.overdueRMAs && (!data.overdueByStatus || Object.keys(data.overdueByStatus).length === 0)) {
        data.overdueRMAs.forEach((rma: OverdueRMA) => {
          const status = rma.caseStatus || 'Unknown';
          const priority = rma.priority || 'Unknown';
          const site = rma.siteName || 'Unknown';
          
          transformedData.overdueByStatus[status] = (transformedData.overdueByStatus[status] || 0) + 1;
          transformedData.overdueByPriority[priority] = (transformedData.overdueByPriority[priority] || 0) + 1;
          transformedData.overdueBySite[site] = (transformedData.overdueBySite[site] || 0) + 1;
        });
        
        // Update breakdown object as well
        transformedData.breakdown.byStatus = transformedData.overdueByStatus;
        transformedData.breakdown.byPriority = transformedData.overdueByPriority;
        transformedData.breakdown.bySite = transformedData.overdueBySite;
      }

      // Ensure comment fields exist for each RMA (preserve existing data if available)
      if (transformedData.overdueRMAs) {
        transformedData.overdueRMAs = transformedData.overdueRMAs.map((rma: any) => ({
          ...rma,
          publicComments: rma.publicComments || [], // Use existing data or empty array
          totalComments: rma.totalComments || 0,    // Use existing data or 0
          lastUpdate: rma.lastUpdate || null        // Use existing data or null
        }));
      }

      console.log('✅ Analysis data updated:', transformedData.overdueRMAs?.length || 0, 'RMAs');
      setAnalysis(transformedData);
    } catch (err: any) {
      console.error('❌ Error loading overdue analysis:', err);
      setError(err.message || 'Failed to load overdue analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [daysFilter, statusFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-blue-600';
      case 'RMA Raised Yet to Deliver': return 'bg-yellow-600';
      case 'Sent to CDS': return 'bg-purple-600';
      case 'Replacement Shipped': return 'bg-green-600';
      case 'Completed': return 'bg-green-700';
      default: return 'bg-gray-600';
    }
  };

  const getOverdueSeverity = (daysOverdue: number) => {
    if (daysOverdue >= 60) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
    if (daysOverdue >= 45) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Urgent' };
    if (daysOverdue >= 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Overdue' };
    return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Normal' };
  };

  const handleStatusClick = async (status: string) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSelectedStatus(status);
    
    // Add a small delay for smooth animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleBackToStatusList = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedStatus(null);
      setIsAnimating(false);
    }, 200);
  };

  const toggleStatusExpansion = (status: string) => {
    const newExpanded = new Set(expandedStatuses);
    if (newExpanded.has(status)) {
      newExpanded.delete(status);
    } else {
      newExpanded.add(status);
    }
    setExpandedStatuses(newExpanded);
  };

  const getRMAsByStatus = (status: string) => {
    if (!analysis) return [];
    return analysis.overdueRMAs.filter(rma => rma.caseStatus === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading overdue analysis...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
        <span>No analysis data available</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4">
        <p>No analysis data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <style jsx>{`
        @keyframes slideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromBottom {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-in-left {
          animation: slideInFromLeft 0.5s ease-out forwards;
        }
        
        .animate-slide-in-bottom {
          animation: slideInFromBottom 0.6s ease-out forwards;
        }
        
        .animate-fade-in-scale {
          animation: fadeInScale 0.4s ease-out forwards;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">RMA Overdue Analysis</h2>
          <p className="text-gray-400">Analysis of RMAs overdue for {daysFilter}+ days from raised date</p>
        </div>
        <div className="flex gap-4">
          <Select value={daysFilter.toString()} onValueChange={(value) => setDaysFilter(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30+ days</SelectItem>
              <SelectItem value="45">45+ days</SelectItem>
              <SelectItem value="60">60+ days</SelectItem>
              <SelectItem value="90">90+ days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="RMA Raised Yet to Deliver">RMA Raised Yet to Deliver</SelectItem>
              <SelectItem value="Sent to CDS">Sent to CDS</SelectItem>
              <SelectItem value="Replacement Shipped">Replacement Shipped</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalysis} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-dark-color">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Overdue</p>
                <p className="text-2xl font-bold text-white">{analysis.summary.totalOverdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-dark-color">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Critical (60+ days)</p>
                <p className="text-2xl font-bold text-red-500">{analysis.summary.criticalCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-dark-color">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Urgent (45-59 days)</p>
                <p className="text-2xl font-bold text-orange-500">{analysis.summary.urgentCount}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-dark-color">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Days Overdue</p>
                <p className="text-2xl font-bold text-white">{analysis.summary.averageDaysOverdue}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="bg-dark-card border-dark-color">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <Alert key={index} className={`${
                  rec.type === 'critical' ? 'border-red-500 bg-red-900/20' :
                  rec.type === 'urgent' ? 'border-orange-500 bg-orange-900/20' :
                  'border-blue-500 bg-blue-900/20'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">{rec.message}</div>
                    <div className="text-sm mt-1">{rec.action}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Tabs */}
      <Tabs defaultValue="overdue-list" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overdue-list">Overdue RMAs</TabsTrigger>
          <TabsTrigger value="by-status">By Status</TabsTrigger>
          <TabsTrigger value="by-priority">By Priority</TabsTrigger>
          <TabsTrigger value="by-site">By Site</TabsTrigger>
        </TabsList>

        <TabsContent value="overdue-list" className="space-y-4">
          <Card className="bg-dark-card border-dark-color">
            <CardHeader>
              <CardTitle className="text-white">Overdue RMA List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.overdueRMAs.map((rma) => {
                  const severity = getOverdueSeverity(rma.daysOverdue);
                  return (
                    <div key={rma._id} className="border border-dark-color rounded-lg p-4 hover:bg-dark-tag transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-blue-400">{rma.rmaNumber}</h3>
                            <Badge className={`${getPriorityColor(rma.priority)} text-white`}>
                              {rma.priority}
                            </Badge>
                            <Badge className={`${getStatusColor(rma.caseStatus)} text-white`}>
                              {rma.caseStatus}
                            </Badge>
                            <Badge className={`${severity.bg} ${severity.color}`}>
                              {severity.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Site:</span>
                              <div className="text-white">{rma.siteName}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Defective Part:</span>
                              <div className="text-white">
                                {rma.defectivePartName || rma.productName || 'N/A'}
                                {rma.defectivePartNumber && (
                                  <div className="text-xs text-gray-300">Part #: {rma.defectivePartNumber}</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Replacement Part:</span>
                              <div className="text-white">
                                {(() => {
                                  const replacedName = rma.replacedPartName || 'N/A';
                                  const defectiveName = rma.defectivePartName || rma.productName || 'Not Assigned';
                                  
                                  // Only replace if the replacement part name is clearly a symptom description
                                  const clearSymptomPatterns = [
                                    'integrator rod chipped',
                                    'prism chipped', 
                                    'segmen prism',
                                    'connection lost',
                                    'power cycle',
                                    'marriage failure',
                                    'imb marriage',
                                    'imb marriage failure'
                                  ];
                                  
                                  // Check if it's exactly a symptom pattern or contains clear symptom indicators
                                  const isSymptomDescription = replacedName === 'N/A' || 
                                    clearSymptomPatterns.some(pattern => replacedName.toLowerCase().includes(pattern.toLowerCase())) ||
                                    (replacedName.toLowerCase().includes('chipped') && replacedName.toLowerCase().includes('rod')) ||
                                    (replacedName.toLowerCase().includes('marriage') && replacedName.toLowerCase().includes('failure'));
                                  
                                  if (isSymptomDescription) {
                                    return defectiveName;
                                  }
                                  return replacedName;
                                })()}
                                {rma.replacedPartNumber && (
                                  <div className="text-xs text-gray-300">Part #: {rma.replacedPartNumber}</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Days Overdue:</span>
                              <div className={`font-bold ${severity.color}`}>{rma.daysOverdue}</div>
                            </div>
                          </div>
                          {rma.notes && (
                            <div className="mt-2">
                              <span className="text-gray-400">Notes:</span>
                              <div className="text-white text-sm">{rma.notes}</div>
                            </div>
                          )}
                          
                          {/* Last Update Display */}
                          {rma.lastUpdate && (
                            <div className="mt-3 p-2 bg-dark-tag border border-dark-color rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Last Update:</span>
                                <span className="text-sm text-white font-medium">{rma.lastUpdate.updatedBy?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">
                                  {rma.lastUpdate.updatedAt ? new Date(rma.lastUpdate.updatedAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300">{rma.lastUpdate.comment || 'No comment'}</p>
                            </div>
                          )}
                          
                          {/* Recent Comments Preview */}
                          {rma.publicComments && rma.publicComments.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Recent Updates:</span>
                                <Badge variant="outline" className="text-xs">
                                  {rma.totalComments || 0} total
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {rma.publicComments.slice(0, 2).map((comment, index) => (
                                  <div key={comment._id || index} className="bg-dark-tag border border-dark-color rounded p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-white font-medium">{comment.commentedBy?.name || 'Unknown'}</span>
                                      <span className="text-xs text-gray-500">
                                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-300 line-clamp-2">{comment.comment || 'No comment'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => {
                              setSelectedRMA(rma._id);
                              setShowComments(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-white border-gray-600 hover:bg-gray-700"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Comments ({rma.totalComments || 0})
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRMA(rma._id);
                              setShowComments(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-white border-gray-600 hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-status">
          <Card className="bg-dark-card border-dark-color">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Breakdown by Status</span>
                {selectedStatus && (
                  <Button 
                    onClick={handleBackToStatusList}
                    variant="outline" 
                    size="sm"
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Status List
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedStatus ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">
                    Click on any status to view all RMAs with that status
                  </div>
                  {Object.entries(analysis?.breakdown?.byStatus || {}).map(([status, count], index) => (
                    <div 
                      key={status} 
                      className={`group relative overflow-hidden border border-dark-color rounded-lg transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer ${
                        isAnimating ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'slideInFromLeft 0.5s ease-out forwards'
                      }}
                      onClick={() => handleStatusClick(status)}
                    >
                      <div className="flex justify-between items-center p-4 hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-purple-900/20 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Badge className={`${getStatusColor(status)} text-white text-sm px-3 py-1`}>
                              {status}
                            </Badge>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Package className="w-4 h-4" />
                            <span className="text-sm">{count} RMA{count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            {count}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">View Details</span>
                            <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Animated background effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className={`${getStatusColor(selectedStatus)} text-white text-lg px-4 py-2`}>
                      {selectedStatus}
                    </Badge>
                    <span className="text-gray-300">
                      {getRMAsByStatus(selectedStatus).length} RMA{getRMAsByStatus(selectedStatus).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid gap-4">
                    {getRMAsByStatus(selectedStatus).map((rma, index) => {
                      const severity = getOverdueSeverity(rma.daysOverdue);
                      return (
                        <div 
                          key={rma._id}
                          className="border border-dark-color rounded-lg p-4 hover:bg-dark-tag transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                          style={{
                            animationDelay: `${index * 150}ms`,
                            animation: 'slideInFromBottom 0.6s ease-out forwards'
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-semibold text-blue-400 text-lg">{rma.rmaNumber}</h3>
                                <Badge className={`${getPriorityColor(rma.priority)} text-white`}>
                                  {rma.priority}
                                </Badge>
                                <Badge className={`${severity.bg} ${severity.color}`}>
                                  {severity.label}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Site:</span>
                                  <div className="text-white font-medium">{rma.siteName}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Product:</span>
                                  <div className="text-white">{rma.productName}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Days Overdue:</span>
                                  <div className={`font-bold text-lg ${severity.color}`}>{rma.daysOverdue}</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-gray-400">Defective Part:</span>
                                  <div className="text-white">{rma.defectivePartName || 'N/A'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Replacement Part:</span>
                                  <div className="text-white">
                                    {(() => {
                                      const defectiveName = rma.defectivePartName || 'N/A';
                                      const replacedName = rma.replacedPartName || 'N/A';
                                      
                                      // Only replace if the replacement part name is clearly a symptom description
                                      const clearSymptomPatterns = [
                                        'integrator rod chipped',
                                        'prism chipped', 
                                        'segmen prism',
                                        'connection lost',
                                        'power cycle',
                                        'marriage failure',
                                        'imb marriage',
                                        'imb marriage failure'
                                      ];
                                      
                                      // Check if it's exactly a symptom pattern or contains clear symptom indicators
                                      const isSymptomDescription = replacedName === 'N/A' || 
                                        clearSymptomPatterns.some(pattern => replacedName.toLowerCase().includes(pattern.toLowerCase())) ||
                                        (replacedName.toLowerCase().includes('chipped') && replacedName.toLowerCase().includes('rod')) ||
                                        (replacedName.toLowerCase().includes('marriage') && replacedName.toLowerCase().includes('failure'));
                                      
                                      if (isSymptomDescription) {
                                        return defectiveName;
                                      }
                                      return replacedName;
                                    })()}
                                  </div>
                                </div>
                              </div>
                              
                              {rma.notes && (
                                <div className="mt-3">
                                  <span className="text-gray-400">Notes:</span>
                                  <div className="text-white text-sm bg-gray-800/50 p-2 rounded mt-1">{rma.notes}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-priority">
          <Card className="bg-dark-card border-dark-color">
            <CardHeader>
              <CardTitle className="text-white">Breakdown by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analysis?.breakdown?.byPriority || {}).map(([priority, count], index) => (
                  <div 
                    key={priority} 
                    className="group relative overflow-hidden border border-dark-color rounded-lg transition-all duration-300 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInFromLeft 0.5s ease-out forwards'
                    }}
                  >
                    <div className="flex justify-between items-center p-4 hover:bg-gradient-to-r hover:from-orange-900/20 hover:to-red-900/20 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Badge className={`${getPriorityColor(priority)} text-white text-sm px-3 py-1`}>
                            {priority}
                          </Badge>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Target className="w-4 h-4" />
                          <span className="text-sm">{count} RMA{count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
                        {count}
                      </div>
                    </div>
                    
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-site">
          <Card className="bg-dark-card border-dark-color">
            <CardHeader>
              <CardTitle className="text-white">Breakdown by Site</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analysis?.breakdown?.bySite || {})
                  .sort(([,a], [,b]) => b - a)
                  .map(([site, count], index) => (
                  <div 
                    key={site} 
                    className="group relative overflow-hidden border border-dark-color rounded-lg transition-all duration-300 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInFromLeft 0.5s ease-out forwards'
                    }}
                  >
                    <div className="flex justify-between items-center p-4 hover:bg-gradient-to-r hover:from-green-900/20 hover:to-blue-900/20 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Building className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <span className="text-white font-medium">{site}</span>
                          <span className="text-sm">({count} RMA{count !== 1 ? 's' : ''})</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                        {count}
                      </div>
                    </div>
                    
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comment Modal */}
      {showComments && selectedRMA && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-color rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-dark-color">
              <h3 className="text-lg font-semibold text-white">
                RMA Comments & Updates
              </h3>
              <Button
                onClick={() => {
                  setShowComments(false);
                  setSelectedRMA(null);
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <RMACommentSystem
                rmaId={selectedRMA}
                rmaNumber={analysis?.overdueRMAs.find(rma => rma._id === selectedRMA)?.rmaNumber || 'Unknown'}
                onCommentAdded={() => {
                  console.log('🔄 Comment added callback triggered - refreshing analysis...');
                  loadAnalysis(); // Refresh the analysis to show updated comments
                }}
                showInternalComments={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
