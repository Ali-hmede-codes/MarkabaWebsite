'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';

const OfflinePage: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine && retryCount > 0) {
        // Auto-redirect when back online
        setTimeout(() => {
          router.reload();
        }, 1000);
      }
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [router, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (navigator.onLine) {
      router.reload();
    } else {
      // Show message that still offline
      alert(theme.language === 'ar' 
        ? 'لا يزال الاتصال بالإنترنت غير متاح'
        : 'Internet connection is still not available'
      );
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: theme.language === 'ar' ? 'غير متصل - NewsMarkaba' : 'Offline - NewsMarkaba',
    description: theme.language === 'ar' 
      ? 'أنت غير متصل بالإنترنت حالياً'
      : 'You are currently offline',
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'غير متصل - NewsMarkaba' : 'Offline - NewsMarkaba'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'أنت غير متصل بالإنترنت حالياً. بعض المحتوى قد يكون متاحاً في وضع عدم الاتصال.'
            : 'You are currently offline. Some content may be available in offline mode.'
          } 
        />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Offline Section */}
          <div className="text-center mb-16">
            {/* Connection Status Indicator */}
            <div className="mb-8">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${
                isOnline 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-orange-100 dark:bg-orange-900'
              }`}>
                {isOnline ? (
                  <svg 
                    className="w-16 h-16 text-green-600 dark:text-green-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
                    />
                  </svg>
                ) : (
                  <svg 
                    className="w-16 h-16 text-orange-600 dark:text-orange-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
                    />
                  </svg>
                )}
              </div>
              
              {/* Status Text */}
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 rtl:mr-0 rtl:ml-2 ${
                  isOnline ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                {isOnline 
                  ? (theme.language === 'ar' ? 'متصل' : 'Online')
                  : (theme.language === 'ar' ? 'غير متصل' : 'Offline')
                }
              </div>
            </div>

            {/* Main Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {isOnline 
                ? (theme.language === 'ar' ? 'عاد الاتصال!' : 'Back Online!')
                : (theme.language === 'ar' ? 'أنت غير متصل' : 'You\'re Offline')
              }
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              {isOnline 
                ? (theme.language === 'ar' 
                    ? 'تم استعادة الاتصال بالإنترنت. سيتم إعادة تحميل الصفحة تلقائياً.'
                    : 'Internet connection has been restored. The page will reload automatically.'
                  )
                : (theme.language === 'ar' 
                    ? 'لا يمكن الوصول إلى الإنترنت حالياً. بعض المحتوى المحفوظ قد يكون متاحاً للعرض.'
                    : 'Internet access is currently unavailable. Some cached content may be available for viewing.'
                  )
              }
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleRetry}
                className={`inline-flex items-center px-6 py-3 font-medium rounded-lg transition-colors ${
                  isOnline
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isOnline 
                  ? (theme.language === 'ar' ? 'إعادة تحميل' : 'Reload Page')
                  : (theme.language === 'ar' ? 'إعادة المحاولة' : 'Try Again')
                }
              </button>
              
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {theme.language === 'ar' ? 'الصفحة الرئيسية' : 'Go Home'}
              </Link>
            </div>
          </div>

          {/* Offline Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* What's Available Offline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {theme.language === 'ar' ? 'متاح في وضع عدم الاتصال' : 'Available Offline'}
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'المقالات المحفوظة مسبقاً' : 'Previously cached articles'}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'الصفحات الرئيسية' : 'Main pages'}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'الصور المحفوظة' : 'Cached images'}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'إعدادات التطبيق' : 'App settings'}
                </li>
              </ul>
            </div>

            {/* What's Not Available */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {theme.language === 'ar' ? 'غير متاح في وضع عدم الاتصال' : 'Not Available Offline'}
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'أحدث الأخبار' : 'Latest news updates'}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'البحث الجديد' : 'New search results'}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'التعليقات والتفاعل' : 'Comments and interactions'}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 rtl:mr-0 rtl:ml-3"></div>
                  {theme.language === 'ar' ? 'المحتوى الجديد' : 'New content'}
                </li>
              </ul>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {theme.language === 'ar' ? 'نصائح للاستخدام في وضع عدم الاتصال' : 'Offline Usage Tips'}
            </h3>
            <div className="text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                {theme.language === 'ar' 
                  ? '• تصفح المقالات التي قمت بزيارتها مسبقاً'
                  : '• Browse articles you\'ve previously visited'
                }
              </p>
              <p>
                {theme.language === 'ar' 
                  ? '• استخدم الإشارات المرجعية للوصول السريع'
                  : '• Use bookmarks for quick access'
                }
              </p>
              <p>
                {theme.language === 'ar' 
                  ? '• سيتم تحديث المحتوى تلقائياً عند عودة الاتصال'
                  : '• Content will update automatically when connection returns'
                }
              </p>
            </div>
          </div>

          {/* Connection Status Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {theme.language === 'ar' 
                ? 'سيتم إعادة تحميل الصفحة تلقائياً عند استعادة الاتصال'
                : 'Page will automatically reload when connection is restored'
              }
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {theme.language === 'ar' 
                  ? `عدد المحاولات: ${retryCount}`
                  : `Retry attempts: ${retryCount}`
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OfflinePage;