// Test page for Ads System
import React from 'react';
import Head from 'next/head';
import AdsExample from '../components/examples/AdsExample';

const TestAdsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>اختبار نظام الإعلانات - موقع مركبا الإخباري</title>
        <meta name="description" content="صفحة اختبار نظام الإعلانات" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">مركبا الإخباري</h1>
              </div>
              <nav className="flex space-x-8 space-x-reverse">
                <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  الصفحة الرئيسية
                </a>
                <a href="/test-ads" className="text-blue-600 font-medium">
                  اختبار الإعلانات
                </a>
              </nav>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="py-8">
          <AdsExample />
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>&copy; 2024 مركبا الإخباري. جميع الحقوق محفوظة.</p>
              <p className="mt-2 text-sm">صفحة اختبار نظام الإعلانات</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TestAdsPage;