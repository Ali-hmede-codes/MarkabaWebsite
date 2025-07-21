'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FiFileText, FiFolder, FiUsers, FiEye, FiTrendingUp, FiImage } from 'react-icons/fi';
import { useAuth, withAuth } from '../../../context/AuthContext';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  featuredPosts: number;
  totalCategories: number;
  totalViews: number;
  totalUsers: number;
  activeUsers: number;
  recentPosts: number;
}

interface RecentPost {
  id: number;
  title: string;
  status: string;
  created_at: string;
  author: string;
  category: string;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    featuredPosts: 0,
    totalCategories: 0,
    totalViews: 0,
    totalUsers: 0,
    activeUsers: 0,
    recentPosts: 0
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (!token) {
        router.push('/admin/adminstratorpage/login');
        return;
      }
      const response = await fetch('/api/admin/adminstratorpage/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats({
            totalPosts: data.data.totals.posts || 0,
            totalCategories: data.data.totals.categories || 0,
            totalUsers: data.data.totals.users || 0,
            publishedPosts: data.data.totals.published_posts || 0,
            draftPosts: data.data.totals.draft_posts || 0,
            featuredPosts: data.data.totals.featured_posts || 0,
            totalViews: data.data.totals.total_views || 0,
            activeUsers: data.data.totals.active_users || 0,
            recentPosts: data.data.totals.recent_posts || 0
          });
          
          // Set recent activity
          if (data.data.recent_activity) {
            setRecentPosts(data.data.recent_activity);
          }
        }
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('خطأ في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي المقالات',
      value: stats.totalPosts,
      icon: FiFileText,
      color: 'bg-blue-500',
      link: '/admin/adminstratorpage/posts'
    },
    {
      title: 'المقالات المنشورة',
      value: stats.publishedPosts,
      icon: FiEye,
      color: 'bg-green-500',
      link: '/admin/adminstratorpage/posts?status=published'
    },
    {
      title: 'المسودات',
      value: stats.draftPosts,
      icon: FiFileText,
      color: 'bg-yellow-500',
      link: '/admin/adminstratorpage/posts?status=draft'
    },
    {
      title: 'المقالات المميزة',
      value: stats.featuredPosts,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      link: '/admin/adminstratorpage/posts?featured=true'
    },
    {
      title: 'التصنيفات',
      value: stats.totalCategories,
      icon: FiFolder,
      color: 'bg-indigo-500',
      link: '/admin/adminstratorpage/categories'
    },
    {
      title: 'إجمالي المشاهدات',
      value: stats.totalViews.toLocaleString('ar-SA'),
      icon: FiEye,
      color: 'bg-red-500',
      link: '/admin/adminstratorpage/posts'
    },
    {
      title: 'المستخدمين',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'bg-pink-500',
      link: '/admin/adminstratorpage/users'
    },
    {
      title: 'مقالات حديثة',
      value: stats.recentPosts,
      icon: FiTrendingUp,
      color: 'bg-orange-500',
      link: '/admin/adminstratorpage/posts'
    }
  ];

  const quickActions = [
    {
      title: 'إنشاء مقال جديد',
      description: 'أضف مقالاً جديداً إلى الموقع',
      icon: FiFileText,
      link: '/admin/adminstratorpage/posts',
      color: 'bg-blue-600'
    },
    {
      title: 'إدارة التصنيفات',
      description: 'إضافة وتعديل تصنيفات المقالات',
      icon: FiFolder,
      link: '/admin/adminstratorpage/categories',
      color: 'bg-green-600'
    },
    
  ];

  return (
    <AdminLayout title="لوحة التحكم" description="لوحة تحكم إدارة الموقع">
      <Head>
        <title>لوحة التحكم - مركبا</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-600 mt-2">مرحباً بك في لوحة تحكم منصة مركبا</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link key={index} href={card.link}>
                  <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {loading ? '...' : card.value}
                        </p>
                      </div>
                      <div className={`${card.color} p-3 rounded-lg`}>
                        <Icon className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.link}>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className={`${action.color} p-2 rounded-lg`}>
                          <Icon className="text-white" size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">{action.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          {recentPosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">النشاط الأخير</h2>
              <div className="space-y-3">
                {recentPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{post.title}</h3>
                      <p className="text-sm text-gray-600">
                        {post.category} • {post.author} • {new Date(post.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Storage Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">معلومات تخزين الصور</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h4 className="font-semibold mb-2">مجلدات التخزين:</h4>
                <ul className="space-y-1">
                  <li><strong>صور المقالات:</strong> /uploads/posts/</li>
                  <li><strong>صور التصنيفات:</strong> /uploads/categories/</li>
                  <li><strong>الصور العامة:</strong> /uploads/general/</li>
                  <li><strong>صور الأخبار العاجلة:</strong> /uploads/breaking_news/</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">معلومات الرفع:</h4>
                <ul className="space-y-1">
                  <li><strong>أنواع الملفات المدعومة:</strong> JPG, PNG, GIF, WebP</li>
                  <li><strong>الحد الأقصى لحجم الملف:</strong> 10 ميجابايت</li>
                  <li><strong>الأبعاد المفضلة:</strong> 1200x630 بكسل</li>
                  <li><strong>نسبة العرض إلى الارتفاع:</strong> 16:9 أو 4:3</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminDashboard, 'admin');