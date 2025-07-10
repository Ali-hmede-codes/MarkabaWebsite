'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiLock, FiUser, FiShield } from 'react-icons/fi';

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember_me: false
  });
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [isAuthenticated, user, router]);

  // Handle lockout timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutTime > 0) {
      toast.error(`Account locked. Try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
      return;
    }

    if (!formData.username || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic validation - let backend handle complexity requirements
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      // Determine if input is email or username
      const isEmail = formData.username.includes('@');
      const loginData = {
        password: formData.password,
        remember_me: formData.remember_me,
        ...(isEmail ? { email: formData.username } : { username: formData.username })
      };
      
      await login(loginData);
      
      // Reset attempts on successful login
      setAttempts(0);
      setLockoutTime(0);
      
      // Redirect to admin panel
      router.push('/admin');
      
    } catch (error: any) {
      // Handle specific backend error responses
      const errorMessage = error.message || 'Login failed. Please try again.';
      
      // Handle account lockout
      if (errorMessage.includes('locked') || errorMessage.includes('15 minutes')) {
        setLockoutTime(15 * 60);
        setAttempts(3);
      } 
      // Handle remaining attempts
      else if (errorMessage.includes('attempts remaining')) {
        const match = errorMessage.match(/(\d+) attempts remaining/);
        if (match) {
          const remaining = parseInt(match[1]);
          setAttempts(3 - remaining);
        }
      }
      // Handle rate limiting
      else if (errorMessage.includes('Too many login attempts')) {
        setLockoutTime(15 * 60);
      }
      // Handle other errors
      else {
        setAttempts(prev => Math.min(prev + 1, 3));
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Validate password in real-time
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Head>
        <title>Admin Login - نيوز مركبة</title>
        <meta name="description" content="Admin login for News Markaba" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4">
              <FiShield className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Admin Access
            </h2>
            <p className="text-blue-200">
              Secure login to News Markaba administration
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username/Email Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={lockoutTime > 0 || isLoading}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your username or email"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={lockoutTime > 0 || isLoading}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockoutTime > 0 || isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-1">{passwordRequirements.length ? '✓' : '○'}</span>
                        8+ characters
                      </div>
                      <div className={`flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-1">{passwordRequirements.uppercase ? '✓' : '○'}</span>
                        Uppercase
                      </div>
                      <div className={`flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-1">{passwordRequirements.lowercase ? '✓' : '○'}</span>
                        Lowercase
                      </div>
                      <div className={`flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-1">{passwordRequirements.number ? '✓' : '○'}</span>
                        Number
                      </div>
                      <div className={`flex items-center ${passwordRequirements.special ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-1">{passwordRequirements.special ? '✓' : '○'}</span>
                        Special char
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  checked={formData.remember_me}
                  onChange={handleInputChange}
                  disabled={lockoutTime > 0 || isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              {/* Failed Attempts Warning */}
              {attempts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ {attempts} failed attempt{attempts > 1 ? 's' : ''}. {3 - attempts} remaining.
                  </p>
                </div>
              )}

              {lockoutTime > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    🔒 Account locked. Try again in {formatTime(lockoutTime)}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={lockoutTime > 0 || isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : lockoutTime > 0 ? (
                  'Account Locked'
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                🔐 This is a secure admin area. All login attempts are logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;