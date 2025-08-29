import { VALIDATION_RULES } from './constants';

export const validation = {
  // User validation
  validateName: (name) => {
    if (!name || name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return null;
  },

  validateEmail: (email) => {
    if (!email) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  validatePassword: (password) => {
    if (!password) return 'Password is required';
    
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`;
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    return null;
  },

  validateConfirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  },

  validateRole: (role) => {
    const validRoles = ['project_developer', 'credit_buyer', 'regulatory_body'];
    if (!role || !validRoles.includes(role)) {
      return 'Please select a valid role';
    }
    return null;
  },

  validateOrganization: (organization) => {
    if (!organization || organization.trim().length < VALIDATION_RULES.ORGANIZATION_MIN_LENGTH) {
      return 'Organization name is required';
    }
    return null;
  },

  // Project validation
  validateProjectName: (name) => {
    if (!name || name.trim().length < VALIDATION_RULES.PROJECT_NAME_MIN_LENGTH) {
      return `Project name must be at least ${VALIDATION_RULES.PROJECT_NAME_MIN_LENGTH} characters long`;
    }
    return null;
  },

  validateProjectDescription: (description) => {
    if (!description || description.trim().length < VALIDATION_RULES.PROJECT_DESCRIPTION_MIN_LENGTH) {
      return `Description must be at least ${VALIDATION_RULES.PROJECT_DESCRIPTION_MIN_LENGTH} characters long`;
    }
    return null;
  },

  validateProjectType: (type) => {
    const validTypes = ['renewable_energy', 'afforestation', 'energy_efficiency', 'waste_management', 'transportation', 'industrial'];
    if (!type || !validTypes.includes(type)) {
      return 'Please select a valid project type';
    }
    return null;
  },

  validateDate: (date, fieldName = 'Date') => {
    if (!date) return `${fieldName} is required`;
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return `Please enter a valid ${fieldName.toLowerCase()}`;
    }
    return null;
  },

  validateDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return 'End date must be after start date';
    }
    
    if (start < new Date()) {
      return 'Start date cannot be in the past';
    }
    
    return null;
  },

  validateLocation: (location) => {
    if (!location?.country) return 'Country is required';
    if (!location?.state) return 'State is required';
    return null;
  },

  validateExpectedCredits: (credits) => {
    if (!credits || credits <= 0) {
      return 'Expected credits must be greater than 0';
    }
    
    if (credits > 1000000) {
      return 'Expected credits seems too high. Please verify.';
    }
    
    return null;
  },

  // Credit validation
  validateCreditAmount: (amount) => {
    if (!amount || amount <= 0) {
      return 'Credit amount must be greater than 0';
    }
    return null;
  },

  validateVintage: (vintage) => {
    const currentYear = new Date().getFullYear();
    if (!vintage || vintage < 2020 || vintage > currentYear + 1) {
      return 'Please enter a valid vintage year';
    }
    return null;
  },

  validatePrice: (price) => {
    if (!price || price <= 0) {
      return 'Price must be greater than 0';
    }
    
    if (price > 1000) {
      return 'Price seems too high. Please verify.';
    }
    
    return null;
  },

  // File validation
  validateFile: (file, allowedTypes, maxSize) => {
    if (!file) return 'File is required';
    
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    
    if (maxSize && file.size > maxSize) {
      return `File size too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`;
    }
    
    return null;
  },

  // Form validation helper
  validateForm: (data, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const validator = rules[field];
      const value = data[field];
      
      if (typeof validator === 'function') {
        const error = validator(value);
        if (error) errors[field] = error;
      } else if (Array.isArray(validator)) {
        for (const rule of validator) {
          const error = rule(value);
          if (error) {
            errors[field] = error;
            break;
          }
        }
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Validation rule builders
export const required = (fieldName) => (value) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const minLength = (min, fieldName) => (value) => {
  if (value && value.length < min) {
    return `${fieldName} must be at least ${min} characters long`;
  }
  return null;
};

export const maxLength = (max, fieldName) => (value) => {
  if (value && value.length > max) {
    return `${fieldName} must be no more than ${max} characters long`;
  }
  return null;
};

export const pattern = (regex, message) => (value) => {
  if (value && !regex.test(value)) {
    return message;
  }
  return null;
};

export const min = (minValue, fieldName) => (value) => {
  if (value !== undefined && value < minValue) {
    return `${fieldName} must be at least ${minValue}`;
  }
  return null;
};

export const max = (maxValue, fieldName) => (value) => {
  if (value !== undefined && value > maxValue) {
    return `${fieldName} must be no more than ${maxValue}`;
  }
  return null;
};