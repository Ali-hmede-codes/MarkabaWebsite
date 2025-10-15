const NewsCleanupService = require('./services/newsCleanupService');

/**
 * Test script for news cleanup functionality
 * This script will test the cleanup service without actually deleting data
 */
async function testNewsCleanup() {
    console.log('🧪 Testing News Cleanup Service...\n');
    
    const cleanupService = new NewsCleanupService();
    
    try {
        // Test 1: Get cleanup preview (dry run)
        console.log('📊 Test 1: Getting cleanup preview (dry run)...');
        const preview = await cleanupService.getCleanupPreview(2);
        
        if (preview.error) {
            console.error('❌ Preview failed:', preview.error);
        } else {
            console.log('✅ Preview results:');
            console.log(`   - Cutoff date: ${preview.cutoffDate}`);
            console.log(`   - Days old threshold: ${preview.daysOld}`);
            console.log(`   - Last news entries to delete: ${preview.lastNewsCount}`);
            console.log(`   - Breaking news entries to delete: ${preview.breakingNewsCount}`);
            console.log(`   - Total entries to delete: ${preview.totalCount}`);
        }
        
        console.log(`\n${'='.repeat(50)}\n`);
        
        // Test 2: Ask user if they want to proceed with actual cleanup
        console.log('⚠️  Test 2: Actual cleanup test');
        console.log('This would delete entries older than 2 days from both tables.');
        console.log('To run actual cleanup, uncomment the lines below and run again.\n');
        
        // Uncomment these lines to test actual cleanup:
        /*
        console.log('🧹 Running actual cleanup...');
        const results = await cleanupService.runDailyCleanup(2);
        console.log('✅ Cleanup results:', JSON.stringify(results, null, 2));
        */
        
        console.log('📝 To test actual cleanup:');
        console.log('1. Uncomment the cleanup code in this file');
        console.log('2. Make sure you have backup of your database');
        console.log('3. Run this script again');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Close database connection
        await cleanupService.close();
        console.log('\n🔒 Database connection closed');
    }
}

// Run the test
testNewsCleanup().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});