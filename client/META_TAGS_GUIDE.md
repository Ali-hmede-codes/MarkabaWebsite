# 📋 Meta Tags Management Guide

This guide explains how to use the comprehensive meta tags system for your NewsMarkaba website. The system provides automatic SEO optimization with easy customization options.

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import MetaTags from '../components/SEO/MetaTags';

// In your page component
export default function MyPage() {
  return (
    <>
      <MetaTags pageType="home" />
      <div>Your page content</div>
    </>
  );
}
```

### 2. Configuration Setup

First, configure your site settings in `config/meta.config.js`:

```javascript
// Update these values for your site
const metaConfig = {
  site: {
    name: 'أخبار مركبا',
    nameEn: 'NewsMarkaba',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news',
    // ... other settings
  },
  analytics: {
    googleAnalytics: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    googleSearchConsole: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // ... other analytics
  }
};
```

## 📝 Page Types

The system supports different page types with automatic SEO optimization:

### 1. Home Page
```tsx
<MetaTags pageType="home" />
```

### 2. Category Page
```tsx
<MetaTags 
  pageType="category" 
  pageData={{
    name_ar: 'اسم الفئة',
    name_en: 'Category Name',
    description_ar: 'وصف الفئة',
    slug: 'category-slug'
  }}
/>
```

### 3. Post/Article Page
```tsx
<MetaTags 
  pageType="post" 
  pageData={{
    title_ar: 'عنوان المقال',
    title_en: 'Article Title',
    content_ar: 'محتوى المقال...',
    excerpt_ar: 'ملخص المقال',
    featured_image: '/images/article.jpg',
    author_name: 'اسم الكاتب',
    category_name_ar: 'اسم الفئة',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    meta_description_ar: 'وصف مخصص للمقال',
    meta_keywords_ar: 'كلمات مفتاحية, أخبار, مقال',
    tags: ['تاغ 1', 'تاغ 2']
  }}
/>
```

### 4. Search Page
```tsx
<MetaTags 
  pageType="search" 
  pageData={{
    query: 'كلمة البحث',
    resultsCount: 25
  }}
/>
```

### 5. About Page
```tsx
<MetaTags pageType="about" />
```

### 6. Contact Page
```tsx
<MetaTags pageType="contact" />
```

### 7. Custom Page
```tsx
<MetaTags 
  pageType="custom" 
  customMeta={{
    title: 'عنوان مخصص',
    description: 'وصف مخصص للصفحة',
    keywords: ['كلمة 1', 'كلمة 2'],
    image: '/images/custom-page.jpg'
  }}
/>
```

## 🎯 Custom Meta Tags

You can override any meta tag using the `customMeta` prop:

```tsx
<MetaTags 
  pageType="post" 
  pageData={postData}
  customMeta={{
    title: 'عنوان مخصص يتجاوز الافتراضي',
    description: 'وصف مخصص',
    keywords: ['كلمة مفتاحية مخصصة'],
    image: '/images/custom-og-image.jpg',
    author: 'كاتب مخصص',
    type: 'article'
  }}
/>
```

## 🌐 Language Support

The system supports both Arabic and English:

```tsx
// Arabic (default)
<MetaTags pageType="home" language="ar" />

// English
<MetaTags pageType="home" language="en" />
```

## 📊 Generated Meta Tags

The system automatically generates:

### Basic Meta Tags
- `<title>` - Page title
- `<meta name="description">` - Page description
- `<meta name="keywords">` - SEO keywords
- `<meta name="author">` - Content author
- `<meta name="robots">` - Search engine directives
- `<link rel="canonical">` - Canonical URL

### Open Graph (Facebook)
- `og:title`, `og:description`, `og:image`
- `og:url`, `og:type`, `og:site_name`
- `og:locale`, `article:*` tags for posts

### Twitter Cards
- `twitter:card`, `twitter:title`, `twitter:description`
- `twitter:image`, `twitter:site`, `twitter:creator`

### Additional SEO
- Google Search Console verification
- Geographic and language meta tags
- Mobile app meta tags
- Theme colors and app icons
- JSON-LD structured data

## 🔧 Environment Variables

Set these in your `.env.local` file:

```env
# Required
NEXT_PUBLIC_SITE_URL=https://markaba.news
NEXT_PUBLIC_SITE_NAME=أخبار مركبا
NEXT_PUBLIC_SITE_DESCRIPTION=موقع إخباري شامل

# SEO
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789

# Social Media
NEXT_PUBLIC_TWITTER_HANDLE=@NewsMarkaba
NEXT_PUBLIC_FACEBOOK_PAGE=NewsMarkaba
```

## 📱 Mobile Optimization

The system includes mobile-specific meta tags:

- Apple touch icons and web app settings
- Theme colors for mobile browsers
- Viewport configuration
- App manifest support

## 🔍 Structured Data

Automatic JSON-LD structured data for:

- **Organization Schema** - For all pages
- **NewsArticle Schema** - For post pages
- **CollectionPage Schema** - For category pages
- **WebPage Schema** - For other pages

## 📈 Analytics Integration

Automatic integration with:

- Google Analytics 4
- Facebook Pixel
- Google Search Console

## 🛠️ Customization

### Modify Default Settings

Edit `config/meta.config.js` to change default values:

```javascript
export default {
  defaultMeta: {
    title: 'عنوان افتراضي جديد',
    description: 'وصف افتراضي جديد',
    keywords: ['كلمة جديدة', 'كلمة أخرى']
  },
  // ... other settings
};
```

### Add Custom Meta Tags

Extend the `MetaTags` component to add custom meta tags:

```tsx
// In your page
<>
  <MetaTags pageType="custom" />
  <Head>
    <meta name="custom-tag" content="custom-value" />
  </Head>
</>
```

## 🚨 Common Issues

### 1. Missing Title Tag
**Problem**: Title tag not showing
**Solution**: Ensure `pageType` is set correctly and `meta.config.js` has proper titles

### 2. Duplicate Meta Tags
**Problem**: Multiple meta tags with same name
**Solution**: Use only one `MetaTags` component per page

### 3. Environment Variables Not Working
**Problem**: Analytics not loading
**Solution**: Check `.env.local` file and restart development server

### 4. Images Not Showing in Social Media
**Problem**: Open Graph images not displaying
**Solution**: Ensure image URLs are absolute and images exist

## 📋 SEO Checklist

- [ ] Set up environment variables
- [ ] Configure `meta.config.js`
- [ ] Add `MetaTags` to all pages
- [ ] Test with Facebook Debugger
- [ ] Test with Twitter Card Validator
- [ ] Verify Google Search Console
- [ ] Check structured data with Google's Rich Results Test

## 🔗 Useful Tools

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Console](https://search.google.com/search-console)

## 📞 Support

For questions or issues with the meta tags system:

1. Check this guide first
2. Review the `SEOExamples.tsx` file for usage examples
3. Test your implementation with the tools listed above
4. Ensure all environment variables are properly set

The meta tags system is designed to handle most SEO requirements automatically while providing flexibility for custom needs.