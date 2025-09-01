// Enhanced Validation Field Component
// Provides comprehensive validation for every important FSE report column

import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { ValidationError } from '../../utils/validation/enhancedReportValidation';

export interface EnhancedValidationFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'tel';
  validationErrors?: ValidationError[];
  className?: string;
  required?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  category?: 'critical' | 'technical' | 'environmental' | 'operational';
  description?: string;
  helpText?: string;
}

export function EnhancedValidationField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  validationErrors = [],
  className = '',
  required = false,
  unit,
  min,
  max,
  step,
  category = 'technical',
  description,
  helpText
}: EnhancedValidationFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const shouldShowValidation = isFocused || hasBlurred;

  // Filter validation errors for this specific field
  const fieldErrors = validationErrors.filter(error => 
    error.field.toLowerCase() === label.toLowerCase().replace(/\s+/g, '') ||
    error.field.toLowerCase() === label.toLowerCase().replace(/\s+/g, '_')
  );

  const mostSevereError = fieldErrors.find(error => error.severity === 'error') || 
                          fieldErrors.find(error => error.severity === 'warning') || 
                          fieldErrors.find(error => error.severity === 'info');

  const getBorderColor = () => {
    if (!shouldShowValidation || fieldErrors.length === 0) return 'border-gray-300';
    
    const hasError = fieldErrors.some(error => error.severity === 'error');
    const hasWarning = fieldErrors.some(error => error.severity === 'warning');
    
    if (hasError) return 'border-red-500';
    if (hasWarning) return 'border-yellow-500';
    return 'border-blue-500';
  };

  const getBackgroundColor = () => {
    if (!shouldShowValidation || fieldErrors.length === 0) return 'bg-white';
    
    const hasError = fieldErrors.some(error => error.severity === 'error');
    const hasWarning = fieldErrors.some(error => error.severity === 'warning');
    
    if (hasError) return 'bg-red-50';
    if (hasWarning) return 'bg-yellow-50';
    return 'bg-blue-50';
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'critical': return '🚨';
      case 'technical': return '🔧';
      case 'environmental': return '🌍';
      case 'operational': return '⚙️';
      default: return '📋';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <span className="text-xs text-gray-500">{getCategoryIcon(category)}</span>
        {unit && <span className="text-xs text-gray-500">({unit})</span>}
      </div>
      
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}
      
      <div className="relative">
        <Input
          id={label.toLowerCase().replace(/\s+/g, '-')}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`${getBorderColor()} ${getBackgroundColor()} transition-colors duration-200`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setHasBlurred(true);
          }}
        />
        
        {shouldShowValidation && mostSevereError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-lg">{getSeverityIcon(mostSevereError.severity)}</span>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {shouldShowValidation && fieldErrors.length > 0 && (
        <div className="space-y-1">
          {fieldErrors.map((error, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded-md border ${
                error.severity === 'error' 
                  ? 'text-red-700 bg-red-50 border-red-200' 
                  : error.severity === 'warning'
                  ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm">{getSeverityIcon(error.severity)}</span>
                <div className="flex-1">
                  <p className="font-medium">{error.message}</p>
                  {error.suggestedValue && (
                    <p className="text-xs mt-1">
                      Suggested: <span className="font-mono bg-gray-100 px-1 rounded">{error.suggestedValue}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      {shouldShowValidation && !fieldErrors.length && helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Range Information */}
      {type === 'number' && (min !== undefined || max !== undefined) && (
        <p className="text-xs text-gray-400">
          Range: {min !== undefined ? min : '∞'} - {max !== undefined ? max : '∞'}
        </p>
      )}
    </div>
  );
}

// Specialized Field Components for Different Categories

export function CriticalField(props: EnhancedValidationFieldProps) {
  return <EnhancedValidationField {...props} category="critical" />;
}

export function TechnicalField(props: EnhancedValidationFieldProps) {
  return <EnhancedValidationField {...props} category="technical" />;
}

export function EnvironmentalField(props: EnhancedValidationFieldProps) {
  return <EnhancedValidationField {...props} category="environmental" />;
}

export function OperationalField(props: EnhancedValidationFieldProps) {
  return <EnhancedValidationField {...props} category="operational" />;
}

// Enhanced Validation Summary Component
export function EnhancedValidationSummary({ 
  validationErrors, 
  className = '' 
}: { 
  validationErrors: ValidationError[]; 
  className?: string; 
}) {
  if (validationErrors.length === 0) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-green-600">✅</span>
          <p className="text-green-800 font-medium">All validations passed successfully!</p>
        </div>
      </div>
    );
  }

  const errors = validationErrors.filter(error => error.severity === 'error');
  const warnings = validationErrors.filter(error => error.severity === 'warning');
  const suggestions = validationErrors.filter(error => error.severity === 'info');

  const criticalIssues = validationErrors.filter(error => error.category === 'critical');
  const technicalIssues = validationErrors.filter(error => error.category === 'technical');
  const environmentalIssues = validationErrors.filter(error => error.category === 'environmental');
  const operationalIssues = validationErrors.filter(error => error.category === 'operational');

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Validation Summary</h3>
        <span className="text-sm text-gray-500">
          {validationErrors.length} issue{validationErrors.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 text-lg">🚨</span>
            <h4 className="font-semibold text-red-800">Critical Issues ({criticalIssues.length})</h4>
          </div>
          <div className="space-y-2">
            {criticalIssues.map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                <strong>{error.field}:</strong> {error.message}
                {error.suggestedValue && (
                  <span className="ml-2 text-xs">
                    (Suggested: {error.suggestedValue})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Issues */}
      {technicalIssues.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600 text-lg">🔧</span>
            <h4 className="font-semibold text-yellow-800">Technical Issues ({technicalIssues.length})</h4>
          </div>
          <div className="space-y-2">
            {technicalIssues.map((error, index) => (
              <div key={index} className="text-sm text-yellow-700">
                <strong>{error.field}:</strong> {error.message}
                {error.suggestedValue && (
                  <span className="ml-2 text-xs">
                    (Suggested: {error.suggestedValue})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environmental Issues */}
      {environmentalIssues.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-lg">🌍</span>
            <h4 className="font-semibold text-blue-800">Environmental Issues ({environmentalIssues.length})</h4>
          </div>
          <div className="space-y-2">
            {environmentalIssues.map((error, index) => (
              <div key={index} className="text-sm text-blue-700">
                <strong>{error.field}:</strong> {error.message}
                {error.suggestedValue && (
                  <span className="ml-2 text-xs">
                    (Suggested: {error.suggestedValue})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Issues */}
      {operationalIssues.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 text-lg">⚙️</span>
            <h4 className="font-semibold text-purple-800">Operational Issues ({operationalIssues.length})</h4>
          </div>
          <div className="space-y-2">
            {operationalIssues.map((error, index) => (
              <div key={index} className="text-sm text-purple-700">
                <strong>{error.field}:</strong> {error.message}
                {error.suggestedValue && (
                  <span className="ml-2 text-xs">
                    (Suggested: {error.suggestedValue})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{errors.length}</div>
          <div className="text-xs text-gray-600">Errors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
          <div className="text-xs text-gray-600">Warnings</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{suggestions.length}</div>
          <div className="text-xs text-gray-600">Suggestions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{validationErrors.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
      </div>
    </div>
  );
}




