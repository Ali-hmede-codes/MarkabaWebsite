// Shared Types for API Components

// Base API Response
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface Pagination {
  page?: number;
  limit?: number;
  total: number;
  pages?: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

// Post Types
export interface Post {
  id: number;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  slug: string;
  category_id: number;
  category?: Category;
  author_id: number;
  author?: User;
  author_name?: string;
  featured_image?: string;
  image?: string;
  tags?: string[];
  meta_description?: string;
  meta_description_ar?: string;
  meta_keywords?: string;
  meta_keywords_ar?: string;
  reading_time?: number;
  views: number;
  views_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  is_featured: boolean;
  is_published?: boolean;
  status?: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
  url?: string;
  category_name?: string;
  category_name_ar?: string;
  author_display_name?: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
  filters: Record<string, unknown>;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  description_ar?: string;
  color?: string;
  icon?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  post_count?: number;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoriesResponse {
  categories: Category[];
  pagination?: Pagination;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  name: string;
  role: 'admin' | 'editor' | 'author';
  avatar?: string;
  bio?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Auth Types
export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Prayer Types
export interface PrayerTime {
  name: string;
  time: string;
  arabic_name?: string;
}

export interface PrayerData {
  date: string;
  prayers: PrayerTime[];
  location: {
    city: string;
    country: string;
  };
  settings: {
    method: number;
    madhab: number;
  };
  last_updated: string;
}

// Weather Types
export interface WeatherData {
  location?: string | {
    city: string;
    country: string;
  };
  temperature: number;
  condition: string;
  description?: string;
  icon?: string;
  humidity?: number;
  wind_speed?: number;
  feels_like?: number;
  pressure?: number;
  date?: string;
  min_temperature?: number;
  max_temperature?: number;
  current?: {
    temperature: number;
    description: string;
    icon: string;
    humidity: number;
    wind_speed: number;
    feels_like: number;
  };
  forecast?: Array<{
    date: string;
    temperature: {
      min: number;
      max: number;
    };
    description: string;
    icon: string;
  }>;
  last_updated?: string;
}

// Breaking News Types
export interface BreakingNews {
  id: number;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Social Media Types
export interface SocialMedia {
  id: number;
  platform: string;
  name_ar: string;
  url: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaResponse {
  success: boolean;
  data: SocialMedia[];
}

// Media Types
export interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  alt_text?: string;
  caption?: string;
  uploaded_by: number;
  created_at: string;
}

// Settings Types
export interface SiteSetting {
  id: number;
  key: string;
  value: unknown;
  value_ar?: unknown;
  type: 'text' | 'number' | 'boolean' | 'json' | 'textarea' | 'select' | 'color';
  label?: string;
  description?: string;
  category?: string;
  options?: string;
  default_value?: unknown;
  is_public: boolean;
  updated_at: string;
}

// API Component Props
export interface APIComponentProps {
  className?: string;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  mode?: 'public' | 'admin';
  theme?: 'light' | 'dark';
  accentColor?: string;
}

// Filter Types
export interface PostFilters {
  status?: 'published' | 'draft' | 'all';
  category?: string | number;
  author?: string | number;
  featured?: boolean;
  search?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'views' | 'reading_time';
  sort_order?: 'asc' | 'desc';
  language?: 'ar' | 'en' | 'both';
  min_reading_time?: number;
  max_reading_time?: number;
  min_views?: number;
  max_views?: number;
  page?: number;
  limit?: number;
}