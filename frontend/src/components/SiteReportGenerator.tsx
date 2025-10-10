import React, { useState, useEffect } from 'react';
import { exportSiteReportToPDF, exportRegionalReportToPDF } from '../utils/site-report-generator';

interface SiteReportGeneratorProps {
  siteId?: string;
  siteData?: any;
  onClose?: () => void;
}

export function SiteReportGenerator({ siteId, siteData, onClose }: SiteReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'site' | 'regional'>('site');

  // Fetch site report data if siteId is provided
  useEffect(() => {
    if (siteId && !siteData) {
      fetchSiteReportData();
    } else if (siteData) {
      setReportData(siteData);
    }
  }, [siteId, siteData]);

  const fetchSiteReportData = async () => {
    if (!siteId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sites/${siteId}/report-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch site report data');
      }
      
      const result = await response.json();
      setReportData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSiteReport = async () => {
    if (!reportData) {
      setError('No site data available for report generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await exportSiteReportToPDF(reportData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRegionalReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sites/reports/regional', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch regional report data');
      }
      
      const result = await response.json();
      await exportRegionalReportToPDF(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (reportType === 'site') {
      handleGenerateSiteReport();
    } else {
      handleGenerateRegionalReport();
    }
  };

  if (loading && !reportData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading site data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Generate Site Report</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="site"
                  checked={reportType === 'site'}
                  onChange={(e) => setReportType(e.target.value as 'site' | 'regional')}
                  className="mr-2"
                />
                <span>Individual Site Report</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="regional"
                  checked={reportType === 'regional'}
                  onChange={(e) => setReportType(e.target.value as 'site' | 'regional')}
                  className="mr-2"
                />
                <span>Regional Analysis Report</span>
              </label>
            </div>
          </div>

          {/* Site Information Display */}
          {reportData && reportType === 'site' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Site Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Name:</strong> {reportData.name}</div>
                <div><strong>Code:</strong> {reportData.siteCode}</div>
                <div><strong>Region:</strong> {reportData.region}</div>
                <div><strong>State:</strong> {reportData.state}</div>
                <div><strong>Projectors:</strong> {reportData.totalProjectors} total, {reportData.activeProjectors} active</div>
                <div><strong>Auditoriums:</strong> {reportData.auditoriums?.length || 0}</div>
              </div>
            </div>
          )}

          {/* Report Preview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Report Preview</h3>
            <div className="text-sm text-blue-700">
              {reportType === 'site' ? (
                <div>
                  <p>This will generate a comprehensive site report including:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Site information and contact details</li>
                    <li>Projector analysis and status</li>
                    <li>RMA case analysis</li>
                    <li>Service history and performance</li>
                    <li>Maintenance recommendations</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p>This will generate a regional analysis report including:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Regional site distribution</li>
                    <li>Projector performance across sites</li>
                    <li>RMA trends and patterns</li>
                    <li>Service coverage analysis</li>
                    <li>Regional recommendations</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                `Generate ${reportType === 'site' ? 'Site' : 'Regional'} Report`
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteReportGenerator;











