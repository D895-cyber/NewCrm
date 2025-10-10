import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  FileText,
  Upload,
  Send
} from 'lucide-react';
import { apiClient } from '../utils/api/client';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  partNumber: string;
  siteId: string;
  siteName?: string;
  onCommentAdded?: () => void;
}

export function CommentModal({ 
  isOpen, 
  onClose, 
  partName, 
  partNumber, 
  siteId, 
  siteName,
  onCommentAdded 
}: CommentModalProps) {
  const [comment, setComment] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentTypes = [
    { value: 'status_update', label: 'Status Update', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { value: 'issue_note', label: 'Issue Note', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
    { value: 'resolution', label: 'Resolution', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'escalation', label: 'Escalation', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
    { value: 'general', label: 'General', icon: MessageSquare, color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !authorName.trim() || !authorRole.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const commentData = {
        comment: comment.trim(),
        commentType,
        priority,
        authorName: authorName.trim(),
        authorRole: authorRole.trim(),
        isInternal,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        siteName: siteName || siteId
      };

      await apiClient.post(
        `/part-comments/part/${encodeURIComponent(partName)}/${encodeURIComponent(partNumber)}/site/${siteId}`,
        commentData
      );

      // Reset form
      setComment('');
      setCommentType('general');
      setPriority('medium');
      setAuthorName('');
      setAuthorRole('');
      setIsInternal(false);
      setTags('');
      
      onCommentAdded?.();
      onClose();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      setError(error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Add Comment
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Part and Site Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Part:</span>
                <p className="text-gray-900">{partName}</p>
                <p className="text-gray-600 text-xs">{partNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Site:</span>
                <p className="text-gray-900">{siteName || siteId}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Comment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setCommentType(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        commentType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <div className="flex gap-2">
                {priorities.map((priorityOption) => (
                  <button
                    key={priorityOption.value}
                    type="button"
                    onClick={() => setPriority(priorityOption.value)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all ${
                      priority === priorityOption.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Badge className={priorityOption.color}>
                      {priorityOption.label}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Role *
                </label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Site Manager, Technician"
                  required
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the current status, issue, or resolution..."
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="vendor-delay, waiting-parts, technical-issue (comma separated)"
              />
            </div>

            {/* Internal Note */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isInternal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isInternal" className="text-sm text-gray-700">
                Internal note (only visible to internal team)
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Add Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




