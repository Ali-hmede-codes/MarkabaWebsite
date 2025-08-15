import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../../components/Layout/AdminLayout';
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
    width: '',
    height: '',
    start_date: '',
    end_date: '',
    is_active: true,
    image: null as File | null
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const positionOptions = [
    { value: 'main_top', label: 'Main Top' },
    { value: 'main_middle', label: 'Main Middle' },
    { value: 'main_bottom', label: 'Main Bottom' },
    { value: 'sidebar_top', label: 'Sidebar Top' },
    { value: 'sidebar_middle', label: 'Sidebar Middle' },
    { value: 'sidebar_bottom', label: 'Sidebar Bottom' }
  ];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ads');
      const result = await response.json();
      
      if (result.success) {
        setAds(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch ads');
        console.error('Failed to fetch ads:', result.message);
      }
    } catch (error) {
      setError('Network error occurred while fetching ads');
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      formDataToSend.append('url', formData.url);
      formDataToSend.append('position', formData.position);
      if (formData.width) {
        formDataToSend.append('width', formData.width);
      }
      if (formData.height) {
        formDataToSend.append('height', formData.height);
      }
      if (formData.start_date) {
        formDataToSend.append('start_date', formData.start_date);
      }
      if (formData.end_date) {
        formDataToSend.append('end_date', formData.end_date);
      }
      formDataToSend.append('is_active', formData.is_active.toString());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingAd) {
        formDataToSend.append('id', editingAd.id.toString());
        formDataToSend.append('current_image', editingAd.image_path || '');
      }

      const url = editingAd ? '/api/admin/ads' : '/api/admin/ads';
      const method = editingAd ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      url: ad.url || '',
      position: ad.position || 'main_top',
      width: ad.width?.toString() || '',
      height: ad.height?.toString() || '',
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
      is_active: ad.is_active ?? true,
      image: null
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ads?id=${id}`, {
        method: 'DELETE'
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
    setFormData({
      title: '',
      description: '',
      url: '',
      position: 'main_top',
      width: '',
      height: '',
      start_date: '',
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
          <div className="text-lg">Loading ads...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Ads Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Add New Ad
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAd ? 'Edit Ad' : 'Add New Ad'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description for the ad"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {positionOptions.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingAd ? 'Update Ad' : 'Create Ad')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                          {positionOptions.find(p => p.value === ad.position)?.label || ad.position}
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