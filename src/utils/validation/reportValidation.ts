// Report Validation Utilities
// Comprehensive validation for service report forms with realistic value checks

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestedValue?: string | number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
}

// Realistic value ranges for different parameters
export const REALISTIC_RANGES = {
  // Environmental Conditions
  temperature: {
    min: -10, // Very cold environment
    max: 50,  // Very hot environment
    normal: { min: 15, max: 35 }, // Normal operating range
    unit: '°C'
  },
  humidity: {
    min: 0,   // Completely dry
    max: 100, // Completely saturated
    normal: { min: 20, max: 80 }, // Normal operating range
    unit: '%'
  },
  
  // Air Quality Parameters
  hcho: {
    min: 0,
    max: 10, // Very high formaldehyde
    normal: { min: 0, max: 0.1 }, // Normal indoor levels
    unit: 'mg/m³'
  },
  tvoc: {
    min: 0,
    max: 50, // Very high TVOC
    normal: { min: 0, max: 0.5 }, // Normal indoor levels
    unit: 'mg/m³'
  },
  pm1: {
    min: 0,
    max: 1000, // Very high PM1
    normal: { min: 0, max: 35 }, // Normal indoor levels
    unit: 'μg/m³'
  },
  pm25: {
    min: 0,
    max: 1000, // Very high PM2.5
    normal: { min: 0, max: 35 }, // Normal indoor levels
    unit: 'μg/m³'
  },
  pm10: {
    min: 0,
    max: 2000, // Very high PM10
    normal: { min: 0, max: 150 }, // Normal indoor levels
    unit: 'μg/m³'
  },
  
  // Technical Parameters
  brightness: {
    min: 0,
    max: 10000, // Very bright projector
    normal: { min: 1000, max: 5000 }, // Normal range
    unit: 'lumens'
  },
  contrast: {
    min: 100,
    max: 100000, // Very high contrast
    normal: { min: 1000, max: 50000 }, // Normal range
    unit: ':1'
  },
  voltage: {
    min: 180, // Low voltage
    max: 280, // High voltage
    normal: { min: 220, max: 240 }, // Normal range
    unit: 'V'
  },
  frequency: {
    min: 45, // Low frequency
    max: 65, // High frequency
    normal: { min: 49, max: 51 }, // Normal range
    unit: 'Hz'
  },
  
  // Screen Parameters
  screenGain: {
    min: 0.5, // Low gain
    max: 3.0, // High gain
    normal: { min: 0.8, max: 1.2 }, // Normal range
    unit: ''
  },
  throwDistance: {
    min: 0.5, // Very close
    max: 50,  // Very far
    normal: { min: 2, max: 20 }, // Normal range
    unit: 'm'
  },
  
  // Color Coordinates (CIE)
  colorX: {
    min: 0,
    max: 1,
    normal: { min: 0.1, max: 0.9 },
    unit: ''
  },
  colorY: {
    min: 0,
    max: 1,
    normal: { min: 0.1, max: 0.9 },
    unit: ''
  },
  
  // Running Hours
  runningHours: {
    min: 0,
    max: 50000, // Very high hours
    normal: { min: 0, max: 20000 }, // Normal range
    unit: 'hours'
  }
};

// Validation functions
export function validateTemperature(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be a valid number',
      severity: 'error'
    });
    return errors;
  }
  
  if (numValue < REALISTIC_RANGES.temperature.min) {
    errors.push({
      field: 'temperature',
      message: `Temperature (${numValue}°C) is below realistic minimum (${REALISTIC_RANGES.temperature.min}°C)`,
      severity: 'warning',
      suggestedValue: REALISTIC_RANGES.temperature.min
    });
  }
  
  if (numValue > REALISTIC_RANGES.temperature.max) {
    errors.push({
      field: 'temperature',
      message: `Temperature (${numValue}°C) is above realistic maximum (${REALISTIC_RANGES.temperature.max}°C)`,
      severity: 'warning',
      suggestedValue: REALISTIC_RANGES.temperature.max
    });
  }
  
  if (numValue < REALISTIC_RANGES.temperature.normal.min || numValue > REALISTIC_RANGES.temperature.normal.max) {
    errors.push({
      field: 'temperature',
      message: `Temperature (${numValue}°C) is outside normal operating range (${REALISTIC_RANGES.temperature.normal.min}-${REALISTIC_RANGES.temperature.normal.max}°C)`,
      severity: 'info'
    });
  }
  
  return errors;
}

