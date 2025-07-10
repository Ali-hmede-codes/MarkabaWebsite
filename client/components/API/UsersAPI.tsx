// Users API Component
import React, { useState, useCallback } from 'react';
import { User, APIComponentProps, Pagination } from './types';
import { useUsers, useAPI } from './hooks';

interface UsersAPIProps extends APIComponentProps {
  children?: (props: UsersAPIRenderProps) => React.ReactNode;
  showPagination?: boolean;
  itemsPerPage?: number;
}

interface UsersAPIRenderProps {
  // Data
  users: User[];
  currentUser: User | null;
  pagination: Pagination | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchUsers: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchUser: (id: string | number) => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string | number, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string | number) => Promise<void>;
  updateUserRole: (id: string | number, role: string) => Promise<void>;
  toggleUserStatus: (id: string | number) => Promise<void>;
  clearError: () => void;
}

const UsersAPI: React.FC<UsersAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess,
  showPagination = true,
  itemsPerPage = 10
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // API hooks
  const { 
    data: usersData, 
    loading: usersLoading, 
    error: usersError, 
    execute: fetchUsersExecute 
  } = useUsers();
  
  const { 
    data: currentUser, 
    loading: userLoading, 
    error: userError, 
    execute: fetchUserExecute 
  } = useAPI(`/users/${currentUserId}`, {
    immediate: false,
  });
  
  const { 
    loading: creating, 
    error: createError, 
    execute: createExecute 
  } = useAPI('/users', {
    method: 'POST',
    immediate: false,
  });
  
  const { 
    loading: updating, 
    error: updateError, 
    execute: updateExecute 
  } = useAPI('/users', {
    method: 'PUT',
    immediate: false,
  });
  
  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteExecute 
  } = useAPI('/users', {
    method: 'DELETE',
    immediate: false,
  });

  // Combined error handling
  const error = usersError || userError || createError || updateError || deleteError;
  const loading = usersLoading || userLoading;

  // Extract users and pagination from response
  const users = Array.isArray(usersData) ? usersData : (usersData as any)?.data || [];
  const paginationData = (usersData as any)?.pagination || null;

  // Actions
  const fetchUsers = useCallback(async (page: number = 1, limit: number = itemsPerPage, filters: any = {}) => {
    try {
      const params = { page, limit, ...filters };
      const result = await fetchUsersExecute(undefined, { params });
      
      if ((result.data as any)?.pagination) {
        setPagination((result.data as any).pagination);
      }
      
      onSuccess?.('Users fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchUsersExecute, itemsPerPage, onError, onSuccess]);

  const fetchUser = useCallback(async (id: string | number) => {
    try {
      setCurrentUserId(id);
      await fetchUserExecute();
      onSuccess?.('User fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchUserExecute, onError, onSuccess]);

  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      const result = await createExecute(userData);
      onSuccess?.('User created successfully');
      // Refresh users list
      await fetchUsers();
      return result.data as User;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [createExecute, fetchUsers, onError, onSuccess]);

  const updateUser = useCallback(async (id: string | number, userData: Partial<User>) => {
    try {
      const result = await updateExecute(userData, {
        url: `/users/${id}`
      });
      onSuccess?.('User updated successfully');
      // Refresh users list
      await fetchUsers();
      return result.data as User;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [updateExecute, fetchUsers, onError, onSuccess]);

  const deleteUser = useCallback(async (id: string | number) => {
    try {
      await deleteExecute(undefined, {
        url: `/users/${id}`
      });
      onSuccess?.('User deleted successfully');
      // Refresh users list
      await fetchUsers();
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [deleteExecute, fetchUsers, onError, onSuccess]);

  const updateUserRole = useCallback(async (id: string | number, role: string) => {
    try {
      await updateUser(id, { role: role as 'admin' | 'editor' | 'author' });
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [updateUser, onError]);

  const toggleUserStatus = useCallback(async (id: string | number) => {
    try {
      const user = users.find((u: User) => u.id === id);
      if (user) {
        await updateUser(id, { is_active: !user.is_active });
      }
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [users, updateUser, onError]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'author':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderProps: UsersAPIRenderProps = {
    // Data
    users,
    currentUser: (currentUser as User) || null,
    pagination: paginationData || pagination,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    
    // Actions
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    toggleUserStatus,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`users-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`users-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Users Management</h3>
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
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
        
        {/* Users List */}
        <div className="space-y-4">
          {users.map((user: User) => (
            <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {(user.name || user.display_name || user.username)?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name || user.display_name || user.username}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-500">
                    <div>Joined: {formatDate(user.created_at)}</div>
                    {user.last_login && (
                      <div>Last login: {formatDate(user.last_login)}</div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => fetchUser(user.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      disabled={updating}
                      className={`text-sm hover:opacity-80 disabled:opacity-50 ${
                        user.is_active ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={deleting}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {showPagination && (paginationData || pagination) && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(((paginationData?.current_page || pagination?.current_page || 1) - 1) * (paginationData?.per_page || pagination?.per_page || itemsPerPage)) + 1} to{' '}
              {Math.min((paginationData?.current_page || pagination?.current_page || 1) * (paginationData?.per_page || pagination?.per_page || itemsPerPage), paginationData?.total || pagination?.total || 0)} of{' '}
              {paginationData?.total || pagination?.total || 0} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchUsers((paginationData?.current_page || pagination?.current_page || 1) - 1)}
                disabled={(paginationData?.current_page || pagination?.current_page || 1) <= 1 || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-gray-100 rounded-md">
                {paginationData?.current_page || pagination?.current_page || 1} of {paginationData?.last_page || pagination?.last_page || 1}
              </span>
              <button
                onClick={() => fetchUsers((paginationData?.current_page || pagination?.current_page || 1) + 1)}
                disabled={(paginationData?.current_page || pagination?.current_page || 1) >= (paginationData?.last_page || pagination?.last_page || 1) || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersAPI;