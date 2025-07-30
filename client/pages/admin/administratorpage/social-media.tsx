'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { SocialMedia } from '../../../types';

interface SocialMediaForm {
  platform: string;
  name_ar: string;
  url: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

interface SocialMediaFormErrors {
  platform?: string;
  name_ar?: string;
  url?: string;
  icon?: string;
  color?: string;
  sort_order?: string;
}

const SocialMediaManagement: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSocialMedia, setEditingSocialMedia] = useState<SocialMedia | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; socialMediaId: number | null }>({ show: false, socialMediaId: null });
  const [formData, setFormData] = useState<SocialMediaForm>({
    platform: '',
    name_ar: '',
    url: '',
    icon: '',
    color: '#000000',
    sort_order: 0,
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<SocialMediaFormErrors>({});

  const fetchSocialMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social-media/admin');
      const data = await response.json();

      if (data.success) {
        setSocialMediaList(data.data || []);
      } else {
        toast.error('فشل في تحميل وسائل التواصل الاجتماعي');
      }
    } catch {
      toast.error('حدث خطأ في تحميل وسائل التواصل الاجتماعي');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocialMedia();
  }, [fetchSocialMedia]);

  // Permission check - only admin can access social media management
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة</h1>
            <p className="text-gray-600">هذه الصفحة مخصصة للمديرين فقط</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const validateForm = (): boolean => {
    const errors: SocialMediaFormErrors = {};

    if (!formData.platform.trim()) {
      errors.platform = 'اسم المنصة مطلوب';
    }

    if (!formData.name_ar.trim()) {
      errors.name_ar = 'الاسم بالعربية مطلوب';
    }

    if (!formData.url.trim()) {
      errors.url = 'الرابط مطلوب';
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      errors.url = 'يجب أن يبدأ الرابط بـ http:// أو https://';
    }

    if (!formData.icon.trim()) {
      errors.icon = 'أيقونة المنصة مطلوبة';
    }

    if (formData.sort_order < 0) {
      errors.sort_order = 'ترتيب العرض يجب أن يكون رقم موجب';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      name_ar: '',
      url: '',
      icon: '',
      color: '#000000',
      sort_order: 0,
      is_active: true
    });
    setFormErrors({});
    setEditingSocialMedia(null);
    setShowForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const method = editingSocialMedia ? 'PUT' : 'POST';
      const url = editingSocialMedia ? `/api/social-media/${editingSocialMedia.id}` : '/api/social-media';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingSocialMedia ? 'تم تحديث وسيلة التواصل بنجاح' : 'تم إضافة وسيلة التواصل بنجاح');
        fetchSocialMedia();
        resetForm();
      } else {
        toast.error(data.message || 'حدث خطأ في حفظ البيانات');
      }
    } catch {
      toast.error('حدث خطأ في حفظ البيانات');
    }
  };

  const handleEdit = (item: SocialMedia) => {
    setFormData({
      platform: item.platform,
      name_ar: item.name_ar,
      url: item.url,
      icon: item.icon || '',
      color: item.color || '#000000',
      sort_order: item.sort_order || 0,
      is_active: Boolean(item.is_active)
    });
    setEditingSocialMedia(item);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteModal.socialMediaId) return;

    try {
      const response = await fetch(`/api/social-media/${deleteModal.socialMediaId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('تم حذف وسيلة التواصل بنجاح');
        fetchSocialMedia();
      } else {
        toast.error(data.message || 'حدث خطأ في حذف وسيلة التواصل');
      }
    } catch {
      toast.error('حدث خطأ في حذف وسيلة التواصل');
    } finally {
      setDeleteModal({ show: false, socialMediaId: null });
    }
  };

  // Filter social media based on search term
  const filteredSocialMedia = socialMediaList.filter(item =>
    item.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name_ar.includes(searchTerm) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="إدارة وسائل التواصل الاجتماعي" description="إدارة روابط وسائل التواصل الاجتماعي">
      <Head>
        <title>إدارة وسائل التواصل الاجتماعي - نيوز مركبا</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة وسائل التواصل الاجتماعي</h1>
                <p className="text-gray-600 mt-2">إدارة روابط وسائل التواصل الاجتماعي للموقع</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiPlus size={20} />
                إضافة وسيلة تواصل
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="relative max-w-md">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="البحث في وسائل التواصل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
      </div>

      {/* Social Media Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">جاري التحميل...</p>
          </div>
        ) : filteredSocialMedia.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">لا توجد وسائل تواصل اجتماعي</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنصة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرابط
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اللون
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ترتيب العرض
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
                {filteredSocialMedia.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {item.platform}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.name_ar}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {item.url}
                          <FiExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-gray-900">{item.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, socialMediaId: item.id })}
                          className="text-red-600 hover:text-red-900 p-1"
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
    </div>
  </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSocialMedia ? 'تعديل وسيلة التواصل' : 'إضافة وسيلة تواصل جديدة'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المنصة *
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="مثال: Facebook, Twitter, Instagram"
                  required
                />
                {formErrors.platform && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.platform}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم بالعربية *
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="مثال: فيسبوك، تويتر، انستغرام"
                  required
                />
                {formErrors.name_ar && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name_ar}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الرابط *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="https://example.com"
                  required
                />
                {formErrors.url && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الأيقونة
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="مثال: fab fa-facebook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اللون
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="mr-2 block text-sm text-gray-900">
                  نشط
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : (editingSocialMedia ? 'تحديث' : 'إضافة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mr-3">
                <h3 className="text-lg font-medium text-gray-900">
                  تأكيد الحذف
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                هل أنت متأكد من أنك تريد حذف وسيلة التواصل هذه؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, socialMediaId: null })}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
};

export default SocialMediaManagement;