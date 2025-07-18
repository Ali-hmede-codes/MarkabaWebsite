'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiClock } from 'react-icons/fi';





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



type LastNewsBannerProps = {
  className?: string;
};

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



  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (displayedNews.length === 0) return null;

  return (
    <div className={` ${className}`} dir="rtl">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="responsive-flex justify-center mb-4 items-center">
          <FiClock className="text-blue-500 text-2xl sm:text-3xl ml-2 sm:ml-3" />
          <h2 className="section-title font-bold text-gray-800">آخر الأخبار</h2>
          <div className="flex items-center mr-4">
            <span className="ml-2 text-yellow-300 font-bold">العاجل</span>
            <label className="relative inline-flex items-center cursor-pointer mr-2">
              <input
                type="checkbox"
                checked={combineNews}
                onChange={(e) => setCombineNews(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full ${combineNews ? 'bg-white' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 bg-blue-600 rounded-full transition-transform ${combineNews ? 'translate-x-5 bg-blue-600' : 'translate-x-0'}`}></div>
            </label>
          </div>
        </div>
        <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto mt-2 rounded-full"></div>
      </div>
      <div className="rounded-lg h-[600px] overflow-y-auto p-4">
        <div className="space-y-4">
          {displayedNews.map((news, index) => (
            <div 
              key={`${news.id}-${news.isBreaking ? 'breaking' : 'last'}`} 
              className={`p-4 rounded-lg transition-all duration-300 ${news.isBreaking ? 'border-r-4 border-red-500' : 'border-r-4 border-blue-300'}`}
            >
              <h3 className="font-semibold text-md text-blue-800 mb-2 hover:text-blue-600 transition-colors">{news.title_ar || news.title}</h3>
              <p className="text-gray-700 text-sm mb-2">{news.content_ar || news.content}</p>
              <p className="text-xs text-gray-500">{timeAgo(news.created_at)}</p>
            </div>
          ))}
        </div>
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