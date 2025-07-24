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
    <div className={`relative bg-red-600 text-white ${className}`}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-l from-red-600 via-red-500 to-red-600 animate-pulse opacity-20" />
      
      <div className="relative px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Breaking News Label */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <SpeakerWaveIcon className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wide">
              Breaking News
            </span>
          </div>
          
          {/* News Content */}
          <div className="flex-1 mx-4 min-w-0 overflow-hidden">
            <div className="flex items-center space-x-4 h-6">
              {/* News Text */}
              <div className="flex-1 min-w-0 breaking-news-container overflow-hidden">
                <div className="relative h-6 flex items-center">
                  <div className={`animate-scroll-endless ${animationReady ? 'animation-ready' : ''}`}>
                    {breakingNews.length > 0 ? (
                      <>
                        {/* Multiple copies for truly endless scrolling */}
                        {[...Array(4)].map((_, copyIndex) => (
                          <div key={`copy-${copyIndex}`} className="inline-flex whitespace-nowrap">
                            {breakingNews.map((news, index) => (
                              <span key={`${copyIndex}-${news.id}`} className="inline-block">
                                {news.link ? (
                                  <Link
                                    href={news.link}
                                    className="text-white hover:text-yellow-300 transition-colors duration-200 leading-tight font-medium"
                                    target={news.link.startsWith('http') ? '_blank' : '_self'}
                                    rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                  >
                                    {news.title}
                                  </Link>
                                ) : (
                                  <span className="text-white leading-tight font-medium">
                                    {news.title}
                                  </span>
                                )}
                                <span className="text-white mx-8">•</span>
                              </span>
                            ))}
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="text-white leading-tight font-medium">
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