const mysql = require('mysql2/promise');
const config = require('../config/database');

class NewsCleanupService {
    constructor() {
        this.pool = mysql.createPool(config);
    }

    /**
     * Delete last news entries older than specified days
     * @param {number} daysOld - Number of days to keep (default: 2)
     * @returns {Promise<Object>} Cleanup results
     */
    async cleanupLastNews(daysOld = 2) {
        try {
            const connection = await this.pool.getConnection();
            
            // Calculate the cutoff date (2 days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            // Delete old last news entries
            const [result] = await connection.execute(
                'DELETE FROM last_news WHERE created_at < ?',
                [cutoffDate]
            );
            
            connection.release();
            
            console.log(`✅ Last News Cleanup: Deleted ${result.affectedRows} entries older than ${daysOld} days`);
            
            return {
                success: true,
                deletedCount: result.affectedRows,
                cutoffDate: cutoffDate.toISOString(),
                table: 'last_news'
            };
        } catch (error) {
            console.error('❌ Error cleaning up last news:', error);
            return {
                success: false,
                error: error.message,
                table: 'last_news'
            };
        }
    }

    /**
     * Delete breaking news entries older than specified days
     * @param {number} daysOld - Number of days to keep (default: 2)
     * @returns {Promise<Object>} Cleanup results
     */
    async cleanupBreakingNews(daysOld = 2) {
        try {
            const connection = await this.pool.getConnection();
            
            // Calculate the cutoff date (2 days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            // Delete old breaking news entries
            const [result] = await connection.execute(
                'DELETE FROM breaking_news WHERE created_at < ?',
                [cutoffDate]
            );
            
            connection.release();
            
            console.log(`✅ Breaking News Cleanup: Deleted ${result.affectedRows} entries older than ${daysOld} days`);
            
            return {
                success: true,
                deletedCount: result.affectedRows,
                cutoffDate: cutoffDate.toISOString(),
                table: 'breaking_news'
            };
        } catch (error) {
            console.error('❌ Error cleaning up breaking news:', error);
            return {
                success: false,
                error: error.message,
                table: 'breaking_news'
            };
        }
    }

    /**
     * Run complete cleanup for both last news and breaking news
     * @param {number} daysOld - Number of days to keep (default: 2)
     * @returns {Promise<Object>} Combined cleanup results
     */
    async runDailyCleanup(daysOld = 2) {
        console.log(`🧹 Starting daily news cleanup - removing entries older than ${daysOld} days...`);
        
        const results = {
            timestamp: new Date().toISOString(),
            daysOld,
            lastNews: null,
            breakingNews: null,
            totalDeleted: 0
        };

        // Cleanup last news
        results.lastNews = await this.cleanupLastNews(daysOld);
        
        // Cleanup breaking news
        results.breakingNews = await this.cleanupBreakingNews(daysOld);
        
        // Calculate total deleted entries
        if (results.lastNews.success) {
            results.totalDeleted += results.lastNews.deletedCount;
        }
        if (results.breakingNews.success) {
            results.totalDeleted += results.breakingNews.deletedCount;
        }

        console.log(`🎯 Daily cleanup completed: ${results.totalDeleted} total entries deleted`);
        
        return results;
    }

    /**
     * Get count of entries that would be deleted (dry run)
     * @param {number} daysOld - Number of days to keep (default: 2)
     * @returns {Promise<Object>} Count of entries to be deleted
     */
    async getCleanupPreview(daysOld = 2) {
        try {
            const connection = await this.pool.getConnection();
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            // Count last news entries to be deleted
            const [lastNewsCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM last_news WHERE created_at < ?',
                [cutoffDate]
            );
            
            // Count breaking news entries to be deleted
            const [breakingNewsCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM breaking_news WHERE created_at < ?',
                [cutoffDate]
            );
            
            connection.release();
            
            return {
                cutoffDate: cutoffDate.toISOString(),
                daysOld,
                lastNewsCount: lastNewsCount[0].count,
                breakingNewsCount: breakingNewsCount[0].count,
                totalCount: lastNewsCount[0].count + breakingNewsCount[0].count
            };
        } catch (error) {
            console.error('❌ Error getting cleanup preview:', error);
            return {
                error: error.message
            };
        }
    }

    /**
     * Close database connection pool
     */
    async close() {
        await this.pool.end();
    }
}

module.exports = NewsCleanupService;