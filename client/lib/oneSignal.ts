import { useEffect } from 'react';

// OneSignal configuration
const ONESIGNAL_APP_ID = '02e93d78-0cea-455a-82c1-cfef034fbf18';

// Types for OneSignal
interface OneSignalWindow extends Window {
  OneSignal?: {
    init: (config: { appId: string }) => Promise<void>;
    showSlidedownPrompt: () => Promise<void>;
    registerForPushNotifications: () => Promise<void>;
    isPushNotificationsEnabled: () => Promise<boolean>;
    getUserId: () => Promise<string | null>;
    getNotificationPermission: () => Promise<NotificationPermission>;
    setDefaultNotificationUrl: (url: string) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
    sendTag: (key: string, value: string) => Promise<void>;
    sendTags: (tags: Record<string, string>) => Promise<void>;
    getTags: () => Promise<Record<string, string>>;
    deleteTag: (key: string) => Promise<void>;
    deleteTags: (keys: string[]) => Promise<void>;
  };
  OneSignalDeferred?: Array<(OneSignal: any) => void>;
}

declare const window: OneSignalWindow;

// OneSignal service class
class OneSignalService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // Initialize OneSignal
  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('OneSignal can only be initialized in browser environment'));
        return;
      }

      // Check if OneSignal is already initialized globally
      if (window.OneSignal && this.isInitialized) {
        resolve();
        return;
      }

      // Wait for OneSignal to be available
      const checkOneSignal = () => {
        if (window.OneSignal) {
          // Don't initialize again if already done globally
          this.isInitialized = true;
          resolve();
        } else if (window.OneSignalDeferred) {
          // Use deferred initialization if available
          window.OneSignalDeferred.push((OneSignal: any) => {
            this.isInitialized = true;
            resolve();
          });
        } else {
          // Retry after a short delay
          setTimeout(checkOneSignal, 100);
        }
      };

      checkOneSignal();
    });

    return this.initPromise;
  }

  // Check if OneSignal is available
  private async ensureOneSignal(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    if (!window.OneSignal) {
      throw new Error('OneSignal is not available');
    }
  }

  // Show notification permission prompt
  async showPrompt(): Promise<void> {
    await this.ensureOneSignal();
    return window.OneSignal!.showSlidedownPrompt();
  }

  // Register for push notifications
  async registerForPushNotifications(): Promise<void> {
    await this.ensureOneSignal();
    return window.OneSignal!.registerForPushNotifications();
  }

  // Check if push notifications are enabled
  async isPushNotificationsEnabled(): Promise<boolean> {
    await this.ensureOneSignal();
    return window.OneSignal!.isPushNotificationsEnabled();
  }

  // Get user ID
  async getUserId(): Promise<string | null> {
    await this.ensureOneSignal();
    return window.OneSignal!.getUserId();
  }

  // Get notification permission status
  async getNotificationPermission(): Promise<NotificationPermission> {
    await this.ensureOneSignal();
    return window.OneSignal!.getNotificationPermission();
  }

  // Set default notification URL
  async setDefaultNotificationUrl(url: string): Promise<void> {
    await this.ensureOneSignal();
    window.OneSignal!.setDefaultNotificationUrl(url);
  }

  // Add event listener
  async addEventListener(event: string, callback: (...args: any[]) => void): Promise<void> {
    await this.ensureOneSignal();
    window.OneSignal!.on(event, callback);
  }

  // Remove event listener
  async removeEventListener(event: string, callback: (...args: any[]) => void): Promise<void> {
    await this.ensureOneSignal();
    window.OneSignal!.off(event, callback);
  }

  // Send a tag
  async sendTag(key: string, value: string): Promise<void> {
    await this.ensureOneSignal();
    return window.OneSignal!.sendTag(key, value);
  }

  // Send multiple tags
  async sendTags(tags: Record<string, string>): Promise<void> {
    await this.ensureOneSignal();
    return window.OneSignal!.sendTags(tags);
  }

  // Get user tags
  async getTags(): Promise<Record<string, string>> {
    await this.ensureOneSignal();
    return window.OneSignal!.getTags();
  }

  // Delete a tag
  async deleteTag(key: string): Promise<void> {
    await this.ensureOneSignal();
    return window.OneSignal!.deleteTag(key);
  }

  // Delete multiple tags
  async deleteTags(keys: string[]): Promise<void> {
    await this.ensureOneSignal();
    return window.OneSignal!.deleteTags(keys);
  }
}

// Create singleton instance
const oneSignalService = new OneSignalService();

// React hook for OneSignal
export const useOneSignal = () => {
  useEffect(() => {
    // Initialize OneSignal when component mounts
    oneSignalService.init().catch(console.error);
  }, []);

  return oneSignalService;
};

// Export the service instance
export default oneSignalService;

// Export types
export type { OneSignalWindow };