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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch breaking news
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000/api/v2'}/breaking-news/active`);
        if (!response.ok) {
          throw new Error('Failed to fetch breaking news');
        }
        
        const data = await response.json();
        setBreakingNews(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load breaking news');
      } finally {
        setLoading(false);
      }
    };

    fetchBreakingNews();
  }, []);

  // Auto-rotate breaking news items
  useEffect(() => {
    if (breakingNews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingNews.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [breakingNews.length]);

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

  const currentNews = breakingNews[currentIndex];

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
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse opacity-20" />
      
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
          <div className="flex-1 mx-4 min-w-0">
            <div className="flex items-center space-x-4">
              {/* Time */}
              {currentNews.created_at && (
                <span className="text-xs opacity-90 flex-shrink-0">
                  {formatDate(currentNews.created_at)}
                </span>
              )}
              
              {/* News Text */}
              <div className="flex-1 min-w-0">
                {currentNews.link ? (
                  <Link
                    href={currentNews.link}
                    className="hover:underline focus:underline focus:outline-none"
                    target={currentNews.link.startsWith('http') ? '_blank' : '_self'}
                    rel={currentNews.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <span className="block truncate font-medium">
                      {currentNews.title}
                    </span>
                  </Link>
                ) : (
                  <span className="block truncate font-medium">
                    {currentNews.title}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Dots */}
          {breakingNews.length > 1 && (
            <div className="flex items-center space-x-1 flex-shrink-0 mr-4">
              {breakingNews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to breaking news ${index + 1}`}
                />
              ))}
            </div>
          )}
          
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
      
      {/* Progress Bar */}
      {breakingNews.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
          <div 
            className="h-full bg-white transition-all duration-5000 ease-linear"
            style={{
              width: `${((currentIndex + 1) / breakingNews.length) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BreakingNewsBanner;