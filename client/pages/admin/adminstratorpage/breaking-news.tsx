'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

type BreakingNews = {
  id: number;
  title_ar: string;
  content_ar: string;
  is_active: boolean;
  priority: number;
  views: number;
  created_at: string;
};

const BreakingNewsManagement: React.FC = () => {
  const { token } = useAuth();
  const [newsItems, setNewsItems] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/breaking-news', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNewsItems(data.data || []);
      } else {
        toast.error('Failed to load breaking news');
      }
    } catch (error) {
      toast.error('Error fetching breaking news');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/breaking-news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Deleted successfully');
        fetchNews();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Error deleting');
    }
  };

  // Add similar functions for create and update

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Manage Breaking News</h1>
        {/* Add form, table, etc. similar to users.tsx */}
      </div>
    </AdminLayout>
  );
};

export default BreakingNewsManagement;