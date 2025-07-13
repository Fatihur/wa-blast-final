const xlsx = require('xlsx');

// GANTI NOMOR INI DENGAN NOMOR WHATSAPP YANG VALID UNTUK TESTING
const realTestContacts = [
    {
        name: 'Test User 1',
        number: '6285737853898', // GANTI dengan nomor WA yang valid
        email: 'test1@example.com',
        company: 'Test Company 1',
        position: 'Tester',
        fileName: 'john_certificate.pdf'
    },
    {
        name: 'Test User 2',
        number: '6287758962661', // GANTI dengan nomor WA yang valid  
        email: 'test2@example.com',
        company: 'Test Company 2',
        position: 'Tester',
        fileName: 'jane_report.docx'
    }
    // Tambahkan nomor WA yang valid lainnya jika diperlukan
];

console.log('📝 Creating test contacts with REAL WhatsApp numbers...\n');

console.log('⚠️  IMPORTANT: Make sure to replace the phone numbers with VALID WhatsApp numbers!');
console.log('Current test numbers:');
realTestContacts.forEach((contact, index) => {
    console.log(`${index + 1}. ${contact.name}: ${contact.number} -> ${contact.fileName}`);
});

// Create Excel workbook
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(realTestContacts);
xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');
xlsx.writeFile(workbook, 'real-test-contacts.xlsx');

console.log('\n✅ Created: real-test-contacts.xlsx');
console.log('\n📋 Testing Steps:');
console.log('1. Edit this file and replace phone numbers with valid WhatsApp numbers');
console.log('2. Run this script again to generate updated Excel file');
console.log('3. Import real-test-contacts.xlsx in the main app');
console.log('4. Test file matching with real numbers');
console.log('5. Check if messages actually arrive on the target phones');

console.log('\n🎯 How to verify if messages are really sent:');
console.log('- Check the target WhatsApp accounts');
console.log('- Look for messages with attached files');
console.log('- Verify the file names match the Excel data');

module.exports = realTestContacts;
