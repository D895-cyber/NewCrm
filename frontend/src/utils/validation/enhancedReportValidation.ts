// Enhanced FSE Report Validation System
// Comprehensive validation for every important report column with realistic value checks

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestedValue?: string | number;
  category: 'critical' | 'technical' | 'environmental' | 'operational';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  criticalIssues: ValidationError[];
  technicalIssues: ValidationError[];
  environmentalIssues: ValidationError[];
  operationalIssues: ValidationError[];
}

// Comprehensive realistic value ranges for ALL report parameters
export const ENHANCED_VALIDATION_RANGES = {
  // ===== CRITICAL OPERATIONAL PARAMETERS =====
  projectorRunningHours: {
    min: 0,
    max: 100000, // Very high hours
    normal: { min: 0, max: 50000 },
    critical: { min: 45000, max: 100000 }, // Critical range
    unit: 'hours',
    description: 'Projector total running hours'
  },
  lampRunningHours: {
    min: 0,
    max: 20000, // Lamp life limit
    normal: { min: 0, max: 15000 },
    critical: { min: 15000, max: 20000 }, // Critical range
    unit: 'hours',
    description: 'Current lamp running hours'
  },
  currentLampHours: {
    min: 0,
    max: 20000,
    normal: { min: 0, max: 15000 },
    critical: { min: 15000, max: 20000 },
    unit: 'hours',
    description: 'Current lamp hours since replacement'
  },

  // ===== TECHNICAL SPECIFICATIONS =====
  brightness: {
    min: 0,
    max: 20000, // Ultra-bright projectors
    normal: { min: 1000, max: 8000 },
    critical: { min: 0, max: 500 }, // Too dim
    unit: 'lumens',
    description: 'Projector brightness output'
  },
  contrast: {
    min: 100,
    max: 1000000, // Ultra-high contrast
    normal: { min: 1000, max: 100000 },
    critical: { min: 100, max: 500 }, // Too low
    unit: ':1',
    description: 'Projector contrast ratio'
  },
  resolution: {
    valid: ['480p', '720p', '1080p', '2K', '4K', '8K'],
    normal: ['1080p', '2K', '4K'],
    critical: ['480p', '720p'],
    description: 'Projector resolution'
  },

  // ===== VOLTAGE & ELECTRICAL PARAMETERS =====
  voltagePN: {
    min: 180,
    max: 280,
    normal: { min: 220, max: 240 },
    critical: { min: 180, max: 200 }, // Too low
    unit: 'V',
    description: 'Phase to Neutral voltage'
  },
  voltagePE: {
    min: 180,
    max: 280,
    normal: { min: 220, max: 240 },
    critical: { min: 180, max: 200 },
    unit: 'V',
    description: 'Phase to Earth voltage'
  },
  voltageNE: {
    min: 0,
    max: 50,
    normal: { min: 0, max: 5 },
    critical: { min: 10, max: 50 }, // Too high
    unit: 'V',
    description: 'Neutral to Earth voltage'
  },
  frequency: {
    min: 45,
    max: 65,
    normal: { min: 49, max: 51 },
    critical: { min: 45, max: 47 }, // Too low
    unit: 'Hz',
    description: 'Power frequency'
  },

  // ===== ENVIRONMENTAL CONDITIONS =====
  temperature: {
    min: -20, // Very cold
    max: 60,  // Very hot
    normal: { min: 15, max: 35 },
    critical: { min: 40, max: 60 }, // Too hot
    unit: '°C',
    description: 'Ambient temperature'
  },
  humidity: {
    min: 0,
    max: 100,
    normal: { min: 20, max: 80 },
    critical: { min: 80, max: 100 }, // Too humid
    unit: '%',
    description: 'Relative humidity'
  },

  // ===== AIR QUALITY PARAMETERS =====
  hcho: {
    min: 0,
    max: 20, // Very high formaldehyde
    normal: { min: 0, max: 0.1 },
    critical: { min: 0.5, max: 20 }, // Critical levels
    unit: 'mg/m³',
    description: 'Formaldehyde concentration'
  },
  tvoc: {
    min: 0,
    max: 100, // Very high TVOC
    normal: { min: 0, max: 0.5 },
    critical: { min: 1.0, max: 100 }, // Critical levels
    unit: 'mg/m³',
    description: 'Total Volatile Organic Compounds'
  },
  pm1: {
    min: 0,
    max: 2000, // Very high PM1
    normal: { min: 0, max: 35 },
    critical: { min: 100, max: 2000 }, // Critical levels
    unit: 'μg/m³',
    description: 'PM1 particulate matter'
  },
  pm25: {
    min: 0,
    max: 2000, // Very high PM2.5
    normal: { min: 0, max: 35 },
    critical: { min: 100, max: 2000 }, // Critical levels
    unit: 'μg/m³',
    description: 'PM2.5 particulate matter'
  },
  pm10: {
    min: 0,
    max: 5000, // Very high PM10
    normal: { min: 0, max: 150 },
    critical: { min: 300, max: 5000 }, // Critical levels
    unit: 'μg/m³',
    description: 'PM10 particulate matter'
  },

  // ===== SCREEN PARAMETERS =====
  screenGain: {
    min: 0.3, // Very low gain
    max: 5.0, // Very high gain
    normal: { min: 0.8, max: 1.5 },
    critical: { min: 0.3, max: 0.5 }, // Too low
    unit: '',
    description: 'Screen gain factor'
  },
  throwDistance: {
    min: 0.3, // Very close
    max: 100, // Very far
    normal: { min: 1, max: 30 },
    critical: { min: 0.3, max: 0.5 }, // Too close
    unit: 'm',
    description: 'Projector throw distance'
  },
  screenHeight: {
    min: 0.5, // Very small
    max: 20,  // Very large
    normal: { min: 1, max: 10 },
    critical: { min: 0.5, max: 1 }, // Too small
    unit: 'm',
    description: 'Screen height'
  },
  screenWidth: {
    min: 0.5,
    max: 30,
    normal: { min: 1, max: 15 },
    critical: { min: 0.5, max: 1 },
    unit: 'm',
    description: 'Screen width'
  },

  // ===== COLOR MEASUREMENT PARAMETERS =====
  colorX: {
    min: 0,
    max: 1,
    normal: { min: 0.1, max: 0.9 },
    critical: { min: 0, max: 0.05 }, // Too low
    unit: '',
    description: 'CIE X color coordinate'
  },
  colorY: {
    min: 0,
    max: 1,
    normal: { min: 0.1, max: 0.9 },
    critical: { min: 0, max: 0.05 }, // Too low
    unit: '',
    description: 'CIE Y color coordinate'
  },
  colorFL: {
    min: 0,
    max: 1000, // Very bright
    normal: { min: 10, max: 500 },
    critical: { min: 0, max: 5 }, // Too dim
    unit: 'fL',
    description: 'Color brightness in foot-lamberts'
  },

  // ===== EXHAUST & VENTILATION =====
  exhaustCFM: {
    min: 0,
    max: 1000, // Very high flow
    normal: { min: 50, max: 300 },
    critical: { min: 0, max: 20 }, // Too low
    unit: 'CFM',
    description: 'Exhaust air flow rate'
  },
  exhaustVelocity: {
    min: 0,
    max: 50, // Very high velocity
    normal: { min: 2, max: 15 },
    critical: { min: 0, max: 1 }, // Too low
    unit: 'm/s',
    description: 'Exhaust air velocity'
  },

  // ===== SOFTWARE & VERSION PARAMETERS =====
  softwareVersion: {
    valid: ['1.0', '1.1', '1.2', '2.0', '2.1', '2.2', '3.0', '3.1', '3.2'],
    normal: ['2.0', '2.1', '2.2', '3.0', '3.1'],
    critical: ['1.0', '1.1'], // Too old
    description: 'Projector software version'
  },

  // ===== TIME & SCHEDULE PARAMETERS =====
  serviceInterval: {
    min: 1,
    max: 365, // Annual service
    normal: { min: 30, max: 90 },
    critical: { min: 365, max: 1000 }, // Too long
    unit: 'days',
    description: 'Service interval in days'
  },
  responseTime: {
    min: 0,
    max: 72, // 3 days
    normal: { min: 0, max: 24 },
    critical: { min: 48, max: 72 }, // Too slow
    unit: 'hours',
    description: 'Response time in hours'
  }
};

