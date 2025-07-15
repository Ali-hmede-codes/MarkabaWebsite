// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'author';
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'editor';
}

// Category types
export interface Category {
  id: number;
  name_ar: string;
  slug: string;
  description_ar?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  post_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
}

export interface CategoryStats {
  total_posts: number;
  published_posts: number;
  featured_posts: number;
  total_views: number;
  average_views: number;
}

// Post types
export interface Post {
  id: number;
  title: string;
  title_ar?: string;
  slug: string;
  content: string;
  content_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  featured_image?: string;
  image?: string;
  category_id: number;
  category?: Category;
  author_id: number;
  author?: User;
  author_name?: string;
  status: 'draft' | 'published';
  is_published?: boolean;
  is_featured: boolean;
  views: number;
  views_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  tags?: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PostFormData {
  title: string;
  title_ar?: string;
  slug: string;
  content: string;
  content_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  featured_image?: string;
  image?: string;
  category_id: number;
  status: 'draft' | 'published';
  is_featured: boolean;
  published_at?: string;
}

export interface PostFilters {
  category?: string;
  search?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  trending?: boolean;
  author?: number;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'views' | 'title';
}

// Breaking News types
export interface BreakingNews {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BreakingNewsFormData {
  title: string;
  content: string;
  is_active: boolean;
}

export interface BreakingNewsStats {
  total: number;
  active: number;
  inactive: number;
}

// Upload types
export interface UploadedFile {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: number;
  uploader?: User;
  created_at: string;
}

export interface UploadStats {
  total_files: number;
  total_size: number;
  images: number;
  videos: number;
  audio: number;
  documents: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

// Dashboard types
export interface DashboardStats {
  posts: {
    total: number;
    published: number;
    draft: number;
    featured: number;
  };
  categories: {
    total: number;
  };
  users: {
    total: number;
    admins: number;
    editors: number;
  };
  breaking_news: {
    total: number;
    active: number;
  };
  uploads: {
    total_files: number;
    total_size: number;
  };
  recent_posts: Post[];
  popular_posts: Post[];
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState {
  isLoading: boolean;
  errors: FormErrors;
  success?: string;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  children?: NavItem[];
  requireAuth?: boolean;
  roles?: ('admin' | 'editor')[];
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  direction: 'ltr' | 'rtl';
  language: 'en' | 'ar';
  isRTL?: boolean;
  name?: string;
}

// Search types
export interface SearchResult {
  type: 'post' | 'category';
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  published_at?: string;
}

export interface SearchFilters {
  query: string;
  type?: 'post' | 'category' | 'all';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Component Props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

// Hook types
export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface UseApiReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: import('../components/API/types').LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: 'admin' | 'editor') => boolean;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
  toggleDirection: () => void;
  setLanguage: (language: 'en' | 'ar') => void;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Event types
export interface CustomEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
}

// File types
export interface FileUploadOptions {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
}

export interface FileUploadResult {
  success: boolean;
  files?: UploadedFile[];
  error?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// SEO types
export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

// Analytics types
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export interface PageView {
  page: string;
  title: string;
  timestamp: number;
  user?: string;
}

// Content types
export interface ContentData {
  site: {
    name: string;
    tagline: string;
    description: string;
    keywords: string;
    email: string;
    phone: string;
    address: string;
  };
  header: {
    search_placeholder: string;
    menu: string;
    close_menu: string;
    search: string;
    home: string;
  };
  navigation: {
    home: string;
    categories: string;
    about: string;
    contact: string;
    breaking_news: string;
    more_categories: string;
    main_links: Array<{
      name: string;
      href: string;
    }>;
    category_links: Array<{
      name: string;
      href: string;
    }>;
  };
  homepage: {
    hero_title: string;
    hero_subtitle: string;
    featured_posts: string;
    latest_posts: string;
    trending_posts: string;
    load_more: string;
    read_more: string;
    no_posts: string;
    loading: string;
  };
  category: {
    posts_in: string;
    no_posts_found: string;
    back_to_home: string;
    page: string;
    of: string;
    previous: string;
    next: string;
    breadcrumb_home: string;
    breadcrumb_categories: string;
  };
  post: {
    by: string;
    published_on: string;
    reading_time: string;
    share: string;
    related_posts: string;
    tags: string;
  };
  footer: {
    about_title: string;
    categories_title: string;
    quick_links_title: string;
    stay_connected: string;
    newsletter_text: string;
    email_placeholder: string;
    subscribe: string;
    follow_us: string;
    rights_reserved: string;
    privacy: string;
    terms: string;
    sitemap: string;
    about: string;
    contact: string;
    advertising: string;
    quick_links: Array<{
      label: string;
      href: string;
    }>;
  };
  categories: {
    politics: string;
    economy: string;
    sports: string;
    technology: string;
    health: string;
    culture: string;
    world: string;
    local: string;
  };
  common: {
    loading: string;
    error: string;
    try_again: string;
    no_results: string;
    search_results: string;
    search_placeholder: string;
    date_format: string;
    time_format: string;
  };
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
    baseUrl: string;
  };
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
  cache: {
    ttl: number;
    enabled: boolean;
  };
  features: {
    darkMode: boolean;
    rtl: boolean;
    multiLanguage: boolean;
    comments: boolean;
    analytics: boolean;
  };
}