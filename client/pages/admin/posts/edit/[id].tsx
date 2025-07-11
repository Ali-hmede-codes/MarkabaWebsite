'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiImage, FiEye } from 'react-icons/fi';
import Link from 'next/link';

interface Post {
  id: number;
  title_ar: string;
  content_ar: string;
  excerpt_ar: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  category_id: number;
  meta_description_ar?: string;
  tags?: string;
}

interface Category {
  id: number;
  name_ar: string;
}

const EditPost: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchCategories();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${id}?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPost(data.data);
      } else {
        toast.error('فشل في تحميل المقال');
        router.push('/admin/posts');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('حدث خطأ في تحميل المقال');
      router.push('/admin/posts');
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
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleInputChange = (field: keyof Post, value: string | number | boolean) => {
    if (post) {
      setPost({ ...post, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!post) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('تم حفظ المقال بنجاح');
        router.push('/admin/posts');
      } else {
        toast.error('فشل في حفظ المقال');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('حدث خطأ في حفظ المقال');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">جاري التحميل...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <p className="text-gray-600">المقال غير موجود</p>
          <Link href="/admin/posts">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              العودة إلى المقالات
            </button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/admin/posts">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <FiArrowLeft size={20} />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">تعديل المقال</h1>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiEye className="ml-2" size={16} />
              {previewMode ? 'تعديل' : 'معاينة'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiSave className="ml-2" size={16} />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-6">
            {/* Arabic Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                العنوان *
              </label>
              <input
                type="text"
                value={post.title_ar || ''}
                onChange={(e) => handleInputChange('title_ar', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium text-gray-900"
                dir="rtl"
                placeholder="أدخل عنوان المقال"
                style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف *
              </label>
              <select
                value={post.category_id || ''}
                onChange={(e) => handleInputChange('category_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                <option value="">اختر التصنيف</option>
                {Array.isArray(categories) && categories.map(category => (
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
              <input
                type="url"
                value={post.featured_image || ''}
                onChange={(e) => handleInputChange('featured_image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="رابط الصورة"
              />
            </div>

            </div>

            {/* Arabic Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                المقتطف
              </label>
              <textarea
                value={post.excerpt_ar || ''}
                onChange={(e) => handleInputChange('excerpt_ar', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                dir="rtl"
                placeholder="وصف مختصر للمقال"
                style={{ fontFamily: 'Noto Sans Arabic, sans-serif', lineHeight: '1.8' }}
              />
            </div>

            {/* Arabic Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                المحتوى *
              </label>
              <textarea
                value={post.content_ar || ''}
                onChange={(e) => handleInputChange('content_ar', e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[300px] text-gray-900"
                dir="rtl"
                required
                placeholder="محتوى المقال باللغة العربية"
                style={{ fontFamily: 'Noto Sans Arabic, sans-serif', lineHeight: '1.8', fontSize: '16px' }}
              />
            </div>

            {/* Status Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                حالة المقال
              </label>
              <div className="flex items-center space-x-6 rtl:space-x-reverse">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={post.is_published}
                    onChange={(e) => handleInputChange('is_published', e.target.checked)}
                    className="ml-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  منشور
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={post.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className="ml-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  مميز
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditPost;