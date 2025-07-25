import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import { FiClock, FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';

type NewsItem = {
  id: number;
  title_ar?: string;
  title?: string;
  content_ar?: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_active?: boolean;
  expires_at?: string;
  isBreaking?: boolean;
};

const ITEMS_PER_PAGE = 15;

const LastNewsPage: React.FC = () => {
  const router = useRouter();
  const [lastNews, setLastNews] = useState<NewsItem[]>([]);
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { page } = router.query;
  
  useEffect(() => {
    if (page && typeof page === 'string') {
      setCurrentPage(parseInt(page) || 1);
    }
  }, [page]);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch last 24 hours news
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Fetch last news
        const lastNewsResponse = await fetch('/api/last-news?active=true');
        if (!lastNewsResponse.ok) throw new Error('Failed to fetch last news');
        const lastNewsData = await lastNewsResponse.json();
        
        // Fetch breaking news
        const breakingNewsResponse = await fetch('/api/breaking-news?active=true');
        if (!breakingNewsResponse.ok) throw new Error('Failed to fetch breaking news');
        const breakingNewsData = await breakingNewsResponse.json();
        
        // Filter news from last 24 hours
        const filterLast24Hours = (news: any[]) => {
          return news.filter((item: any) => {
            const itemDate = new Date(item.created_at);
            return itemDate >= yesterday;
          });
        };
        
        const filteredLastNews = filterLast24Hours(lastNewsData.data || []).map((item: any) => ({
          ...item,
          isBreaking: false
        }));
        
        const filteredBreakingNews = filterLast24Hours(breakingNewsData.data || []).map((item: any) => ({
          ...item,
          isBreaking: true
        }));
        
        setLastNews(filteredLastNews);
        setBreakingNews(filteredBreakingNews);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const allNews = [...lastNews, ...breakingNews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalPages = Math.ceil(allNews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentNews = allNews.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      router.push(`/last-news?page=${newPage}`, undefined, { shallow: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} - ${hours}:${minutes}`;
  };

  const timeAgo = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return 'منذ لحظات';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  };

  if (loading) {
    return (
      <Layout title="آخر الأخبار - آخر 24 ساعة" description="جميع الأخبار من آخر 24 ساعة">
        <div className="min-h-screen bg-gray-50" dir="rtl">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">جاري التحميل...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="خطأ في تحميل الأخبار" description="حدث خطأ أثناء تحميل الأخبار">
        <div className="min-h-screen bg-gray-50" dir="rtl">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في تحميل الأخبار</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="آخر الأخبار - آخر 24 ساعة" description="جميع الأخبار من آخر 24 ساعة">
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center items-center mb-4">
              <FiClock className="text-blue-500 text-3xl ml-3" />
              <h1 className="text-3xl font-bold text-gray-800">آخر الأخبار</h1>
            </div>
            <p className="text-gray-600 mb-4">جميع الأخبار من آخر 24 ساعة</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"></div>
          </div>

          {/* News Count */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              إجمالي الأخبار: <span className="font-bold text-blue-600">{allNews.length}</span> خبر
            </p>
          </div>

          {/* News Grid */}
          {currentNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentNews.map((news, index) => (
                <div
                  key={`${news.id}-${news.isBreaking ? 'breaking' : 'last'}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    {/* News Type Badge */}
                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          news.isBreaking
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {news.isBreaking ? 'عاجل' : 'آخر الأخبار'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className={`font-bold text-lg mb-3 ${
                        news.isBreaking ? 'text-red-600' : 'text-gray-800'
                      } hover:text-blue-600 transition-colors cursor-pointer`}
                    >
                      {news.title_ar || news.title}
                    </h3>

                    {/* Content Preview */}
                    {(news.content_ar || news.content) && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {(news.content_ar || news.content)?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                    )}

                    {/* Date and Time */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar className="ml-1" />
                        <span>{formatDate(news.created_at)}</span>
                      </div>
                      <span className="font-medium">{timeAgo(news.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">لا توجد أخبار في آخر 24 ساعة</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 space-x-reverse">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="ml-1" />
                السابق
              </button>

              <div className="flex space-x-1 space-x-reverse">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 3 ||
                    pageNum === currentPage + 3
                  ) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
                <FiChevronLeft className="mr-1" />
              </button>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LastNewsPage;