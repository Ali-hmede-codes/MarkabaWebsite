'use client';

import React, { useState, useEffect } from 'react';
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

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (lastNews.length === 0) return null;

  const displayedNews: NewsItem[] = combineNews ? [...lastNews, ...breakingNews] : lastNews;

  return (
    <div className={`bg-gray-100 p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">آخر الأخبار</h2>
        <div className="flex items-center">
          <span className="mr-2">العاجل</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={combineNews}
              onChange={(e) => setCombineNews(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full ${combineNews ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${combineNews ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto flex space-x-4 pb-2">
        {displayedNews.map((news, index) => (
          <div key={`${news.id}-${news.isBreaking ? 'breaking' : 'last'}`} className={`min-w-[300px] p-4 border rounded ${news.isBreaking ? 'bg-red-100' : 'bg-white'}`}>
            <h3 className="font-semibold">{news.title_ar || news.title}</h3>
            <p>{news.content_ar || news.content}</p>
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