// Basic meta configuration for NewsMarkaba
export const siteConfig = {
  name: 'NewsMarkaba',
  description: 'موقع أخبار مركبة - آخر الأخبار والمقالات',
  url: 'https://newsmarkaba.com',
  locale: 'ar',
  author: 'NewsMarkaba Team'
};

export const defaultMeta = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: 'أخبار, مقالات, مركبة, NewsMarkaba',
  author: siteConfig.author,
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1.0'
};