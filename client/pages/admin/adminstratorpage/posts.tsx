'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiStar, 
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiImage,
  FiCalendar,
  FiFileText
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Post {
  id: number;
  title_ar: string;
  content_ar: string;
  excerpt_ar: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  views: number;
  category_id: number;
  category_name_ar: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name_ar: string;
}

const PostsManagement: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory, statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts || []);
        setTotalPages(Math.ceil((data.data.total || 0) / 10));
      } else {
        toast.error('فشل في تحميل المقالات');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('حدث خطأ في تحميل المقالات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        console.warn('Categories data is not an array:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      toast.error('فشل في تحميل التصنيفات');
    }
  };

  const togglePublishStatus = async (post: Post) => {
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          is_published: !post.is_published
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, is_published: !p.is_published }
            : p
        ));
        toast.success(
          post.is_published ? 'تم إلغاء نشر المقال' : 'تم نشر المقال'
        );
      } else {
        toast.error('فشل في تحديث حالة النشر');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('حدث خطأ في تحديث حالة النشر');
    }
  };

  const toggleFeaturedStatus = async (post: Post) => {
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          is_featured: !post.is_featured
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, is_featured: !p.is_featured }
            : p
        ));
        toast.success(
          post.is_featured ? 'تم إلغاء تمييز المقال' : 'تم تمييز المقال'
        );
      } else {
        toast.error('فشل في تحديث حالة التمييز');
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('حدث خطأ في تحديث حالة التمييز');
    }
  };

  const deletePost = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/posts/${postToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.filter(p => p.id !== postToDelete.id));
        toast.success('تم حذف المقال بنجاح');
        setShowDeleteModal(false);
        setPostToDelete(null);
      } else {
        toast.error('فشل في حذف المقال');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('حدث خطأ في حذف المقال');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title_ar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.category_id.toString() === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && post.is_published) ||
                         (statusFilter === 'draft' && !post.is_published) ||
                         (statusFilter === 'featured' && post.is_featured);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AdminLayout title="إدارة المقالات" description="إنشاء وتعديل وحذف المقالات">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المقالات</h1>
            <p className="text-gray-600 mt-1">إنشاء وتعديل وحذف المقالات</p>
          </div>
          <Link href="/admin/administratorpage/posts/new">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 rtl:space-x-reverse transition-colors">
              <FiPlus size={20} />
              <span>مقال جديد</span>
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="البحث في المقالات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="rtl"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع التصنيفات</option>
              {Array.isArray(categories) && categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name_ar}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="featured">مميز</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <FiFilter className="ml-2" size={16} />
              <span>{filteredPosts.length} مقال</span>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">جاري التحميل...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-600 mt-2">لا توجد مقالات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المقال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التصنيف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المشاهدات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {post.featured_image && (
                            <div className="flex-shrink-0 h-12 w-12 ml-4">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={post.featured_image}
                                alt={post.title_ar}
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {post.title_ar}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {post.excerpt_ar}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.category_name_ar}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.is_published ? 'منشور' : 'مسودة'}
                          </span>
                          {post.is_featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              مميز
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiEye className="ml-1 text-gray-400" size={14} />
                          {post.views?.toLocaleString('ar-SA') || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="ml-1 text-gray-400" size={14} />
                          {formatDate(post.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {/* Toggle Publish */}
                          <button
                            onClick={() => togglePublishStatus(post)}
                            className={`p-2 rounded-lg transition-colors ${
                              post.is_published
                                ? 'text-green-600 hover:bg-green-100'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={post.is_published ? 'إلغاء النشر' : 'نشر'}
                          >
                            {post.is_published ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                          </button>

                          {/* Toggle Featured */}
                          <button
                            onClick={() => toggleFeaturedStatus(post)}
                            className={`p-2 rounded-lg transition-colors ${
                              post.is_featured
                                ? 'text-yellow-600 hover:bg-yellow-100'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={post.is_featured ? 'إلغاء التمييز' : 'تمييز'}
                          >
                            <FiStar size={16} />
                          </button>

                          {/* Edit */}
                          <Link href={`/admin/administratorpage/posts/edit/${post.id}`}>
                            <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="تعديل">
                              <FiEdit size={16} />
                            </button>
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setPostToDelete(post);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-3 border rounded-lg">
            <div className="text-sm text-gray-700">
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && postToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      حذف المقال
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        هل أنت متأكد من حذف المقال "{postToDelete.title_ar}"؟ لا يمكن التراجع عن هذا الإجراء.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={deletePost}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  حذف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PostsManagement;
