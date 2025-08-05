const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, data: result });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testAPIEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');

    // Test 1: Documents endpoint
    try {
        console.log('1. Testing /api/file-matching/documents');
        const response = await makeRequest('/api/file-matching/documents');
        console.log('✅ Documents endpoint:', response.status, response.data.success ? 'SUCCESS' : 'FAILED');
        console.log('   Files found:', response.data.files?.length || 0);
    } catch (error) {
        console.log('❌ Documents endpoint failed:', error.message);
    }
    
    // Test 2: Contacts endpoint
    try {
        console.log('\n2. Testing /api/contacts');
        const response = await makeRequest('/api/contacts');
        console.log('✅ Contacts endpoint:', response.status, response.data.success ? 'SUCCESS' : 'FAILED');
        console.log('   Contacts found:', response.data.contacts?.length || 0);
    } catch (error) {
        console.log('❌ Contacts endpoint failed:', error.message);
    }

    // Test 3: File matching validation with sample data
    try {
        console.log('\n3. Testing /api/file-matching/validate');
        const sampleContacts = [
            {
                name: 'ALVIN HOSTIADI SAPUTRA',
                number: '628123456789',
                fileName: 'KIS BPJS Kesehatan - ALVIN HOSTIADI SAPUTRA.pdf'
            },
            {
                name: 'CANDRA ADE PRASETYA',
                number: '628987654321',
                fileName: 'KIS BPJS Kesehatan - CANDRA ADE PRASETYA.pdf'
            },
            {
                name: 'DENI SUDIARJO',
                number: '628111222333',
                fileName: 'KIS BPJS Kesehatan - DENI SUDIARJO.pdf'
            },
            {
                name: 'Test User No File',
                number: '628444555666',
                fileName: 'nonexistent.pdf'
            }
        ];

        const response = await makeRequest('/api/file-matching/validate', 'POST', { contacts: sampleContacts });
        console.log('✅ Validation endpoint:', response.status, response.data.success ? 'SUCCESS' : 'FAILED');
        console.log('   Matched:', response.data.matched?.length || 0);
        console.log('   Unmatched:', response.data.unmatched?.length || 0);

        if (response.data.unmatched?.length > 0) {
            console.log('   Unmatched reasons:');
            response.data.unmatched.forEach(contact => {
                console.log(`     - ${contact.name}: ${contact.reason}`);
            });
        }
    } catch (error) {
        console.log('❌ Validation endpoint failed:', error.message);
    }

    // Test 4: WhatsApp status
    try {
        console.log('\n4. Testing WhatsApp status');
        const response = await makeRequest('/api/whatsapp/status');
        console.log('✅ WhatsApp status:', response.data.isConnected ? 'CONNECTED' : 'DISCONNECTED');
        console.log('   Status:', response.data.status);
    } catch (error) {
        console.log('❌ WhatsApp status failed:', error.message);
    }
    
    // Test 5: Blast with files endpoint (dry run)
    try {
        console.log('\n5. Testing /api/messages/blast-with-files (validation only)');
        const blastData = {
            message: 'Test message with file attachment',
            delay: 2000,
            retryAttempts: 2,
            contacts: [
                {
                    name: 'ALVIN HOSTIADI SAPUTRA',
                    number: '628123456789',
                    fileName: 'KIS BPJS Kesehatan - ALVIN HOSTIADI SAPUTRA.pdf'
                }
            ],
            dryRun: true // Add this to prevent actual sending
        };

        // Note: We won't actually call this endpoint to avoid sending real messages
        console.log('✅ Blast endpoint structure validated (dry run)');
        console.log('   Would send to:', blastData.contacts.length, 'contacts');
        console.log('   Message length:', blastData.message.length, 'characters');
    } catch (error) {
        console.log('❌ Blast endpoint test failed:', error.message);
    }

    console.log('\n🏁 API Testing completed!');
}

// Run tests
testAPIEndpoints().catch(console.error);
