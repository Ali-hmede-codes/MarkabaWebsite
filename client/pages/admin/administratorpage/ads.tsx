import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import { FiPlus, FiEdit, FiEdit2, FiTrash2, FiEye, FiBarChart, FiImage, FiCalendar, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

interface Ad {
  id: number;
  title: string;
  description?: string;
  image_path?: string;
  url: string;
  position: string;
  width: number;
  height: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
  position_display_name?: string;
  created_by_username?: string;
}

interface AdPosition {
  position_name: string;
  display_name: string;
  width: number;
  height: number;
  max_ads: number;
  description?: string;
  active_ads_count?: number;
}

const AdsManagement: React.FC = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    position: 'main_top',
    start_date: '',
    end_date: '',
    is_active: true,
    image: null as File | null
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Position options will be fetched from database

  useEffect(() => {
    if (token) {
      fetchAds();
      fetchPositions();
    }
  }, [token]);

  const fetchAds = async () => {
    if (!token) {
      setError('غير مصرح لك بالوصول');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/admin/ads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setAds(result.data || []);
        setError(null);
      } else if (result.error === 'NO_TOKEN') {
        setError('انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى.');
        // Optionally redirect to login
        // window.location.href = '/admin/administratorpage/login';
      } else {
        setError(result.message || 'فشل في جلب الإعلانات');
        setAds([]);
        console.error('Failed to fetch ads:', result.message);
      }
    } catch (error) {
      setError('حدث خطأ في الشبكة أثناء جلب الإعلانات');
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/admin/ads/positions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setPositions(result.data || []);
      } else {
        console.error('Failed to fetch positions:', result.message);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('غير مصرح لك بالوصول');
      return;
    }
    
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      formDataToSend.append('url', formData.url);
      formDataToSend.append('position', formData.position);
      if (formData.end_date) {
        formDataToSend.append('end_date', formData.end_date);
      }
      formDataToSend.append('is_active', formData.is_active.toString());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingAd) {
        formDataToSend.append('current_image', editingAd.image_path || '');
      }

      const url = editingAd ? `${backendUrl}/api/admin/ads/${editingAd.id}` : `${backendUrl}/api/admin/ads`;
      const method = editingAd ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        await fetchAds();
        resetForm();
        setShowForm(false);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while saving the ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16);
    
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      url: ad.url || '',
      position: ad.position || 'main_top',
      start_date: currentDateTime, // Always set to current time
      end_date: ad.end_date ? ad.end_date.slice(0, 16) : '',
      is_active: ad.is_active ?? true,
      image: null
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!token) {
      alert('غير مصرح لك بالوصول');
      return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        await fetchAds();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('An error occurred while deleting the ad');
    }
  };

  const resetForm = () => {
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    
    setFormData({
      title: '',
      description: '',
      url: '',
      position: 'main_top',
      start_date: currentDateTime,
      end_date: '',
      is_active: true,
      image: null
    });
    setImageFile(null);
    setEditingAd(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-black">جاري تحميل الإعلانات...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الإعلانات</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> إضافة إعلان جديد
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    الرابط *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                  placeholder="وصف اختياري للإعلان"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    الموقع *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    {positions.map((pos) => (
                      <option key={pos.position_name} value={pos.position_name}>
                        {pos.display_name} ({pos.width}x{pos.height}px)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    الصورة
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    تاريخ ووقت النهاية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    سيتم إيقاف الإعلان تلقائياً في هذا التاريخ والوقت
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    تاريخ ووقت البداية (تلقائي)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    يتم تعيين تاريخ البداية تلقائياً للوقت الحالي
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-black">
                  نشط
                </label>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : (editingAd ? 'تحديث الإعلان' : 'إنشاء الإعلان')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    الإعلان
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    الموقع
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    الإحصائيات
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    التواريخ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {ad.image_path && (
                          <img
                            src={ad.image_path}
                            alt={ad.title}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ad.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {ad.url}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {positions.find((p: AdPosition) => p.position_name === ad.position)?.display_name || ad.position}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ad.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Clicks: {ad.clicks}</div>
                      <div>Views: {ad.impressions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        Start: {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div>
                        End: {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {ads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No ads found. Create your first ad to get started.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add authentication check here if needed
  return {
    props: {},
  };
};

export default AdsManagement;