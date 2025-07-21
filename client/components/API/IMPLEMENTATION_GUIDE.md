# API Components Implementation Guide

## Overview

This guide explains how to implement the dual-mode API components architecture for your News Markaba website, supporting both public read-only access and admin full-CRUD functionality.

## Architecture Summary

### Public Website (GET Only)
- **Purpose**: Display content to visitors
- **Operations**: Read-only (GET requests)
- **Features**: Content browsing, filtering, pagination
- **Theme**: Light theme with customizable accent color

### Admin Panel (Full CRUD)
- **Purpose**: Content management for administrators
- **Operations**: Create, Read, Update, Delete
- **Features**: Advanced filtering, bulk operations, file uploads
- **Theme**: Same light theme with admin-specific UI elements

## Quick Start

### 1. Basic Public Website Implementation

```typescript
// pages/index.tsx - Homepage
import React from 'react';
import { PostsAPI, CategoriesAPI, PrayerAPI, WeatherAPI } from '@/components/API';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with real-time data */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">News Markaba</h1>
          <div className="flex gap-6">
            <PrayerAPI mode="public" accentColor="#059669" />
            <WeatherAPI mode="public" accentColor="#0ea5e9" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <PostsAPI 
              mode="public"
              accentColor="#7c3aed"
              showFilters={true}
              showPagination={true}
              itemsPerPage={12}
            />
          </div>
          <div className="lg:col-span-1">
            <CategoriesAPI mode="public" accentColor="#7c3aed" />
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 2. Basic Admin Panel Implementation

```typescript
// pages/admin/administratorpage/index.tsx - Admin Dashboard
import React from 'react';
import { PostsAPI, UsersAPI, SettingsAPI } from '@/components/API';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <PostsAPI 
          mode="admin"
          accentColor="#6366f1"
          showCreateForm={true}
          showBulkActions={true}
          showAdvancedFilters={true}
        />
      </div>
    </div>
  );
}
```

## Component Modes

### Public Mode Features
- ✅ Read-only data display
- ✅ Basic filtering and search
- ✅ Pagination
- ✅ Responsive design
- ❌ No create/edit/delete buttons
- ❌ No admin-specific fields

### Admin Mode Features
- ✅ Full CRUD operations
- ✅ Advanced filtering
- ✅ Bulk operations
- ✅ File uploads
- ✅ Status management
- ✅ User role validation

## Theme Customization

### Using Custom Accent Colors

```typescript
// Different accent colors for different sections
<PostsAPI accentColor="#7c3aed" />     // Purple for posts
<PrayerAPI accentColor="#059669" />   // Green for prayer times
<WeatherAPI accentColor="#0ea5e9" />  // Blue for weather
<BreakingNewsAPI accentColor="#dc2626" /> // Red for breaking news
```

### Creating Custom Themes

```typescript
import { createCustomTheme, generateTailwindClasses } from '@/components/API';

const myTheme = createCustomTheme('#ff6b6b'); // Custom red theme
const styles = generateTailwindClasses(myTheme);

// Use in your components
<div className={styles.apiComponent}>
  <button className={styles.buttonPrimary}>Custom Button</button>
</div>
```

## Security Implementation

### 1. Route Protection

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (request.nextUrl.pathname.startsWith('/admin/administratorpage')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Verify admin role
    const user = verifyToken(token.value);
    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/administratorpage/:path*']
};
```

### 2. Component-Level Security

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user' 
}) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <div>Please log in to access this page.</div>;
  }
  
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <div>Admin access required.</div>;
  }
  
  return <>{children}</>;
};
```

## API Integration

### 1. Backend Route Structure

Your backend should support these endpoints:

```javascript
// Public routes (GET only)
GET /api/posts              // List posts
GET /api/posts/:slug        // Get single post
GET /api/categories         // List categories
GET /api/prayer             // Prayer times
GET /api/weather            // Weather data

// Admin routes (Full CRUD)
POST /api/posts             // Create post
PUT /api/posts/:id          // Update post
DELETE /api/posts/:id       // Delete post
PATCH /api/posts/bulk       // Bulk operations