// ===== VALIDATION FUNCTIONS =====

// Critical Operational Parameters
export function validateProjectorRunningHours(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'projectorRunningHours',
      message: 'Projector running hours must be a valid number',
      severity: 'error',
      category: 'critical'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.projectorRunningHours.min) {
    errors.push({
      field: 'projectorRunningHours',
      message: `Projector running hours (${numValue}h) cannot be negative`,
      severity: 'error',
      category: 'critical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.projectorRunningHours.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.projectorRunningHours.max) {
    errors.push({
      field: 'projectorRunningHours',
      message: `Projector running hours (${numValue}h) exceed realistic maximum (${ENHANCED_VALIDATION_RANGES.projectorRunningHours.max}h)`,
      severity: 'error',
      category: 'critical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.projectorRunningHours.max
    });
  }
  
  if (numValue >= ENHANCED_VALIDATION_RANGES.projectorRunningHours.critical.min) {
    errors.push({
      field: 'projectorRunningHours',
      message: `⚠️ CRITICAL: Projector has ${numValue}h - may need replacement soon!`,
      severity: 'warning',
      category: 'critical'
    });
  }
  
  return errors;
}

export function validateLampRunningHours(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'lampRunningHours',
      message: 'Lamp running hours must be a valid number',
      severity: 'error',
      category: 'critical'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.lampRunningHours.min) {
    errors.push({
      field: 'lampRunningHours',
      message: `Lamp running hours (${numValue}h) cannot be negative`,
      severity: 'error',
      category: 'critical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.lampRunningHours.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.lampRunningHours.max) {
    errors.push({
      field: 'lampRunningHours',
      message: `Lamp running hours (${numValue}h) exceed lamp life limit (${ENHANCED_VALIDATION_RANGES.lampRunningHours.max}h)`,
      severity: 'error',
      category: 'critical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.lampRunningHours.max
    });
  }
  
  if (numValue >= ENHANCED_VALIDATION_RANGES.lampRunningHours.critical.min) {
    errors.push({
      field: 'lampRunningHours',
      message: `🚨 CRITICAL: Lamp has ${numValue}h - IMMEDIATE REPLACEMENT REQUIRED!`,
      severity: 'error',
      category: 'critical'
    });
  }
  
  return errors;
}

// Technical Specifications
export function validateBrightness(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'brightness',
      message: 'Brightness must be a valid number',
      severity: 'error',
      category: 'technical'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.brightness.min) {
    errors.push({
      field: 'brightness',
      message: `Brightness (${numValue} lumens) cannot be negative`,
      severity: 'error',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.brightness.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.brightness.max) {
    errors.push({
      field: 'brightness',
      message: `Brightness (${numValue} lumens) exceeds realistic maximum (${ENHANCED_VALIDATION_RANGES.brightness.max} lumens)`,
      severity: 'warning',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.brightness.max
    });
  }
  
  if (numValue <= ENHANCED_VALIDATION_RANGES.brightness.critical.max) {
    errors.push({
      field: 'brightness',
      message: `⚠️ WARNING: Brightness (${numValue} lumens) is very low - check lamp and optics`,
      severity: 'warning',
      category: 'technical'
    });
  }
  
  return errors;
}

// Voltage Parameters
export function validateVoltagePN(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'voltagePN',
      message: 'Voltage P-N must be a valid number',
      severity: 'error',
      category: 'technical'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.voltagePN.min) {
    errors.push({
      field: 'voltagePN',
      message: `🚨 CRITICAL: Voltage P-N (${numValue}V) is below safe minimum (${ENHANCED_VALIDATION_RANGES.voltagePN.min}V)`,
      severity: 'error',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.voltagePN.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.voltagePN.max) {
    errors.push({
      field: 'voltagePN',
      message: `🚨 CRITICAL: Voltage P-N (${numValue}V) is above safe maximum (${ENHANCED_VALIDATION_RANGES.voltagePN.max}V)`,
      severity: 'error',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.voltagePN.max
    });
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.voltagePN.normal.min || numValue > ENHANCED_VALIDATION_RANGES.voltagePN.normal.max) {
    errors.push({
      field: 'voltagePN',
      message: `⚠️ WARNING: Voltage P-N (${numValue}V) is outside normal range (${ENHANCED_VALIDATION_RANGES.voltagePN.normal.min}-${ENHANCED_VALIDATION_RANGES.voltagePN.normal.max}V)`,
      severity: 'warning',
      category: 'technical'
    });
  }
  
  return errors;
}

// Environmental Parameters
export function validateTemperature(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be a valid number',
      severity: 'error',
      category: 'environmental'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.temperature.min) {
    errors.push({
      field: 'temperature',
      message: `❄️ WARNING: Temperature (${numValue}°C) is very low - check heating system`,
      severity: 'warning',
      category: 'environmental',
      suggestedValue: ENHANCED_VALIDATION_RANGES.temperature.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.temperature.max) {
    errors.push({
      field: 'temperature',
      message: `🌡️ WARNING: Temperature (${numValue}°C) is very high - check cooling system`,
      severity: 'warning',
      category: 'environmental',
      suggestedValue: ENHANCED_VALIDATION_RANGES.temperature.max
    });
  }
  
  if (numValue >= ENHANCED_VALIDATION_RANGES.temperature.critical.min) {
    errors.push({
      field: 'temperature',
      message: `🚨 CRITICAL: Temperature (${numValue}°C) is dangerously high - IMMEDIATE ACTION REQUIRED!`,
      severity: 'error',
      category: 'environmental'
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
      severity: 'error',
      category: 'environmental'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.humidity.min) {
    errors.push({
      field: 'humidity',
      message: `💨 WARNING: Humidity (${numValue}%) is very low - check dehumidification`,
      severity: 'warning',
      category: 'environmental',
      suggestedValue: ENHANCED_VALIDATION_RANGES.humidity.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.humidity.max) {
    errors.push({
      field: 'humidity',
      message: `💧 WARNING: Humidity (${numValue}%) is very high - check ventilation`,
      severity: 'warning',
      category: 'environmental',
      suggestedValue: ENHANCED_VALIDATION_RANGES.humidity.max
    });
  }
  
  if (numValue >= ENHANCED_VALIDATION_RANGES.humidity.critical.min) {
    errors.push({
      field: 'humidity',
      message: `🚨 CRITICAL: Humidity (${numValue}%) is dangerously high - RISK OF CONDENSATION!`,
      severity: 'error',
      category: 'environmental'
    });
  }
  
  return errors;
}

// Air Quality Parameters
export function validateHCHO(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'hcho',
      message: 'HCHO must be a valid number',
      severity: 'error',
      category: 'environmental'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.hcho.min) {
    errors.push({
      field: 'hcho',
      message: `HCHO (${numValue} mg/m³) cannot be negative`,
      severity: 'error',
      category: 'environmental',
      suggestedValue: ENHANCED_VALIDATION_RANGES.hcho.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.hcho.max) {
    errors.push({
      field: 'hcho',
      message: `HCHO (${numValue} mg/m³) exceeds realistic maximum (${ENHANCED_VALIDATION_RANGES.hcho.max} mg/m³)`,
      severity: 'warning',
      category: 'environmental',
      suggestedValue: ENHANCED_VALIDATION_RANGES.hcho.max
    });
  }
  
  if (numValue >= ENHANCED_VALIDATION_RANGES.hcho.critical.min) {
    errors.push({
      field: 'hcho',
      message: `🚨 CRITICAL: HCHO (${numValue} mg/m³) is dangerously high - EVACUATE AREA IMMEDIATELY!`,
      severity: 'error',
      category: 'environmental'
    });
  }
  
  return errors;
}

// Screen Parameters
export function validateScreenGain(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'screenGain',
      message: 'Screen gain must be a valid number',
      severity: 'error',
      category: 'technical'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.screenGain.min) {
    errors.push({
      field: 'screenGain',
      message: `Screen gain (${numValue}) is below realistic minimum (${ENHANCED_VALIDATION_RANGES.screenGain.min})`,
      severity: 'warning',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.screenGain.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.screenGain.max) {
    errors.push({
      field: 'screenGain',
      message: `Screen gain (${numValue}) exceeds realistic maximum (${ENHANCED_VALIDATION_RANGES.screenGain.max})`,
      severity: 'warning',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.screenGain.max
    });
  }
  
  if (numValue <= ENHANCED_VALIDATION_RANGES.screenGain.critical.max) {
    errors.push({
      field: 'screenGain',
      message: `⚠️ WARNING: Screen gain (${numValue}) is very low - check screen specifications`,
      severity: 'warning',
      category: 'technical'
    });
  }
  
  return errors;
}

// Color Coordinates
export function validateColorCoordinate(value: string | number, coordinate: 'x' | 'y'): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: `color${coordinate.toUpperCase()}`,
      message: `Color coordinate ${coordinate.toUpperCase()} must be a valid number`,
      severity: 'error',
      category: 'technical'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.colorX.min) {
    errors.push({
      field: `color${coordinate.toUpperCase()}`,
      message: `Color coordinate ${coordinate.toUpperCase()} (${numValue}) cannot be negative`,
      severity: 'error',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.colorX.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.colorX.max) {
    errors.push({
      field: `color${coordinate.toUpperCase()}`,
      message: `Color coordinate ${coordinate.toUpperCase()} (${numValue}) cannot exceed 1.0`,
      severity: 'error',
      category: 'technical',
      suggestedValue: ENHANCED_VALIDATION_RANGES.colorX.max
    });
  }
  
  if (numValue <= ENHANCED_VALIDATION_RANGES.colorX.critical.max) {
    errors.push({
      field: `color${coordinate.toUpperCase()}`,
      message: `⚠️ WARNING: Color coordinate ${coordinate.toUpperCase()} (${numValue}) is very low - check color calibration`,
      severity: 'warning',
      category: 'technical'
    });
  }
  
  return errors;
}

// Exhaust Parameters
export function validateExhaustCFM(value: string | number): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    errors.push({
      field: 'exhaustCFM',
      message: 'Exhaust CFM must be a valid number',
      severity: 'error',
      category: 'operational'
    });
    return errors;
  }
  
  if (numValue < ENHANCED_VALIDATION_RANGES.exhaustCFM.min) {
    errors.push({
      field: 'exhaustCFM',
      message: `Exhaust CFM (${numValue}) cannot be negative`,
      severity: 'error',
      category: 'operational',
      suggestedValue: ENHANCED_VALIDATION_RANGES.exhaustCFM.min
    });
  }
  
  if (numValue > ENHANCED_VALIDATION_RANGES.exhaustCFM.max) {
    errors.push({
      field: 'exhaustCFM',
      message: `Exhaust CFM (${numValue}) exceeds realistic maximum (${ENHANCED_VALIDATION_RANGES.exhaustCFM.max})`,
      severity: 'warning',
      category: 'operational',
      suggestedValue: ENHANCED_VALIDATION_RANGES.exhaustCFM.max
    });
  }
  
  if (numValue <= ENHANCED_VALIDATION_RANGES.exhaustCFM.critical.max) {
    errors.push({
      field: 'exhaustCFM',
      message: `🚨 CRITICAL: Exhaust CFM (${numValue}) is too low - INSUFFICIENT VENTILATION!`,
      severity: 'error',
      category: 'operational'
    });
  }
  
  return errors;
}
