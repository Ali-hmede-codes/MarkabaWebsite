'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import AdminNav from '../../components/admin/AdminNav';
import { FiFileText, FiFolder, FiUsers, FiEye, FiTrendingUp, FiImage } from 'react-icons/fi';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  featuredPosts: number;
  totalCategories: number;
  totalViews: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    featuredPosts: 0,
    totalCategories: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch posts stats
      const postsResponse = await fetch('/api/posts?limit=1000');
      const postsData = await postsResponse.json();
      
      if (postsData.success) {
        const posts = postsData.data.posts || [];
        const publishedPosts = posts.filter((post: any) => post.is_published).length;
        const draftPosts = posts.filter((post: any) => !post.is_published).length;
        const featuredPosts = posts.filter((post: any) => post.is_featured).length;
        const totalViews = posts.reduce((sum: number, post: any) => sum + (post.views || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalPosts: posts.length,
          publishedPosts,
          draftPosts,
          featuredPosts,
          totalViews
        }));
      }
      
      // Fetch categories stats
      const categoriesResponse = await fetch('/api/categories');
      const categoriesData = await categoriesResponse.json();
      
      if (categoriesData.success) {
        setStats(prev => ({
          ...prev,
          totalCategories: categoriesData.data?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      link: '/admin/posts'
    },
    {
      title: 'المقالات المنشورة',
      value: stats.publishedPosts,
      icon: FiEye,
      color: 'bg-green-500',
      link: '/admin/posts?status=published'
    },
    {
      title: 'المسودات',
      value: stats.draftPosts,
      icon: FiFileText,
      color: 'bg-yellow-500',
      link: '/admin/posts?status=draft'
    },
    {
      title: 'المقالات المميزة',
      value: stats.featuredPosts,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      link: '/admin/posts?featured=true'
    },
    {
      title: 'التصنيفات',
      value: stats.totalCategories,
      icon: FiFolder,
      color: 'bg-indigo-500',
      link: '/admin/categories'
    },
    {
      title: 'إجمالي المشاهدات',
      value: stats.totalViews.toLocaleString('ar-SA'),
      icon: FiEye,
      color: 'bg-red-500',
      link: '/admin/posts'
    }
  ];

  const quickActions = [
    {
      title: 'إنشاء مقال جديد',
      description: 'أضف مقالاً جديداً إلى الموقع',
      icon: FiFileText,
      link: '/admin/posts',
      color: 'bg-blue-600'
    },
    {
      title: 'إدارة التصنيفات',
      description: 'إضافة وتعديل تصنيفات المقالات',
      icon: FiFolder,
      link: '/admin/categories',
      color: 'bg-green-600'
    },
    {
      title: 'رفع الوسائط',
      description: 'رفع الصور والملفات',
      icon: FiImage,
      link: '/admin/media',
      color: 'bg-purple-600'
    }
  ];

  return (
    <Layout>
      <Head>
        <title>لوحة التحكم - نيوز مركبة</title>
      </Head>
      
      <AdminNav />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-600 mt-2">مرحباً بك في لوحة تحكم نيوز مركبة</p>
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
    </Layout>
  );
};

export default AdminDashboard;