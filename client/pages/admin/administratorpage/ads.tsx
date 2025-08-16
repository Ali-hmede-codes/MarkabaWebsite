'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiEye, FiEyeOff, FiTarget, FiBarChart, FiUpload, FiImage, FiCalendar, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

interface Ad {
  id: number;
  title: string;
  description?: string;
  image_path: string;
  image_url?: string;
  url: string;
  position: string;
  width: number;
  height: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
}

interface AdForm {
  title: string;
  description: string;
  image_path: string;
  url: string;
  position: string;
  width: number;
  height: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface AdFormErrors {
  title?: string;
  description?: string;
  image_path?: string;
  url?: string;
  position?: string;
  width?: string;
  height?: string;
  start_date?: string;
  end_date?: string;
}

interface AdPosition {
  id: string;
  name: string;
  description: string;
  recommended_width: number;
  recommended_height: number;
}

interface AdStats {
  total_ads: number;
  active_ads: number;
  inactive_ads: number;
  total_clicks: number;
  total_impressions: number;
  ctr: number;
}

const AdminAds: React.FC = () => {
  const { user, loading: authLoading, token } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; adId: number | null }>({ show: false, adId: null });
  const [selectedAds, setSelectedAds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState<AdForm>({
    title: '',
    description: '',
    image_path: '',
    url: '',
    position: '',
    width: 300,
    height: 250,
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const [formErrors, setFormErrors] = useState<AdFormErrors>({});

  // Available ad positions
  const adPositions: AdPosition[] = [
    { id: 'header_banner', name: 'بانر الرأس', description: 'إعلان في أعلى الصفحة', recommended_width: 1280, recommended_height: 200 },
    { id: 'sidebar_square', name: 'الشريط الجانبي مربع', description: 'إعلان مربع في الشريط الجانبي', recommended_width: 300, recommended_height: 300 },
    { id: 'post_top', name: 'أعلى المقال', description: 'إعلان في أعلى المقال', recommended_width: 728, recommended_height: 90 },
    { id: 'post_bottom', name: 'أسفل المقال', description: 'إعلان في أسفل المقال', recommended_width: 728, recommended_height: 90 },
    { id: 'post_square', name: 'مربع المقال', description: 'إعلان مربع داخل المقال', recommended_width: 300, recommended_height: 300 },
    { id: 'footer_banner', name: 'بانر التذييل', description: 'إعلان في أسفل الصفحة', recommended_width: 1280, recommended_height: 200 }
  ];

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/administratorpage/ads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAds(data.data || []);
      } else {
        toast.error('فشل في تحميل الإعلانات');
      }
    } catch {
      toast.error('حدث خطأ في تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/administratorpage/ads/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch {
      console.error('Failed to fetch ads stats');
    }
  }, [token]);

  useEffect(() => {
    fetchAds();
    fetchStats();
  }, [fetchAds, fetchStats]);

