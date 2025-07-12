// API utility functions and configurations

import { LoginCredentials, AuthResponse, User } from '../../components/API/types';

// Base API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000/api/v2';

// API request helper
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available (from cookies)
  if (typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
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
    console.error('API request failed:', error);
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