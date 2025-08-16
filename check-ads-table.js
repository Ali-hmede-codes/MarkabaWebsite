const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function checkAdsTable() {
    console.log('🔍 Checking ads table structure on production...');
    
    try {
        // Create connection to production database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Connected to production database');
        
        // Check if ads table exists
        console.log('\n1️⃣ Checking if ads table exists...');
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'ads'"
        );
        
        if (tables.length === 0) {
            console.log('❌ ads table does not exist!');
            await connection.end();
            return;
        }
        
        console.log('✅ ads table exists');
        
        // Check ads table structure
        console.log('\n2️⃣ Checking ads table structure...');
        const [columns] = await connection.execute('DESCRIBE ads');
        console.log('Ads table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
        });
        
        // Check if ad_positions table exists
        console.log('\n3️⃣ Checking if ad_positions table exists...');
        const [positionTables] = await connection.execute(
            "SHOW TABLES LIKE 'ad_positions'"
        );
        
        if (positionTables.length === 0) {
            console.log('❌ ad_positions table does not exist!');
        } else {
            console.log('✅ ad_positions table exists');
            
            // Check ad_positions table structure
            const [posColumns] = await connection.execute('DESCRIBE ad_positions');
            console.log('Ad_positions table columns:');
            posColumns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
            });
        }
        
        // Check if users table exists (for the JOIN)
        console.log('\n4️⃣ Checking if users table exists...');
        const [userTables] = await connection.execute(
            "SHOW TABLES LIKE 'users'"
        );
        
        if (userTables.length === 0) {
            console.log('❌ users table does not exist!');
        } else {
            console.log('✅ users table exists');
        }
        
        // Try to run a simple query on ads table
        console.log('\n5️⃣ Testing simple ads query...');
        try {
            const [adsCount] = await connection.execute('SELECT COUNT(*) as count FROM ads');
            console.log(`✅ Ads table query successful. Total ads: ${adsCount[0].count}`);
        } catch (queryError) {
            console.log('❌ Error querying ads table:', queryError.message);
        }
        
        // Try the exact query from the route
        console.log('\n6️⃣ Testing the exact route query...');
        try {
            const testQuery = `
                SELECT 
                    a.id,
                    a.title,
                    a.image_path,
                    a.link_url,
                    a.position_id,
                    a.start_date,
                    a.expire_date,
                    a.is_active,
                    a.clicks,
                    a.created_by,
                    a.created_at,
                    a.updated_at,
                    ap.name as position_name,
                    ap.name_ar as position_name_ar,
                    u.username as created_by_username
                FROM ads a
                LEFT JOIN ad_positions ap ON a.position_id = ap.id
                LEFT JOIN users u ON a.created_by = u.id
                WHERE 1=1
                ORDER BY a.created_at DESC
                LIMIT 10 OFFSET 0
            `;
            
            const [testResult] = await connection.execute(testQuery);
            console.log(`✅ Route query successful. Returned ${testResult.length} ads`);
            
            if (testResult.length > 0) {
                console.log('Sample ad:', {
                    id: testResult[0].id,
                    title: testResult[0].title,
                    position_name: testResult[0].position_name
                });
            }
            
        } catch (routeError) {
            console.log('❌ Error with route query:', routeError.message);
            console.log('SQL State:', routeError.sqlState);
            console.log('Error Code:', routeError.code);
        }
        
        await connection.end();
        console.log('\n🔍 Database check completed');
        
    } catch (error) {
        console.log('❌ Database connection error:', error.message);
    }
}

checkAdsTable();