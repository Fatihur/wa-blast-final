const http = require('http');
const fs = require('fs');
const path = require('path');

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

async function importTestContacts() {
    console.log('📤 Importing test contacts...\n');
    
    const testContacts = [
        {
            name: 'ALVIN HOSTIADI SAPUTRA',
            number: '628123456789',
            email: 'alvin@example.com',
            company: 'ELECTRICIAN',
            fileName: 'KIS BPJS Kesehatan - ALVIN HOSTIADI SAPUTRA.pdf'
        },
        {
            name: 'CANDRA ADE PRASETYA',
            number: '628987654321',
            email: 'candra@example.com',
            company: 'PLUMBER',
            fileName: 'KIS BPJS Kesehatan - CANDRA ADE PRASETYA.pdf'
        },
        {
            name: 'DENI SUDIARJO',
            number: '628111222333',
            email: 'deni@example.com',
            company: 'CARPENTER',
            fileName: 'KIS BPJS Kesehatan - DENI SUDIARJO.pdf'
        },
        {
            name: 'ABDUL HADI NAJAMUDIN',
            number: '628444555666',
            email: 'abdul@example.com',
            company: 'MECHANIC',
            fileName: 'KIS BPJS Kesehatan - ABDUL HADI NAJAMUDIN.pdf'
        },
        {
            name: 'AGUS SALIM',
            number: '628777888999',
            email: 'agus@example.com',
            company: 'WELDER',
            fileName: 'KIS BPJS Kesehatan - AGUS SALIM.pdf'
        },
        {
            name: 'Test User No File',
            number: '628000111222',
            email: 'nofile@example.com',
            company: 'TESTER',
            fileName: 'nonexistent.pdf'
        }
    ];
    
    try {
        // Clear existing contacts first
        console.log('🗑️ Clearing existing contacts...');
        const clearResponse = await makeRequest('/api/contacts/clear', 'DELETE');
        console.log('Clear result:', clearResponse.status, clearResponse.data.success ? 'SUCCESS' : 'FAILED');
        
        // Import new contacts
        console.log('\n📥 Importing new contacts...');
        const importResponse = await makeRequest('/api/contacts/import', 'POST', {
            contacts: testContacts,
            source: 'test-script'
        });
        
        console.log('Import result:', importResponse.status, importResponse.data.success ? 'SUCCESS' : 'FAILED');
        console.log('Contacts imported:', importResponse.data.imported || 0);
        
        if (importResponse.data.summary) {
            console.log('Import summary:', importResponse.data.summary);
        }
        
        // Verify import
        console.log('\n🔍 Verifying import...');
        const verifyResponse = await makeRequest('/api/contacts');
        console.log('Verification:', verifyResponse.status, verifyResponse.data.success ? 'SUCCESS' : 'FAILED');
        console.log('Total contacts:', verifyResponse.data.contacts?.length || 0);
        
        if (verifyResponse.data.contacts?.length > 0) {
            console.log('\nSample contacts:');
            verifyResponse.data.contacts.slice(0, 3).forEach(contact => {
                console.log(`  - ${contact.name}: ${contact.fileName || 'No file'}`);
            });
        }
        
        // Test file matching with imported contacts
        console.log('\n🔗 Testing file matching...');
        const matchingResponse = await makeRequest('/api/file-matching/validate', 'POST', {
            contacts: testContacts
        });
        
        console.log('File matching result:', matchingResponse.status, matchingResponse.data.success ? 'SUCCESS' : 'FAILED');
        console.log('Matched contacts:', matchingResponse.data.matched?.length || 0);
        console.log('Unmatched contacts:', matchingResponse.data.unmatched?.length || 0);
        
        if (matchingResponse.data.matched?.length > 0) {
            console.log('\nMatched contacts:');
            matchingResponse.data.matched.forEach(contact => {
                console.log(`  ✅ ${contact.name} → ${contact.matchedFile.fileName}`);
            });
        }
        
        if (matchingResponse.data.unmatched?.length > 0) {
            console.log('\nUnmatched contacts:');
            matchingResponse.data.unmatched.forEach(contact => {
                console.log(`  ❌ ${contact.name}: ${contact.reason}`);
            });
        }
        
        console.log('\n🎉 Test contacts import completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Open http://localhost:3000/file-matching.html');
        console.log('2. Click "Test Dialog" to test SweetAlert2');
        console.log('3. Click "Test Full Flow" to test with imported contacts');
        console.log('4. Try sending a blast message');
        
    } catch (error) {
        console.error('❌ Error importing test contacts:', error.message);
    }
}

// Run import
importTestContacts().catch(console.error);
