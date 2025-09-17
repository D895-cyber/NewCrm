const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Unable to complete validation rules
const validateUnableToComplete = [
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['Missing Parts', 'Equipment Failure', 'Access Issues', 'Customer Request', 'Safety Concerns', 'Technical Complexity', 'Other'])
    .withMessage('Invalid category'),
  handleValidationErrors
];

// Bulk unable to complete validation rules
const validateBulkUnableToComplete = [
  body('visitIds')
    .isArray({ min: 1 })
    .withMessage('Visit IDs must be a non-empty array'),
  body('visitIds.*')
    .isMongoId()
    .withMessage('Each visit ID must be a valid MongoDB ObjectId'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['Missing Parts', 'Equipment Failure', 'Access Issues', 'Customer Request', 'Safety Concerns', 'Technical Complexity', 'Other'])
    .withMessage('Invalid category'),
  handleValidationErrors
];

// Bulk reschedule validation rules
const validateBulkReschedule = [
  body('visitIds')
    .isArray({ min: 1 })
    .withMessage('Visit IDs must be a non-empty array'),
  body('visitIds.*')
    .isMongoId()
    .withMessage('Each visit ID must be a valid MongoDB ObjectId'),
  body('newScheduledDate')
    .isISO8601()
    .withMessage('New scheduled date must be a valid ISO 8601 date'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors
];

// Export validation rules
const validateExport = [
  query('format')
    .optional()
    .isIn(['csv', 'json'])
    .withMessage('Format must be either csv or json'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Weekly report validation rules
const validateWeeklyReport = [
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Audit log validation rules
const validateAuditLogs = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('action')
    .optional()
    .isIn(['CREATE', 'UPDATE', 'DELETE', 'UNABLE_TO_COMPLETE', 'RESCHEDULE', 'BULK_UPDATE', 'BULK_RESCHEDULE', 'EXPORT', 'LOGIN', 'LOGOUT'])
    .withMessage('Invalid action type'),
  query('category')
    .optional()
    .isIn(['Missing Parts', 'Equipment Failure', 'Access Issues', 'Customer Request', 'Safety Concerns', 'Technical Complexity', 'Other'])
    .withMessage('Invalid category'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  handleValidationErrors
];

// Service visit ID validation
const validateServiceVisitId = [
  param('id')
    .isMongoId()
    .withMessage('Service visit ID must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Custom validation for date range logic
const validateDateRangeLogic = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        message: 'Start date cannot be after end date',
        code: 'INVALID_DATE_RANGE'
      });
    }
    
    // Check if date range is not too large (e.g., more than 1 year)
    const diffInDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffInDays > 365) {
      return res.status(400).json({
        message: 'Date range cannot exceed 365 days',
        code: 'DATE_RANGE_TOO_LARGE'
      });
    }
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  if (req.body.reason) {
    req.body.reason = req.body.reason.trim();
  }
  
  if (req.body.category) {
    req.body.category = req.body.category.trim();
  }
  
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return str;
  };
  
  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
  };
  
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  
  next();
};

module.exports = {
  validateUnableToComplete,
  validateBulkUnableToComplete,
  validateBulkReschedule,
  validateExport,
  validateWeeklyReport,
  validateAuditLogs,
  validateServiceVisitId,
  validateDateRange,
  validateDateRangeLogic,
  sanitizeInput,
  handleValidationErrors
};
