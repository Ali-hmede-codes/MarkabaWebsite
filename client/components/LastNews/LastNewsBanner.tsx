'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

// Add custom CSS for hiding scrollbar
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

type NewsItem = {
  id: number;
  title_ar?: string;
  title?: string;
  content_ar?: string;
  content?: string;
  slug?: string;
  created_at: string;
  updated_at?: string;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_active?: boolean;
  expires_at?: string;
  isBreaking?: boolean; // To distinguish breaking news
};



type LastNewsBannerProps = {
  className?: string;
};

const LastNewsBanner: React.FC<LastNewsBannerProps> = ({ className = '' }) => {
  const [lastNews, setLastNews] = useState<NewsItem[]>([]);
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [combineNews, setCombineNews] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchLastNews = async () => {
      try {
        const response = await fetch('/api/last-news?active=true');
        if (!response.ok) throw new Error('Failed to fetch last news');
        const data = await response.json();
        setLastNews((data.data || []).map((item: any) => ({ ...item, isBreaking: false } as NewsItem)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load last news');
      }
    };

    const fetchBreakingNews = async () => {
      if (!combineNews) return;
      try {
        const response = await fetch('/api/breaking-news?active=true');
        if (!response.ok) throw new Error('Failed to fetch breaking news');
        const data = await response.json();
        setBreakingNews((data.data || []).map((item: any) => ({ ...item, isBreaking: true } as NewsItem)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load breaking news');
      }
    };

    Promise.all([fetchLastNews(), fetchBreakingNews()]).finally(() => setLoading(false));
  }, [combineNews]);

  // Move before early returns
  const displayedNews: NewsItem[] = combineNews 
    ? [...lastNews, ...breakingNews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : lastNews;



  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (displayedNews.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div className={`w-full ${className}`} dir="rtl" style={{ 
        height: className.includes('h-full') ? '100%' : '550px', 
        maxHeight: className.includes('h-full') ? '100%' : '550px' 
      }}>
        <div className="mb-4 sm:mb-6">
          {/* Title and Filter in one row */}
          <div className="flex justify-between items-center gap-4 sm:gap-6 mb-6 flex-wrap">
            {/* Title with underline - Moved to right */}
            <div className="relative flex-shrink-0 order-2">
              <h2 className="text-gray-800 text-lg sm:text-xl md:text-2xl relative whitespace-nowrap font-bold" style={{ 
                fontFamily: 'Alexandria, sans-serif',
                wordWrap: 'break-word',
                lineHeight: '1.2',
                minWidth: 'fit-content',
                background: 'linear-gradient(to right, transparent 0%, #2563eb 0%, #2563eb 100%, transparent 100%)',
                backgroundSize: '100% 4px',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom'
              }}>
                آخــــر الأخــــبـــار
              </h2>
            </div>
            
            {/* Toggle switch for breaking news */}
            <div className="flex items-center flex-shrink-0 order-3">
              <span className="ml-2 text-red-500 text-sm sm:text-base whitespace-nowrap font-bold" style={{ 
                fontFamily: 'Alexandria, sans-serif',
                lineHeight: '1.2',
                minWidth: 'fit-content'
              }}>العاجل</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineNews}
                  onChange={(e) => setCombineNews(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-9 sm:w-11 h-5 sm:h-6 rounded-full transition-colors ${combineNews ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full transition-all ${combineNews ? 'translate-x-4 sm:translate-x-5 bg-white' : 'translate-x-0 bg-white'}`}></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* News content with scrollable container */}
        <div className="border border-transparent rounded-lg w-full flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <div className="space-y-4">
              {displayedNews.map((news, index) => {
                const title = news.title_ar || news.title || '';
                const content = news.content_ar || news.content || '';
                const hasContent = content.trim().length > 0; // Check if news has content
                const displayTitle = title; // Show full title now
                
                return (
                  <div key={`${news.id}-${news.isBreaking ? 'breaking' : 'last'}`} className="">
                    {news.isBreaking ? (
                      <div className="flex items-start" style={{ gap: '3px' }}>
                        <div className="flex-shrink-0" style={{ width: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <span className="text-blue-600 text-center" style={{ 
                            fontSize: '12px', 
                            fontFamily: 'Alexandria, sans-serif',
                            fontWeight: '300',
                            lineHeight: '1.2',
                            display: 'block',
                            width: '100%'
                          }}>
                            {timeAgo(news.created_at)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-xs sm:text-base leading-snug text-red-600 hover:text-blue-600 transition-colors cursor-pointer`} style={{
                            wordWrap: 'break-word', 
                            whiteSpace: 'normal', 
                            lineHeight: '1.3', 
                            fontFamily: 'Alexandria, sans-serif',
                            fontWeight: '300',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            display: 'block',
                            width: '100%'
                          }}>
                            {displayTitle}
                            {hasContent && (
                              <span className="text-red-600 underline mr-2" style={{ 
                                fontFamily: 'Alexandria, sans-serif',
                                fontWeight: '300',
                                whiteSpace: 'nowrap',
                                marginRight: '8px'
                              }}>تتمة</span>
                            )}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/last-news/${news.slug || news.id}`}>
                        <div className="flex items-start hover:bg-gray-50 p-2 rounded-lg transition-colors" style={{ gap: '3px' }}>
                          <div className="flex-shrink-0" style={{ width: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span className="text-blue-600 text-center" style={{ 
                              fontSize: '12px', 
                              fontFamily: 'Alexandria, sans-serif',
                              fontWeight: '300',
                              lineHeight: '1.2',
                              display: 'block',
                              width: '100%'
                            }}>
                              {timeAgo(news.created_at)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-xs sm:text-base leading-snug text-gray-800 hover:text-blue-600 transition-colors cursor-pointer`} style={{
                              wordWrap: 'break-word', 
                              whiteSpace: 'normal', 
                              lineHeight: '1.3', 
                              fontFamily: 'Alexandria, sans-serif',
                              fontWeight: '300',
                              overflowWrap: 'break-word',
                              hyphens: 'auto',
                              display: 'block',
                              width: '100%'
                            }}>
                              {displayTitle}
                              {hasContent && (
                                <span className="text-red-600 underline mr-2" style={{ 
                                  fontFamily: 'Alexandria, sans-serif',
                                  fontWeight: '300',
                                  whiteSpace: 'nowrap',
                                  marginRight: '8px'
                                }}>تتمة</span>
                              )}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    )}
                    {index < displayedNews.length - 1 && <div className="w-full h-px bg-gray-200 mx-auto my-3"></div>}
                  </div>
                );
              })}
              
              {/* Show More Button - Inside scroll area */}
              <div className="pt-4 text-center">
                <Link
                  href="/last-news"
                  className="inline-flex items-center px-6 py-3 bg-white text-black font-semibold text-lg"
                >
                  <FiArrowLeft className="ml-3 text-blue-600" size={24} />
                  <span className="block" style={{ 
                    fontFamily: 'Alexandria, sans-serif',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2',
                    fontSize: '18px',
                    fontWeight: '300'
                  }}>الـــمــزيـــد</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LastNewsBanner;

function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return 'الآن';
  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes}د`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}س`;
  }
  if (diff < 2592000) {
    const days = Math.floor(diff / 86400);
    return `${days}ي`;
  }
  if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months}ش`;
  }
  const years = Math.floor(diff / 31536000);
  return `${years}سن`;
}