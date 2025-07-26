'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BreakingNews } from '../API/types';

interface BreakingNewsBannerProps {
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({
  className = '',
  autoHide = false,
  autoHideDelay = 10000
}) => {
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationReady, setAnimationReady] = useState(false);

  // Fetch breaking news with polling for real-time updates
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const response = await fetch('/api/breaking-news?active=true');
        if (!response.ok) {
          throw new Error('Failed to fetch breaking news');
        }
        
        const data = await response.json();
        setBreakingNews(data.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load breaking news');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchBreakingNews();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchBreakingNews, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate breaking news items (disabled for continuous scroll)
  // useEffect(() => {
  //   if (breakingNews.length <= 1) return;

  //   const interval = setInterval(() => {
  //     setCurrentIndex((prev) => (prev + 1) % breakingNews.length);
  //   }, 5000); // Change every 5 seconds

  //   return () => clearInterval(interval);
  // }, [breakingNews.length]);

  // Initialize animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render if loading or error, but show placeholder if no breaking news for debugging
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-6"></div>
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="flex items-center h-10 sm:h-12">
              <div className="flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg">
                <span className="font-bold text-xs sm:text-sm">أخبار عاجلة</span>
              </div>
              <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3">
                <div className="text-gray-500 text-xs sm:text-sm">جاري التحميل...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-6"></div>
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="flex items-center h-10 sm:h-12">
              <div className="flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg">
                <span className="font-bold text-xs sm:text-sm">أخبار عاجلة</span>
              </div>
              <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3">
                <div className="text-red-500 text-xs sm:text-sm">خطأ في تحميل الأخبار</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (breakingNews.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-6"></div>
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="flex items-center h-10 sm:h-12">
              <div className="flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg">
                <span className="font-bold text-xs sm:text-sm">أخبار عاجلة</span>
              </div>
              <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3">
                <div className="text-gray-500 text-xs sm:text-sm">لا توجد أخبار عاجلة حالياً</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Top spacing */}
      <div className="h-6"></div>
      
      {/* Breaking News Banner */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex items-center h-10 sm:h-12">
            {/* أخبار عاجلة Label */}
            <div className="flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg">
              <span className="font-bold text-xs sm:text-sm">أخبار عاجلة</span>
            </div>
            
            {/* News Content with fade effect */}
            <div className="flex-1 relative overflow-hidden bg-white">
              <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-white to-transparent z-10"></div>
              <div className="px-3 sm:px-4 py-1 sm:py-2 flex items-center h-full">
                <div className={`animate-scroll-endless whitespace-nowrap text-gray-800 font-medium text-xs sm:text-sm ${animationReady ? 'animation-ready' : ''}`}>
                  {breakingNews.length > 0 ? (
                    <>
                      {/* First copy of all breaking news */}
                      {breakingNews.map((news, index) => (
                        <span key={`first-${news.id}`} className="inline-flex items-center">
                          <span className="mr-2 sm:mr-4">
                            {news.link ? (
                              <Link
                                href={news.link}
                                className="text-gray-800 hover:text-red-600 transition-colors duration-200 leading-tight"
                                target={news.link.startsWith('http') ? '_blank' : '_self'}
                                rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {news.title}
                              </Link>
                            ) : (
                              <span className="text-gray-800 leading-tight">
                                {news.title}
                              </span>
                            )}
                          </span>
                          <span className="inline-flex items-center mx-2 sm:mx-4 bg-blue-100/0 rounded-lg px-6 py-2 border border-blue-300/0 min-w-[80px]">
                            <img 
                              src="/images/logo_new.png" 
                              alt="Markaba News" 
                              className="h-6 sm:h-8 w-auto block"
                              style={{minWidth: '24px', minHeight: '24px'}}
                              onError={(e) => {
                                console.error('Logo_new.png failed, trying logo.png');
                                if (e.currentTarget.src.includes('logo_new.png')) {
                                  e.currentTarget.src = '/images/logo.png';
                                } else if (e.currentTarget.src.includes('logo.png')) {
                                  e.currentTarget.src = '/images/logo.svg';
                                } else {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<span class="text-blue-600 font-bold text-sm">📰</span>';
                                }
                              }}
                              onLoad={(e) => console.log('Logo loaded successfully:', e.currentTarget.src)}
                            />
                          </span>
                        </span>
                      ))}
                      {/* Second copy for seamless infinite loop */}
                      {breakingNews.map((news, index) => (
                        <span key={`second-${news.id}`} className="inline-flex items-center">
                          <span className="mr-2 sm:mr-4">
                            {news.link ? (
                              <Link
                                href={news.link}
                                className="text-gray-800 hover:text-red-600 transition-colors duration-200 leading-tight"
                                target={news.link.startsWith('http') ? '_blank' : '_self'}
                                rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {news.title}
                              </Link>
                            ) : (
                              <span className="text-gray-800 leading-tight">
                                {news.title}
                              </span>
                            )}
                          </span>
                          <span className="inline-flex items-center mx-2 sm:mx-4 bg-blue-100/0 rounded-lg px-6 py-2 border border-blue-300/0 min-w-[80px]">
                            <img 
                              src="/images/logo_new.png" 
                              alt="Markaba News" 
                              className="h-6 sm:h-8 w-auto block"
                              style={{minWidth: '24px', minHeight: '24px'}}
                              onError={(e) => {
                                console.error('Logo_new.png failed, trying logo.png');
                                if (e.currentTarget.src.includes('logo_new.png')) {
                                  e.currentTarget.src = '/images/logo.png';
                                } else if (e.currentTarget.src.includes('logo.png')) {
                                  e.currentTarget.src = '/images/logo.svg';
                                } else {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<span class="text-blue-600 font-bold text-sm">📰</span>';
                                }
                              }}
                              onLoad={(e) => console.log('Logo loaded successfully:', e.currentTarget.src)}
                            />
                          </span>
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-gray-800 leading-tight">
                      لا توجد أخبار عاجلة حالياً
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
       </div>
      </div>
  );
};

export default BreakingNewsBanner;