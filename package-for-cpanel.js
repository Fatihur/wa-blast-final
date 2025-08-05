// Script to package application for cPanel deployment
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

console.log('📦 Packaging WA Blast for cPanel deployment...');

const packageName = `wa-blast-cpanel-${new Date().toISOString().split('T')[0]}.zip`;
const outputPath = path.join(__dirname, 'dist', packageName);

// Create dist directory
fs.ensureDirSync(path.dirname(outputPath));

// Files and directories to include
const includeFiles = [
    'app.js',
    'server.js',
    'package.json',
    'startup.js',
    '.env.example',
    'public/',
    'routes/',
    'services/',
    'utils/',
    'config/',
    'CPANEL-DEPLOYMENT.md'
];

// Files and directories to exclude
const excludePatterns = [
    'node_modules/',
    'sessions/',
    'uploads/',
    'logs/',
    '.git/',
    '.env',
    'dist/',
    'main.js',
    'preload.js',
    'splash.html',
    'assets/',
    'Dockerfile',
    'docker-compose.yml',
    '.dockerignore'
];

// Create ZIP archive
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
    console.log(`✅ Package created: ${packageName}`);
    console.log(`📁 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📍 Location: ${outputPath}`);
    console.log('');
    console.log('🚀 Ready for cPanel deployment!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Upload this ZIP file to your cPanel File Manager');
    console.log('2. Extract in your domain/subdomain folder');
    console.log('3. Follow CPANEL-DEPLOYMENT.md guide');
});

archive.on('error', (err) => {
    console.error('❌ Error creating package:', err);
});

archive.pipe(output);

// Add files to archive
includeFiles.forEach(item => {
    const itemPath = path.join(__dirname, item);
    
    if (fs.existsSync(itemPath)) {
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            archive.directory(itemPath, item);
            console.log(`📁 Added directory: ${item}`);
        } else {
            archive.file(itemPath, { name: item });
            console.log(`📄 Added file: ${item}`);
        }
    } else {
        console.log(`⚠️  Skipped (not found): ${item}`);
    }
});

// Create installation instructions
const instructions = `# WA Blast cPanel Installation

## Quick Start:
1. Extract this ZIP file in your cPanel File Manager
2. Go to Node.js Apps in cPanel
3. Create new app with startup file: app.js
4. Install dependencies: npm install
5. Start the application

## Detailed instructions:
See CPANEL-DEPLOYMENT.md for complete guide.

## Support:
- Check logs in cPanel Node.js Apps
- Verify file permissions (755 for directories)
- Ensure Node.js 14+ is available

Generated: ${new Date().toISOString()}
`;

archive.append(instructions, { name: 'INSTALLATION.txt' });

// Finalize the archive
archive.finalize();
