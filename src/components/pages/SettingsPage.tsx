import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  Settings, 
  Save,
  RefreshCw,
  Database,
  Shield,
  Bell,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Download} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SystemSettings {
  companyName: string;
  warrantyDefaultDays: number;
  autoAlertDays: number;
  maxFileUploadSize: number;
  sessionTimeout: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  backupFrequency: string;
  dataRetentionDays: number;
  maintenanceMode: boolean;
}

export function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'ProjectorCare',
    warrantyDefaultDays: 365,
    autoAlertDays: 30,
    maxFileUploadSize: 10,
    sessionTimeout: 24,
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    backupFrequency: 'daily',
    dataRetentionDays: 1095, // 3 years
    maintenanceMode: false
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        alert('Settings reset to defaults successfully');
      } else {
        alert('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Error resetting settings');
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/clear-all-data', { method: 'POST' });
      if (response.ok) {
        alert('Database cleared successfully');
      } else {
        alert('Failed to clear database');
      }
    } catch (error) {
      alert('Error clearing database');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export-data');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'projectorcare-data.json';
        a.click();
      }
    } catch (error) {
      alert('Error exporting data');
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your warranty management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-700">
            Admin Access
          </Badge>
          <Badge className="bg-green-100 text-green-700">
            System Active
          </Badge>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Company Settings
            </CardTitle>
            <CardDescription>
              Configure basic company information and defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Warranty Days
                </label>
                <Input
                  type="number"
                  value={settings.warrantyDefaultDays}
                  onChange={(e) => setSettings({...settings, warrantyDefaultDays: parseInt(e.target.value)})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Days Before Expiry
                </label>
                <Input
                  type="number"
                  value={settings.autoAlertDays}
                  onChange={(e) => setSettings({...settings, autoAlertDays: parseInt(e.target.value)})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system behavior and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max File  (MB)
                </label>
                <Input
                  type="number"
                  value={settings.maxFileUploadSize}
                  onChange={(e) => setSettings({...settings, maxFileUploadSize: parseInt(e.target.value)})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (hours)
                </label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Retention (days)
              </label>
              <Input
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings({...settings, dataRetentionDays: parseInt(e.target.value)})}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure alert and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Notifications</label>
                  <p className="text-xs text-gray-500">Show in-app notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Alerts</label>
                  <p className="text-xs text-gray-500">Send warranty expiry alerts via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => setSettings({...settings, enableEmailAlerts: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">SMS Alerts</label>
                  <p className="text-xs text-gray-500">Send urgent alerts via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSMSAlerts}
                  onChange={(e) => setSettings({...settings, enableSMSAlerts: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup & Maintenance
            </CardTitle>
            <CardDescription>
              Configure data backup and system maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                <p className="text-xs text-gray-500">Temporarily disable system access</p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Actions
          </CardTitle>
          <CardDescription>
            Administrative actions for system management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 'Save Settings'}
            </Button>
            
            <Button
              onClick={handleResetSettings}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <Button
              onClick={handleExportData}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            
            <Button
              onClick={handleClearDatabase}
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Database
            </Button>
            

          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Database</p>
                <p className="text-xs text-green-600">Connected</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Uptime</p>
                <p className="text-xs text-blue-600">24h 32m</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Warnings</p>
                <p className="text-xs text-yellow-600">2 pending</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}