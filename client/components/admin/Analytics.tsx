import React, { useEffect, useState } from 'react';
import { FiUsers, FiEye, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { trackEvent } from '@/lib/firebase';

interface AnalyticsData {
  totalUsers: number;
  pageViews: number;
  sessionsToday: number;
  avgSessionDuration: string;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    pageViews: 0,
    sessionsToday: 0,
    avgSessionDuration: '0:00',
  });

  useEffect(() => {
    // Track that admin viewed analytics
    trackEvent('admin_analytics_viewed');

    // In a real implementation, you would fetch this data from Firebase Analytics API
    // For now, we'll show placeholder data
    setAnalyticsData({
      totalUsers: 1250,
      pageViews: 3420,
      sessionsToday: 89,
      avgSessionDuration: '2:34',
    });
  }, []);

  const statsCards = [
    {
      title: 'إجمالي المستخدمين',
      value: analyticsData.totalUsers.toLocaleString(),
      icon: FiUsers,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'مشاهدات الصفحة',
      value: analyticsData.pageViews.toLocaleString(),
      icon: FiEye,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'جلسات اليوم',
      value: analyticsData.sessionsToday.toLocaleString(),
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
    },
    {
      title: 'متوسط مدة الجلسة',
      value: analyticsData.avgSessionDuration,
      icon: FiCalendar,
      color: 'bg-orange-500',
      change: '+5%',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          تحليلات الموقع
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إحصائيات زوار الموقع ومشاهدات الصفحات
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          معلومات Firebase Analytics
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">معرف المشروع:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">معرف القياس:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600 dark:text-gray-400">الحالة:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              نشط
            </span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ملاحظة:</strong> يتم تتبع جميع زيارات الصفحات تلقائياً. يمكنك عرض التقارير التفصيلية في
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1"
            >
              Google Analytics
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;