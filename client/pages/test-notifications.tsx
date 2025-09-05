import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import OneSignalNotifications from '../components/OneSignalNotifications';

const TestNotificationsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>اختبار الإشعارات - مـركـبـا</title>
        <meta name="description" content="صفحة اختبار إشعارات OneSignal" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                اختبار إشعارات OneSignal
              </h1>
              <p className="text-gray-600">
                استخدم هذه الصفحة لاختبار وإعداد إشعارات الدفع
              </p>
            </div>
            
            {/* OneSignal Component */}
            <div className="mb-8">
              <OneSignalNotifications />
            </div>
            
            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                تعليمات الاختبار
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium mb-2">1. تفعيل الإشعارات</h3>
                  <p className="text-sm">
                    انقر على زر "تفعيل الإشعارات" واسمح للموقع بإرسال الإشعارات عند ظهور النافذة المنبثقة.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium mb-2">2. التحقق من الحالة</h3>
                  <p className="text-sm">
                    استخدم زر "تحديث الحالة" للتأكد من أن الإشعارات مُفعّلة بشكل صحيح.
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-medium mb-2">3. إرسال علامة تجريبية</h3>
                  <p className="text-sm">
                    انقر على "إرسال علامة تجريبية" لإرسال بيانات تعريفية إلى OneSignal.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium mb-2">4. اختبار الإشعارات من الخادم</h3>
                  <p className="text-sm">
                    يمكنك الآن اختبار إرسال الإشعارات من الخادم عبر إنشاء خبر جديد أو خبر عاجل.
                  </p>
                </div>
              </div>
              
              {/* Technical Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3">معلومات تقنية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>App ID:</strong>
                    <br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      02e93d78-0cea-455a-82c1-cfef034fbf18
                    </code>
                  </div>
                  <div>
                    <strong>SDK Version:</strong>
                    <br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      Web SDK v16
                    </code>
                  </div>
                  <div>
                    <strong>Service Worker:</strong>
                    <br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      /OneSignalSDKWorker.js
                    </code>
                  </div>
                  <div>
                    <strong>Manifest:</strong>
                    <br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      /manifest.json
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Back to Home */}
            <div className="text-center mt-8">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestNotificationsPage;