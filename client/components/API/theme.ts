// Theme Configuration for API Components
// Light theme with customizable accent color

export interface ThemeConfig {
  colors: {
    primary: {
      bg: string;
      text: string;
      border: string;
    };
    secondary: {
      bg: string;
      text: string;
      border: string;
    };
    accent: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Default light theme configuration
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: {
      bg: '#ffffff',
      text: '#212529',
      border: '#e9ecef'
    },
    secondary: {
      bg: '#f8f9fa',
      text: '#6c757d',
      border: '#dee2e6'
    },
    accent: {
      main: '#007bff', // Default blue - can be customized
      light: '#66b3ff',
      dark: '#0056b3',
      contrast: '#ffffff'
    },
    status: {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8'
    },
    neutral: {
      50: '#f8f9fa',
      100: '#f1f3f4',
      200: '#e9ecef',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#adb5bd',
      600: '#6c757d',
      700: '#495057',
      800: '#343a40',
      900: '#212529'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.15)'
  }
};

// Theme customization function
export const createCustomTheme = (accentColor: string): ThemeConfig => {
  // Generate light and dark variants of accent color
  const lightenColor = (color: string, amount: number) => {
    // Simple color lightening (you might want to use a proper color library)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  const darkenColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  return {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      accent: {
        main: accentColor,
        light: lightenColor(accentColor, 0.3),
        dark: darkenColor(accentColor, 0.2),
        contrast: '#ffffff'
      }
    }
  };
};

// CSS-in-JS styles generator
export const generateThemeStyles = (theme: ThemeConfig) => ({
  // Base component styles
  apiComponent: {
    backgroundColor: theme.colors.primary.bg,
    color: theme.colors.primary.text,
    border: `1px solid ${theme.colors.primary.border}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.md,
    padding: theme.spacing.md
  },
  
  // Button styles
  buttonPrimary: {
    backgroundColor: theme.colors.accent.main,
    color: theme.colors.accent.contrast,
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: theme.colors.accent.dark
    }
  },
  
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: theme.colors.accent.main,
    border: `1px solid ${theme.colors.accent.main}`,
    borderRadius: theme.borderRadius.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: theme.colors.accent.light,
      color: theme.colors.accent.contrast
    }
  },
  
  // Card styles
  card: {
    backgroundColor: theme.colors.primary.bg,
    border: `1px solid ${theme.colors.primary.border}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.sm,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md
  },
  
  // Input styles
  input: {
    backgroundColor: theme.colors.primary.bg,
    color: theme.colors.primary.text,
    border: `1px solid ${theme.colors.secondary.border}`,
    borderRadius: theme.borderRadius.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: '1rem',
    ':focus': {
      outline: 'none',
      borderColor: theme.colors.accent.main,
      boxShadow: `0 0 0 2px ${theme.colors.accent.light}33`
    }
  },
  
  // Status styles
  statusSuccess: {
    backgroundColor: `${theme.colors.status.success}15`,
    color: theme.colors.status.success,
    border: `1px solid ${theme.colors.status.success}30`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm
  },
  
  statusError: {
    backgroundColor: `${theme.colors.status.error}15`,
    color: theme.colors.status.error,
    border: `1px solid ${theme.colors.status.error}30`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm
  },
  
  statusWarning: {
    backgroundColor: `${theme.colors.status.warning}15`,
    color: theme.colors.status.warning,
    border: `1px solid ${theme.colors.status.warning}30`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm
  },
  
  statusInfo: {
    backgroundColor: `${theme.colors.status.info}15`,
    color: theme.colors.status.info,
    border: `1px solid ${theme.colors.status.info}30`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm
  }
});

// Tailwind CSS classes generator
export const generateTailwindClasses = (theme: ThemeConfig) => ({
  // Base component classes
  apiComponent: 'bg-white text-gray-900 border border-gray-200 rounded-lg shadow-md p-4',
  
  // Button classes
  buttonPrimary: 'bg-blue-600 text-white border-0 rounded px-4 py-2 cursor-pointer hover:bg-blue-700 transition-all duration-200',
  buttonSecondary: 'bg-transparent text-blue-600 border border-blue-600 rounded px-4 py-2 cursor-pointer hover:bg-blue-50 transition-all duration-200',
  
  // Card classes
  card: 'bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4',
  
  // Input classes
  input: 'bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200',
  
  // Status classes
  statusSuccess: 'bg-green-50 text-green-700 border border-green-200 rounded p-2',
  statusError: 'bg-red-50 text-red-700 border border-red-200 rounded p-2',
  statusWarning: 'bg-yellow-50 text-yellow-700 border border-yellow-200 rounded p-2',
  statusInfo: 'bg-blue-50 text-blue-700 border border-blue-200 rounded p-2'
});

// Export default theme
export default defaultTheme;