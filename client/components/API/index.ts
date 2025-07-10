// API Components Export Index
// This file exports all API-related components for easy importing
// API Components Export
export { default as PostsAPI } from './PostsAPI';
export { default as CategoriesAPI } from './CategoriesAPI';
export { default as AuthAPI } from './AuthAPI';
export { default as PrayerAPI } from './PrayerAPI';
export { default as WeatherAPI } from './WeatherAPI';
export { default as BreakingNewsAPI } from './BreakingNewsAPI';
export { default as UsersAPI } from './UsersAPI';
export { default as MediaAPI } from './MediaAPI';
export { default as SettingsAPI } from './SettingsAPI';

// Export types and hooks
export * from './types';
export * from './hooks';

// Export theme configuration
export { 
  defaultTheme, 
  createCustomTheme, 
  generateThemeStyles, 
  generateTailwindClasses 
} from './theme';
export type { ThemeConfig } from './theme';

// Export examples
export { default as Examples } from './examples';
export {
  PublicHomepage,
  AdminDashboard,
  CustomPostDisplay,
  MobileNewsApp,
  ThemeDemo
} from './examples';

// Re-export for convenience
export type {
  Post,
  Category,
  User,
  AuthResponse,
  PrayerTime,
  WeatherData,
  BreakingNews,
  MediaFile,
  SiteSetting,
  APIResponse,
  Pagination,
  PostFilters,
  APIComponentProps
} from './types';