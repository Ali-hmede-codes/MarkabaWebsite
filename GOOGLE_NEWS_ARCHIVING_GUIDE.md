# Google News Archiving Setup Guide for Markaba News

## Overview
This guide ensures that your news posts are properly archived and indexed by Google News for maximum visibility and SEO benefits.

## ✅ Current Status - WORKING CORRECTLY

### Sitemap Configuration
- **sitemap-posts.xml**: ✅ Working - Contains all posts with Google News elements
- **sitemap.xml**: ✅ Working - Contains recent posts with Google News elements
- **sitemap-categories.xml**: ✅ Working - Contains all categories

### Google News Elements Implemented
1. **news:publication** - Site name and language
2. **news:publication_date** - Article publication date
3. **news:title** - Article title with CDATA encoding
4. **news:keywords** - Article keywords/meta description

### Recent Posts Detection
- Posts updated within **48 hours** automatically get Google News elements
- Recent posts have higher priority (0.9) and hourly changefreq
- Older posts have standard priority (0.7) and weekly changefreq

## 📍 Sitemap URLs

### Production URLs (when deployed)
- Main sitemap: `https://markaba.news/sitemap.xml`
- Posts sitemap: `https://markaba.news/sitemap-posts.xml`
- Categories sitemap: `https://markaba.news/sitemap-categories.xml`

### Development URLs (current)
- Main sitemap: `http://localhost:3000/sitemap.xml`
- Posts sitemap: `http://localhost:3000/sitemap-posts.xml`
- Categories sitemap: `http://localhost:3000/sitemap-categories.xml`

## 🔧 Technical Implementation

### XML Namespaces
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
```

### Google News Structure
```xml
<news:news>
  <news:publication>
    <news:name>Markaba News</news:name>
    <news:language>ar</news:language>
  </news:publication>
  <news:publication_date>2025-08-02T17:14:39.000Z</news:publication_date>
  <news:title><![CDATA[Article Title]]></news:title>
  <news:keywords><![CDATA[Keywords]]></news:keywords>
</news:news>
```

## 📋 Google Search Console Setup

### 1. Submit Sitemaps
In Google Search Console, submit these sitemaps:
- `https://markaba.news/sitemap.xml`
- `https://markaba.news/sitemap-posts.xml`
- `https://markaba.news/sitemap-categories.xml`

### 2. Monitor Indexing
- Check "Coverage" report for indexing status
- Monitor "News" section for Google News inclusion
- Watch for any crawl errors or warnings

### 3. Google News Publisher Center
- Apply for Google News inclusion if not already done
- Ensure site meets Google News content policies
- Submit publication information

## 🚀 SEO Best Practices Implemented

### 1. Multilingual Support
- `hreflang` attributes for Arabic and English
- Proper language declaration in news elements

### 2. Caching Headers
- Appropriate cache control for sitemap files
- Content-Type headers set correctly

### 3. Priority and Frequency
- Recent posts: Priority 0.9, hourly updates
- Older posts: Priority 0.7, weekly updates
- Categories: Priority 0.8, daily updates
- Static pages: Appropriate priorities

### 4. Security Headers
- X-Content-Type-Options: nosniff
- X-Robots-Tag: noindex (for sitemap files)

## 📊 Current Statistics
- **Total Posts in Sitemap**: All available posts
- **Recent Posts with News Elements**: Posts updated within 48 hours
- **Categories**: All active categories
- **Languages Supported**: Arabic (primary), English (alternate)

## 🔍 Verification Commands

### Check Sitemap Status
```bash
# Check posts sitemap
curl -I https://markaba.news/sitemap-posts.xml

# Count Google News elements
curl -s https://markaba.news/sitemap-posts.xml | grep -c "<news:news>"

# Validate XML
curl -s https://markaba.news/sitemap-posts.xml | xmllint --format -
```

### Monitor Recent Posts
```bash
# Check recent posts API
curl "https://api.markaba.news/posts?limit=5&sort=latest"
```

## 📈 Expected Results

### Google News Inclusion
- Recent articles should appear in Google News within 24-48 hours
- Articles remain in Google News for 30 days
- Archived articles remain in Google Search indefinitely

### SEO Benefits
- Improved search visibility
- Faster indexing of new content
- Better categorization in search results
- Enhanced rich snippets

## 🛠️ Maintenance

### Regular Checks
1. Monitor sitemap accessibility
2. Verify Google News elements are generated
3. Check for crawl errors in Search Console
4. Ensure recent posts are properly marked

### Updates Required
- No manual updates needed - sitemaps are generated automatically
- Posts are automatically included when published
- Google News elements are added automatically for recent posts

## ✅ Conclusion

Your Markaba News site is now properly configured for Google News archiving:

1. ✅ Sitemaps are generating correctly
2. ✅ Google News elements are included for recent posts
3. ✅ XML formatting is valid
4. ✅ Multilingual support is implemented
5. ✅ SEO best practices are followed

**Next Steps:**
1. Deploy to production
2. Submit sitemaps to Google Search Console
3. Monitor indexing and news inclusion
4. Apply for Google News Publisher if needed

Your news articles should now be properly archived and discoverable through Google News and Google Search!