#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function setup() {
    console.log('🚀 Setting up WhatsApp Blast Application...\n');

    try {
        // Create necessary directories
        const directories = ['uploads', 'sessions', 'logs'];
        
        for (const dir of directories) {
            await fs.ensureDir(dir);
            console.log(`✅ Created directory: ${dir}`);
        }

        // Create .env file if it doesn't exist
        const envPath = '.env';
        const envExamplePath = '.env.example';
        
        if (!await fs.pathExists(envPath)) {
            if (await fs.pathExists(envExamplePath)) {
                await fs.copy(envExamplePath, envPath);
                console.log('✅ Created .env file from .env.example');
            } else {
                const defaultEnv = `PORT=3000
SESSION_NAME=wa-blast-session
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB`;
                await fs.writeFile(envPath, defaultEnv);
                console.log('✅ Created default .env file');
            }
        } else {
            console.log('ℹ️  .env file already exists');
        }

        // Create .gitkeep files
        const gitkeepFiles = [
            'uploads/.gitkeep',
            'sessions/.gitkeep',
            'logs/.gitkeep'
        ];

        for (const file of gitkeepFiles) {
            if (!await fs.pathExists(file)) {
                await fs.writeFile(file, '# Keep this directory in git\n');
                console.log(`✅ Created ${file}`);
            }
        }

        console.log('\n🎉 Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm install');
        console.log('2. Run: npm start');
        console.log('3. Open: http://localhost:3000');
        console.log('\nFor development with auto-reload:');
        console.log('Run: npm run dev');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
