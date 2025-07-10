'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCookie, setCookie } from 'cookies-next';
import type { ThemeConfig, ThemeContextType } from '@/types';

// Default theme configuration
const defaultTheme: ThemeConfig = {
  mode: 'light',
  direction: 'ltr',
  language: 'en',
};

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from cookies and system preferences
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Get saved theme from cookies
        const savedTheme = getCookie('theme') as string;
        let initialTheme = defaultTheme;

        if (savedTheme) {
          initialTheme = { ...defaultTheme, ...JSON.parse(savedTheme) };
        } else {
          // Detect system preferences
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const prefersRTL = document.documentElement.dir === 'rtl';
          const browserLang = navigator.language.startsWith('ar') ? 'ar' : 'en';

          initialTheme = {
            mode: prefersDark ? 'dark' : 'light',
            direction: prefersRTL ? 'rtl' : 'ltr',
            language: browserLang,
          };
        }

        setThemeState(initialTheme);
        applyTheme(initialTheme);
      } catch (error) {
        console.error('Error initializing theme:', error);
        setThemeState(defaultTheme);
        applyTheme(defaultTheme);
      } finally {
        setMounted(true);
      }
    };

    initializeTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't manually set a preference
      const savedTheme = getCookie('theme');
      if (!savedTheme) {
        setTheme({ mode: e.matches ? 'dark' : 'light' });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  // Apply theme to DOM
  const applyTheme = (themeConfig: ThemeConfig) => {
    if (typeof window === 'undefined') return;

    const { mode, direction, language } = themeConfig;
    const root = document.documentElement;

    // Apply dark mode
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply direction
    root.dir = direction;
    root.setAttribute('dir', direction);

    // Apply language
    root.lang = language;
    root.setAttribute('lang', language);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mode === 'dark' ? '#1f2937' : '#ffffff');
    }
  };

  // Set theme and persist to cookies
  const setTheme = (newTheme: Partial<ThemeConfig>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setThemeState(updatedTheme);
    applyTheme(updatedTheme);

    // Save to cookies
    setCookie('theme', JSON.stringify(updatedTheme), {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  };

  // Toggle dark/light mode
  const toggleMode = () => {
    setTheme({ mode: theme.mode === 'light' ? 'dark' : 'light' });
  };

  // Toggle LTR/RTL direction
  const toggleDirection = () => {
    setTheme({ direction: theme.direction === 'ltr' ? 'rtl' : 'ltr' });
  };

  // Set language
  const setLanguage = (language: 'en' | 'ar') => {
    setTheme({ 
      language,
      direction: language === 'ar' ? 'rtl' : 'ltr'
    });
  };

  // Context value
  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleMode,
    toggleDirection,
    setLanguage,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting current theme values
export const useThemeValues = () => {
  const { theme } = useTheme();
  return {
    isDark: theme.mode === 'dark',
    isLight: theme.mode === 'light',
    isRTL: theme.direction === 'rtl',
    isLTR: theme.direction === 'ltr',
    isArabic: theme.language === 'ar',
    isEnglish: theme.language === 'en',
    mode: theme.mode,
    direction: theme.direction,
    language: theme.language,
  };
};

// Component for conditional rendering based on theme
interface ThemeGuardProps {
  children: ReactNode;
  mode?: 'light' | 'dark';
  direction?: 'ltr' | 'rtl';
  language?: 'en' | 'ar';
  fallback?: ReactNode;
}

export const ThemeGuard: React.FC<ThemeGuardProps> = ({
  children,
  mode,
  direction,
  language,
  fallback = null,
}) => {
  const { theme } = useTheme();

  const shouldRender = (
    (!mode || theme.mode === mode) &&
    (!direction || theme.direction === direction) &&
    (!language || theme.language === language)
  );

  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

// Hook for responsive theme classes
export const useThemeClasses = () => {
  const { theme } = useTheme();
  
  const getThemeClasses = (baseClasses: string = '') => {
    const classes = [baseClasses];
    
    if (theme.mode === 'dark') {
      classes.push('dark');
    }
    
    if (theme.direction === 'rtl') {
      classes.push('rtl');
    }
    
    if (theme.language === 'ar') {
      classes.push('font-arabic');
    }
    
    return classes.filter(Boolean).join(' ');
  };
  
  return { getThemeClasses };
};

// Hook for theme-aware animations
export const useThemeAnimations = () => {
  const { theme } = useTheme();
  
  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    if (theme.mode === 'dark') {
      return `${baseClasses} dark:transition-all dark:duration-300`;
    }
    
    return baseClasses;
  };
  
  return { getAnimationClasses };
};

// Component for theme-aware styling
interface ThemedProps {
  children: ReactNode;
  lightClass?: string;
  darkClass?: string;
  ltrClass?: string;
  rtlClass?: string;
  className?: string;
}

export const Themed: React.FC<ThemedProps> = ({
  children,
  lightClass = '',
  darkClass = '',
  ltrClass = '',
  rtlClass = '',
  className = '',
}) => {
  const { theme } = useTheme();
  
  const themeClasses = [
    className,
    theme.mode === 'light' ? lightClass : darkClass,
    theme.direction === 'ltr' ? ltrClass : rtlClass,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={themeClasses}>
      {children}
    </div>
  );
};

// Hook for system theme detection
export const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return systemTheme;
};

export default ThemeContext;