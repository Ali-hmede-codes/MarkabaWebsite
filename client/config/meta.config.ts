// Basic meta configuration for NewsMarkaba
export const siteConfig = {
  name: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
  description: '  مـركـبـا - الـمـنـصـة الاخـبـاريـة - آخر الأخبار والمقالات',
  url: 'https://markaba.news',
  locale: 'ar',
  author: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة'
};

export const defaultMeta = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: 'أخبار, مقالات, مركبة, NewsMarkaba',
  author: siteConfig.author,
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1.0'
};