// Ads API Component
import React, { useState, useCallback } from 'react';
import { Ad, AdFilters, AdPosition, AdStats, APIComponentProps } from './types';
import { useAds, useAdsByPosition, useAdPositions, useAdStats, useAdClick } from './hooks';
import { defaultTheme, createCustomTheme, generateTailwindClasses } from './theme';

interface AdsAPIProps extends APIComponentProps {
  children?: (props: AdsAPIRenderProps) => React.ReactNode;
  position?: string;
  showFilters?: boolean;
  showStats?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAdClick?: (ad: Ad) => void;
  onDataChange?: () => void;
}

interface AdsAPIRenderProps {
  // Data
  ads: Ad[];
  groupedAds: Record<string, Ad[]>;
  positions: AdPosition[];
  currentAd: Ad | null;
  adStats: AdStats | null;
  filters: AdFilters;
  
  // Loading states
  loading: boolean;
  statsLoading: boolean;
  clickTracking: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchAds: (filters?: AdFilters) => Promise<void>;
  fetchAdsByPosition: (position: string, limit?: number) => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchAdStats: (id: string | number) => Promise<void>;
  trackClick: (id: string | number, referrer?: string) => Promise<void>;
  setFilters: (filters: AdFilters) => void;
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

const AdsAPI: React.FC<AdsAPIProps> = ({
  children,
  className = '',
  mode = 'public',
  theme = 'light',
  accentColor,
  position,
  showFilters = false,
  showStats = false,
  autoRefresh = false,
  refreshInterval = 30000,
  onAdClick,
  onError,
  onSuccess
}) => {
  const [filters, setFilters] = useState<AdFilters>({
    position,
    is_active: true,
    limit: 10
  });
  const [currentAdId, setCurrentAdId] = useState<string | number | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Theme configuration
  const currentTheme = accentColor ? createCustomTheme(accentColor) : defaultTheme;
  const styles = generateTailwindClasses(currentTheme);
  
  // Check if admin mode is enabled
  const isAdminMode = mode === 'admin';
  
  // API hooks
  const {
    data: adsData,
    loading: adsLoading,
    error: adsError,
    execute: fetchAdsExecute
  } = useAds(filters as Record<string, unknown>);
  
  const {
    data: positionAdsData,
    loading: positionLoading,
    error: positionError,
    execute: fetchPositionAdsExecute
  } = useAdsByPosition(position || '', filters.limit);
  
  const {
    data: positionsData,
    loading: positionsLoading,
    error: positionsError,
    execute: fetchPositionsExecute
  } = useAdPositions();
  
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    execute: fetchStatsExecute
  } = useAdStats(currentAdId || '');
  
  const {
    loading: clickLoading,
    error: clickError,
    execute: clickExecute
  } = useAdClick(currentAdId || '');
  
  // Determine which data to use
  const currentAdsData = position ? positionAdsData : adsData;
  const currentLoading = position ? positionLoading : adsLoading;
  const currentError = position ? positionError : adsError;
  
  // Extract ads from response
  const ads = currentAdsData?.data || [];
  const groupedAds = currentAdsData?.grouped || {};
  const positions = positionsData || [];
  const adStats = statsData || null;
  
  // Combined error handling
  const error = currentError || positionsError || statsError || clickError;
  const loading = currentLoading || positionsLoading;
  
  // Actions
  const fetchAds = useCallback(async (newFilters?: AdFilters) => {
    try {
      if (newFilters) {
        setFilters(prev => ({ ...prev, ...newFilters }));
      }
      await fetchAdsExecute();
      onSuccess?.('Ads loaded successfully');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to fetch ads';
      onError?.(errorMessage);
    }
  }, [fetchAdsExecute, onSuccess, onError]);
  
  const fetchAdsByPosition = useCallback(async (pos: string, limit?: number) => {
    try {
      setFilters(prev => ({ ...prev, position: pos, limit }));
      await fetchPositionAdsExecute();
      onSuccess?.(`Ads for position ${pos} loaded successfully`);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to fetch ads by position';
      onError?.(errorMessage);
    }
  }, [fetchPositionAdsExecute, onSuccess, onError]);
  
  const fetchPositions = useCallback(async () => {
    try {
      await fetchPositionsExecute();
      onSuccess?.('Ad positions loaded successfully');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to fetch ad positions';
      onError?.(errorMessage);
    }
  }, [fetchPositionsExecute, onSuccess, onError]);
  
  const fetchAdStats = useCallback(async (id: string | number) => {
    try {
      setCurrentAdId(id);
      await fetchStatsExecute();
      onSuccess?.('Ad statistics loaded successfully');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to fetch ad statistics';
      onError?.(errorMessage);
    }
  }, [fetchStatsExecute, onSuccess, onError]);
  
  const trackClick = useCallback(async (id: string | number, referrer?: string) => {
    try {
      setCurrentAdId(id);
      await clickExecute({ referrer });
      
      // Find the clicked ad and trigger callback
      const clickedAd = ads.find(ad => ad.id === id);
      if (clickedAd) {
        onAdClick?.(clickedAd);
        
        // Open the ad URL
        if (clickedAd.url) {
          window.open(clickedAd.url, '_blank');
        }
      }
      
      onSuccess?.('Ad click tracked successfully');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to track ad click';
      onError?.(errorMessage);
      
      // Still open the URL even if tracking fails
      const clickedAd = ads.find(ad => ad.id === id);
      if (clickedAd?.url) {
        window.open(clickedAd.url, '_blank');
      }
    }
  }, [clickExecute, ads, onAdClick, onSuccess, onError]);
  
