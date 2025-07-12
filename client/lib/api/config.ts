/**
 * Centralized API configuration
 * This ensures consistent API base URL across all API routes
 */

// Get API base URL from environment with fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000/api/v2';

// API timeout configuration
export const API_TIMEOUT = 10000; // 10 seconds

// Common headers for API requests
export const API_HEADERS = {
  'Content-Type': 'application/json',
};

// Helper function to create AbortController with timeout
export function createTimeoutController(timeoutMs: number = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    controller,
    timeoutId,
    cleanup: () => clearTimeout(timeoutId)
  };
}

// Helper function for consistent error handling
export function handleApiError(error: unknown, endpoint: string) {
  console.error(`API error for ${endpoint}:`, error);
  
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      status: 408,
      error: 'Request timeout',
      message: 'The request took too long to complete',
      url: `${API_BASE_URL}${endpoint}`
    };
  }
  
  return {
    status: 500,
    error: 'API request failed',
    message: error instanceof Error ? error.message : 'Unknown error',
    url: `${API_BASE_URL}${endpoint}`
  };
}