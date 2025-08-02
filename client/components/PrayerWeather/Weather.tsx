import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSun, FiCloudRain, FiMapPin } from 'react-icons/fi';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  pressure: number;
  visibility: number;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  } | string;
}

interface WeatherResponse {
  success: boolean;
  data: WeatherData;
  message?: string;
}

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get Gregorian date
  const getGregorianDate = () => {
    const now = new Date();
    const gregorianMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const day = now.getDate();
    const month = gregorianMonths[now.getMonth()];
    const year = now.getFullYear();
    
    return `${day} ${month} ${year}م`;
  };

  // Helper function to get weather icon
  const getWeatherIcon = (condition: string | undefined) => {
    if (!condition) {
      return <FiSun className="text-yellow-500" size={24} />;
    }
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('مطر')) {
      return <FiCloudRain className="text-blue-500" size={24} />;
    }
    return <FiSun className="text-yellow-500" size={24} />;
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get<WeatherResponse>(`${apiUrl}/api/weather`);
        if (response.data.success) {
          setWeather(response.data.data);
        } else {
          setError(response.data.message || 'فشل في جلب بيانات الطقس');
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('خطأ في جلب بيانات الطقس. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FiSun className="text-yellow-500 ml-2" size={20} />
          <h3 className="text-xl font-bold text-gray-800">حالة الطقس</h3>
        </div>
        <div className="text-center py-4 text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FiSun className="text-yellow-500 ml-2" size={20} />
          <h3 className="text-xl font-bold text-gray-800">حالة الطقس</h3>
        </div>
        <div className="text-center py-4 text-red-500">{error}</div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FiSun className="text-yellow-500 ml-2" size={20} />
          <h3 className="text-xl font-bold text-gray-800">حالة الطقس</h3>
        </div>
        <div className="text-center py-4 text-gray-600">لا توجد بيانات طقس متاحة حالياً</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <FiSun className="text-yellow-500 ml-2" size={20} />
        <h3 className="text-xl font-bold text-gray-800">حالة الطقس</h3>
      </div>
      
      {weather.location && (
        <div className="flex items-center justify-center mb-4">
          <FiMapPin className="text-gray-500 ml-1" size={16} />
          <span className="text-sm text-gray-600">
            {typeof weather.location === 'string' 
              ? weather.location 
              : `${weather.location.city}, ${weather.location.country}`
            }
          </span>
        </div>
      )}
      
      <div className="text-center mb-4">
        <div className="text-sm text-gray-600">{getGregorianDate()}</div>
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          {getWeatherIcon(weather.condition)}
        </div>
        <div className="text-3xl font-bold text-blue-600 mb-1">
          {weather.temperature}°م
        </div>
        <div className="text-gray-600">{weather.condition || 'غير محدد'}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">الرطوبة</div>
          <div className="text-lg font-bold text-blue-600">
            {weather.humidity}%
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">الرياح</div>
          <div className="text-lg font-bold text-blue-600">
            {weather.wind_speed} كم/س
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">الضغط</div>
          <div className="text-lg font-bold text-blue-600">
            {weather.pressure} هكتوباسكال
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">الرؤية</div>
          <div className="text-lg font-bold text-blue-600">
            {weather.visibility} كم
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;