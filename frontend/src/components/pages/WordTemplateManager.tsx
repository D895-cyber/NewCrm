import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';

interface Template {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export function WordTemplateManager() {
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:4000/api/word-templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's a .docx file
      if (!file.name.endsWith('.docx')) {
        setError('Please select a .docx file');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Auto-generate template name from filename
      const name = file.name.replace('.docx', '');
      setTemplateName(name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName) {
      setError('Please select a file and provide a template name');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('template', selectedFile);
      formData.append('templateName', templateName);

      const response = await fetch('http://localhost:4000/api/word-templates/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload template');
      }

      const data = await response.json();
      setSuccess(`Template "${data.templateName}" uploaded successfully!`);
      
      // Reset form
      setSelectedFile(null);
      setTemplateName('');
      
      // Reload templates
      loadTemplates();
    } catch (err: any) {
      console.error('Error uploading template:', err);
      setError(err.message || 'Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateName: string) => {
    if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`http://localhost:4000/api/word-templates/${encodeURIComponent(templateName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete template');
      }

      setSuccess(`Template "${templateName}" deleted successfully!`);
      loadTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Check if user is admin or manager
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Template management is only available to Administrators and Managers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Word Template Manager</h1>
          <p className="text-gray-600">
            Upload and manage Word document templates for ASCOMP reports
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Upload Template Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="templateFile">Select Word Document (.docx)</Label>
              <Input
                id="templateFile"
                type="file"
                accept=".docx"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., ASCOMP_EW_Report"
              />
              <p className="text-sm text-gray-500 mt-1">
                This name will be used to identify the template in the system
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !templateName || uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Template
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Existing Templates
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadTemplates} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-600">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No templates uploaded yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Upload a Word document template to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.name}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(template.size)} • Last modified: {formatDate(template.modified)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">1.</span>
              <p>Prepare your Word document with placeholders like <code className="bg-gray-100 px-2 py-1 rounded">{`{{cinemaName}}`}</code></p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">2.</span>
              <p>Upload the template using the form above</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">3.</span>
              <p>When FSEs create reports, the system will use this template</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">4.</span>
              <p>Generated reports will have your exact formatting!</p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">
                <strong>📖 Need help?</strong> Check the <code>WORD_TEMPLATE_GUIDE.md</code> file for complete documentation and placeholder list.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







