#!/usr/bin/env node

// Startup script for cPanel hosting
// This script handles initialization and environment setup

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WA Blast application...');

// Create necessary directories
const directories = ['uploads', 'sessions', 'logs'];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Set environment variables for cPanel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.SESSION_NAME = process.env.SESSION_NAME || 'wa-blast-session';
process.env.UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '50MB';

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found. Using default environment variables.');
    
    // Create basic .env file
    const defaultEnv = `NODE_ENV=production
SESSION_NAME=wa-blast-session
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB
PORT=3000`;
    
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Created default .env file');
}

// Load environment variables
require('dotenv').config();

console.log('🔧 Environment configured:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   SESSION_NAME: ${process.env.SESSION_NAME}`);
console.log(`   UPLOAD_PATH: ${process.env.UPLOAD_PATH}`);

// Start the main application
console.log('🌟 Starting main application...');
require('./app.js');
