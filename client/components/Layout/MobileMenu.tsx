'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HomeIcon,
  NewspaperIcon,
  TagIcon,
  PhoneIcon,
  InformationCircleIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useTheme, useThemeValues } from '../../context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import type { Category } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, categories }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { theme, setLanguage, toggleMode } = useTheme();
  const { isRTL } = useThemeValues();
  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    router.push('/');
  };

  const menuItems = [
    {
      id: 'home',
      title: theme.language === 'ar' ? 'الرئيسية' : 'Home',
      href: '/',
      icon: HomeIcon
    },
    {
      id: 'categories',
      title: theme.language === 'ar' ? 'الأقسام' : 'Categories',
      icon: TagIcon,
      expandable: true,
      children: categories.map(category => ({
        title: category.name_ar,
        href: `/category/${category.slug}`
      }))
    },
    {
      id: 'latest',
      title: theme.language === 'ar' ? 'آخر الأخبار' : 'Latest News',
      href: '/latest',
      icon: NewspaperIcon
    },
    {
      id: 'about',
      title: theme.language === 'ar' ? 'من نحن' : 'About Us',
      href: '/about',
      icon: InformationCircleIcon
    },
    {
      id: 'contact',
      title: theme.language === 'ar' ? 'اتصل بنا' : 'Contact Us',
      href: '/contact',
      icon: PhoneIcon
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 max-w-sm bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {theme.language === 'ar' ? 'القائمة' : 'Menu'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* User Section */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isExpanded = expandedSections.includes(item.id);
              const Icon = item.icon;
              
              return (
                <li key={item.id}>
                  {item.expandable ? (
                    <>
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="flex items-center justify-between w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                      
                      {isExpanded && item.children && (
                        <ul className="bg-gray-50 dark:bg-gray-800">
                          {item.children.map((child, index) => (
                            <li key={index}>
                              <Link
                                href={child.href}
                                onClick={handleLinkClick}
                                className="block px-8 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={handleLinkClick}
                      className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings & Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleMode}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span>{theme.language === 'ar' ? 'الوضع المظلم' : 'Dark Mode'}</span>
            <div className={`w-10 h-6 rounded-full transition-colors ${
              theme.mode === 'dark' ? 'bg-primary-500' : 'bg-gray-300'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                theme.mode === 'dark' 
                  ? (isRTL ? 'translate-x-1' : 'translate-x-5') 
                  : (isRTL ? 'translate-x-5' : 'translate-x-1')
              }`} />
            </div>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(theme.language === 'ar' ? 'en' : 'ar')}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span>{theme.language === 'ar' ? 'اللغة' : 'Language'}</span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              {theme.language === 'ar' ? 'العربية' : 'English'}
            </span>
          </button>

          {/* Admin Panel (if user is admin) */}
          {user && user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={handleLinkClick}
              className="flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              <span>{theme.language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}</span>
            </Link>
          )}

          {/* Auth Actions */}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>{theme.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              onClick={handleLinkClick}
              className="flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span>{theme.language === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;