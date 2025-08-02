'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiFileText, FiFolder, FiUsers, FiSettings, FiShare2, FiAlertTriangle, FiClock, FiBarChart } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface AdminNavProps {
  className?: string;
}

const AdminNav: React.FC<AdminNavProps> = ({ className = '' }) => {
  const router = useRouter();
  const { logout, user } = useAuth();
  
  // Define all navigation items with role requirements
  const allNavItems = [
    {
      href: '/admin/administratorpage',
      label: 'لوحة التحكم',
      icon: FiHome,
      active: router.pathname === '/admin/administratorpage',
      roles: ['admin', 'editor', 'author'] // Available to all roles
    },
    {
      href: '/admin/administratorpage/posts',
      label: 'المقالات',
      icon: FiFileText,
      active: router.pathname === '/admin/administratorpage/posts',
      roles: ['admin', 'editor', 'author'] // Available to all roles
    },
    {
      href: '/admin/administratorpage/categories',
      label: 'التصنيفات',
      icon: FiFolder,
      active: router.pathname === '/admin/administratorpage/categories',
      roles: ['admin'] // Only admin can manage categories
    },
    {
      href: '/admin/administratorpage/breaking-news',
      label: 'الأخبار العاجلة',
      icon: FiAlertTriangle,
      active: router.pathname === '/admin/administratorpage/breaking-news',
      roles: ['admin', 'editor', 'author'] // Available to all roles
    },
    {
      href: '/admin/administratorpage/last-news',
      label: 'آخر الأخبار',
      icon: FiClock,
      active: router.pathname === '/admin/administratorpage/last-news',
      roles: ['admin', 'editor', 'author'] // Available to all roles
    },
    {
      href: '/admin/administratorpage/users',
      label: 'المستخدمون',
      icon: FiUsers,
      active: router.pathname === '/admin/administratorpage/users',
      roles: ['admin'] // Only admin can manage users
    },
    {
      href: '/admin/administratorpage/settings',
      label: 'الإعدادات',
      icon: FiSettings,
      active: router.pathname === '/admin/administratorpage/settings',
      roles: ['admin'] // Only admin can access settings
    },
    {
      href: '/admin/administratorpage/social-media',
      label: 'وسائل التواصل الاجتماعي',
      icon: FiShare2,
      active: router.pathname === '/admin/administratorpage/social-media',
      roles: ['admin']
    },
    {
      href: '/admin/administratorpage/analytics',
      label: 'تحليلات الموقع',
      icon: FiBarChart,
      active: router.pathname === '/admin/administratorpage/analytics',
      roles: ['admin'] // Only admin can view analytics
    }
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <nav className={`bg-white shadow-lg border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar */}
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link 
              href="/" 
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FiHome className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block">نيوز مركبا - الإدارة</span>
              <span className="sm:hidden">الإدارة</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-50 rounded-full p-1">
              {navItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      item.active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Icon size={16} className="ml-2" />
                    <span className="hidden xl:block">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* More items dropdown for remaining items */}
              {navItems.length > 6 && (
                <div className="relative group">
                  <button className="flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all duration-200">
                    <span>المزيد</span>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[220px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {navItems.slice(6).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            item.active
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Icon size={16} className="ml-2" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3 rtl:space-x-reverse">
            <Link
              href="/"
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>عرض الموقع</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>خروج</span>
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button 
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-admin-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div id="mobile-admin-menu" className="lg:hidden hidden border-t border-gray-200">
          <div className="py-4 space-y-2">
            {/* Navigation Items */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl mx-2 text-sm font-medium transition-all duration-200 ${
                      item.active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Icon size={18} className="ml-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-1">
              <Link
                href="/"
                className="flex items-center px-4 py-3 rounded-xl mx-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                عرض الموقع
              </Link>
              <button 
                onClick={logout}
                className="flex items-center w-full px-4 py-3 rounded-xl mx-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
