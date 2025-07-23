'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { useTheme } from '@/context/ThemeContext';
import { Category, Post } from '@/types';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface SitemapPageProps {
  categories: Category[];
  recentPosts: Post[];
}

const SitemapPage: React.FC<SitemapPageProps> = ({ categories, recentPosts }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const mainPages = [
    {
      title: theme.language === 'ar' ? 'الرئيسية' : 'Home',
      href: '/',
      description: theme.language === 'ar' ? 'الصفحة الرئيسية للموقع' : 'Main homepage of the website'
    },
    {
      title: theme.language === 'ar' ? 'الأقسام' : 'Categories',
      href: '/categories',
      description: theme.language === 'ar' ? 'جميع أقسام الأخبار' : 'All news categories'
    },
    {
      title: theme.language === 'ar' ? 'البحث' : 'Search',
      href: '/search',
      description: theme.language === 'ar' ? 'البحث في المقالات والأقسام' : 'Search articles and categories'
    },
    {
      title: theme.language === 'ar' ? 'من نحن' : 'About Us',
      href: '/about',
      description: theme.language === 'ar' ? 'معلومات عن الموقع وفريق العمل' : 'Information about the website and team'
    },
    {
      title: theme.language === 'ar' ? 'تواصل معنا' : 'Contact Us',
      href: '/contact',
      description: theme.language === 'ar' ? 'صفحة التواصل والاستفسارات' : 'Contact and inquiry page'
    }
  ];

  const authPages = [
    {
      title: theme.language === 'ar' ? 'تسجيل الدخول' : 'Login',
      href: '/auth/login',
      description: theme.language === 'ar' ? 'تسجيل دخول المستخدمين' : 'User login page'
    },
    {
      title: theme.language === 'ar' ? 'إنشاء حساب' : 'Register',
      href: '/auth/register',
      description: theme.language === 'ar' ? 'إنشاء حساب جديد' : 'Create new account'
    },
    {
      title: theme.language === 'ar' ? 'نسيت كلمة المرور' : 'Forgot Password',
      href: '/auth/forgot-password',
      description: theme.language === 'ar' ? 'استعادة كلمة المرور' : 'Password recovery'
    }
  ];

  const legalPages = [
    {
      title: theme.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
      href: '/privacy',
      description: theme.language === 'ar' ? 'سياسة حماية البيانات والخصوصية' : 'Data protection and privacy policy'
    },
    {
      title: theme.language === 'ar' ? 'شروط الخدمة' : 'Terms of Service',
      href: '/terms',
      description: theme.language === 'ar' ? 'شروط وأحكام استخدام الموقع' : 'Website terms and conditions'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: theme.language === 'ar' ? 'خريطة الموقع - موقع الأخبار' : 'Sitemap - News Website',
    description: theme.language === 'ar' 
      ? 'خريطة شاملة لجميع صفحات وأقسام موقع الأخبار للتنقل السهل'
      : 'Comprehensive map of all pages and sections of News Website for easy navigation',
    url: typeof window !== 'undefined' ? window.location.href : '',
    mainEntity: {
      '@type': 'SiteNavigationElement',
      name: theme.language === 'ar' ? 'خريطة الموقع' : 'Website Sitemap'
    }
  };

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'خريطة الموقع - موقع الأخبار' : 'Sitemap - News Website'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'خريطة شاملة لجميع صفحات وأقسام موقع الأخبار للتنقل السهل والوصول السريع للمحتوى'
            : 'Comprehensive map of all pages and sections of News Website for easy navigation and quick access to content'
          } 
        />
        <meta 
          name="keywords" 
          content={theme.language === 'ar' 
            ? 'خريطة الموقع، التنقل، صفحات الموقع، أقسام الأخبار'
            : 'sitemap, navigation, website pages, news categories'
          } 
        />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={theme.language === 'ar' ? 'خريطة الموقع - موقع الأخبار' : 'Sitemap - News Website'} 
        />
        <meta 
          property="og:description" 
          content={theme.language === 'ar' 
            ? 'خريطة شاملة لجميع صفحات وأقسام موقع الأخبار للتنقل السهل والوصول السريع للمحتوى'
            : 'Comprehensive map of all pages and sections of News Website for easy navigation and quick access to content'
          } 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content={theme.language === 'ar' ? 'خريطة الموقع - موقع الأخبار' : 'Sitemap - News Website'} 
        />
        <meta 
          name="twitter:description" 
          content={theme.language === 'ar' 
            ? 'خريطة شاملة لجميع صفحات وأقسام موقع الأخبار للتنقل السهل والوصول السريع للمحتوى'
            : 'Comprehensive map of all pages and sections of News Website for easy navigation and quick access to content'
          } 
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">
                {theme.language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">
              {theme.language === 'ar' ? 'خريطة الموقع' : 'Sitemap'}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {theme.language === 'ar' ? 'خريطة الموقع' : 'Sitemap'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {theme.language === 'ar' 
              ? 'دليل شامل لجميع صفحات وأقسام موقعنا للمساعدة في التنقل والوصول السريع للمحتوى المطلوب'
              : 'A comprehensive guide to all pages and sections of our website to help with navigation and quick access to desired content'
            }
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text={theme.language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Main Pages */}
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">1</span>
                </div>
                {theme.language === 'ar' ? 'الصفحات الرئيسية' : 'Main Pages'}
              </h2>
              <div className="space-y-4">
                {mainPages.map((page, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      <Link 
                        href={page.href}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        {page.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {page.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      {page.href}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">2</span>
                </div>
                {theme.language === 'ar' ? 'أقسام الأخبار' : 'News Categories'}
              </h2>
              <div className="space-y-4">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        <Link 
                          href={`/categories/${category.slug}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          {category.name_ar}
                        </Link>
                      </h3>
                      {category.description_ar && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {category.description_ar}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                          /categories/{category.slug}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {category.posts_count} {theme.language === 'ar' ? 'مقال' : 'posts'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {theme.language === 'ar' ? 'لا توجد أقسام متاحة' : 'No categories available'}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Secondary Pages */}
          <div className="space-y-8">
            {/* Authentication Pages */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">3</span>
                </div>
                {theme.language === 'ar' ? 'صفحات المستخدم' : 'User Pages'}
              </h2>
              <div className="space-y-4">
                {authPages.map((page, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      <Link 
                        href={page.href}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        {page.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {page.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      {page.href}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Legal Pages */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">4</span>
                </div>
                {theme.language === 'ar' ? 'الصفحات القانونية' : 'Legal Pages'}
              </h2>
              <div className="space-y-4">
                {legalPages.map((page, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      <Link 
                        href={page.href}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        {page.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {page.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      {page.href}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Posts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">5</span>
                </div>
                {theme.language === 'ar' ? 'أحدث المقالات' : 'Recent Posts'}
              </h2>
              <div className="space-y-4">
                {recentPosts.length > 0 ? (
                  recentPosts.slice(0, 10).map((post) => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        <Link 
                          href={`/posts/${post.slug}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          {post.title_ar}
                        </Link>
                      </h3>
                      {post.excerpt_ar && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                          {post.excerpt_ar}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                          /posts/{post.slug}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(post.created_at).toLocaleDateString(
                            theme.language === 'ar' ? 'ar-SA' : 'en-US'
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {theme.language === 'ar' ? 'لا توجد مقالات متاحة' : 'No posts available'}
                  </div>
                )}
                
                {recentPosts.length > 10 && (
                  <div className="text-center pt-4">
                    <Link 
                      href="/search"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      {theme.language === 'ar' ? 'عرض المزيد من المقالات' : 'View More Posts'}
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {theme.language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {theme.language === 'ar' ? 'تحديث المحتوى' : 'Content Updates'}
              </h3>
              <p className="text-sm">
                {theme.language === 'ar' 
                  ? 'يتم تحديث خريطة الموقع تلقائياً عند إضافة محتوى جديد أو تعديل الصفحات الموجودة.'
                  : 'The sitemap is automatically updated when new content is added or existing pages are modified.'
                }
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {theme.language === 'ar' ? 'مساعدة التنقل' : 'Navigation Help'}
              </h3>
              <p className="text-sm">
                {theme.language === 'ar' 
                  ? 'استخدم هذه الصفحة للعثور بسرعة على المحتوى المطلوب أو لاستكشاف أقسام جديدة في الموقع.'
                  : 'Use this page to quickly find desired content or explore new sections of the website.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Back to Top */}
        <div className="text-center mt-12">
          <a 
            href="#top"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {theme.language === 'ar' ? '↑ العودة إلى الأعلى' : '↑ Back to Top'}
          </a>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch categories
    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000'}/categories`);
    const categoriesData = await categoriesResponse.json();
    
    // Fetch recent posts
    const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://69.62.115.12:5000'}/posts?limit=20&sort=latest`);
    const postsData = await postsResponse.json();

    return {
      props: {
        categories: categoriesData.categories || [],
        recentPosts: postsData.posts || []
      }
    };
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    return {
      props: {
        categories: [],
        recentPosts: []
      }
    };
  }
};

export default SitemapPage;