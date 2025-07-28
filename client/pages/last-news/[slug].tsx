import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { FiCalendar, FiCopy, FiShare2, FiEye } from 'react-icons/fi';
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reset state when slug changes
    useEffect(() => {
      setLastNews(null);
      setLatestLastNews([]);
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

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
    if (error || !lastNews) return <div className="text-center py-10 text-red-500">{error || 'الخبر غير موجود'}</div>;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <Layout title={lastNews.title_ar} description={lastNews.content_ar?.substring(0, 160)}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Standard Image */}
              <div className="mb-6">
                <Image 
                  src="/images/background_image.jpg" 
                  alt="مركبا" 
                  width={800} 
                  height={400} 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              {/* Last News Title */}
              <h1 className="text-3xl font-bold mb-6 text-gray-900 leading-tight">{lastNews.title_ar}</h1>
              
              {/* Meta Information */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-white-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image 
                        src="/images/logo.png" 
                        alt="مركبا" 
                        width={40} 
                        height={40} 
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">مركبا</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>
                          {new Date(lastNews.created_at).toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiEye size={12} />
                          {lastNews.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse relative">
                  {copyMessage && (
                    <div className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      {copyMessage}
                    </div>
                  )}
                  <button 
                    onClick={() => handleCopyText(lastNews.content_ar || '')}
                    className={`p-2 transition-colors ${
                      copySuccess 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="نسخ النص"
                  >
                    <FiCopy size={16} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="مشاركة"
                  >
                    <FiShare2 size={16} />
                  </button>
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
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {latestItem.title_ar}
                          </h4>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{formatDate(latestItem.created_at)}</span>
                            <span className="flex items-center gap-1">
                              <FiEye size={10} />
                              {latestItem.views}
                            </span>
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