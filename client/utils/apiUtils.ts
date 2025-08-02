/**
 * API Utility Functions
 * Handles API URL configuration for both development and production environments
 */

/**
 * Get the base API URL based on environment
 * @returns {string} The base API URL
 */
export const getApiBaseUrl = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:5000' : 'https://api.markaba.news';
};

/**
 * Get the API version path based on environment
 * @returns {string} The API version path
 */
export const getApiVersion = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? '/api' : '/api/v2';
};

/**
 * Build a complete API URL
 * @param {string} endpoint - The API endpoint (e.g., '/weather', '/prayer/current')
 * @returns {string} The complete API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const version = getApiVersion();
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  return `${baseUrl}${version}/${cleanEndpoint}`;
};

/**
 * Fetch data from API with proper URL handling
 * @param {string} endpoint - The API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
};

/**
 * Fetch JSON data from API
 * @param {string} endpoint - The API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} The JSON response
 */
export const apiFetchJson = async (endpoint: string, options?: RequestInit): Promise<any> => {
  const response = await apiFetch(endpoint, options);
  return response.json();
};