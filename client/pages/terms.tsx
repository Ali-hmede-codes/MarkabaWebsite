'use client';

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

const TermsOfServicePage: React.FC = () => {
  const { theme } = useTheme();

  const lastUpdated = '2024-01-15';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: theme.language === 'ar' ? 'شروط الخدمة - موقع الأخبار' : 'Terms of Service - News Website',
    description: theme.language === 'ar' 
      ? 'شروط وأحكام استخدام موقع الأخبار والقواعد التي تحكم استخدام خدماتنا'
      : 'Terms and conditions for using News Website and the rules governing the use of our services',
    url: typeof window !== 'undefined' ? window.location.href : '',
    dateModified: lastUpdated,
    publisher: {
      '@type': 'Organization',
      name: theme.language === 'ar' ? 'موقع الأخبار' : 'News Website'
    }
  };

  const sections = [
    {
      id: 'acceptance',
      title: theme.language === 'ar' ? 'قبول الشروط' : 'Acceptance of Terms',
      content: theme.language === 'ar' 
        ? [
            'بوصولكم إلى موقعنا واستخدامه، فإنكم توافقون على الالتزام بشروط الخدمة هذه وجميع القوانين واللوائح المعمول بها.',
            '',
            'إذا كنتم لا توافقون على أي من هذه الشروط، فيُمنع عليكم استخدام هذا الموقع أو الوصول إليه.',
            '',
            'قد نقوم بتحديث هذه الشروط من وقت لآخر دون إشعار مسبق. استمراركم في استخدام الموقع بعد أي تغييرات يعني موافقتكم على الشروط المحدثة.'
          ]
        : [
            'By accessing and using our website, you agree to be bound by these Terms of Service and all applicable laws and regulations.',
            '',
            'If you do not agree with any of these terms, you are prohibited from using or accessing this website.',
            '',
            'We may update these terms from time to time without prior notice. Your continued use of the website after any changes constitutes acceptance of the updated terms.'
          ]
    },
    {
      id: 'use-license',
      title: theme.language === 'ar' ? 'ترخيص الاستخدام' : 'Use License',
      content: theme.language === 'ar' 
        ? [
            'يُمنح لكم ترخيص مؤقت لعرض وتنزيل نسخة واحدة من المواد الموجودة على موقع الأخبار للاستخدام الشخصي وغير التجاري فقط.',
            '',
            'هذا الترخيص لا يشمل:',
            '• تعديل أو نسخ المواد',
            '• استخدام المواد لأغراض تجارية أو للعرض العام',
            '• محاولة فك تشفير أو هندسة عكسية لأي برامج موجودة على الموقع',
            '• إزالة أي حقوق طبع ونشر أو علامات ملكية أخرى من المواد',
            '',
            'سينتهي هذا الترخيص تلقائياً إذا انتهكتم أي من هذه القيود وقد يتم إنهاؤه من قبلنا في أي وقت.'
          ]
        : [
            'You are granted a temporary license to view and download one copy of the materials on News Website for personal, non-commercial use only.',
            '',
            'This license does not include:',
            '• Modifying or copying the materials',
            '• Using the materials for commercial purposes or public display',
            '• Attempting to decompile or reverse engineer any software on the website',
            '• Removing any copyright or other proprietary notations from the materials',
            '',
            'This license will automatically terminate if you violate any of these restrictions and may be terminated by us at any time.'
          ]
    },
    {
      id: 'user-accounts',
      title: theme.language === 'ar' ? 'حسابات المستخدمين' : 'User Accounts',
      content: theme.language === 'ar' 
        ? [
            'عند إنشاء حساب على موقعنا، يجب عليكم:',
            '• تقديم معلومات دقيقة وكاملة ومحدثة',
            '• الحفاظ على أمان كلمة المرور وسرية الحساب',
            '• إخطارنا فوراً بأي استخدام غير مصرح به لحسابكم',
            '• تحمل المسؤولية عن جميع الأنشطة التي تحدث تحت حسابكم',
            '',
            'نحتفظ بالحق في:',
            '• رفض أي طلب تسجيل',
            '• إنهاء أو تعليق حسابكم في أي وقت',
            '• إزالة أي محتوى تنشرونه إذا انتهك شروطنا',
            '',
            'يجب أن تكونوا بعمر 13 عاماً على الأقل لإنشاء حساب.'
          ]
        : [
            'When creating an account on our website, you must:',
            '• Provide accurate, complete, and current information',
            '• Maintain the security of your password and account confidentiality',
            '• Notify us immediately of any unauthorized use of your account',
            '• Take responsibility for all activities that occur under your account',
            '',
            'We reserve the right to:',
            '• Refuse any registration request',
            '• Terminate or suspend your account at any time',
            '• Remove any content you post if it violates our terms',
            '',
            'You must be at least 13 years old to create an account.'
          ]
    },
    {
      id: 'user-content',
      title: theme.language === 'ar' ? 'محتوى المستخدمين' : 'User Content',
      content: theme.language === 'ar' 
        ? [
            'عند نشر محتوى على موقعنا (تعليقات، مراجعات، إلخ)، فإنكم:',
            '• تمنحوننا ترخيصاً غير حصري لاستخدام ونشر وتوزيع المحتوى',
            '• تؤكدون أن المحتوى لا ينتهك حقوق أي طرف ثالث',
            '• تتحملون المسؤولية الكاملة عن المحتوى المنشور',
            '',
            'يُحظر نشر محتوى يحتوي على:',
            '• مواد مسيئة أو تشهيرية أو تحريضية',
            '• معلومات شخصية لأشخاص آخرين دون إذن',
            '• محتوى ينتهك حقوق الطبع والنشر',
            '• فيروسات أو برامج ضارة',
            '• إعلانات أو رسائل تجارية غير مرغوب فيها',
            '',
            'نحتفظ بالحق في مراجعة وإزالة أي محتوى دون إشعار مسبق.'
          ]
        : [
            'When posting content on our website (comments, reviews, etc.), you:',
            '• Grant us a non-exclusive license to use, publish, and distribute the content',
            '• Confirm that the content does not violate any third party rights',
            '• Take full responsibility for the posted content',
            '',
            'Posting content that contains the following is prohibited:',
            '• Abusive, defamatory, or inflammatory material',
            '• Personal information of others without permission',
            '• Content that violates copyright',
            '• Viruses or malicious software',
            '• Unwanted advertisements or commercial messages',
            '',
            'We reserve the right to review and remove any content without prior notice.'
          ]
    },
    {
      id: 'prohibited-uses',
      title: theme.language === 'ar' ? 'الاستخدامات المحظورة' : 'Prohibited Uses',
      content: theme.language === 'ar' 
        ? [
            'لا يجوز لكم استخدام موقعنا:',
            '• لأي غرض غير قانوني أو لحث الآخرين على أنشطة غير قانونية',
            '• لانتهاك أي قوانين أو لوائح محلية أو دولية',
            '• لنقل أو إرسال مواد تحريضية أو مسيئة أو تشهيرية',
            '• لانتهاك حقوق الملكية الفكرية لنا أو لأطراف ثالثة',
            '• لتحميل فيروسات أو أي رموز ضارة أخرى',
            '• لجمع معلومات شخصية عن مستخدمين آخرين',
            '• للتدخل في أمان الموقع أو تعطيل خدماتنا',
            '• لاستخدام أي روبوتات أو عناكب أو أدوات استخراج بيانات أخرى',
            '• لانتحال شخصية أي شخص أو كيان',
            '• للمشاركة في أي شكل من أشكال الاحتيال أو الخداع'
          ]
        : [
            'You may not use our website:',
            '• For any unlawful purpose or to solicit others to unlawful acts',
            '• To violate any local, national, or international laws or regulations',
            '• To transmit or send inflammatory, abusive, or defamatory material',
            '• To violate our or third parties\' intellectual property rights',
            '• To upload viruses or any other malicious code',
            '• To collect personal information about other users',
            '• To interfere with website security or disrupt our services',
            '• To use any robots, spiders, or other data extraction tools',
            '• To impersonate any person or entity',
            '• To engage in any form of fraud or deception'
          ]
    },
    {
      id: 'intellectual-property',
      title: theme.language === 'ar' ? 'الملكية الفكرية' : 'Intellectual Property',
      content: theme.language === 'ar' 
        ? [
            'جميع المحتويات الموجودة على موقع الأخبار، بما في ذلك النصوص والصور والشعارات والتصاميم، محمية بحقوق الطبع والنشر والعلامات التجارية وقوانين الملكية الفكرية الأخرى.',
            '',
            'لا يجوز لكم:',
            '• نسخ أو إعادة إنتاج أو توزيع أي محتوى دون إذن كتابي',
            '• استخدام علاماتنا التجارية أو شعاراتنا دون موافقة',
            '• إنشاء أعمال مشتقة من محتوانا',
            '• بيع أو ترخيص أو تأجير أي من محتوانا',
            '',
            'إذا كنتم تعتقدون أن محتوانا ينتهك حقوق الطبع والنشر الخاصة بكم، يرجى التواصل معنا فوراً مع تفاصيل الانتهاك المزعوم.'
          ]
        : [
            'All content on News Website, including text, images, logos, and designs, is protected by copyright, trademarks, and other intellectual property laws.',
            '',
            'You may not:',
            '• Copy, reproduce, or distribute any content without written permission',
            '• Use our trademarks or logos without approval',
            '• Create derivative works from our content',
            '• Sell, license, or rent any of our content',
            '',
            'If you believe our content infringes your copyright, please contact us immediately with details of the alleged infringement.'
          ]
    },
    {
      id: 'disclaimers',
      title: theme.language === 'ar' ? 'إخلاء المسؤولية' : 'Disclaimers',
      content: theme.language === 'ar' 
        ? [
            'المعلومات الموجودة على موقعنا مقدمة "كما هي" دون أي ضمانات من أي نوع، صريحة أو ضمنية.',
            '',
            'نحن لا نضمن:',
            '• دقة أو اكتمال أو موثوقية أي معلومات',
            '• أن الموقع سيكون متاحاً دون انقطاع أو خالياً من الأخطاء',
            '• أن أي عيوب سيتم إصلاحها',
            '• أن الموقع خالٍ من الفيروسات أو المكونات الضارة',
            '',
            'استخدامكم للموقع على مسؤوليتكم الخاصة. نحن لسنا مسؤولين عن أي أضرار قد تنتج عن استخدام موقعنا.',
            '',
            'الآراء المعبر عنها في المقالات والتعليقات لا تمثل بالضرورة آراء موقع الأخبار.'
          ]
        : [
            'The information on our website is provided "as is" without any warranties of any kind, either express or implied.',
            '',
            'We do not warrant:',
            '• The accuracy, completeness, or reliability of any information',
            '• That the website will be available uninterrupted or error-free',
            '• That any defects will be corrected',
            '• That the website is free of viruses or harmful components',
            '',
            'Your use of the website is at your own risk. We are not responsible for any damages that may result from using our website.',
            '',
            'Opinions expressed in articles and comments do not necessarily represent the views of News Website.'
          ]
    },
    {
      id: 'limitation-liability',
      title: theme.language === 'ar' ? 'تحديد المسؤولية' : 'Limitation of Liability',
      content: theme.language === 'ar' 
        ? [
            'في أي حال من الأحوال، لن نكون مسؤولين عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو خاصة أو تبعية تنشأ عن:',
            '• استخدام أو عدم القدرة على استخدام موقعنا',
            '• أي أخطاء أو حذف في المحتوى',
            '• أي انقطاع في الخدمة أو فقدان البيانات',
            '• أي فيروسات أو برامج ضارة قد تصيب جهازكم',
            '',
            'هذا التحديد للمسؤولية ينطبق حتى لو تم إخطارنا بإمكانية حدوث مثل هذه الأضرار.',
            '',
            'في الولايات القضائية التي لا تسمح بتحديد المسؤولية، قد لا تنطبق هذه القيود عليكم.'
          ]
        : [
            'In no event shall we be liable for any direct, indirect, incidental, special, or consequential damages arising from:',
            '• Use or inability to use our website',
            '• Any errors or omissions in content',
            '• Any service interruption or data loss',
            '• Any viruses or malware that may infect your device',
            '',
            'This limitation of liability applies even if we have been notified of the possibility of such damages.',
            '',
            'In jurisdictions that do not allow limitation of liability, these limitations may not apply to you.'
          ]
    },
    {
      id: 'indemnification',
      title: theme.language === 'ar' ? 'التعويض' : 'Indemnification',
      content: theme.language === 'ar' 
        ? [
            'توافقون على تعويضنا وحمايتنا وإبراء ذمتنا من أي مطالبات أو أضرار أو خسائر أو مصاريف (بما في ذلك أتعاب المحاماة المعقولة) تنشأ عن:',
            '• استخدامكم لموقعنا',
            '• انتهاككم لهذه الشروط',
            '• انتهاككم لأي حقوق طرف ثالث',
            '• أي محتوى تنشرونه على موقعنا',
            '',
            'نحتفظ بالحق في تولي الدفاع الحصري والسيطرة على أي مسألة تخضع للتعويض من قبلكم.'
          ]
        : [
            'You agree to indemnify, defend, and hold us harmless from any claims, damages, losses, or expenses (including reasonable attorney fees) arising from:',
            '• Your use of our website',
            '• Your violation of these terms',
            '• Your violation of any third party rights',
            '• Any content you post on our website',
            '',
            'We reserve the right to assume exclusive defense and control of any matter subject to indemnification by you.'
          ]
    },
    {
      id: 'termination',
      title: theme.language === 'ar' ? 'الإنهاء' : 'Termination',
      content: theme.language === 'ar' 
        ? [
            'يجوز لنا إنهاء أو تعليق وصولكم إلى موقعنا فوراً، دون إشعار مسبق أو مسؤولية، لأي سبب كان، بما في ذلك انتهاك هذه الشروط.',
            '',
            'عند الإنهاء:',
            '• ينتهي حقكم في استخدام الموقع فوراً',
            '• قد نحذف حسابكم ومحتواكم',
            '• تبقى الأحكام التي يجب أن تستمر بطبيعتها سارية بعد الإنهاء',
            '',
            'يجوز لكم أيضاً إنهاء حسابكم في أي وقت بالتواصل معنا أو حذف حسابكم من خلال إعدادات الحساب.'
          ]
        : [
            'We may terminate or suspend your access to our website immediately, without prior notice or liability, for any reason, including breach of these terms.',
            '',
            'Upon termination:',
            '• Your right to use the website ceases immediately',
            '• We may delete your account and content',
            '• Provisions that should survive by their nature remain in effect after termination',
            '',
            'You may also terminate your account at any time by contacting us or deleting your account through account settings.'
          ]
    },
    {
      id: 'governing-law',
      title: theme.language === 'ar' ? 'القانون الحاكم' : 'Governing Law',
      content: theme.language === 'ar' 
        ? [
            'تخضع هذه الشروط وتفسر وفقاً لقوانين [البلد/الولاية] دون اعتبار لمبادئ تنازع القوانين.',
            '',
            'أي نزاع ينشأ عن هذه الشروط أو استخدام موقعنا سيخضع للاختصاص الحصري لمحاكم [المدينة، البلد/الولاية].',
            '',
            'إذا تبين أن أي حكم من هذه الشروط غير قابل للتنفيذ أو باطل، فإن هذا الحكم سيتم تعديله وتفسيره لتحقيق أهداف هذا الحكم إلى أقصى حد ممكن، وستبقى الأحكام المتبقية سارية المفعول.'
          ]
        : [
            'These terms are governed by and construed in accordance with the laws of [Country/State] without regard to conflict of law principles.',
            '',
            'Any dispute arising from these terms or use of our website shall be subject to the exclusive jurisdiction of the courts of [City, Country/State].',
            '',
            'If any provision of these terms is found to be unenforceable or invalid, that provision will be modified and interpreted to accomplish the objectives of such provision to the greatest extent possible, and the remaining provisions will remain in full force and effect.'
          ]
    }
  ];

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'شروط الخدمة - موقع الأخبار' : 'Terms of Service - News Website'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'شروط وأحكام استخدام موقع الأخبار والقواعد التي تحكم استخدام خدماتنا ومحتوانا'
            : 'Terms and conditions for using News Website and the rules governing the use of our services and content'
          } 
        />
        <meta 
          name="keywords" 
          content={theme.language === 'ar' 
            ? 'شروط الخدمة، شروط الاستخدام، أحكام وشروط، قواعد الموقع'
            : 'terms of service, terms of use, terms and conditions, website rules'
          } 
        />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={theme.language === 'ar' ? 'شروط الخدمة - موقع الأخبار' : 'Terms of Service - News Website'} 
        />
        <meta 
          property="og:description" 
          content={theme.language === 'ar' 
            ? 'شروط وأحكام استخدام موقع الأخبار والقواعد التي تحكم استخدام خدماتنا ومحتوانا'
            : 'Terms and conditions for using News Website and the rules governing the use of our services and content'
          } 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content={theme.language === 'ar' ? 'شروط الخدمة - موقع الأخبار' : 'Terms of Service - News Website'} 
        />
        <meta 
          name="twitter:description" 
          content={theme.language === 'ar' 
            ? 'شروط وأحكام استخدام موقع الأخبار والقواعد التي تحكم استخدام خدماتنا ومحتوانا'
            : 'Terms and conditions for using News Website and the rules governing the use of our services and content'
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
              {theme.language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {theme.language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            {theme.language === 'ar' 
              ? 'الشروط والأحكام التي تحكم استخدام موقعنا وخدماتنا'
              : 'The terms and conditions governing the use of our website and services'
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
            <ol className="grid md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a 
                    href={`#${section.id}`}
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
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
              ? 'مرحباً بكم في موقع الأخبار. تحدد شروط الخدمة هذه القواعد والأحكام التي تحكم استخدامكم لموقعنا الإلكتروني وخدماتنا. يرجى قراءة هذه الشروط بعناية قبل استخدام موقعنا.'
              : 'Welcome to News Website. These Terms of Service outline the rules and regulations that govern your use of our website and services. Please read these terms carefully before using our website.'
            }
          </p>
        </div>

        {/* Terms Sections */}
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
              ? 'إذا كان لديكم أي أسئلة حول شروط الخدمة هذه، يرجى التواصل معنا:'
              : 'If you have any questions about these Terms of Service, please contact us:'
            }
          </p>
          <div className="space-y-2 text-gray-600 dark:text-gray-300">
            <p>
              <strong>{theme.language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong>{' '}
              <a href="mailto:legal@newswebsite.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                legal@newswebsite.com
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

export default TermsOfServicePage;