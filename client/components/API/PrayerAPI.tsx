// Prayer API Component
import React, { useState, useCallback, useEffect } from 'react';
import { PrayerTime, APIComponentProps } from './types';
import { usePrayerTimes, useAPI } from './hooks';

interface PrayerAPIProps extends APIComponentProps {
  children?: (props: PrayerAPIRenderProps) => React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface PrayerAPIRenderProps {
  // Data
  prayerTimes: PrayerTime[];
  currentPrayer: PrayerTime | null;
  nextPrayer: PrayerTime | null;
  todayPrayers: PrayerTime[];
  monthlyPrayers: PrayerTime[];
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchPrayerTimes: () => Promise<void>;
  fetchCurrentPrayer: () => Promise<void>;
  fetchNextPrayer: () => Promise<void>;
  fetchTodayPrayers: () => Promise<void>;
  fetchMonthlyPrayers: (year?: number, month?: number) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

const PrayerAPI: React.FC<PrayerAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess,
  autoRefresh = false,
  refreshInterval = 60000 // 1 minute
}) => {
  const [currentPrayer, setCurrentPrayer] = useState<PrayerTime | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [todayPrayers, setTodayPrayers] = useState<PrayerTime[]>([]);
  const [monthlyPrayers, setMonthlyPrayers] = useState<PrayerTime[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // API hooks
  const { 
    data: prayerTimes, 
    loading: prayerTimesLoading, 
    error: prayerTimesError, 
    execute: fetchPrayerTimesExecute 
  } = usePrayerTimes();
  
  const { 
    loading: currentLoading, 
    error: currentError, 
    execute: fetchCurrentExecute 
  } = useAPI('/prayer/current', {
    immediate: false,
  });
  
  const { 
    loading: nextLoading, 
    error: nextError, 
    execute: fetchNextExecute 
  } = useAPI('/prayer/next', {
    immediate: false,
  });
  
  const { 
    loading: todayLoading, 
    error: todayError, 
    execute: fetchTodayExecute 
  } = useAPI('/prayer/today', {
    immediate: false,
  });
  
  const { 
    loading: monthlyLoading, 
    error: monthlyError, 
    execute: fetchMonthlyExecute 
  } = useAPI('/prayer/monthly', {
    immediate: false,
  });

  // Combined error handling
  const error = prayerTimesError || currentError || nextError || todayError || monthlyError;
  const loading = prayerTimesLoading || currentLoading || nextLoading || todayLoading || monthlyLoading;

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAll();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Actions
  const fetchPrayerTimes = useCallback(async () => {
    try {
      await fetchPrayerTimesExecute();
      onSuccess?.('Prayer times fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchPrayerTimesExecute, onError, onSuccess]);

  const fetchCurrentPrayer = useCallback(async () => {
    try {
      const result = await fetchCurrentExecute();
      setCurrentPrayer(result.data as PrayerTime);
      onSuccess?.('Current prayer fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchCurrentExecute, onError, onSuccess]);

  const fetchNextPrayer = useCallback(async () => {
    try {
      const result = await fetchNextExecute();
      setNextPrayer(result.data as PrayerTime);
      onSuccess?.('Next prayer fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchNextExecute, onError, onSuccess]);

  const fetchTodayPrayers = useCallback(async () => {
    try {
      const result = await fetchTodayExecute();
      setTodayPrayers(result.data as PrayerTime[]);
      onSuccess?.('Today prayers fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchTodayExecute, onError, onSuccess]);

  const fetchMonthlyPrayers = useCallback(async (year?: number, month?: number) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      
      const result = await fetchMonthlyExecute(undefined, {
        params: Object.fromEntries(params)
      });
      setMonthlyPrayers(result.data as PrayerTime[]);
      onSuccess?.('Monthly prayers fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchMonthlyExecute, onError, onSuccess]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPrayerTimes(),
        fetchCurrentPrayer(),
        fetchNextPrayer(),
        fetchTodayPrayers()
      ]);
      onSuccess?.('All prayer data refreshed successfully');
    } catch (err: any) {
      onError?.(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPrayerTimes, fetchCurrentPrayer, fetchNextPrayer, fetchTodayPrayers, onError, onSuccess]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  // Format time for display
  const formatTime = (time: string) => {
    try {
      const date = new Date(`2000-01-01 ${time}`);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const renderProps: PrayerAPIRenderProps = {
    // Data
    prayerTimes: (prayerTimes as PrayerTime[]) || [],
    currentPrayer,
    nextPrayer,
    todayPrayers,
    monthlyPrayers,
    
    // Loading states
    loading,
    refreshing,
    
    // Error states
    error,
    
    // Actions
    fetchPrayerTimes,
    fetchCurrentPrayer,
    fetchNextPrayer,
    fetchTodayPrayers,
    fetchMonthlyPrayers,
    refreshAll,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`prayer-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`prayer-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Prayer Times</h3>
          <button
            onClick={refreshAll}
            disabled={refreshing || loading}
            className="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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
        
        {/* Current Prayer */}
        {currentPrayer && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Current Prayer</h4>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-green-900">
                {currentPrayer.arabic_name || currentPrayer.name}
              </span>
              <span className="text-green-700">
                {formatTime(currentPrayer.time)}
              </span>
            </div>
          </div>
        )}
        
        {/* Next Prayer */}
        {nextPrayer && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Next Prayer</h4>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-blue-900">
                {nextPrayer.arabic_name || nextPrayer.name}
              </span>
              <span className="text-blue-700">
                {formatTime(nextPrayer.time)}
              </span>
            </div>
          </div>
        )}
        
        {/* Today's Prayers */}
        {todayPrayers.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Today's Prayer Times</h4>
            <div className="space-y-2">
              {todayPrayers.map((prayer, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-gray-900">
                    {prayer.arabic_name || prayer.name}
                  </span>
                  <span className="text-gray-600">
                    {formatTime(prayer.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Monthly Prayers Button */}
        <div className="pt-4 border-t">
          <button
            onClick={() => fetchMonthlyPrayers()}
            disabled={loading}
            className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Load Monthly Prayer Times
          </button>
        </div>
        
        {!currentPrayer && !nextPrayer && todayPrayers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No prayer times available
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerAPI;