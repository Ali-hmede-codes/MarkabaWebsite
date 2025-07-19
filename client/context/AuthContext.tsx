'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import type { User, LoginCredentials } from '../components/API/types';
import type { AuthContextType } from '@/types';

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Clear authentication state
  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    deleteCookie('token');
    deleteCookie('user');
  }, []);

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = getCookie('token') as string;
        const savedUser = getCookie('user') as string;

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Verify token with server
          try {
            const response = await authApi.verifyToken();
            if (response.success && response.data?.valid) {
              if (response.data.user) {
                setUser(response.data.user);
                setCookie('user', JSON.stringify(response.data.user), {
                  maxAge: 7 * 24 * 60 * 60, // 7 days
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                });
              }
            } else {
              // Token is invalid, clear auth state
              clearAuth();
            }
          } catch (error) {
            // Token verification failed, clear auth state
            clearAuth();
          }
        }
      } catch (error) {
       // console.error('Error initializing auth:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuth]);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      //console.log('Login response:', response);

      if (response.data?.user && response.data?.token) {
        const { user: userData, token: userToken } = response.data;

        // Set state
        setUser(userData);
        setToken(userToken);

        // Set cookies
        setCookie('token', userToken, {
          maxAge: 7 * 24 * 60 * 60, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        setCookie('user', JSON.stringify(userData), {
          maxAge: 7 * 24 * 60 * 60, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        toast.success(`Welcome back, ${userData.username}!`);
        // Let the calling component handle the redirect
      } else {
        throw new Error('Login failed - invalid response');
      }
    } catch (error: any) {
      // Handle specific error responses from backend
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        
        if (status === 429) {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        } else if (status === 403) {
          throw new Error('Admin access required');
        } else if (status === 423) {
          throw new Error(message); // Account locked message from backend
        } else {
          throw new Error(message || 'Login failed. Please try again.');
        }
      } else {
        const message = error.message || 'Login failed. Please try again.';
        throw new Error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    router.replace('/auth/login');
  };

  // Check if user is authenticated
  const isAuthenticated = Boolean(user && token);

  // Check if user has specific role
  const hasRole = (role: 'admin' | 'editor'): boolean => {
    if (!user) return false;
    if (role === 'admin') return user.role === 'admin';
    if (role === 'editor') return user.role === 'admin' || user.role === 'editor';
    return false;
  };

  // Context value
  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protecting routes
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: 'admin' | 'editor'
) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { isAuthenticated, hasRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.replace('/auth/login');
          return;
        }

        if (requiredRole && !hasRole(requiredRole)) {
          toast.error('You do not have permission to access this page');
          router.replace('/admin/adminstratorpage');
          return;
        }
      }
    }, [isAuthenticated, hasRole, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner w-8 h-8"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { isAuthenticated, user, loading } = useAuth();
  return { isAuthenticated, user, loading };
};

// Hook for role-based access control
export const usePermissions = () => {
  const { hasRole, user } = useAuth();
  
  return {
    isAdmin: hasRole('admin'),
    isEditor: hasRole('editor'),
    canCreatePosts: hasRole('admin'),
    canEditPosts: hasRole('admin'),
    canDeletePosts: hasRole('admin'),
    canManageUsers: hasRole('admin'),
    canManageBreakingNews: hasRole('admin'),
    canUploadFiles: hasRole('admin'),
    canViewDashboard: hasRole('admin'),
    canViewAnalytics: hasRole('admin'),
    userId: user?.id,
    userRole: user?.role,
  };
};

// Component for conditional rendering based on permissions
interface PermissionGuardProps {
  children: ReactNode;
  role?: 'admin' | 'editor';
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  role,
  fallback = null,
  requireAuth = true,
}) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="spinner w-4 h-4"></div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook for handling authentication errors
export const useAuthError = () => {
  const { logout } = useAuth();

  const handleAuthError = (error: any) => {
    if (error.response?.status === 401) {
      toast.error('Your session has expired. Please log in again.');
      logout();
    }
  };

  return { handleAuthError };
};

export default AuthContext;