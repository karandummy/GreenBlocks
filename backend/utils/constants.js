// API Response Messages
exports.MESSAGES = {
  SUCCESS: {
    REGISTRATION: 'User registered successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    PROJECT_CREATED: 'Project created successfully',
    PROJECT_UPDATED: 'Project updated successfully',
    PROJECT_DELETED: 'Project deleted successfully',
    CREDITS_CLAIMED: 'Credits claimed successfully',
    CREDITS_PURCHASED: 'Credits purchased successfully',
    CREDITS_RETIRED: 'Credits retired successfully',
    PROJECT_APPROVED: 'Project approved successfully',
    PROJECT_REJECTED: 'Project rejected successfully'
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Access denied. Authentication required.',
    FORBIDDEN: 'Access denied. Insufficient permissions.',
    USER_EXISTS: 'User already exists with this email',
    USER_NOT_FOUND: 'User not found',
    PROJECT_NOT_FOUND: 'Project not found',
    CREDIT_NOT_FOUND: 'Credit not found',
    INVALID_TOKEN: 'Invalid or expired token',
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation failed',
    FILE_UPLOAD_ERROR: 'File upload failed',
    BLOCKCHAIN_ERROR: 'Blockchain operation failed'
  }
};

// User Roles
exports.USER_ROLES = {
  PROJECT_DEVELOPER: 'project_developer',
  CREDIT_BUYER: 'credit_buyer',
  REGULATORY_BODY: 'regulatory_body'
};

// Project Status
exports.PROJECT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Credit Status
exports.CREDIT_STATUS = {
  ISSUED: 'issued',
  LISTED: 'listed',
  SOLD: 'sold',
  RETIRED: 'retired'
};

// Project Types
exports.PROJECT_TYPES = {
  RENEWABLE_ENERGY: 'renewable_energy',
  AFFORESTATION: 'afforestation',
  ENERGY_EFFICIENCY: 'energy_efficiency',
  WASTE_MANAGEMENT: 'waste_management',
  TRANSPORTATION: 'transportation',
  INDUSTRIAL: 'industrial'
};

// Blockchain Transaction Types
exports.TRANSACTION_TYPES = {
  MINT: 'mint',
  TRANSFER: 'transfer',
  BURN: 'burn',
  APPROVE: 'approve',
  MARKETPLACE: 'marketplace'
};

// File Upload Constants
exports.FILE_UPLOAD = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  MAX_FILES: 10
};

// Rate Limiting
exports.RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5 // 5 login attempts per 15 minutes
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100 // 100 requests per 15 minutes
  },
  FILE_UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 20 // 20 file uploads per hour
  }
};

// Validation Rules
exports.VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PROJECT_NAME_MIN_LENGTH: 3,
  PROJECT_DESCRIPTION_MIN_LENGTH: 10,
  ORGANIZATION_MIN_LENGTH: 2,
  MAX_VINTAGE_YEAR: new Date().getFullYear() + 1,
  MIN_VINTAGE_YEAR: 1990 // doubt
};