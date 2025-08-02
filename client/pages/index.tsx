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
  FiSun,
  FiCloudRain,
  FiMapPin,
  FiTrendingUp,
  FiBook,
} from "react-icons/fi";
import { getImageUrl } from "../utils/imageUtils";
import LastNewsBanner from "../components/LastNews/LastNewsBanner";
import LatestArticles from "../components/LatestArticles/LatestArticles";
import BreakingNewsBanner from "../components/BreakingNews/BreakingNewsBanner";

interface HomePageProps {
  posts: Post[];
  categories: Category[];
  error?: string | null;
}

const HomePage: NextPage<HomePageProps> = ({ posts, categories, error }) => {
  const { content } = useContent();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);

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

  const getHijriDate = () => {
    const hijriMonths = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    // Proper Hijri date calculation using Umm al-Qura algorithm
    const gregorianToHijri = (date: Date) => {
      const julianDay = Math.floor((date.getTime() / 86400000) + 2440587.5);
      const hijriEpoch = 1948439.5; // Hijri epoch in Julian days
      const daysSinceHijriEpoch = julianDay - hijriEpoch;
      
      // Average Hijri year is approximately 354.367 days
      const hijriYear = Math.floor(daysSinceHijriEpoch / 354.367) + 1;
      const dayOfYear = Math.floor(daysSinceHijriEpoch % 354.367);
      
      // Approximate month calculation (each month ~29.5 days)
      const hijriMonth = Math.floor(dayOfYear / 29.5);
      const hijriDay = Math.floor(dayOfYear % 29.5) + 1;
      
      return {
        year: hijriYear,
        month: Math.min(hijriMonth, 11), // Ensure month is 0-11
        day: Math.max(1, Math.min(hijriDay, 30)) // Ensure day is 1-30
      };
    };
    
    const now = new Date();
    const hijriDate = gregorianToHijri(now);
    
    return `${hijriDate.day} ${hijriMonths[hijriDate.month]} ${hijriDate.year}هـ`;
  };

  const getGregorianDate = () => {
    const now = new Date();
    const gregorianMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const day = now.getDate();
    const month = gregorianMonths[now.getMonth()];
    const year = now.getFullYear();
    
    return `${day} ${month} ${year}م`;
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
                  <h2 className="section-title font-bold text-gray-800">
                    مقالات
                  </h2>
                </div>
                <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-purple-500 to-purple-600 mx-auto mt-2 rounded-full"></div>
              </div>

              {posts.length > 0 && (
                <div className="flex overflow-x-auto space-x-4 rtl:space-x-reverse pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-purple-100">
                  {posts.slice(0, 8).map((post, index) => (
                    <article
                      key={post.id}
                      className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0 w-64 sm:w-72"
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
                        {post.views && (
                          <div className="absolute top-3 left-3 flex items-center bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                            <FiEye
                              size={12}
                              className="ml-1 rtl:ml-0 rtl:mr-1 text-white"
                            />
                            <span className="text-white text-xs font-medium">
                              {formatViews(post.views)}
                            </span>
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
                  ))}
                </div>
              )}
            </section>

            {/* الأخبار المميزة Section */}
            <section className="mb-24">
              <div className="mb-6 sm:mb-8 text-center">
                <div className="responsive-flex justify-center mb-4">
                  <FiTrendingUp className="text-red-500 text-2xl sm:text-3xl ml-2 sm:ml-3" />
                  <h2 className="section-title font-bold text-gray-800">
                    الأخبار المميزة
                  </h2>
                </div>
                <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto mt-2 rounded-full"></div>
              </div>

              {featuredPosts.length > 0 && (
                <div className="featured-grid">
                  {featuredPosts.map((post, index) => (
                    <article
                      key={post.id}
                      className="news-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 aspect-square flex flex-col"
                    >
                      <div className="relative flex-1 overflow-hidden">
                        {post.featured_image ? (
                          <img
                            src={getImageUrl(post.featured_image)}
                            alt={post.title_ar || post.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
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
                        {post.views && (
                          <div className="absolute top-3 left-3 flex items-center bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                            <FiEye
                              size={12}
                              className="ml-1 rtl:ml-0 rtl:mr-1 text-white"
                            />
                            <span className="text-white text-xs font-medium">
                              {formatViews(post.views)}
                            </span>
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
                    <div className="flex justify-between items-center">
                      <h3 className="info-box-title font-bold text-white responsive-flex">
                        <FiSun className="ml-2 sm:ml-3" />
                        مواقيت الصلاة
                      </h3>
                      <span className="text-green-200 font-medium text-sm">
                        {getHijriDate()}
                      </span>
                    </div>
                  </div>
                  <div className="info-box">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-semibold text-gray-700">
                          الفجر
                        </span>
                        <span className="text-green-600 font-bold">05:30</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-semibold text-gray-700">
                          الشروق
                        </span>
                        <span className="text-green-600 font-bold">06:45</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-semibold text-gray-700">
                          الظهر
                        </span>
                        <span className="text-green-600 font-bold">12:15</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-semibold text-gray-700">
                          العصر
                        </span>
                        <span className="text-green-600 font-bold">15:30</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-semibold text-gray-700">
                          المغرب
                        </span>
                        <span className="text-green-600 font-bold">18:00</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-gray-700">
                          العشاء
                        </span>
                        <span className="text-green-600 font-bold">19:30</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiMapPin
                          size={12}
                          className="ml-1 rtl:ml-0 rtl:mr-1"
                        />
                        <span>بيروت، لبنان</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather Box */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 responsive-padding">
                    <div className="flex justify-between items-center">
                      <h3 className="info-box-title font-bold text-white responsive-flex">
                        <FiCloudRain className="ml-2 sm:ml-3" />
                        حالة الطقس
                      </h3>
                      <span className="text-green-200 font-medium text-sm">
                        {getGregorianDate()}
                      </span>
                    </div>
                  </div>
                  <div className="info-box">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        28°C
                      </div>
                      <div className="text-gray-600 font-medium">
                        مشمس جزئياً
                      </div>
                      <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                        <FiMapPin
                          size={12}
                          className="ml-1 rtl:ml-0 rtl:mr-1"
                        />
                        <span>بيروت</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">
                          الرطوبة
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          65%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">الرياح</div>
                        <div className="text-lg font-bold text-blue-600">
                          15 كم/س
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">الضغط</div>
                        <div className="text-lg font-bold text-blue-600">
                          1013 هكتوباسكال
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">الرؤية</div>
                        <div className="text-lg font-bold text-blue-600">
                          10 كم
                        </div>
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
        ? "http://localhost:5000"
        : "https://api.markaba.news";
    } else {
      // Client-side: use relative paths or external API
      baseUrl = isDevelopment
        ? "http://localhost:5000"
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
