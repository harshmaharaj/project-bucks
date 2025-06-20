
import DOMPurify from 'dompurify';

// HTML sanitization for user inputs
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

// Input length validation to prevent DoS
export const validateInputLength = (input: string, maxLength: number = 255): boolean => {
  return input.length <= maxLength;
};

// Sanitize and validate text input
export const sanitizeAndValidateText = (input: string, maxLength: number = 255): string => {
  if (!validateInputLength(input, maxLength)) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  return sanitizeHtml(input.trim());
};

// Rate limiting storage key generator
export const getRateLimitKey = (action: string, identifier: string): string => {
  return `rate_limit_${action}_${identifier}`;
};

// Simple client-side rate limiting
export const checkRateLimit = (action: string, identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean => {
  const key = getRateLimitKey(action, identifier);
  const stored = localStorage.getItem(key);
  const now = Date.now();
  
  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
    return true;
  }
  
  const { count, resetTime } = JSON.parse(stored);
  
  if (now > resetTime) {
    localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
    return true;
  }
  
  if (count >= maxAttempts) {
    return false;
  }
  
  localStorage.setItem(key, JSON.stringify({ count: count + 1, resetTime }));
  return true;
};

// Sanitize error messages to prevent information disclosure
export const sanitizeErrorMessage = (error: any): string => {
  const defaultMessage = 'An unexpected error occurred. Please try again.';
  
  if (!error) return defaultMessage;
  
  // Known safe error messages from Supabase auth
  const safeMessages = [
    'Invalid login credentials',
    'Email not confirmed',
    'User already registered',
    'Password should be at least 6 characters',
    'Email already in use',
    'Invalid email format'
  ];
  
  const errorMessage = error.message || error.toString();
  
  // Return safe messages as-is
  if (safeMessages.some(safe => errorMessage.includes(safe))) {
    return errorMessage;
  }
  
  // Log the actual error for debugging (in production, this would go to a secure log)
  console.error('Sanitized error:', error);
  
  return defaultMessage;
};

// Security headers helper (for development reference)
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), location=()'
});
