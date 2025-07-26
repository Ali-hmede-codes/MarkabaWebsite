'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { BreakingNews } from '../API/types';

interface BreakingNewsBannerProps {
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
  showCloseButton?: boolean;
}

const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({
  className = '',
  autoHide = false,
  autoHideDelay = 10000,
  showCloseButton = true
}) => {
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [isVisible, setIsVisible] = useState(true);
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

  // Auto-hide banner
  useEffect(() => {
    if (!autoHide) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay]);

  // Don't render if not visible, loading, error, or no breaking news
  if (!isVisible || loading || error || breakingNews.length === 0) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
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
    <div className={`relative breaking-news-banner text-white ${className}`}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-800 via-red-700 to-red-800 animate-pulse opacity-20" />
      
      <div className="relative px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Breaking News Label with Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-md border border-gray-100">
              <img 
                src="/images/logo_new.png" 
                alt="Markaba News" 
                className="h-7 w-auto filter drop-shadow-sm"
              />
            </div>
          </div>
          
          {/* News Content */}
          <div className="flex-1 mx-4 min-w-0 overflow-hidden">
            <div className="flex items-center space-x-4 h-8">
              {/* News Text */}
              <div className="flex-1 min-w-0 breaking-news-container overflow-hidden">
                <div className="relative h-8 flex items-center">
                  <div className={`animate-scroll-endless whitespace-nowrap text-lg font-semibold ${animationReady ? 'animation-ready' : ''}`}>
                    {breakingNews.length > 0 ? (
                      <>
                        {/* First copy of all breaking news */}
                        {breakingNews.map((news, index) => (
                          <span key={`first-${news.id}`} className="inline-block">
                            {news.link ? (
                              <Link
                                href={news.link}
                                className="text-white hover:text-yellow-200 transition-colors duration-200 leading-tight font-bold text-shadow-sm"
                                target={news.link.startsWith('http') ? '_blank' : '_self'}
                                rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {news.title}
                              </Link>
                            ) : (
                              <span className="text-white leading-tight font-bold text-shadow-sm">
                                {news.title}
                              </span>
                            )}
                            <span className="text-yellow-200 mx-8 font-bold">•</span>
                          </span>
                        ))}
                        {/* Second copy for seamless infinite loop */}
                        {breakingNews.map((news, index) => (
                          <span key={`second-${news.id}`} className="inline-block">
                            {news.link ? (
                              <Link
                                href={news.link}
                                className="text-white hover:text-yellow-200 transition-colors duration-200 leading-tight font-bold text-shadow-sm"
                                target={news.link.startsWith('http') ? '_blank' : '_self'}
                                rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {news.title}
                              </Link>
                            ) : (
                              <span className="text-white leading-tight font-bold text-shadow-sm">
                                {news.title}
                              </span>
                            )}
                            <span className="text-yellow-200 mx-8 font-bold">•</span>
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="text-white leading-tight font-bold text-shadow-sm">
                        لا توجد أخبار عاجلة حالياً
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close breaking news banner"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default BreakingNewsBanner;