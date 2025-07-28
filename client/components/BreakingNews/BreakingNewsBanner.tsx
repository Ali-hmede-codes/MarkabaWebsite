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
        
        const response = await fetch('/api/breaking-news?active=true', {
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

  // Auto-rotate breaking news every 6 seconds with expansion animation
  useEffect(() => {
    if (breakingNews.length === 0) return;

    const interval = setInterval(() => {
      // Start expansion animation
      setIsExpanding(true);
      
      setTimeout(() => {
        // After 1 second, start content transition
        setIsVisible(false);
        
        setTimeout(() => {
          // Change content and end expansion
          setCurrentIndex(prev => (prev + 1) % breakingNews.length);
          setIsExpanding(false);
          setIsVisible(true);
        }, 300); // 300ms transition time
      }, 1000); // 1 second expansion time
    }, 6000); // 6 seconds per item

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
      <div className="relative w-full overflow-hidden h-12 sm:h-14 flex items-center">
        <div 
          className={`w-full flex items-center transition-all duration-300 ease-in-out transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="flex items-center text-gray-800 font-medium text-xs sm:text-sm">
            <span className="mr-2 sm:mr-3">
              {currentNews.link ? (
                <Link
                  href={currentNews.link}
                  className="text-gray-800 hover:text-red-600 transition-colors duration-200 leading-tight"
                  target={currentNews.link.startsWith('http') ? '_blank' : '_self'}
                  rel={currentNews.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {currentNews.title_ar || currentNews.title}
                </Link>
              ) : (
                <span className="text-gray-800 leading-tight">
                  {currentNews.title_ar || currentNews.title}
                </span>
              )}
            </span>
            <span className="inline-flex items-center mx-2 sm:mx-3 bg-transparent rounded-lg px-1 py-0.5 min-w-[48px] sm:min-w-[56px]">
              <img 
                src="/images/breaking-news.png" 
                alt="Markaba News" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain block"
                style={{minWidth: '40px', minHeight: '40px', maxWidth: '48px', maxHeight: '48px'}}
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
          <div className="flex items-stretch h-16 sm:h-20 relative overflow-hidden">
            {/* أخبار عاجلة Label */}
            <div className={`flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-10 ${
                isExpanding ? 'absolute inset-0 rounded-lg transform scale-100 shadow-lg' : 'relative transform scale-100 shadow-sm'
              }`}>
              <span className="font-bold text-xs sm:text-sm">أخبار عاجلة</span>
            </div>
            
            {/* News Content */}
            <div className={`flex-1 bg-white transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${
               isExpanding ? 'opacity-0' : 'opacity-100'
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