#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts images to WebP format and generates responsive sizes
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const config = {
  inputDir: path.join(__dirname, '../frontend/public'),
  outputDir: path.join(__dirname, '../frontend/public/optimized'),
  formats: ['webp', 'avif'],
  sizes: [320, 640, 960, 1280, 1920],
  quality: 80,
};

async function findImages(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      await findImages(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function optimizeImages() {
  console.log('🖼️  Image Optimization Script');
  console.log('================================\n');
  
  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('❌ Sharp is not installed!');
      console.log('\n📦 Install sharp with: npm install --save-dev sharp\n');
      process.exit(1);
    }
    
    // Create output directory
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    // Find all images
    console.log('🔍 Finding images...');
    const images = await findImages(config.inputDir);
    console.log(`Found ${images.length} images\n`);
    
    if (images.length === 0) {
      console.log('✅ No images to optimize');
      return;
    }
    
    // Optimize each image
    let optimized = 0;
    let totalSavings = 0;
    
    for (const imagePath of images) {
      const relativePath = path.relative(config.inputDir, imagePath);
      const outputPath = path.join(config.outputDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const originalSize = fs.statSync(imagePath).size;
      const fileName = path.basename(imagePath, path.extname(imagePath));
      
      console.log(`📸 Optimizing: ${relativePath}`);
      
      try {
        // Convert to WebP
        const webpPath = path.join(outputDir, `${fileName}.webp`);
        await sharp(imagePath)
          .webp({ quality: config.quality })
          .toFile(webpPath);
        
        const webpSize = fs.statSync(webpPath).size;
        const savings = originalSize - webpSize;
        totalSavings += savings;
        
        console.log(`  ✓ WebP: ${(webpSize / 1024).toFixed(2)} KB (saved ${(savings / 1024).toFixed(2)} KB)`);
        
        // Generate responsive sizes
        for (const size of config.sizes) {
          const resizedPath = path.join(outputDir, `${fileName}-${size}w.webp`);
          await sharp(imagePath)
            .resize(size, null, { withoutEnlargement: true })
            .webp({ quality: config.quality })
            .toFile(resizedPath);
        }
        
        optimized++;
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('================================');
    console.log(`✅ Optimized ${optimized}/${images.length} images`);
    console.log(`💾 Total savings: ${(totalSavings / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Output directory: ${config.outputDir}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  optimizeImages().catch(console.error);
}

module.exports = { optimizeImages };
