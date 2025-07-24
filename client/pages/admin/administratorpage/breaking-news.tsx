'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

type BreakingNews = {
  id: number;
  title_ar: string;
  content_ar: string;
  slug: string;
  link?: string;
  priority: number;
  is_active: boolean;
  views: number;
  created_at: string;
  updated_at: string;
};

type BreakingNewsFormData = {
  title_ar: string;
  content_ar: string;
  link: string;
  priority: number;
  is_active: boolean;
};

const BreakingNewsManagement: React.FC = () => {
  const { token } = useAuth();
  const [newsItems, setNewsItems] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BreakingNews | null>(null);
  const [formData, setFormData] = useState<BreakingNewsFormData>({
    title_ar: '',
    content_ar: '',
    link: '',
    priority: 1,
    is_active: true
  });

  useEffect(() => {
    fetchBreakingNews();
  }, []);

  const fetchBreakingNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/administratorpage/breaking-news', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNewsItems(data.data || []);
      } else {
        toast.error('فشل في تحميل الأخبار العاجلة');
      }
    } catch (error) {
      toast.error('خطأ في جلب الأخبار العاجلة');
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
        ? `/api/admin/administratorpage/breaking-news/${editingItem.id}`
        : '/api/admin/administratorpage/breaking-news';
      
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
        fetchBreakingNews();
        resetForm();
      } else {
        toast.error(data.message || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('خطأ في حفظ الخبر');
    }
  };

  const handleEdit = (item: BreakingNews) => {
    setEditingItem(item);
    setFormData({
      title_ar: item.title_ar,
      content_ar: item.content_ar,
      link: item.link || '',
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
      const response = await fetch(`/api/admin/administratorpage/breaking-news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('تم حذف الخبر بنجاح');
        fetchBreakingNews();
      } else {
        toast.error('فشل في حذف الخبر');
      }
    } catch (error) {
      toast.error('خطأ في حذف الخبر');
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/administratorpage/breaking-news/${id}`, {
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
        fetchBreakingNews();
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
      link: '',
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
      case 2: return 'مهم';
      case 3: return 'عاجل';
      case 4: return 'عاجل جداً';
      case 5: return 'طارئ';
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

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-500 ml-2" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">إدارة الأخبار العاجلة</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <FiPlus className="ml-2" />
            إضافة خبر عاجل
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
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            >
              <option value="all">جميع الأولويات</option>
              <option value="1">عادي</option>
              <option value="2">مهم</option>
              <option value="3">عاجل</option>
              <option value="4">عاجل جداً</option>
              <option value="5">طارئ</option>
            </select>
            
            <div className="text-sm text-gray-600 flex items-center">
              <FiFilter className="ml-1" />
              {filteredNews.length} من {newsItems.length} خبر
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'تعديل الخبر العاجل' : 'إضافة خبر عاجل جديد'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الخبر *
                  </label>
                  <input
                    type="text"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    محتوى الخبر
                  </label>
                  <textarea
                    value={formData.content_ar}
                    onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رابط الخبر (اختياري)
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    placeholder="https://example.com/news-article"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    >
                      <option value={1}>عادي</option>
                      <option value={2}>مهم</option>
                      <option value={3}>عاجل</option>
                      <option value={4}>عاجل جداً</option>
                      <option value={5}>طارئ</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحالة
                    </label>
                    <select
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    >
                      <option value="true">نشط</option>
                      <option value="false">غير نشط</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {editingItem ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* News List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiAlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>لا توجد أخبار عاجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العنوان
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
                        <div>
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
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                            item.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {item.is_active ? <FiEye className="ml-1" size={12} /> : <FiEyeOff className="ml-1" size={12} />}
                          {item.is_active ? 'نشط' : 'غير نشط'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('ar-SA')}
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

export default BreakingNewsManagement;