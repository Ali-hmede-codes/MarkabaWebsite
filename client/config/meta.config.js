/**
 * Meta Tags Configuration
 * This file contains all the default meta tags and SEO settings for the website.
 * You can easily modify these values to update your website's SEO information.
 */

const metaConfig = {
  // Basic Site Information
  site: {
    name: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
    nameEn: 'Marakba - News Platform',
    tagline: 'آخر الأخبار والتحديثات',
    taglineEn: 'Latest News and Updates',
    description: 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة. موقعك الأول للأخبار المحلية والعالمية.',
    descriptionEn: 'Stay updated with the latest news, breaking stories, and in-depth analysis from Marakba - News Platform. Your premier source for local and global news.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news',
    domain: 'markaba.news',
    language: 'ar',
    country: 'LB',
    region: 'Lebanon'
  },

  // Default Meta Tags
  defaults: {
    title: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
    titleEn: 'Marakba - News Platform',
    description: 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة.',
    descriptionEn: 'Stay updated with the latest news, breaking stories, and in-depth analysis from Marakba - News Platform.',
    keywords: [
      'أخبار',
      'أخبار عاجلة', 
      'تحديثات',
      'صحافة',
      'أحداث جارية',
      'لبنان',
      'الشرق الأوسط',
      'سياسة',
      'اقتصاد',
      'رياضة',
      'تكنولوجيا'
    ],
    keywordsEn: [
      'news',
      'breaking news',
      'updates', 
      'journalism',
      'current events',
      'lebanon',
      'middle east',
      'politics',
      'economy',
      'sports',
      'technology'
    ],
    image: '/images/og-image.jpg',
    type: 'website',
    locale: 'ar_SA',
    localeEn: 'en_US'
  },

  // Social Media Information
  social: {
    twitter: {
      handle: '@markaba_news',
      site: '@markaba_news',
      creator: '@markaba_news'
    },
    facebook: {
      appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      page: 'https://facebook.com/markaba.news'
    },
    instagram: 'https://instagram.com/markaba.news',
    youtube: 'https://youtube.com/@markaba.news',
    linkedin: 'https://linkedin.com/company/markaba-news'
  },

  // Contact Information
  contact: {
    email: 'info@markaba.news',
    phone: '+961-XX-XXXXXX',
    address: {
      street: '',
      city: 'Beirut',
      country: 'Lebanon',
      postalCode: ''
    }
  },

  // Organization Schema Data
  organization: {
    '@type': 'NewsMediaOrganization',
    name: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
    alternateName: 'Marakba - News Platform',
    description: 'موقع إخباري شامل يقدم آخر الأخبار والتحليلات من لبنان والعالم',
    foundingDate: '2024',
    logo: {
      url: '/images/logo.png',
      width: 600,
      height: 60
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LB',
      addressRegion: 'Lebanon',
      addressLocality: 'Beirut'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@markaba.news'
    },
    sameAs: [
      'https://twitter.com/markaba_news',
      'https://facebook.com/markaba.news', 
      'https://instagram.com/markaba.news',
      'https://youtube.com/@markaba.news'
    ]
  },

  // Analytics and Tracking
  analytics: {
    googleAnalytics: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
    googleSearchConsole: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    facebookPixel: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '',
    googleAdsense: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || ''
  },

  // Page-specific Templates
  templates: {
    home: {
      title: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة - الصفحة الرئيسية',
      titleEn: 'Marakba News Platform - Home Page',
      description: 'الصفحة الرئيسية لموقع مـركـبـا - الـمـنـصـة الاخـبـاريـة - آخر الأخبار العاجلة والتحديثات اليومية',
      descriptionEn: 'Marakba - News Platform homepage - Latest breaking news and daily updates'
    },
    category: {
      title: 'أخبار {category} - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      titleEn: '{category} News - Marakba News Platform',
      description: 'آخر أخبار {category} والتحديثات من مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      descriptionEn: 'Latest {category} news and updates from Marakba - News Platform'
    },
    post: {
      title: '{title} - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      titleEn: '{title} - Marakba - News Platform',
      description: '{excerpt}',
      descriptionEn: '{excerpt}'
    },
    search: {
      title: 'البحث: {query} - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      titleEn: 'Search: {query} - Marakba - News Platform',
      description: 'نتائج البحث عن "{query}" في مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      descriptionEn: 'Search results for "{query}" on Marakba - News Platform'
    },
    about: {
      title: 'حول الموقع - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      titleEn: 'About Us - Marakba - News Platform',
      description: 'تعرف على موقع مـركـبـا - الـمـنـصـة الاخـبـاريـة ورسالتنا في تقديم الأخبار الموثوقة',
      descriptionEn: 'Learn about Marakba - News Platform and our mission to deliver reliable news'
    },
    contact: {
      title: 'اتصل بنا - مـركـبـا - الـمـنـصـة الاخـبـاريـة',
      titleEn: 'Contact Us - Marakba - News Platform',
      description: 'تواصل مع فريق مـركـبـا - الـمـنـصـة الاخـبـاريـة للاستفسارات والاقتراحات',
      descriptionEn: 'Contact the Marakba - News Platform team for inquiries and suggestions'
    }
  },

  // Robots and Crawling
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1
    },
    bingBot: {
      index: true,
      follow: true
    }
  },

  // Additional Meta Tags
  additional: {
    themeColor: '#ffffff',
    msApplicationTileColor: '#ffffff',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'default',
    appleMobileWebAppTitle: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
    applicationName: 'Marakba - News Platform',
    msApplicationTooltip: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة - آخر الأخبار',
    rating: 'general',
    distribution: 'global'
  }
};

// Helper functions to generate meta tags
export const generateTitle = (template, data = {}) => {
  let title = template;
  Object.keys(data).forEach(key => {
    title = title.replace(`{${key}}`, data[key]);
  });
  return title;
};

export const generateDescription = (template, data = {}) => {
  let description = template;
  Object.keys(data).forEach(key => {
    description = description.replace(`{${key}}`, data[key]);
  });
  return description;
};

export const getPageMeta = (pageType, data = {}) => {
  const template = metaConfig.templates[pageType];
  if (!template) return metaConfig.defaults;
  
  return {
    title: generateTitle(template.title, data),
    titleEn: generateTitle(template.titleEn, data),
    description: generateDescription(template.description, data),
    descriptionEn: generateDescription(template.descriptionEn, data)
  };
};

export default metaConfig;