import React, { useEffect, useState } from 'react';
import { FiUsers, FiEye, FiTrendingUp, FiCalendar, FiBarChart, FiGlobe } from 'react-icons/fi';
import { trackEvent } from '@/lib/firebase';

interface AnalyticsData {
  totalUsers: number;
  pageViews: number;
  sessionsToday: number;
  avgSessionDuration: string;
  totalPosts: number;
  totalCategories: number;
  loading: boolean;
  isRealData?: boolean;
  lastUpdated?: string;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    pageViews: 0,
    sessionsToday: 0,
    avgSessionDuration: '0:00',
    totalPosts: 0,
    totalCategories: 0,
    loading: true,
    isRealData: false,
    lastUpdated: new Date().toISOString(),
  });

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }));
      
      // Fetch real analytics data from our API endpoint
      const response = await fetch('/api/analytics');
      const data = await response.json();
      
      if (response.ok) {
         setAnalyticsData({
           totalUsers: data.totalUsers || 0,
           pageViews: data.pageViews || 0,
           sessionsToday: data.sessionsToday || 0,
           avgSessionDuration: data.avgSessionDuration || '0:00',
           totalPosts: data.totalPosts || 0,
           totalCategories: data.totalCategories || 0,
           loading: false,
           isRealData: !data.error && data.totalUsers !== undefined,
           lastUpdated: new Date().toISOString(),
         });
       } else {
         throw new Error(data.error || 'Failed to fetch analytics data');
       }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    // Track that admin viewed analytics
    trackEvent('admin_analytics_viewed');
    
    // Fetch real data
    fetchAnalyticsData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const statsCards = [
    {
      title: 'إجمالي المستخدمين',
      value: analyticsData.loading ? '...' : analyticsData.totalUsers.toLocaleString(),
      icon: FiUsers,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+12%',
      description: 'العدد الإجمالي للزوار',
    },
    {
      title: 'مشاهدات الصفحة',
      value: analyticsData.loading ? '...' : analyticsData.pageViews.toLocaleString(),
      icon: FiEye,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      change: '+8%',
      description: 'إجمالي مشاهدات الصفحات',
    },
    {
      title: 'جلسات اليوم',
      value: analyticsData.loading ? '...' : analyticsData.sessionsToday.toLocaleString(),
      icon: FiTrendingUp,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: '+15%',
      description: 'الجلسات النشطة اليوم',
    },
    {
      title: 'متوسط مدة الجلسة',
      value: analyticsData.loading ? '...' : analyticsData.avgSessionDuration,
      icon: FiCalendar,
      color: 'bg-gradient-to-r from-amber-500 to-amber-600',
      change: '+5%',
      description: 'الوقت المتوسط للزيارة',
    },
    {
      title: 'إجمالي المقالات',
      value: analyticsData.loading ? '...' : analyticsData.totalPosts.toLocaleString(),
      icon: FiBarChart,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      change: '+3%',
      description: 'عدد المقالات المنشورة',
    },
    {
      title: 'الأقسام',
      value: analyticsData.loading ? '...' : analyticsData.totalCategories.toLocaleString(),
      icon: FiGlobe,
      color: 'bg-gradient-to-r from-rose-500 to-rose-600',
      change: '+1%',
      description: 'عدد أقسام الموقع',
    },
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              تحليلات الموقع
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إحصائيات زوار الموقع ومشاهدات الصفحات
            </p>
          </div>
          <button
            onClick={fetchAnalyticsData}
            disabled={analyticsData.loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {analyticsData.loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiTrendingUp className="w-4 h-4" />
            )}
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiBarChart className="w-5 h-5 text-blue-600" />
            معلومات Firebase Analytics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 font-medium">معرف المشروع:</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'غير محدد'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 font-medium">معرف القياس:</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'غير محدد'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 font-medium">نوع البيانات:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                analyticsData.isRealData 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  analyticsData.isRealData ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}></div>
                {analyticsData.isRealData ? 'بيانات حقيقية' : 'بيانات تجريبية'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 font-medium">آخر تحديث:</span>
              <span className="text-gray-900 dark:text-white font-medium text-sm">
                {analyticsData.lastUpdated ? new Date(analyticsData.lastUpdated).toLocaleString('ar-SA') : 'غير محدد'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiGlobe className="w-5 h-5 text-blue-600" />
            إعدادات التتبع
          </h2>
          <div className="space-y-4">
            {analyticsData.isRealData ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  <strong>✅ تم التكوين بنجاح:</strong> البيانات المعروضة هنا مأخوذة من Firebase Analytics الحقيقي. يمكنك عرض التقارير التفصيلية في
                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline ml-1 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                  >
                    Google Analytics
                  </a>
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed mb-2">
                  <strong>⚠️ بيانات تجريبية:</strong> البيانات المعروضة حالياً هي بيانات تجريبية. لعرض البيانات الحقيقية من Firebase Analytics، يجب تكوين Google Analytics Data API.
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  راجع ملف <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">FIREBASE_ANALYTICS_SETUP_GUIDE.md</code> للحصول على تعليمات التكوين.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">تتبع الصفحات:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">مفعل</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">تتبع الأحداث:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">مفعل</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">آخر تحديث:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {new Date().toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;