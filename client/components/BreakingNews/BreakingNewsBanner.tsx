'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BreakingNews } from '../API/types';

interface BreakingNewsBannerProps {
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
  limit?: number;
}

const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({
  className = '',
  autoHide = false,
  autoHideDelay = 10000,
  limit = 10
}) => {
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set a maximum loading time to prevent indefinite waiting
  useEffect(() => {
    const maxLoadingTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading timeout - showing fallback content');
        setBreakingNews([
          {
            id: 1,
            title_ar: 'أخبار عاجلة - موقع مركبا نيوز',
            title: 'Breaking News - Markaba News',
            content: 'أخبار عاجلة من موقع مركبا نيوز',
            link: '/',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      }
    }, 2000); // Maximum 2 seconds loading time
    
    return () => clearTimeout(maxLoadingTimer);
  }, [loading]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanding, setIsExpanding] = useState(false);

  // Fetch breaking news with polling for real-time updates
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        // Add timeout to prevent long waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch(`/api/breaking-news?active=true&limit=${limit}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch breaking news');
        }
        
        const data = await response.json();
        setBreakingNews(data.data || []);
        setError(null);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setError('Connection timeout - using fallback data');
          // Set fallback breaking news data
          setBreakingNews([
            {
              id: 1,
              title_ar: 'أخبار عاجلة - موقع مركبا نيوز',
              title: 'Breaking News - Markaba News',
              content: 'أخبار عاجلة من موقع مركبا نيوز',
              link: '/',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load breaking news');
          // Set fallback data even on other errors
          setBreakingNews([
            {
              id: 1,
              title_ar: 'أخبار عاجلة - موقع مركبا نيوز',
              title: 'Breaking News - Markaba News',
              content: 'أخبار عاجلة من موقع مركبا نيوز',
              link: '/',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchBreakingNews();
    
    // Poll for updates every 60 seconds (reduced frequency)
    const interval = setInterval(fetchBreakingNews, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate breaking news every 8 seconds with smooth expansion animation
  useEffect(() => {
    if (breakingNews.length === 0) return;

    const interval = setInterval(() => {
      // Start expansion animation
      setIsExpanding(true);
      
      setTimeout(() => {
        // After 0.5 seconds (25% of cycle), start content transition
        setIsVisible(false);
        
        setTimeout(() => {
          // Change content and end expansion
          setCurrentIndex(prev => (prev + 1) % breakingNews.length);
          setIsExpanding(false);
          setIsVisible(true);
        }, 200); // 200ms transition time for quick content change
      }, 500); // 0.5 seconds expansion time (25% of 2 seconds)
    }, 4000); // 4 seconds per item

    return () => clearInterval(interval);
  }, [breakingNews.length]);

  // Reset to first item when breaking news changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsVisible(true);
    setIsExpanding(false);
  }, [breakingNews]);

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
    
    // Show current breaking news item with vertical slide animation
    const currentNews = breakingNews[currentIndex];
    
    return (
      <div className="relative w-full overflow-hidden h-auto min-h-[48px] sm:min-h-[56px] flex items-center py-1">
        <div 
          className={`w-full flex items-center transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="flex items-center text-gray-800 font-medium text-xs sm:text-sm w-full">
            <div className="flex-1 mr-2 sm:mr-3 min-w-0">
              {currentNews.link ? (
                <Link
                  href={currentNews.link}
                  className="text-gray-800 hover:text-red-600 transition-colors duration-300 leading-relaxed block"
                  target={currentNews.link.startsWith('http') ? '_blank' : '_self'}
                  rel={currentNews.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <span className="block break-words hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                    {currentNews.title_ar || currentNews.title}
                  </span>
                </Link>
              ) : (
                <span className="text-gray-800 leading-relaxed block break-words hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                  {currentNews.title_ar || currentNews.title}
                </span>
              )}
            </div>
            <div className="flex-shrink-0 inline-flex items-center bg-transparent rounded-lg px-1 py-0.5 min-w-[48px] sm:min-w-[56px]">
              <img 
                src="/images/breaking-news.png" 
                alt="Markaba News" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain block flex-shrink-0"
                style={{minWidth: '40px', minHeight: '40px', maxWidth: '48px', maxHeight: '48px'}}
                onError={(e) => {
                  console.error('breaking-news.png failed, trying logo.png');
                  if (e.currentTarget.src.includes('breaking-news.png')) {
                    e.currentTarget.src = '/images/logo.png';
                  } else if (e.currentTarget.src.includes('logo.png')) {
                    e.currentTarget.src = '/images/logo.png';
                  } else {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-blue-600 font-bold text-sm">📰</span>';
                  }
                }}
                onLoad={(e) => console.log('Logo loaded successfully:', e.currentTarget.src)}
              />
            </div>
          </div>
        </div>
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
          <div className="flex items-stretch min-h-[64px] sm:min-h-[80px] h-auto relative overflow-hidden">
            {/* أخبار عاجلة Label */}
            <div className={`flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-10 relative ${
                 isExpanding ? 'absolute inset-0 rounded-lg transform scale-100 shadow-2xl' : 'relative transform scale-100 shadow-md'
               }`}>
              {/* Breaking News Logo - appears during expansion */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                isExpanding ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}>
                <img 
                  src="/images/breaking-news-out.png" 
                  alt="Breaking News" 
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain filter brightness-0 invert"
                  style={{maxWidth: '64px', maxHeight: '64px'}}
                  onError={(e) => {
                    console.error('breaking-news-out.png failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Text label - fades during expansion */}
              <span className={`font-bold text-xs sm:text-sm whitespace-nowrap transition-opacity duration-300 ease-in-out ${
                isExpanding ? 'opacity-0' : 'opacity-100'
              }`}>أخبار عاجلة</span>
            </div>
            
            {/* News Content */}
            <div className={`flex-1 bg-white transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                isExpanding ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
              }`}>
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