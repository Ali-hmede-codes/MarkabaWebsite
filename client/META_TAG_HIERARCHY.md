# Meta Tag Hierarchy and Management

This document outlines the meta tag management system to prevent duplications and conflicts across the application.

## Meta Tag Hierarchy

### 1. Global Meta Tags (_document.tsx)
**Location**: `pages/_document.tsx`
**Purpose**: Site-wide meta tags that apply to all pages

**Includes**:
- Viewport and charset meta tags
- Global favicons and app icons
- Theme colors and app manifest
- Security headers (X-Content-Type-Options, X-XSS-Protection)
- Global Open Graph tags (og:site_name, og:locale)
- Global Twitter tags (twitter:site, twitter:creator)
- Font preconnections
- Sitemap links
- Publisher information

### 2. Layout-Specific Meta Tags
**Location**: `components/Layout/Layout.tsx` and `components/Layout/PostLayout.tsx`
**Purpose**: Page-specific meta tags that vary by content

**Layout.tsx includes**:
- Page title and description
- Page-specific keywords
- Canonical URLs
- Page-specific Open Graph tags (og:title, og:description, og:type, og:url, og:image)
- Page-specific Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
- JSON-LD structured data

**PostLayout.tsx includes**:
- Article-specific meta tags
- Article Open Graph tags with additional properties (article:published_time, article:modified_time, article:author, article:section, article:tag)
- Post-specific images and URLs
- Enhanced structured data for articles

### 3. Admin Layout Meta Tags
**Location**: `components/Layout/AdminLayout.tsx`
**Purpose**: Admin-specific meta tags

**Includes**:
- Admin page titles
- noindex, nofollow robots meta
- Basic favicon reference

## Meta Tag Rules

### DO NOT Duplicate
- **Viewport and charset**: Only in _document.tsx
- **Favicons**: Only in _document.tsx
- **Global social media handles**: Only in _document.tsx (twitter:site, twitter:creator)
- **Site-wide Open Graph**: Only in _document.tsx (og:site_name, og:locale)
- **Font preconnections**: Only in _document.tsx
- **Security headers**: Only in _document.tsx

### Page-Specific Only
- **Title tags**: Each layout should have its own title
- **Description meta**: Page-specific descriptions
- **og:title, og:description, og:url**: Page-specific content
- **twitter:title, twitter:description**: Page-specific content
- **Canonical URLs**: Page-specific URLs
- **JSON-LD structured data**: Page-specific data

### Article-Specific (PostLayout only)
- **article:*** Open Graph tags
- **og:image with dimensions**: Article featured images
- **article:tag**: Post-specific tags

## Best Practices

### 1. Check Before Adding
Before adding any meta tag, verify it's not already defined in:
- `_document.tsx` (global tags)
- Parent layout components
- Common utility functions

### 2. Use Hierarchy
- Global → Layout → Page-specific
- More specific tags override general ones
- Avoid conflicts by following the hierarchy

### 3. Validation
- Test with Facebook Debugger: https://developers.facebook.com/tools/debug/
- Test with Twitter Card Validator: https://cards-dev.twitter.com/validator
- Use browser dev tools to inspect final HTML

### 4. Common Utilities
Use `utils/layoutUtils.tsx` for shared meta tag functions:
- `renderCommonMetaTags()`: Provides reusable meta tag renderers
- Avoid duplicating logic across layouts

## Troubleshooting

### Meta Tags Not Appearing
1. Check if they're defined in multiple places (causing conflicts)
2. Verify the component is actually rendering
3. Check browser cache and hard refresh
4. Inspect HTML source (not just dev tools)

### Duplicate Meta Tags
1. Search codebase for duplicate meta property/name
2. Remove from lower-priority locations
3. Follow the hierarchy rules above

### Social Media Not Working
1. Verify absolute URLs (not relative)
2. Check image dimensions and formats
3. Test with platform-specific validators
4. Clear platform caches (Facebook, Twitter)

## File Structure
```
pages/
  _document.tsx          # Global meta tags
  _app.tsx              # No meta tags (just providers)

components/Layout/
  Layout.tsx            # General page meta tags
  PostLayout.tsx        # Article-specific meta tags
  AdminLayout.tsx       # Admin meta tags

utils/
  layoutUtils.tsx       # Shared meta tag utilities

config/
  meta.config.js        # Meta tag configuration
```

## Testing Checklist

- [ ] No duplicate meta tags in HTML source
- [ ] Facebook Debugger shows correct data
- [ ] Twitter Card Validator shows correct data
- [ ] All images use absolute URLs
- [ ] Structured data validates on Google's tool
- [ ] Page titles are unique and descriptive
- [ ] Meta descriptions are under 160 characters
- [ ] Open Graph images are 1200x630px