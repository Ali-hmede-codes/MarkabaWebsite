# Custom Ads System - Backend Documentation

## Overview

The Custom Ads System is a comprehensive advertising management solution built for the News Markaba platform. It provides timer-based ad management, position-specific placements, click/impression tracking, and automatic cleanup of expired ads.

## Features

### ✨ Core Features
- **Photo Upload & Storage**: Upload and store ad images on the server
- **Timer-Based Deletion**: Automatic deletion of expired ads and their images
- **Position Management**: Predefined ad positions with size constraints
- **Click & Impression Tracking**: Comprehensive analytics for ad performance
- **CRUD Operations**: Full admin control over ads
- **Automatic Cleanup**: Hourly cleanup of expired ads and orphaned images

### 📍 Ad Positions

| Position | Display Name | Size | Max Ads | Description |
|----------|--------------|------|---------|-------------|
| `main_top` | Main Page - Top Banner | 1280x300 | 1 | Top banner on main page |
| `main_middle` | Main Page - Middle Banner | 1280x300 | 1 | Middle banner on main page |
| `main_bottom` | Main Page - Bottom Banner | 1280x300 | 1 | Bottom banner on main page |
| `post_square` | Post Page - Square Ad | 300x300 | 1 | Square ad on post pages |
| `post_banner` | Post Page - Banner Ad | 1280x300 | 1 | Banner ad on post pages |

## Database Schema

### Tables Created

#### `ads` Table
```sql
CREATE TABLE ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_path VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  position ENUM('main_top', 'main_middle', 'main_bottom', 'post_square', 'post_banner') NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NOT NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `ads_positions` Table
```sql
CREATE TABLE ads_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  position_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  max_ads INT DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `ads_clicks` Table
```sql
CREATE TABLE ads_clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);
```

#### `ads_impressions` Table
```sql
CREATE TABLE ads_impressions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);
```

## API Endpoints

### Base URL
- **Latest**: `/api/ads`
- **Versioned**: `/api/v2/ads`

### Public Endpoints

#### GET `/api/ads`
Get all ads with optional filtering.

**Query Parameters:**
- `position` (string): Filter by position (e.g., 'main_top')
- `active_only` (boolean): Show only active ads (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Sample Ad",
      "description": "Ad description",
      "image_path": "/uploads/ads/ad-123456789.jpg",
      "url": "https://example.com",
      "position": "main_top",
      "width": 1280,
      "height": 300,
      "is_active": true,
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-12-31T23:59:59.000Z",
      "clicks": 150,
      "impressions": 5000,
      "created_at": "2024-01-01T00:00:00.000Z",
      "position_display_name": "Main Page - Top Banner"
    }
  ],
  "message": "Ads retrieved successfully"
}
```

#### GET `/api/ads/positions`
Get all available ad positions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "position_name": "main_top",
      "display_name": "Main Page - Top Banner",
      "width": 1280,
      "height": 300,
      "max_ads": 1,
      "description": "Top banner on main page"
    }
  ],
  "message": "Ad positions retrieved successfully"
}
```

#### GET `/api/ads/:id`
Get a single ad by ID.

#### POST `/api/ads/:id/click`
Track an ad click and get redirect URL.

**Response:**
```json
{
  "success": true,
  "redirect_url": "https://example.com",
  "message": "Click tracked successfully"
}
```

#### POST `/api/ads/:id/impression`
Track an ad impression.

### Admin Endpoints (Authentication Required)

#### POST `/api/ads`
Create a new ad.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `title` (string, required): Ad title
- `description` (string, optional): Ad description
- `url` (string, required): Target URL
- `position` (string, required): Ad position
- `end_date` (datetime, required): Expiration date
- `image` (file, required): Ad image file

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "New Ad",
    "image_path": "/uploads/ads/ad-123456789.jpg",
    "url": "https://example.com",
    "position": "main_top",
    "end_date": "2024-12-31T23:59:59.000Z"
  },
  "message": "Ad created successfully"
}
```

#### PUT `/api/ads/:id`
Update an existing ad.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:** (all optional)
- `title` (string): Ad title
- `description` (string): Ad description
- `url` (string): Target URL
- `position` (string): Ad position
- `end_date` (datetime): Expiration date
- `is_active` (boolean): Active status
- `image` (file): New ad image file

#### DELETE `/api/ads/:id`
Delete an ad and its image file.

**Headers:**
- `Authorization: Bearer <token>`

#### GET `/api/ads/:id/stats`
Get detailed ad statistics.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `days` (number): Number of days for statistics (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "ad": {
      "id": 1,
      "title": "Sample Ad",
      "clicks": 150,
      "impressions": 5000
    },
    "stats": {
      "total_clicks": 150,
      "total_impressions": 5000,
      "ctr": 3.0,
      "daily_clicks": [
        {"date": "2024-01-15", "clicks": 10},
        {"date": "2024-01-14", "clicks": 8}
      ],
      "daily_impressions": [
        {"date": "2024-01-15", "impressions": 200},
        {"date": "2024-01-14", "impressions": 180}
      ]
    }
  },
  "message": "Ad statistics retrieved successfully"
}
```

