// Ads System Example Component
import React from 'react';
import { AdsAPI } from '../API';
import AdBanner from '../UI/AdBanner';

const AdsExample: React.FC = () => {
  return (
    <div className="ads-example-container p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">نظام الإعلانات - أمثلة</h1>
      
      {/* AdBanner Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">مكونات الإعلانات (AdBanner)</h2>
        
        {/* Main Top Banner */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">إعلان الصفحة الرئيسية - أعلى</h3>
          <AdBanner 
            position="main_top" 
            className="border-2 border-dashed border-gray-300 p-4"
            autoRefresh={true}
            refreshInterval={60000}
          />
        </div>
        
        {/* Sidebar Banner */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">إعلان الشريط الجانبي</h3>
          <AdBanner 
            position="sidebar" 
            className="border-2 border-dashed border-blue-300 p-4"
          />
        </div>
        
        {/* Post Square Banner */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">إعلان مربع المقال</h3>
          <AdBanner 
            position="post_square" 
            className="border-2 border-dashed border-green-300 p-4"
          />
        </div>
        
        {/* Post Bottom Banner */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">إعلان أسفل المقال</h3>
          <AdBanner 
            position="post_bottom" 
            className="border-2 border-dashed border-purple-300 p-4"
          />
        </div>
      </section>
      
      {/* AdsAPI Direct Usage Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">استخدام AdsAPI مباشرة</h2>
        
        {/* All Active Ads */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">جميع الإعلانات النشطة</h3>
          <AdsAPI 
            mode="public"
            showFilters={true}
            className="border-2 border-dashed border-red-300 p-4"
          />
        </div>
        
        {/* Ads by Position with Custom Rendering */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">إعلانات بموضع محدد مع عرض مخصص</h3>
          <AdsAPI 
            position="main_top"
            mode="public"
            className="border-2 border-dashed border-yellow-300 p-4"
          >
            {({ ads, loading, error, trackClick }) => {
              if (loading) {
                return (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري تحميل الإعلانات...</p>
                  </div>
                );
              }
              
              if (error) {
                return (
                  <div className="text-center py-8 text-red-600">
                    <p>خطأ في تحميل الإعلانات: {error}</p>
                  </div>
                );
              }
              
              if (ads.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p>لا توجد إعلانات متاحة</p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ads.map(ad => (
                    <div 
                      key={ad.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => trackClick(ad.id)}
                    >
                      <div className="relative">
                        <img 
                          src={ad.image_url || ad.image_path}
                          alt={ad.title || 'إعلان'}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          إعلان
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{ad.title}</h4>
                        {ad.description && (
                          <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                        )}
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>الموضع: {ad.position}</span>
                          <span>النقرات: {ad.clicks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }}
          </AdsAPI>
        </div>
        
        {/* Auto-refreshing Ads */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">إعلانات بتحديث تلقائي (كل 30 ثانية)</h3>
          <AdsAPI 
            position="sidebar"
            mode="public"
            autoRefresh={true}
            refreshInterval={30000}
            className="border-2 border-dashed border-indigo-300 p-4"
          >
            {({ ads, loading, error, trackClick }) => {
              if (loading) {
                return <div className="text-center py-4">جاري التحديث...</div>;
              }
              
              if (error || ads.length === 0) {
                return <div className="text-center py-4 text-gray-500">لا توجد إعلانات</div>;
              }
              
              return (
                <div className="space-y-4">
                  {ads.slice(0, 3).map(ad => (
                    <div 
                      key={ad.id}
                      className="flex items-center space-x-4 space-x-reverse bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => trackClick(ad.id)}
                    >
                      <img 
                        src={ad.image_url || ad.image_path}
                        alt={ad.title || 'إعلان'}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{ad.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">النقرات: {ad.clicks}</p>
                      </div>
                      <div className="text-xs text-gray-500">إعلان</div>
                    </div>
                  ))}
                </div>
              );
            }}
          </AdsAPI>
        </div>
      </section>
      
      {/* API Information */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">معلومات API</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">نقاط النهاية المتاحة:</h3>
          <ul className="space-y-2 text-sm">
            <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/ads/active</code> - جميع الإعلانات النشطة</li>
            <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/ads/position/:position</code> - إعلانات بموضع محدد</li>
            <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/ads/positions</code> - جميع المواضع المتاحة</li>
            <li><code className="bg-gray-200 px-2 py-1 rounded">POST /api/ads/:id/click</code> - تتبع النقرات</li>
            <li><code className="bg-gray-200 px-2 py-1 rounded">POST /api/ads/:id/impression</code> - تتبع المشاهدات</li>
            <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/ads/:id/stats</code> - إحصائيات الإعلان</li>
          </ul>
          
          <h3 className="text-lg font-medium mb-4 mt-6">المواضع المتاحة:</h3>
          <ul className="space-y-1 text-sm">
            <li><code className="bg-blue-100 px-2 py-1 rounded">main_top</code> - أعلى الصفحة الرئيسية</li>
            <li><code className="bg-blue-100 px-2 py-1 rounded">main_sidebar</code> - الشريط الجانبي للصفحة الرئيسية</li>
            <li><code className="bg-blue-100 px-2 py-1 rounded">post_top</code> - أعلى صفحة المقال</li>
            <li><code className="bg-blue-100 px-2 py-1 rounded">post_bottom</code> - أسفل صفحة المقال</li>
            <li><code className="bg-blue-100 px-2 py-1 rounded">post_square</code> - مربع داخل المقال</li>
            <li><code className="bg-blue-100 px-2 py-1 rounded">sidebar</code> - الشريط الجانبي العام</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AdsExample;