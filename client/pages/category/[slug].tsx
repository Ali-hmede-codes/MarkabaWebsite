import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { useContent } from '../../hooks/useContent';
import { usePosts, useCategories, useAPI } from '../../components/API/hooks';
import { Post, Category } from '../../components/API/types';
import { FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUtils';

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { content } = useContent();
  const { data: categories } = useCategories();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 12;

  // Custom API call for category with posts
  const fetchCategoryPosts = async (page: number = 1) => {
    if (!slug || typeof slug !== 'string') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v2/categories/${slug}?include_posts=true&posts_page=${page}&posts_limit=${postsPerPage}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setCurrentCategory(data.data);
        setFilteredPosts(data.data.posts || []);
        setTotalPages(data.data.posts_pagination?.pages || 1);
        setTotalPosts(data.data.posts_pagination?.total || 0);
      } else {
        setError(data.error || 'Failed to fetch category posts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch category posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch category and posts when slug changes
  useEffect(() => {
    if (slug && typeof slug === 'string') {
      setCurrentPage(1); // Reset to first page when category changes
      fetchCategoryPosts(1);
    }
  }, [slug]);

  // Fetch posts when page changes
  useEffect(() => {
    if (slug && typeof slug === 'string' && currentPage > 1) {
      fetchCategoryPosts(currentPage);
    }
  }, [currentPage]);

  // Use posts directly from server (already paginated)
  const currentPosts = filteredPosts;

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
  const pageTitle = categoryName;
  const pageDescription = currentCategory.description_ar 
    ? currentCategory.description_ar
    : `تصفح جميع أخبار ${categoryName} على ${content.site.name}`;

  return (
    <Layout
      pageType="category"
      pageData={{ slug: currentCategory.slug }}
      seo={{
        title: pageTitle,
        description: pageDescription,
        keywords: [
          'أخبار', 
          categoryName, 
          'مقالات', 
          content.site.name
        ],
        url: `https://markaba.news/category/${currentCategory.slug}`,
        image: currentCategory.image ? getImageUrl(currentCategory.image) : 'https://markaba.news/images/og-image.jpg',
        type: 'website',
        structuredData: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": categoryName,
          "description": pageDescription,
          "url": `https://markaba.news/category/${currentCategory.slug}`,
          "mainEntity": {
            "@type": "ItemList",
            "name": `أخبار ${categoryName}`,
            "description": pageDescription,
            "numberOfItems": totalPosts
          },
          "publisher": {
            "@type": "Organization",
            "name": "مـركـبـا - الـمـنـصـة الاخـبـاريـة",
            "logo": {
              "@type": "ImageObject",
              "url": "https://markaba.news/images/logo_new.png"
            }
          },
          "inLanguage": "ar"
        }
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
        <div className="bg-gray-100 py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 inline-block">
                {categoryName}
                <span className="text-sm text-gray-500 font-normal mr-3">
                  ({totalPosts} مقال)
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {currentPosts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                {content.category.no_posts_found}
              </h3>
              <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">
                لا توجد مقالات في قسم {categoryName} في الوقت الحالي
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                {content.navigation.home}
                <FiArrowRight className="mr-2 rtl:mr-0 rtl:ml-2" size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentPosts.map((post) => (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="group cursor-pointer">
                      <div className="relative w-full h-48 sm:h-56 lg:h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
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
                        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                          {/* Category Badge */}
                          <div className="mb-2 sm:mb-3">
                            <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                              {categoryName}
                            </span>
                          </div>
                          
                          {/* Post Title */}
                          <h2 className="text-white font-bold text-sm sm:text-lg leading-tight mb-2 group-hover:text-blue-200 transition-colors duration-300">
                            {truncateText(post.title_ar || post.title, 80)}
                          </h2>
                          
                          {/* Time and Meta */}
                          <div className="flex items-center justify-between text-white/80 text-xs sm:text-sm">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <FiCalendar size={12} className="flex-shrink-0 sm:w-4 sm:h-4" />
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
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse mt-8 sm:mt-12">
                  {/* Previous Button */}
                  <button
                    onClick={() => {
                      const newPage = Math.max(currentPage - 1, 1);
                      setCurrentPage(newPage);
                    }}
                    disabled={currentPage === 1}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[120px] justify-center ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium">السابق</span>
                  </button>

                  {/* Page Numbers - Hidden on mobile, shown on larger screens */}
                  <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 rounded-lg transition-all duration-200 font-medium ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md hover:shadow-lg'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile Page Indicator */}
                  <div className="flex sm:hidden items-center px-4 py-2 bg-white rounded-lg shadow-md">
                    <span className="text-sm font-medium text-gray-700">
                      صفحة {currentPage} من {totalPages}
                    </span>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => {
                      const newPage = Math.min(currentPage + 1, totalPages);
                      setCurrentPage(newPage);
                    }}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[120px] justify-center ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium">التالي</span>
                  </button>
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