export function validateHumidity(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'humidity',
      message: 'Humidity must be a valid number',
      severity: 'error'
    });
    return errors;
  }
  
  if (numValue < REALISTIC_RANGES.humidity.min) {
    errors.push({
      field: 'humidity',
      message: `Humidity (${numValue}%) is below realistic minimum (${REALISTIC_RANGES.humidity.min}%)`,
      severity: 'warning',
      suggestedValue: REALISTIC_RANGES.humidity.min
    });
  }
  
  if (numValue > REALISTIC_RANGES.humidity.max) {
    errors.push({
      field: 'humidity',
      message: `Humidity (${numValue}%) is above realistic maximum (${REALISTIC_RANGES.humidity.max}%)`,
      severity: 'warning',
      suggestedValue: REALISTIC_RANGES.humidity.max
    });
  }
  
  if (numValue < REALISTIC_RANGES.humidity.normal.min || numValue > REALISTIC_RANGES.humidity.normal.max) {
    errors.push({
      field: 'humidity',
      message: `Humidity (${numValue}%) is outside normal operating range (${REALISTIC_RANGES.humidity.normal.min}-${REALISTIC_RANGES.humidity.normal.max}%)`,
      severity: 'info'
    });
  }
  
  return errors;
}

export function validateAirQuality(field: string, value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field,
      message: `${field.toUpperCase()} must be a valid number`,
      severity: 'error'
    });
    return errors;
  }
  
  const range = REALISTIC_RANGES[field as keyof typeof REALISTIC_RANGES];
  if (!range) return errors;
  
  if (numValue < range.min) {
    errors.push({
      field,
      message: `${field.toUpperCase()} (${numValue}${range.unit}) is below realistic minimum (${range.min}${range.unit})`,
      severity: 'warning',
      suggestedValue: range.min
    });
  }
  
  if (numValue > range.max) {
    errors.push({
      field,
      message: `${field.toUpperCase()} (${numValue}${range.unit}) is above realistic maximum (${range.max}${range.unit})`,
      severity: 'warning',
      suggestedValue: range.max
    });
  }
  
  if (numValue < range.normal.min || numValue > range.normal.max) {
    errors.push({
      field,
      message: `${field.toUpperCase()} (${numValue}${range.unit}) is outside normal range (${range.normal.min}-${range.normal.max}${range.unit})`,
      severity: 'info'
    });
  }
  
  return errors;
}

export function validateVoltage(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'voltage',
      message: 'Voltage must be a valid number',
      severity: 'error'
    });
    return errors;
  }
  
  if (numValue < REALISTIC_RANGES.voltage.min) {
    errors.push({
      field: 'voltage',
      message: `Voltage (${numValue}V) is below safe minimum (${REALISTIC_RANGES.voltage.min}V)`,
      severity: 'error',
      suggestedValue: REALISTIC_RANGES.voltage.min
    });
  }
  
  if (numValue > REALISTIC_RANGES.voltage.max) {
    errors.push({
      field: 'voltage',
      message: `Voltage (${numValue}V) is above safe maximum (${REALISTIC_RANGES.voltage.max}V)`,
      severity: 'error',
      suggestedValue: REALISTIC_RANGES.voltage.max
    });
  }
  
  if (numValue < REALISTIC_RANGES.voltage.normal.min || numValue > REALISTIC_RANGES.voltage.normal.max) {
    errors.push({
      field: 'voltage',
      message: `Voltage (${numValue}V) is outside normal range (${REALISTIC_RANGES.voltage.normal.min}-${REALISTIC_RANGES.voltage.normal.max}V)`,
      severity: 'warning'
    });
  }
  
  return errors;
}

