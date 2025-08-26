'use client';

import React from 'react';
import Link from 'next/link';
import {
  MegaphoneIcon,
  UsersIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import Layout from '../components/Layout/Layout';

const AdvertisePage: React.FC = () => {
  const { theme } = useTheme();

  const advertisingFeatures = [
    {
      icon: ChartBarIcon,
      title: 'وصول واسع النطاق',
      description: 'منصات الأخبار تستقطب قرابة +50 الف زائر شهرياً، مما يمنح علامتك التجارية فرصة ذهبية للظهور أمام جمهور متفاعل وواع',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'خيارات مرنة تناسب جميع الميزانيات',
      description: 'سواء كنت شركة كبرى تسعى لتعزيز حضورها أو مشروعاً ناشئاً يتطلع للانتشار، نوفر لك حلولاً إعلانية متنوعة ومخصصة حسب احتياجاتك',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: LightBulbIcon,
      title: 'أفكار إبداعية لحملات مؤثرة',
      description: 'نحن لا نقدم مجرد مساحة إعلانية، بل نبني معك حملات مبتكرة تحقق التأثير وتحدث فرقاً حقيقياً في السوق',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const contactInfo = [
    {
      icon: 'phone',
      title: 'هاتف',
      value: '78 875 636',
      link: 'tel:+96178875636'
    },
    {
      icon: 'email',
      title: 'البريد الإلكتروني',
      value: 'markabachannel154@gmail.com',
      link: 'mailto:markabachannel154@gmail.com'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'للإعلان معنا - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
    description: 'انضم إلى شركائنا الإعلانيين واستفد من وصولنا الواسع لأكثر من 50 ألف زائر شهرياً',
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
      pageType="advertise"
      seo={{
        title: 'للإعلان معنا - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
        description: 'انضم إلى شركائنا الإعلانيين واستفد من وصولنا الواسع لأكثر من 50 ألف زائر شهرياً',
        keywords: ['إعلان', 'مـركـبـا', 'الـمـنـصـة الاخـبـاريـة', 'تسويق', 'شراكة إعلانية'],
        type: 'website',
        structuredData
      }}
    >
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8 shadow-2xl">
              <MegaphoneIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6">
              للإعلان معنا
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 max-w-4xl mx-auto leading-relaxed">
              انضم إلى شركائنا الإعلانيين واستفد من وصولنا الواسع لأكثر من 50 ألف زائر شهرياً
            </p>
          </div>

          {/* Contact Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {contactInfo.map((item, index) => (
              <a
                key={index}
                href={item.link}
                className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="flex-shrink-0">
                    {item.icon === 'phone' ? (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-800 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {item.value}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Advertising Features */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                لماذا تختار الإعلان معنا؟
              </h2>
              <p className="text-lg text-gray-800 max-w-2xl mx-auto">
                نقدم لك منصة إعلانية متميزة تضمن وصول رسالتك إلى الجمهور المناسب
              </p>
            </div>
            
            <div className="grid md:grid-cols-1 gap-8">
              {advertisingFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start space-x-6 rtl:space-x-reverse">
                      <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          {feature.title}
                        </h3>
                        <p className="text-lg text-gray-800 dark:text-gray-300 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ابدأ رحلتك الإعلانية معنا اليوم
              </h2>
              <p className="text-lg md:text-xl mb-8 leading-relaxed opacity-90">
                تواصل معنا الآن لمناقشة احتياجاتك الإعلانية والحصول على عرض مخصص يناسب ميزانيتك
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:markabachannel154@gmail.com"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-blue-700 bg-white hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  راسلنا الآن
                </a>
                <a
                  href="tel:+96178875636"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-white bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  اتصل بنا
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvertisePage;