'use client';

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserGroupIcon,
  GlobeAltIcon,
  ClockIcon,
  ShieldCheckIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import { useSettingsContext } from '@/context/SettingsContext';

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const { getSetting } = useSettingsContext();

  const aboutTitle = getSetting('about_us_title', theme.language);
  const aboutContent = getSetting('about_us_content', theme.language);

  const stats = [
    {
      icon: UserGroupIcon,
      value: '50K+',
      label: theme.language === 'ar' ? 'قارئ يومي' : 'Daily Readers'
    },
    {
      icon: GlobeAltIcon,
      value: '25+',
      label: theme.language === 'ar' ? 'دولة' : 'Countries'
    },
    {
      icon: ClockIcon,
      value: '24/7',
      label: theme.language === 'ar' ? 'تغطية مستمرة' : 'Continuous Coverage'
    },
    {
      icon: StarIcon,
      value: '1000+',
      label: theme.language === 'ar' ? 'مقال شهرياً' : 'Articles Monthly'
    }
  ];

  const values = [
    {
      icon: ShieldCheckIcon,
      title: theme.language === 'ar' ? 'المصداقية' : 'Credibility',
      description: theme.language === 'ar' 
        ? 'نلتزم بتقديم أخبار موثوقة ومدققة من مصادر معتمدة'
        : 'We are committed to providing reliable and verified news from trusted sources'
    },
    {
      icon: ClockIcon,
      title: theme.language === 'ar' ? 'السرعة' : 'Speed',
      description: theme.language === 'ar' 
        ? 'نحرص على تقديم الأخبار العاجلة بأسرع وقت ممكن'
        : 'We strive to deliver breaking news as quickly as possible'
    },
    {
      icon: GlobeAltIcon,
      title: theme.language === 'ar' ? 'الشمولية' : 'Comprehensive Coverage',
      description: theme.language === 'ar' 
        ? 'نغطي جميع المجالات من السياسة إلى الرياضة والتكنولوجيا'
        : 'We cover all areas from politics to sports and technology'
    },
    {
      icon: HeartIcon,
      title: theme.language === 'ar' ? 'خدمة المجتمع' : 'Community Service',
      description: theme.language === 'ar' 
        ? 'نهدف إلى خدمة المجتمع وتوعيته بأهم الأحداث والقضايا'
        : 'We aim to serve the community and raise awareness of important events and issues'
    }
  ];

  const team = [
    {
      name: theme.language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohammed',
      role: theme.language === 'ar' ? 'رئيس التحرير' : 'Editor-in-Chief',
      image: '/uploads/placeholder-news-1.svg',
      bio: theme.language === 'ar' 
        ? 'صحفي متخصص بخبرة تزيد عن 15 عاماً في مجال الإعلام'
        : 'Specialized journalist with over 15 years of experience in media'
    },
    {
      name: theme.language === 'ar' ? 'فاطمة علي' : 'Fatima Ali',
      role: theme.language === 'ar' ? 'محررة الأخبار السياسية' : 'Political News Editor',
      image: '/uploads/placeholder-news-2.svg',
      bio: theme.language === 'ar' 
        ? 'متخصصة في الشؤون السياسية والدولية'
        : 'Specialist in political and international affairs'
    },
    {
      name: theme.language === 'ar' ? 'محمد حسن' : 'Mohammed Hassan',
      role: theme.language === 'ar' ? 'محرر الأخبار الرياضية' : 'Sports News Editor',
      image: '/uploads/placeholder-news-3.svg',
      bio: theme.language === 'ar' 
        ? 'خبير في الأخبار الرياضية المحلية والعالمية'
        : 'Expert in local and international sports news'
    },
    {
      name: theme.language === 'ar' ? 'سارة أحمد' : 'Sara Ahmed',
      role: theme.language === 'ar' ? 'محررة التكنولوجيا' : 'Technology Editor',
      image: '/uploads/placeholder-news-4.svg',
      bio: theme.language === 'ar' 
        ? 'متخصصة في أخبار التكنولوجيا والابتكار'
        : 'Specialist in technology and innovation news'
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
      name: theme.language === 'ar' ? 'موقع الأخبار' : 'News Website',
      description: theme.language === 'ar' 
        ? 'موقع إخباري شامل يقدم أحدث الأخبار المحلية والعالمية'
        : 'Comprehensive news website providing the latest local and international news',
      foundingDate: '2020',
      employee: team.map(member => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role
      }))
    }
  };

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'عن الموقع - موقع الأخبار' : 'About Us - News Website'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'تعرف على موقع الأخبار، مهمتنا في تقديم أحدث الأخبار الموثوقة، قيمنا، وفريق العمل المتخصص'
            : 'Learn about News Website, our mission to deliver the latest reliable news, our values, and our specialized team'
          } 
        />
        <meta 
          name="keywords" 
          content={theme.language === 'ar' 
            ? 'عن الموقع، مهمتنا، قيمنا، فريق العمل، موقع الأخبار'
            : 'about us, our mission, our values, our team, news website'
          } 
        />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={theme.language === 'ar' ? 'عن الموقع - موقع الأخبار' : 'About Us - News Website'} 
        />
        <meta 
          property="og:description" 
          content={theme.language === 'ar' 
            ? 'تعرف على موقع الأخبار، مهمتنا في تقديم أحدث الأخبار الموثوقة، قيمنا، وفريق العمل المتخصص'
            : 'Learn about News Website, our mission to deliver the latest reliable news, our values, and our specialized team'
          } 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content={theme.language === 'ar' ? 'عن الموقع - موقع الأخبار' : 'About Us - News Website'} 
        />
        <meta 
          name="twitter:description" 
          content={theme.language === 'ar' 
            ? 'تعرف على موقع الأخبار، مهمتنا في تقديم أحدث الأخبار الموثوقة، قيمنا، وفريق العمل المتخصص'
            : 'Learn about News Website, our mission to deliver the latest reliable news, our values, and our specialized team'
          } 
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">
                {theme.language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">
              {theme.language === 'ar' ? 'عن الموقع' : 'About Us'}
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {aboutTitle || (theme.language === 'ar' ? 'عن موقع الأخبار' : 'About News Website')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {aboutContent || (theme.language === 'ar' 
              ? 'نحن موقع إخباري شامل يهدف إلى تقديم أحدث الأخبار المحلية والعالمية بمصداقية وموضوعية عالية، مع التركيز على خدمة المجتمع وتوعيته بأهم الأحداث والقضايا المعاصرة'
              : 'We are a comprehensive news website that aims to provide the latest local and international news with high credibility and objectivity, focusing on serving the community and raising awareness of the most important contemporary events and issues'
            )}
          </p>
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
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {theme.language === 'ar' ? 'مهمتنا' : 'Our Mission'}
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                {theme.language === 'ar' 
                  ? 'مهمتنا هي تقديم أخبار موثوقة ومتوازنة تساعد القراء على فهم العالم من حولهم واتخاذ قرارات مدروسة. نسعى لأن نكون المصدر الأول للأخبار في المنطقة من خلال الالتزام بأعلى معايير الصحافة المهنية والأخلاقية'
                  : 'Our mission is to provide reliable and balanced news that helps readers understand the world around them and make informed decisions. We strive to be the primary source of news in the region by adhering to the highest standards of professional and ethical journalism'
                }
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {theme.language === 'ar' ? 'رؤيتنا' : 'Our Vision'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {theme.language === 'ar' 
                      ? 'أن نكون المنصة الإخبارية الرائدة في المنطقة'
                      : 'To be the leading news platform in the region'
                    }
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {theme.language === 'ar' ? 'هدفنا' : 'Our Goal'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {theme.language === 'ar' 
                      ? 'تقديم محتوى إخباري عالي الجودة يخدم المجتمع'
                      : 'Providing high-quality news content that serves the community'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {theme.language === 'ar' ? 'قيمنا' : 'Our Values'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {theme.language === 'ar' 
                ? 'نؤمن بمجموعة من القيم الأساسية التي توجه عملنا وتحدد هويتنا'
                : 'We believe in a set of core values that guide our work and define our identity'
              }
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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {theme.language === 'ar' ? 'فريق العمل' : 'Our Team'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {theme.language === 'ar' 
                ? 'فريق من الصحفيين والمحررين المتخصصين يعملون بجد لتقديم أفضل المحتوى الإخباري'
                : 'A team of specialized journalists and editors working hard to deliver the best news content'
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-full flex items-center justify-center">
                    <UserGroupIcon className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {member.name}
                </h3>
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {theme.language === 'ar' ? 'تواصل معنا' : 'Get in Touch'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {theme.language === 'ar' 
              ? 'هل لديك خبر أو اقتراح؟ نحن نرحب بتواصلكم ونقدر آراءكم ومساهماتكم'
              : 'Do you have news or suggestions? We welcome your contact and appreciate your opinions and contributions'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {theme.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {theme.language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;