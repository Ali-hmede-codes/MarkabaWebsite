'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiFileText, FiFolder, FiUsers, FiSettings, FiImage, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface AdminNavProps {
  className?: string;
}

const AdminNav: React.FC<AdminNavProps> = ({ className = '' }) => {
  const router = useRouter();
  const { logout } = useAuth();
  
  const navItems = [
    {
      href: '/admin/administratorpage',
      label: 'لوحة التحكم',
      icon: FiHome,
      active: router.pathname === '/admin/administratorpage'
    },
    {
      href: '/admin/administratorpage/posts',
      label: 'المقالات',
      icon: FiFileText,
      active: router.pathname === '/admin/administratorpage/posts'
    },
    {
      href: '/admin/administratorpage/categories',
      label: 'التصنيفات',
      icon: FiFolder,
      active: router.pathname === '/admin/administratorpage/categories'
    },
    {
      href: '/admin/administratorpage/breaking-news',
      label: 'الأخبار العاجلة',
      icon: FiAlertTriangle, // Add appropriate icon
      active: router.pathname === '/admin/administratorpage/breaking-news'
    },
    {
      href: '/admin/administratorpage/last-news',
      label: 'آخر الأخبار',
      icon: FiClock, // Add appropriate icon
      active: router.pathname === '/admin/administratorpage/last-news'
    },
    {
      href: '/admin/administratorpage/users',
      label: 'المستخدمون',
      icon: FiUsers,
      active: router.pathname === '/admin/administratorpage/users'
    },
    {
      href: '/admin/administratorpage/settings',
      label: 'الإعدادات',
      icon: FiSettings,
      active: router.pathname === '/admin/administratorpage/settings'
    }
  ];

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 ml-8">
              نيوز مركبة - الإدارة
            </Link>
            
            <div className="hidden md:flex space-x-8 space-x-reverse">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className="ml-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              عرض الموقع
            </Link>
            <button 
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} className="ml-1" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
