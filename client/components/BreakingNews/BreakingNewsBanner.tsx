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
    <div className={`relative ${className}`}>
      {/* Top spacing */}
      <div className="h-4"></div>
      
      {/* Breaking News Banner */}
      <div className="container mx-auto px-4">
        {/* PC Version - Match LatestArticles width */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center h-12">
                  {/* أخبار عاجلة Label with Logo */}
                  <div className="flex items-center bg-red-600 text-white px-4 py-3 rounded-r-lg">
                    <img 
                      src="/images/logo_new.png" 
                      alt="Markaba News" 
                      className="h-6 w-auto ml-2"
                    />
                    <span className="font-bold text-sm">أخبار عاجلة</span>
                  </div>
                  
                  {/* News Content with fade effect */}
                  <div className="flex-1 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10"></div>
                    <div className="px-4 py-3">
                      <div className={`animate-scroll-endless whitespace-nowrap text-black font-medium ${animationReady ? 'animation-ready' : ''}`}>
                        {breakingNews.length > 0 ? (
                          <>
                            {/* First copy of all breaking news */}
                            {breakingNews.map((news, index) => (
                              <span key={`first-${news.id}`} className="inline-block">
                                {news.link ? (
                                  <Link
                                    href={news.link}
                                    className="text-black hover:text-red-600 transition-colors duration-200 leading-tight"
                                    target={news.link.startsWith('http') ? '_blank' : '_self'}
                                    rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                  >
                                    {news.title}
                                  </Link>
                                ) : (
                                  <span className="text-black leading-tight">
                                    {news.title}
                                  </span>
                                )}
                                <span className="text-red-600 mx-6">•</span>
                              </span>
                            ))}
                            {/* Second copy for seamless infinite loop */}
                            {breakingNews.map((news, index) => (
                              <span key={`second-${news.id}`} className="inline-block">
                                {news.link ? (
                                  <Link
                                    href={news.link}
                                    className="text-black hover:text-red-600 transition-colors duration-200 leading-tight"
                                    target={news.link.startsWith('http') ? '_blank' : '_self'}
                                    rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                  >
                                    {news.title}
                                  </Link>
                                ) : (
                                  <span className="text-black leading-tight">
                                    {news.title}
                                  </span>
                                )}
                                <span className="text-red-600 mx-6">•</span>
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="text-black leading-tight">
                            لا توجد أخبار عاجلة حالياً
                          </span>
                        )}
                     </div>
                   </div>
                   
                   {/* Close Button */}
                   {showCloseButton && (
                     <button
                       onClick={handleClose}
                       className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition-colors mr-2"
                       aria-label="Close breaking news banner"
                     >
                       <XMarkIcon className="w-4 h-4 text-gray-600" />
                     </button>
                   )}
                 </div>
               </div>
             </div>
           </div>
         </div>
         
         {/* Mobile Version - Match LatestArticles width */}
         <div className="lg:hidden">
           <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
             <div className="flex items-center h-12">
               {/* أخبار عاجلة Label with Logo */}
               <div className="flex items-center bg-red-600 text-white px-3 py-2 rounded-r-lg">
                 <img 
                   src="/images/logo_new.png" 
                   alt="Markaba News" 
                   className="h-5 w-auto ml-1"
                 />
                 <span className="font-bold text-xs">أخبار عاجلة</span>
               </div>
               
               {/* News Content with fade effect */}
               <div className="flex-1 relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10"></div>
                 <div className="px-3 py-2">
                   <div className={`animate-scroll-endless whitespace-nowrap text-black font-medium text-sm ${animationReady ? 'animation-ready' : ''}`}>
                     {breakingNews.length > 0 ? (
                       <>
                         {/* First copy of all breaking news */}
                         {breakingNews.map((news, index) => (
                           <span key={`mobile-first-${news.id}`} className="inline-block">
                             {news.link ? (
                               <Link
                                 href={news.link}
                                 className="text-black hover:text-red-600 transition-colors duration-200 leading-tight"
                                 target={news.link.startsWith('http') ? '_blank' : '_self'}
                                 rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                               >
                                 {news.title}
                               </Link>
                             ) : (
                               <span className="text-black leading-tight">
                                 {news.title}
                               </span>
                             )}
                             <span className="text-red-600 mx-4">•</span>
                           </span>
                         ))}
                         {/* Second copy for seamless infinite loop */}
                         {breakingNews.map((news, index) => (
                           <span key={`mobile-second-${news.id}`} className="inline-block">
                             {news.link ? (
                               <Link
                                 href={news.link}
                                 className="text-black hover:text-red-600 transition-colors duration-200 leading-tight"
                                 target={news.link.startsWith('http') ? '_blank' : '_self'}
                                 rel={news.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                               >
                                 {news.title}
                               </Link>
                             ) : (
                               <span className="text-black leading-tight">
                                 {news.title}
                               </span>
                             )}
                             <span className="text-red-600 mx-4">•</span>
                           </span>
                         ))}
                       </>
                     ) : (
                       <span className="text-black leading-tight">
                         لا توجد أخبار عاجلة حالياً
                       </span>
                     )}
                   </div>
                 </div>
               </div>
               
               {/* Close Button */}
               {showCloseButton && (
                 <button
                   onClick={handleClose}
                   className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition-colors mr-1"
                   aria-label="Close breaking news banner"
                 >
                   <XMarkIcon className="w-3 h-3 text-gray-600" />
                 </button>
               )}
             </div>
           </div>
         </div>
       </div>
      </div>
    </div>
  );
};

export default BreakingNewsBanner;