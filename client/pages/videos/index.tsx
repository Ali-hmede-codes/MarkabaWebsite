'use client';

import React from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { Post, Category } from '../../components/API/types';
import { FiPlay, FiCalendar, FiChevronLeft, FiChevronRight, FiHome } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUtils';
import { useContent } from '../../hooks/useContent';

interface VideosPageProps {
  initialPosts: Post[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
  totalPosts: number;
}

const VideosPage: NextPage<VideosPageProps> = ({ 
  initialPosts, 
  categories, 
  totalPages, 
  currentPage, 
  totalPosts 
}) => {
  const { content } = useContent();
  const posts = initialPosts;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const arabicMonths = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
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
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name_ar : 'عام';
  };

  const handlePageChange = (page: number) => {
    window.location.href = `/videos?page=${page}`;
  };

  return (
    <Layout>
      <Head>
        <title>بالفيديو - أخبار مركبا</title>
        <meta name="description" content="شاهد جميع الأخبار والتقارير المصورة بالفيديو من موقع أخبار مركبا" />
        <meta name="keywords" content="فيديو، أخبار مصورة، تقارير، مركبا، لبنان" />
        <meta property="og:title" content="بالفيديو - أخبار مركبا" />
        <meta property="og:description" content="شاهد جميع الأخبار والتقارير المصورة بالفيديو" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <FiPlay className="text-green-500 text-3xl sm:text-4xl ml-3" />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  بالفيديو
                </h1>
              </div>
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <FiHome />
                العودة للقائمة الرئيسية
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Videos Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="relative h-48 overflow-hidden">
                    {post.featured_image ? (
                      <img
                        src={getImageUrl(post.featured_image)}
                        alt={post.title_ar || post.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <FiPlay className="text-white text-4xl" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    
                    {/* Video Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg hover:bg-white transition-all duration-300">
                        <FiPlay className="text-green-600 text-2xl" />
                      </div>
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg">
                        {getCategoryName(post.category_id)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2 hover:text-green-600 transition-colors leading-tight">
                      <Link href={`/post/${post.slug}`}>
                        {post.title_ar || post.title}
                      </Link>
                    </h3>
                    
                    {(post.excerpt_ar || post.content_ar || post.content) && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {truncateText(
                          (post.excerpt_ar || post.content_ar || post.content).replace(/<[^>]*>/g, ''),
                          100
                        )}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar size={14} className="ml-1 rtl:ml-0 rtl:mr-1" />
                        <span>{getRelativeTime(post.created_at)}</span>
                      </div>
                      

                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-lg p-12 mx-auto max-w-md">
                <div className="text-gray-400 mb-4">
                  <FiPlay className="mx-auto text-6xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  لا توجد فيديوهات
                </h3>
                <p className="text-gray-600">
                  لم يتم العثور على أي فيديوهات تطابق معايير البحث
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FiChevronRight />
                السابق
              </button>
              
              <div className="flex space-x-1 rtl:space-x-reverse">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                التالي
                <FiChevronLeft />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<VideosPageProps> = async (context) => {
  try {
    const { query } = context;
    const page = parseInt(query.page as string) || 1;
    const limit = 12;
    const search = query.search as string || '';
    const category = query.category as string || '';
    const sort_by = query.sort_by as string || 'created_at';
    const sort_order = query.sort_order as string || 'desc';

    // Build API URL
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? 'https://api.markaba.news' : 'https://api.markaba.news';
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
      sort_by,
      sort_order
    });

    // Fetch video posts and categories in parallel
    const [videosResponse, categoriesResponse] = await Promise.all([
      fetch(`${baseUrl}/api/posts/videos?${params}`),
      fetch(`${baseUrl}/api/categories`)
    ]);

    if (!videosResponse.ok || !categoriesResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const videosData = await videosResponse.json();
    const categoriesData = await categoriesResponse.json();

    const posts = videosData.success ? videosData.data?.posts || [] : [];
    const categories = categoriesData.success ? categoriesData.data?.categories || [] : [];
    const totalPosts = videosData.data?.pagination?.total || 0;
    const totalPages = videosData.data?.pagination?.pages || 1;

    return {
      props: {
        initialPosts: posts,
        categories,
        totalPages,
        currentPage: page,
        totalPosts
      }
    };
  } catch (error) {
    console.error('Error fetching videos page data:', error);
    
    return {
      props: {
        initialPosts: [],
        categories: [],
        totalPages: 1,
        currentPage: 1,
        totalPosts: 0
      }
    };
  }
};

export default VideosPage;