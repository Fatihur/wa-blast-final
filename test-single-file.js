const fs = require('fs-extra');
const path = require('path');

async function testSingleFileMessage() {
    console.log('🧪 Testing Single File Message...\n');

    try {
        // Test data
        const testNumber = '6285737853898'; // GANTI dengan nomor WA yang valid
        const testFile = 'john_certificate.pdf';
        const testMessage = 'Hello! This is a test message with file attachment.';

        console.log(`📱 Target Number: ${testNumber}`);
        console.log(`📄 Test File: ${testFile}`);
        console.log(`💬 Message: ${testMessage}`);

        // Check if file exists
        const filePath = path.join('./documents', testFile);
        if (!(await fs.pathExists(filePath))) {
            console.log('❌ Test file not found!');
            return;
        }

        const fileStats = await fs.stat(filePath);
        console.log(`📊 File Size: ${fileStats.size} bytes`);

        // Read file content
        const fileBuffer = await fs.readFile(filePath);
        console.log(`📦 File Buffer Length: ${fileBuffer.length} bytes`);

        // Prepare API request
        const requestData = {
            contacts: [{
                name: 'Test User',
                number: testNumber,
                fileName: testFile
            }],
            message: testMessage,
            delay: 1000,
            retryAttempts: 1
        };

        console.log('\n🚀 Sending test request...');
        console.log('API Endpoint: POST /api/messages/blast-with-files');

        // Make API request
        const response = await fetch('http://localhost:3000/api/messages/blast-with-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        console.log('\n📊 API Response:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ API Request Successful!');
            console.log(`📈 Summary: ${result.summary.sent} sent, ${result.summary.failed} failed`);
            
            if (result.summary.sent > 0) {
                console.log('\n🎯 Message Status: SENT');
                console.log('📱 Please check the target WhatsApp number to verify delivery');
                console.log('🔍 Look for a message with the attached file');
            }
        } else {
            console.log('\n❌ API Request Failed:');
            console.log(result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    testSingleFileMessage();
}

module.exports = testSingleFileMessage;
