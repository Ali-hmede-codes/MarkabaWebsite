const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');

/**
 * Ad Expiration Service
 * Handles automatic expiration of ads and cleanup of associated images
 */
class AdExpirationService {


  /**
   * Start the expiration service
   */
  static start() {
    if (AdExpirationService.isRunning) {
      console.log('Ad expiration service is already running');
      return;
    }

    console.log('Starting ad expiration service...');
    AdExpirationService.isRunning = true;
    
    // Run immediately on start
    AdExpirationService.checkExpiredAds();
    
    // Set up interval to run periodically
    AdExpirationService.intervalId = setInterval(() => {
      AdExpirationService.checkExpiredAds();
    }, AdExpirationService.checkInterval);

    console.log(`Ad expiration service started. Checking every ${AdExpirationService.checkInterval / 1000 / 60} minutes.`);
  }

  /**
   * Stop the expiration service
   */
  static stop() {
    if (!AdExpirationService.isRunning) {
      console.log('Ad expiration service is not running');
      return;
    }

    console.log('Stopping ad expiration service...');
    AdExpirationService.isRunning = false;
    
    if (AdExpirationService.intervalId) {
      clearInterval(AdExpirationService.intervalId);
      AdExpirationService.intervalId = null;
    }

    console.log('Ad expiration service stopped.');
  }

  /**
   * Check for expired ads and process them
   */
  static async checkExpiredAds() {
    try {
      console.log('Checking for expired ads...');
      
      // Get expired ads
      const expiredAds = await AdExpirationService.getExpiredAds();
      
      if (expiredAds.length === 0) {
        console.log('No expired ads found.');
        return;
      }

      console.log(`Found ${expiredAds.length} expired ads. Processing...`);
      
      await Promise.all(expiredAds.map(async (ad) => {
        try {
          await AdExpirationService.processExpiredAd(ad);
        } catch (error) {
          console.error(`Error processing expired ad ${ad.id}:`, error);
        }
      }));
      
      console.log(`Successfully processed ${expiredAds.length} expired ads.`);
    } catch (error) {
      console.error('Error checking expired ads:', error);
    }
  }

  /**
   * Get all expired ads from database
   */
  static async getExpiredAds() {
    const query = `
      SELECT 
        a.id,
        a.title,
        a.image_path,
        a.link_url,
        a.position_id,
        a.start_date,
        a.expiration_date,
        a.click_count,
        a.is_active,
        a.created_by,
        a.created_at,
        a.updated_at,
        ap.name as position_name
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      WHERE a.is_active = 1 
        AND a.expiration_date <= NOW()
      ORDER BY a.expiration_date ASC
    `;
    
    const results = await db.query(query);
    return results;
  }

  /**
   * Process a single expired ad
   */
  static async processExpiredAd(ad) {
    try {
      console.log(`Processing expired ad: ${ad.title} (ID: ${ad.id})`);
      
      // Start transaction
      await AdExpirationService.beginTransaction();
      
      try {
        // Move ad to inactive table
        await AdExpirationService.moveToInactive(ad);
        
        // Delete the ad from active table
        await AdExpirationService.deleteFromActive(ad.id);
        
        // Delete associated image file
        await AdExpirationService.deleteImageFile(ad.image_path);
        
        // Commit transaction
        await AdExpirationService.commitTransaction();
        
        console.log(`Successfully processed expired ad: ${ad.title}`);
      } catch (error) {
        // Rollback transaction on error
        await AdExpirationService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error(`Error processing expired ad ${ad.id}:`, error);
    }
  }

  /**
   * Move expired ad to inactive table
   */
  static async moveToInactive(ad) {
    const query = `
      INSERT INTO ads_inactive (
        original_ad_id, title, image_path, link_url, position_id,
        start_date, expiration_date, click_count, created_by,
        created_at, updated_at, expired_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
      ad.id,
      ad.title,
      ad.image_path,
      ad.link_url,
      ad.position_id,
      ad.start_date,
      ad.expiration_date,
      ad.click_count,
      ad.created_by,
      ad.created_at,
      ad.updated_at
    ];
    
    const result = await db.query(query, values);
    return result;
  }

  /**
   * Delete ad from active table
   */
  static async deleteFromActive(adId) {
    const query = 'DELETE FROM ads WHERE id = ?';
    
    const result = await db.query(query, [adId]);
    return result;
  }

  /**
   * Delete image file from filesystem
   */
  static async deleteImageFile(imagePath) {
    if (!imagePath) {
      console.log('No image path provided, skipping file deletion');
      return;
    }

    try {
      // Construct full path to image file
      const fullPath = path.join(__dirname, '..', 'public', 'uploads', 'ads', path.basename(imagePath));
      
      // Check if file exists
      try {
        await fs.access(fullPath);
        // File exists, delete it
        await fs.unlink(fullPath);
        console.log(`Deleted image file: ${path.basename(imagePath)}`);
      } catch (accessError) {
        if (accessError.code === 'ENOENT') {
          console.log(`Image file not found: ${path.basename(imagePath)} (already deleted or moved)`);
        } else {
          throw accessError;
        }
      }
    } catch (error) {
      console.error(`Error deleting image file ${imagePath}:`, error);
      // Don't throw error here - we don't want to fail the entire process if image deletion fails
    }
  }

  /**
   * Begin database transaction
   */
  static async beginTransaction() {
    await db.beginTransaction();
  }

  /**
   * Commit database transaction
   */
  static async commitTransaction() {
    await db.commit();
  }

  /**
   * Rollback database transaction
   */
  static async rollbackTransaction() {
    await db.rollback();
  }

  /**
   * Manual cleanup - can be called via API for immediate cleanup
   */
  static async manualCleanup() {
    console.log('Manual ad cleanup initiated...');
    await AdExpirationService.checkExpiredAds();
    return { success: true, message: 'Manual cleanup completed' };
  }

  /**
   * Get service status
   */
  static getStatus() {
    return {
      isRunning: AdExpirationService.isRunning,
      checkInterval: AdExpirationService.checkInterval,
      nextCheck: AdExpirationService.intervalId ? new Date(Date.now() + AdExpirationService.checkInterval) : null
    };
  }
}

// Static properties
AdExpirationService.isRunning = false;
AdExpirationService.intervalId = null;
AdExpirationService.checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds

module.exports = AdExpirationService;