# 🚀 Upload Updated OneSignal Service to VPS

## 📋 **Files to Upload:**

Upload this file from your local machine to your VPS:

**Local:** `d:\NewsMarkaba\server\services\oneSignalService.js`
**VPS:** `/var/www/MarkabaWebsite/server/services/oneSignalService.js`

## 🔧 **Steps:**

### **1. Upload the File**
Use your preferred method (FTP, SCP, or file manager):

```bash
# Using SCP (if you have SSH access)
scp d:\NewsMarkaba\server\services\oneSignalService.js root@your-vps-ip:/var/www/MarkabaWebsite/server/services/

# Or use your hosting control panel file manager
```

### **2. Restart PM2**
After uploading, restart your server:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to project directory
cd /var/www/MarkabaWebsite

# Restart PM2
pm2 restart all

# Check logs
pm2 logs --lines 20
```

### **3. Test OneSignal**
After restarting, test creating:
- Breaking news
- Last news
- Regular posts

You should see in the logs:
```
🔍 OneSignal Service Initialized
Environment check: { APP_ID: 'SET', AUTH_KEY: 'SET', ... }
📤 Notification payload: { "app_id": "02e93d78-...", ... }
✅ Last news notification sent successfully: [notification-id]
```

## ✅ **What's Fixed:**

The updated file includes:
- ✅ Direct HTTPS requests with v2 keys
- ✅ `app_id` included in notification payload
- ✅ Proper error handling
- ✅ Debug logging
- ✅ ESLint compliant code

## 🎯 **Expected Result:**

After uploading and restarting, your OneSignal notifications should work perfectly for:
- Breaking news ✅
- Last news ✅  
- Regular posts ✅

The error `"Failed to parse app_id from request"` will be resolved! 🎉