'use client';

/**
 * About Us Page - Dynamic Content Management
 * 
 * To edit content, modify the following objects in this file:
 * 1. aboutContent - Main page content (title, description, mission, etc.)
 * 2. stats - Statistics displayed on the page
 * 3. values - Company values section
 * 
 * Admin users are now fetched dynamically from the database.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserGroupIcon,
  GlobeAltIcon,
  ClockIcon,
  ShieldCheckIcon,
  HeartIcon,
  StarIcon,
  SparklesIcon,
  TrophyIcon,
  EyeIcon,
  CheckBadgeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import { useSettingsContext } from '@/context/SettingsContext';
import Layout from '../components/Layout/Layout';

// User interface for API data
interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: 'admin' | 'editor' | 'author';
  is_active: boolean;
  last_login: string | null;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const { getSetting } = useSettingsContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team');
        if (response.ok) {
          const data = await response.json();
          // Handle team members response structure
          const teamArray = data.data || data.team || data || [];
          setUsers(Array.isArray(teamArray) ? teamArray : []);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Editable Content - Easy to modify without database
  const aboutContent = {
    title: 'من نحن',
    description: 'نحن فريق من الصحفيين المتخصصين والمحررين المحترفين نسعى لتقديم أحدث الأخبار والتحليلات العميقة بمصداقية وشفافية عالية، مع التزامنا بالمعايير المهنية والأخلاقية في الصحافة',
    mission: 'نسعى إلى أن نكون المصدر الأول والأكثر موثوقية للأخبار في المنطقة، من خلال تقديم تغطية شاملة ومتوازنة للأحداث المحلية والعالمية، مع الحفاظ على أعلى معايير الجودة والمهنية في العمل الصحفي والالتزام بالحقيقة والشفافية',
    teamDescription: 'تعرف على الفريق المتخصص والمحترف الذي يعمل بجد وإخلاص لتقديم أفضل المحتوى الإخباري والتحليلات العميقة',
    contactDescription: 'نحن نقدر آراءكم واقتراحاتكم ونرحب بتواصلكم معنا. شاركونا أفكاركم وملاحظاتكم لنستمر في تطوير خدماتنا الإخبارية'
  };

  // Transform API users to display format
  const transformUserToAdmin = (user: User, index: number) => {
    const gradients = [
      'from-blue-600 to-purple-600',
      'from-green-600 to-teal-600',
      'from-orange-600 to-red-600',
      'from-purple-600 to-pink-600',
      'from-indigo-600 to-blue-600'
    ];

    const roleTranslations = {
      admin: 'مدير الموقع',
      editor: 'محرر',
      author: 'كاتب'
    };

    const permissions = {
      admin: ['إدارة المحتوى', 'إدارة المستخدمين', 'النشر والتحرير'],
      editor: ['تحرير المقالات', 'مراجعة المحتوى', 'إدارة الكتاب'],
      author: ['كتابة المقالات', 'إنشاء المحتوى']
    };

    return {
      id: user.id,
      name: user.display_name || user.username,
      role: roleTranslations[user.role] || user.role,
      isActive: user.is_active,
      permissions: permissions[user.role] || [],
      gradient: gradients[index % gradients.length],
      joinDate: new Date(user.created_at).toLocaleDateString('en-GB')
    };
  };

  // Filter active users and transform them
  const activeAdmins = users
    .filter(user => user.is_active)
    .map(transformUserToAdmin);

  // Arabic-only stats data
  const stats = [
    {
      icon: UserGroupIcon,
      value: '50K+',
      label: 'قارئ يومي',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: GlobeAltIcon,
      value: '25+',
      label: 'دولة',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: ClockIcon,
      value: '24/7',
      label: 'تغطية مستمرة',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: TrophyIcon,
      value: '1000+',
      label: 'مقال شهرياً',
      color: 'from-orange-500 to-red-500'
    }
  ];



  const values = [
    {
      icon: CheckBadgeIcon,
      title: 'المصداقية والثقة',
      description: 'نلتزم بتقديم أخبار موثوقة ومدققة من مصادر معتمدة مع الحفاظ على أعلى معايير الصحافة المهنية',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: SparklesIcon,
      title: 'السرعة والدقة',
      description: 'نحرص على تقديم الأخبار العاجلة بأسرع وقت ممكن مع ضمان دقة المعلومات وصحتها',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: EyeIcon,
      title: 'الشمولية والتنوع',
      description: 'نغطي جميع المجالات من السياسة والاقتصاد إلى الرياضة والتكنولوجيا والثقافة',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: HeartIcon,
      title: 'خدمة المجتمع',
      description: 'نهدف إلى خدمة المجتمع وتوعيته بأهم الأحداث والقضايا المعاصرة بموضوعية تامة',
      color: 'from-rose-500 to-orange-500'
    }
  ];



  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: theme.language === 'ar' ? 'عن موقع الأخبار' : 'About News Website',
    description: theme.language === 'ar' 
      ? 'تعرف على موقع الأخبار، مهمتنا، قيمنا، وفريق العمل المتخصص في تقديم أحدث الأخبار'
      : 'Learn about News Website, our mission, values, and specialized team dedicated to delivering the latest news',
    url: typeof window !== 'undefined' ? window.location.href : '',
    mainEntity: {
      '@type': 'Organization',
      name: 'نيوز مركبا',
      url: 'https://newsmarkaba.com',
      logo: 'https://newsmarkaba.com/logo.png',
      description: 'موقع إخباري يقدم آخر الأخبار المحلية والعالمية',
      foundingDate: '2020',
      employee: activeAdmins.map(admin => ({
        '@type': 'Person',
        name: admin.name,
        jobTitle: admin.role
      }))
    }
  };

  return (
    <Layout 
      pageType="about"
      seo={{
        title: 'عن الموقع - نيوز مركبا',
        description: 'تعرف على موقع نيوز مركبا، مهمتنا في تقديم أحدث الأخبار الموثوقة، قيمنا، وفريق العمل المتخصص',
        keywords: ['عن الموقع', 'مهمتنا', 'قيمنا', 'فريق العمل', 'نيوز مركبا', 'أخبار مركبا'],
        type: 'website',
        structuredData: structuredData
      }}
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">
                الرئيسية
              </Link>
            </li>
            <li>/</li>
            <li className="text-black dark:text-black">
              عن الموقع
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent break-words">
            {aboutContent.title}
          </h1>
          <p className="text-xl md:text-2xl text-black dark:text-black max-w-4xl mx-auto leading-relaxed">
            {aboutContent.description}
          </p>
          <div className="mt-8 flex justify-center space-x-4 rtl:space-x-reverse">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full"></div>
            <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                  <IconComponent className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-3xl font-bold text-black dark:text-black mb-2">
                  {stat.value}
                </div>
                <div className="text-black dark:text-black">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 dark:from-blue-800 dark:via-purple-800 dark:to-teal-800 rounded-3xl p-8 md:p-12 text-white mb-16 shadow-2xl">
          <div className="text-center relative">
            <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm"></div>
            <div className="relative z-10">
              <SparklesIcon className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                رسالتنا
              </h2>
              <p className="text-lg md:text-xl leading-relaxed max-w-4xl mx-auto">
                {aboutContent.mission}
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black dark:text-black mb-4">
              قيمنا
            </h2>
            <p className="text-lg text-black dark:text-black max-w-2xl mx-auto">
              نؤمن بمجموعة من القيم الأساسية التي توجه عملنا وتحدد هويتنا
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                    <IconComponent className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-black mb-3">
                    {value.title}
                  </h3>
                  <p className="text-black dark:text-black leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-black mb-4">
              فريق العمل
            </h2>
            <p className="text-lg text-black dark:text-black max-w-3xl mx-auto">
              {aboutContent.teamDescription}
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-black dark:text-black">جاري تحميل بيانات الفريق...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {activeAdmins.map((admin, index) => (
                <div key={admin.id} className="text-center group">
                  <div className={`relative mb-4 mx-auto w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br ${admin.gradient} group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                    <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-black mb-2">
                    {admin.name}
                  </h3>
                  <p className={`bg-gradient-to-r ${admin.gradient} bg-clip-text text-transparent font-medium mb-3 text-lg`}>
                    {admin.role}
                  </p>
                  <div className="text-black dark:text-black text-sm leading-relaxed mb-3">
                    <p className="mb-2">الصلاحيات:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {admin.permissions.map((permission, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-300 px-2 py-1 rounded-full text-xs text-black">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-black dark:text-black text-xs">انضم في: {admin.joinDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 rounded-3xl p-8 md:p-12 border border-blue-200 dark:border-blue-700 shadow-xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              تواصل معنا
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              {aboutContent.contactDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                تواصل معنا
              </Link>
              <Link
                href="mailto:info@newsmarkaba.com"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                راسلنا عبر البريد
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;