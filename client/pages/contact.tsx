'use client';

import React from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  SparklesIcon,
  HeartIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import Layout from '../components/Layout/Layout';

const ContactPage: React.FC = () => {
  const { theme } = useTheme();

  const contactInfo = [
    {
      icon: PhoneIcon,
      title: 'هاتف',
      value: '78 875 636',
      link: 'tel:+96178 875 636',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: EnvelopeIcon,
      title: 'البريد الإلكتروني',
      value: 'markabachannel154@gmail.com',
      link: 'mailto:markabachannel154@gmail.com',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'تواصل معنا - مـركـبـا',
    description: 'تواصل مع فريق مـركـبـا - الـمـنـصـة الاخـبـاريـة للاستفسارات والملاحظات',
    url: typeof window !== 'undefined' ? window.location.href : '',
    mainEntity: {
      '@type': 'Organization',
      name: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      email: 'markabachannel154@gmail.com',
      telephone: '78 875 636'
    }
  };

  return (
    <Layout 
      pageType="contact"
      seo={{
        title: 'تواصل معنا - مـركـبـا',
        description: 'تواصل مع فريق مـركـبـا - الـمـنـصـة الاخـبـاريـة للاستفسارات والملاحظات',
        keywords: ['تواصل معنا', 'مـركـبـا', 'الـمـنـصـة الاخـبـاريـة', 'استفسارات', 'ملاحظات'],
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
              تواصل معنا
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent break-words">
            تواصل معنا
          </h1>
          <p className="text-xl md:text-2xl text-black dark:text-black max-w-4xl mx-auto leading-relaxed">
            لا تتردد في التواصل مع فريق مـركـبـا - الـمـنـصـة الاخـبـاريـة لأي استفسارات أو ملاحظات، وذلك عبر وسائل الاتصال التالية الموضحة أدناه.
          </p>
          <div className="mt-8 flex justify-center space-x-4 rtl:space-x-reverse">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full"></div>
            <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
          </div>
        </div>

        {/* Contact Information Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {contactInfo.map((info, index) => {
            const IconComponent = info.icon;
            return (
              <div key={index} className="text-center group">
                <div className={`relative mb-6 mx-auto w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br ${info.color} group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-black dark:text-black mb-3">
                  {info.title}
                </h3>
                <a 
                  href={info.link}
                  className={`text-lg bg-gradient-to-r ${info.color} bg-clip-text text-transparent font-medium hover:underline transition-all duration-300`}
                >
                  {info.value}
                </a>
              </div>
            );
          })}
        </div>


      </div>
    </Layout>
  );
};

export default ContactPage;