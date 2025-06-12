import crypto from 'crypto';

// Key generation utilities
export function generateKey(prefix = '', length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 4 === 0) {
      result += '-';
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

export function generatePremiumKey(model) {
  const modelPrefix = model.toUpperCase().substring(0, 3);
  return generateKey(modelPrefix, 20);
}

export function generateStandardKey() {
  return generateKey('KEY', 16);
}

export function generateUUID() {
  return crypto.randomUUID();
}

export function validateKeyFormat(key) {
  // Check if key follows the format: XXX-XXXX-XXXX-XXXX or similar
  const keyRegex = /^[A-Z0-9]{3,4}(-[A-Z0-9]{4}){2,4}$/;
  return keyRegex.test(key);
}

export function formatKeyForDisplay(key) {
  // Ensure key is properly formatted with dashes
  const cleanKey = key.replace(/[^A-Z0-9]/g, '');
  const chunks = [];
  
  for (let i = 0; i < cleanKey.length; i += 4) {
    chunks.push(cleanKey.slice(i, i + 4));
  }
  
  return chunks.join('-');
}

export function calculateExpiryDate(duration) {
  const now = new Date();
  
  switch (duration.toLowerCase()) {
    case '1d':
    case '1day':
    case 'day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    case '7d':
    case '7days':
    case 'week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    case '30d':
    case '30days':
    case 'month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    case '90d':
    case '90days':
    case '3months':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    case '365d':
    case '365days':
    case 'year':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    case 'lifetime':
    case 'permanent':
      return null; // No expiry
    
    default:
      // Try to parse custom duration (e.g., "60d" for 60 days)
      const match = duration.match(/^(\d+)d$/);
      if (match) {
        const days = parseInt(match[1]);
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      }
      throw new Error('Invalid duration format');
  }
}

export function formatDuration(duration) {
  switch (duration.toLowerCase()) {
    case '1d':
    case '1day':
    case 'day':
      return '1 Day';
    
    case '7d':
    case '7days':
    case 'week':
      return '7 Days';
    
    case '30d':
    case '30days':
    case 'month':
      return '30 Days';
    
    case '90d':
    case '90days':
    case '3months':
      return '90 Days';
    
    case '365d':
    case '365days':
    case 'year':
      return '1 Year';
    
    case 'lifetime':
    case 'permanent':
      return 'Lifetime';
    
    default:
      const match = duration.match(/^(\d+)d$/);
      if (match) {
        const days = parseInt(match[1]);
        return `${days} Days`;
      }
      return duration;
  }
}

export function getTimeRemaining(expiryDate) {
  if (!expiryDate) return 'Lifetime';
  
  const now = new Date();
  const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
} 