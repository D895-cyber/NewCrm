import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar,
  Filter,
  Search,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  Building
} from 'lucide-react';
import { CommentModal } from './CommentModal';

interface PartAnalyticsProps {
  partData: {
    summary: {
      totalParts: number;
      partsWithPending: number;
      avgPendingDays: number;
      criticalParts: number;
      totalPendingCost: number;
    };
    parts: Array<{
      partName: string;
      partNumber: string;
      totalCount: number;
      pendingCount: number;
      completedCount: number;
      completionRate: number;
      avgPendingDays: number;
      maxPendingDays: number;
      avgResolutionDays: number;
      totalCost: number;
      avgCost: number;
      lastStatus: string;
      lastUpdateDate: string;
      statusBreakdown: Record<string, number>;
      affectedSites: number;
      activeSitesCount: number;
      sites: string[];
      siteBreakdown: Array<{
        siteId: string;
        siteName: string;
        totalCount: number;
        pendingCount: number;
        completedCount: number;
        completionRate: number;
        avgPendingDays: number;
        maxPendingDays: number;
        totalCost: number;
        avgCost: number;
        lastStatus: string;
        lastRmaDate: string;
        statusBreakdown: Record<string, number>;
        latestComment: {
          id: string;
          comment: string;
          author: string;
          role: string;
          timestamp: string;
          timeAgo: string;
          commentType: string;
          priority: string;
          isInternal: boolean;
        } | null;
      }>;
      priority: number;
    }>;
    lastUpdated: string;
  };
}