## File Upload Specifications

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit
- Maximum: 5MB per file

### Storage Location
- Server path: `/server/public/uploads/ads/`
- URL path: `/uploads/ads/`

### File Naming
- Format: `ad-{timestamp}-{random}.{extension}`
- Example: `ad-1704067200000-123456789.jpg`

## Automatic Cleanup System

### Scheduled Tasks

#### Expired Ads Cleanup
- **Frequency**: Every hour
- **Action**: 
  - Mark expired ads as inactive
  - Delete associated image files
  - Log cleanup results

#### Orphaned Images Cleanup
- **Trigger**: Manual via service method
- **Action**:
  - Scan uploads directory
  - Compare with database records
  - Delete orphaned image files

### Service Methods

```javascript
// Manual cleanup methods available in adsService
const adsService = require('./utils/adsService');

// Clean expired ads
const result = await adsService.cleanupExpiredAds();

// Clean orphaned images
const result = await adsService.cleanupOrphanedImages();

// Get ads summary
const summary = await adsService.getAdsSummary();

// Validate position
const validation = await adsService.validateAdPosition('main_top');
```

## Setup Instructions

### 1. Database Setup

Run the setup script to create all necessary tables:

```bash
node setup-ads-database.js
```

### 2. Environment Variables

Ensure these variables are set in your `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=markabadatabase
```

### 3. Directory Permissions

Ensure the server has write permissions for:
- `/server/public/uploads/ads/`

### 4. Server Integration

The ads system is automatically initialized when the server starts. Look for these log messages:

```
✅ Ads service initialized
📢 Ads API: http://localhost:5000/api/ads
🧹 Ads cleanup scheduled every hour for expired ads
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: title, url, position, end_date, and image"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Ad not found"
}
```

#### 413 File Too Large
```json
{
  "success": false,
  "message": "File size exceeds the maximum allowed limit"
}
```

## Security Features

### File Upload Security
- File type validation
- File size limits
- Secure file naming
- Path traversal prevention

### Access Control
- JWT authentication for admin endpoints
- Role-based permissions
- Input validation and sanitization

### Data Protection
- SQL injection prevention
- XSS protection
- CORS configuration

## Performance Considerations

### Optimization Features
- Database indexing on frequently queried columns
- Automatic cleanup to prevent storage bloat
- Efficient file serving with proper headers
- Connection pooling for database operations

### Monitoring
- Comprehensive logging
- Error tracking
- Performance metrics in statistics

## Usage Examples

### Frontend Integration

```javascript
// Get ads for main page
const response = await fetch('/api/ads?position=main_top&active_only=true');
const { data: ads } = await response.json();

// Track impression
fetch(`/api/ads/${adId}/impression`, { method: 'POST' });

// Handle ad click
const clickResponse = await fetch(`/api/ads/${adId}/click`, { method: 'POST' });
const { redirect_url } = await clickResponse.json();
window.open(redirect_url, '_blank');
```

### Admin Panel Integration

```javascript
// Create new ad
const formData = new FormData();
formData.append('title', 'New Ad');
formData.append('url', 'https://example.com');
formData.append('position', 'main_top');
formData.append('end_date', '2024-12-31T23:59:59');
formData.append('image', imageFile);

const response = await fetch('/api/ads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## Support

For issues or questions regarding the ads system:

1. Check the server logs for detailed error messages
2. Verify database connectivity and table structure
3. Ensure proper file permissions for uploads directory
4. Review API endpoint documentation for correct usage

---

**Note**: This ads system is designed specifically for the News Markaba platform and integrates seamlessly with the existing authentication and database infrastructure.