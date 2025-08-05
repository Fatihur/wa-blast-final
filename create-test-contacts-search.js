const xlsx = require('xlsx');

// Test contacts data matching the screenshot
const testContacts = [
    {
        name: 'ALVIN HOSTIADI SAPUTRA',
        number: '+62 818-0926-2012',
        email: 'alvin@electrician.com',
        company: 'ELECTRICIAN',
        fileName: 'alvin_certificate.pdf'
    },
    {
        name: 'RAHMAT JAELANI',
        number: '+62 852-1546-7924',
        email: 'rahmat@electrician.com',
        company: 'ELECTRICIAN',
        fileName: 'rahmat_report.docx'
    },
    {
        name: 'CANDRA ADE PRASETYA',
        number: '+62 823-3927-3208',
        email: 'candra@electrician.com',
        company: 'ELECTRICIAN',
        fileName: 'candra_invoice.pdf'
    },
    {
        name: 'ZINNUR AINI',
        number: '+62 878-5597-4780',
        email: 'zinnur@electrician.com',
        company: 'ELECTRICIAN',
        fileName: 'zinnur_document.pdf'
    },
    {
        name: 'DENI SUDIARIO',
        number: '+62 823-4895-0158',
        email: 'deni@electrician.com',
        company: 'ELECTRICIAN',
        fileName: 'deni_certificate.pdf'
    },
    {
        name: 'FAHRURROZY',
        number: '+62 853-5934-5910',
        email: 'fahru@electrician.com',
        company: 'ELECTRICIAN Skill 3',
        fileName: 'fahru_report.docx'
    },
    {
        name: 'PANJI FAMILY',
        number: '+62 811-3975-567',
        email: 'panji@electrician.com',
        company: 'ELECTRICIAN Skill 3',
        fileName: 'panji_invoice.pdf'
    },
    {
        name: 'AZIZAT TAQWA',
        number: '+62 817-7507-4649',
        email: 'azizat@electrician.com',
        company: 'ELECTRICIAN Skill 3',
        fileName: 'azizat_document.pdf'
    }
];

// Create workbook and worksheet
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(testContacts);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');

// Write file
xlsx.writeFile(workbook, 'test-contacts-search.xlsx');

console.log('✅ Test contacts file created: test-contacts-search.xlsx');
console.log(`📊 Created ${testContacts.length} test contacts for search functionality`);
