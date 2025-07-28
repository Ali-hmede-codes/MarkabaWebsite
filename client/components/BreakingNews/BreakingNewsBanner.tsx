'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [animationKey, setAnimationKey] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Measure content width and setup intelligent scrolling
  useEffect(() => {
    if (!contentRef.current || breakingNews.length === 0) return;

    const measureContent = () => {
      if (contentRef.current) {
        const width = contentRef.current.scrollWidth;
        setContentWidth(width);
      }
    };

    // Measure after content loads
    const timer = setTimeout(measureContent, 100);
    
    // Re-measure on window resize
    window.addEventListener('resize', measureContent);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureContent);
    };
  }, [breakingNews]);

  // Reset animation when content changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [breakingNews]);

  // Calculate animation duration based on content width
  const getAnimationDuration = useCallback(() => {
    if (contentWidth === 0) return 60; // Default duration
    // Base speed: 50px per second, minimum 20s, maximum 120s
    const duration = Math.max(20, Math.min(120, contentWidth / 50));
    return duration;
  }, [contentWidth]);

  // Handle animation end to restart seamlessly
  const handleAnimationEnd = useCallback(() => {
    setAnimationKey(prev => prev + 1);
  }, []);

  // Determine what content to show
  const getDisplayContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <span className="text-gray-500 text-xs sm:text-sm">جاري تحميل الأخبار العاجلة...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-red-500 text-xs sm:text-sm">خطأ في تحميل الأخبار</div>
      );
    }
    
    if (breakingNews.length === 0) {
      return (
        <div className="text-gray-500 text-xs sm:text-sm">لا توجد أخبار عاجلة حالياً</div>
      );
    }
    
    // Show actual breaking news content with intelligent scrolling
    const animationDuration = getAnimationDuration();
    
    return (
      <div className="relative w-full overflow-hidden">
        <div 
          ref={contentRef}
          key={animationKey}
          className="whitespace-nowrap text-gray-800 font-medium text-xs sm:text-sm"
          style={{
            animation: `scroll-intelligent ${animationDuration}s linear infinite`,
            animationFillMode: 'none',
            willChange: 'transform',
            display: 'inline-flex',
            alignItems: 'center'
          }}
          onAnimationEnd={handleAnimationEnd}
        >
          {/* First copy of all breaking news */}
          {breakingNews.map((news, index) => (
            <span key={`first-${news.id}`} className="inline-flex items-center mr-8">
              <span className="mr-2 sm:mr-3">
                {news.link ? (
                  <Link
                    href={news.link}
                    className="text-gray-800 hover:text-red-600 transition-colors duration-200 leading-tight"
                    target={news.link.startsWith('http') ? '_blank' : '_self'}
                    rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {news.title_ar || news.title}
                  </Link>
                ) : (
                  <span className="text-gray-800 leading-tight">
                    {news.title_ar || news.title}
                  </span>
                )}
              </span>
              <span className="inline-flex items-center mx-2 sm:mx-3 bg-transparent rounded-lg px-1 py-0.5 min-w-[32px] sm:min-w-[40px]">
                <img 
                  src="/images/breaking-news.png" 
                  alt="Markaba News" 
                  className="h-6 w-6 sm:h-8 sm:w-8 object-contain block"
                  style={{minWidth: '24px', minHeight: '24px', maxWidth: '32px', maxHeight: '32px'}}
                  onError={(e) => {
                    console.error('breaking-news.png failed, trying logo.png');
                    if (e.currentTarget.src.includes('breaking-news.png')) {
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
            <span key={`second-${news.id}`} className="inline-flex items-center mr-8">
              <span className="mr-2 sm:mr-3">
                {news.link ? (
                  <Link
                    href={news.link}
                    className="text-gray-800 hover:text-red-600 transition-colors duration-200 leading-tight"
                    target={news.link.startsWith('http') ? '_blank' : '_self'}
                    rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {news.title_ar || news.title}
                  </Link>
                ) : (
                  <span className="text-gray-800 leading-tight">
                    {news.title_ar || news.title}
                  </span>
                )}
              </span>
              <span className="inline-flex items-center mx-2 sm:mx-3 bg-transparent rounded-lg px-1 py-0.5 min-w-[32px] sm:min-w-[40px]">
                <img 
                  src="/images/breaking-news.png" 
                  alt="Markaba News" 
                  className="h-6 w-6 sm:h-8 sm:w-8 object-contain block"
                  style={{minWidth: '24px', minHeight: '24px', maxWidth: '32px', maxHeight: '32px'}}
                  onError={(e) => {
                    console.error('breaking-news.png failed, trying logo.png');
                    if (e.currentTarget.src.includes('breaking-news.png')) {
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
        </div>
        {/* Fade effect gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      </div>
    );
  };

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
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center h-12 sm:h-14">
            {/* أخبار عاجلة Label */}
            <div className="flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg">
              <span className="font-bold text-xs sm:text-sm">أخبار عاجلة</span>
            </div>
            
            {/* News Content */}
            <div className="flex-1 bg-white">
              <div className="px-4 sm:px-6 py-2 sm:py-3 flex items-center h-full">
                {getDisplayContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsBanner;