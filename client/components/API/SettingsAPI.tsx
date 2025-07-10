// Settings API Component
import React, { useState, useCallback, useEffect } from 'react';
import { SiteSetting, APIComponentProps } from './types';
import { useSettings, useAPI } from './hooks';

interface SettingsAPIProps extends APIComponentProps {
  children?: (props: SettingsAPIRenderProps) => React.ReactNode;
  groupBy?: 'category' | 'type' | 'none';
  showSearch?: boolean;
}

interface SettingsAPIRenderProps {
  // Data
  settings: SiteSetting[];
  groupedSettings: { [key: string]: SiteSetting[] };
  
  // Loading states
  loading: boolean;
  updating: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<void>;
  updateSettings: (settings: { [key: string]: any }) => Promise<void>;
  resetSetting: (key: string) => Promise<void>;
  clearError: () => void;
  
  // Helper functions
  getSetting: (key: string, defaultValue?: any) => any;
  getSettingsByCategory: (category: string) => SiteSetting[];
  getSettingsByType: (type: string) => SiteSetting[];
}

const SettingsAPI: React.FC<SettingsAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess,
  groupBy = 'category',
  showSearch = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: any }>({});
  
  // API hooks
  const { 
    data: settings, 
    loading: settingsLoading, 
    error: settingsError, 
    execute: fetchSettingsExecute 
  } = useSettings();
  
  const { 
    loading: updating, 
    error: updateError, 
    execute: updateExecute 
  } = useAPI('/settings', {
    method: 'PUT',
    immediate: false,
  });

  // Combined error handling
  const error = settingsError || updateError;
  const loading = settingsLoading;

  // Filter settings based on search term
  const filteredSettings = settings?.filter((setting: SiteSetting) => 
    !searchTerm || 
    setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (setting.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (setting.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group settings
  const groupedSettings = filteredSettings.reduce((groups: { [key: string]: SiteSetting[] }, setting: SiteSetting) => {
    let groupKey = 'general';
    
    if (groupBy === 'category' && setting.category) {
      groupKey = setting.category;
    } else if (groupBy === 'type' && setting.type) {
      groupKey = setting.type;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(setting);
    
    return groups;
  }, {} as { [key: string]: SiteSetting[] });

  // Actions
  const fetchSettings = useCallback(async () => {
    try {
      await fetchSettingsExecute();
      onSuccess?.('Settings fetched successfully');
    } catch (err: any) {
      onError?.(err.message);
    }
  }, [fetchSettingsExecute, onError, onSuccess]);

  const updateSetting = useCallback(async (key: string, value: any) => {
    try {
      await updateExecute({ [key]: value });
      onSuccess?.(`Setting "${key}" updated successfully`);
      
      // Remove from pending changes
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      
      // Refresh settings
      await fetchSettings();
    } catch (err: any) {
      onError?.(err.message);
      throw err;
    }
  }, [updateExecute, fetchSettings, onError, onSuccess]);

  const updateSettings = useCallback(async (settingsData: { [key: string]: any }) => {
    try {
      await updateExecute(settingsData);
      onSuccess?.(`${Object.keys(settingsData).length} settings updated successfully`);
      
      // Clear pending changes
      setPendingChanges({});
      
      // Refresh settings
      await fetchSettings();
    } catch (err: any) {
      onError?.(err.message);
      throw err;
    }
  }, [updateExecute, fetchSettings, onError, onSuccess]);

  const resetSetting = useCallback(async (key: string) => {
    try {
      const setting = settings?.find(s => s.key === key);
      if (setting && setting.default_value !== undefined) {
        await updateSetting(key, setting.default_value);
      }
    } catch (err: any) {
      onError?.(err.message);
    }
  }, [settings, updateSetting, onError]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  // Helper functions
  const getSetting = useCallback((key: string, defaultValue?: any) => {
    const setting = settings?.find((s: SiteSetting) => s.key === key);
    return setting?.value ?? defaultValue;
  }, [settings]);

  const getSettingsByCategory = useCallback((category: string) => {
    return settings?.filter((s: SiteSetting) => s.category === category) || [];
  }, [settings]);

  const getSettingsByType = useCallback((type: string) => {
    return settings?.filter((s: SiteSetting) => s.type === type) || [];
  }, [settings]);

  // Handle setting value change
  const handleSettingChange = (key: string, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  // Get current value (pending or actual)
  const getCurrentValue = (setting: SiteSetting) => {
    return pendingChanges[setting.key] !== undefined 
      ? pendingChanges[setting.key] 
      : setting.value;
  };

  // Render setting input based on type
  const renderSettingInput = (setting: SiteSetting) => {
    const currentValue = getCurrentValue(setting);
    const hasChanges = pendingChanges[setting.key] !== undefined;
    
    const baseInputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
      hasChanges ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
    }`;
    
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue === true || currentValue === 'true'}
              onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
              className="rounded focus:ring-2 focus:ring-opacity-50"
              style={{ accentColor: accentColor }}
            />
            <span className="text-sm text-gray-700">
              {setting.label || setting.key}
            </span>
          </label>
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value) || 0)}
            className={baseInputClass}
          />
        );
        
      case 'textarea':
        return (
          <textarea
            value={currentValue || ''}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            rows={3}
            className={baseInputClass}
          />
        );
        
      case 'select':
        const options = setting.options ? JSON.parse(setting.options) : [];
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className={baseInputClass}
          >
            {options.map((option: any) => (
              <option key={option.value || option} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );
        
      case 'color':
        return (
          <div className="flex space-x-2">
            <input
              type="color"
              value={currentValue || '#000000'}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={currentValue || ''}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className={`flex-1 ${baseInputClass}`}
              placeholder="#000000"
            />
          </div>
        );
        
      default:
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className={baseInputClass}
          />
        );
    }
  };

  const renderProps: SettingsAPIRenderProps = {
    // Data
    settings: filteredSettings,
    groupedSettings,
    
    // Loading states
    loading,
    updating,
    
    // Error states
    error,
    
    // Actions
    fetchSettings,
    updateSetting,
    updateSettings,
    resetSetting,
    clearError,
    
    // Helper functions
    getSetting,
    getSettingsByCategory,
    getSettingsByType,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`settings-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`settings-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Site Settings</h3>
          <div className="flex space-x-2">
            {Object.keys(pendingChanges).length > 0 && (
              <button
                onClick={() => updateSettings(pendingChanges)}
                disabled={updating}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Save Changes ({Object.keys(pendingChanges).length})
              </button>
            )}
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Search */}
        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {Object.keys(pendingChanges).length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              You have {Object.keys(pendingChanges).length} unsaved changes
            </p>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {/* Settings Groups */}
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([groupName, groupSettings]: [string, SiteSetting[]]) => (
            <div key={groupName} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 capitalize">
                {groupName.replace('_', ' ')}
              </h4>
              
              <div className="space-y-4">
                {groupSettings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {setting.label || setting.key}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {pendingChanges[setting.key] !== undefined && (
                          <button
                            onClick={() => updateSetting(setting.key, pendingChanges[setting.key])}
                            disabled={updating}
                            className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            Save
                          </button>
                        )}
                        
                        {setting.default_value !== undefined && (
                          <button
                            onClick={() => resetSetting(setting.key)}
                            disabled={updating}
                            className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {renderSettingInput(setting)}
                    
                    {setting.default_value !== undefined && (
                      <p className="text-xs text-gray-400">
                        Default: {String(setting.default_value)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {filteredSettings.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No settings found matching your search' : 'No settings available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsAPI;