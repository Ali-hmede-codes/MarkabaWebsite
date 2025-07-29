import React, { useState, useEffect } from 'react';
import { FiCalendar, FiEye, FiClock } from 'react-icons/fi';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';

interface LastNews {
  id: number;
  title_ar?: string;
  title?: string;
  content_ar?: string;
  content?: string;
  slug: string;
  priority: number;
  is_active: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

const LastNewsPage: React.FC = () => {
  const [lastNews, setLastNews] = useState<LastNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLastNews = async () => {
      try {
        const response = await fetch('/api/last-news?active=true&limit=20');
        if (!response.ok) {
          throw new Error('Failed to fetch last news');
        }
        const data = await response.json();
        if (data.success) {
          setLastNews(data.data || []);
        } else {
          setError('فشل في جلب الأخبار');
        }
      } catch (err) {
        console.error('Error fetching last news:', err);
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };

    fetchLastNews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  if (loading) {
    return (
      <Layout title="آخر الأخبار" description="جميع آخر الأخبار">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="آخر الأخبار" description="جميع آخر الأخبار">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-10 text-red-500">
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="آخر الأخبار" description="جميع آخر الأخبار">
      <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <FiClock className="text-blue-500 text-3xl ml-3" />
            <h1 className="text-3xl font-bold text-gray-800">آخر الأخبار</h1>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"></div>
        </div>

        {/* Back to Home Button */}
        <div className="mb-6">
          <Link href="/">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة للرئيسية
            </button>
          </Link>
        </div>

        {/* News Grid */}
        {lastNews.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">لا توجد أخبار متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lastNews.map((news) => (
              <Link key={news.id} href={`/last-news/${news.slug}`}>
                <article className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
                  <div className="p-6 h-full flex flex-col">
                    {/* Title */}
                    <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                      {news.title_ar || news.title}
                    </h2>
                    
                    {/* No content preview - titles only */}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <FiCalendar size={12} />
                        <span>{formatDate(news.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiEye size={12} />
                        <span>{news.views}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LastNewsPage;