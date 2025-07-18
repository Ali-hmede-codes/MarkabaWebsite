'use client';

import React, { useState, useEffect, useRef } from 'react'; // Added useRef
// Remove import { Switch } from '@headlessui/react';



type NewsItem = {
  id: number;
  title_ar?: string;
  title?: string;
  content_ar?: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_active?: boolean;
  expires_at?: string;
  isBreaking?: boolean; // To distinguish breaking news
};



interface LastNewsBannerProps {
  className?: string;
}

const LastNewsBanner: React.FC<LastNewsBannerProps> = ({ className = '' }) => {
  const [lastNews, setLastNews] = useState<NewsItem[]>([]);
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [combineNews, setCombineNews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchLastNews = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2'}/last-news/active`);
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2'}/breaking-news/active`);
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
  const displayedNews: NewsItem[] = combineNews ? [...lastNews, ...breakingNews] : lastNews;

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    let isInteracting = false;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (scrollRef.current && !isInteracting) {
          scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
          if (scrollRef.current.scrollLeft + scrollRef.current.clientWidth >= scrollRef.current.scrollWidth) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          }
        }
      }, 3000);
    };

    const handleInteraction = () => {
      isInteracting = true;
      clearInterval(scrollInterval);
      setTimeout(() => {
        isInteracting = false;
        startAutoScroll();
      }, 5000);
    };

    startAutoScroll();

    const currentRef = scrollRef.current;
    currentRef?.addEventListener('touchstart', handleInteraction);
    currentRef?.addEventListener('mousedown', handleInteraction);

    return () => {
      clearInterval(scrollInterval);
      currentRef?.removeEventListener('touchstart', handleInteraction);
      currentRef?.removeEventListener('mousedown', handleInteraction);
    };
  }, [lastNews, breakingNews, combineNews]);

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (displayedNews.length === 0) return null;

  return (
    <div className={`p-4 ${className}`}> {/* Removed bg-white, rounded-xl, shadow-md for integration */}
      <div className="flex justify-end items-center mb-2"> {/* Removed h2 */}
        <div className="flex items-center">
          <span className="mr-2 text-red-600 font-bold">العاجل</span> {/* Bold red */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={combineNews}
              onChange={(e) => setCombineNews(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full ${combineNews ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${combineNews ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto flex space-x-6 pb-4 snap-x snap-mandatory" ref={scrollRef}> {/* Increased space-x-4 to space-x-6 */}
        {displayedNews.map((news, index) => (
          <div key={`${news.id}-${news.isBreaking ? 'breaking' : 'last'}`} className={`min-w-[300px] p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${news.isBreaking ? 'bg-red-50' : ''}`}> {/* Removed bg-gray-50 for no color */}
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{news.title_ar || news.title}</h3>
            <p className="text-gray-600 text-sm">{news.content_ar || news.content}</p>
            <p className="text-sm text-gray-500">{timeAgo(news.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LastNewsBanner;

function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 86400)} يوم`;
  if (diff < 31536000) return `منذ ${Math.floor(diff / 2592000)} شهر`;
  return `منذ ${Math.floor(diff / 31536000)} سنة`;
}