  // Permission check - only admin can access ads management
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
    const errors: AdFormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'عنوان الإعلان مطلوب';
    }

    if (!formData.image_path.trim()) {
      errors.image_path = 'صورة الإعلان مطلوبة';
    }

    if (!formData.url.trim()) {
      errors.url = 'رابط الإعلان مطلوب';
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      errors.url = 'يجب أن يكون الرابط صحيحاً ويبدأ بـ http:// أو https://';
    }

    if (!formData.position) {
      errors.position = 'موقع الإعلان مطلوب';
    }

    if (formData.width <= 0) {
      errors.width = 'عرض الإعلان يجب أن يكون أكبر من صفر';
    }

    if (formData.height <= 0) {
      errors.height = 'ارتفاع الإعلان يجب أن يكون أكبر من صفر';
    }

    if (!formData.start_date) {
      errors.start_date = 'تاريخ البداية مطلوب';
    }

    if (!formData.end_date) {
      errors.end_date = 'تاريخ النهاية مطلوب';
    } else if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.end_date = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const url = editingAd ? `/api/admin/administratorpage/ads/${editingAd.id}` : '/api/admin/administratorpage/ads';
      const method = editingAd ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingAd ? 'تم تحديث الإعلان بنجاح' : 'تم إضافة الإعلان بنجاح');
        setShowForm(false);
        setEditingAd(null);
        resetForm();
        fetchAds();
        fetchStats();
      } else {
        toast.error(data.message || 'حدث خطأ في حفظ الإعلان');
      }
    } catch {
      toast.error('حدث خطأ في حفظ الإعلان');
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_path: ad.image_path,
      url: ad.url,
      position: ad.position,
      width: ad.width,
      height: ad.height,
      is_active: ad.is_active,
      start_date: ad.start_date.split('T')[0],
      end_date: ad.end_date.split('T')[0]
    });
    setImagePreview(ad.image_url || ad.image_path);
    setShowForm(true);
  };

  const handleDelete = async (adId: number) => {
    try {
      const response = await fetch(`/api/admin/administratorpage/ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('تم حذف الإعلان بنجاح');
        fetchAds();
        fetchStats();
      } else {
        toast.error(data.message || 'حدث خطأ في حذف الإعلان');
      }
    } catch {
      toast.error('حدث خطأ في حذف الإعلان');
    }
    setDeleteModal({ show: false, adId: null });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صحيح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, image_path: data.data.path }));
        setImagePreview(data.data.url);
        toast.success('تم رفع الصورة بنجاح');
      } else {
        toast.error(data.message || 'فشل في رفع الصورة');
      }
    } catch {
      toast.error('حدث خطأ في رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_path: '',
      url: '',
      position: '',
      width: 300,
      height: 250,
      is_active: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setFormErrors({});
    setImagePreview(null);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedAds.size === 0) return;

    try {
      const response = await fetch('/api/admin/administratorpage/ads/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: bulkAction,
          adIds: Array.from(selectedAds)
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`تم ${bulkAction === 'activate' ? 'تفعيل' : bulkAction === 'deactivate' ? 'إلغاء تفعيل' : 'حذف'} الإعلانات المحددة`);
        setSelectedAds(new Set());
        setBulkAction('');
        fetchAds();
        fetchStats();
      } else {
        toast.error(data.message || 'حدث خطأ في العملية');
      }
    } catch {
      toast.error('حدث خطأ في العملية');
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !positionFilter || ad.position === positionFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && ad.is_active) ||
                         (statusFilter === 'inactive' && !ad.is_active);
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

  const getPositionName = (position: string) => {
    const pos = adPositions.find(p => p.id === position);
    return pos ? pos.name : position;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  return (
    <AdminLayout>
      <Head>
        <title>إدارة الإعلانات - نيوز مركبا</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الإعلانات</h1>
            <p className="text-gray-600">إدارة وتتبع الإعلانات على الموقع</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FiBarChart className="ml-2" size={18} />
              {showStats ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingAd(null);
                resetForm();
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <FiPlus className="ml-2" size={18} />
              إضافة إعلان جديد
            </button>
          </div>
        </div>

        {/* Statistics */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الإعلانات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_ads}</p>
                </div>
                <FiTarget className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الإعلانات النشطة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_ads}</p>
                </div>
                <FiEye className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الإعلانات غير النشطة</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive_ads}</p>
                </div>
                <FiEyeOff className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي النقرات</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total_clicks.toLocaleString()}</p>
                </div>
                <FiActivity className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المشاهدات</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.total_impressions.toLocaleString()}</p>
                </div>
                <FiEye className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">معدل النقر (CTR)</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.ctr.toFixed(2)}%</p>
                </div>
                <FiBarChart className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="البحث في الإعلانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المواقع</option>
              {adPositions.map(position => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            {selectedAds.size > 0 && (
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">عمليات جماعية</option>
                  <option value="activate">تفعيل</option>
                  <option value="deactivate">إلغاء تفعيل</option>
                  <option value="delete">حذف</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
                >
                  تنفيذ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ads Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <FiTarget className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إعلانات</h3>
              <p className="text-gray-500">ابدأ بإضافة إعلان جديد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedAds.size === filteredAds.length && filteredAds.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAds(new Set(filteredAds.map(ad => ad.id)));
                          } else {
                            setSelectedAds(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الصورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الموقع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الأبعاد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفترة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإحصائيات
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
                        <input
                          type="checkbox"
                          checked={selectedAds.has(ad.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedAds);
                            if (e.target.checked) {
                              newSelected.add(ad.id);
                            } else {
                              newSelected.delete(ad.id);
                            }
                            setSelectedAds(newSelected);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-16 w-20 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={ad.image_url || ad.image_path}
                            alt={ad.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                        {ad.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{ad.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPositionName(ad.position)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ad.width} × {ad.height}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ad.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ad.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(ad.start_date)}</div>
                        <div className="text-gray-500">إلى {formatDate(ad.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>النقرات: {ad.clicks.toLocaleString()}</div>
                          <div>المشاهدات: {ad.impressions.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">CTR: {calculateCTR(ad.clicks, ad.impressions)}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleEdit(ad)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="تعديل"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, adId: ad.id })}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
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
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAd(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الإعلان *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="أدخل عنوان الإعلان"
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      وصف الإعلان
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="أدخل وصف الإعلان (اختياري)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      صورة الإعلان *
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FiUpload className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">انقر لرفع صورة</span> أو اسحب وأفلت
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG أو GIF (حد أقصى 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                      
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="معاينة الإعلان"
                            className="max-w-full h-32 object-contain mx-auto border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, image_path: '' });
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      )}
                      
                      {uploadingImage && (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="mr-2 text-sm text-gray-600">جاري رفع الصورة...</span>
                        </div>
                      )}
                    </div>
                    {formErrors.image_path && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.image_path}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط الإعلان *
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://example.com"
                    />
                    {formErrors.url && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.url}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      موقع الإعلان *
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => {
                        const selectedPosition = adPositions.find(p => p.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          position: e.target.value,
                          width: selectedPosition?.recommended_width || formData.width,
                          height: selectedPosition?.recommended_height || formData.height
                        });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.position ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">اختر موقع الإعلان</option>
                      {adPositions.map(position => (
                        <option key={position.id} value={position.id}>
                          {position.name} ({position.recommended_width}×{position.recommended_height})
                        </option>
                      ))}
                    </select>
                    {formErrors.position && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.position}</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm font-medium text-gray-700">الإعلان نشط</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العرض (بكسل) *
                    </label>
                    <input
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.width ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="1"
                    />
                    {formErrors.width && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.width}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الارتفاع (بكسل) *
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.height ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="1"
                    />
                    {formErrors.height && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.height}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ البداية *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.start_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.start_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ النهاية *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.end_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAd(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FiSave className="ml-2" size={18} />
                    {editingAd ? 'تحديث الإعلان' : 'إضافة الإعلان'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-gray-500 mb-6">
                هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center space-x-3 rtl:space-x-reverse">
                <button
                  onClick={() => setDeleteModal({ show: false, adId: null })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => deleteModal.adId && handleDelete(deleteModal.adId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAds;