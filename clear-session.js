// Clear WhatsApp Session Script
// Run this to manually clear session and force new QR code

const fs = require('fs-extra');
const path = require('path');

async function clearSession() {
    const sessionPath = './sessions/wa-session';
    
    try {
        console.log('🧹 Clearing WhatsApp session...');
        
        // Check if session exists
        if (await fs.pathExists(sessionPath)) {
            // Remove session directory
            await fs.remove(sessionPath);
            console.log('✅ Session directory removed');
        } else {
            console.log('ℹ️ No session directory found');
        }
        
        // Recreate empty session directory
        await fs.ensureDir(sessionPath);
        console.log('✅ Fresh session directory created');
        
        console.log('🎉 Session cleared successfully!');
        console.log('💡 Now restart the server and connect to get a new QR code');
        
    } catch (error) {
        console.error('❌ Error clearing session:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    clearSession();
}

module.exports = clearSession;