export function validateColorCoordinate(value: string | number, coordinate: 'x' | 'y'): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: `color${coordinate.toUpperCase()}`,
      message: `Color ${coordinate.toUpperCase()} coordinate must be a valid number`,
      severity: 'error'
    });
    return errors;
  }
  
  if (numValue < 0 || numValue > 1) {
    errors.push({
      field: `color${coordinate.toUpperCase()}`,
      message: `Color ${coordinate.toUpperCase()} coordinate (${numValue}) must be between 0 and 1`,
      severity: 'error'
    });
  }
  
  return errors;
}

export function validateRunningHours(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'runningHours',
      message: 'Running hours must be a valid number',
      severity: 'error'
    });
    return errors;
  }
  
  if (numValue < 0) {
    errors.push({
      field: 'runningHours',
      message: 'Running hours cannot be negative',
      severity: 'error',
      suggestedValue: 0
    });
  }
  
  if (numValue > REALISTIC_RANGES.runningHours.max) {
    errors.push({
      field: 'runningHours',
      message: `Running hours (${numValue}) seem unusually high (max: ${REALISTIC_RANGES.runningHours.max})`,
      severity: 'warning',
      suggestedValue: REALISTIC_RANGES.runningHours.max
    });
  }
  
  return errors;
}

// Main validation function for environmental conditions
export function validateEnvironmentalConditions(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: ValidationError[] = [];
  
  // Validate temperature
  if (data.temperature) {
    const tempErrors = validateTemperature(data.temperature);
    tempErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  // Validate humidity
  if (data.humidity) {
    const humidityErrors = validateHumidity(data.humidity);
    humidityErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  // Validate air quality parameters
  const airQualityFields = ['hcho', 'tvoc', 'pm1', 'pm25', 'pm10'];
  airQualityFields.forEach(field => {
    if (data[field]) {
      const fieldErrors = validateAirQuality(field, data[field]);
      fieldErrors.forEach(error => {
        if (error.severity === 'error') errors.push(error);
        else if (error.severity === 'warning') warnings.push(error);
        else suggestions.push(error);
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

// Main validation function for technical parameters
export function validateTechnicalParameters(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: ValidationError[] = [];
  
  // Validate voltage parameters
  if (data.voltagePN) {
    const voltageErrors = validateVoltage(data.voltagePN);
    voltageErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  if (data.voltagePE) {
    const voltageErrors = validateVoltage(data.voltagePE);
    voltageErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  if (data.voltageNE) {
    const voltageErrors = validateVoltage(data.voltageNE);
    voltageErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  // Validate running hours
  if (data.projectorRunningHours) {
    const hoursErrors = validateRunningHours(data.projectorRunningHours);
    hoursErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  if (data.lampRunningHours) {
    const hoursErrors = validateRunningHours(data.lampRunningHours);
    hoursErrors.forEach(error => {
      if (error.severity === 'error') errors.push(error);
      else if (error.severity === 'warning') warnings.push(error);
      else suggestions.push(error);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

// Comprehensive validation for entire report
export function validateServiceReport(data: any): ValidationResult {
  const environmentalResult = validateEnvironmentalConditions(data);
  const technicalResult = validateTechnicalParameters(data);
  
  return {
    isValid: environmentalResult.isValid && technicalResult.isValid,
    errors: [...environmentalResult.errors, ...technicalResult.errors],
    warnings: [...environmentalResult.warnings, ...technicalResult.warnings],
    suggestions: [...environmentalResult.suggestions, ...technicalResult.suggestions]
  };
}

// Helper function to get validation message for display
export function getValidationMessage(error: ValidationError): string {
  let message = error.message;
  if (error.suggestedValue !== undefined) {
    message += ` (Suggested: ${error.suggestedValue})`;
  }
  return message;
}

// Helper function to get validation color for UI
export function getValidationColor(severity: ValidationError['severity']): string {
  switch (severity) {
    case 'error': return 'text-red-600';
    case 'warning': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
    default: return 'text-gray-600';
  }
}

// Helper function to get validation icon for UI
export function getValidationIcon(severity: ValidationError['severity']): string {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '•';
  }
}



