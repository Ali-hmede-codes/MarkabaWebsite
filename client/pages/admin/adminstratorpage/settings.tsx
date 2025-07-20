import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FiSave, FiRefreshCw, FiDatabase, FiMail, FiShield, FiGlobe, FiImage, FiSettings } from 'react-icons/fi';
import { apiRequest } from '@/lib/api';
import { withAuth } from '@/context/AuthContext';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
  category: string;
  is_public: boolean;
}

interface SettingsGroup {
  [key: string]: Setting[];
}

const AdminSettings: React.FC = () => {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsGroup>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSystemInfo();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiRequest('/admin/adminstratorpage/settings');
    if (data.success) {
      // Group settings by category
      const grouped = data.data.reduce((acc: SettingsGroup, setting: Setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});
      setSettings(grouped);
    }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('خطأ في جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
    const data = await apiRequest('/admin/adminstratorpage/settings/system/info');
    if (data.success) {
      setSystemInfo(data.data);
    }
  } catch (error) {
    console.error('Error fetching system info:', error);
  }
  };

  const handleSettingChange = (settingKey: string, value: string) => {
    setSettings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(setting => 
          setting.setting_key === settingKey 
            ? { ...setting, setting_value: value }
            : setting
        );
      });
      return updated;
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // Flatten settings for API
    const flatSettings = Object.values(settings).flat().map(setting => ({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value
    }));

    const data = await apiRequest('/admin/adminstratorpage/settings/bulk', {
      method: 'PUT',
      body: JSON.stringify({ settings: flatSettings })
    });

    if (data.success) {
      toast.success('تم حفظ الإعدادات بنجاح');
    } else {
      toast.error('خطأ في حفظ الإعدادات');
    }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    try {
      setTestingEmail(true);
      const data = await apiRequest('/admin/adminstratorpage/settings/test-email', {
      method: 'POST'
    });

    if (data.success) {
      toast.success('تم إرسال رسالة اختبار بنجاح');
    } else {
      toast.error(data.message || 'فشل في إرسال رسالة الاختبار');
    }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('خطأ في اختبار البريد الإلكتروني');
    } finally {
      setTestingEmail(false);
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const { setting_key, setting_value, setting_type, description } = setting;

    switch (setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={setting_key}
              checked={setting_value === 'true'}
              onChange={(e) => handleSettingChange(setting_key, e.target.checked.toString())}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={setting_key} className="mr-2 block text-sm text-gray-900">
              {description}
            </label>
          </div>
        );
      
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {description}
            </label>
            <input
              type="number"
              value={setting_value}
              onChange={(e) => handleSettingChange(setting_key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {description}
            </label>
            <textarea
              value={setting_value}
              onChange={(e) => handleSettingChange(setting_key, e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        );
      
      case 'select':
        let options: string[] = [];
        if (setting_key.includes('theme')) {
          options = ['light', 'dark', 'auto'];
        } else if (setting_key.includes('language')) {
          options = ['ar', 'en'];
        } else if (setting_key.includes('status')) {
          options = ['active', 'inactive'];
        }
        
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {description}
            </label>
            <select
              value={setting_value}
              onChange={(e) => handleSettingChange(setting_key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {description}
            </label>
            <input
              type={setting_key.includes('password') ? 'password' : 'text'}
              value={setting_value}
              onChange={(e) => handleSettingChange(setting_key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        );
    }
  };

  const tabs = [
    { id: 'general', name: 'عام', icon: FiSettings },
    { id: 'seo', name: 'SEO', icon: FiGlobe },
    { id: 'email', name: 'البريد الإلكتروني', icon: FiMail },
    { id: 'media', name: 'الوسائط', icon: FiImage },
    { id: 'security', name: 'الأمان', icon: FiShield },
    { id: 'system', name: 'النظام', icon: FiDatabase }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>إعدادات الموقع - لوحة التحكم</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">إعدادات الموقع</h1>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <FiRefreshCw className="animate-spin -mr-1 ml-2 h-4 w-4" />
            ) : (
              <FiSave className="-mr-1 ml-2 h-4 w-4" />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="ml-2 h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            {activeTab === 'system' ? (
              // System Information Tab
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">معلومات النظام</h3>
                
                {systemInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">قاعدة البيانات</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>الحجم: {systemInfo.database_size || 'غير متاح'}</p>
                        <p>عدد الجداول: {systemInfo.table_count || 0}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">الإحصائيات</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>المقالات: {systemInfo.posts_count || 0}</p>
                        <p>المستخدمين: {systemInfo.users_count || 0}</p>
                        <p>الفئات: {systemInfo.categories_count || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Regular Settings Tabs
              <div className="space-y-6">
                {settings[activeTab] && settings[activeTab].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings[activeTab].map((setting) => (
                      <div key={setting.id} className="space-y-2">
                        {renderSettingInput(setting)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">لا توجد إعدادات متاحة في هذا القسم</p>
                  </div>
                )}
                
                {/* Email Test Button */}
                {activeTab === 'email' && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={testEmailConfig}
                      disabled={testingEmail}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {testingEmail ? (
                        <FiRefreshCw className="animate-spin -mr-1 ml-2 h-4 w-4" />
                      ) : (
                        <FiMail className="-mr-1 ml-2 h-4 w-4" />
                      )}
                      {testingEmail ? 'جاري الاختبار...' : 'اختبار إعدادات البريد'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminSettings, 'admin');