# Ad Components Usage Guide

## Overview
This guide shows how to use the ad display components in your Next.js application. All components are ready to use and will automatically fetch and display active ads from your database.

## Available Ad Components

### 1. Main Page Components
```tsx
import { MainTopAd, MiddleMainAd, BottomMainAd } from '../components/ads';

// Use in your main page layout
<MainTopAd className="mb-4" />           // Top of homepage
<MiddleMainAd className="my-6" />        // Middle of homepage  
<BottomMainAd className="mt-4" />        // Bottom of homepage
```

### 2. Post/Article Components
```tsx
import { PostBottomAd, SquarePostMiddleAd } from '../components/ads';

// Use in post/article pages
<PostBottomAd className="mt-6" />        // After post content
<SquarePostMiddleAd className="mx-auto my-4" /> // Middle of post (square format)
```

### 3. Sidebar Components
```tsx
import { SidebarTopAd, SidebarMiddleAd } from '../components/ads';

// Use in sidebar layouts
<SidebarTopAd className="mb-4" />        // Top of sidebar
<SidebarMiddleAd className="my-4" />     // Middle of sidebar
```

## Integration Examples

### Homepage Layout Example
```tsx
// pages/index.tsx
import { MainTopAd, MiddleMainAd, BottomMainAd } from '../components/ads';
import { SidebarTopAd, SidebarMiddleAd } from '../components/ads';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Top banner ad */}
      <MainTopAd className="mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <LatestNews />
          
          {/* Middle ad */}
          <MiddleMainAd className="my-8" />
          
          <MoreContent />
          
          {/* Bottom ad */}
          <BottomMainAd className="mt-8" />
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <SidebarTopAd className="mb-6" />
          <SidebarContent />
          <SidebarMiddleAd className="my-6" />
          <MoreSidebarContent />
        </div>
      </div>
    </div>
  );
}
```

### Post Page Layout Example
```tsx
// pages/post/[id]/[slug].tsx
import { PostBottomAd, SquarePostMiddleAd } from '../../components/ads';
import { SidebarTopAd, SidebarMiddleAd } from '../../components/ads';

export default function PostPage({ post }) {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post content */}
        <div className="lg:col-span-2">
          <article>
            <h1>{post.title}</h1>
            <div className="post-meta">{post.date}</div>
            
            {/* First part of content */}
            <div dangerouslySetInnerHTML={{ __html: post.content.slice(0, post.content.length / 2) }} />
            
            {/* Square ad in middle of post */}
            <SquarePostMiddleAd className="my-6" />
            
            {/* Rest of content */}
            <div dangerouslySetInnerHTML={{ __html: post.content.slice(post.content.length / 2) }} />
          </article>
          
          {/* Ad after post content */}
          <PostBottomAd className="mt-8" />
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <SidebarTopAd className="mb-6" />
          <RelatedPosts />
          <SidebarMiddleAd className="my-6" />
          <PopularPosts />
        </div>
      </div>
    </div>
  );
}
```

## Component Features

### Automatic Ad Loading
- Components automatically fetch active ads for their position
- No manual API calls needed
- Handles loading states and errors gracefully

### Click Tracking
- Automatic click tracking when users click on ads
- Opens ad links in new tabs
- Tracks clicks even if tracking fails

### Responsive Design
- Components adapt to different screen sizes
- Proper spacing and alignment
- Mobile-friendly layouts

### Error Handling
- Gracefully handles no ads available
- Doesn't break page layout if ads fail to load
- Silent fallback when no active ads exist

## Ad Position Database Mapping

| Component | Database Position | Typical Size | Usage |
|-----------|------------------|--------------|-------|
| MainTopAd | main_top | 1280x300 | Homepage header |
| MiddleMainAd | middle_main | 1280x300 | Homepage middle |
| BottomMainAd | bottom_main | 1280x300 | Homepage footer |
| PostBottomAd | post_bottom | 1280x300 | After articles |
| SquarePostMiddleAd | square_post_middle | 300x300 | Article middle |
| SidebarTopAd | sidebar_top | 300x250 | Sidebar top |
| SidebarMiddleAd | sidebar_middle | 300x250 | Sidebar middle |

## Styling and Customization

### Custom CSS Classes
```tsx
// Add custom styling
<MainTopAd className="custom-ad-style border rounded-lg shadow-md" />

// Responsive classes
<SidebarTopAd className="hidden lg:block" /> // Only show on desktop
<SquarePostMiddleAd className="mx-auto" />   // Center the ad
```

### Custom Styles
```tsx
// Inline styles
<MiddleMainAd 
  className="my-4" 
  style={{ 
    backgroundColor: '#f5f5f5', 
    padding: '10px',
    borderRadius: '8px'
  }} 
/>
```

## Managing Ads

### Admin Panel
1. Go to `/admin/administratorpage/ads`
2. Create new ads with:
   - Title and image
   - Target URL
   - Position selection
   - Expiration date
   - Active/inactive status

### Ad Positions Available
- **main_top**: Homepage top banner
- **middle_main**: Homepage middle section
- **bottom_main**: Homepage bottom section
- **post_bottom**: After article content
- **square_post_middle**: Square ad in article middle
- **sidebar_top**: Top of sidebar
- **sidebar_middle**: Middle of sidebar

## Testing

### Check Ad Display
1. Create test ads in admin panel
2. Set them as active with future expiration
3. Visit pages where components are used
4. Verify ads display correctly

### Debug Issues
- Check browser console for errors
- Verify ad positions match database
- Ensure ads are active and not expired
- Check image paths are correct

## Performance Notes

- Components only render when ads are available
- Minimal impact on page load times
- Efficient caching of ad data
- Lazy loading of ad images

## Next Steps

1. **Import components** into your existing pages
2. **Create test ads** through the admin panel
3. **Verify display** on frontend pages
4. **Customize styling** to match your design
5. **Monitor performance** and click tracking

Your complete ads system is now ready for production use!