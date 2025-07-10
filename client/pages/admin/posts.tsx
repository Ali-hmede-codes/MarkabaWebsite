'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import AdminNav from '../../components/admin/AdminNav';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiImage, FiSave, FiX } from 'react-icons/fi';

interface Post {
  id: number;
  title_ar: string;
  content_ar: string;
  excerpt_ar: string;
  slug: string;
  category_id: number;
  featured_image?: string;
  is_featured: boolean;
  is_published: boolean;
  views: number;
  created_at: string;
  category_name_ar?: string;
}

interface Category {
  id: number;
  name_ar: string;
  slug: string;
}

const AdminPosts: React.FC = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    content_ar: '',
    excerpt_ar: '',
    category_id: '',
    featured_image: '',
    is_featured: false,
    is_published: false,
    tags: ''
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      if (data.success) {
        setPosts(data.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', 'post');

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, featured_image: data.data.file_url }));
        alert('تم رفع الصورة بنجاح!');
      } else {
        alert('فشل في رفع الصورة: ' + data.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title_ar.trim() || !formData.content_ar.trim()) {
      alert('يرجى ملء العنوان والمحتوى');
      return;
    }

    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts';
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(editingPost ? 'تم تحديث المقال بنجاح!' : 'تم إنشاء المقال بنجاح!');
        setShowForm(false);
        setEditingPost(null);
        resetForm();
        fetchPosts();
      } else {
        alert('فشل في حفظ المقال: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('حدث خطأ أثناء حفظ المقال');
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title_ar: post.title_ar,
      content_ar: post.content_ar,
      excerpt_ar: post.excerpt_ar || '',
      category_id: post.category_id.toString(),
      featured_image: post.featured_image || '',
      is_featured: post.is_featured,
      is_published: post.is_published,
      tags: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('تم حذف المقال بنجاح!');
        fetchPosts();
      } else {
        alert('فشل في حذف المقال: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('حدث خطأ أثناء حذف المقال');
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: '',
      content_ar: '',
      excerpt_ar: '',
      category_id: '',
      featured_image: '',
      is_featured: false,
      is_published: false,
      tags: ''
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPost(null);
    resetForm();
  };

  return (
    <Layout>
      <Head>
        <title>إدارة المقالات - نيوز مركبة</title>
      </Head>
      
      <AdminNav />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">إدارة المقالات</h1>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlus size={20} />
                مقال جديد
              </button>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingPost ? 'تعديل المقال' : 'إنشاء مقال جديد'}
                    </h2>
                    <button
                      onClick={closeForm}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان *
                      </label>
                      <input
                        type="text"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        dir="rtl"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التصنيف *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">اختر التصنيف</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Featured Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الصورة المميزة
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={uploading}
                        />
                        {uploading && (
                          <div className="text-blue-600 text-sm">جاري رفع الصورة...</div>
                        )}
                        {formData.featured_image && (
                          <div className="mt-2">
                            <img
                              src={formData.featured_image}
                              alt="Featured"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <p className="text-sm text-gray-600 mt-1">
                              مسار الصورة: {formData.featured_image}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المقتطف
                      </label>
                      <textarea
                        value={formData.excerpt_ar}
                        onChange={(e) => setFormData({ ...formData, excerpt_ar: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="rtl"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المحتوى *
                      </label>
                      <textarea
                        value={formData.content_ar}
                        onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        dir="rtl"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الكلمات المفتاحية (مفصولة بفواصل)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="مثال: سياسة, اقتصاد, رياضة"
                        dir="rtl"
                      />
                    </div>

                    {/* Options */}
                    <div className="flex gap-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="mr-2"
                        />
                        مقال مميز
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_published}
                          onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                          className="mr-2"
                        />
                        نشر المقال
                      </label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiSave size={20} />
                        {editingPost ? 'تحديث المقال' : 'حفظ المقال'}
                      </button>
                      <button
                        type="button"
                        onClick={closeForm}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Posts List */}
          <div className="bg-white rounded-lg shadow-sm">
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-gray-500">جاري تحميل المقالات...</div>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500">لا توجد مقالات حتى الآن</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        العنوان
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
                        تاريخ الإنشاء
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {post.featured_image && (
                              <img
                                src={post.featured_image}
                                alt={post.title_ar}
                                className="w-12 h-12 object-cover rounded-lg mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {post.title_ar}
                              </div>
                              {post.excerpt_ar && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {post.excerpt_ar}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {post.category_name_ar || 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {post.is_published ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                منشور
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                مسودة
                              </span>
                            )}
                            {post.is_featured && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                مميز
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {post.views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(post.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/post/${post.id}/${post.slug}`, '_blank')}
                              className="text-blue-600 hover:text-blue-900"
                              title="عرض"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(post)}
                              className="text-green-600 hover:text-green-900"
                              title="تعديل"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <FiTrash2 size={18} />
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

          {/* Image Storage Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">معلومات تخزين الصور</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>مجلد تخزين صور المقالات:</strong> /uploads/posts/[post_id]/images/</p>
              <p><strong>مجلد تخزين الصور العامة:</strong> /uploads/general/</p>
              <p><strong>أنواع الملفات المدعومة:</strong> JPG, PNG, GIF, WebP</p>
              <p><strong>الحد الأقصى لحجم الملف:</strong> 10 ميجابايت</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPosts;