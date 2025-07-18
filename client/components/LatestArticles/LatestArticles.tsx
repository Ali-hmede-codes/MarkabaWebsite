import React, { useState, useEffect } from 'react';
import { usePosts } from '../API/hooks';
import { Post } from '../API/types';
import { FiCalendar, FiEye, FiBook } from 'react-icons/fi';

type LatestArticlesProps = {
  className?: string;
};

const LatestArticles: React.FC<LatestArticlesProps> = ({ className = '' }) => {
  const { data: postsResponse, loading } = usePosts();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (postsResponse?.posts) {
      const sorted = [...postsResponse.posts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      setLatestPosts(sorted);
    }
  }, [postsResponse]);

  if (loading) return <div>جاري التحميل...</div>;
  if (latestPosts.length === 0) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatViews = (views: number) => views.toString();

  return (
    <div className={` ${className}`} dir="rtl">
      <div className="mb-8 sm:mb-12 text-center">
        <div className="responsive-flex justify-center mb-4 sm:mb-6">
          <FiBook className="text-purple-500 text-xl sm:text-3xl ml-1 sm:ml-3" />
          <h2 className="section-title font-bold text-gray-800 text-lg sm:text-xl">اخر المقالات</h2>
        </div>
        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 to-purple-600 mx-auto mt-1 sm:mt-2 rounded-full"></div>
      </div>
      <div className="flex flex-col rounded-lg p-1 sm:p-4">
        <div className="flex flex-col gap-2 sm:gap-4 mb-1 sm:mb-2">
          {/* Big post */}
          <div className="rounded-lg overflow-hidden transition-shadow duration-300">
            <img src={latestPosts[0].featured_image || '/placeholder.jpg'} alt={latestPosts[0].title_ar} className="w-full h-32 sm:h-48 object-cover" />
            <div className="p-1 sm:p-3">
              <h3 className="font-bold text-base sm:text-xl mb-1 sm:mb-3 text-blue-800 hover:text-blue-600 transition-colors">{latestPosts[0].title_ar}</h3>
              <p className="text-gray-700 text-xs sm:text-base mb-3 line-clamp-3">{latestPosts[0].content_ar || latestPosts[0].content}</p>
              <div className="flex justify-between text-xs text-gray-600">
                <span><FiCalendar className="inline ml-1" /> {formatDate(latestPosts[0].created_at)}</span>
                <span><FiEye className="inline ml-1" /> {formatViews(latestPosts[0].views || 0)}</span>
              </div>
            </div>
          </div>
          {/* Two small posts */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {latestPosts.slice(1, 3).map(post => (
              <div key={post.id} className="flex flex-row items-start gap-2 sm:gap-3 rounded-lg transition-shadow duration-300 p-1 sm:p-3 flex-1">
                <img src={post.featured_image || '/placeholder.jpg'} alt={post.title_ar} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded" />
                <div className="flex flex-col">
                  <h3 className="font-bold text-xs sm:text-sm mb-1 text-blue-800 hover:text-blue-600 transition-colors line-clamp-2">{post.title_ar}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-1 line-clamp-2">{post.content_ar || post.content}</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span><FiCalendar className="inline ml-1" /> {formatDate(post.created_at)}</span>
                    <span><FiEye className="inline ml-1" /> {formatViews(post.views || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-auto mb-2 sm:mb-4">
          <button 
            onClick={() => {
              const articlesSection = document.getElementById('articles-section');
              if (articlesSection) {
                articlesSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition-colors duration-300 text-sm sm:text-base"
          >
            عرض المزيد
          </button>
        </div>
      </div>
    </div>
  );
};

export default LatestArticles;