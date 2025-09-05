import React, { useState, useEffect } from 'react';
import { useOneSignal } from '../lib/oneSignal';

interface NotificationStatus {
  isEnabled: boolean;
  permission: NotificationPermission;
  userId: string | null;
}

const OneSignalNotifications: React.FC = () => {
  const oneSignal = useOneSignal();
  const [status, setStatus] = useState<NotificationStatus>({
    isEnabled: false,
    permission: 'default',
    userId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check notification status on component mount
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [isEnabled, permission, userId] = await Promise.all([
        oneSignal.isPushNotificationsEnabled(),
        oneSignal.getNotificationPermission(),
        oneSignal.getUserId()
      ]);
      
      setStatus({ isEnabled, permission, userId });
    } catch (err) {
      setError('Failed to check notification status');
      console.error('OneSignal status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const enableNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Show the notification prompt
      await oneSignal.showPrompt();
      
      // Register for push notifications
      await oneSignal.registerForPushNotifications();
      
      // Refresh status
      await checkNotificationStatus();
    } catch (err) {
      setError('Failed to enable notifications');
      console.error('OneSignal enable error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTestTag = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Send a test tag to identify the user
      await oneSignal.sendTag('user_type', 'website_visitor');
      await oneSignal.sendTag('last_visit', new Date().toISOString());
      
      alert('Test tags sent successfully!');
    } catch (err) {
      setError('Failed to send test tags');
      console.error('OneSignal tag error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionStatusColor = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getPermissionStatusText = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted':
        return 'مُمنوح';
      case 'denied':
        return 'مرفوض';
      default:
        return 'في الانتظار';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        إعدادات الإشعارات
      </h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Notification Status */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-2">حالة الإشعارات</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>الحالة:</span>
              <span className={status.isEnabled ? 'text-green-600' : 'text-red-600'}>
                {status.isEnabled ? 'مُفعّلة' : 'غير مُفعّلة'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>الإذن:</span>
              <span className={getPermissionStatusColor(status.permission)}>
                {getPermissionStatusText(status.permission)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>معرف المستخدم:</span>
              <span className="text-gray-600 text-xs">
                {status.userId ? status.userId.substring(0, 8) + '...' : 'غير متوفر'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {!status.isEnabled && (
            <button
              onClick={enableNotifications}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
            </button>
          )}
          
          <button
            onClick={checkNotificationStatus}
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
          </button>
          
          {status.isEnabled && (
            <button
              onClick={sendTestTag}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال علامة تجريبية'}
            </button>
          )}
        </div>
        
        {/* Information */}
        <div className="text-xs text-gray-500 text-center mt-4">
          <p>ستتلقى إشعارات عند نشر أخبار جديدة</p>
          <p>يمكنك إلغاء الاشتراك في أي وقت من إعدادات المتصفح</p>
        </div>
      </div>
    </div>
  );
};

export default OneSignalNotifications;