// Similar patterns for other resources
```

### 2. Frontend API Configuration

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Performance Optimization

### 1. Lazy Loading Components

```typescript
// Lazy load admin components
const AdminPostsAPI = lazy(() => import('@/components/API/PostsAPI'));
const AdminUsersAPI = lazy(() => import('@/components/API/UsersAPI'));

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <AdminPostsAPI mode="admin" />
</Suspense>
```

### 2. Caching Strategy

```typescript
// hooks/useCache.ts
import { useState, useEffect } from 'react';

const cache = new Map();

export const useCache = (key: string, fetcher: () => Promise<any>, ttl = 300000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      setLoading(false);
      return;
    }
    
    fetcher().then((result) => {
      cache.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      setLoading(false);
    });
  }, [key]);
  
  return { data, loading };
};
```

## Mobile Responsiveness

### 1. Responsive Grid Layouts

```typescript
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Content */}
</div>

// Stack on mobile, side-by-side on desktop
<div className="flex flex-col lg:flex-row gap-6">
  <main className="flex-1">
    <PostsAPI mode="public" itemsPerPage={8} />
  </main>
  <aside className="lg:w-80">
    <CategoriesAPI mode="public" />
  </aside>
</div>
```

### 2. Mobile Navigation

```typescript
// Mobile bottom navigation
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden">
  <div className="flex justify-around py-2">
    {navItems.map((item) => (
      <button key={item.id} className="flex flex-col items-center p-2">
        <span className="text-2xl">{item.icon}</span>
        <span className="text-xs">{item.label}</span>
      </button>
    ))}
  </div>
</nav>
```

## Testing

### 1. Component Testing

```typescript
// __tests__/PostsAPI.test.tsx
import { render, screen } from '@testing-library/react';
import { PostsAPI } from '@/components/API';

describe('PostsAPI', () => {
  it('renders in public mode', () => {
    render(<PostsAPI mode="public" />);
    expect(screen.getByText('Latest Posts')).toBeInTheDocument();
    expect(screen.queryByText('Create New Post')).not.toBeInTheDocument();
  });
  
  it('renders in admin mode', () => {
    render(<PostsAPI mode="admin" showCreateForm={true} />);
    expect(screen.getByText('Posts Management')).toBeInTheDocument();
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
  });
});
```

### 2. API Testing

```typescript
// __tests__/api.test.ts
import { usePosts } from '@/components/API/hooks';
import { renderHook } from '@testing-library/react';

describe('API Hooks', () => {
  it('fetches posts correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePosts());
    
    await waitForNextUpdate();
    
    expect(result.current.posts).toBeDefined();
    expect(result.current.loading).toBe(false);
  });
});
```

## Deployment Considerations

### 1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_SITE_URL=https://your-site-domain.com
NEXT_PUBLIC_DEFAULT_ACCENT_COLOR=#7c3aed
```

### 2. Build Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    domains: ['your-cdn-domain.com'],
  },
};
```

## Best Practices

1. **Always use the `mode` prop** to differentiate between public and admin functionality
2. **Implement proper error boundaries** for graceful error handling
3. **Use TypeScript** for better type safety and developer experience
4. **Follow the light theme guidelines** for consistent UI
5. **Implement proper loading states** for better user experience
6. **Use semantic HTML** for better accessibility
7. **Test both modes** thoroughly before deployment
8. **Implement proper caching** for better performance
9. **Use responsive design** for mobile compatibility
10. **Follow security best practices** for admin routes

## Troubleshooting

### Common Issues

1. **Components not showing admin features**: Check if `mode="admin"` is set
2. **Theme not applying**: Ensure `accentColor` prop is passed correctly
3. **API calls failing**: Verify backend endpoints and authentication
4. **Mobile layout issues**: Check responsive classes and viewport meta tag
5. **Performance issues**: Implement lazy loading and caching

### Debug Mode

```typescript
// Enable debug mode for development
<PostsAPI 
  mode="admin" 
  debug={process.env.NODE_ENV === 'development'}
  onError={(error) => console.error('PostsAPI Error:', error)}
  onSuccess={(message) => console.log('PostsAPI Success:', message)}
/>
```

This implementation guide provides a comprehensive foundation for building your dual-mode news website with clean separation between public and admin functionality.
