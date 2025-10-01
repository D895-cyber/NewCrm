import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, RefreshCw, FileText, CheckCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { apiClient } from '../../utils/api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ReportTemplate {
  _id: string;
  name: string;
  reportType?: string;
  description?: string;
  version?: string;
  isDefault?: boolean;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  storage?: {
    cloudUrl: string;
    publicId?: string;
    bytes?: number;
  };
  fieldMappings?: FieldMapping[];
}

interface FieldMapping {
  token: string;
  dataPath: string;
  defaultValue?: string;
}

const COMMON_MAPPINGS: FieldMapping[] = [
  { token: 'REPORT_NUMBER', dataPath: 'reportNumber' },
  { token: 'REPORT_DATE', dataPath: 'reportDate' },
  { token: 'REPORT_TYPE', dataPath: 'reportType' },
  { token: 'SITE_NAME', dataPath: 'siteName' },
  { token: 'SITE_INCHARGE_NAME', dataPath: 'siteInchargeName' },
  { token: 'SITE_INCHARGE_CONTACT', dataPath: 'siteInchargeContact' },
  { token: 'ENGINEER_NAME', dataPath: 'engineerName' },
  { token: 'ENGINEER_EMAIL', dataPath: 'engineerEmail' },
  { token: 'ENGINEER_PHONE', dataPath: 'engineerPhone' },
  { token: 'PROJECTOR_MODEL', dataPath: 'projectorModel' },
  { token: 'PROJECTOR_SERIAL', dataPath: 'projectorSerial' },
  { token: 'PROJECTOR_BRAND', dataPath: 'brand' },
  { token: 'SOFTWARE_VERSION', dataPath: 'softwareVersion' },
  { token: 'PROJECTOR_RUNNING_HOURS', dataPath: 'projectorRunningHours' },
  { token: 'LAMP_MODEL', dataPath: 'lampModel' },
  { token: 'LAMP_RUNNING_HOURS', dataPath: 'lampRunningHours' },
  { token: 'CURRENT_LAMP_HOURS', dataPath: 'currentLampHours' },
  { token: 'LAMP_REPLACEMENT_REQUIRED', dataPath: 'replacementRequired', defaultValue: 'No' },
  { token: 'VOLTAGE_P_VS_N', dataPath: 'voltageParameters.pVsN' },
  { token: 'VOLTAGE_P_VS_E', dataPath: 'voltageParameters.pVsE' },
  { token: 'VOLTAGE_N_VS_E', dataPath: 'voltageParameters.nVsE' },
  { token: 'LAMP_FL_BEFORE_PM', dataPath: 'lampPowerMeasurements.flBeforePM' },
  { token: 'LAMP_FL_AFTER_PM', dataPath: 'lampPowerMeasurements.flAfterPM' },
  { token: 'AIR_OVERALL', dataPath: 'airPollutionLevel.overall' },
  { token: 'AIR_PM25', dataPath: 'airPollutionLevel.pm25' },
  { token: 'AIR_PM10', dataPath: 'airPollutionLevel.pm10' },
  { token: 'ROOM_TEMPERATURE', dataPath: 'environmentalConditions.temperature' },
  { token: 'ROOM_HUMIDITY', dataPath: 'environmentalConditions.humidity' },
  { token: 'CONTENT_SERVER', dataPath: 'contentPlayingServer' },
  { token: 'NOTES', dataPath: 'notes' }
];

