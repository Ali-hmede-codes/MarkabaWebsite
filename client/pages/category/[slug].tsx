import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { useContent } from '../../hooks/useContent';
import { useCategories } from '../../components/API/hooks';
import { Post, Category } from '../../components/API/types';
import { FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUtils';

interface CategoryPostsResponse {
  success: boolean;
  data: {
    id: number;
    name_ar: string;
    slug: string;
    description_ar?: string;
    color: string;
    post_count: number;
    posts: Post[];
    posts_pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { slug, page } = router.query;
  const { content } = useContent();
  const { data: categories } = useCategories();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const postsPerPage = 12;
  const currentPage = parseInt(page as string) || 1;

  // Fetch category data with posts using server-side pagination
  const fetchCategoryPosts = async (pageNum: number) => {
    if (!slug || typeof slug !== 'string') return;
    
    try {
      setPageLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/categories/${slug}?include_posts=true&posts_page=${pageNum}&posts_limit=${postsPerPage}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch category data');
      }
      
      const data: CategoryPostsResponse = await response.json();
      
      if (data.success && data.data) {
        // Create a proper Category object with required properties
        const categoryData: Category = {
          id: data.data.id,
          name_ar: data.data.name_ar,
          slug: data.data.slug,
          description_ar: data.data.description_ar,
          color: data.data.color,
          is_active: true, // Default value
          sort_order: 0, // Default value
          posts_count: data.data.post_count,
          created_at: new Date().toISOString(), // Default value
          updated_at: new Date().toISOString() // Default value
        };
        setCurrentCategory(categoryData);
        setPosts(data.data.posts || []);
        setPagination(data.data.posts_pagination);
      } else {
        setError(data.error || 'Failed to fetch category data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category data');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchCategoryPosts(currentPage);
    }
  }, [slug, currentPage]);

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || !pagination) return;
    
    // Update URL with new page parameter
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: newPage }
    }, undefined, { shallow: true });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `منذ ${diffInWeeks} أسبوع`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `منذ ${diffInMonths} شهر`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `منذ ${diffInYears} سنة`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  if (!content) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="mr-3 text-gray-600">{content.common.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">القسم غير موجود</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryName = currentCategory.name_ar;
  const pageTitle = `${content.category.posts_in} ${categoryName} - ${content.site.name}`;
  const pageDescription = `تصفح جميع أخبار ${categoryName} على ${content.site.name}`;

  return (
    <Layout
      title={pageTitle}
      description={pageDescription}
      seo={{
        title: pageTitle,
        description: pageDescription,
        type: 'website',
        section: categoryName,
        keywords: ['أخبار', categoryName, 'مقالات', content.site.name]
      }}
    >
      <div className="bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                {content.navigation.home}
              </Link>
              <FiArrowRight className="text-gray-400" size={16} />
              <span className="text-gray-600">{categoryName}</span>
            </nav>
          </div>
        </div>

        {/* Category Header */}
        <div className="bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                أخبار {categoryName}
              </h1>
              <p className="text-gray-700 max-w-2xl mx-auto mb-4">
                {pageDescription}
              </p>
              <div className="text-sm text-gray-600 bg-white px-4 py-1 rounded inline-block">
                {pagination?.total || 0} مقال متاح
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="container mx-auto responsive-padding py-6 sm:py-8">
          {pageLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">جاري تحميل المقالات...</span>
            </div>
          )}
          
          {!pageLoading && posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                {content.category.no_posts_found}
              </h3>
              <p className="text-gray-500 mb-6 responsive-text">
                لا توجد مقالات في قسم {categoryName} في الوقت الحالي
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors responsive-text touch-target"
              >
                {content.navigation.home}
                <FiArrowRight className="mr-2 rtl:mr-0 rtl:ml-2" size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="group cursor-pointer">
                      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <img
                            src={getImageUrl(post.featured_image || '/images/placeholder.jpg')}
                            alt={post.title_ar || post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        
                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                          {/* Category Badge */}
                          <div className="mb-3">
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                              {categoryName}
                            </span>
                          </div>
                          
                          {/* Post Title */}
                          <h2 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-blue-200 transition-colors duration-300">
                            {truncateText(post.title_ar || post.title, 80)}
                          </h2>
                          
                          {/* Time and Meta */}
                          <div className="flex items-center justify-between text-white/80 text-sm">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <FiCalendar size={14} className="flex-shrink-0" />
                              <span>{getTimeAgo(post.created_at)}</span>
                            </div>

                          </div>
                        </div>
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 sm:mt-12 responsive-flex justify-center">
                  <nav className="responsive-flex items-center space-x-2 rtl:space-x-reverse">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || pageLoading}
                      className={`px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target ${
                        currentPage === 1 || pageLoading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      السابق
                    </button>

                    {/* Page Numbers */}
                    {(() => {
                      const totalPages = pagination.pages;
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }
                      
                      const pages = [];
                      
                      // First page
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            disabled={pageLoading}
                            className="px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                          );
                        }
                      }
                      
                      // Visible pages
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            disabled={pageLoading}
                            className={`px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target disabled:opacity-50 ${
                              currentPage === i
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      // Last page
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            disabled={pageLoading}
                            className="px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages || pageLoading}
                      className={`px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target ${
                        currentPage === pagination.pages || pageLoading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      التالي
                    </button>
                  </nav>
                  
                  {/* Pagination Info */}
                  <div className="mt-4 text-center text-sm text-gray-600">
                    صفحة {currentPage} من {pagination.pages} ({pagination.total} مقال)
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;