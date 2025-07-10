import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '../components/API/hooks';

interface SettingsContextType {
  getSetting: (key: string, language?: 'en' | 'ar') => string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { data: settings, loading, error, refetch } = useSettings();

  const getSetting = (key: string, language?: 'en' | 'ar') => {
    if (!settings || typeof settings !== 'object') return '';
    
    // The public endpoint returns an object with key-value pairs
    const value = settings[key as keyof typeof settings];
    if (value === undefined || value === null) return '';
    
    return String(value);
  };

  const handleRefetch = async () => {
    try {
      await refetch();
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const value: SettingsContextType = {
    getSetting,
    loading,
    error,
    refetch: handleRefetch
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;