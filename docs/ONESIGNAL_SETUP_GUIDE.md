# OneSignal Push Notifications Setup Guide

## Overview
This guide will help you configure OneSignal push notifications for your News Markaba application. OneSignal notifications are automatically sent when creating new posts, breaking news, or last news items.

## Prerequisites
- OneSignal account (free at https://onesignal.com)
- OneSignal app created for your website

## 1. OneSignal Dashboard Setup

### Step 1: Create OneSignal App
1. Go to https://onesignal.com and sign up/login
2. Click "New App/Website"
3. Choose "Web Push" platform
4. Enter your app name (e.g., "News Markaba")
5. Enter your website URL (e.g., https://www.markaba.news)

### Step 2: Get Required Keys
After creating your app, you'll need these keys:

1. **App ID**: Found in Settings > Keys & IDs
2. **REST API Key**: Found in Settings > Keys & IDs (this is your APP_AUTH_KEY)
3. **User Auth Key**: Found in Account Settings > User Auth Key

## 2. Server Configuration

### Environment Variables
Update your `server/.env` file with your OneSignal credentials:

```env
# ONESIGNAL PUSH NOTIFICATIONS CONFIGURATION
ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_APP_AUTH_KEY=your_rest_api_key_here
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key_here
CLIENT_URL=https://www.markaba.news
```

### Required Dependencies
The `onesignal-node` package is already installed. If you need to reinstall:

```bash
cd server
npm install onesignal-node
```

## 3. Frontend Configuration

### OneSignal Web SDK
The frontend is already configured with:
- OneSignal Web SDK loaded in `_document.tsx`
- Service worker at `/public/OneSignalSDKWorker.js`
- OneSignal utility service at `/lib/oneSignal.ts`
- Test page at `/test-notifications`

### App ID Configuration
Make sure the App ID in `client/lib/oneSignal.ts` matches your OneSignal app:

```typescript
const ONESIGNAL_APP_ID = 'your_app_id_here';
```

## 4. How Notifications Work

### Automatic Notifications
Notifications are automatically sent when:

1. **New Post Created** (if published)
   - Endpoint: `POST /api/posts`
   - Function: `sendPostNotification()`

2. **Breaking News Created**
   - Endpoint: `POST /api/breaking-news`
   - Function: `sendBreakingNewsNotification()`

3. **Last News Created**
   - Endpoint: `POST /api/admin/last-news`
   - Function: `sendLastNewsNotification()`

### Notification Content
- **Breaking News**: "🚨 خبر عاجل" with red accent color
- **Last News**: "آخر الأخبار" with blue accent color
- **Posts**: "منشور جديد" with default styling

## 5. Testing

### Test OneSignal Connection
Run the test script to verify your setup:

```bash
cd server
node test/testOneSignal.js
```

### Frontend Testing
Visit `/test-notifications` page to:
- Check OneSignal initialization
- Enable notifications
- Test notification permissions

## 6. Troubleshooting

### Common Issues

#### 1. "Invalid app_id" Error
- Verify `ONESIGNAL_APP_ID` in `.env` file
- Check that App ID matches your OneSignal dashboard

#### 2. "Invalid REST API Key" Error
- Verify `ONESIGNAL_APP_AUTH_KEY` in `.env` file
- Make sure you're using the REST API Key, not the App Key

#### 3. "Invalid User Auth Key" Error
- Verify `ONESIGNAL_USER_AUTH_KEY` in `.env` file
- Get this from Account Settings, not App Settings

#### 4. Notifications Not Sending
- Check server logs for error messages
- Verify all environment variables are set
- Test with the test script first

#### 5. Frontend Not Loading OneSignal
- Check browser console for CSP errors
- Verify OneSignal CDN is allowed in middleware.ts
- Check that service worker is accessible

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   node -e "require('dotenv').config(); console.log('App ID:', process.env.ONESIGNAL_APP_ID); console.log('Has Auth Key:', !!process.env.ONESIGNAL_APP_AUTH_KEY);"
   ```

2. **Test OneSignal Service**:
   ```bash
   cd server
   node test/testOneSignal.js
   ```

3. **Check Server Logs**:
   Look for OneSignal-related messages when creating content

4. **Frontend Console**:
   Check browser console on `/test-notifications` page

## 7. Security Notes

- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor OneSignal usage in dashboard

## 8. Production Deployment

### Environment Variables
Make sure these are set in your production environment:
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_APP_AUTH_KEY`
- `ONESIGNAL_USER_AUTH_KEY`
- `CLIENT_URL` (your production domain)

### SSL Certificate
OneSignal requires HTTPS in production. Make sure your site has a valid SSL certificate.

### Service Worker
Ensure `/OneSignalSDKWorker.js` is accessible at your domain root.

## Support

If you continue having issues:
1. Check OneSignal documentation: https://documentation.onesignal.com/
2. Verify your OneSignal dashboard settings
3. Test with a simple notification first
4. Check server and browser logs for detailed error messages

---

**Note**: Replace all placeholder values (`your_app_id_here`, etc.) with your actual OneSignal credentials.