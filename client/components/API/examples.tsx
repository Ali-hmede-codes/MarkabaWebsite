// Example Usage Components for API Components
// This file demonstrates how to use the API components in different scenarios

import React from 'react';
import {
  PostsAPI,
  CategoriesAPI,
  AuthAPI,
  PrayerAPI,
  WeatherAPI,
  BreakingNewsAPI,
  UsersAPI,
  MediaAPI,
  SettingsAPI
} from './index';

// Example 1: Public Website Homepage
export const PublicHomepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Prayer Times and Weather */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">News Markaba</h1>
          <div className="flex gap-6">
            <PrayerAPI 
              mode="public"
              accentColor="#059669" // Green accent
              className="text-sm"
            />
            <WeatherAPI 
              mode="public"
              accentColor="#0ea5e9" // Blue accent
              className="text-sm"
            />
          </div>
        </div>
      </header>

      {/* Breaking News Banner */}
      <BreakingNewsAPI 
        mode="public"
        accentColor="#dc2626" // Red accent for urgency
        className="bg-red-50 border-b border-red-200"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Posts Section */}
          <div className="lg:col-span-3">
            <PostsAPI 
              mode="public"
              accentColor="#7c3aed" // Purple accent
              showFilters={true}
              showPagination={true}
              itemsPerPage={12}
              onPostSelect={(post) => {
                // Navigate to post detail page
                window.location.href = `/posts/${post.slug}`;
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CategoriesAPI 
              mode="public"
              accentColor="#7c3aed"
              className="mb-6"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// Example 2: Admin Dashboard
export const AdminDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState('posts');
  const accentColor = '#6366f1'; // Indigo accent for admin

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <AuthAPI 
              mode="admin"
              accentColor={accentColor}
              onSuccess={(message) => console.log(message)}
              onError={(error) => console.error(error)}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Admin Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'posts', label: 'Posts' },
              { id: 'categories', label: 'Categories' },
              { id: 'users', label: 'Users' },
              { id: 'media', label: 'Media' },
              { id: 'breaking', label: 'Breaking News' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Admin Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {selectedTab === 'posts' && (
            <PostsAPI 
              mode="admin"
              accentColor={accentColor}
              showCreateForm={true}
              showFilters={true}
              showBulkActions={true}
              showAdvancedFilters={true}
              showPagination={true}
              itemsPerPage={20}
              onDataChange={() => {
                console.log('Posts data changed');
              }}
            />
          )}

          {selectedTab === 'categories' && (
            <CategoriesAPI 
              mode="admin"
              accentColor={accentColor}
              onSuccess={() => {
                console.log('Categories data changed');
              }}
            />
          )}

          {selectedTab === 'users' && (
            <UsersAPI 
              mode="admin"
              accentColor={accentColor}
              onSuccess={() => {
                console.log('Users data changed');
              }}
            />
          )}

          {selectedTab === 'media' && (
            <MediaAPI 
              mode="admin"
              accentColor={accentColor}
              showUpload={true}
              onSuccess={() => {
                console.log('Media data changed');
              }}
            />
          )}

          {selectedTab === 'breaking' && (
            <BreakingNewsAPI 
              mode="admin"
              accentColor={accentColor}
              autoRefresh={true}
              onSuccess={() => {
                console.log('Breaking news data changed');
              }}
            />
          )}

          {selectedTab === 'settings' && (
            <SettingsAPI 
              mode="admin"
              accentColor={accentColor}
              onSuccess={() => {
                console.log('Settings data changed');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Example 3: Custom Post Display Component
export const CustomPostDisplay: React.FC = () => {
  return (
    <PostsAPI mode="public" accentColor="#10b981">
      {({ posts, loading, error, fetchPosts, pagination }) => (
        <div className="custom-post-layout">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Error: {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {post.featured_image && (
                  <img 
                    src={post.featured_image} 
                    alt={post.title_ar}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title_ar || post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt_ar || post.excerpt}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{post.category_name_ar || post.category_name || 'Uncategorized'}</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          
          {pagination && pagination.total > pagination.limit && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={() => fetchPosts({ page: pagination.page + 1 })}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </PostsAPI>
  );
};

// Example 4: Mobile-Optimized Layout
export const MobileNewsApp: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">News</h1>
          <div className="flex items-center gap-2 text-xs">
            <PrayerAPI mode="public" accentColor="#059669" className="text-xs" />
            <WeatherAPI mode="public" accentColor="#0ea5e9" className="text-xs" />
          </div>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="pb-16">
        {activeTab === 'home' && (
          <div className="p-4">
            <BreakingNewsAPI 
              mode="public"
              accentColor="#dc2626"
              className="mb-4"
            />
            <PostsAPI 
              mode="public"
              accentColor="#7c3aed"
              showFilters={false}
              showPagination={true}
              itemsPerPage={8}
            />
          </div>
        )}
        
        {activeTab === 'categories' && (
          <div className="p-4">
            <CategoriesAPI 
              mode="public"
              accentColor="#7c3aed"
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {[
            { id: 'home', label: 'Home', icon: '🏠' },
            { id: 'categories', label: 'Categories', icon: '📂' },
            { id: 'search', label: 'Search', icon: '🔍' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Example 5: Theme Customization Demo
export const ThemeDemo: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState('#3b82f6');
  
  const themes = [
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Green', color: '#10b981' },
    { name: 'Purple', color: '#7c3aed' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Pink', color: '#ec4899' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Theme Customization Demo</h1>
        
        {/* Theme Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Theme Color</h2>
          <div className="flex gap-4">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => setCurrentTheme(theme.color)}
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  currentTheme === theme.color
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: theme.color }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
        
        {/* Component Demos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Public Mode</h3>
            <PostsAPI 
              mode="public"
              accentColor={currentTheme}
              showFilters={true}
              itemsPerPage={5}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Mode</h3>
            <PostsAPI 
              mode="admin"
              accentColor={currentTheme}
              showCreateForm={true}
              showBulkActions={true}
              itemsPerPage={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  PublicHomepage,
  AdminDashboard,
  CustomPostDisplay,
  MobileNewsApp,
  ThemeDemo
};