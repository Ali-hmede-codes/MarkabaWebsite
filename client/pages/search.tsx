'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import PostCard from '../components/Posts/PostCard';
import { Post, LastNews } from '../components/API/types';
import { FiSearch, FiFilter, FiX, FiClock, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { getImageUrl } from '../utils/imageUtils';
import Image from 'next/image';

interface SearchResults {
  posts: Post[];
  lastNews: LastNews[];
  total: number;
  page: number;
  limit: number;
  query: string;
}

const SearchPage: React.FC = () => {
  const router = useRouter();
  const { q, type = 'all', page = '1' } = router.query;
  
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('posts');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  // Update local state when router query changes
  useEffect(() => {
    if (q && typeof q === 'string') {
      setSearchQuery(q);
    }
    if (type && typeof type === 'string') {
      setSearchType(type);
    }
    if (page && typeof page === 'string') {
      setCurrentPage(parseInt(page));
    }
  }, [q, type, page]);

  // Perform search when query parameters change
  useEffect(() => {
    if (q && typeof q === 'string' && q.trim()) {
      performSearch(q, type as string, page as string);
    }
  }, [q, type, page]);

  const performSearch = async (query: string, searchType: string = 'all', pageNum: string = '1') => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}&page=${pageNum}&limit=12`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        setError(data.message || 'حدث خطأ أثناء البحث');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}&page=1`);
    }
  };

  const handleTypeChange = (newType: string) => {
    setSearchType(newType);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${newType}&page=1`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}&page=${newPage}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    router.push('/search');
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
    return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
  };

  const totalResults = searchResults ? searchResults.total : 0;
  const totalPages = searchResults ? Math.ceil(totalResults / searchResults.limit) : 0;

  return (
    <Layout>
      <Head>
        <title>
          {searchQuery ? `نتائج البحث عن "${searchQuery}" - مركبا` : 'البحث - مركبا'}
        </title>
        <meta 
          name="description" 
          content={searchQuery ? `نتائج البحث عن "${searchQuery}" في موقع مركبا للأخبار` : 'ابحث في أخبار ومقالات موقع مركبا'}
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Return Button */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-black hover:text-gray-700 transition-colors">
              <FiArrowLeft className="text-lg" />
              <span className="font-medium">العودة إلى الصفحة الرئيسية</span>
            </Link>
          </div>

          {/* Search Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <FiSearch className="text-2xl text-black dark:text-white" />
              <h1 className="text-2xl font-bold text-black dark:text-white">
                البحث في الموقع
              </h1>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في المقالات والأخبار..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                  <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-200 text-black border border-gray-300 rounded-lg transition-colors font-medium"
                >
                  {loading ? 'جاري البحث...' : 'بحث'}
                </button>
              </div>
            </form>

            {/* Removed filter buttons since we're only showing posts */}
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  <p className="mt-4 text-black dark:text-gray-300">جاري البحث...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : searchResults ? (
                <div>
                  {/* Results Summary */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
                      نتائج البحث عن "{searchResults.query}"
                    </h2>
                    <p className="text-black dark:text-gray-300">
                      تم العثور على {totalResults} نتيجة
                    </p>
                  </div>

                  {/* Results Content */}
                  {totalResults > 0 ? (
                    <div className="space-y-8">
                      {/* Posts Results */}
                      {searchResults.posts.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                            <FiCalendar className="text-black dark:text-white" />
                            المقالات ({searchResults.posts.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.posts.map((post) => (
                              <PostCard
                                key={post.id}
                                post={post}
                                showExcerpt={true}
                                showAuthor={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Last News Results */}
                      {searchResults.lastNews.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                            <FiClock className="text-black dark:text-white" />
                            آخر الأخبار ({searchResults.lastNews.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.lastNews.map((news) => (
                              <div key={news.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {news.featured_image && (
                                  <div className="relative h-48">
                                    <Image
                                      src={getImageUrl(news.featured_image)}
                                      alt={news.title_ar || news.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="p-4">
                                  <h4 className="font-semibold text-black dark:text-white mb-2 line-clamp-2">
                                    <Link href={`/last-news/${news.slug}`} className="hover:text-gray-600 dark:hover:text-gray-400">
                                      {news.title_ar || news.title}
                                    </Link>
                                  </h4>
                                  {(news.excerpt_ar || news.excerpt) && (
                                    <p className="text-black dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                      {news.excerpt_ar || news.excerpt}
                                    </p>
                                  )}
                                  <div className="flex items-center text-xs text-black dark:text-gray-400">
                                    <FiClock className="ml-1" />
                                    <span>{getRelativeTime(news.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1}
                              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-black dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              السابق
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-2 rounded-lg ${
                                    currentPage === pageNum
                                      ? 'bg-black text-white'
                                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-black dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= totalPages}
                              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-black dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              التالي
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiSearch className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                        لم يتم العثور على نتائج
                      </h3>
                      <p className="text-black dark:text-gray-300 mb-6">
                        لم نتمكن من العثور على أي نتائج تطابق بحثك عن "{searchResults.query}"
                      </p>
                      <div className="space-y-2 text-sm text-black dark:text-gray-400">
                        <p>• تأكد من صحة الكلمات المكتوبة</p>
                        <p>• جرب كلمات مختلفة أو أكثر عمومية</p>
                        <p>• تأكد من عدم وجود أخطاء إملائية</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Default State */}
          {!searchQuery && (
            <div className="text-center py-16">
              <FiSearch className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-6" />
              <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                ابحث في موقع مركبا
              </h2>
              <p className="text-black dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                ابحث في آلاف المقالات والأخبار للعثور على المحتوى الذي تبحث عنه
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <FiCalendar className="text-3xl text-black dark:text-white mb-4 mx-auto" />
                  <h3 className="font-semibold text-black dark:text-white mb-2">المقالات</h3>
                  <p className="text-black dark:text-gray-300 text-sm">ابحث في مقالات الموقع والتحليلات</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <FiClock className="text-3xl text-black dark:text-white mb-4 mx-auto" />
                  <h3 className="font-semibold text-black dark:text-white mb-2">آخر الأخبار</h3>
                  <p className="text-black dark:text-gray-300 text-sm">ابحث في الأخبار العاجلة والحديثة</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <FiFilter className="text-3xl text-black dark:text-white mb-4 mx-auto" />
                  <h3 className="font-semibold text-black dark:text-white mb-2">بحث متقدم</h3>
                  <p className="text-black dark:text-gray-300 text-sm">استخدم الفلاتر للبحث المتخصص</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;