export function ReportTemplatesPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    reportType: '',
    description: '',
    version: '',
    isDefault: false,
    file: null as File | null
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isFieldMapSaving, setIsFieldMapSaving] = useState(false);
  const [isFieldMapLoading, setIsFieldMapLoading] = useState(false);
  const fieldMapSectionRef = useRef<HTMLDivElement | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      if (token) {
        apiClient.setAuthToken(token);
      }
      const data = await apiClient.getReportTemplates();
      setTemplates(data || []);
    } catch (loadError: any) {
      console.error('Error loading report templates:', loadError);
      setError(loadError.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleInputChange('file', file);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.file) {
      setError('Please select a DOCX template file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      if (token) {
        apiClient.setAuthToken(token);
      }

      const formData = new FormData();
      formData.append('template', formValues.file);
      formData.append('name', formValues.name || formValues.file.name);
      if (formValues.reportType) formData.append('reportType', formValues.reportType);
      if (formValues.description) formData.append('description', formValues.description);
      if (formValues.version) formData.append('version', formValues.version);
      formData.append('isDefault', formValues.isDefault ? 'true' : 'false');

      await apiClient.uploadReportTemplate(formData);

      setSuccess('Template uploaded successfully');
      setFormValues({ name: '', reportType: '', description: '', version: '', isDefault: false, file: null });
      await loadTemplates();
    } catch (uploadError: any) {
      console.error('Error uploading report template:', uploadError);
      setError(uploadError.message || 'Template upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      if (token) {
        apiClient.setAuthToken(token);
      }
      await apiClient.deleteReportTemplate(id);
      setSuccess('Template deleted');
      await loadTemplates();
    } catch (deleteError: any) {
      console.error('Error deleting template:', deleteError);
      setError(deleteError.message || 'Failed to delete template');
    }
  };

  const loadFieldMappings = async (template: ReportTemplate) => {
    try {
      setIsFieldMapLoading(true);
      setSelectedTemplate(template);
      setFieldMappings([]);
      if (token) {
        apiClient.setAuthToken(token);
      }
      const mappings = await apiClient.getReportTemplateFieldMap(template._id);
      setFieldMappings(mappings || []);
      setTimeout(() => {
        fieldMapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Error loading field mappings:', error);
      setError(error.message || 'Failed to load field mappings');
    } finally {
      setIsFieldMapLoading(false);
    }
  };

  const handleAddMapping = () => {
    setFieldMappings(prev => ([...prev, { token: '', dataPath: '', defaultValue: '' }]));
  };

  const handleLoadCommonMappings = () => {
    setFieldMappings(prev => {
      const existingTokens = new Set(prev.map(m => m.token?.toUpperCase()));
      const merged = [...prev];
      COMMON_MAPPINGS.forEach(mapping => {
        if (!existingTokens.has(mapping.token.toUpperCase())) {
          merged.push({ ...mapping });
        }
      });
      return merged;
    });
  };

  const handleUpdateMapping = (index: number, key: keyof FieldMapping, value: string) => {
    setFieldMappings(prev => prev.map((mapping, i) => i === index ? { ...mapping, [key]: value } : mapping));
  };

  const handleRemoveMapping = (index: number) => {
    setFieldMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveMappings = async () => {
    if (!selectedTemplate) return;
    try {
      setIsFieldMapSaving(true);
      setError(null);
      setSuccess(null);
      if (token) {
        apiClient.setAuthToken(token);
      }
      await apiClient.updateReportTemplateFieldMap(selectedTemplate._id, fieldMappings);
      setSuccess('Field mappings saved');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error saving field mappings:', error);
      setError(error.message || 'Failed to save field mappings');
    } finally {
      setIsFieldMapSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Templates</h1>
            <p className="text-gray-600 mt-1">
              Manage Word templates used to auto-generate service report documents
            </p>
          </div>
          <Button onClick={loadTemplates} variant="outline" className="gap-2">
            <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Template
            </CardTitle>
            <CardDescription>
              Upload a Word `.docx` file with merge placeholders for service report fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleUpload}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <Input
                    placeholder="e.g. ASCOMP Default Template"
                    value={formValues.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <Input
                    placeholder="e.g. First, Second, Emergency"
                    value={formValues.reportType}
                    onChange={(e) => handleInputChange('reportType', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <Input
                    placeholder="e.g. v1.0"
                    value={formValues.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="isDefault"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={formValues.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default template for this report type</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea
                  placeholder="Notes about the template, required fields, etc."
                  value={formValues.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload DOCX File</label>
                <Input type="file" accept=".docx" onChange={handleFileChange} required />
                <p className="text-xs text-gray-500 mt-1">Maximum file size 10 MB. Only `.docx` files are supported.</p>
              </div>

              <div>
                <Button type="submit" disabled={uploading} className="gap-2">
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Template
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Existing Templates
            </CardTitle>
            <CardDescription>
              Templates currently available for auto-filling service reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                No templates uploaded yet. Add your first `.docx` template above.
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template._id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          {template.isDefault && (
                            <Badge className="bg-blue-100 text-blue-700">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {template.reportType ? `Report Type: ${template.reportType}` : 'Report Type: Any'}
                        </p>
                        {template.description && (
                          <p className="text-sm text-gray-600">{template.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {template.version && <span>Version: {template.version}</span>}
                          {template.storage?.bytes && <span>Size: {(template.storage.bytes / 1024 / 1024).toFixed(2)} MB</span>}
                          {template.uploadedBy && <span>Uploaded by: {template.uploadedBy}</span>}
                          {template.updatedAt && <span>Updated: {new Date(template.updatedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.storage?.cloudUrl && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(template.storage!.cloudUrl, '_blank')}
                          >
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => loadFieldMappings(template)}
                          disabled={isFieldMapLoading && selectedTemplate?._id === template._id}
                        >
                          {isFieldMapLoading && selectedTemplate?._id === template._id ? (
                            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Loading…</span>
                          ) : (
                            'Edit Field Map'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:text-red-700"
                          onClick={() => handleDelete(template._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTemplate && (
          <Card ref={fieldMapSectionRef} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Field Mappings for {selectedTemplate.name}
              </CardTitle>
              <CardDescription>
                Map custom tokens (e.g. `[CUSTOM_FIELD]`) to data paths. These mappings are optional; leave token empty to skip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Data paths reference fields from the service report object (e.g. `siteName`, `engineer.name`, `voltageParameters.pVsN`).</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleLoadCommonMappings}>
                    Load Common Fields
                  </Button>
                  <Button variant="outline" onClick={handleAddMapping}>
                    Add Mapping
                  </Button>
                </div>
              </div>

              {fieldMappings.length === 0 && (
                <p className="text-sm text-gray-500">No mappings yet. Click “Add Mapping” to create one.</p>
              )}

              <div className="space-y-3">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border border-gray-200 rounded-md p-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Token</label>
                      <Input
                        placeholder="e.g. CUSTOM_FIELD"
                        value={mapping.token}
                        onChange={(e) => handleUpdateMapping(index, 'token', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data Path</label>
                      <Input
                        placeholder="e.g. engineer.name"
                        value={mapping.dataPath}
                        onChange={(e) => handleUpdateMapping(index, 'dataPath', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Default Value</label>
                      <Input
                        placeholder="Optional fallback"
                        value={mapping.defaultValue || ''}
                        onChange={(e) => handleUpdateMapping(index, 'defaultValue', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:text-red-700"
                        onClick={() => handleRemoveMapping(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveMappings}
                  disabled={isFieldMapSaving}
                  className="gap-2"
                >
                  {isFieldMapSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Field Mappings'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