export function PartAnalytics({ partData }: PartAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentModalData, setCommentModalData] = useState<{
    partName: string;
    partNumber: string;
    siteId: string;
    siteName: string;
  } | null>(null);

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 6) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Closed':
        return 'text-green-600 bg-green-100';
      case 'Under Review':
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'In Progress':
        return 'text-blue-600 bg-blue-100';
      case 'Rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'status_update':
        return 'bg-blue-100 text-blue-800';
      case 'issue_note':
        return 'bg-orange-100 text-orange-800';
      case 'resolution':
        return 'bg-green-100 text-green-800';
      case 'escalation':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'status_update':
        return <Clock className="w-4 h-4" />;
      case 'issue_note':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolution':
        return <CheckCircle className="w-4 h-4" />;
      case 'escalation':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const togglePartExpansion = (partKey: string) => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(partKey)) {
      newExpanded.delete(partKey);
    } else {
      newExpanded.add(partKey);
    }
    setExpandedParts(newExpanded);
  };

  const handleAddComment = (partName: string, partNumber: string, siteId: string, siteName: string) => {
    setCommentModalData({
      partName,
      partNumber,
      siteId,
      siteName
    });
    setShowCommentModal(true);
  };

  const handleCommentAdded = () => {
    // Refresh the data or show success message
    console.log('Comment added successfully');
    // You can add a refresh mechanism here if needed
  };

  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setCommentModalData(null);
  };

  const filteredParts = partData.parts.filter(part => {
    const matchesSearch = part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'pending' && part.pendingCount > 0) ||
                         (filterStatus === 'under_review' && part.activeSitesCount > 0) ||
                         (filterStatus === 'critical' && part.priority >= 8) ||
                         (filterStatus === 'completed' && part.completedCount > 0);
    
    return matchesSearch && matchesFilter;
  });

  const sortedParts = [...filteredParts].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return b.priority - a.priority;
      case 'pendingDays':
        return b.avgPendingDays - a.avgPendingDays;
      case 'pendingCount':
        return b.pendingCount - a.pendingCount;
      case 'sitesUnderReview':
        return (b.activeSitesCount || 0) - (a.activeSitesCount || 0);
      case 'cost':
        return b.totalCost - a.totalCost;
      case 'name':
        return a.partName.localeCompare(b.partName);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-gray-900">{partData.summary.totalParts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sites Under Review</p>
                <p className="text-2xl font-bold text-orange-600">
                  {partData.parts.reduce((sum, part) => sum + (part.activeSitesCount || 0), 0)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Parts</p>
                <p className="text-2xl font-bold text-red-600">{partData.summary.criticalParts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Pending Days</p>
                <p className="text-2xl font-bold text-gray-900">{partData.summary.avgPendingDays}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{(partData.summary.totalPendingCost || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search parts by name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Parts</option>
                <option value="pending">Pending Only</option>
                <option value="under_review">Sites Under Review</option>
                <option value="critical">Critical Only</option>
                <option value="completed">Completed Only</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="priority">Sort by Priority</option>
                <option value="pendingDays">Sort by Pending Days</option>
                <option value="pendingCount">Sort by Pending Count</option>
                <option value="sitesUnderReview">Sort by Sites Under Review</option>
                <option value="cost">Sort by Cost</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts List */}
      <div className="space-y-4">
        {sortedParts.map((part, index) => {
          const partKey = `${part.partName}-${part.partNumber}`;
          const isExpanded = expandedParts.has(partKey);
          
          return (
            <Card key={partKey} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Part Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Part Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePartExpansion(partKey)}
                        className="p-1 h-auto"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <h3 className="text-lg font-semibold text-gray-900">{part.partName}</h3>
                      <Badge className={getPriorityColor(part.priority)}>
                        Priority {part.priority}/10
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">Part Number: {part.partNumber}</p>
                    
                    {/* Status and Progress */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge className={getStatusColor(part.lastStatus)}>
                          {part.lastStatus}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Completion:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={part.completionRate} className="w-20 h-2" />
                          <span className="text-sm text-gray-600">{part.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Cases:</span>
                        <span className="ml-2 font-medium">{part.totalCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pending:</span>
                        <span className="ml-2 font-medium text-orange-600">{part.pendingCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Pending Days:</span>
                        <span className="ml-2 font-medium text-red-600">{part.avgPendingDays}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Pending Days:</span>
                        <span className="ml-2 font-medium text-red-600">{part.maxPendingDays}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cost and Sites Info */}
                  <div className="lg:text-right">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-end">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-gray-900">
                          ₹{(part.totalCost || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 justify-end">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-gray-600">
                          {part.activeSitesCount || 0} sites under review
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(part.lastUpdateDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Site Breakdown (Expanded View) */}
                {isExpanded && part.siteBreakdown && part.siteBreakdown.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        Sites Under Review
                      </h4>
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        {part.siteBreakdown.length} sites with pending cases
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {part.siteBreakdown.map((site, siteIndex) => (
                        <Card key={`${site.siteId}-${siteIndex}`} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              {/* Site Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-medium text-gray-900">{site.siteName}</h5>
                                  <Badge className={getStatusColor(site.lastStatus)}>
                                    {site.lastStatus}
                                  </Badge>
                                </div>
                                
                                {/* Site Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Cases:</span>
                                    <span className="ml-2 font-medium">{site.totalCount}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Pending:</span>
                                    <span className="ml-2 font-medium text-orange-600">{site.pendingCount}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Avg Days:</span>
                                    <span className="ml-2 font-medium text-red-600">{site.avgPendingDays}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Cost:</span>
                                    <span className="ml-2 font-medium">₹{(site.totalCost || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                                
                                {/* Latest Comment */}
                                {site.latestComment && (
                                  <div className="mt-3 p-3 bg-white rounded-lg border">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getCommentTypeIcon(site.latestComment.commentType)}
                                        <Badge className={getCommentTypeColor(site.latestComment.commentType)}>
                                          {site.latestComment.commentType.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {site.latestComment.priority}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {site.latestComment.timeAgo}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">
                                      {site.latestComment.comment}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <User className="w-3 h-3" />
                                        <span>{site.latestComment.author} ({site.latestComment.role})</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs"
                                          onClick={() => handleAddComment(part.partName, part.partNumber, site.siteId, site.siteName)}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Add Comment
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* No Comment State */}
                                {!site.latestComment && (
                                  <div className="mt-3 p-3 bg-gray-100 rounded-lg border-dashed border-2 border-gray-300">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>No comments yet</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => handleAddComment(part.partName, part.partNumber, site.siteId, site.siteName)}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Comment
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Collapsed Sites Summary */}
                {!isExpanded && (part.activeSitesCount > 0 || part.sites.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        {part.activeSitesCount > 0 ? 'Sites Under Review:' : 'All Sites:'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePartExpansion(partKey)}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {part.sites.slice(0, 3).map((site, siteIndex) => (
                        <Badge key={siteIndex} variant="outline" className="text-xs">
                          {site}
                        </Badge>
                      ))}
                      {part.affectedSites > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{part.affectedSites - 3} more
                        </Badge>
                      )}
                    </div>
                    {part.activeSitesCount > 0 && (
                      <div className="mt-2 text-xs text-orange-600">
                        {part.activeSitesCount} sites have pending cases requiring attention
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {sortedParts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comment Modal */}
      {commentModalData && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={handleCloseCommentModal}
          partName={commentModalData.partName}
          partNumber={commentModalData.partNumber}
          siteId={commentModalData.siteId}
          siteName={commentModalData.siteName}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}
