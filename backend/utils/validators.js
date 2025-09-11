const { body, param, query } = require('express-validator');
const { VALIDATION, USER_ROLES, PROJECT_TYPES } = require('./constants');

// User validation rules
exports.validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('password')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('role')
    .isIn(Object.values(USER_ROLES))
    .withMessage('Please select a valid role'),
    
  body('organization')
    .trim()
    .isLength({ min: VALIDATION.ORGANIZATION_MIN_LENGTH })
    .withMessage('Organization name is required')
];

exports.validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Project validation rules
exports.validateProjectCreation = [
  body('name')
    .trim()
    .isLength({ min: VALIDATION.PROJECT_NAME_MIN_LENGTH })
    .withMessage(`Project name must be at least ${VALIDATION.PROJECT_NAME_MIN_LENGTH} characters long`),
    
  body('description')
    .trim()
    .isLength({ min: VALIDATION.PROJECT_DESCRIPTION_MIN_LENGTH })
    .withMessage(`Description must be at least ${VALIDATION.PROJECT_DESCRIPTION_MIN_LENGTH} characters long`),
    
  body('type')
    .isIn(Object.values(PROJECT_TYPES))
    .withMessage('Please select a valid project type'),
    
  body('location.country')
    .notEmpty()
    .withMessage('Country is required'),
    
  body('location.state')
    .notEmpty()
    .withMessage('State is required'),
    
  body('projectDetails.startDate')
    .isISO8601()
    .withMessage('Valid start date is required')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
    
  body('projectDetails.endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.projectDetails.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  body('projectDetails.expectedCredits')
    .isNumeric()
    .withMessage('Expected credits must be a number')
    .isFloat({ min: VALIDATION.MIN_CREDITS, max: VALIDATION.MAX_CREDITS })
    .withMessage(`Expected credits must be between ${VALIDATION.MIN_CREDITS} and ${VALIDATION.MAX_CREDITS}`),
    
  body('projectDetails.methodology')
    .trim()
    .notEmpty()
    .withMessage('Methodology is required'),
    
  body('projectDetails.baseline')
    .trim()
    .notEmpty()
    .withMessage('Baseline is required')
];

// Credit validation rules
exports.validateCreditClaim = [
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required'),
    
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
    
  body('vintage')
    .isNumeric()
    .isInt({ min: VALIDATION.MIN_VINTAGE_YEAR, max: VALIDATION.MAX_VINTAGE_YEAR })
    .withMessage(`Vintage must be between ${VALIDATION.MIN_VINTAGE_YEAR} and ${VALIDATION.MAX_VINTAGE_YEAR}`)
];

exports.validateCreditPurchase = [
  body('creditId')
    .isMongoId()
    .withMessage('Valid credit ID is required'),
    
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0')
];

// MRV Data validation rules
exports.validateMRVData = [
  body('reportingPeriod.startDate')
    .isISO8601()
    .withMessage('Valid reporting period start date is required'),
    
  body('reportingPeriod.endDate')
    .isISO8601()
    .withMessage('Valid reporting period end date is required')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.reportingPeriod.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  body('measurements')
    .isArray({ min: 1 })
    .withMessage('At least one measurement is required'),
    
  body('measurements.*.parameter')
    .trim()
    .notEmpty()
    .withMessage('Parameter name is required'),
    
  body('measurements.*.value')
    .isNumeric()
    .withMessage('Measurement value must be numeric'),
    
  body('measurements.*.unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required'),
    
  body('measurements.*.measurementDate')
    .isISO8601()
    .withMessage('Valid measurement date is required'),
    
  body('emissionReductions.baseline')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Baseline emissions must be a positive number'),
    
  body('emissionReductions.actual')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Actual emissions must be a positive number'),
    
  body('emissionReductions.reduction')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Emission reduction must be a positive number'),
    
  body('emissionReductions.methodology')
    .trim()
    .notEmpty()
    .withMessage('Methodology is required')
];

// Parameter validation rules
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Valid ID is required')
];

exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Custom validation functions
exports.validateDateRange = (startField, endField) => [
  body(startField)
    .isISO8601()
    .withMessage(`Valid ${startField} is required`),
    
  body(endField)
    .isISO8601()
    .withMessage(`Valid ${endField} is required`)
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body[startField]);
      if (endDate <= startDate) {
        throw new Error(`${endField} must be after ${startField}`);
      }
      return true;
    })
];

exports.validateFileUpload = (fieldName, maxSize, allowedTypes) => [
  body(fieldName)
    .custom((value, { req }) => {
      if (!req.files || !req.files[fieldName]) {
        throw new Error('File is required');
      }
      
      const file = req.files[fieldName];
      
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }
      
      return true;
    })
];

// Verification validation rules
exports.validateInspection = [
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required'),
    
  body('inspectionDate')
    .isISO8601()
    .withMessage('Valid inspection date is required')
    .custom((value) => {
      const inspectionDate = new Date(value);
      const today = new Date();
      if (inspectionDate < today) {
        throw new Error('Inspection date cannot be in the past');
      }
      return true;
    }),
    
  body('inspectorNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Inspector notes cannot exceed 1000 characters')
];

exports.validateProjectReview = [
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comments cannot exceed 1000 characters'),
    
  body('status')
    .optional()
    .isIn(['approved', 'rejected', 'under_review'])
    .withMessage('Invalid status')
];

exports.validateProjectRejection = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Rejection reason must be between 10 and 1000 characters')
];