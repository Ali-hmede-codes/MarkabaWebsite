'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiImage, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';

interface PostForm {
  title_ar: string;
  content_ar: string;
  excerpt_ar: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  category_id: number | string;
  meta_description_ar?: string;
  tags?: string;
}

interface Category {
  id: number;
  name_ar: string;
}

const NewPost: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [post, setPost] = useState<PostForm>({
    title_ar: '',
    content_ar: '',
    excerpt_ar: '',
    featured_image: '',
    is_published: false,
    is_featured: false,
    category_id: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';
      console.log('Fetching categories with token:', token);
      const response = await fetch(`${API_BASE}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      toast.error('فشل في تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PostForm, value: string | number | boolean) => {
    setPost({ ...post, [field]: value });
  };

  const handleSave = async () => {
    // Validation
    if (!post.title_ar.trim()) {
      toast.error('العنوان العربي مطلوب');
      return;
    }
    if (!post.content_ar.trim()) {
      toast.error('المحتوى العربي مطلوب');
      return;
    }
    if (!post.category_id) {
      toast.error('التصنيف مطلوب');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title_ar', post.title_ar);
      formData.append('content_ar', post.content_ar);
      formData.append('excerpt_ar', post.excerpt_ar);
      formData.append('category_id', post.category_id.toString());
      formData.append('is_published', post.is_published.toString());
      formData.append('is_featured', post.is_featured.toString());
      formData.append('tags', post.tags || '');
      if (selectedFile) {
        formData.append('featured_image', selectedFile);
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';
      const response = await fetch(`${API_BASE}/admin/adminstratorpage/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success('تم إنشاء المقال بنجاح');
        router.push('/admin/adminstratorpage/posts');
      } else {
        toast.error(data.message || 'فشل في إنشاء المقال');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('حدث خطأ في إنشاء المقال');
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/admin/adminstratorpage/posts">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <FiArrowLeft size={20} />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">مقال جديد</h1>
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
        {previewMode ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">{post.title_ar}</h2>
            {(selectedFile || post.featured_image) && (
              <img 
                src={selectedFile ? URL.createObjectURL(selectedFile) : post.featured_image}
                alt="Featured"
                className="w-full max-w-md mb-4"
              />
            )}
            <p className="text-gray-600 mb-4">{post.excerpt_ar}</p>
            <div className="prose" dangerouslySetInnerHTML={{ __html: post.content_ar }} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              {/* Arabic Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  العنوان *
                </label>
                <input
                type="text"
                value={post.title_ar}
                onChange={(e) => setPost({...post, title_ar: e.target.value})}
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
                  value={post.category_id}
                  onChange={(e) => setPost({...post, category_id: e.target.value})}
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
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Tags */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكلمات المفتاحية
                </label>
                <input
                  type="text"
                  value={post.tags || ''}
                  onChange={(e) => setPost({...post, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="كلمة1، كلمة2، كلمة3"
                  dir="rtl"
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
                  onChange={(e) => setPost({...post, excerpt_ar: e.target.value})}
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
                  onChange={(e) => setPost({...post, content_ar: e.target.value})}
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
                  خيارات النشر
                </label>
                <div className="flex items-center space-x-6 rtl:space-x-reverse">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={post.is_published}
                      onChange={(e) => setPost({...post, is_published: e.target.checked})}
                      className="ml-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">منشور</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={post.is_featured}
                      onChange={(e) => setPost({...post, is_featured: e.target.checked})}
                      className="ml-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">مميز</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NewPost;