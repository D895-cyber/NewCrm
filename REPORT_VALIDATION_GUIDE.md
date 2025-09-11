# 📋 Report Validation System Guide

## 🎯 Overview

The Report Validation System provides comprehensive validation and error detection for service report forms, ensuring that all entered values are realistic and within acceptable ranges. This system helps prevent data entry errors and ensures data quality.

## 🔍 Features

### ✅ **Realistic Value Validation**
- **Environmental Conditions**: Temperature, humidity, air quality parameters
- **Technical Parameters**: Voltage, brightness, contrast, running hours
- **Air Quality**: HCHO, TVOC, PM1, PM2.5, PM10 measurements
- **Color Coordinates**: CIE color space validation

### ✅ **Error Detection Levels**
- **❌ Errors**: Critical issues that prevent form submission
- **⚠️ Warnings**: Values outside normal ranges but technically possible
- **ℹ️ Info**: Suggestions for optimal values

### ✅ **Real-time Validation**
- Instant feedback as users type
- Visual indicators with color coding
- Suggested values for corrections

---

## 📊 Validation Ranges

### **Environmental Conditions**

| Parameter | Min | Max | Normal Range | Unit |
|-----------|-----|-----|--------------|------|
| **Temperature** | -10°C | 50°C | 15-35°C | °C |
| **Humidity** | 0% | 100% | 20-80% | % |

### **Air Quality Parameters**

| Parameter | Min | Max | Normal Range | Unit |
|-----------|-----|-----|--------------|------|
| **HCHO** | 0 | 10 | 0-0.1 | mg/m³ |
| **TVOC** | 0 | 50 | 0-0.5 | mg/m³ |
| **PM1** | 0 | 1000 | 0-35 | μg/m³ |
| **PM2.5** | 0 | 1000 | 0-35 | μg/m³ |
| **PM10** | 0 | 2000 | 0-150 | μg/m³ |

### **Technical Parameters**

| Parameter | Min | Max | Normal Range | Unit |
|-----------|-----|-----|--------------|------|
| **Brightness** | 0 | 10000 | 1000-5000 | lumens |
| **Contrast** | 100 | 100000 | 1000-50000 | :1 |
| **Voltage** | 180V | 280V | 220-240V | V |
| **Frequency** | 45Hz | 65Hz | 49-51Hz | Hz |
| **Running Hours** | 0 | 50000 | 0-20000 | hours |

### **Screen Parameters**

| Parameter | Min | Max | Normal Range | Unit |
|-----------|-----|-----|--------------|------|
| **Screen Gain** | 0.5 | 3.0 | 0.8-1.2 | - |
| **Throw Distance** | 0.5m | 50m | 2-20m | m |

---

## 🛠️ Implementation

### **1. Validation Utilities (`src/utils/validation/reportValidation.ts`)**

```typescript
// Import validation functions
import { 
  validateTemperature, 
  validateHumidity, 
  validateAirQuality,
  validateVoltage,
  validateServiceReport 
} from '../utils/validation/reportValidation';

// Example usage
const tempErrors = validateTemperature(25); // Returns validation errors
const humidityErrors = validateHumidity(85); // Returns validation errors
```

### **2. Validation Components (`src/components/ui/ValidationField.tsx`)**

```typescript
// Environmental field with validation
<EnvironmentalField
  label="Temperature"
  value={formData.temperature}
  onChange={(value) => handleInputChange('temperature', value)}
  placeholder="e.g., 22"
  validationErrors={validationErrors}
/>

// Technical field with validation
<TechnicalField
  label="Voltage P-N"
  value={formData.voltagePN}
  onChange={(value) => handleInputChange('voltagePN', value)}
  placeholder="e.g., 230"
  validationErrors={validationErrors}
  unit="V"
/>
```

### **3. Validation Summary Component**

```typescript
<ValidationSummary validationErrors={validationErrors} />
```

---

## 🎨 Visual Feedback

### **Color Coding**
- **🔴 Red**: Critical errors (prevent submission)
- **🟡 Yellow**: Warnings (outside normal range)
- **🔵 Blue**: Information (suggestions)

### **Icons**
- **❌**: Error
- **⚠️**: Warning  
- **ℹ️**: Information

### **Real-time Indicators**
- Border color changes based on validation state
- Background color indicates severity
- Icons appear next to fields with issues

---

## 📝 Usage Examples

### **Example 1: Temperature Validation**

```typescript
// Input: 45°C
// Result: Warning - "Temperature (45°C) is outside normal operating range (15-35°C)"

// Input: 100°C  
// Result: Error - "Temperature (100°C) is above realistic maximum (50°C) (Suggested: 50)"
```

### **Example 2: Humidity Validation**

```typescript
// Input: 95%
// Result: Warning - "Humidity (95%) is outside normal operating range (20-80%)"

// Input: 150%
// Result: Error - "Humidity (150%) is above realistic maximum (100%) (Suggested: 100)"
```

### **Example 3: Voltage Validation**

```typescript
// Input: 150V
// Result: Error - "Voltage (150V) is below safe minimum (180V) (Suggested: 180)"

// Input: 300V
// Result: Error - "Voltage (300V) is above safe maximum (280V) (Suggested: 280)"
```

---

## 🔧 Integration Steps

### **Step 1: Import Validation Components**

```typescript
import { 
  EnvironmentalField, 
  TechnicalField, 
  ValidationSummary 
} from '../ui/ValidationField';
import { 
  validateEnvironmentalConditions, 
  validateTechnicalParameters 
} from '../../utils/validation/reportValidation';
```

### **Step 2: Add Validation State**

```typescript
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
```

### **Step 3: Update Input Handler**

```typescript
const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Run validation
  const newFormData = { ...formData, [field]: value };
  const environmentalValidation = validateEnvironmentalConditions(newFormData);
  const technicalValidation = validateTechnicalParameters(newFormData);
  
  setValidationErrors([
    ...environmentalValidation.errors,
    ...environmentalValidation.warnings,
    ...environmentalValidation.suggestions,
    ...technicalValidation.errors,
    ...technicalValidation.warnings,
    ...technicalValidation.suggestions
  ]);
};
```

### **Step 4: Replace Input Fields**

```typescript
// Before
<Input
  value={formData.temperature}
  onChange={(e) => handleInputChange('temperature', e.target.value)}
/>

// After
<EnvironmentalField
  label="Temperature"
  value={formData.temperature}
  onChange={(value) => handleInputChange('temperature', value)}
  validationErrors={validationErrors}
/>
```

### **Step 5: Add Validation Summary**

```typescript
{validationErrors.length > 0 && (
  <ValidationSummary validationErrors={validationErrors} />
)}
```

---

## 🚀 Benefits

### **For Users**
- **Immediate Feedback**: Know instantly if values are realistic
- **Error Prevention**: Avoid submitting invalid data
- **Guidance**: Get suggestions for correct values
- **Confidence**: Ensure data quality and accuracy

### **For System**
- **Data Quality**: Maintain high-quality, realistic data
- **Error Reduction**: Minimize data entry mistakes
- **Consistency**: Ensure uniform data across reports
- **Reliability**: Build trust in the reporting system

### **For Analysis**
- **Accurate Reports**: Reliable data for analysis
- **Trend Detection**: Identify real patterns vs. errors
- **Decision Making**: Make informed decisions based on valid data
- **Compliance**: Meet industry standards and requirements

---

## 🔍 Validation Logic

### **Error Detection Algorithm**

1. **Type Check**: Ensure value is a valid number
2. **Range Check**: Verify value is within absolute limits
3. **Normal Range Check**: Check if value is within normal operating range
4. **Context Validation**: Consider relationships between parameters

### **Severity Levels**

- **Error**: Values that are impossible or dangerous
- **Warning**: Values outside normal range but technically possible
- **Info**: Values that could be optimized

### **Suggested Values**

- Provide realistic alternatives when values are invalid
- Base suggestions on industry standards and best practices
- Consider context and relationships between parameters

---

## 📋 Best Practices

### **For Implementation**
1. **Validate Early**: Check values as users type
2. **Clear Messages**: Provide specific, actionable feedback
3. **Visual Cues**: Use color and icons for quick recognition
4. **Helpful Suggestions**: Offer realistic alternatives

### **For Users**
1. **Check Validation**: Review validation messages before submitting
2. **Use Suggestions**: Consider suggested values when provided
3. **Verify Measurements**: Ensure accurate readings before entry
4. **Report Issues**: Contact support if validation seems incorrect

---

## 🔧 Customization

### **Adding New Parameters**

```typescript
// Add to REALISTIC_RANGES
newParameter: {
  min: 0,
  max: 100,
  normal: { min: 10, max: 90 },
  unit: 'units'
}

// Create validation function
export function validateNewParameter(value: string | number): ValidationError[] {
  // Implementation
}
```

### **Modifying Ranges**

```typescript
// Update ranges in REALISTIC_RANGES
temperature: {
  min: -20, // Updated minimum
  max: 60,  // Updated maximum
  normal: { min: 10, max: 40 }, // Updated normal range
  unit: '°C'
}
```

---

## 📞 Support

### **Common Issues**
- **Validation not showing**: Check if validation state is properly set
- **Wrong ranges**: Verify REALISTIC_RANGES configuration
- **Performance issues**: Optimize validation frequency

### **Getting Help**
- Review this guide for implementation details
- Check console for validation errors
- Contact development team for custom requirements

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Production Ready





