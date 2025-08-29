// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    VERIFY: '/auth/verify'
  },
  PROJECTS: {
    BASE: '/projects',
    MY_PROJECTS: '/projects/my-projects',
    DOCUMENTS: (id) => `/projects/${id}/documents`,
    MRV_DATA: (id) => `/projects/${id}/mrv-data`
  },
  CREDITS: {
    BASE: '/credits',
    MARKETPLACE: '/credits/marketplace',
    MY_CREDITS: '/credits/my-credits',
    CLAIM: '/credits/claim',
    PURCHASE: '/credits/purchase',
    RETIRE: '/credits/retire'
  },
  BLOCKCHAIN: {
    TRANSACTIONS: '/blockchain/transactions',
    BALANCE: '/blockchain/wallet',
    DEPLOY: '/blockchain/deploy-contract'
  }
};

// User Roles
export const USER_ROLES = {
  PROJECT_DEVELOPER: 'project_developer',
  CREDIT_BUYER: 'credit_buyer',
  REGULATORY_BODY: 'regulatory_body'
};

// Project Types
export const PROJECT_TYPES = {
  RENEWABLE_ENERGY: 'renewable_energy',
  AFFORESTATION: 'afforestation',
  ENERGY_EFFICIENCY: 'energy_efficiency',
  WASTE_MANAGEMENT: 'waste_management',
  TRANSPORTATION: 'transportation',
  INDUSTRIAL: 'industrial'
};

// Project Status
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Credit Status
export const CREDIT_STATUS = {
  ISSUED: 'issued',
  LISTED: 'listed',
  SOLD: 'sold',
  RETIRED: 'retired'
};

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  MAX_FILES: 10
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PROJECT_NAME_MIN_LENGTH: 3,
  PROJECT_DESCRIPTION_MIN_LENGTH: 10,
  ORGANIZATION_MIN_LENGTH: 2
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
};

// Colors for Charts and UI
export const COLORS = {
  PRIMARY: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  SECONDARY: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  STATUS: {
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6'
  }
};

// Default Values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 10
  },
  SEARCH: {
    DEBOUNCE_DELAY: 300
  },
  TOAST: {
    DURATION: 4000,
    POSITION: 'top-right'
  }
};

// Countries for project location
export const COUNTRIES = [
  'India', 'United States', 'China', 'Brazil', 'Germany', 
  'United Kingdom', 'France', 'Canada', 'Australia', 'Japan'
];

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Currency Options
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
];

// Blockchain Networks
export const BLOCKCHAIN_NETWORKS = {
  LOCALHOST: {
    name: 'Localhost',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545'
  },
  ETHEREUM_MAINNET: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io'
  },
  ETHEREUM_SEPOLIA: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io'
  }
};