'use client';

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';

const Custom500: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: theme.language === 'ar' ? 'خطأ في الخادم - 500' : 'Server Error - 500',
    description: theme.language === 'ar' 
      ? 'حدث خطأ في الخادم أثناء معالجة طلبك'
      : 'An error occurred on the server while processing your request',
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'خطأ في الخادم - 500' : 'Server Error - 500'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'حدث خطأ في الخادم أثناء معالجة طلبك. نعتذر عن الإزعاج ونعمل على حل المشكلة.'
            : 'An error occurred on the server while processing your request. We apologize for the inconvenience and are working to fix the issue.'
          } 
        />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={theme.language === 'ar' ? 'خطأ في الخادم - 500' : 'Server Error - 500'} 
        />
        <meta 
          property="og:description" 
          content={theme.language === 'ar' 
            ? 'حدث خطأ في الخادم أثناء معالجة طلبك'
            : 'An error occurred on the server while processing your request'
          } 
        />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content={theme.language === 'ar' ? 'خطأ في الخادم - 500' : 'Server Error - 500'} 
        />
        <meta 
          name="twitter:description" 
          content={theme.language === 'ar' 
            ? 'حدث خطأ في الخادم أثناء معالجة طلبك'
            : 'An error occurred on the server while processing your request'
          } 
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Error Section */}
          <div className="text-center mb-16">
            {/* 500 Illustration */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-red-100 dark:bg-red-900 rounded-full mb-6">
                <svg 
                  className="w-16 h-16 text-red-600 dark:text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              
              {/* 500 Text */}
              <h1 className="text-8xl md:text-9xl font-bold text-gray-200 dark:text-gray-700 mb-4">
                500
              </h1>
            </div>

            {/* Error Message */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {theme.language === 'ar' ? 'خطأ في الخادم' : 'Server Error'}
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              {theme.language === 'ar' 
                ? 'عذراً، حدث خطأ في الخادم أثناء معالجة طلبك. نعتذر عن الإزعاج ونعمل على حل المشكلة في أسرع وقت ممكن.'
                : 'Sorry, an error occurred on the server while processing your request. We apologize for the inconvenience and are working to fix the issue as soon as possible.'
              }
            </p>

            {/* Technical Info */}
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-gray-700 dark:text-gray-300 text-sm font-mono">
                {theme.language === 'ar' 
                  ? 'رمز الخطأ: 500 | خطأ داخلي في الخادم'
                  : 'Error Code: 500 | Internal Server Error'
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {theme.language === 'ar' ? 'العودة للرئيسية' : 'Go to Homepage'}
              </Link>
              
              <button
                onClick={() => router.reload()}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {theme.language === 'ar' ? 'إعادة تحميل الصفحة' : 'Reload Page'}
              </button>
              
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {theme.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {theme.language === 'ar' ? 'ماذا يمكنك أن تفعل؟' : 'What Can You Do?'}
            </h3>
            <div className="text-gray-600 dark:text-gray-300 space-y-4 max-w-2xl mx-auto">
              <p>
                {theme.language === 'ar' 
                  ? 'يمكنك تجربة الخطوات التالية:'
                  : 'You can try the following steps:'
                }
              </p>
              <ul className="list-disc text-left rtl:text-right space-y-2 pl-5 rtl:pl-0 rtl:pr-5">
                <li>
                  {theme.language === 'ar' 
                    ? 'إعادة تحميل الصفحة بعد بضع دقائق'
                    : 'Reload the page after a few minutes'
                  }
                </li>
                <li>
                  {theme.language === 'ar' 
                    ? 'التحقق من اتصالك بالإنترنت'
                    : 'Check your internet connection'
                  }
                </li>
                <li>
                  {theme.language === 'ar' 
                    ? 'مسح ذاكرة التخزين المؤقت للمتصفح'
                    : 'Clear your browser cache'
                  }
                </li>
                <li>
                  {theme.language === 'ar' 
                    ? 'العودة للصفحة الرئيسية وتصفح محتوى آخر'
                    : 'Return to the homepage and browse other content'
                  }
                </li>
              </ul>
            </div>
            
            <div className="mt-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {theme.language === 'ar' 
                  ? 'إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم الفني'
                  : 'If the problem persists, please contact our technical support team'
                }
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {theme.language === 'ar' ? 'تواصل مع الدعم الفني' : 'Contact Technical Support'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Custom500;