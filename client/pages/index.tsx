import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import { useContent } from '../hooks/useContent';
import { usePosts, useCategories } from '../components/API/hooks';
import { Post } from '../components/API/types';
import { 
  FiCalendar,  
  FiEye, 
  FiClock,
  FiSun,
  FiCloudRain , FiMapPin,
  FiTrendingUp,
  FiBook
} from 'react-icons/fi';
import LastNewsBanner from '../components/LastNews/LastNewsBanner';
import LatestArticles from '../components/LatestArticles/LatestArticles';
import { getImageUrl } from '../lib/utils';

const HomePage: React.FC = () => {
  const { content } = useContent();
  const { data: postsResponse, loading: postsLoading } = usePosts();
  const { data: categoriesResponse } = useCategories();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);

  const posts = postsResponse?.posts || [];
  const categories = categoriesResponse?.categories || [];

  useEffect(() => {
    if (posts.length > 0) {
      // Sort posts by date for latest news
      const sortedPosts = [...posts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Latest posts for آخر الأخبار (last 8 posts)
      setLatestPosts(sortedPosts.slice(0, 8));
      
      // Featured posts for الأخبار المميزة - most trending (by views)
      const trendingPosts = [...posts]
        .filter(post => post.views && post.views > 0)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);
      
      // If not enough trending posts, fill with latest
      if (trendingPosts.length < 5) {
        const remainingPosts = sortedPosts
          .filter(post => !trendingPosts.find(tp => tp.id === post.id))
          .slice(0, 5 - trendingPosts.length);
        setFeaturedPosts([...trendingPosts, ...remainingPosts]);
      } else {
        setFeaturedPosts(trendingPosts);
      }
    }
  }, [posts]);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000/api/v2'}/breaking-news?active=true`);
        if (response.ok) {
          const data = await response.json();
          setBreakingNews(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching breaking news:', error);
      }
    };

    fetchBreakingNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}م`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}ك`;
    }
    return views.toString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return '';
    return (content?.categories as Record<string, string>)?.[category.slug] || category.name_ar || '';
  };

  if (!content) return null;

  return (
    <Layout
      title={content?.site?.name || 'News Site'}
      description={content?.site?.description || 'Latest News and Updates'}
    >
      <div className="bg-white min-h-screen" dir="rtl">
        {/* Breaking News Ticker */}
        <section className="bg-red-600 text-white py-2 overflow-hidden relative">
          <div className="flex items-center">
            <div className="bg-red-700 px-4 py-1 text-sm font-bold whitespace-nowrap">
              أخبار عاجلة
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-scroll-rtl flex items-center whitespace-nowrap">
                {breakingNews && breakingNews.length > 0 ? (
                  breakingNews.slice(0, 5).map((news: any, index: number) => (
                    <span key={news.id} className="inline-flex items-center">
                      <span className="mx-4 text-sm">{news.title}</span>
                      {index < 4 && <span className="font-bold text-yellow-300 mx-2">عاجل</span>}
                    </span>
                  ))
                ) : (
                  <span className="mx-4 text-sm">لا توجد أخبار عاجلة حالياً</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto responsive-padding">
          {/* Latest Articles and Last News Section */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6">
              <LatestArticles className="order-1" />
              <LastNewsBanner className="order-2 md:order-2 h-full" />
            </div>
          </section>

          {/* مقالات Section */}
          <section id="articles-section" className="mb-24">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="responsive-flex justify-center mb-4">
                <FiBook className="text-purple-500 text-2xl sm:text-3xl ml-2 sm:ml-3" />
                <h2 className="section-title font-bold text-gray-800">مقالات</h2>
              </div>
              <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-purple-500 to-purple-600 mx-auto mt-2 rounded-full"></div>
            </div>
            
            {posts.length > 0 && (
              <div className="flex overflow-x-auto space-x-4 rtl:space-x-reverse pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-purple-100">
                {posts.slice(0, 8).map((post, index) => (
                  <article key={post.id} className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0 w-64 sm:w-72" style={{scrollSnapAlign: 'start'}}>
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      {post.featured_image ? (
                        <img
                          src={getImageUrl(post.featured_image)}
                          alt={post.title_ar || post.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">{index + 1}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute top-3 right-3">
                        <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-lg">
                          {getCategoryName(post.category_id)}
                        </span>
                      </div>
                      {post.views && (
                        <div className="absolute top-3 left-3 flex items-center bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                          <FiEye size={12} className="ml-1 rtl:ml-0 rtl:mr-1 text-white" />
                          <span className="text-white text-xs font-medium">{formatViews(post.views)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 hover:text-purple-600 transition-colors leading-tight">
                        <Link href={`/post/${post.slug}`}>
                          {post.title_ar || post.title}
                        </Link>
                      </h3>
                      {(post.content_ar || post.content) && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                          {truncateText((post.content_ar || post.content).replace(/<[^>]*>/g, ''), 50)}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar size={10} className="ml-1 rtl:ml-0 rtl:mr-1" />
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* الأخبار المميزة Section */}
          <section className="mb-24">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="responsive-flex justify-center mb-4">
                <FiTrendingUp className="text-red-500 text-2xl sm:text-3xl ml-2 sm:ml-3" />
                <h2 className="section-title font-bold text-gray-800">الأخبار المميزة</h2>
              </div>
              <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto mt-2 rounded-full"></div>
            </div>
            
            {featuredPosts.length > 0 && (
              <div className="featured-grid">
                {featuredPosts.slice(0, 4).map((post, index) => (
                  <article key={post.id} className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 aspect-square flex flex-col">
                    <div className="relative flex-1 overflow-hidden">
                      {post.featured_image ? (
                        <img
                          src={getImageUrl(post.featured_image)}
                          alt={post.title_ar || post.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">{index + 1}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute top-3 right-3">
                        <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg">
                          {getCategoryName(post.category_id)}
                        </span>
                      </div>
                      {post.views && (
                        <div className="absolute top-3 left-3 flex items-center bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                          <FiEye size={12} className="ml-1 rtl:ml-0 rtl:mr-1 text-white" />
                          <span className="text-white text-xs font-medium">{formatViews(post.views)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-shrink-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors leading-tight">
                        <Link href={`/post/${post.slug}`}>
                          {post.title_ar || post.title}
                        </Link>
                      </h3>
                      {(post.content_ar || post.content) && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                          {truncateText((post.content_ar || post.content).replace(/<[^>]*>/g, ''), 50)}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar size={10} className="ml-1 rtl:ml-0 rtl:mr-1" />
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Prayer and Weather Section */}
          <section className="mb-16">
            <div className="info-boxes">
              {/* Prayer Times Box */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 responsive-padding">
                  <h3 className="info-box-title font-bold text-white responsive-flex">
                    <FiSun className="ml-2 sm:ml-3" />
                    مواقيت الصلاة
                  </h3>
                </div>
                <div className="info-box">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">الفجر</span>
                      <span className="text-green-600 font-bold">05:30</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">الشروق</span>
                      <span className="text-green-600 font-bold">06:45</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">الظهر</span>
                      <span className="text-green-600 font-bold">12:15</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">العصر</span>
                      <span className="text-green-600 font-bold">15:30</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">المغرب</span>
                      <span className="text-green-600 font-bold">18:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-gray-700">العشاء</span>
                      <span className="text-green-600 font-bold">19:30</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiMapPin size={12} className="ml-1 rtl:ml-0 rtl:mr-1" />
                      <span>بيروت، لبنان</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Box */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 responsive-padding">
                  <h3 className="info-box-title font-bold text-white responsive-flex">
                    <FiCloudRain className="ml-2 sm:ml-3" />
                    حالة الطقس
                  </h3>
                </div>
                <div className="info-box">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-blue-600 mb-2">28°C</div>
                    <div className="text-gray-600 font-medium">مشمس جزئياً</div>
                    <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                      <FiMapPin size={12} className="ml-1 rtl:ml-0 rtl:mr-1" />
                      <span>بيروت</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">الرطوبة</div>
                      <div className="text-lg font-bold text-blue-600">65%</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">الرياح</div>
                      <div className="text-lg font-bold text-blue-600">15 كم/س</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">الضغط</div>
                      <div className="text-lg font-bold text-blue-600">1013 هكتوباسكال</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">الرؤية</div>
                      <div className="text-lg font-bold text-blue-600">10 كم</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;