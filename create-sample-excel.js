const xlsx = require('xlsx');

// Sample data with custom headers
const sampleData = [
    {
        name: 'John Doe',
        number: '08123456789',
        email: 'john@example.com',
        company: 'ABC Corp',
        position: 'Manager',
        department: 'Sales',
        city: 'Jakarta',
        birthday: '1990-01-15',
        hobby: 'Reading',
        status: 'VIP'
    },
    {
        name: 'Jane Smith',
        number: '08234567890',
        email: 'jane@example.com',
        company: 'XYZ Ltd',
        position: 'Director',
        department: 'Marketing',
        city: 'Surabaya',
        birthday: '1985-05-20',
        hobby: 'Traveling',
        status: 'Premium'
    },
    {
        name: 'Bob Johnson',
        number: '08345678901',
        email: 'bob@example.com',
        company: 'Tech Solutions',
        position: 'Developer',
        department: 'IT',
        city: 'Bandung',
        birthday: '1992-12-10',
        hobby: 'Gaming',
        status: 'Regular'
    }
];

// Create workbook and worksheet
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(sampleData);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');

// Write file
xlsx.writeFile(workbook, 'sample-contacts-with-custom-headers.xlsx');

console.log('✅ Sample Excel file created: sample-contacts-with-custom-headers.xlsx');
console.log('\nCustom headers included:');
console.log('- position (Job Position)');
console.log('- department (Department)');
console.log('- city (City)');
console.log('- birthday (Birthday)');
console.log('- hobby (Hobby)');
console.log('- status (Customer Status)');
console.log('\nYou can use these as variables in your blast messages:');
console.log('{{position}}, {{department}}, {{city}}, {{birthday}}, {{hobby}}, {{status}}');
console.log('\nExample message:');
console.log('Hello {{name}} from {{company}}!');
console.log('Happy to connect with a {{position}} in {{department}} department.');
console.log('Hope you are doing well in {{city}}!');
console.log('Your status: {{status}}');
