# API Components Architecture

## Overview
This directory contains modular API components designed for a dual-purpose news website:
- **Main Website**: Read-only operations (GET only) for public content
- **Admin Panel**: Full CRUD operations for content management

## Architecture Design

### Public Website Components (GET Only)
```typescript
// For main website - read-only operations
import { PostsAPI, CategoriesAPI, PrayerAPI, WeatherAPI } from '@/components/API';

// Usage examples:
<PostsAPI mode="public" />           // Only fetches posts
<CategoriesAPI mode="public" />     // Only fetches categories
<PrayerAPI />                       // Read-only prayer times
<WeatherAPI />                      // Read-only weather data
```

### Admin Panel Components (Full CRUD)
```typescript
// For admin panel - full CRUD operations
import { 
  PostsAPI, 
  CategoriesAPI, 
  UsersAPI, 
  MediaAPI, 
  SettingsAPI,
  BreakingNewsAPI 
} from '@/components/API';

// Usage examples:
<PostsAPI mode="admin" />           // Full CRUD for posts
<CategoriesAPI mode="admin" />     // Full CRUD for categories
<UsersAPI />                       // User management
<MediaAPI />                       // File uploads/management
<SettingsAPI />                    // Site configuration
<BreakingNewsAPI />                // Breaking news management
```

## Component Modes

Each API component supports different modes:

### Mode: "public" (Default for main website)
- Only GET operations enabled
- No create/edit/delete buttons
- Optimized for content display
- Lightweight UI components

### Mode: "admin" (For admin panel)
- Full CRUD operations
- Create/Edit/Delete functionality
- Advanced filtering and sorting
- Bulk operations support

## Theme Configuration

### Light Theme Design
```css
/* Primary Colors */
--bg-primary: #ffffff;           /* White background */
--bg-secondary: #f8f9fa;         /* Light gray for cards */
--text-primary: #212529;         /* Dark text */
--text-secondary: #6c757d;       /* Gray text */
--accent-color: var(--custom-accent); /* Your chosen accent color */

/* Component Styling */
.api-component {
  background: var(--bg-primary);
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.api-button-primary {
  background: var(--accent-color);
  color: white;
  border: none;
}

.api-button-secondary {
  background: transparent;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
}
```

## Security Implementation

### Authentication Flow
1. **Public Routes**: No authentication required
2. **Admin Routes**: JWT token validation
3. **Role-based Access**: Admin-only operations protected

### Component Security
```typescript
// Automatic mode detection based on user role
const mode = user?.role === 'admin' ? 'admin' : 'public';

// Protected admin operations
if (mode === 'admin' && !user?.permissions?.includes('manage_posts')) {
  return <UnauthorizedMessage />;
}
```

## File Structure
```
API/
├── index.ts                 # Main exports
├── types.ts                 # TypeScript interfaces
├── hooks.ts                 # Custom React hooks
├── PostsAPI.tsx            # Posts management
├── CategoriesAPI.tsx       # Categories management
├── AuthAPI.tsx             # Authentication
├── PrayerAPI.tsx           # Prayer times (read-only)
├── WeatherAPI.tsx          # Weather data (read-only)
├── BreakingNewsAPI.tsx     # Breaking news (admin)
├── UsersAPI.tsx            # User management (admin)
├── MediaAPI.tsx            # File management (admin)
├── SettingsAPI.tsx         # Site settings (admin)
└── README.md               # This file
```

## Usage Guidelines

### For Main Website Pages
```typescript
// pages/index.tsx - Homepage
import { PostsAPI, CategoriesAPI } from '@/components/API';

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      <PostsAPI 
        mode="public"
        showFilters={true}
        showPagination={true}
        itemsPerPage={10}
      />
    </div>
  );
}
```

### For Admin Panel Pages
```typescript
// pages/admin/posts.tsx - Admin Posts Management
import { PostsAPI } from '@/components/API';
import { useAuth } from '@/context/AuthContext';

export default function AdminPosts() {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="bg-white min-h-screen p-6">
      <PostsAPI 
        mode="admin"
        showCreateForm={true}
        showBulkActions={true}
        showAdvancedFilters={true}
      />
    </div>
  );
}
```

## Performance Optimization

1. **Lazy Loading**: Components load only when needed
2. **Caching**: API responses cached for better performance
3. **Pagination**: Large datasets split into pages
4. **Debounced Search**: Search queries optimized
5. **Memoization**: React.memo for expensive components

## Next Steps

1. Update each API component to support mode prop
2. Create theme configuration file
3. Implement role-based component rendering
4. Add comprehensive error boundaries
5. Create admin layout wrapper components
6. Implement responsive design for mobile