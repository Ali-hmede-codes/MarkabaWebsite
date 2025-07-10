'use client';

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

const PrivacyPolicyPage: React.FC = () => {
  const { theme } = useTheme();

  const lastUpdated = '2024-01-15';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: theme.language === 'ar' ? 'سياسة الخصوصية - موقع الأخبار' : 'Privacy Policy - News Website',
    description: theme.language === 'ar' 
      ? 'سياسة الخصوصية الخاصة بموقع الأخبار وكيفية حماية بياناتكم الشخصية'
      : 'Privacy policy for News Website and how we protect your personal data',
    url: typeof window !== 'undefined' ? window.location.href : '',
    dateModified: lastUpdated,
    publisher: {
      '@type': 'Organization',
      name: theme.language === 'ar' ? 'موقع الأخبار' : 'News Website'
    }
  };

  const sections = [
    {
      id: 'information-collection',
      title: theme.language === 'ar' ? 'جمع المعلومات' : 'Information Collection',
      content: theme.language === 'ar' 
        ? [
            'نحن نجمع المعلومات التي تقدمونها لنا مباشرة عند:',
            '• إنشاء حساب على موقعنا',
            '• الاشتراك في النشرة الإخبارية',
            '• التعليق على المقالات',
            '• التواصل معنا عبر نماذج الاتصال',
            '• المشاركة في الاستطلاعات أو المسابقات',
            '',
            'المعلومات التي نجمعها تشمل:',
            '• الاسم والبريد الإلكتروني',
            '• معلومات الملف الشخصي',
            '• تفضيلات القراءة والاهتمامات',
            '• عنوان IP وبيانات الجهاز',
            '• ملفات تعريف الارتباط وتقنيات التتبع المماثلة'
          ]
        : [
            'We collect information you provide to us directly when you:',
            '• Create an account on our website',
            '• Subscribe to our newsletter',
            '• Comment on articles',
            '• Contact us through contact forms',
            '• Participate in surveys or contests',
            '',
            'The information we collect includes:',
            '• Name and email address',
            '• Profile information',
            '• Reading preferences and interests',
            '• IP address and device data',
            '• Cookies and similar tracking technologies'
          ]
    },
    {
      id: 'information-use',
      title: theme.language === 'ar' ? 'استخدام المعلومات' : 'Use of Information',
      content: theme.language === 'ar' 
        ? [
            'نستخدم المعلومات التي نجمعها للأغراض التالية:',
            '• تقديم وتحسين خدماتنا',
            '• إرسال النشرات الإخبارية والتحديثات',
            '• الرد على استفساراتكم ومساعدتكم',
            '• تخصيص المحتوى حسب اهتماماتكم',
            '• تحليل استخدام الموقع وتحسين الأداء',
            '• منع الاحتيال وضمان الأمان',
            '• الامتثال للمتطلبات القانونية',
            '',
            'لن نبيع أو نؤجر أو نشارك معلوماتكم الشخصية مع أطراف ثالثة لأغراض تسويقية دون موافقتكم الصريحة.'
          ]
        : [
            'We use the information we collect for the following purposes:',
            '• Provide and improve our services',
            '• Send newsletters and updates',
            '• Respond to your inquiries and assist you',
            '• Personalize content based on your interests',
            '• Analyze website usage and improve performance',
            '• Prevent fraud and ensure security',
            '• Comply with legal requirements',
            '',
            'We will not sell, rent, or share your personal information with third parties for marketing purposes without your explicit consent.'
          ]
    },
    {
      id: 'information-sharing',
      title: theme.language === 'ar' ? 'مشاركة المعلومات' : 'Information Sharing',
      content: theme.language === 'ar' 
        ? [
            'قد نشارك معلوماتكم في الحالات التالية:',
            '• مع مقدمي الخدمات الذين يساعدوننا في تشغيل الموقع',
            '• عند الحاجة للامتثال للقوانين أو الأوامر القضائية',
            '• لحماية حقوقنا أو سلامة المستخدمين',
            '• في حالة بيع أو نقل ملكية الموقع',
            '',
            'جميع الأطراف الثالثة التي نتعامل معها ملزمة بحماية معلوماتكم وعدم استخدامها لأغراض أخرى.'
          ]
        : [
            'We may share your information in the following cases:',
            '• With service providers who help us operate the website',
            '• When required to comply with laws or court orders',
            '• To protect our rights or user safety',
            '• In case of sale or transfer of website ownership',
            '',
            'All third parties we work with are obligated to protect your information and not use it for other purposes.'
          ]
    },
    {
      id: 'data-security',
      title: theme.language === 'ar' ? 'أمان البيانات' : 'Data Security',
      content: theme.language === 'ar' 
        ? [
            'نتخذ تدابير أمنية مناسبة لحماية معلوماتكم الشخصية من:',
            '• الوصول غير المصرح به',
            '• التغيير أو التلف',
            '• الكشف غير المقصود',
            '• الفقدان أو السرقة',
            '',
            'تشمل تدابيرنا الأمنية:',
            '• تشفير البيانات الحساسة',
            '• استخدام اتصالات آمنة (SSL)',
            '• تحديث أنظمة الأمان بانتظام',
            '• تدريب الموظفين على أفضل ممارسات الأمان',
            '• مراقبة النشاط المشبوه',
            '',
            'رغم جهودنا، لا يمكن ضمان الأمان المطلق للبيانات المنقولة عبر الإنترنت.'
          ]
        : [
            'We take appropriate security measures to protect your personal information from:',
            '• Unauthorized access',
            '• Alteration or damage',
            '• Unintended disclosure',
            '• Loss or theft',
            '',
            'Our security measures include:',
            '• Encryption of sensitive data',
            '• Use of secure connections (SSL)',
            '• Regular security system updates',
            '• Staff training on security best practices',
            '• Monitoring suspicious activity',
            '',
            'Despite our efforts, absolute security of data transmitted over the internet cannot be guaranteed.'
          ]
    },
    {
      id: 'cookies',
      title: theme.language === 'ar' ? 'ملفات تعريف الارتباط' : 'Cookies',
      content: theme.language === 'ar' 
        ? [
            'نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتكم على موقعنا:',
            '',
            'أنواع ملفات تعريف الارتباط التي نستخدمها:',
            '• ملفات ضرورية: مطلوبة لتشغيل الموقع بشكل صحيح',
            '• ملفات الأداء: تساعدنا في فهم كيفية استخدام الموقع',
            '• ملفات الوظائف: تحفظ تفضيلاتكم وإعداداتكم',
            '• ملفات التسويق: تستخدم لعرض إعلانات مناسبة',
            '',
            'يمكنكم التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح، لكن تعطيلها قد يؤثر على وظائف الموقع.'
          ]
        : [
            'We use cookies to improve your experience on our website:',
            '',
            'Types of cookies we use:',
            '• Essential cookies: Required for the website to function properly',
            '• Performance cookies: Help us understand how the website is used',
            '• Functional cookies: Remember your preferences and settings',
            '• Marketing cookies: Used to display relevant advertisements',
            '',
            'You can control cookies through your browser settings, but disabling them may affect website functionality.'
          ]
    },
    {
      id: 'user-rights',
      title: theme.language === 'ar' ? 'حقوق المستخدمين' : 'User Rights',
      content: theme.language === 'ar' 
        ? [
            'لديكم الحقوق التالية فيما يتعلق ببياناتكم الشخصية:',
            '• الوصول: طلب نسخة من البيانات التي نحتفظ بها عنكم',
            '• التصحيح: طلب تصحيح البيانات غير الصحيحة',
            '• الحذف: طلب حذف بياناتكم الشخصية',
            '• التقييد: طلب تقييد معالجة بياناتكم',
            '• النقل: طلب نقل بياناتكم إلى خدمة أخرى',
            '• الاعتراض: الاعتراض على معالجة بياناتكم لأغراض معينة',
            '',
            'لممارسة هذه الحقوق، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@newswebsite.com'
          ]
        : [
            'You have the following rights regarding your personal data:',
            '• Access: Request a copy of the data we hold about you',
            '• Correction: Request correction of inaccurate data',
            '• Deletion: Request deletion of your personal data',
            '• Restriction: Request restriction of data processing',
            '• Portability: Request transfer of your data to another service',
            '• Objection: Object to processing of your data for certain purposes',
            '',
            'To exercise these rights, please contact us at: privacy@newswebsite.com'
          ]
    },
    {
      id: 'children-privacy',
      title: theme.language === 'ar' ? 'خصوصية الأطفال' : 'Children\'s Privacy',
      content: theme.language === 'ar' 
        ? [
            'موقعنا غير مخصص للأطفال دون سن 13 عاماً، ولا نجمع معلومات شخصية من الأطفال عمداً.',
            '',
            'إذا علمنا أننا جمعنا معلومات شخصية من طفل دون سن 13 عاماً، سنحذف هذه المعلومات فوراً.',
            '',
            'إذا كنتم والدين وتعتقدون أن طفلكم قدم معلومات شخصية لموقعنا، يرجى التواصل معنا فوراً.'
          ]
        : [
            'Our website is not intended for children under 13 years of age, and we do not knowingly collect personal information from children.',
            '',
            'If we learn that we have collected personal information from a child under 13, we will delete this information immediately.',
            '',
            'If you are a parent and believe your child has provided personal information to our website, please contact us immediately.'
          ]
    },
    {
      id: 'policy-changes',
      title: theme.language === 'ar' ? 'تغييرات السياسة' : 'Policy Changes',
      content: theme.language === 'ar' 
        ? [
            'قد نحدث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في ممارساتنا أو لأسباب قانونية أو تنظيمية.',
            '',
            'سنخطركم بأي تغييرات جوهرية عبر:',
            '• إشعار بارز على موقعنا',
            '• رسالة بريد إلكتروني إلى عنوانكم المسجل',
            '• إشعار في تطبيقنا المحمول (إن وجد)',
            '',
            'استمراركم في استخدام موقعنا بعد التغييرات يعني موافقتكم على السياسة المحدثة.'
          ]
        : [
            'We may update this privacy policy from time to time to reflect changes in our practices or for legal or regulatory reasons.',
            '',
            'We will notify you of any material changes through:',
            '• A prominent notice on our website',
            '• An email to your registered address',
            '• A notification in our mobile app (if applicable)',
            '',
            'Your continued use of our website after changes means you agree to the updated policy.'
          ]
    }
  ];

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'سياسة الخصوصية - موقع الأخبار' : 'Privacy Policy - News Website'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'سياسة الخصوصية الخاصة بموقع الأخبار وكيفية حماية بياناتكم الشخصية وحقوقكم في البيانات'
            : 'Privacy policy for News Website and how we protect your personal data and your data rights'
          } 
        />
        <meta 
          name="keywords" 
          content={theme.language === 'ar' 
            ? 'سياسة الخصوصية، حماية البيانات، الخصوصية، حقوق المستخدمين'
            : 'privacy policy, data protection, privacy, user rights'
          } 
        />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={theme.language === 'ar' ? 'سياسة الخصوصية - موقع الأخبار' : 'Privacy Policy - News Website'} 
        />
        <meta 
          property="og:description" 
          content={theme.language === 'ar' 
            ? 'سياسة الخصوصية الخاصة بموقع الأخبار وكيفية حماية بياناتكم الشخصية وحقوقكم في البيانات'
            : 'Privacy policy for News Website and how we protect your personal data and your data rights'
          } 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content={theme.language === 'ar' ? 'سياسة الخصوصية - موقع الأخبار' : 'Privacy Policy - News Website'} 
        />
        <meta 
          name="twitter:description" 
          content={theme.language === 'ar' 
            ? 'سياسة الخصوصية الخاصة بموقع الأخبار وكيفية حماية بياناتكم الشخصية وحقوقكم في البيانات'
            : 'Privacy policy for News Website and how we protect your personal data and your data rights'
          } 
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {theme.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {theme.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            {theme.language === 'ar' 
              ? 'نحن نقدر خصوصيتكم ونلتزم بحماية بياناتكم الشخصية'
              : 'We value your privacy and are committed to protecting your personal data'
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {theme.language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
            <time dateTime={lastUpdated}>
              {new Date(lastUpdated).toLocaleDateString(
                theme.language === 'ar' ? 'ar-SA' : 'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }
              )}
            </time>
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {theme.language === 'ar' ? 'المحتويات' : 'Table of Contents'}
          </h2>
          <nav>
            <ol className="space-y-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a 
                    href={`#${section.id}`}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Introduction */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {theme.language === 'ar' 
              ? 'تصف سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمونها عند استخدام موقعنا الإلكتروني. نحن ملتزمون بحماية خصوصيتكم وضمان أمان بياناتكم الشخصية وفقاً لأفضل الممارسات والمعايير الدولية.'
              : 'This privacy policy describes how we collect, use, and protect the personal information you provide when using our website. We are committed to protecting your privacy and ensuring the security of your personal data in accordance with best practices and international standards.'
            }
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {index + 1}. {section.title}
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-16 p-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {theme.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {theme.language === 'ar' 
              ? 'إذا كان لديكم أي أسئلة حول سياسة الخصوصية هذه أو ممارسات البيانات الخاصة بنا، يرجى التواصل معنا:'
              : 'If you have any questions about this privacy policy or our data practices, please contact us:'
            }
          </p>
          <div className="space-y-2 text-gray-600 dark:text-gray-300">
            <p>
              <strong>{theme.language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong>{' '}
              <a href="mailto:privacy@newswebsite.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                privacy@newswebsite.com
              </a>
            </p>
            <p>
              <strong>{theme.language === 'ar' ? 'العنوان:' : 'Address:'}</strong>{' '}
              {theme.language === 'ar' 
                ? '123 شارع الأخبار، المدينة، البلد'
                : '123 News Street, City, Country'
              }
            </p>
          </div>
        </div>

        {/* Back to Top */}
        <div className="text-center mt-12">
          <a 
            href="#top"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {theme.language === 'ar' ? '↑ العودة إلى الأعلى' : '↑ Back to Top'}
          </a>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;