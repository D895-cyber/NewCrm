import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2, Upload, File, X, Download } from "lucide-react";
import { apiClient } from "../../utils/api/client";

interface TechnicalHead {
  userId: string;
  username: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  role: string;
}

interface AssignDTRToTechnicalHeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dtrId: string;
  dtrCaseId: string;
  currentAssignee?: string;
  onAssigned: () => void;
}

export function AssignDTRToTechnicalHeadDialog({
  open,
  onOpenChange,
  dtrId,
  dtrCaseId,
  currentAssignee,
  onAssigned
}: AssignDTRToTechnicalHeadDialogProps) {
  const [technicalHeads, setTechnicalHeads] = useState<TechnicalHead[]>([]);
  const [selectedTechnicalHead, setSelectedTechnicalHead] = useState<string>('');
  const [isLoadingTechnicalHeads, setIsLoadingTechnicalHeads] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadTechnicalHeads();
      loadExistingAttachments();
    }
  }, [open]);

  const loadExistingAttachments = async () => {
    try {
      const response = await apiClient.get(`/dtr/${dtrId}/attachments`);
      if (response.success) {
        setExistingAttachments(response.data.attachments || []);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/zip' || 
                         file.name.endsWith('.zip');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        setError(`File ${file.name} is not a valid type. Only images and ZIP files are allowed.`);
        return false;
      }
      if (!isValidSize) {
        setError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploadingFiles(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await apiClient.post(`/dtr/${dtrId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        setSelectedFiles([]);
        await loadExistingAttachments();
        setSuccess('Files uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const downloadAttachment = async (filename: string, originalName: string) => {
    try {
      const response = await apiClient.get(`/dtr/${dtrId}/attachments/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download file');
    }
  };

  const loadTechnicalHeads = async () => {
    setIsLoadingTechnicalHeads(true);
    try {
      const response = await apiClient.get('/dtr/users/technical-heads');
      setTechnicalHeads(response.data || response);
    } catch (error) {
      console.error('Error loading technical heads:', error);
      setError('Failed to load technical heads');
    } finally {
      setIsLoadingTechnicalHeads(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnicalHead) {
      setError("Please select a technical head");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const technicalHead = technicalHeads.find(th => th.userId === selectedTechnicalHead);
      
      if (!technicalHead) {
        throw new Error("Selected technical head not found");
      }

      await apiClient.post(`/dtr/${dtrId}/assign-technical-head`, {
        technicalHeadId: technicalHead.userId,
        technicalHeadName: technicalHead.profile?.firstName && technicalHead.profile?.lastName
          ? `${technicalHead.profile.firstName} ${technicalHead.profile.lastName}`
          : technicalHead.username,
        technicalHeadEmail: technicalHead.email,
        assignedBy: 'rma_handler'
      });

      setSuccess(`Successfully assigned to ${technicalHead.username}`);
      
      // Close dialog after 1.5 seconds
      setTimeout(() => {
        onAssigned();
        onOpenChange(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign to technical head");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Assign DTR to Technical Head
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>DTR Case ID:</strong> {dtrCaseId}
            </p>
            {currentAssignee && (
              <p className="text-sm text-blue-700 mt-1">
                <strong>Currently assigned to:</strong> {currentAssignee}
              </p>
            )}
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label>Attach Files (Images & Logs)</Label>
            
            {/* File Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to select files or drag and drop
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Supported: Images (JPEG, PNG, GIF, WebP) and ZIP files (max 50MB each)
                </p>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Files:</Label>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={uploadFiles}
                  disabled={isUploadingFiles}
                  className="w-full"
                >
                  {isUploadingFiles ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Existing Attachments:</Label>
                {existingAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{attachment.originalName}</span>
                      <span className="text-xs text-gray-500">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAttachment(attachment.filename, attachment.originalName)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Technical Head *</Label>
            <Select 
              value={selectedTechnicalHead} 
              onValueChange={setSelectedTechnicalHead}
              disabled={isLoadingTechnicalHeads}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTechnicalHeads ? "Loading technical heads..." : "Select Technical Head"} />
              </SelectTrigger>
              <SelectContent>
                {technicalHeads.map((technicalHead) => (
                  <SelectItem key={technicalHead.userId} value={technicalHead.userId}>
                    {technicalHead.profile?.firstName && technicalHead.profile?.lastName 
                      ? `${technicalHead.profile.firstName} ${technicalHead.profile.lastName}`
                      : technicalHead.username} ({technicalHead.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {technicalHeads.length === 0 && !isLoadingTechnicalHeads && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No technical heads found.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedTechnicalHead || isSubmitting || technicalHeads.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign to Technical Head'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
