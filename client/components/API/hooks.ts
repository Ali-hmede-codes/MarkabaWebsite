// Custom Hooks for API Components
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { APIResponse } from './types';
import { API_BASE_URL } from '../../lib/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic API hook
export function useAPI<T = unknown>(endpoint: string, options?: {
  immediate?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const execute = useCallback(async (customData?: Record<string, unknown>, customParams?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const config = {
        method: options?.method || 'GET',
        url: endpoint,
        data: customData || options?.data,
        params: customParams || options?.params,
      };

      const response = await apiClient.request<APIResponse<T>>(config);
      
      if (response.data.success) {
        setData(response.data.data || null);
        return response.data;
      } else {
        throw new Error(response.data.error || 'API request failed');
      }
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || (err as Error).message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage, data: null };
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    if (!hasInitialized && options?.immediate !== false && options?.method !== 'POST') {
      setHasInitialized(true);
      execute();
    }
  }, [execute, options?.immediate, options?.method, hasInitialized]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
}

// Specific hooks for different endpoints
export function usePosts(filters?: Record<string, unknown>) {
  return useAPI<import('./types').PostsResponse>('/posts', {
    params: filters,
    immediate: true,
  });
}

export function usePost(id: string | number, slug?: string) {
  const endpoint = slug ? `/posts/${id}/${slug}` : `/posts/${id}`;
  return useAPI(endpoint, {
    immediate: !!id,
  });
}

export function useCategories() {
  return useAPI<import('./types').CategoriesResponse>('/categories', {
    immediate: true,
  });
}

export function usePrayerTimes() {
  return useAPI('/prayer/current', {
    immediate: true,
  });
}

export function useWeather() {
  return useAPI('/weather/current', {
    immediate: true,
  });
}

export function useBreakingNews() {
  return useAPI('/breaking-news/active', {
    immediate: true,
  });
}

export function useUsers() {
  return useAPI('/users', {
    immediate: false, // Requires auth
  });
}

export function useSettings() {
  return useAPI<import('./types').SiteSetting[]>('/settings/public', {
    immediate: true,
  });
}

export function useSocialMedia() {
  return useAPI<import('./types').SocialMediaResponse>('/social-media', {
    immediate: true,
  });
}

// Mutation hooks
export function useCreatePost() {
  return useAPI('/posts', {
    method: 'POST',
    immediate: false,
  });
}

export function useUpdatePost(id: string | number) {
  return useAPI(`/posts/${id}`, {
    method: 'PUT',
    immediate: false,
  });
}

export function useDeletePost(id: string | number) {
  return useAPI(`/posts/${id}`, {
    method: 'DELETE',
    immediate: false,
  });
}

export function useLogin() {
  return useAPI('/auth/login', {
    method: 'POST',
    immediate: false,
  });
}

export function useLogout() {
  return useAPI('/auth/logout', {
    method: 'POST',
    immediate: false,
  });
}

export function useCreateSocialMedia() {
  return useAPI('/social-media', {
    method: 'POST',
    immediate: false,
  });
}

export function useUpdateSocialMedia(id: string | number) {
  return useAPI(`/social-media/${id}`, {
    method: 'PUT',
    immediate: false,
  });
}

export function useDeleteSocialMedia(id: string | number) {
  return useAPI(`/social-media/${id}`, {
    method: 'DELETE',
    immediate: false,
  });
}

export function useReorderSocialMedia() {
  return useAPI('/social-media/reorder', {
    method: 'PUT',
    immediate: false,
  });
}

// Upload hook
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, type: string = 'general') => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err: unknown) {
      const errorMessage = (err as any).response?.data?.message || (err as Error).message || 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    upload,
    uploading,
    error,
  };
}

// Export the API client for direct use
export { apiClient };