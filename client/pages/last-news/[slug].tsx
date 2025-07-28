import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { FiCalendar } from 'react-icons/fi';
import Image from 'next/image';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';

interface LastNews {
  id: number;
  title_ar: string;
  content_ar: string;
  slug: string;
  priority: number;
  is_active: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

interface BreakingNews {
  id: number;
  title_ar: string;
  content_ar: string;
  slug: string;
  priority: number;
  is_active: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

const SingleLastNewsPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setCopyMessage('تم النسخ');
      setTimeout(() => {
        setCopySuccess(false);
        setCopyMessage('');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyText(window.location.href);
    }
  };

  const InnerLastNews = ({ slug }: { slug: string }) => {
    const [fontSize, setFontSize] = useState(20);
    const [lastNews, setLastNews] = useState<LastNews | null>(null);
    const [latestLastNews, setLatestLastNews] = useState<LastNews[]>([]);
    const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reset state when slug changes
    useEffect(() => {
      setLastNews(null);
      setLatestLastNews([]);
      setBreakingNews([]);
      setFontSize(20);
      setError(null);
    }, [slug]);

    // Fetch single last news by slug
    useEffect(() => {
      const fetchLastNews = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/last-news/${slug}`);
          const data = await response.json();
          
          if (data.success) {
            setLastNews(data.data);
          } else {
            setError('الخبر غير موجود');
          }
        } catch (err) {
          console.error('Error fetching last news:', err);
          setError('خطأ في تحميل الخبر');
        } finally {
          setLoading(false);
        }
      };

      if (slug) {
        fetchLastNews();
      }
    }, [slug]);

    // Fetch latest last news for sidebar
    useEffect(() => {
      const fetchLatestLastNews = async () => {
        try {
          const response = await fetch('/api/last-news?active=true&limit=4&include_content=false');
          const data = await response.json();
          
          if (data.success && data.data) {
            // Filter out current news item
            const filtered = data.data.filter((item: LastNews) => item.id !== lastNews?.id);
            setLatestLastNews(filtered.slice(0, 4));
          }
        } catch (err) {
          console.error('Error fetching latest last news:', err);
        }
      };

      if (lastNews) {
        fetchLatestLastNews();
      }
    }, [lastNews]);

    // Fetch breaking news for sidebar
    useEffect(() => {
      const fetchBreakingNews = async () => {
        try {
          const response = await fetch('/api/breaking-news?active=true&limit=4&include_content=false');
          const data = await response.json();
          
          if (data.success && data.data) {
            // Filter out current news item if it exists in breaking news
            const filtered = data.data.filter((item: BreakingNews) => item.id !== lastNews?.id);
            setBreakingNews(filtered.slice(0, 4));
          }
        } catch (err) {
          console.error('Error fetching breaking news:', err);
        }
      };

      fetchBreakingNews();
    }, [lastNews]);

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
    if (error || !lastNews) return <div className="text-center py-10 text-red-500">{error || 'الخبر غير موجود'}</div>;



    const getRelativeTime = (dateString: string) => {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'الآن';
      } else if (diffInMinutes < 60) {
        return `منذ ${diffInMinutes} دقيقة${diffInMinutes > 1 ? '' : ''}`;
      } else if (diffInMinutes < 1440) { // Less than 24 hours
        const hours = Math.floor(diffInMinutes / 60);
        const remainingMinutes = diffInMinutes % 60;
        if (remainingMinutes === 0) {
          return `منذ ${hours} ساعة${hours > 1 ? '' : ''}`;
        } else {
          return `منذ ${hours} ساعة و ${remainingMinutes} دقيقة`;
        }
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `منذ ${days} يوم${days > 1 ? '' : ''}`;
      }
    };

    return (
      <Layout title={lastNews.title_ar} description={lastNews.content_ar?.substring(0, 160)}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Last News Title */}
              <h1 className="text-3xl font-bold mb-6 text-gray-900 leading-tight">{lastNews.title_ar}</h1>
              
              {/* Image after title */}
              <div className="mb-6">
                <Image 
                  src="/images/background_image.jpg" 
                  alt="مركبا" 
                  width={1920} 
                  height={1080} 
                  className="w-full h-auto object-cover rounded-lg"
                  style={{ aspectRatio: '16/9' }}
                />
              </div>
              
              {/* Meta Information - Simplified */}
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-500">
                  <FiCalendar className="inline ml-1" size={14} />
                  {getRelativeTime(lastNews.created_at)}
                </div>
              </div>

              {/* Font Size Controller */}
              <div className="flex items-center justify-center mb-6 bg-gray-50 rounded-lg p-4">
                <button 
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  title="تصغير الخط"
                >
                  -
                </button>
                <span className="mx-4 text-gray-700 font-medium">الخط</span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(20, prev + 2))}
                  className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  title="تكبير الخط"
                >
                  +
                </button>
              </div>

              {/* Last News Content */}
              <div 
                className="prose max-w-none mb-8 text-gray-800 leading-relaxed" 
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: lastNews.content_ar }} 
              />

              {/* Back to Home Button */}
              <div className="flex justify-center mt-8 mb-6">
                <Link href="/">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    العودة للرئيسية
                  </button>
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Latest Last News Section */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                  آخر الأخبار
                </h3>
                <div className="space-y-4">
                  {latestLastNews.map((latestItem) => (
                    <Link key={latestItem.id} href={`/last-news/${latestItem.slug}`}>
                      <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {latestItem.title_ar}
                          </h4>
                          <div className="text-xs text-gray-500">
                            <FiCalendar className="inline ml-1" size={10} />
                            {getRelativeTime(latestItem.created_at)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Breaking News Section */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                  آخر الأخبار العاجلة
                </h3>
                <div className="space-y-4">
                  {breakingNews.map((breakingItem) => (
                    <Link key={breakingItem.id} href={`/post/${breakingItem.slug}`}>
                      <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {breakingItem.title_ar}
                          </h4>
                          <div className="text-xs text-gray-500">
                            <FiCalendar className="inline ml-1" size={10} />
                            {getRelativeTime(breakingItem.created_at)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Layout>
    );
  };

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;

  return router.isReady ? <InnerLastNews slug={slug} key={`last-news-${slug}`} /> : <div className="text-center py-10">جاري التحميل...</div>;
};

export default SingleLastNewsPage;