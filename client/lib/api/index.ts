// API utility functions and configurations

import { LoginCredentials, AuthResponse, User } from '../../components/API/types';

// Base API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';

// Enhanced API request helper with automatic token refresh
export const apiRequest = async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for refresh token
    ...options,
  };

  // Add auth token if available (from cookies or localStorage)
  if (typeof window !== 'undefined') {
    // Try to get token from cookies first
    let token: string | null = null;
    try {
      token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] || null;
    } catch (error) {
      console.warn('Error reading cookies:', error);
    }
    
    // Fallback to localStorage if not in cookies
    if (!token) {
      try {
        token = localStorage.getItem('token');
      } catch (error) {
        console.warn('localStorage not available:', error);
        token = null;
      }
    }
    
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    // Handle 401 errors with automatic token refresh
    if (response.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
      try {
        // Attempt to refresh token
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.data?.token) {
            // Update token in cookies with consistent expiration
            const rememberMe = document.cookie
              .split('; ')
              .find(row => row.startsWith('remember_me='))
              ?.split('=')[1] === 'true';
            
            const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 48 * 60 * 60; // Consistent with backend
            const isSecure = window.location.protocol === 'https:';
            document.cookie = `token=${refreshData.data.token}; max-age=${cookieMaxAge}; path=/; ${isSecure ? 'secure; ' : ''}samesite=strict`;
            
            // Retry the original request with new token
            return apiRequest(endpoint, options, retryCount + 1);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    if (!response.ok) {
      // Create error object with response data
      const error = new Error(data.message || `HTTP error! status: ${response.status}`);
      (error as any).response = {
        status: response.status,
        data: data
      };
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Common API endpoints
export const api = {
  // Authentication
  login: (credentials: LoginCredentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),

  verifyToken: () =>
    apiRequest('/auth/verify', {
      method: 'GET',
    }),
    
  // Posts endpoints
  getPosts: (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/posts${queryString}`);
  },
  
  getPost: (id: string | number) =>
    apiRequest(`/posts/${id}`),
    
  // Categories endpoints
  getCategories: () =>
    apiRequest('/categories'),
    
  // Users endpoints
  getUsers: (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/users${queryString}`);
  },
  
  // Settings endpoints
  getSettings: () =>
    apiRequest('/settings'),
    
  updateSetting: (key: string, value: any) =>
    apiRequest(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
};

// Named exports for specific API modules
export const authApi = {
  login: api.login,
  logout: api.logout,
  verifyToken: api.verifyToken,
};

export const categoriesApi = {
  getCategories: api.getCategories,
};

export const postsApi = {
  getPosts: api.getPosts,
  getPost: api.getPost,
};

export const usersApi = {
  getUsers: api.getUsers,
};

export const settingsApi = {
  getSettings: api.getSettings,
  updateSetting: api.updateSetting,
};

export default api;