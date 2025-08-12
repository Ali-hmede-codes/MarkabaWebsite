import React, { useState, useEffect } from 'react';
import { FiCalendar, FiEye, FiClock, FiChevronLeft, FiChevronRight, FiZap } from 'react-icons/fi';
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
  type: 'last_news';
}

interface BreakingNews {
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
  type: 'breaking_news';
}

type CombinedNews = LastNews | BreakingNews;

const LastNewsPage: React.FC = () => {
  const [combinedNews, setCombinedNews] = useState<CombinedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchCombinedNews = async () => {
      try {
        setLoading(true);
        
        // Calculate 24 hours ago
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        // Fetch both breaking news and last news
        const [breakingResponse, lastNewsResponse] = await Promise.all([
          fetch('/api/breaking-news?active=true&limit=100'),
          fetch('/api/last-news?active=true&limit=100')
        ]);
        
        if (!breakingResponse.ok || !lastNewsResponse.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const [breakingData, lastNewsData] = await Promise.all([
          breakingResponse.json(),
          lastNewsResponse.json()
        ]);
        
        // Process and filter news from last 24 hours
        const processedBreakingNews: BreakingNews[] = (breakingData.data || [])
          .filter((news: any) => {
            const newsDate = new Date(news.created_at);
            return newsDate >= twentyFourHoursAgo;
          })
          .map((news: any) => ({ ...news, type: 'breaking_news' as const }));
        
        const processedLastNews: LastNews[] = (lastNewsData.data || [])
          .filter((news: any) => {
            const newsDate = new Date(news.created_at);
            return newsDate >= twentyFourHoursAgo;
          })
          .map((news: any) => ({ ...news, type: 'last_news' as const }));
        
        // Combine and sort by time (newest first)
        const combined = [...processedBreakingNews, ...processedLastNews]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setCombinedNews(combined);
        setTotalPages(Math.ceil(combined.length / itemsPerPage));
        
        if (combined.length === 0) {
          setError('لا توجد أخبار من آخر 24 ساعة');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };

    fetchCombinedNews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const newsDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - newsDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - newsDate.getTime()) / (1000 * 60));
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else {
      return formatDate(dateString);
    }
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return combinedNews.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getNewsUrl = (news: CombinedNews) => {
    if (news.type === 'breaking_news') {
      return `/breaking/${news.id}/${news.slug}`;
    }
    return `/last-news/${news.slug}`;
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
          <p className="text-center text-gray-600 mt-4">أخبار آخر 24 ساعة</p>
          {combinedNews.length > 0 && (
            <div className="text-center mt-2">
              <span className="text-sm text-gray-500">
                إجمالي {combinedNews.length} خبر - الصفحة {currentPage} من {totalPages}
              </span>
            </div>
          )}
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
        {getCurrentPageItems().length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">{error || 'لا توجد أخبار متاحة حالياً'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {getCurrentPageItems().map((news) => {
                const articleContent = (
                  <article className={`bg-white border rounded-lg shadow-sm transition-all duration-200 h-full ${
                    news.type === 'breaking_news' 
                      ? 'border-red-200 bg-gradient-to-br from-red-50 to-white' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                  }`}>
                    <div className="p-6 h-full flex flex-col">
                      {/* News Type Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          news.type === 'breaking_news'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {news.type === 'breaking_news' ? (
                            <>
                              <FiZap size={10} className="ml-1" />
                              عاجل
                            </>
                          ) : (
                            <>
                              <FiClock size={10} className="ml-1" />
                              أخبار
                            </>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(news.created_at)}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h2 className={`text-lg font-bold mb-3 transition-colors ${
                        news.type === 'breaking_news'
                          ? 'text-red-600 hover:text-red-700'
                          : 'text-gray-900 hover:text-blue-600'
                      }`}>
                        {news.title_ar || news.title}
                      </h2>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          <span>{formatTime(news.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiEye size={12} />
                          <span>{news.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
                
                return (
                  <div key={`${news.type}-${news.id}`}>
                    {news.type === 'breaking_news' ? (
                      articleContent
                    ) : (
                      <Link href={getNewsUrl(news)}>
                        {articleContent}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={16} className="ml-1" />
                  السابق
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? 'text-white bg-blue-600 border border-blue-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                  <FiChevronLeft size={16} className="mr-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default LastNewsPage;