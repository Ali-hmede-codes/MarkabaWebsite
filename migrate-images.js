const fs = require('fs');
const path = require('path');

// Migration script to move images from client/public/images to server/public/uploads

const sourceDir = path.join(__dirname, 'client/public/images');
const targetDir = path.join(__dirname, 'server/public/uploads');

async function migrateImages() {
  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log('✅ Created target directory:', targetDir);
    }

    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.log('❌ Source directory does not exist:', sourceDir);
      return;
    }

    // Read all files from source directory
    const files = fs.readdirSync(sourceDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });

    console.log(`📁 Found ${imageFiles.length} image files to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const file of imageFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      // Skip if file already exists in target
      if (fs.existsSync(targetPath)) {
        console.log(`⏭️  Skipped (already exists): ${file}`);
        skippedCount++;
        continue;
      }

      // Copy file
      try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Migrated: ${file}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate ${file}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} files`);
    console.log(`   ⏭️  Skipped: ${skippedCount} files`);
    console.log(`   📁 Total processed: ${imageFiles.length} files`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 Images are now served from: /uploads/ (backend)');
      console.log('💡 This will improve caching and reduce frontend build times.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Run migration
migrateImages();