  const refreshAll = useCallback(async () => {
    try {
      if (position) {
        await fetchAdsByPosition(position, filters.limit);
      } else {
        await fetchAds();
      }
      await fetchPositions();
      onSuccess?.('All ads data refreshed successfully');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to refresh ads data';
      onError?.(errorMessage);
    }
  }, [position, filters.limit, fetchAdsByPosition, fetchAds, fetchPositions, onSuccess, onError]);
  
  const clearError = useCallback(() => {
    // Clear errors from all hooks if they have a clearError method
    // This would need to be implemented in the useAPI hook
  }, []);
  
  // Auto-refresh functionality
  React.useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const timer = setInterval(() => {
        refreshAll();
      }, refreshInterval);
      
      setRefreshTimer(timer);
      
      return () => {
        clearInterval(timer);
        setRefreshTimer(null);
      };
    }
  }, [autoRefresh, refreshInterval, refreshAll]);
  
  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [refreshTimer]);
  
  // Render props pattern
  const renderProps: AdsAPIRenderProps = {
    // Data
    ads,
    groupedAds,
    positions,
    currentAd: ads.find(ad => ad.id === currentAdId) || null,
    adStats,
    filters,
    
    // Loading states
    loading,
    statsLoading,
    clickTracking: clickLoading,
    
    // Error states
    error,
    
    // Actions
    fetchAds,
    fetchAdsByPosition,
    fetchPositions,
    fetchAdStats,
    trackClick,
    setFilters,
    clearError,
    refreshAll
  };
  
  // If children function is provided, use render props pattern
  if (children) {
    return (
      <div className={`ads-api-container ${className} ${styles.container}`}>
        {children(renderProps)}
      </div>
    );
  }
  
  // Default UI rendering
  return (
    <div className={`ads-api ${className} ${styles.container}`}>
      {/* Loading State */}
      {loading && (
        <div className={`ads-loading ${styles.loading}`}>
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className={`ads-error ${styles.error} bg-red-50 border border-red-200 rounded-lg p-4 mb-4`}>
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">خطأ في تحميل الإعلانات</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshAll}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
      
      {/* Filters */}
      {showFilters && (
        <div className={`ads-filters ${styles.filters} mb-6`}>
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.position || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المواضع</option>
              {positions.map(pos => (
                <option key={pos.position_name} value={pos.position_name}>
                  {pos.display_name}
                </option>
              ))}
            </select>
            
            <select
              value={filters.limit || 10}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 إعلان</option>
              <option value={5}>5 إعلانات</option>
              <option value={10}>10 إعلانات</option>
              <option value={20}>20 إعلان</option>
            </select>
            
            <button
              onClick={refreshAll}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </div>
      )}
      
      {/* Ads Grid */}
      {!loading && ads.length > 0 && (
        <div className={`ads-grid ${styles.grid}`}>
          <div className="grid gap-6">
            {ads.map(ad => (
              <div
                key={ad.id}
                className={`ad-item ${styles.item} bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => trackClick(ad.id)}
              >
                <div className="relative">
                  <img
                    src={ad.image_url || ad.image_path}
                    alt={ad.title}
                    className="w-full h-auto object-contain"
                    style={{
                      aspectRatio: `${ad.width}/${ad.height}`,
                      maxHeight: '300px'
                    }}
                    onError={(e) => {
                      console.error('Ad image failed to load:', ad.image_path);
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    إعلان
                  </div>
                  {clickLoading && currentAdId === ad.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                
                {ad.title && (
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{ad.title}</h3>
                    {ad.description && (
                      <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>الموضع: {ad.position}</span>
                      <span>النقرات: {ad.clicks}</span>
                    </div>
                    {showStats && isAdminMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchAdStats(ad.id);
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        عرض الإحصائيات
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && ads.length === 0 && (
        <div className={`ads-empty ${styles.empty} text-center py-12`}>
          <div className="text-gray-400 text-6xl mb-4">📢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إعلانات</h3>
          <p className="text-gray-600 mb-4">
            {position ? `لا توجد إعلانات نشطة في موضع ${position}` : 'لا توجد إعلانات نشطة حالياً'}
          </p>
          <button
            onClick={refreshAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة التحميل
          </button>
        </div>
      )}
      
      {/* Ad Statistics Modal */}
      {adStats && showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">إحصائيات الإعلان</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>العنوان:</span>
                <span className="font-medium">{adStats.title}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي النقرات:</span>
                <span className="font-medium">{adStats.total_clicks}</span>
              </div>
              <div className="flex justify-between">
                <span>النقرات الفريدة:</span>
                <span className="font-medium">{adStats.unique_clicks}</span>
              </div>
              <div className="flex justify-between">
                <span>الأيام النشطة:</span>
                <span className="font-medium">{adStats.active_days}</span>
              </div>
              <div className="flex justify-between">
                <span>الأيام المتبقية:</span>
                <span className="font-medium">{adStats.days_remaining}</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentAdId(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsAPI;