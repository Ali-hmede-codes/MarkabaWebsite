'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/Layout/AdminLayout';
import Analytics from '../../../components/admin/Analytics';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AnalyticsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      toast.error('غير مصرح لك بالوصول إلى هذه الصفحة');
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <AdminLayout title="تحليلات الموقع">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout 
      title="تحليلات الموقع" 
      description="إحصائيات زوار الموقع ومشاهدات الصفحات"
    >
      <Analytics />
    </AdminLayout>
  );
};

export default AnalyticsPage;