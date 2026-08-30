// API configuration and utility functions

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

// Server-side only: talk to Express on this machine, never the public hostname.
// Using markaba.news here would loop back through nginx/Next and 404.
export const INTERNAL_API_BASE = stripTrailingSlash(
  process.env.BACKEND_INTERNAL_URL
    ? (process.env.BACKEND_INTERNAL_URL.includes('/api/')
        ? process.env.BACKEND_INTERNAL_URL
        : `${stripTrailingSlash(process.env.BACKEND_INTERNAL_URL)}/api/v2`)
    : 'http://127.0.0.1:5000/api/v2'
);

export const INTERNAL_BACKEND_ORIGIN = stripTrailingSlash(
  process.env.BACKEND_INTERNAL_URL?.replace(/\/api\/v2\/?$/, '') || 'http://127.0.0.1:5000'
);

// Browser-facing API (baked into the client bundle)
export const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';

// On the Next.js server, always call Express locally. In the browser, use the public URL.
export const API_BASE_URL =
  typeof window === 'undefined' ? INTERNAL_API_BASE : PUBLIC_API_BASE;

// Default API headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Timeout configuration (30 seconds)
const API_TIMEOUT = 30000;

// Create timeout controller for fetch requests
export const createTimeoutController = (timeout: number = API_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  const cleanup = () => {
    clearTimeout(timeoutId);
  };
  
  return { controller, timeoutId, cleanup };
};

// Handle API errors with consistent error formatting
export const handleApiError = (error: any, endpoint: string) => {
  console.error(`API Error for ${endpoint}:`, error);
  
  // Handle AbortError (timeout)
  if (error.name === 'AbortError') {
    return {
      status: 408,
      error: 'Request Timeout',
      message: 'The request took too long to complete',
      endpoint
    };
  }
  
  // Handle network errors
  if (error.message?.includes('fetch')) {
    return {
      status: 503,
      error: 'Service Unavailable',
      message: 'Unable to connect to the server',
      endpoint
    };
  }
  
  // Handle server errors with status codes
  if (error.message?.includes('Server responded with')) {
    const statusMatch = error.message.match(/Server responded with (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 500;
    
    return {
      status,
      error: 'Server Error',
      message: error.message,
      endpoint
    };
  }
  
  // Default error handling
  return {
    status: 500,
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    endpoint
  };
};

// Export default configuration object
export default {
  API_BASE_URL,
  API_HEADERS,
  createTimeoutController,
  handleApiError,
};