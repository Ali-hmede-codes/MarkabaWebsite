const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/database');

/**
 * Ad Management Service
 * Handles ad cleanup, validation, and utility functions
 */
class AdsService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../public/uploads/ads');
    this.cleanupInterval = null;
  }

  /**
   * Initialize the ads service
   */
  async initialize() {
    try {
      // Create uploads directory if it doesn't exist
      await fs.mkdir(this.uploadsDir, { recursive: true });
      console.log('✅ Ads uploads directory initialized');
      
      // Start cleanup scheduler
      this.startCleanupScheduler();
      
      // Run initial cleanup
      await this.cleanupExpiredAds();
      
      console.log('✅ Ads service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ads service:', error);
      throw error;
    }
  }

  /**
   * Start the cleanup scheduler
   */
  startCleanupScheduler() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredAds();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    console.log('✅ Ads cleanup scheduler started (runs every hour)');
  }

  /**
   * Stop the cleanup scheduler
   */
  stopCleanupScheduler() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Ads cleanup scheduler stopped');
    }
  }

  /**
   * Clean up expired ads and their images
   */
  async cleanupExpiredAds() {
    try {
      console.log('🧹 Starting ads cleanup...');
      
      // Get expired ads
      const expiredAds = await query(
        'SELECT id, title, image_path FROM ads WHERE end_date < NOW() AND is_active = true'
      );
      
      if (expiredAds.length === 0) {
        console.log('✅ No expired ads found');
        return { deleted: 0, errors: [] };
      }

      const errors = [];

      // Delete image files using Promise.all to avoid await in loop
      const deleteResults = await Promise.all(
        expiredAds.map(async (ad) => {
          try {
            const imagePath = path.join(this.uploadsDir, '../public', ad.image_path);
            await fs.unlink(imagePath);
            console.log(`🗑️ Deleted expired ad image: ${ad.image_path} (${ad.title})`);
            return { success: true, ad };
          } catch (error) {
            const errorMsg = `Failed to delete image ${ad.image_path}: ${error.message}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
            return { success: false, ad, error };
          }
        })
      );
      
      const deletedCount = deleteResults.filter(result => result.success).length;
      
      // Mark ads as inactive
      const updateResult = await query(
        'UPDATE ads SET is_active = false WHERE end_date < NOW() AND is_active = true'
      );
      
      console.log(`✅ Marked ${updateResult[0].affectedRows} ads as expired`);
      
      return {
        deleted: deletedCount,
        marked_inactive: updateResult[0].affectedRows,
        errors
      };
    } catch (error) {
      console.error('❌ Error during ads cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned image files (images without corresponding ads)
   */
  async cleanupOrphanedImages() {
    try {
      console.log('🧹 Starting orphaned images cleanup...');
      
      // Get all image files in uploads directory
      const files = await fs.readdir(this.uploadsDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      
      if (imageFiles.length === 0) {
        console.log('✅ No image files found in uploads directory');
        return { deleted: 0, errors: [] };
      }
      
      // Get all image paths from database
      const dbImages = await query(
        'SELECT DISTINCT image_path FROM ads WHERE image_path IS NOT NULL'
      );
      
      const dbImageNames = dbImages[0].map(row => 
        path.basename(row.image_path)
      );
      
      const orphanedFiles = imageFiles.filter(file => 
        !dbImageNames.includes(file)
      );
      
      if (orphanedFiles.length === 0) {
        console.log('✅ No orphaned image files found');
        return { deleted: 0, errors: [] };
      }
      
      const errors = [];
      
      // Delete orphaned files using Promise.all to avoid await in loop
      const deleteResults = await Promise.all(
        orphanedFiles.map(async (file) => {
          try {
            const filePath = path.join(this.uploadsDir, file);
            await fs.unlink(filePath);
            console.log(`🗑️ Deleted orphaned image: ${file}`);
            return { success: true, file };
          } catch (error) {
            const errorMsg = `Failed to delete orphaned image ${file}: ${error.message}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
            return { success: false, file, error };
          }
        })
      );
      
      const deletedCount = deleteResults.filter(result => result.success).length;
      console.log(`✅ Cleaned up ${deletedCount} orphaned image files`);
      
      return {
        deleted: deletedCount,
        errors
      };
    } catch (error) {
      console.error('❌ Error during orphaned images cleanup:', error);
      throw error;
    }
  }

  /**
   * Validate ad position and check limits
   */
  static async validateAdPosition(position, excludeAdId = null) {
    try {
      // Get position data
      const positionData = await query(
        'SELECT * FROM ads_positions WHERE position_name = ?',
        [position]
      );
      
      if (positionData.length === 0) {
        return {
          valid: false,
          error: 'Invalid position'
        };
      }

      const positionInfo = positionData[0];
      
      // Check current active ads count
      let countQuery = 'SELECT COUNT(*) as count FROM ads WHERE position = ? AND is_active = true AND end_date > NOW()';
      let countParams = [position];
      
      if (excludeAdId) {
        countQuery += ' AND id != ?';
        countParams = [...countParams, excludeAdId];
      }
      
      const activeAdsCount = await query(countQuery, countParams);
      const currentCount = activeAdsCount[0].count;
      
      if (currentCount >= positionInfo.max_ads) {
        return {
          valid: false,
          error: `Position ${positionInfo.display_name} has reached maximum ads limit (${positionInfo.max_ads})`
        };
      }
      
      return {
        valid: true,
        position: positionInfo,
        current_count: currentCount,
        available_slots: positionInfo.max_ads - currentCount
      };
    } catch (error) {
      console.error('Error validating ad position:', error);
      throw error;
    }
  }

  /**
   * Get ads by position with active filtering
   */
  static async getAdsByPosition(position, activeOnly = true) {
    try {
      let queryStr = `
        SELECT 
          a.*,
          ap.display_name as position_display_name,
          ap.width as position_width,
          ap.height as position_height
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        WHERE a.position = ?
      `;
      const params = [position];
      
      if (activeOnly) {
        queryStr += ' AND a.is_active = true AND a.end_date > NOW()';
      }
      
      queryStr += ' ORDER BY a.created_at DESC';
      
      const ads = await query(queryStr, params);
      return ads;
    } catch (error) {
      console.error('Error fetching ads by position:', error);
      throw error;
    }
  }

  /**
   * Get ad statistics summary
   */
  static async getAdsSummary() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_ads,
          SUM(CASE WHEN is_active = true AND end_date > NOW() THEN 1 ELSE 0 END) as active_ads,
          SUM(CASE WHEN end_date <= NOW() THEN 1 ELSE 0 END) as expired_ads,
          SUM(clicks) as total_clicks,
          SUM(impressions) as total_impressions,
          AVG(CASE WHEN impressions > 0 THEN (clicks / impressions) * 100 ELSE 0 END) as avg_ctr
        FROM ads
      `);
      
      const positionStats = await query(`
        SELECT 
          ap.position_name,
          ap.display_name,
          ap.max_ads,
          COUNT(a.id) as current_ads,
          SUM(CASE WHEN a.is_active = true AND a.end_date > NOW() THEN 1 ELSE 0 END) as active_ads
        FROM ads_positions ap
        LEFT JOIN ads a ON ap.position_name = a.position
        GROUP BY ap.position_name, ap.display_name, ap.max_ads
        ORDER BY ap.id
      `);
      
      return {
        overall: stats[0],
        by_position: positionStats
      };
    } catch (error) {
      console.error('Error fetching ads summary:', error);
      throw error;
    }
  }

  /**
   * Shutdown the service gracefully
   */
  shutdown() {
    this.stopCleanupScheduler();
    console.log('🛑 Ads service shutdown complete');
  }
}

// Create singleton instance
const adsService = new AdsService();

// Graceful shutdown handlers
process.on('SIGINT', () => {
  adsService.shutdown();
});

process.on('SIGTERM', () => {
  adsService.shutdown();
});

module.exports = adsService;