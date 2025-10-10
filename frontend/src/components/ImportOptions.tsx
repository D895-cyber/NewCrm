import React, { useState } from 'react';
import { Upload, Download, FileText, Database, Code, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { ImportRMA } from './ImportRMA';
import { BulkImportRMA } from './BulkImportRMA';

interface ImportOptionsProps {
  onImportComplete?: () => void;
}

export function ImportOptions({ onImportComplete }: ImportOptionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'csv' | 'bulk' | null>(null);

  const importMethods = [
    {
      id: 'csv',
      name: 'CSV Import',
      description: 'Upload CSV file with RMA data',
      icon: FileText,
      color: 'bg-green-600 hover:bg-green-700',
      features: [
        'Excel/CSV file support',
        'Field mapping and validation',
        'Template download',
        'Duplicate detection',
        'Progress tracking'
      ]
    },
    {
      id: 'bulk',
      name: 'Bulk JSON Import',
      description: 'Paste JSON data directly',
      icon: Code,
      color: 'bg-purple-600 hover:bg-purple-700',
      features: [
        'Direct JSON input',
        'Real-time validation',
        'Sample templates',
        'No file size limits',
        'API integration ready'
      ]
    }
  ];

  const handleMethodSelect = (method: 'csv' | 'bulk') => {
    setSelectedMethod(method);
    setShowDropdown(false);
  };

  const closeImport = () => {
    setSelectedMethod(null);
  };

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setShowDropdown(!showDropdown)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Import RMAs</span>
          {showDropdown ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Import Method</h3>
              <div className="space-y-3">
                {importMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id as 'csv' | 'bulk')}
                      className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${method.color} text-white`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            {method.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Database className="w-4 h-4" />
                  <span>Need help? Check the import guide for detailed instructions.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Components */}
      {selectedMethod === 'csv' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">CSV Import</h2>
              <button
                onClick={closeImport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <ImportRMA onImportComplete={onImportComplete} />
          </div>
        </div>
      )}

      {selectedMethod === 'bulk' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Bulk JSON Import</h2>
              <button
                onClick={closeImport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <BulkImportRMA onImportComplete={onImportComplete} />
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
}
