// Categories API Component
import React, { useState, useCallback } from 'react';
import { Category, APIComponentProps } from './types';
import { useCategories, useAPI } from './hooks';

interface CategoriesAPIProps extends APIComponentProps {
  children?: (props: CategoriesAPIRenderProps) => React.ReactNode;
}

interface CategoriesAPIRenderProps {
  // Data
  categories: Category[];
  currentCategory: Category | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchCategories: () => Promise<void>;
  fetchCategory: (id: string | number) => Promise<void>;
  createCategory: (categoryData: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string | number, categoryData: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string | number) => Promise<void>;
  clearError: () => void;
}

const CategoriesAPI: React.FC<CategoriesAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess 
}) => {
  const [currentCategoryId, setCurrentCategoryId] = useState<string | number | null>(null);
  
  // API hooks
  const { 
    data: categoriesData, 
    loading: categoriesLoading, 
    error: categoriesError, 
    execute: fetchCategoriesExecute 
  } = useCategories();
  
  const { 
    data: currentCategory, 
    loading: categoryLoading, 
    error: categoryError, 
    execute: fetchCategoryExecute 
  } = useAPI(`/categories/${currentCategoryId}`, {
    immediate: false,
  });
  
  const { 
    loading: creating, 
    error: createError, 
    execute: createExecute 
  } = useAPI('/categories', {
    method: 'POST',
    immediate: false,
  });
  
  const { 
    loading: updating, 
    error: updateError, 
    execute: updateExecute 
  } = useAPI(`/categories/${currentCategoryId}`, {
    method: 'PUT',
    immediate: false,
  });
  
  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteExecute 
  } = useAPI(`/categories/${currentCategoryId}`, {
    method: 'DELETE',
    immediate: false,
  });

  // Combined error handling
  const error = categoriesError || categoryError || createError || updateError || deleteError;
  const loading = categoriesLoading || categoryLoading;

  // Actions
  const fetchCategories = useCallback(async () => {
    try {
      await fetchCategoriesExecute();
      onSuccess?.('Categories fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchCategoriesExecute, onError, onSuccess]);

  const fetchCategory = useCallback(async (id: string | number) => {
    try {
      setCurrentCategoryId(id);
      await fetchCategoryExecute();
      onSuccess?.('Category fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchCategoryExecute, onError, onSuccess]);

  const createCategory = useCallback(async (categoryData: Partial<Category>) => {
    try {
      const result = await createExecute(categoryData);
      onSuccess?.('Category created successfully');
      // Refresh categories list
      await fetchCategories();
      return result.data as Category;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [createExecute, fetchCategories, onError, onSuccess]);

  const updateCategory = useCallback(async (id: string | number, categoryData: Partial<Category>) => {
    try {
      setCurrentCategoryId(id);
      const result = await updateExecute(categoryData);
      onSuccess?.('Category updated successfully');
      // Refresh categories list
      await fetchCategories();
      return result.data as Category;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [updateExecute, fetchCategories, onError, onSuccess]);

  const deleteCategory = useCallback(async (id: string | number) => {
    try {
      setCurrentCategoryId(id);
      await deleteExecute();
      onSuccess?.('Category deleted successfully');
      // Refresh categories list
      await fetchCategories();
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [deleteExecute, fetchCategories, onError, onSuccess]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  const renderProps: CategoriesAPIRenderProps = {
    // Data
    categories: categoriesData?.categories || [],
    currentCategory: (currentCategory as Category) || null,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    
    // Actions
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`categories-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`categories-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories Management</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderProps.categories.map((category) => (
            <div key={category.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  category.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h4 className="font-medium text-gray-900">{category.name_ar}</h4>
              <p className="text-sm text-gray-600">{category.name}</p>
              
              {category.description_ar && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {category.description_ar}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  {category.post_count || 0} posts
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => fetchCategory(category.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => deleteCategory(category.id)}
                    disabled={deleting}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {renderProps.categories.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No categories found
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesAPI;