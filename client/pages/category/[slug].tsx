import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { useContent } from '../../hooks/useContent';
import { usePosts, useCategories } from '../../components/API/hooks';
import { Post, Category } from '../../components/API/types';
import { FiCalendar, FiUser, FiEye, FiArrowRight } from 'react-icons/fi';

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { content } = useContent();
  const { data: categories } = useCategories();
  const { data: posts, loading, error } = usePosts({ category: slug });
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  // Find current category and filter posts
  useEffect(() => {
    if (categories && slug) {
      const categoriesArray = categories?.categories || [];
      const category = categoriesArray.find((cat: Category) => cat.slug === slug);
      setCurrentCategory(category || null);
    }
  }, [categories, slug]);

  useEffect(() => {
    if (posts) {
      const postsArray = posts?.posts || [];
      setFilteredPosts(postsArray);
    }
  }, [posts]);

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

  const categoryName = (content.categories as Record<string, string>)[currentCategory.slug] || currentCategory.name_ar;
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
              <div className="featured-grid">
                {currentPosts.map((post) => (
                  <article key={post.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    {/* Post Image */}
                    {post.featured_image && (
                      <div className="w-full h-48 relative">
                        <img
                          src={post.featured_image}
                          alt={post.title_ar || post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Post Content */}
                    <div className="news-card-content">
                      {/* Category Badge */}
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {categoryName}
                        </span>
                      </div>

                      {/* Post Title */}
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        <Link href={`/post/${post.slug}`} className="hover:text-blue-700 transition-colors">
                          {post.title_ar || post.title}
                        </Link>
                      </h2>

                      {/* Post Excerpt */}
                      {post.excerpt && (
                        <p className="news-card-excerpt">
                          {truncateText(post.excerpt, 120)}
                        </p>
                      )}

                      {/* Post Meta */}
                      <div className="responsive-flex items-center justify-between responsive-text text-gray-500">
                        <div className="responsive-flex items-center space-x-4 rtl:space-x-reverse">
                          <div className="responsive-flex items-center">
                            <FiCalendar size={12} className="ml-1 rtl:ml-0 rtl:mr-1 flex-shrink-0" />
                            {formatDate(post.created_at)}
                          </div>
                          {(post.author_display_name || post.author_name || post.author?.display_name) && (
                            <div className="responsive-flex items-center">
                              <FiUser size={12} className="ml-1 rtl:ml-0 rtl:mr-1 flex-shrink-0" />
                              {post.author_display_name || post.author_name || post.author?.display_name}
                            </div>
                          )}
                        </div>
                        {post.views && (
                          <div className="responsive-flex items-center">
                            <FiEye size={12} className="ml-1 rtl:ml-0 rtl:mr-1 flex-shrink-0" />
                            {post.views}
                          </div>
                        )}
                      </div>

                      {/* Read More Link */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Link
                          href={`/post/${post.slug}`}
                          className="text-blue-600 hover:text-blue-800 responsive-text font-medium responsive-flex items-center touch-target"
                        >
                          {content.homepage.read_more}
                          <FiArrowRight size={14} className="mr-1 rtl:mr-0 rtl:ml-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
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