// src/utils/formatter.js
// This file provides utility functions for formatting data

/**
 * Format currency values
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (e.g., CNY, USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'CNY') => {
  if (amount == null) return '0.00';
  
  switch (currency) {
    case 'CNY':
      return `¥${amount.toFixed(2)}`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    default:
      return `${amount.toFixed(2)} ${currency}`;
  }
};

/**
 * Format dates with optional patterns
 * @param {string|Date} date - The date to format
 * @param {string} pattern - Optional format pattern
 * @returns {string} Formatted date string
 */
export const formatDate = (date, pattern = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  // Simple formatting for common patterns
  if (pattern === 'YYYY-MM-DD') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  
  if (pattern === 'MM/DD/YYYY') {
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }
  
  // Return localized date string if no specific pattern matches
  return d.toLocaleDateString();
};

/**
 * Format numbers with thousands separators
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (value == null) return '0';
  return value.toLocaleString();
};

/**
 * Format file size
 * @param {number} bytes - The file size in bytes
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration in seconds to hh:mm:ss
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hrs > 0) {
    result += `${String(hrs).padStart(2, '0')}:`;
  }
  
  result += `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  return result;
};

/**
 * Format percentage
 * @param {number} value - The value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value == null) return '0%';
  return `${value.toFixed(decimals)}%`;
};
