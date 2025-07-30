import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { useContent } from '../../hooks/useContent';
import { usePosts, useCategories, useAPI } from '../../components/API/hooks';
import { Post, Category } from '../../components/API/types';
import { FiCalendar, FiUser, FiEye, FiArrowRight } from 'react-icons/fi';
import { generateSizes } from '../../utils/imageUtils';
import OptimizedImage from '../../components/UI/OptimizedImage';

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
  const postsPerPage = 12;

  // Custom API call for posts with proper slug handling
  const { execute: fetchPosts } = useAPI<import('../../components/API/types').PostsResponse>('/posts', {
    immediate: false,
  });

  // Find current category and filter posts
  useEffect(() => {
    if (categories && slug) {
      const categoriesArray = categories?.categories || [];
      const category = categoriesArray.find((cat: Category) => cat.slug === slug);
      setCurrentCategory(category || null);
    }
  }, [categories, slug]);

  // Fetch posts when slug is available
  useEffect(() => {
    if (slug && typeof slug === 'string') {
      setLoading(true);
      setError(null);
      fetchPosts(undefined, { category: slug })
        .then((response) => {
          if (response?.success && response.data) {
            const postsArray = response.data?.posts || [];
            setFilteredPosts(postsArray);
          } else {
            setError(response?.error || 'Failed to fetch posts');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch posts');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [slug, fetchPosts]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

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
                {filteredPosts.length} مقال متاح
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="container mx-auto responsive-padding py-6 sm:py-8">
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
                {currentPosts.map((post) => (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="group cursor-pointer">
                      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        {/* Background Image */}
                        <OptimizedImage
                          src={post.featured_image || '/images/placeholder.jpg'}
                          alt={post.title_ar || post.title}
                          fill
                          className="rounded-xl"
                          sizes={generateSizes({ mobile: '100vw', tablet: '50vw', desktop: '33vw' })}
                          placeholder="blur"
                          quality={80}
                          objectFit="cover"
                        />
                        
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
                            {post.views && (
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                <FiEye size={14} className="flex-shrink-0" />
                                <span>{post.views}</span>
                              </div>
                            )}
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
                <div className="mt-8 sm:mt-12 responsive-flex justify-center">
                  <nav className="responsive-flex items-center space-x-2 rtl:space-x-reverse">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      السابق
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-2 sm:px-3 py-2 rounded-md responsive-text font-medium touch-target ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      التالي
                    </button>
                  </nav>
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