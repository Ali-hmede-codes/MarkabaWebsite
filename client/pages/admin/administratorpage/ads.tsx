'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiEye, FiClock, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { getImageUrl } from '../../../utils/imageUtils';

interface AdPosition {
  id: number;
  name: string;
  name_ar: string;
  width: number;
  height: number;
  is_active?: boolean;
}

interface Ad {
  id: number;
  title: string;
  image_path: string;
  link_url: string;
  position_id: number;
  position_name?: string;
  start_date: string;
  expire_date: string;
  clicks: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface AdForm {
  title: string;
  link_url: string;
  position_id: number;
  expire_date: string;
  is_active: boolean;
}

const AdsManagement: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<number | ''>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<AdForm>({
    title: '',
    link_url: '',
    position_id: 0,
    expire_date: '',
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch ads and positions
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [adsResponse, positionsResponse] = await Promise.all([
        apiRequest('/admin/ads', { method: 'GET' }),
        apiRequest('/admin/ads/positions/list', { method: 'GET' })
      ]);

      if (adsResponse.success) {
        setAds(adsResponse.data.ads || []);
      }
      if (positionsResponse.success) {
        setPositions(positionsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('نوع الملف غير مدعوم. يرجى اختيار صورة (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.title.trim() || !formData.link_url.trim() || !formData.position_id || !formData.expire_date) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!editingAd && !selectedFile) {
      toast.error('يرجى اختيار صورة للإعلان');
      return;
    }

    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('link_url', formData.link_url);
      formDataToSend.append('position_id', formData.position_id.toString());
      formDataToSend.append('expire_date', formData.expire_date);
      formDataToSend.append('is_active', formData.is_active.toString());
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      let response;
      if (editingAd) {
        response = await apiRequest(`/api/admin/ads/${editingAd.id}`, {
          method: 'PUT',
          body: formDataToSend,
          isFormData: true
        });
      } else {
        response = await apiRequest('/admin/ads', {
          method: 'POST',
          body: formDataToSend,
          isFormData: true
        });
      }

      if (response.success) {
        toast.success(editingAd ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح');
        resetForm();
        fetchData();
      } else {
        toast.error(response.message || 'حدث خطأ أثناء حفظ الإعلان');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('حدث خطأ أثناء حفظ الإعلان');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      return;
    }

    try {
      const response = await apiRequest(`/admin/ads/${id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        toast.success('تم حذف الإعلان بنجاح');
        fetchData();
      } else {
        toast.error(response.message || 'فشل في حذف الإعلان');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('حدث خطأ أثناء حذف الإعلان');
    }
  };

  // Handle edit
  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      link_url: ad.link_url,
      position_id: ad.position_id,
      expire_date: ad.expire_date.split('T')[0], // Format for date input
      is_active: ad.is_active
    });
    setShowCreateForm(true);
    setImagePreview(ad.image_path ? getImageUrl(ad.image_path) : null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      link_url: '',
      position_id: 0,
      expire_date: '',
      is_active: true
    });
    setSelectedFile(null);
    setImagePreview(null);
    setEditingAd(null);
    setShowCreateForm(false);
  };

  // Manual cleanup
  const handleManualCleanup = async () => {
    try {
      const response = await apiRequest('/admin/ads/cleanup/expired', {
        method: 'POST'
      });

      if (response.success) {
        toast.success('تم تنظيف الإعلانات المنتهية الصلاحية بنجاح');
        fetchData();
      } else {
        toast.error(response.message || 'فشل في تنظيف الإعلانات');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error('حدث خطأ أثناء تنظيف الإعلانات');
    }
  };

  // Filter ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === '' || ad.position_id === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  // Get position name
  const getPositionName = (positionId: number) => {
    const position = positions.find(p => p.id === positionId);
    return position ? `${position.name} (${position.width}x${position.height})` : 'غير محدد';
  };

  // Check if ad is expired
  const isExpired = (expireDate: string) => {
    return new Date(expireDate) < new Date();
  };

  // Permission check
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
            <p className="text-red">هذه الصفحة مخصصة للمديرين فقط</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>إدارة الإعلانات - نيوز مركبا</title>
        <meta name="description" content="إدارة الإعلانات في الموقع" />
      </Head>

      <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">إدارة الإعلانات</h1>
              <p className="text-gray-600 mt-1">إدارة الإعلانات في مواضع مختلفة من الموقع</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleManualCleanup}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <FiClock className="w-4 h-4" />
                تنظيف الإعلانات المنتهية
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                إضافة إعلان جديد
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث في الإعلانات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value === '' ? '' : Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع المواضع</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      عنوان الإعلان *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      رابط الإعلان *
                    </label>
                    <input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="https://example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      موضع الإعلان *
                    </label>
                    <select
                      value={formData.position_id}
                      onChange={(e) => setFormData({ ...formData, position_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    >
                      <option value={0}>اختر الموضع</option>
                      {positions.map(position => (
                        <option key={position.id} value={position.id}>
                          {position.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      تاريخ انتهاء الصلاحية *
                    </label>
                    <input
                      type="date"
                      value={formData.expire_date}
                  onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    صورة الإعلان {!editingAd && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                  <p className="text-sm text-black mt-1">
                    الأنواع المدعومة: JPEG, PNG, GIF, WebP. الحد الأقصى: 5 ميجابايت
                  </p>
                  
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="معاينة الإعلان"
                        className="max-w-xs max-h-48 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="mr-2 text-sm text-black">
                    الإعلان نشط
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {submitting ? 'جاري الحفظ...' : (editingAd ? 'تحديث الإعلان' : 'إنشاء الإعلان')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ads List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-lg text-gray-600">جاري التحميل...</div>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-12">
                <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إعلانات</h3>
                <p className="text-gray-600">لم يتم العثور على إعلانات مطابقة للبحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإعلان
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الموضع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        النقرات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الانتهاء
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAds.map((ad) => (
                      <tr key={ad.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {ad.image_path && (
                              <img
                                src={getImageUrl(ad.image_path)}
                                alt={ad.title}
                                className="w-16 h-12 object-cover rounded-lg ml-4"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{ad.link_url}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getPositionName(ad.position_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              ad.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {ad.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                            {isExpired(ad.expire_date) && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                منتهي الصلاحية
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-blue-600">{ad.clicks?.toLocaleString() ?? '0'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ad.expire_date ? new Date(ad.expire_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(ad.link_url, '_blank')}
                              className="text-blue-600 hover:text-blue-900"
                              title="عرض الإعلان"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(ad)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="تعديل"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ad.id)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <FiTrash2 className="w-4 h-4" />
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
      </AdminLayout>
    </>
  );
};

export default AdsManagement;