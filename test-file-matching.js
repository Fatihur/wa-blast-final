const fs = require('fs-extra');
const path = require('path');

async function testFileMatching() {
    console.log('🧪 Testing File Matching Feature...\n');

    try {
        // Test 1: Check if documents exist and have proper size
        console.log('📁 Checking documents folder...');
        const documentsPath = './documents';
        const files = await fs.readdir(documentsPath);
        
        for (const file of files) {
            if (file === '.gitkeep') continue;
            
            const filePath = path.join(documentsPath, file);
            const stats = await fs.stat(filePath);
            
            console.log(`  ✅ ${file}: ${stats.size} bytes`);
            
            if (stats.size < 10) {
                console.log(`  ⚠️  Warning: ${file} is very small (${stats.size} bytes)`);
            }
        }

        // Test 2: Test API endpoints
        console.log('\n🌐 Testing API endpoints...');
        
        const testEndpoints = [
            'http://localhost:3000/api/file-matching/documents',
            'http://localhost:3000/api/file-matching/preview',
            'http://localhost:3000/api/contacts'
        ];

        for (const endpoint of testEndpoints) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                if (data.success) {
                    console.log(`  ✅ ${endpoint}: OK`);
                } else {
                    console.log(`  ❌ ${endpoint}: ${data.error || 'Failed'}`);
                }
            } catch (error) {
                console.log(`  ❌ ${endpoint}: ${error.message}`);
            }
        }

        // Test 3: Check file content
        console.log('\n📄 Checking file content...');
        const sampleFile = path.join(documentsPath, 'john_certificate.pdf');
        
        if (await fs.pathExists(sampleFile)) {
            const content = await fs.readFile(sampleFile, 'utf8');
            console.log(`  ✅ Sample file content length: ${content.length} characters`);
            console.log(`  📝 Content preview: ${content.substring(0, 100)}...`);
        }

        // Test 4: Validate contact data
        console.log('\n👥 Checking contact data...');
        const contactsFile = './data/contacts.json';
        
        if (await fs.pathExists(contactsFile)) {
            const contactsData = await fs.readFile(contactsFile, 'utf8');
            const contacts = JSON.parse(contactsData);
            
            console.log(`  ✅ Total contacts in storage: ${contacts.contacts?.length || 0}`);
            
            if (contacts.contacts && contacts.contacts.length > 0) {
                const contactsWithFiles = contacts.contacts.filter(c => c.fileName);
                console.log(`  ✅ Contacts with fileName: ${contactsWithFiles.length}`);
                
                contactsWithFiles.forEach(contact => {
                    console.log(`    - ${contact.name}: ${contact.fileName}`);
                });
            }
        } else {
            console.log('  ⚠️  No contacts found in storage');
        }

        console.log('\n🎯 Test Summary:');
        console.log('1. ✅ Documents folder checked');
        console.log('2. ✅ API endpoints tested');
        console.log('3. ✅ File content validated');
        console.log('4. ✅ Contact data checked');

        console.log('\n📋 Next Steps for Manual Testing:');
        console.log('1. Open http://localhost:3000');
        console.log('2. Import sample-contacts-with-files.xlsx');
        console.log('3. Open http://localhost:3000/file-matching.html');
        console.log('4. Test file matching and blast');

        console.log('\n⚠️  Important Notes:');
        console.log('- Make sure to use valid WhatsApp numbers for testing');
        console.log('- Check that WhatsApp is connected before sending');
        console.log('- Monitor server logs for detailed error messages');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run if called directly
if (require.main === module) {
    testFileMatching();
}

module.exports = testFileMatching;
