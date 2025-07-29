import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { SocialMedia } from '../../../types';


const SocialMediaManagement: React.FC = () => {
  const { user, token } = useAuth();
  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SocialMedia>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchSocialMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/social-media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSocialMediaList(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch social media');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Access denied');
      return;
    }
    fetchSocialMedia();
  }, [user, fetchSocialMedia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/social-media/${editingId}` : '/api/admin/social-media';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        fetchSocialMedia();
        setFormData({});
        setEditingId(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save social media');
    }
  };

  const handleEdit = (item: SocialMedia) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      try {
        const response = await fetch(`/api/admin/social-media/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          fetchSocialMedia();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-panel">
      <h1>Social Media Management</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Platform"
          value={formData.platform || ''}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Name (AR)"
          value={formData.name_ar || ''}
          onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
          required
        />
        <input
          type="url"
          placeholder="URL"
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Icon"
          value={formData.icon || ''}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
        />
        <input
          type="color"
          value={formData.color || '#000000'}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
        />
        <input
          type="number"
          placeholder="Sort Order"
          value={formData.sort_order || 0}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
        />
        <label>
          Active:
          <input
            type="checkbox"
            checked={!!formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
          />
        </label>
        <button type="submit">{editingId ? 'Update' : 'Add'}</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Name (AR)</th>
            <th>URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {socialMediaList.map((item) => (
            <tr key={item.id}>
              <td>{item.platform}</td>
              <td>{item.name_ar}</td>
              <td>{item.url}</td>
              <td>
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SocialMediaManagement;