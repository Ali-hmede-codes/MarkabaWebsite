// Breaking News API Component
import React, { useState, useCallback, useEffect } from 'react';
import { BreakingNews, APIComponentProps } from './types';
import { useBreakingNews, useAPI } from './hooks';

interface BreakingNewsAPIProps extends APIComponentProps {
  children?: (props: BreakingNewsAPIRenderProps) => React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  maxItems?: number;
}

interface BreakingNewsAPIRenderProps {
  // Data
  breakingNews: BreakingNews[];
  activeNews: BreakingNews[];
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  refreshing: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchBreakingNews: () => Promise<void>;
  createBreakingNews: (newsData: Partial<BreakingNews>) => Promise<BreakingNews>;
  updateBreakingNews: (id: string | number, newsData: Partial<BreakingNews>) => Promise<BreakingNews>;
  deleteBreakingNews: (id: string | number) => Promise<void>;
  toggleNewsStatus: (id: string | number) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

const BreakingNewsAPI: React.FC<BreakingNewsAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  maxItems = 10
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // API hooks
  const { 
    data: breakingNews, 
    loading: newsLoading, 
    error: newsError, 
    execute: fetchNewsExecute 
  } = useBreakingNews();
  
  const { 
    loading: creating, 
    error: createError, 
    execute: createExecute 
  } = useAPI('/breaking-news', {
    method: 'POST',
    immediate: false,
  });
  
  const { 
    loading: updating, 
    error: updateError, 
    execute: updateExecute 
  } = useAPI('/breaking-news', {
    method: 'PUT',
    immediate: false,
  });
  
  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteExecute 
  } = useAPI('/breaking-news', {
    method: 'DELETE',
    immediate: false,
  });

  // Combined error handling
  const error = newsError || createError || updateError || deleteError;
  const loading = newsLoading;

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAll();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filter active news
  const activeNews = (breakingNews as BreakingNews[])?.filter((news: BreakingNews) => news.is_active) || [];

  // Actions
  const fetchBreakingNews = useCallback(async () => {
    try {
      await fetchNewsExecute();
      onSuccess?.('Breaking news fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchNewsExecute, onError, onSuccess]);

  const createBreakingNews = useCallback(async (newsData: Partial<BreakingNews>) => {
    try {
      const result = await createExecute(newsData);
      onSuccess?.('Breaking news created successfully');
      // Refresh news list
      await fetchBreakingNews();
      return result.data as BreakingNews;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [createExecute, fetchBreakingNews, onError, onSuccess]);

  const updateBreakingNews = useCallback(async (id: string | number, newsData: Partial<BreakingNews>) => {
    try {
      const result = await updateExecute(newsData, {
        url: `/breaking-news/${id}`
      });
      onSuccess?.('Breaking news updated successfully');
      // Refresh news list
      await fetchBreakingNews();
      return result.data as BreakingNews;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [updateExecute, fetchBreakingNews, onError, onSuccess]);

  const deleteBreakingNews = useCallback(async (id: string | number) => {
    try {
      await deleteExecute(undefined, {
        url: `/breaking-news/${id}`
      });
      onSuccess?.('Breaking news deleted successfully');
      // Refresh news list
      await fetchBreakingNews();
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [deleteExecute, fetchBreakingNews, onError, onSuccess]);

  const toggleNewsStatus = useCallback(async (id: string | number) => {
    try {
      const newsItem = (breakingNews as BreakingNews[])?.find((news: BreakingNews) => news.id === id);
      if (newsItem) {
        await updateBreakingNews(id, { is_active: !newsItem.is_active });
      }
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [breakingNews, updateBreakingNews, onError]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBreakingNews();
      onSuccess?.('Breaking news refreshed successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchBreakingNews, onError, onSuccess]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderProps: BreakingNewsAPIRenderProps = {
    // Data
    breakingNews: (breakingNews as BreakingNews[]) || [],
    activeNews,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    refreshing,
    
    // Error states
    error,
    
    // Actions
    fetchBreakingNews,
    createBreakingNews,
    updateBreakingNews,
    deleteBreakingNews,
    toggleNewsStatus,
    refreshAll,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`breaking-news-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`breaking-news-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Breaking News</h3>
          <div className="flex space-x-2">
            <button
              onClick={refreshAll}
              disabled={refreshing || loading}
              className="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {/* Active Breaking News */}
        {activeNews.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Active Breaking News
            </h4>
            <div className="space-y-3">
              {activeNews.slice(0, maxItems).map((news: BreakingNews) => (
                <div key={news.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-red-900 mb-1">
                        {news.title}
                      </h5>
                      <p className="text-red-700 text-sm">
                        {news.content}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ml-3 ${getPriorityColor('low')}`}>
                      Low
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-red-600">
                    <span>{formatDate(news.created_at)}</span>
                    <button
                      onClick={() => toggleNewsStatus(news.id)}
                      disabled={updating}
                      className="text-red-800 hover:text-red-900 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* All Breaking News */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">All Breaking News</h4>
          <div className="space-y-3">
            {renderProps.breakingNews.slice(0, maxItems).map((news: BreakingNews) => (
              <div key={news.id} className={`p-4 rounded-lg border ${
                news.is_active 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className={`font-semibold ${
                        news.is_active ? 'text-red-900' : 'text-gray-900'
                      }`}>
                        {news.title}
                      </h5>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        news.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {news.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      news.is_active ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {news.content}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ml-3 ${getPriorityColor('low')}`}>
                    Low
                  </span>
                </div>
                <div className={`flex items-center justify-between text-xs ${
                  news.is_active ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <span>{formatDate(news.created_at)}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleNewsStatus(news.id)}
                      disabled={updating}
                      className={`hover:opacity-80 disabled:opacity-50 ${
                        news.is_active ? 'text-red-800' : 'text-green-600'
                      }`}
                    >
                      {news.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteBreakingNews(news.id)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {renderProps.breakingNews.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No breaking news found
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakingNewsAPI;