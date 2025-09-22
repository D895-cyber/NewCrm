import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { ValidationError, getValidationMessage, getValidationColor, getValidationIcon } from '../../utils/validation/reportValidation';

interface ValidationFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'tel';
  validationErrors?: ValidationError[];
  className?: string;
  required?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function ValidationField({
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
  step
}: ValidationFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  
  // Show validation errors when field is focused or has been blurred
  const shouldShowValidation = isFocused || hasBlurred;
  
  // Filter errors for this specific field
  const fieldErrors = validationErrors.filter(error => 
    error.field.toLowerCase() === label.toLowerCase().replace(/\s+/g, '') ||
    error.field.toLowerCase() === label.toLowerCase().replace(/[^a-zA-Z]/g, '')
  );
  
  // Get the most severe error for this field
  const mostSevereError = fieldErrors.find(error => error.severity === 'error') ||
                         fieldErrors.find(error => error.severity === 'warning') ||
                         fieldErrors.find(error => error.severity === 'info');
  
  const hasError = fieldErrors.some(error => error.severity === 'error');
  const hasWarning = fieldErrors.some(error => error.severity === 'warning');
  const hasInfo = fieldErrors.some(error => error.severity === 'info');
  
  // Determine border color based on validation state
  const getBorderColor = () => {
    if (hasError) return 'border-red-500 focus:border-red-500';
    if (hasWarning) return 'border-yellow-500 focus:border-yellow-500';
    if (hasInfo) return 'border-blue-500 focus:border-blue-500';
    return 'border-gray-300 focus:border-blue-500';
  };
  
  // Determine background color based on validation state
  const getBackgroundColor = () => {
    if (hasError) return 'bg-red-50 dark:bg-red-900/20';
    if (hasWarning) return 'bg-yellow-50 dark:bg-yellow-900/20';
    if (hasInfo) return 'bg-blue-50 dark:bg-blue-900/20';
    return 'bg-input-background';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {unit && <span className="text-gray-500 ml-1">({unit})</span>}
      </Label>
      
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
        
        {/* Validation indicator */}
        {shouldShowValidation && mostSevereError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-lg">{getValidationIcon(mostSevereError.severity)}</span>
          </div>
        )}
      </div>
      
      {/* Validation messages */}
      {shouldShowValidation && fieldErrors.length > 0 && (
        <div className="space-y-1">
          {fieldErrors.map((error, index) => (
            <div
              key={index}
              className={`text-sm flex items-start space-x-1 ${getValidationColor(error.severity)}`}
            >
              <span className="mt-0.5">{getValidationIcon(error.severity)}</span>
              <span>{getValidationMessage(error)}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Help text for normal ranges */}
      {shouldShowValidation && !fieldErrors.length && type === 'number' && (
        <div className="text-xs text-gray-500">
          {label.toLowerCase().includes('temperature') && 'Normal range: 15-35°C'}
          {label.toLowerCase().includes('humidity') && 'Normal range: 20-80%'}
          {label.toLowerCase().includes('voltage') && 'Normal range: 220-240V'}
          {label.toLowerCase().includes('brightness') && 'Normal range: 1000-5000 lumens'}
          {label.toLowerCase().includes('contrast') && 'Normal range: 1000:1 - 50000:1'}
        </div>
      )}
    </div>
  );
}

// Specialized validation field for environmental conditions
export function EnvironmentalField({
  label,
  value,
  onChange,
  placeholder,
  validationErrors = [],
  className = '',
  required = false
}: Omit<ValidationFieldProps, 'type'>) {
  return (
    <ValidationField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type="number"
      validationErrors={validationErrors}
      className={className}
      required={required}
      unit={label.toLowerCase().includes('temperature') ? '°C' : 
            label.toLowerCase().includes('humidity') ? '%' : undefined}
    />
  );
}

// Specialized validation field for technical parameters
export function TechnicalField({
  label,
  value,
  onChange,
  placeholder,
  validationErrors = [],
  className = '',
  required = false,
  unit
}: ValidationFieldProps) {
  return (
    <ValidationField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type="number"
      validationErrors={validationErrors}
      className={className}
      required={required}
      unit={unit}
    />
  );
}

// Validation summary component
interface ValidationSummaryProps {
  validationErrors: ValidationError[];
  className?: string;
}

export function ValidationSummary({ validationErrors, className = '' }: ValidationSummaryProps) {
  const errors = validationErrors.filter(error => error.severity === 'error');
  const warnings = validationErrors.filter(error => error.severity === 'warning');
  const suggestions = validationErrors.filter(error => error.severity === 'info');
  
  if (validationErrors.length === 0) return null;
  
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 ${className}`}>
      <h4 className="font-medium text-gray-900">Validation Summary</h4>
      
      {errors.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-sm font-medium text-red-700">Errors ({errors.length})</h5>
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-600 flex items-start space-x-1">
              <span className="mt-0.5">❌</span>
              <span>{getValidationMessage(error)}</span>
            </div>
          ))}
        </div>
      )}
      
      {warnings.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-sm font-medium text-yellow-700">Warnings ({warnings.length})</h5>
          {warnings.map((error, index) => (
            <div key={index} className="text-sm text-yellow-600 flex items-start space-x-1">
              <span className="mt-0.5">⚠️</span>
              <span>{getValidationMessage(error)}</span>
            </div>
          ))}
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-sm font-medium text-blue-700">Suggestions ({suggestions.length})</h5>
          {suggestions.map((error, index) => (
            <div key={index} className="text-sm text-blue-600 flex items-start space-x-1">
              <span className="mt-0.5">ℹ️</span>
              <span>{getValidationMessage(error)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



