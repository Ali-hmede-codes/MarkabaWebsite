-- Insert Test Ad for Endpoint Testing
-- This script creates a comprehensive test ad to verify all ads endpoints

-- First, let's check if we have any existing test ads and clean them up
DELETE FROM ads WHERE title LIKE 'Test Ad%' OR title = 'Comprehensive Test Advertisement';

-- Insert a comprehensive test ad with all required fields
INSERT INTO ads (
    title,
    description,
    image_path,
    url,
    position,
    width,
    height,
    is_active,
    start_date,
    end_date,
    clicks,
    created_by
) VALUES (
    'Comprehensive Test Advertisement',
    'This is a test ad created to verify all ads API endpoints are working correctly. It includes all required fields and proper date ranges.',
    '/uploads/ads/test-ad-image.jpg',
    'https://example.com/test-ad-landing',
    'main_top',
    1280,
    300,
    1, -- is_active = true
    NOW() - INTERVAL 1 DAY, -- start_date: started yesterday
    NOW() + INTERVAL 30 DAY, -- end_date: expires in 30 days
    0, -- initial clicks
    1 -- created_by admin user (assuming user ID 1 exists)
);

-- Insert additional test ads for different positions
INSERT INTO ads (
    title,
    description,
    image_path,
    url,
    position,
    width,
    height,
    is_active,
    start_date,
    end_date,
    clicks,
    created_by
) VALUES 
(
    'Test Ad - Main Middle',
    'Test advertisement for main middle position',
    '/uploads/ads/test-ad-middle.jpg',
    'https://example.com/middle-ad',
    'main_middle',
    1280,
    250,
    1,
    NOW() - INTERVAL 2 HOUR,
    NOW() + INTERVAL 15 DAY,
    5,
    1
),
(
    'Test Ad - Post Square',
    'Square test advertisement for post pages',
    '/uploads/ads/test-ad-square.jpg',
    'https://example.com/square-ad',
    'post_square',
    300,
    300,
    1,
    NOW() - INTERVAL 1 HOUR,
    NOW() + INTERVAL 20 DAY,
    12,
    1
),
(
    'Test Ad - Inactive',
    'This ad is inactive for testing filtering',
    '/uploads/ads/test-ad-inactive.jpg',
    'https://example.com/inactive-ad',
    'main_bottom',
    1280,
    200,
    0, -- is_active = false
    NOW() - INTERVAL 1 DAY,
    NOW() + INTERVAL 10 DAY,
    0,
    1
),
(
    'Test Ad - Future Start',
    'This ad starts in the future for testing date filtering',
    '/uploads/ads/test-ad-future.jpg',
    'https://example.com/future-ad',
    'post_banner',
    1280,
    300,
    1,
    NOW() + INTERVAL 1 DAY, -- starts tomorrow
    NOW() + INTERVAL 25 DAY,
    0,
    1
),
(
    'Test Ad - Expired',
    'This ad has expired for testing date filtering',
    '/uploads/ads/test-ad-expired.jpg',
    'https://example.com/expired-ad',
    'main_top',
    1280,
    300,
    1,
    NOW() - INTERVAL 10 DAY,
    NOW() - INTERVAL 1 DAY, -- expired yesterday
    25,
    1
);

-- Verify the inserted test ads
SELECT 
    id,
    title,
    position,
    is_active,
    start_date,
    end_date,
    CASE 
        WHEN is_active = 1 AND start_date <= NOW() AND end_date > NOW() THEN 'ACTIVE'
        WHEN is_active = 0 THEN 'INACTIVE'
        WHEN start_date > NOW() THEN 'FUTURE'
        WHEN end_date <= NOW() THEN 'EXPIRED'
        ELSE 'UNKNOWN'
    END as status
FROM ads 
WHERE title LIKE 'Test Ad%' OR title = 'Comprehensive Test Advertisement'
ORDER BY id;

-- Show summary of test data
SELECT 
    'Total Test Ads' as metric,
    COUNT(*) as count
FROM ads 
WHERE title LIKE 'Test Ad%' OR title = 'Comprehensive Test Advertisement'

UNION ALL

SELECT 
    'Currently Active Test Ads' as metric,
    COUNT(*) as count
FROM ads 
WHERE (title LIKE 'Test Ad%' OR title = 'Comprehensive Test Advertisement')
    AND is_active = 1 
    AND start_date <= NOW() 
    AND end_date > NOW()

UNION ALL

SELECT 
    CONCAT('Position: ', position) as metric,
    COUNT(*) as count
FROM ads 
WHERE (title LIKE 'Test Ad%' OR title = 'Comprehensive Test Advertisement')
    AND is_active = 1 
    AND start_date <= NOW() 
    AND end_date > NOW()
GROUP BY position;

-- Test queries that match the API endpoints
SELECT '=== Testing /api/ads/active endpoint ===' as test_info;
SELECT 
    id,
    title,
    description,
    image_path,
    url,
    position,
    width,
    height,
    clicks,
    start_date,
    end_date
FROM ads
WHERE is_active = 1 
    AND start_date <= NOW() 
    AND end_date > NOW()
ORDER BY RAND()
LIMIT 10;

SELECT '=== Testing /api/ads/position/main_top endpoint ===' as test_info;
SELECT 
    id,
    title,
    description,
    image_path,
    url,
    position,
    width,
    height,
    clicks,
    start_date,
    end_date
FROM ads
WHERE position = 'main_top'
    AND is_active = 1 
    AND start_date <= NOW() 
    AND end_date > NOW()
ORDER BY RAND()
LIMIT 1;

SELECT 'Test data insertion completed successfully!' as result;