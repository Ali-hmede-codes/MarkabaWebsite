import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Helmet } from 'react-helmet';
import { GetServerSideProps } from 'next';
import Layout from '../components/Layout/Layout';
import { useContent } from '../hooks/useContent';
import { Post, Category } from '../components/API/types';
import { 
  FiCalendar,  
  FiEye, 
  FiClock,
  FiSun,
  FiCloudRain , FiMapPin,
  FiTrendingUp,
  FiBook
} from 'react-icons/fi';
import { getImageUrl } from '../utils/imageUtils';
import LastNewsBanner from '../components/LastNews/LastNewsBanner';
import LatestArticles from '../components/LatestArticles/LatestArticles';
import BreakingNewsBanner from '../components/BreakingNews/BreakingNewsBanner';

interface HomePageProps {
  posts: Post[];
  categories: Category[];
  error?: string;
}

const HomePage: React.FC<HomePageProps> = ({ posts, categories, error }) => {
  const { content } = useContent();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);

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
    return category.name_ar || '';
  };

  if (error) {
    return (
      <Layout pageType="home">
        <div className="container mx-auto responsive-padding py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في تحميل البيانات</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!content) return null;

  return (
    <>
      <Helmet>
        <title>{content?.site?.name || 'مـركـبـا - الـمـنـصـة الاخـبـاريـة'}</title>
        <meta name="description" content={content?.site?.description || 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة'} />
        <meta name="keywords" content="أخبار,أخبار عاجلة,تحديثات,صحافة,أحداث جارية,لبنان,الشرق الأوسط" />
        <meta name="author" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={content?.site?.name || 'مـركـبـا - الـمـنـصـة الاخـبـاريـة'} />
        <meta property="og:description" content={content?.site?.description || 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة'} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/og-default.svg`} />
        <meta property="og:image:secure_url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/og-default.svg`} />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="مـركـبـا" />
        <meta property="og:locale" content="ar_AR" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content?.site?.name || 'مـركـبـا - الـمـنـصـة الاخـبـاريـة'} />
        <meta name="twitter:description" content={content?.site?.description || 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة'} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/og-default.svg`} />
        <meta name="twitter:image:alt" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
        
        {/* Additional Meta Tags */}
        <meta name="language" content="Arabic" />
        <meta name="geo.region" content="LB" />
        <meta name="geo.country" content="Lebanon" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'} />
      </Helmet>
      
      <Layout
        pageType="home"
        seo={{
          title: content?.site?.name || 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
          description: content?.site?.description || 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة',
          image: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/og-default.svg`,
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news',
          type: 'website',
          keywords: ['أخبار', 'أخبار عاجلة', 'تحديثات', 'صحافة', 'أحداث جارية', 'لبنان', 'الشرق الأوسط']
        }}
      >
      <div className="bg-white min-h-screen" dir="rtl">
        {/* Breaking News Banner */}
        <BreakingNewsBanner />

        <div className="container mx-auto responsive-padding">
          {/* Latest Articles and Last News Section */}
          <section className="mb-16 lg:mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
              <div className="lg:col-span-7 order-1 lg:order-1">
                <LatestArticles className="" />
              </div>
              <div className="hidden lg:flex lg:col-span-1 order-3 lg:order-2 items-center justify-center">
                <div className="w-px h-full bg-gray-300 min-h-[400px]"></div>
              </div>
              <div className="lg:col-span-4 order-2 lg:order-3">
                <LastNewsBanner className="h-full" />
              </div>
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
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  try {
    // Use localhost for server-side rendering in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? 'http://localhost:5000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    
    console.log('SSR: Fetching data from:', baseUrl);
    
    // Fetch posts and categories in parallel
    const [postsResponse, categoriesResponse] = await Promise.all([
      fetch(`${baseUrl}/api/posts`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsMarkaba-SSR/1.0'
        }
      }),
      fetch(`${baseUrl}/api/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsMarkaba-SSR/1.0'
        }
      })
    ]);

    console.log('SSR: Posts response status:', postsResponse.status);
    console.log('SSR: Categories response status:', categoriesResponse.status);

    if (!postsResponse.ok || !categoriesResponse.ok) {
      throw new Error(`API Error: Posts ${postsResponse.status}, Categories ${categoriesResponse.status}`);
    }

    const postsData = await postsResponse.json();
    const categoriesData = await categoriesResponse.json();
    
    console.log('SSR: Posts data structure:', postsData.success ? 'success' : 'failed');
    console.log('SSR: Categories data structure:', categoriesData.success ? 'success' : 'failed');

    // Handle the API response structure correctly
    const posts = postsData.success ? (postsData.data?.posts || []) : [];
    const categories = categoriesData.success ? (categoriesData.data?.categories || []) : [];

    return {
      props: {
        posts,
        categories
      }
    };
  } catch (error) {
    console.error('SSR Error fetching homepage data:', error);
    return {
      props: {
        posts: [],
        categories: [],
        error: 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.'
      }
    };
  }
};

export default HomePage;