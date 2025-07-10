// Weather API Component
import React, { useState, useCallback, useEffect } from 'react';
import { WeatherData, APIComponentProps } from './types';
import { useWeather, useAPI } from './hooks';

interface WeatherAPIProps extends APIComponentProps {
  children?: (props: WeatherAPIRenderProps) => React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  showForecast?: boolean;
}

interface WeatherAPIRenderProps {
  // Data
  currentWeather: WeatherData | null;
  forecast: WeatherData[];
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchCurrentWeather: () => Promise<void>;
  fetchForecast: (days?: number) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

const WeatherAPI: React.FC<WeatherAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  showForecast = true
}) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // API hooks
  const { 
    data: weatherData, 
    loading: weatherLoading, 
    error: weatherError, 
    execute: fetchWeatherExecute 
  } = useWeather();
  
  const { 
    loading: forecastLoading, 
    error: forecastError, 
    execute: fetchForecastExecute 
  } = useAPI('/weather/forecast', {
    immediate: false,
  });

  // Combined error handling
  const error = weatherError || forecastError;
  const loading = weatherLoading || forecastLoading;

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAll();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Update current weather when data changes
  useEffect(() => {
    if (weatherData) {
      setCurrentWeather(weatherData as WeatherData);
    }
  }, [weatherData]);

  // Actions
  const fetchCurrentWeather = useCallback(async () => {
    try {
      await fetchWeatherExecute();
      onSuccess?.('Weather data fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchWeatherExecute, onError, onSuccess]);

  const fetchForecast = useCallback(async (days: number = 5) => {
    try {
      const result = await fetchForecastExecute(undefined, {
        params: { days }
      });
      setForecast(result.data as WeatherData[]);
      onSuccess?.('Weather forecast fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchForecastExecute, onError, onSuccess]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const promises = [fetchCurrentWeather()];
      if (showForecast) {
        promises.push(fetchForecast());
      }
      await Promise.all(promises);
      onSuccess?.('Weather data refreshed successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCurrentWeather, fetchForecast, showForecast, onError, onSuccess]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  // Helper functions
  const getWeatherIcon = (condition: string) => {
    const iconMap: { [key: string]: string } = {
      'clear': '☀️',
      'sunny': '☀️',
      'cloudy': '☁️',
      'partly cloudy': '⛅',
      'overcast': '☁️',
      'rain': '🌧️',
      'drizzle': '🌦️',
      'thunderstorm': '⛈️',
      'snow': '❄️',
      'fog': '🌫️',
      'mist': '🌫️',
      'haze': '🌫️'
    };
    
    const lowerCondition = condition.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerCondition.includes(key)) {
        return icon;
      }
    }
    return '🌤️'; // default icon
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°C`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const renderProps: WeatherAPIRenderProps = {
    // Data
    currentWeather,
    forecast,
    
    // Loading states
    loading,
    refreshing,
    
    // Error states
    error,
    
    // Actions
    fetchCurrentWeather,
    fetchForecast,
    refreshAll,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`weather-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`weather-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weather</h3>
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
        
        {/* Current Weather */}
        {currentWeather && (
          <div className="mb-6">
            <div className="text-center">
              <div className="text-6xl mb-2">
                {getWeatherIcon(currentWeather.condition || currentWeather.current?.description || '')}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatTemperature(currentWeather.temperature || currentWeather.current?.temperature || 0)}
              </div>
              <div className="text-lg text-gray-600 mb-2">
                {currentWeather.condition || currentWeather.current?.description || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                {typeof currentWeather.location === 'string' ? currentWeather.location : currentWeather.location?.city || 'Unknown'}
              </div>
            </div>
            
            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {(currentWeather.humidity || currentWeather.current?.humidity) !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Humidity</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {currentWeather.humidity || currentWeather.current?.humidity}%
                  </div>
                </div>
              )}
              
              {(currentWeather.wind_speed || currentWeather.current?.wind_speed) !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Wind Speed</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {currentWeather.wind_speed || currentWeather.current?.wind_speed} km/h
                  </div>
                </div>
              )}
              
              {(currentWeather.feels_like || currentWeather.current?.feels_like) !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Feels Like</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTemperature(currentWeather.feels_like || currentWeather.current?.feels_like || 0)}
                  </div>
                </div>
              )}
              
              {currentWeather.pressure !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Pressure</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {currentWeather.pressure} hPa
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Forecast */}
        {showForecast && forecast.length > 0 && (
          <div className="pt-6 border-t">
            <h4 className="font-medium text-gray-900 mb-3">5-Day Forecast</h4>
            <div className="space-y-3">
              {forecast.slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getWeatherIcon(day.condition || '')}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(day.date || '')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {day.condition || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatTemperature(day.temperature || 0)}
                    </div>
                    {day.min_temperature !== undefined && (
                      <div className="text-sm text-gray-600">
                        {formatTemperature(day.min_temperature)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!currentWeather && !loading && (
          <div className="text-center py-8 text-gray-500">
            No weather data available
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherAPI;