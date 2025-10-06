import React, { useState, useEffect } from "react";
import Link from "next/link";
import { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "../components/Layout/Layout";
import SimpleMeta from "../components/Meta/SimpleMeta";
import { useContent } from "../hooks/useContent";
import { Post, Category } from "../components/API/types";
import {
  FiCalendar,
  FiEye,
  FiBook,
  FiTrendingUp,
  FiPlay,
} from "react-icons/fi";
import { getImageUrl } from "../utils/imageUtils";
import LastNewsBanner from "../components/LastNews/LastNewsBanner";
import LatestArticles from "../components/LatestArticles/LatestArticles";
import BreakingNewsBanner from "../components/BreakingNews/BreakingNewsBanner";
import { PrayerTimes, Weather } from "../components/PrayerWeather";
import { MainTopAd, SidebarTopAd, BottomMainAd } from "../components/ads";


interface HomePageProps {
  posts: Post[];
  categories: Category[];
  error?: string | null;
}

const HomePage: NextPage<HomePageProps> = ({ posts, categories, error }) => {
  const { content } = useContent();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);

  // Fetch video posts from the new endpoint
  const fetchVideoPosts = async () => {
    try {
      setVideoLoading(true);
      const response = await fetch('/api/posts/videos?limit=4&sort=created_at&order=desc');
      if (response.ok) {
        const data = await response.json();
        // API returns {success: true, data: {posts: [...]}}
        setVideoPosts(data.data?.posts || []);
      }
    } catch (error) {
      console.error('Error fetching video posts:', error);
    } finally {
      setVideoLoading(false);
    }
  };

  useEffect(() => {
    if (posts.length > 0) {
      // Sort posts by date for latest news
      const sortedPosts = [...posts].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      // Latest posts for آخر الأخبار (last 8 posts)
      setLatestPosts(sortedPosts.slice(0, 8));

      // Featured posts for الأخبار المميزة - last 4 featured posts
      const featuredPostsList = [...posts]
        .filter((post) => Boolean(post.is_featured))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);

      setFeaturedPosts(featuredPostsList);
    }
    
    // Fetch video posts separately
    fetchVideoPosts();
  }, [posts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const arabicMonths = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
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



  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}م`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}ك`;
    }
    return views.toString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength) + "...";
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return "";
    return category.name_ar || "";
  };

  if (error) {
    return (
      <Layout pageType="home">
        <div className="container mx-auto responsive-padding py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              خطأ في تحميل البيانات
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!content) return null;

  return (
    <>
      <SimpleMeta 
        title="الصفحة الرئيسية"
        description="مـركـبـا - الـمـنـصـة الاخـبـاريـة - آخر الأخبار والمقالات من مختلف المجالات"
        image="/images/og-image.jpg"
        canonical="https://markaba.news"
      />
      <Layout 
        pageType="home"
      >
        <div className="bg-white min-h-screen" dir="rtl">
          {/* Breaking News Banner */}
          <BreakingNewsBanner />

          <div className="container mx-auto responsive-padding">
            {/* Latest Articles Section */}
            <section className="mb-8 lg:mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
                <div className="lg:col-span-12 order-1">
                  <LatestArticles className="" categories={categories} />
                </div>
              </div>
              
              {/* Mobile Ad - Show under LatestArticles on mobile only with proper spacing */}
              <div className="lg:hidden mt-6 mb-6">
                <MainTopAd showOnMobile={true} showOnDesktop={false} />
              </div>
              
              {/* Desktop Ad - Show under LatestArticles on desktop only */}
              <MainTopAd showOnMobile={false} showOnDesktop={true} className="mt-8" />
            </section>



            {/* مقالات Section */}
            <section id="articles-section" className="mb-24">
              <div className="mb-6 sm:mb-8 text-right">
                <h2 
                  className="text-2xl sm:text-3xl font-bold text-gray-800 inline-block w-full"
                  style={{
                    fontFamily: 'Alexandria, sans-serif',
                    lineHeight: '1.2',
                    minWidth: 'fit-content',
                    background: 'linear-gradient(to right, transparent 0%, transparent 100%), linear-gradient(to right, #3B82F6, #2563EB) 0% 100% / 100% 3px no-repeat'
                  }}
                >
                  مقالات
                </h2>
              </div>

              {posts.length > 0 && (
                <div className="flex overflow-x-auto space-x-4 rtl:space-x-reverse pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-purple-100">
                  {posts.slice(0, 8).map((post, index) => (
                    <Link key={post.id} href={`/post/${post.slug}`} className="block">
                      <article
                        className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0 w-64 sm:w-72 cursor-pointer"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <div className="relative h-40 sm:h-48 overflow-hidden">
                          {post.featured_image ? (
                            <img
                              src={getImageUrl(post.featured_image)}
                              alt={post.title_ar || post.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">
                                {index + 1}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          <div className="absolute top-3 right-3">
                            <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-lg">
                              {getCategoryName(post.category_id)}
                            </span>
                          </div>

                        </div>
                        <div className="p-4">
                          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 hover:text-purple-600 transition-colors leading-tight">
                            {post.title_ar || post.title}
                          </h3>
                          {(post.content_ar || post.content) && (
                            <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                              {truncateText(
                                (post.content_ar || post.content).replace(
                                  /<[^>]*>/g,
                                  "",
                                ),
                                50,
                              )}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <FiCalendar
                                size={10}
                                className="ml-1 rtl:ml-0 rtl:mr-1"
                              />
                              {getRelativeTime(post.created_at)}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* بالفيديو Section */}
            <section className="mb-24">
              <div className="mb-6 sm:mb-8 text-right">
                <h2 
                  className="text-2xl sm:text-3xl font-bold text-gray-800 inline-block w-full"
                  style={{
                    fontFamily: 'Alexandria, sans-serif',
                    lineHeight: '1.2',
                    minWidth: 'fit-content',
                    background: 'linear-gradient(to right, transparent 0%, transparent 100%), linear-gradient(to right, #3B82F6, #2563EB) 0% 100% / 100% 3px no-repeat'
                  }}
                >
                  بالفيديو
                </h2>
              </div>

              {videoLoading ? (
                <div className="flex overflow-x-auto space-x-4 rtl:space-x-reverse pb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-64 sm:w-72">
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                        <div className="h-40 sm:h-48 bg-gray-300"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : videoPosts.length > 0 ? (
                <div className="flex overflow-x-auto space-x-4 rtl:space-x-reverse pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100">
                  {videoPosts.map((post, index) => (
                    <Link key={post.id} href={`/post/${post.slug}`} className="block">
                      <article
                        className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0 w-64 sm:w-72 cursor-pointer"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <div className="relative h-40 sm:h-48 overflow-hidden">
                          {post.featured_image ? (
                            <img
                              src={getImageUrl(post.featured_image)}
                              alt={post.title_ar || post.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">
                                {index + 1}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          
                          {/* Video Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg hover:bg-white transition-all duration-300">
                              <FiPlay className="text-green-600 text-3xl" />
                            </div>
                          </div>
                          
                          <div className="absolute top-3 right-3">
                            <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg">
                              {getCategoryName(post.category_id)}
                            </span>
                          </div>

                        </div>
                        <div className="p-4">
                          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 hover:text-green-600 transition-colors leading-tight">
                            {post.title_ar || post.title}
                          </h3>
                          {(post.content_ar || post.content) && (
                            <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                              {truncateText(
                                (post.content_ar || post.content).replace(
                                  /<[^>]*>/g,
                                  "",
                                ),
                                50,
                              )}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <FiCalendar
                                size={10}
                                className="ml-1 rtl:ml-0 rtl:mr-1"
                              />
                              {getRelativeTime(post.created_at)}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white rounded-xl shadow-lg p-8 mx-auto max-w-md">
                    <div className="text-gray-400 mb-4">
                      <FiPlay className="text-4xl mx-auto" />
                    </div>
                    <p className="text-gray-600 text-lg font-medium">
                      لا يوجد مقاطع فيديو متاحة حالياً
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* الأخبار المميزة Section */}
            <section className="mb-24">
              <div className="mb-6 sm:mb-8 text-right">
                <h2 
                  className="text-2xl sm:text-3xl font-bold text-gray-800 inline-block w-full"
                  style={{
                    fontFamily: 'Alexandria, sans-serif',
                    lineHeight: '1.2',
                    minWidth: 'fit-content',
                    background: 'linear-gradient(to right, transparent 0%, transparent 100%), linear-gradient(to right, #3B82F6, #2563EB) 0% 100% / 100% 3px no-repeat'
                  }}
                >
                  الأخبار المميزة
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
                <div className="lg:col-span-9">
                  {featuredPosts.length > 0 ? (
                    <div className="featured-grid">
                      {featuredPosts.map((post, index) => (
                        <Link key={post.id} href={`/post/${post.slug}`} className="block">
                          <article
                            className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 aspect-square flex flex-col cursor-pointer"
                          >
                            <div className="relative flex-1 overflow-hidden">
                              {post.featured_image ? (
                                <img
                                  src={getImageUrl(post.featured_image)}
                                  alt={post.title_ar || post.title}
                                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                  <span className="text-white text-4xl font-bold">
                                    {index + 1}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 right-3">
                                <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg">
                                  {getCategoryName(post.category_id)}
                                </span>
                              </div>

                            </div>
                            <div className="p-4 flex-shrink-0">
                              <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 hover:text-red-600 transition-colors leading-tight">
                                {post.title_ar || post.title}
                              </h3>
                              {(post.content_ar || post.content) && (
                                <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                                  {truncateText(
                                    (post.content_ar || post.content).replace(
                                      /<[^>]*>/g,
                                      "",
                                    ),
                                    50,
                                  )}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <FiCalendar
                                    size={10}
                                    className="ml-1 rtl:ml-0 rtl:mr-1"
                                  />
                                  {getRelativeTime(post.created_at)}
                                </div>
                              </div>
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-white rounded-xl shadow-lg p-8 mx-auto max-w-md">
                        <div className="text-gray-400 mb-4">
                          <FiTrendingUp className="text-4xl mx-auto" />
                        </div>
                        <p className="text-gray-600 text-lg font-medium">
                          لا يوجد الان مواضيع مميزة
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sidebar with Ad */}
                <div className="lg:col-span-3 hidden lg:block">
                  <SidebarTopAd />
                </div>
              </div>
            </section>



            {/* Prayer and Weather Section */}
            <section className="mb-16">
              <div className="info-boxes">
                {/* Prayer Times Box */}
                <PrayerTimes />

                {/* Weather Box */}
                <Weather />
              </div>
            </section>

            {/* Footer Banner Ad */}
            <BottomMainAd />

          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (context) => {
  try {
    // Check if we're on server or client side
    const isServer = typeof window === 'undefined';
    
    // Use production API URL for www.markaba.news
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // For SSR, use internal API calls or direct database access
    // For client-side, use external API URLs
    let baseUrl: string;
    
    if (isServer) {
      // Server-side: use localhost for development, external API for production
      baseUrl = isDevelopment
        ? "https://api.markaba.news"
        : "https://api.markaba.news";
    } else {
      // Client-side: use relative paths or external API
      baseUrl = isDevelopment
        ? "https://api.markaba.news"
        : "https://api.markaba.news";
    }

    console.log(`getInitialProps (${isServer ? 'server' : 'client'}): Fetching data from:`, baseUrl);

    // Fetch posts and categories in parallel
    const postsEndpoint = isDevelopment
      ? `${baseUrl}/api/posts`
      : `${baseUrl}/api/v2/posts`;
    const categoriesEndpoint = isDevelopment
      ? `${baseUrl}/api/categories`
      : `${baseUrl}/api/v2/categories`;

    // Use dynamic import for node-fetch on server side
    let fetchFunction: typeof fetch;
    
    if (isServer && isDevelopment) {
      // For server-side in development, we might need to handle ECONNREFUSED
      // by providing fallback data or using a different approach
      try {
        fetchFunction = fetch;
      } catch {
        // If fetch is not available on server, provide fallback
        console.warn('Fetch not available on server, providing fallback data');
        return {
          props: {
            posts: [],
            categories: [],
            error: null,
          },
        };
      }
    } else {
      fetchFunction = fetch;
    }

    const [postsResponse, categoriesResponse] = await Promise.all([
      fetchFunction(postsEndpoint, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NewsMarkaba-getInitialProps/1.0",
        },
        // Add timeout for server-side requests
        ...(isServer && { signal: AbortSignal.timeout(5000) }),
      }),
      fetchFunction(categoriesEndpoint, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NewsMarkaba-getInitialProps/1.0",
        },
        // Add timeout for server-side requests
        ...(isServer && { signal: AbortSignal.timeout(5000) }),
      }),
    ]);

    console.log(
      "getInitialProps: Posts response status:",
      postsResponse.status,
    );
    console.log(
      "getInitialProps: Categories response status:",
      categoriesResponse.status,
    );

    if (!postsResponse.ok || !categoriesResponse.ok) {
      throw new Error(
        `API Error: Posts ${postsResponse.status}, Categories ${categoriesResponse.status}`,
      );
    }

    const postsData = await postsResponse.json();
    const categoriesData = await categoriesResponse.json();

    console.log(
      "getInitialProps: Posts data structure:",
      postsData.success ? "success" : "failed",
    );
    console.log(
      "getInitialProps: Categories data structure:",
      categoriesData.success ? "success" : "failed",
    );

    // Handle the API response structure correctly
    const posts = postsData.success ? postsData.data?.posts || [] : [];
    const categories = categoriesData.success
      ? categoriesData.data?.categories || []
      : [];

    return {
      props: {
        posts,
        categories,
      },
    };
  } catch (error) {
    console.error("getInitialProps Error fetching homepage data:", error);
    
    // For server-side errors (like ECONNREFUSED), provide fallback
    if (typeof window === 'undefined' && error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        console.warn('Server-side API connection failed, providing fallback data');
        return {
          props: {
            posts: [],
            categories: [],
            error: null, // Don't show error to user for server-side issues
          },
        };
      }
    }
    
    return {
      props: {
        posts: [],
        categories: [],
        error: "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.",
      },
    };
  }
};

export default HomePage;
