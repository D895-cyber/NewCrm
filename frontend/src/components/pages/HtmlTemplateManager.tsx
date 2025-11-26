import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2,
  Plus,
  Code,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { apiClient } from '../../utils/api/client';

interface HtmlTemplate {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export function HtmlTemplateManager() {
  const [templates, setTemplates] = useState<HtmlTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/html-to-pdf/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      if (!newTemplate.name || !newTemplate.content) {
        alert('Please provide template name and HTML content');
        return;
      }

      setLoading(true);

      const response = await fetch('/api/html-to-pdf/upload-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          templateName: newTemplate.name,
          htmlContent: newTemplate.content
        })
      });

      if (response.ok) {
        alert('✅ Template uploaded successfully!');
        setShowUpload(false);
        setNewTemplate({ name: '', content: '' });
        loadTemplates();
      } else {
        const error = await response.json();
        alert(`❌ Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      alert('Failed to upload template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateName: string) => {
    if (!confirm(`Delete template "${templateName}"?`)) return;

    try {
      const response = await fetch(`/api/html-to-pdf/template/${templateName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('✅ Template deleted successfully!');
        loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handlePreview = async (templateName: string) => {
    try {
      const response = await fetch(`/api/html-to-pdf/template/${templateName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewHtml(data.content);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const loadSampleTemplate = () => {
    setNewTemplate({
      name: 'my_custom_report',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{cinemaName}} - Service Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f4f4f4;
        }
        .status-ok { color: green; font-weight: bold; }
        .status-fail { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ASCOMP Service Report</h1>
        <p>{{cinemaName}} - {{formattedDate}}</p>
    </div>

    <table>
        <tr>
            <th>Field</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>Report Number</td>
            <td>{{reportNumber}}</td>
        </tr>
        <tr>
            <td>Projector</td>
            <td>{{projectorModelSerialAndHours}}</td>
        </tr>
        <tr>
            <td>Engineer</td>
            <td>{{engineer.name}} ({{engineer.phone}})</td>
        </tr>
        <tr>
            <td>Location</td>
            <td>{{location}}</td>
        </tr>
    </table>

    <h2>Checklist</h2>
    <table>
        <tr>
            <th>Item</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>Reflector</td>
            <td class="{{#ifEquals opticals.reflector.status 'OK'}}status-ok{{/ifEquals}}{{#ifEquals opticals.reflector.status 'FAIL'}}status-fail{{/ifEquals}}">
                {{default opticals.reflector.status 'N/A'}}
            </td>
        </tr>
        <tr>
            <td>UV Filter</td>
            <td class="{{#ifEquals opticals.uvFilter.status 'OK'}}status-ok{{/ifEquals}}{{#ifEquals opticals.uvFilter.status 'FAIL'}}status-fail{{/ifEquals}}">
                {{default opticals.uvFilter.status 'N/A'}}
            </td>
        </tr>
    </table>

    {{#if engineerSignature}}
    <div style="margin-top: 40px;">
        <h3>Engineer Signature:</h3>
        <img src="{{engineerSignature}}" alt="Signature" style="max-width: 200px; border: 1px solid #ddd; padding: 10px;">
    </div>
    {{/if}}
</body>
</html>`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HTML Template Manager</h1>
              <p className="text-gray-600 mt-1">
                Create custom report templates with HTML & CSS
              </p>
            </div>
            <Button 
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {showUpload ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showUpload ? 'Cancel' : 'New Template'}
            </Button>
          </div>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Create HTML Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <Input
                    placeholder="e.g., ascomp_report_v2"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      HTML Content
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSampleTemplate}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Load Sample
                    </Button>
                  </div>
                  <textarea
                    className="w-full h-96 p-4 border rounded-md font-mono text-sm"
                    placeholder="Paste your HTML here with {{placeholders}}"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Use placeholders like {'{'}{'{'}cinemaName{'}'}{'}'}, {'{'}{'{'}formattedDate{'}'}{'}'}, {'{'}{'{'}engineer.name{'}'}{'}'}, etc.
                    <br />
                    📚 See full placeholder list in: <code>HTML_TEMPLATE_SYSTEM_GUIDE.md</code>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Uploading...' : 'Upload Template'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUpload(false);
                      setNewTemplate({ name: '', content: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Templates ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first HTML template to get started
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">
                          Size: {(template.size / 1024).toFixed(2)} KB | 
                          Modified: {new Date(template.modified).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template.name)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Template Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                  <code>{previewHtml}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">How to Use</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Create your HTML template with placeholders like <code>{'{'}{'{'}cinemaName{'}'}{'}'}</code></li>
                <li>Upload it here or save to <code>backend/server/templates/html/</code></li>
                <li>Use API: <code>POST /api/html-to-pdf/generate/:reportId</code> to generate PDF</li>
                <li>Full guide: <code>HTML_TEMPLATE_SYSTEM_GUIDE.md</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







