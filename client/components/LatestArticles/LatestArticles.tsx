import React, { useState, useEffect } from 'react';
import { usePosts } from '../API/hooks';
import { Post } from '../API/types';
import { FiCalendar, FiBook } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUtils';
import Link from 'next/link';

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
    <div className={`${className}`} dir="rtl">
      <div className="flex flex-col rounded-xl p-3 sm:p-6 min-h-[500px] sm:min-h-[600px] bg-gray-50/50">
        <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Big post */}
          <Link href={`/post/${latestPosts[0].slug}`} className="block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer relative border border-gray-200 hover:border-gray-300">
            <div className="aspect-video w-full relative">
              <img src={getImageUrl(latestPosts[0].featured_image)} alt={latestPosts[0].title_ar} className="w-full h-full object-cover" />
              {/* Overlay with fade background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h3 className="font-bold text-lg sm:text-2xl text-white mb-3 leading-tight drop-shadow-lg">{latestPosts[0].title_ar}</h3>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-white/90">
                  <span className="flex items-center"><FiCalendar className="inline ml-1" /> {formatDate(latestPosts[0].created_at)}</span>
                </div>
              </div>
            </div>
          </Link>
          {/* Two small posts */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {latestPosts.slice(1, 3).map(post => (
              <Link key={post.id} href={`/post/${post.slug}`} className="flex flex-row items-start gap-3 sm:gap-4 rounded-xl transition-all duration-300 p-3 sm:p-4 flex-1 hover:shadow-lg cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300">
                <img src={getImageUrl(post.featured_image)} alt={post.title_ar} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                   <h3 className="font-bold text-sm md:text-base lg:text-lg mb-2 md:mb-3 text-gray-800 hover:text-blue-600 transition-colors leading-tight line-clamp-2">{post.title_ar}</h3>
                   <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-500 mt-auto">
                     <span className="flex items-center"><FiCalendar className="inline ml-1" /> {formatDate(post.created_at)}</span>
                   </div>
                 </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="text-center mt-auto mb-2 sm:mb-4">
          <Link 
            href="#articles-section"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('articles-section');
              if (element) {
                const offset = 120; // Scroll more down
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FiBook className="ml-2" size={16} />
            مشاهدة المزيد
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LatestArticles;