import React, { useState, useEffect } from 'react';
import { usePosts } from '../API/hooks';
import { Post, Category } from '../API/types';
import { FiCalendar, FiBook, FiTag, FiArrowLeft } from 'react-icons/fi';
import { getOptimizedImageProps, preloadImages } from '../../utils/imageUtils';
import Link from 'next/link';
import LastNewsBanner from '../LastNews/LastNewsBanner';

type LatestArticlesProps = {
  className?: string;
  categories?: Category[];
};

const LatestArticles: React.FC<LatestArticlesProps> = ({ className = '', categories = [] }) => {
  const { data: postsResponse, loading } = usePosts();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (postsResponse?.posts) {
      const sorted = [...postsResponse.posts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 7); // Changed from 3 to 7 articles
      setLatestPosts(sorted);
      
      // Preload critical images for better performance
      if (sorted.length > 0) {
        const imagePaths = sorted.map(post => post.featured_image).filter((path): path is string => Boolean(path));
        preloadImages(imagePaths, { quality: 80, format: 'auto' });
      }
    }
  }, [postsResponse]);

  if (loading) return <div>جاري التحميل...</div>;
  if (latestPosts.length === 0) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return "";
    return category.name_ar || "";
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'منذ لحظات';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else {
      return formatDate(dateString);
    }
  };

  // Helper function to render postcard-style article for PC (last 4 articles)
  const renderPostcardArticle = (post: Post, index: number) => {
    const categoryName = getCategoryName(post.category_id);
    
    return (
      <Link 
        href={`/post/${post.slug}`} 
        className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
      >
        <div className="w-full h-full flex flex-col">
          {/* Image */}
          <div className="aspect-[4/3] w-full overflow-hidden flex-shrink-0">
            <img 
              {...getOptimizedImageProps(post.featured_image, {
                width: 300,
                height: 225,
                quality: 85,
                format: 'auto',
                lazy: true
              })}
              alt={post.title_ar} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
            />
          </div>
          
          {/* Content */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Category - Black for last 4 posts */}
            {categoryName && (
              <span className="inline-block bg-black text-white text-xs px-2 py-1 rounded mb-2 w-fit">
                {categoryName}
              </span>
            )}
            
            {/* Title - Fixed height with line clamping */}
            <h3 className="font-bold text-gray-900 mb-2 leading-tight text-sm line-clamp-3 flex-grow min-h-[3.6rem]">
              {post.title_ar}
            </h3>
            
            {/* Time - Always at bottom */}
            <div className="flex items-center text-xs text-gray-500 mt-auto">
              <FiCalendar className="inline ml-1" size={12} /> 
              {getRelativeTime(post.created_at)}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Helper function to render horizontal article for mobile (last 4 articles)
  const renderHorizontalArticle = (post: Post, index: number) => {
    const categoryName = getCategoryName(post.category_id);
    
    return (
      <Link 
        href={`/post/${post.slug}`} 
        className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-32"
      >
        <div className="flex h-full">
          {/* Image - 4:3 ratio */}
          <div className="w-32 flex-shrink-0">
            <div className="aspect-[4/3] w-full overflow-hidden h-full">
              <img 
                {...getOptimizedImageProps(post.featured_image, {
                  width: 128,
                  height: 96,
                  quality: 85,
                  format: 'auto',
                  lazy: true
                })}
                alt={post.title_ar} 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-3 flex flex-col justify-between min-h-0">
            <div className="flex-grow">
              {/* Category - Black for last 4 posts */}
              {categoryName && (
                <span className="inline-block bg-black text-white text-xs px-2 py-1 rounded mb-2 w-fit">
                  {categoryName}
                </span>
              )}
              
              {/* Title - Fixed height with line clamping */}
              <h3 className="font-bold text-gray-900 leading-tight text-sm line-clamp-2 overflow-hidden">
                {post.title_ar}
              </h3>
            </div>
            
            {/* Time - Always at bottom */}
            <div className="flex items-center text-xs text-gray-500 mt-auto flex-shrink-0">
              <FiCalendar className="inline ml-1" size={12} /> 
              {getRelativeTime(post.created_at)}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Helper function to render article card with overlay for first 3 articles
  const renderArticleCard = (post: Post, isLarge: boolean = false) => {
    const categoryName = getCategoryName(post.category_id);
    
    return (
      <Link 
        href={`/post/${post.slug}`} 
        className={`block rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer relative ${
          isLarge ? 'aspect-video' : 'aspect-video'
        }`}
      >
        <div className="w-full h-full relative">
          <img 
            {...getOptimizedImageProps(post.featured_image, {
              width: isLarge ? 800 : 400,
              height: isLarge ? 450 : 225,
              quality: 85,
              format: 'auto',
              priority: isLarge,
              lazy: !isLarge
            })}
            alt={post.title_ar} 
            className="w-full h-full object-cover" 
          />
          {/* Black fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          {/* Content overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 ${isLarge ? 'sm:p-6' : 'sm:p-4'}`}>
            <h3 className={`font-bold text-white mb-2 leading-tight drop-shadow-lg ${
              isLarge ? 'text-base sm:text-xl' : 'text-xs sm:text-base'
            }`}>
              {post.title_ar}
            </h3>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90">
              <span className="flex items-center">
                <FiCalendar className="inline ml-1" size={12} /> 
                {getRelativeTime(post.created_at)}
              </span>
              {/* Category - White for first 3 posts */}
              {categoryName && (
                <span className="flex items-center bg-white text-black text-xs px-2 py-1 rounded">
                  <FiTag className="inline ml-1" size={12} />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={`${className}`} dir="rtl">
      <div className="flex flex-col rounded-lg p-3 sm:p-6 min-h-[500px] sm:min-h-[600px] bg-gray-50/50">
        
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* First 3 articles in vertical layout */}
          <div className="space-y-4 mb-6">
            {latestPosts.slice(0, 3).map((post, index) => (
              <div key={post.id}>
                {renderArticleCard(post, index === 0)}
              </div>
            ))}
          </div>
          
          {/* آخر الأخبار section - Full width on mobile with fixed height */}
          <div className="mb-8 w-full">
            <LastNewsBanner className="w-full" />
          </div>
          
          {/* Last 4 articles in horizontal layout */}
          <div className="space-y-4">
            {latestPosts.slice(3, 7).map((post, index) => (
              <div key={post.id}>
                {renderHorizontalArticle(post, index)}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Top section: First 3 articles + آخر الأخبار side by side */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* First 3 articles section - Reduced from col-span-8 to col-span-7 */}
            <div className="col-span-7">
              {/* Big article */}
              <div className="mb-6">
                {latestPosts[0] && renderArticleCard(latestPosts[0], true)}
              </div>
              
              {/* Two articles side by side */}
              <div className="grid grid-cols-2 gap-4">
                {latestPosts.slice(1, 3).map(post => (
                  <div key={post.id}>
                    {renderArticleCard(post, false)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* آخر الأخبار section on the side - Increased from col-span-4 to col-span-5 */}
            <div className="col-span-5">
              <LastNewsBanner className="h-full" />
            </div>
          </div>
          
          {/* Last 4 articles in postcard layout (4 columns) */}
          <div className="grid grid-cols-4 gap-4">
            {latestPosts.slice(3, 7).map((post, index) => (
              <div key={post.id} className="h-full">
                {renderPostcardArticle(post, index)}
              </div>
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
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-black font-medium text-sm rounded-lg hover:bg-gray-200 transition-all duration-300"
          >
            <FiArrowLeft className="ml-2 text-blue-600" size={16} />
            الــــمـــزيــــد
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LatestArticles;