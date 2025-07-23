'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiEye, FiUpload } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';
import { getImageUrl } from '../../../../utils/imageUtils';

interface PostForm {
  title_ar: string;
  content_ar: string;
  excerpt_ar: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  category_id: number | string;
  meta_description_ar: string;
  meta_keywords_ar: string;
  tags: string[];
}

interface Category {
  id: number;
  name_ar: string;
  slug: string;
}

const CreatePost: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [post, setPost] = useState<PostForm>({
    title_ar: '',
    content_ar: '',
    excerpt_ar: '',
    featured_image: '',
    is_published: false,
    is_featured: false,
    category_id: '',
    meta_description_ar: '',
    meta_keywords_ar: '',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.categories)) {
        setCategories(data.data.categories);
      } else {
        setCategories([]);
        toast.error('لم يتم العثور على تصنيفات');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      toast.error('فشل في تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PostForm, value: string | number | boolean | string[]) => {
    setPost({ ...post, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      if (data.success && data.data?.url) {
        setPost({ ...post, featured_image: data.data.url });
        toast.success('تم رفع الصورة بنجاح');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('فشل في رفع الصورة');
    } finally {
      setImageUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !post.tags.includes(tagInput.trim())) {
      setPost({ ...post, tags: [...post.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost({ ...post, tags: post.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = (): boolean => {
    if (!post.title_ar.trim()) {
      toast.error('العنوان العربي مطلوب');
      return false;
    }
    
    if (post.title_ar.length < 3 || post.title_ar.length > 255) {
      toast.error('عنوان المقال يجب أن يكون بين 3 و 255 حرف');
      return false;
    }
    
    if (!post.content_ar.trim()) {
      toast.error('المحتوى العربي مطلوب');
      return false;
    }
    
    if (post.content_ar.length < 10) {
      toast.error('محتوى المقال يجب أن يكون 10 أحرف على الأقل');
      return false;
    }
    
    if (!post.category_id) {
      toast.error('التصنيف مطلوب');
      return false;
    }
    
    if (post.meta_description_ar && post.meta_description_ar.length > 160) {
      toast.error('وصف SEO يجب أن يكون أقل من 160 حرف');
      return false;
    }
    
    if (post.excerpt_ar && post.excerpt_ar.length > 500) {
      toast.error('المقتطف يجب أن يكون أقل من 500 حرف');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Upload image first if selected
      if (selectedFile && !post.featured_image) {
        await handleImageUpload(selectedFile);
      }
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const postData = {
        title_ar: post.title_ar.trim(),
        content_ar: post.content_ar.trim(),
        excerpt_ar: post.excerpt_ar.trim(),
        category_id: parseInt(post.category_id.toString()),
        featured_image: post.featured_image,
        tags: post.tags,
        meta_description_ar: post.meta_description_ar.trim(),
        meta_keywords_ar: post.meta_keywords_ar.trim(),
        is_featured: post.is_featured,
        is_published: post.is_published
      };
      
      const response = await fetch(`${API_BASE}/admin/administratorpage/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'تم إنشاء المقال بنجاح');
        router.push('/admin/administratorpage/posts');
      } else {
        throw new Error(data.message || 'فشل في إنشاء المقال');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'حدث خطأ في إنشاء المقال');
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
            <Link href="/admin/administratorpage/posts">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FiArrowLeft size={20} />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">إنشاء مقال جديد</h1>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiEye className="ml-2" size={16} />
              {previewMode ? 'تعديل' : 'معاينة'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || imageUploading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSave className="ml-2" size={16} />
              {saving ? 'جاري الحفظ...' : 'حفظ المقال'}
            </button>
          </div>
        </div>

        {/* Form */}
        {previewMode ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-3xl font-bold mb-4 text-gray-900" dir="rtl">{post.title_ar || 'عنوان المقال'}</h2>
            
            {post.featured_image && (
              <div className="mb-6">
                <img 
                  src={getImageUrl(post.featured_image)}
                  alt="الصورة المميزة"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
            
            {post.excerpt_ar && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 text-lg leading-relaxed" dir="rtl">{post.excerpt_ar}</p>
              </div>
            )}
            
            {post.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="prose max-w-none" dir="rtl">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                {post.content_ar || 'محتوى المقال'}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان العربي *
                </label>
                <input
                  type="text"
                  value={post.title_ar}
                  onChange={(e) => handleInputChange('title_ar', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium text-gray-900"
                  dir="rtl"
                  placeholder="أدخل عنوان المقال"
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
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="">اختر التصنيف</option>
                    {categories.map(category => (
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
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          handleImageUpload(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      disabled={imageUploading}
                    />
                    {imageUploading && (
                      <p className="text-sm text-blue-600">جاري رفع الصورة...</p>
                    )}
                    {post.featured_image && (
                      <div className="mt-2">
                        <img src={getImageUrl(post.featured_image)} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكلمات المفتاحية
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="أدخل كلمة مفتاحية واضغط Enter"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
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
                  value={post.excerpt_ar}
                  onChange={(e) => handleInputChange('excerpt_ar', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                  dir="rtl"
                  placeholder="وصف مختصر للمقال (اختياري)"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">{post.excerpt_ar.length}/500 حرف</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المحتوى *
                </label>
                <textarea
                  value={post.content_ar}
                  onChange={(e) => handleInputChange('content_ar', e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[400px] text-gray-900"
                  dir="rtl"
                  required
                  placeholder="محتوى المقال باللغة العربية"
                />
              </div>

              {/* SEO Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف SEO
                  </label>
                  <textarea
                    value={post.meta_description_ar}
                    onChange={(e) => handleInputChange('meta_description_ar', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    dir="rtl"
                    placeholder="وصف المقال لمحركات البحث"
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500 mt-1">{post.meta_description_ar.length}/160 حرف</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمات SEO المفتاحية
                  </label>
                  <input
                    type="text"
                    value={post.meta_keywords_ar}
                    onChange={(e) => handleInputChange('meta_keywords_ar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    dir="rtl"
                    placeholder="كلمة1، كلمة2، كلمة3"
                    maxLength={255}
                  />
                </div>
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
                      onChange={(e) => handleInputChange('is_published', e.target.checked)}
                      className="ml-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">نشر المقال</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={post.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                      className="ml-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">مقال مميز</span>
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

export default CreatePost;