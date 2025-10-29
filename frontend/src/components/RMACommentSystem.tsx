import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  MessageSquare, 
  Send, 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  FileText,
  TrendingUp,
  Shield
} from 'lucide-react';
import { apiClient } from '../utils/api/client';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  _id: string;
  comment: string;
  commentedBy: {
    userId: string;
    name: string;
    email?: string;
  };
  commentType: 'update' | 'status_change' | 'note' | 'escalation' | 'resolution';
  isInternal: boolean;
  attachments: Array<{
    filename: string;
    url: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface LastUpdate {
  comment: string;
  updatedBy: {
    userId: string;
    name: string;
  };
  updatedAt: string;
}

interface RMACommentSystemProps {
  rmaId: string;
  rmaNumber: string;
  onCommentAdded?: () => void;
  showInternalComments?: boolean;
  compact?: boolean;
}

export function RMACommentSystem({ 
  rmaId, 
  rmaNumber, 
  onCommentAdded, 
  showInternalComments = false,
  compact = false 
}: RMACommentSystemProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'update' | 'status_change' | 'note' | 'escalation' | 'resolution'>('update');
  const [isInternal, setIsInternal] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadComments();
  }, [rmaId, showInternalComments]);

  // Debug: Log when comments state changes
  useEffect(() => {
    console.log('🔄 Comments state updated:', comments.length, 'comments');
  }, [comments]);

  const loadComments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading comments for RMA:', rmaId);
      const response = await apiClient.getRMAComments(rmaId, showInternalComments);
      console.log('📥 Comments response:', response);
      const newComments = response.comments || [];
      console.log('🔄 Setting comments state:', newComments.length, 'comments');
      setComments(newComments);
      setLastUpdate(response.lastUpdate);
      console.log('✅ Comments loaded:', newComments.length, 'comments');
    } catch (error) {
      console.error('❌ Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      console.log('🔍 User info being passed to comment:', user);
      if (!user) {
        console.warn('⚠️ No user information available, comment will be anonymous');
      }
      console.log('📤 Adding comment...');
      await apiClient.addRMAComment(rmaId, newComment.trim(), commentType, isInternal, user);
      console.log('✅ Comment added successfully');

      setNewComment('');
      setCommentType('update');
      setIsInternal(false);
      
      console.log('🔄 Refreshing comments...');
      await loadComments();
      console.log('✅ Comments refreshed');
      
      console.log('📞 Calling onCommentAdded callback...');
      onCommentAdded?.();
      console.log('✅ onCommentAdded callback called');
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await apiClient.updateRMAComment(rmaId, commentId, editText.trim(), user);

      setEditingComment(null);
      setEditText('');
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.deleteRMAComment(rmaId, commentId, user);
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'escalation': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'resolution': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'note': return <FileText className="w-4 h-4 text-gray-500" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'bg-blue-100 text-blue-800';
      case 'escalation': return 'bg-red-100 text-red-800';
      case 'resolution': return 'bg-green-100 text-green-800';
      case 'note': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const canEditComment = (comment: Comment) => {
    return comment.commentedBy.userId === user?.id || user?.role === 'admin';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {lastUpdate && (
          <div className="bg-dark-tag border border-dark-color rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Last Update:</span>
              <span className="text-sm text-white font-medium">{lastUpdate.updatedBy.name}</span>
            </div>
            <p className="text-sm text-gray-300">{lastUpdate.comment}</p>
            <span className="text-xs text-gray-500">
              {formatDate(lastUpdate.updatedAt)}
            </span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="Add update comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-dark-card border-dark-color">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments & Updates
          {lastUpdate && (
            <Badge variant="outline" className="text-xs">
              Last: {lastUpdate.updatedBy.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment or update..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-dark-tag border-dark-color text-white placeholder-gray-400"
            rows={3}
          />
          
          <div className="flex gap-2 items-center">
            <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
              <SelectTrigger className="w-40 bg-dark-tag border-dark-color text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="status_change">Status Change</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="escalation">Escalation</SelectItem>
                <SelectItem value="resolution">Resolution</SelectItem>
              </SelectContent>
            </Select>

            {user?.role === 'admin' && (
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded"
                />
                <Shield className="w-4 h-4" />
                Internal
              </label>
            )}

            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="ml-auto"
            >
              {submitting ? 'Adding...' : 'Add Comment'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-4 text-gray-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-400">No comments yet</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment._id} className="bg-dark-tag border border-dark-color rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">{comment.commentedBy.name}</span>
                    <Badge className={`text-xs ${getCommentTypeColor(comment.commentType)}`}>
                      {getCommentTypeIcon(comment.commentType)}
                      <span className="ml-1 capitalize">{comment.commentType.replace('_', ' ')}</span>
                    </Badge>
                    {comment.isInternal && (
                      <Badge variant="outline" className="text-xs text-orange-400 border-orange-400">
                        <Shield className="w-3 h-3 mr-1" />
                        Internal
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {canEditComment(comment) && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingComment(comment._id);
                            setEditText(comment.comment);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment._id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {editingComment === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-dark-card border-dark-color text-white"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment._id)}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.comment}</p>
                )}

                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Attachments:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {comment.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          {attachment.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
