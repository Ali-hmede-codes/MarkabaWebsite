'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContent } from '@/hooks/useContent';
import { GetStaticProps } from 'next';
import { Category, Post } from '../components/API/types';
import PostCard from '@/components/Posts/PostCard';
import CategoryCard from '@/components/Categories/CategoryCard';

interface Custom404Props {
  popularPosts: Post[];
  categories: Category[];
}

const Custom404: React.FC<Custom404Props> = ({ popularPosts, categories }) => {
  const content = useContent();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Countdown timer for auto-redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'الصفحة غير موجودة - 404',
    description: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها',
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  if (!content) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <>
      <Head>
        <title>
          الصفحة غير موجودة - 404
        </title>
        <meta 
          name="description" 
          content="الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يمكنك العودة للصفحة الرئيسية أو البحث عن المحتوى المطلوب." 
        />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content="الصفحة غير موجودة - 404" 
        />
        <meta 
          property="og:description" 
          content="الصفحة التي تبحث عنها غير موجودة أو تم نقلها" 
        />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content="الصفحة غير موجودة - 404" 
        />
        <meta 
          name="twitter:description" 
          content="الصفحة التي تبحث عنها غير موجودة أو تم نقلها" 
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Error Section */}
          <div className="text-center mb-16">
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
                <svg 
                  className="w-16 h-16 text-primary-600 dark:text-primary-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </div>
              
              {/* 404 Text */}
              <h1 className="text-8xl md:text-9xl font-bold text-gray-200 dark:text-gray-700 mb-4">
                404
              </h1>
            </div>

            {/* Error Message */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              الصفحة غير موجودة
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر. يمكنك العودة للصفحة الرئيسية أو البحث عن المحتوى المطلوب.
            </p>

            {/* Auto-redirect countdown */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                سيتم توجيهك تلقائياً للصفحة الرئيسية خلال {countdown} ثانية
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                العودة للرئيسية
              </Link>
              
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للخلف
              </button>
              
              <Link
                href="/sitemap"
                className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                خريطة الموقع
              </Link>
            </div>

            {/* Search Form */}
            <div className="max-w-md mx-auto mb-16">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                أو ابحث عن المحتوى
              </h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في المقالات..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Popular Content */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  المقالات الشائعة
                </h3>
                <div className="space-y-4">
                  {popularPosts.slice(0, 5).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      showExcerpt={false}
                      showAuthor={false}
                    />
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/search?sort=popular"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    عرض المزيد من المقالات الشائعة
                  </Link>
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  تصفح الأقسام
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.slice(0, 6).map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                    />
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/categories"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    عرض جميع الأقسام
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              هل تحتاج مساعدة؟
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              إذا كنت تواجه مشكلة في العثور على المحتوى المطلوب، يمكنك التواصل معنا
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                تواصل معنا
              </Link>
              
              <Link
                href="/about"
                className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                من نحن
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    // Fetch popular posts
    const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://markaba.news/api/v2'}/posts?limit=10&sort=popular`);
    const postsData = await postsResponse.json();
    
    // Fetch categories
    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://markaba.news/api/v2'}/categories?limit=8`);
    const categoriesData = await categoriesResponse.json();

    return {
      props: {
        popularPosts: postsData.posts || [],
        categories: categoriesData.categories || []
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching 404 page data:', error);
    return {
      props: {
        popularPosts: [],
        categories: []
      },
      revalidate: 3600
    };
  }
};

export default Custom404;