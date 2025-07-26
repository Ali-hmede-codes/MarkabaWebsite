import React, { useState, useEffect } from 'react';
import { usePosts } from '../API/hooks';
import { Post } from '../API/types';
import { FiCalendar, FiEye, FiBook } from 'react-icons/fi';
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
    <div className={` ${className}`} dir="rtl">

      <div className="flex flex-col rounded-lg p-1 sm:p-4 h-[600px]">
        <div className="flex flex-col gap-2 sm:gap-4 mb-1 sm:mb-2">
          {/* Big post */}
          <Link href={`/post/${latestPosts[0].slug}`} className="block rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-lg cursor-pointer relative">
            <div className="aspect-video w-full relative">
              <img src={getImageUrl(latestPosts[0].featured_image)} alt={latestPosts[0].title_ar} className="w-full h-full object-cover" />
              {/* Overlay with fade background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h3 className="font-bold text-base sm:text-xl text-white mb-2 leading-tight">{latestPosts[0].title_ar}</h3>
                <div className="flex justify-between text-xs text-white/80">
                  <span><FiCalendar className="inline ml-1" /> {formatDate(latestPosts[0].created_at)}</span>
                  <span><FiEye className="inline ml-1" /> {formatViews(latestPosts[0].views || 0)}</span>
                </div>
              </div>
            </div>
          </Link>
          {/* Two small posts */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {latestPosts.slice(1, 3).map(post => (
              <Link key={post.id} href={`/post/${post.slug}`} className="flex flex-row items-start gap-2 sm:gap-3 rounded-lg transition-shadow duration-300 p-1 sm:p-3 flex-1 hover:shadow-lg cursor-pointer">
                <img src={getImageUrl(post.featured_image)} alt={post.title_ar} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded" />
                <div className="flex flex-col">
                  <h3 className="font-bold text-xs sm:text-sm mb-1 text-blue-800 hover:text-blue-600 transition-colors line-clamp-2">{post.title_ar}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-1 line-clamp-2">{post.content_ar || post.content}</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span><FiCalendar className="inline ml-1" /> {formatDate(post.created_at)}</span>
                    <span><FiEye className="inline ml-1" /> {formatViews(post.views || 0)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="text-center mt-auto mb-2 sm:mb-4">
          <Link 
            href="#articles-section"
            className="inline-block text-purple-600 hover:text-purple-700 transition-colors duration-300 font-medium text-sm underline underline-offset-4 hover:underline-offset-2"
          >
            عرض المزيد
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LatestArticles;