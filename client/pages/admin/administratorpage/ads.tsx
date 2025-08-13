'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiExternalLink, FiEye, FiBarChart, FiFilter, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';

interface Ad {
  id: number;
  title: string;
  description: string | null;
  image_path: string;
  url: string;
  position: string;
  width: number;
  height: number;
  is_active: boolean;
  end_date: string;
  created_at: string;
  updated_at: string;
  position_display_name: string;
  position_width: number;
  position_height: number;
}

interface AdPosition {
  id: number;
  position_name: string;
  display_name: string;
  width: number;
  height: number;
  max_ads: number;
}

interface AdForm {
  title: string;
  description: string;
  url: string;
  position: string;
  end_date: string;
  image: File | null;
}

interface AdStats {
  total_clicks: number;
  total_impressions: number;
  ctr: number;
  daily_clicks: Array<{ date: string; clicks: number }>;
  daily_impressions: Array<{ date: string; impressions: number }>;
}

const AdsAdmin: React.FC = () => {
  const { token, user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedAdStats, setSelectedAdStats] = useState<AdStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<AdForm>({
    title: '',
    description: '',
    url: '',
    position: '',
    end_date: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAds = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (filterPosition) params.append('position', filterPosition);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await apiRequest(`/admin/administratorpage/ads?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        setAds(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.pages);
      } else {
        toast.error(response.message || 'فشل في جلب الإعلانات');
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('حدث خطأ في جلب الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [token, filterPosition, filterStatus]);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/administratorpage/ads/positions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        setPositions(response.data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  }, [token]);

  const fetchAdStats = async (adId: number) => {
    try {
      const response = await apiRequest(`/admin/administratorpage/ads/${adId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        setSelectedAdStats(response.data.stats);
        setShowStatsModal(true);
      } else {
        toast.error('فشل في جلب إحصائيات الإعلان');
      }
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      toast.error('حدث خطأ في جلب الإحصائيات');
    }
  };

  useEffect(() => {
    if (token) {
      fetchAds();
      fetchPositions();
    }
  }, [token, fetchAds, fetchPositions]);

  useEffect(() => {
    fetchAds(1);
  }, [filterPosition, filterStatus, fetchAds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('url', formData.url);
      formDataToSend.append('position', formData.position);
      formDataToSend.append('end_date', formData.end_date);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      const url = editingAd ? `/admin/administratorpage/ads/${editingAd.id}` : '/admin/administratorpage/ads';
      const method = editingAd ? 'PUT' : 'POST';
      
      const response = await apiRequest(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      if (response.success) {
        toast.success(editingAd ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح');
        setShowModal(false);
        resetForm();
        fetchAds(currentPage);
      } else {
        toast.error(response.message || 'فشل في حفظ الإعلان');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('حدث خطأ في حفظ الإعلان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    try {
      const response = await apiRequest(`/admin/administratorpage/ads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        toast.success('تم حذف الإعلان بنجاح');
        fetchAds(currentPage);
      } else {
        toast.error(response.message || 'فشل في حذف الإعلان');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('حدث خطأ في حذف الإعلان');
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      url: ad.url,
      position: ad.position,
      end_date: ad.end_date.split('T')[0],
      image: null
    });
    setImagePreview(`https://api.markaba.news${ad.image_path}`);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      position: '',
      end_date: '',
      image: null
    });
    setImagePreview(null);
    setEditingAd(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.position_display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) <= new Date();
  };

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="إدارة الإعلانات">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
            <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="إدارة الإعلانات" description="إدارة إعلانات الموقع">
      <Head>
        <title>إدارة الإعلانات - نيوز مركبا</title>
      </Head>

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الإعلانات</h1>
            <p className="text-gray-600">إدارة وتتبع إعلانات الموقع</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="ml-2" size={16} />
            إضافة إعلان جديد
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="البحث في الإعلانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المواضع</option>
              {positions.map(position => (
                <option key={position.position_name} value={position.position_name}>
                  {position.display_name}
                </option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="expired">منتهي الصلاحية</option>
            </select>
            
            <button
              onClick={() => {
                setFilterPosition('');
                setFilterStatus('');
                setSearchTerm('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* Ads Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إعلانات</h3>
              <p className="text-gray-500">ابدأ بإضافة إعلان جديد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={`https://api.markaba.news${ad.image_path}`}
                              alt={ad.title}
                            />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {ad.title}
                            </div>
                            {ad.description && (
                              <div className="text-sm text-gray-500">
                                {ad.description.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ad.position_display_name}</div>
                        <div className="text-sm text-gray-500">{ad.width}x{ad.height}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ad.is_active && !isExpired(ad.end_date)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ad.is_active && !isExpired(ad.end_date) ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(ad.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => window.open(ad.url, '_blank')}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="عرض الرابط"
                          >
                            <FiExternalLink size={16} />
                          </button>
                          <button
                            onClick={() => fetchAdStats(ad.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="عرض الإحصائيات"
                          >
                            <FiBarChart size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(ad)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="تعديل"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="text-red-600 hover:text-red-900 p-1"
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                السابق
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-md text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان الإعلان *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وصف الإعلان
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رابط الإعلان *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    موضع الإعلان *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">اختر الموضع</option>
                    {positions.map(position => (
                      <option key={position.position_name} value={position.position_name}>
                        {position.display_name} ({position.width}x{position.height})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ انتهاء الإعلان *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    صورة الإعلان {!editingAd && '*'}
                  </label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editingAd}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="معاينة"
                        className="h-32 w-auto object-contain border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    ) : (
                      <FiSave className="ml-2" size={16} />
                    )}
                    {submitting ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedAdStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">إحصائيات الإعلان</h2>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedAdStats.total_impressions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">إجمالي المشاهدات</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedAdStats.total_clicks.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">إجمالي النقرات</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedAdStats.ctr}%
                  </div>
                  <div className="text-sm text-gray-600">معدل النقر</div>
                </div>
              </div>

              <div className="text-center text-gray-500 py-8">
                <FiBarChart size={48} className="mx-auto mb-4 opacity-50" />
                <p>الرسوم البيانية التفصيلية ستكون متاحة قريباً</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdsAdmin;