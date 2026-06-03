#!/usr/bin/env node
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

const sizes = [192, 512];
const iconPath = path.join(publicDir, 'pwa-icon.svg');
const outputDir = publicDir;

async function generateIcons() {
    try {
        console.log('🔄 Generating PWA icons...');
        
        for (const size of sizes) {
            const outputPath = path.join(outputDir, `pwa-${size}x${size}.png`);
            
            await sharp(iconPath)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 245, g: 245, b: 250, alpha: 1 }
                })
                .png()
                .toFile(outputPath);
            
            console.log(`✓ Generated ${size}x${size} icon`);
        }
        
        // Generate apple-touch-icon (180x180)
        const applePath = path.join(outputDir, 'apple-touch-icon.png');
        await sharp(iconPath)
            .resize(180, 180, {
                fit: 'contain',
                background: { r: 245, g: 245, b: 250, alpha: 1 }
            })
            .png()
            .toFile(applePath);
        
        console.log('✓ Generated apple-touch-icon (180x180)');
        console.log('✅ All PWA icons generated successfully!');
    } catch (error) {
        console.error('❌ Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
