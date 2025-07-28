'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiEye, FiEyeOff, FiClock, FiSave, FiX } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

type LastNews = {
  id: number;
  title_ar: string;
  content_ar: string;
  slug: string;
  priority: number;
  is_active: boolean;
  views: number;
  created_at: string;
  updated_at: string;
};

type LastNewsFormData = {
  title_ar: string;
  content_ar: string;
  priority: number;
  is_active: boolean;
};

const LastNewsManagement: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/admin/administratorpage/login');
      return;
    }
  }, [token, router]);

  const [newsItems, setNewsItems] = useState<LastNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LastNews | null>(null);
  const [formData, setFormData] = useState<LastNewsFormData>({
    title_ar: '',
    content_ar: '',
    priority: 1,
    is_active: true
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/administratorpage/last-news', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNewsItems(data.data || []);
      } else {
        toast.error('فشل في تحميل آخر الأخبار');
      }
    } catch (error) {
      toast.error('خطأ في جلب آخر الأخبار');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title_ar.trim()) {
      toast.error('عنوان الخبر مطلوب');
      return;
    }

    try {
      const url = editingItem 
        ? `/admin/administratorpage/last-news/${editingItem.id}`
        : '/admin/administratorpage/last-news';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingItem ? 'تم تحديث الخبر بنجاح' : 'تم إضافة الخبر بنجاح');
        fetchNews();
        resetForm();
      } else {
        toast.error(data.message || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('خطأ في حفظ الخبر');
    }
  };

  const handleEdit = (item: LastNews) => {
    setEditingItem(item);
    setFormData({
      title_ar: item.title_ar,
      content_ar: item.content_ar,
      priority: item.priority,
      is_active: item.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
      return;
    }

    try {
      const response = await fetch(`/admin/administratorpage/last-news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('تم حذف الخبر بنجاح');
        fetchNews();
      } else {
        toast.error('فشل في حذف الخبر');
      }
    } catch (error) {
      toast.error('خطأ في حذف الخبر');
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/admin/administratorpage/last-news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('تم تحديث حالة الخبر');
        fetchNews();
      } else {
        toast.error('فشل في تحديث حالة الخبر');
      }
    } catch (error) {
      toast.error('خطأ في تحديث حالة الخبر');
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: '',
      content_ar: '',
      priority: 1,
      is_active: true
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const filteredNews = newsItems.filter(item => {
    const matchesSearch = item.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content_ar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && item.is_active) ||
                         (statusFilter === 'inactive' && !item.is_active);
    const matchesPriority = priorityFilter === 'all' || item.priority.toString() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'عادي';
      case 2: return 'متوسط';
      case 3: return 'عالي';
      case 4: return 'عاجل';
      case 5: return 'هام جداً';
      default: return 'عادي';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FiClock className="text-blue-500 ml-2" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">إدارة آخر الأخبار</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <FiPlus className="ml-2" />
            إضافة خبر جديد
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الأخبار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الأولويات</option>
              <option value="1">عادي</option>
              <option value="2">متوسط</option>
              <option value="3">عالي</option>
              <option value="4">عاجل</option>
              <option value="5">هام جداً</option>
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <FiFilter className="ml-1" />
              {filteredNews.length} من {newsItems.length} خبر
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'تعديل الخبر' : 'إضافة خبر جديد'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المحتوى *
                  </label>
                  <textarea
                    value={formData.content_ar}
                    onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأولوية
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>عادي</option>
                      <option value={2}>متوسط</option>
                      <option value={3}>عالي</option>
                      <option value={4}>عاجل</option>
                      <option value={5}>هام جداً</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحالة
                    </label>
                    <select
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">نشط</option>
                      <option value="false">غير نشط</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FiSave className="ml-2" />
                    {editingItem ? 'تحديث' : 'حفظ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* News Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">جاري التحميل...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiClock size={48} className="mx-auto mb-4 text-gray-300" />
              <p>لا توجد أخبار متاحة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الخبر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الأولوية
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
                  {filteredNews.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.title_ar}
                          </div>
                          {item.content_ar && (
                            <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {item.content_ar}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(item.id, item.is_active)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.is_active ? (
                            <>
                              <FiEye className="ml-1" size={12} />
                              نشط
                            </>
                          ) : (
                            <>
                              <FiEyeOff className="ml-1" size={12} />
                              غير نشط
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.views || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="تعديل"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
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
    </AdminLayout>
  );
};

export default LastNewsManagement;