// Posts API Component
import React, { useState, useCallback } from 'react';
import { Post, PostFilters, APIComponentProps } from './types';
import { usePosts, usePost, useCreatePost, useUpdatePost, useDeletePost } from './hooks';
import { defaultTheme, createCustomTheme, generateTailwindClasses } from './theme';

interface PostsAPIProps extends APIComponentProps {
  children?: (props: PostsAPIRenderProps) => React.ReactNode;
  showCreateForm?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  showBulkActions?: boolean;
  showAdvancedFilters?: boolean;
  itemsPerPage?: number;
  onPostSelect?: (post: Post) => void;
  onDataChange?: () => void;
}

interface PostsAPIRenderProps {
  // Data
  posts: Post[];
  currentPost: Post | null;
  filters: PostFilters;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchPosts: (filters?: PostFilters) => Promise<void>;
  fetchPost: (id: string | number, slug?: string) => Promise<void>;
  createPost: (postData: Partial<Post>) => Promise<Post>;
  updatePost: (id: string | number, postData: Partial<Post>) => Promise<Post>;
  deletePost: (id: string | number) => Promise<void>;
  setFilters: (filters: PostFilters) => void;
  clearError: () => void;
}

const PostsAPI: React.FC<PostsAPIProps> = ({ 
  children, 
  className = '',
  mode = 'public',
  theme = 'light',
  accentColor,
  showCreateForm = false,
  showFilters = true,
  showBulkActions = false,
  showAdvancedFilters = false,
  onPostSelect,
  onError,
  onSuccess 
}) => {
  const [filters, setFilters] = useState<PostFilters>({});
  const [currentPostId, setCurrentPostId] = useState<string | number | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | undefined>();
  const [selectedPosts, setSelectedPosts] = useState<(string | number)[]>([]);
  
  // Theme configuration
  const currentTheme = accentColor ? createCustomTheme(accentColor) : defaultTheme;
  const styles = generateTailwindClasses(currentTheme);
  
  // Check if admin mode is enabled
  const isAdminMode = mode === 'admin';
  const canCreate = isAdminMode && showCreateForm;
  const canEdit = isAdminMode;
  const canDelete = isAdminMode;
  const canBulkActions = isAdminMode && showBulkActions;
  
  // API hooks
  const { 
    data: postsData, 
    loading: postsLoading, 
    error: postsError, 
    execute: fetchPostsExecute 
  } = usePosts(filters as Record<string, unknown>);
  
  const { 
    data: currentPost, 
    loading: postLoading, 
    error: postError, 
    execute: fetchPostExecute 
  } = usePost(currentPostId || '', currentSlug);
  
  const { 
    loading: creating, 
    error: createError, 
    execute: createExecute 
  } = useCreatePost();
  
  const { 
    loading: updating, 
    error: updateError, 
    execute: updateExecute 
  } = useUpdatePost(currentPostId || '');
  
  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteExecute 
  } = useDeletePost(currentPostId || '');

  // Combined error handling
  const error = postsError || postError || createError || updateError || deleteError;
  const loading = postsLoading || postLoading;

  // Actions
  const fetchPosts = useCallback(async (newFilters?: PostFilters) => {
    try {
      if (newFilters) {
        setFilters(newFilters);
      }
      await fetchPostsExecute(undefined, (newFilters || filters) as Record<string, unknown>);
      onSuccess?.('Posts fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchPostsExecute, filters, onError, onSuccess]);

  const fetchPost = useCallback(async (id: string | number, slug?: string) => {
    try {
      setCurrentPostId(id);
      setCurrentSlug(slug);
      await fetchPostExecute();
      onSuccess?.('Post fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchPostExecute, onError, onSuccess]);

  const createPost = useCallback(async (postData: Partial<Post>) => {
    try {
      const result = await createExecute(postData);
      onSuccess?.('Post created successfully');
      // Refresh posts list
      await fetchPosts();
      return result.data as Post;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [createExecute, fetchPosts, onError, onSuccess]);

  const updatePost = useCallback(async (id: string | number, postData: Partial<Post>) => {
    try {
      setCurrentPostId(id);
      const result = await updateExecute(postData);
      onSuccess?.('Post updated successfully');
      // Refresh posts list
      await fetchPosts();
      return result.data as Post;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [updateExecute, fetchPosts, onError, onSuccess]);

  const deletePost = useCallback(async (id: string | number) => {
    try {
      setCurrentPostId(id);
      await deleteExecute();
      onSuccess?.('Post deleted successfully');
      // Refresh posts list
      await fetchPosts();
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [deleteExecute, fetchPosts, onError, onSuccess]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  const renderProps: PostsAPIRenderProps = {
    // Data
    posts: postsData?.posts || [],
    currentPost: (currentPost as Post) || null,
    filters,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    
    // Actions
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    setFilters,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`posts-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component (can be customized)
  return (
    <div className={`${styles.apiComponent} ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAdminMode ? 'Posts Management' : 'Latest Posts'}
        </h2>
        {canCreate && (
          <button
            onClick={() => {}}
            className={styles.buttonPrimary}
          >
            Create New Post
          </button>
        )}
      </div>

      {showFilters && (
        <div className={`${styles.card} mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search posts..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={styles.input}
            />
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className={styles.input}
            >
              <option value="">All Categories</option>
              {/* Add category options */}
            </select>
            {isAdminMode && (
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as 'published' | 'draft' | 'all' })}
                className={styles.input}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            )}
          </div>
          
          {showAdvancedFilters && isAdminMode && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <select
                value={filters.author || ''}
                onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                className={styles.input}
              >
                <option value="">All Authors</option>
                {/* Add author options */}
              </select>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className={styles.input}
                placeholder="From Date"
              />
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className={styles.input}
                placeholder="To Date"
              />
              <select
                value={filters.sort_by || ''}
                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value as 'created_at' | 'updated_at' | 'title' | 'views' | 'reading_time' })}
                className={styles.input}
              >
                <option value="">Sort By</option>
                <option value="created_at">Date Created</option>
                <option value="updated_at">Date Updated</option>
                <option value="title">Title</option>
                <option value="views">Views</option>
              </select>
            </div>
          )}
        </div>
      )}

      {canBulkActions && selectedPosts.length > 0 && (
        <div className={`${styles.card} mb-4`}>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedPosts.length} post(s) selected
            </span>
            <button
              onClick={() => {/* Handle bulk delete */}}
              className={`${styles.buttonSecondary} text-red-600 border-red-600 hover:bg-red-50`}
            >
              Delete Selected
            </button>
            <button
              onClick={() => {/* Handle bulk status change */}}
              className={styles.buttonSecondary}
            >
              Change Status
            </button>
            <button
              onClick={() => setSelectedPosts([])}
              className={styles.buttonSecondary}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading && (
          <div className={`${styles.statusInfo} text-center`}>
            Loading posts...
          </div>
        )}
        {error && (
          <div className={styles.statusError}>
            {error}
          </div>
        )}
        {renderProps.posts.map((post) => (
          <div key={post.id} className={`${styles.card} hover:shadow-lg transition-shadow`}>
            {canBulkActions && (
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={selectedPosts.includes(post.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPosts([...selectedPosts, post.id]);
                    } else {
                      setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                    }
                  }}
                  className="mr-3"
                />
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title_ar || post.title}
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {post.excerpt_ar || post.excerpt}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Category: {post.category_name_ar || post.category_name || 'Uncategorized'}</span>
                  {isAdminMode && <span>Status: {post.is_published ? 'Published' : 'Draft'}</span>}
                  <span>Views: {post.views}</span>
                  <span>Date: {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => fetchPost(post.id, post.slug)}
                  className={styles.buttonSecondary}
                >
                  View
                </button>
                {canEdit && (
                  <button
                    onClick={() => onPostSelect?.(post)}
                    className={styles.buttonPrimary}
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className={`${styles.buttonSecondary} text-red-600 border-red-600 hover:bg-red-50`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsAPI;