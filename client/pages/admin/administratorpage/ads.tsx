import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { useAuth, withAuth } from '../../../context/AuthContext';
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiEyeOff, FiCalendar, FiBarChart, FiImage, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adsApi, Ad, AdPosition, AdFormData, AdFilters } from '../../../lib/api/ads';



const AdsManagement: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<AdFilters>({
    page: 1,
    limit: 10,
    position: '',
    status: undefined
  });
  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    description: '',
    url: '',
    position: '',
    end_date: '',
    is_active: true,
    image: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchAds = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adsApi.getAds(token, filters);
      
      if (response.success && response.data) {
        setAds(response.data);
        if (response.pagination) {
          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.total_pages);
        }
      } else {
        throw new Error(response.message || 'فشل في جلب الإعلانات');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    if (!token) return;
    
    try {
      const response = await adsApi.getAdPositions(token);
      
      if (response.success && response.data) {
        setPositions(response.data);
      } else {
        console.error('Failed to fetch positions:', response.message);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAds();
      fetchPositions();
    }
  }, [token, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('غير مصرح لك بالوصول');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      let response;
      
      if (editingAd) {
        response = await adsApi.updateAd(token, editingAd.id, formData, editingAd.image_path);
      } else {
        response = await adsApi.createAd(token, formData);
      }
      
      if (response.success) {
        toast.success(editingAd ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح');
        await fetchAds();
        resetForm();
        setIsFormOpen(false);
      } else {
        throw new Error(response.message || 'فشل في العملية');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      url: ad.url,
      position: ad.position,
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
      is_active: ad.is_active,
      image: null
    });
    
    // Set image preview if ad has an image
    if (ad.image_path) {
      setImagePreview(ad.image_path);
    } else {
      setImagePreview(null);
    }
    
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!token) {
      toast.error('غير مصرح لك بالوصول');
      return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      return;
    }
    
    try {
      const response = await adsApi.deleteAd(token, id);
      
      if (response.success) {
        toast.success('تم حذف الإعلان بنجاح');
        await fetchAds();
      } else {
        throw new Error(response.message || 'فشل في حذف الإعلان');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (ad: Ad) => {
    if (!token) {
      toast.error('غير مصرح لك بالوصول');
      return;
    }
    
    try {
      const response = await adsApi.toggleAdStatus(token, ad.id, !ad.is_active);
      
      if (response.success) {
        toast.success(`تم ${!ad.is_active ? 'تفعيل' : 'إلغاء تفعيل'} الإعلان بنجاح`);
        await fetchAds();
      } else {
        throw new Error(response.message || 'فشل في تغيير حالة الإعلان');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      toast.error(errorMessage);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      position: '',
      end_date: '',
      is_active: true,
      image: null
    });
    setEditingAd(null);
    setImagePreview(null);
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof AdFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getAdStatusBadge = (ad: Ad) => {
    if (!ad.is_active) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">غير نشط</span>;
    }
    
    if (ad.end_date && new Date(ad.end_date) < new Date()) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">منتهي الصلاحية</span>;
    }
    
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">نشط</span>;
  };

  if (loading) {
    return (
      <AdminLayout title="إدارة الإعلانات">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="إدارة الإعلانات">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الإعلانات</h1>
            <p className="text-gray-600 mt-1">إدارة وتتبع الإعلانات على الموقع</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            إضافة إعلان جديد
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصفية حسب الموقع
              </label>
              <select
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع المواقع</option>
                {positions.map((pos) => (
                  <option key={pos.position_name} value={pos.position_name}>
                    {pos.display_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصفية حسب الحالة
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="expired">منتهي الصلاحية</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عدد النتائج لكل صفحة
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        العنوان *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الرابط *
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوصف
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="وصف اختياري للإعلان"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الموقع *
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">اختر الموقع</option>
                        {positions.map((pos) => (
                          <option key={pos.position_name} value={pos.position_name}>
                            {pos.display_name} ({pos.width}×{pos.height}px)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تاريخ النهاية *
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الصورة
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      نشط
                    </label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'جاري الحفظ...' : (editingAd ? 'تحديث الإعلان' : 'إنشاء الإعلان')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Ads Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإعلان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الموقع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإحصائيات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التواريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {ad.image_path && (
                          <div className="flex-shrink-0 h-12 w-12 ml-4">
                            <img
                              src={ad.image_path}
                              alt={ad.title}
                              className="h-12 w-12 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {ad.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <FiExternalLink className="w-3 h-3" />
                            <a href={ad.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                              {ad.url}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {positions.find(p => p.position_name === ad.position)?.display_name || ad.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAdStatusBadge(ad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FiEye className="w-4 h-4 text-gray-400" />
                          <span>{ad.impressions}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiBarChart className="w-4 h-4 text-gray-400" />
                          <span>{ad.clicks}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {ad.start_date && (
                          <div className="flex items-center gap-1 text-green-600">
                            <FiCalendar className="w-3 h-3" />
                            <span>{new Date(ad.start_date).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                        {ad.end_date && (
                          <div className="flex items-center gap-1 text-red-600">
                            <FiCalendar className="w-3 h-3" />
                            <span>{new Date(ad.end_date).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(ad)}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            ad.is_active ? 'text-green-600' : 'text-gray-400'
                          }`}
                          title={ad.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                        >
                          {ad.is_active ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-1 rounded hover:bg-gray-100 text-blue-600"
                          title="تعديل"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-1 rounded hover:bg-gray-100 text-red-600"
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
          
          {ads.length === 0 && !loading && (
            <div className="text-center py-12">
              <FiImage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد إعلانات</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإنشاء إعلانك الأول</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  إضافة إعلان جديد
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                صفحة {currentPage} من {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Server-side authentication check can be added here
  // For now, we'll handle authentication on the client side
  return {
    props: {},
  };
};

export default withAuth(AdsManagement, 'admin');