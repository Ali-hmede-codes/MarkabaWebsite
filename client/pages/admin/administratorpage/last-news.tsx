import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';

interface LastNews {
  id: number;
  title_ar: string;
  content_ar: string;
  slug: string;
  priority: number;
  is_active: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

interface LastNewsFormData {
  title_ar: string;
  content_ar: string;
  priority: number;
  is_active: boolean;
}

const LastNewsAdmin: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [lastNews, setLastNews] = useState<LastNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LastNews | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const itemsPerPage = 8;
  const [formData, setFormData] = useState<LastNewsFormData>({
    title_ar: '',
    content_ar: '',
    priority: 1,
    is_active: true
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch last news
  const fetchLastNews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/administratorpage/last-news');
      
      if (data.success) {
        setLastNews(data.data);
      } else {
        toast.error(data.message || 'خطأ في جلب البيانات');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        router.push('/auth/login');
      } else {
        toast.error('خطأ في الاتصال بالخادم');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLastNews();
    }
  }, [isAuthenticated, fetchLastNews]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title_ar.trim()) {
      toast.error('عنوان الخبر مطلوب');
      return;
    }

    try {
      const endpoint = editingItem 
        ? `/admin/administratorpage/last-news/${editingItem.id}`
        : '/admin/administratorpage/last-news';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const data = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData),
      });
      
      if (data.success) {
        toast.success(data.message || (editingItem ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح'));
        setShowForm(false);
        setEditingItem(null);
        resetForm();
        fetchLastNews();
      } else {
        toast.error(data.message || 'حدث خطأ');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        router.push('/auth/login');
      } else {
        toast.error('خطأ في الاتصال بالخادم');
      }
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
      return;
    }

    try {
      const data = await apiRequest(`/admin/administratorpage/last-news/${id}`, {
        method: 'DELETE',
      });
      
      if (data.success) {
        toast.success(data.message || 'تم الحذف بنجاح');
        fetchLastNews();
      } else {
        toast.error(data.message || 'حدث خطأ في الحذف');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        router.push('/auth/login');
      } else {
        toast.error('خطأ في الاتصال بالخادم');
      }
    }
  };

  // Handle edit
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

  // Reset form
  const resetForm = () => {
    setFormData({
      title_ar: '',
      content_ar: '',
      priority: 1,
      is_active: true
    });
  };

  // Handle form cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  };

  // Filter and pagination logic
  const filteredNews = lastNews.filter(item => {
    const matchesSearch = item.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content_ar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && item.is_active) ||
                         (statusFilter === 'inactive' && !item.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = filteredNews.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">إدارة آخر الأخبار</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            
            <div className="text-sm text-gray-600 flex items-center">
              <FiFilter className="ml-2" />
              عرض {filteredNews.length} من {lastNews.length} عنصر
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingItem ? 'تعديل الخبر' : 'إضافة خبر جديد'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان الخبر *
                  </label>
                  <input
                    type="text"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    محتوى الخبر
                  </label>
                  <textarea
                    value={formData.content_ar}
                    onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الأولوية
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Last News List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {paginatedNews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filteredNews.length === 0 && lastNews.length > 0 ? 'لا توجد نتائج للبحث' : 'لا توجد أخبار حالياً'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                  {paginatedNews.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900" dir="rtl">
                          {item.title_ar}
                        </div>
                        {item.content_ar && (
                          <div className="text-sm text-gray-500 truncate max-w-xs" dir="rtl">
                            {item.content_ar}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.priority}
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
                        {item.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            حذف
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
          <div className="flex items-center justify-between bg-white px-6 py-3 border rounded-lg mt-4">
            <div className="text-sm text-gray-700">
              صفحة {currentPage} من {totalPages} - عرض {paginatedNews.length} من {filteredNews.length} عنصر
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                السابق
              </button>
              
              {/* Page numbers */}
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
    </AdminLayout>
  );
};

export default LastNewsAdmin;