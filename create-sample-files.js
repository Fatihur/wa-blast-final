const fs = require('fs-extra');
const path = require('path');
const xlsx = require('xlsx');

async function createSampleFiles() {
    console.log('🚀 Creating sample files for file matching demo...\n');

    try {
        // Ensure documents directory exists
        await fs.ensureDir('./documents');

        // Create sample documents
        const sampleDocuments = [
            {
                name: 'john_certificate.pdf',
                content: 'Sample PDF certificate for John Doe'
            },
            {
                name: 'jane_report.docx',
                content: 'Sample Word report for Jane Smith'
            },
            {
                name: 'bob_invoice.pdf',
                content: 'Sample PDF invoice for Bob Johnson'
            },
            {
                name: 'alice_contract.pdf',
                content: 'Sample PDF contract for Alice Brown'
            },
            {
                name: 'charlie_presentation.pptx',
                content: 'Sample PowerPoint presentation for Charlie Wilson'
            }
        ];

        // Create sample files with more realistic content
        for (const doc of sampleDocuments) {
            const filePath = path.join('./documents', doc.name);

            // Create more substantial content to avoid "empty file" error
            let content = doc.content + '\n\n';
            content += 'This is a sample document created for WhatsApp Blast file matching demo.\n';
            content += 'Document ID: ' + Date.now() + '\n';
            content += 'Created: ' + new Date().toISOString() + '\n';
            content += 'File Name: ' + doc.name + '\n';
            content += '\n'.repeat(10); // Add some padding
            content += 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
            content += 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
            content += 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. ';
            content += '\n'.repeat(5);
            content += 'End of document.';

            await fs.writeFile(filePath, content);
            console.log(`✅ Created: ${doc.name} (${content.length} bytes)`);
        }

        // Create sample Excel file with fileName column
        // Note: Ganti dengan nomor WhatsApp yang valid untuk testing
        const sampleContacts = [
            {
                name: 'Test User 1',
                number: '6285737853898', // Ganti dengan nomor WA yang valid
                email: 'test1@example.com',
                company: 'ABC Corp',
                position: 'Manager',
                fileName: 'john_certificate.pdf'
            },
            {
                name: 'Test User 2',
                number: '6287758962661', // Ganti dengan nomor WA yang valid
                email: 'test2@example.com',
                company: 'XYZ Ltd',
                position: 'Director',
                fileName: 'jane_report.docx'
            },
            {
                name: 'Test User 3',
                number: '6285737853898', // Ganti dengan nomor WA yang valid
                email: 'test3@example.com',
                company: 'Tech Solutions',
                position: 'Developer',
                fileName: 'bob_invoice.pdf'
            }
        ];

        // Create Excel workbook
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sampleContacts);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        xlsx.writeFile(workbook, 'sample-contacts-with-files.xlsx');

        console.log('✅ Created: sample-contacts-with-files.xlsx');

        console.log('\n🎉 Sample files created successfully!');
        console.log('\n📋 How to test file matching:');
        console.log('1. Open http://localhost:3000/file-matching.html');
        console.log('2. Go to Documents Manager tab');
        console.log('3. Upload the sample documents (or they should already be there)');
        console.log('4. Import the sample-contacts-with-files.xlsx in the main app');
        console.log('5. Go to File Matching tab to see the matching preview');
        console.log('6. Send blast messages with different files per contact');

        console.log('\n📁 Files created:');
        console.log('Documents folder:');
        sampleDocuments.forEach(doc => {
            console.log(`  - ${doc.name}`);
        });
        console.log('Excel file:');
        console.log('  - sample-contacts-with-files.xlsx');

        console.log('\n💡 Template structure:');
        console.log('name | number | email | company | position | fileName');
        console.log('Each contact has a corresponding file in the documents folder');

    } catch (error) {
        console.error('❌ Error creating sample files:', error);
    }
}

// Run the function
createSampleFiles();
