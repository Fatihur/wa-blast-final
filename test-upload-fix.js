// Test script to verify upload fixes
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUploadFix() {
    console.log('Testing upload fix...');
    
    // Check if server is running
    try {
        const response = await fetch('http://localhost:3000/api/file-matching/documents');
        console.log('✓ Server is running');
    } catch (error) {
        console.log('✗ Server is not running. Please start the server first.');
        return;
    }
    
    // Check if documents directory exists
    const documentsDir = './documents';
    if (!fs.existsSync(documentsDir)) {
        console.log('✗ Documents directory does not exist');
        return;
    }
    console.log('✓ Documents directory exists');
    
    // Create test files
    const testFiles = [];
    for (let i = 1; i <= 5; i++) {
        const fileName = `test-file-${i}.txt`;
        const filePath = path.join(__dirname, fileName);
        const content = `This is test file ${i}\n`.repeat(100); // Small test file
        
        fs.writeFileSync(filePath, content);
        testFiles.push(filePath);
    }
    
    console.log(`✓ Created ${testFiles.length} test files`);
    
    // Test upload
    try {
        const form = new FormData();
        
        testFiles.forEach(filePath => {
            form.append('documents', fs.createReadStream(filePath));
        });
        
        console.log('Uploading test files...');
        const response = await fetch('http://localhost:3000/api/file-matching/documents/upload', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log(`✓ Upload successful: ${result.files.length} files uploaded`);
        } else {
            console.log(`✗ Upload failed: ${result.error}`);
        }
        
    } catch (error) {
        console.log(`✗ Upload error: ${error.message}`);
    }
    
    // Cleanup test files
    testFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
    
    console.log('✓ Cleaned up test files');
    console.log('Test completed!');
}

// Run test
testUploadFix().catch(console.error);
