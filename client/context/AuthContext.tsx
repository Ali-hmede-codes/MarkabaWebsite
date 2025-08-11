'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { authApi } from '../lib/api';
import type { User, LoginCredentials } from '../components/API/types';
import type { AuthContextType } from '@/types';

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    deleteCookie('remember_me');
  }, []);

  // Enhanced token refresh and validation system
  useEffect(() => {
    let validationInterval: NodeJS.Timeout;
    let refreshInterval: NodeJS.Timeout;

    const validateUser = async () => {
      if (token && user) {
        try {
          const response = await authApi.verifyToken();
          if (!response.success || !response.data?.user || !response.data.user.is_active) {
            // User no longer exists or is deactivated
            clearAuth();
            toast.error('Your session has been terminated. Please log in again.');
            router.replace('/admin/administratorpage/login');
          }
        } catch (error: any) {
          // Token verification failed - try to refresh token first
          console.error('Token verification error:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            try {
              // Attempt token refresh
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.success && refreshData.data?.token) {
                  // Update token in state and cookies
                  setToken(refreshData.data.token);
                  const rememberMe = getCookie('remember_me') === 'true';
                  const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
                  
                  setCookie('token', refreshData.data.token, {
                    maxAge: cookieMaxAge,
                    secure: window.location.protocol === 'https:',
                    sameSite: 'strict',
                  });
                  
                  toast.success('Session refreshed successfully');
                  return; // Don't clear auth, token was refreshed
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
            
            // If refresh failed, clear auth and redirect
            clearAuth();
            toast.error('Your session has expired. Please log in again.');
            router.replace('/admin/administratorpage/login');
          }
        }
      }
    };

    // Automatic token refresh before expiration
    const refreshToken = async () => {
      if (token && user) {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.token) {
              setToken(data.data.token);
              const rememberMe = getCookie('remember_me') === 'true';
              const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
              
              setCookie('token', data.data.token, {
                maxAge: cookieMaxAge,
                secure: window.location.protocol === 'https:',
                sameSite: 'strict',
              });
            }
          }
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }
    };

    // Set up intervals based on remember_me preference
    if (token && user) {
      const rememberMe = getCookie('remember_me') === 'true';
      
      // Validation interval - check token validity
      const validationInterval_ms = rememberMe 
        ? 30 * 60 * 1000  // 30 minutes for remember me sessions
        : 10 * 60 * 1000; // 10 minutes for regular sessions
      
      // Refresh interval - proactively refresh tokens
      const refreshInterval_ms = rememberMe 
        ? 60 * 60 * 1000  // 1 hour for remember me sessions
        : 30 * 60 * 1000; // 30 minutes for regular sessions
      
      validationInterval = setInterval(validateUser, validationInterval_ms);
      refreshInterval = setInterval(refreshToken, refreshInterval_ms);
    }

    return () => {
      if (validationInterval) {
        clearInterval(validationInterval);
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [token, user, clearAuth, router]);

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
            if (response.success && response.data?.user) {
              // Check if user still exists and is active
              const userData = response.data.user;
              if (userData.is_active) {
                setUser(userData);
                // Update cookie with fresh user data based on remember_me preference
                const rememberMe = getCookie('remember_me') === 'true';
                const cookieMaxAge = rememberMe 
                  ? 30 * 24 * 60 * 60  // 30 days if remember me was checked
                  : 2 * 60 * 60;       // 2 hours if not checked
                
                setCookie('user', JSON.stringify(userData), {
                  maxAge: cookieMaxAge,
                  secure: window.location.protocol === 'https:',
                  sameSite: 'strict',
                });
                
                // Refresh the token cookie with the same expiration
                setCookie('token', savedToken, {
                  maxAge: cookieMaxAge,
                  secure: window.location.protocol === 'https:',
                  sameSite: 'strict',
                });
              } else {
                // User account deactivated, clear auth state
                clearAuth();
                toast.error('Your account has been deactivated. Please contact an administrator.');
              }
            } else {
              // Token is invalid or user doesn't exist, clear auth state
              clearAuth();
            }
          } catch (error) {
            // Token verification failed, clear auth state
            clearAuth();
          }
        }
      } catch (error) {
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

      if (response.data?.user && response.data?.token) {
        const { user: userData, token: userToken } = response.data;

        // Set state
        setUser(userData);
        setToken(userToken);

        // Set cookies based on remember_me preference
        const cookieMaxAge = credentials.remember_me 
          ? 30 * 24 * 60 * 60  // 30 days if remember me is checked
          : 2 * 60 * 60;       // 2 hours if not checked
        
        setCookie('token', userToken, {
          maxAge: cookieMaxAge,
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
        });
        setCookie('user', JSON.stringify(userData), {
          maxAge: cookieMaxAge,
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
        });
        
        // Store remember_me preference for session management
        setCookie('remember_me', credentials.remember_me ? 'true' : 'false', {
          maxAge: cookieMaxAge,
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
        });

        toast.success(`Welcome back, ${userData.username}!`);
        // Let the calling component handle the redirect
      } else {
        throw new Error('Login failed - invalid response');
      }
      router.replace('/admin/administratorpage'); // Redirect to main admin dashboard after successful login
    } catch (error: any) {
      // Handle specific error responses from backend
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        
          throw new Error(message || 'Login failed. Please try again.');
      } else {
        const message = error.message || 'Login failed. Please try again.';
        throw new Error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      toast.success('Logged out successfully');
      router.replace('/auth/login');
    }
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

  // Remove the problematic route change handler that was causing redirects

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
          router.replace('/admin/administratorpage/login');
          return;
        }

        if (requiredRole && !hasRole(requiredRole)) {
          toast.error('You do not have permission to access this page');
          router.replace('/admin/administratorpage');
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
