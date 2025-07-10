// Auth API Component
import React, { useState, useCallback, useEffect } from 'react';
import { User, AuthResponse, APIComponentProps } from './types';
import { useLogin, useLogout, useAPI } from './hooks';

interface AuthAPIProps extends APIComponentProps {
  children?: (props: AuthAPIRenderProps) => React.ReactNode;
}

interface AuthAPIRenderProps {
  // Data
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Loading states
  loading: boolean;
  loggingIn: boolean;
  loggingOut: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthAPI: React.FC<AuthAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // API hooks
  const { 
    loading: loggingIn, 
    error: loginError, 
    execute: loginExecute 
  } = useLogin();
  
  const { 
    loading: loggingOut, 
    error: logoutError, 
    execute: logoutExecute 
  } = useLogout();
  
  const { 
    loading: checkingAuth, 
    error: authError, 
    execute: checkAuthExecute 
  } = useAPI('/auth/me', {
    immediate: false,
  });

  // Combined error handling
  const error = loginError || logoutError || authError;
  const loading = loggingIn || loggingOut || checkingAuth;

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        // Verify token is still valid
        checkAuth();
      } catch {
        // Clear invalid stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Actions
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const result = await loginExecute(credentials);
      const authData = result.data as AuthResponse;
      
      // Store auth data
      setToken(authData.token);
      setUser(authData.user);
      setIsAuthenticated(true);
      
      // Persist to localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      onSuccess?.('Login successful');
      return authData;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [loginExecute, onError, onSuccess]);

  const logout = useCallback(async () => {
    try {
      await logoutExecute();
      
      // Clear auth data
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      onSuccess?.('Logout successful');
    } catch (err: unknown) {
      // Even if logout fails on server, clear local data
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      onError?.((err as Error).message);
    }
  }, [logoutExecute, onError, onSuccess]);

  const checkAuth = useCallback(async () => {
    try {
      const result = await checkAuthExecute();
      const userData = result.data as User;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err: unknown) {
      // Token is invalid, clear auth data
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      onError?.((err as Error).message);
    }
  }, [checkAuthExecute, onError]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  const renderProps: AuthAPIRenderProps = {
    // Data
    user,
    isAuthenticated,
    token,
    
    // Loading states
    loading,
    loggingIn,
    loggingOut,
    
    // Error states
    error,
    
    // Actions
    login,
    logout,
    checkAuth,
    clearError,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`auth-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`auth-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
        
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
        
        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{user.username}</h4>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'editor'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <button
                onClick={logout}
                disabled={loggingOut}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p>Not authenticated</p>
              <p className="text-sm mt-2">Please login to access your account</p>
            </div>
            
            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  // This would typically open a login modal or redirect to login page
                  // TODO: Implement login form opening logic
                }}
                className="w-full px-4 py-2 text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthAPI;