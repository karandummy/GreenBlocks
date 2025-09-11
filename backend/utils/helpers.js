const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// String utilities
exports.generateId = (length = 8) => {
  return crypto.randomBytes(length).toString('hex');
};

exports.generateProjectId = () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(2).toString('hex');
  return `PRJ-${timestamp}-${random}`.toUpperCase();
};

exports.generateCreditId = (vintage) => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(3).toString('hex');
  return `CC-${vintage}-${timestamp}-${random}`.toUpperCase();
};

exports.slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

exports.capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Date utilities
exports.formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
};

exports.addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

exports.isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

// File utilities
exports.ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

exports.isValidFileType = (filename, allowedTypes) => {
  const ext = exports.getFileExtension(filename);
  return allowedTypes.includes(ext);
};

exports.formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validation utilities
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.isValidPassword = (password) => {
  return password && password.length >= 6;
};

exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Number utilities
exports.formatNumber = (num, decimals = 2) => {
  if (!num || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

exports.generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Object utilities
exports.pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

exports.omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

exports.isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return !obj;
};

// Async utilities
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Pagination utilities
exports.getPaginationOptions = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

exports.buildPaginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      limit,
      count: data.length,
      totalCount: total
    }
  };
};

// Error handling utilities
exports.createError = (message, statusCode = 500, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

exports.handleDatabaseError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return exports.createError(`${field} already exists`, 400, 'DUPLICATE_FIELD');
  }
  
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return exports.createError(messages.join(', '), 400, 'VALIDATION_ERROR');
  }
  
  if (error.name === 'CastError') {
    return exports.createError('Invalid ID format', 400, 'INVALID_ID');
  }
  
  return error;
};

// Hash utilities
exports.generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

exports.verifyHash = (data, hash) => {
  const generatedHash = exports.generateHash(data);
  return generatedHash === hash;
};

// Array utilities
exports.chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

exports.unique = (array) => {
  return [...new Set(array)];
};

exports.groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};