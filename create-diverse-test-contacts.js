const xlsx = require('xlsx');

// Diverse test contacts data for search functionality
const testContacts = [
    {
        name: 'ALVIN HOSTIADI SAPUTRA',
        number: '+62 818-0926-2012',
        email: 'alvin@electrician.com',
        company: 'ELECTRICIAN',
        position: 'Senior Technician',
        department: 'Technical',
        city: 'Jakarta',
        skill_level: 'Level 3',
        certification: 'Certified'
    },
    {
        name: 'RAHMAT JAELANI',
        number: '+62 852-1546-7924',
        email: 'rahmat@electrician.com',
        company: 'ELECTRICIAN',
        position: 'Junior Technician',
        department: 'Technical',
        city: 'Bandung',
        skill_level: 'Level 2',
        certification: 'In Progress'
    },
    {
        name: 'CANDRA ADE PRASETYA',
        number: '+62 823-3927-3208',
        email: 'candra@electrician.com',
        company: 'ELECTRICIAN',
        position: 'Team Leader',
        department: 'Operations',
        city: 'Surabaya',
        skill_level: 'Level 4',
        certification: 'Certified'
    },
    {
        name: 'ZINNUR AINI',
        number: '+62 878-5597-4780',
        email: 'zinnur@electrician.com',
        company: 'ELECTRICIAN',
        position: 'Supervisor',
        department: 'Quality Control',
        city: 'Medan',
        skill_level: 'Level 3',
        certification: 'Certified'
    },
    {
        name: 'DENI SUDIARIO',
        number: '+62 823-4895-0158',
        email: 'deni@electrician.com',
        company: 'ELECTRICIAN',
        position: 'Technician',
        department: 'Maintenance',
        city: 'Yogyakarta',
        skill_level: 'Level 2',
        certification: 'Certified'
    },
    {
        name: 'FAHRURROZY',
        number: '+62 853-5934-5910',
        email: 'fahru@electrician.com',
        company: 'ELECTRICIAN Skill 3',
        position: 'Senior Technician',
        department: 'Installation',
        city: 'Semarang',
        skill_level: 'Level 3',
        certification: 'Expert'
    },
    {
        name: 'PANJI FAMILY',
        number: '+62 811-3975-567',
        email: 'panji@electrician.com',
        company: 'ELECTRICIAN Skill 3',
        position: 'Project Manager',
        department: 'Projects',
        city: 'Malang',
        skill_level: 'Level 4',
        certification: 'Expert'
    },
    {
        name: 'AZIZAT TAQWA',
        number: '+62 817-7507-4649',
        email: 'azizat@electrician.com',
        company: 'ELECTRICIAN Skill 3',
        position: 'Quality Inspector',
        department: 'Quality Control',
        city: 'Solo',
        skill_level: 'Level 3',
        certification: 'Certified'
    },
    {
        name: 'BUDI SANTOSO',
        number: '+62 856-1234-5678',
        email: 'budi@plumbing.com',
        company: 'PLUMBING SERVICES',
        position: 'Master Plumber',
        department: 'Services',
        city: 'Jakarta',
        skill_level: 'Expert',
        certification: 'Master Certified'
    },
    {
        name: 'SARI DEWI',
        number: '+62 877-9876-5432',
        email: 'sari@admin.com',
        company: 'ADMIN SUPPORT',
        position: 'Administrative Assistant',
        department: 'Administration',
        city: 'Bandung',
        skill_level: 'Intermediate',
        certification: 'Office Certified'
    },
    {
        name: 'AHMAD RIZKI',
        number: '+62 812-5555-1111',
        email: 'ahmad@tech.com',
        company: 'TECH SOLUTIONS',
        position: 'Software Developer',
        department: 'IT',
        city: 'Jakarta',
        skill_level: 'Senior',
        certification: 'AWS Certified'
    },
    {
        name: 'MAYA SARI',
        number: '+62 813-6666-2222',
        email: 'maya@marketing.com',
        company: 'MARKETING AGENCY',
        position: 'Marketing Manager',
        department: 'Marketing',
        city: 'Surabaya',
        skill_level: 'Expert',
        certification: 'Google Certified'
    }
];

// Create workbook and worksheet
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(testContacts);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');

// Write file
xlsx.writeFile(workbook, 'diverse-test-contacts.xlsx');

console.log('✅ Diverse test contacts file created: diverse-test-contacts.xlsx');
console.log(`📊 Created ${testContacts.length} diverse test contacts for search functionality`);
console.log('📋 Includes various companies, positions, departments, cities, and skill levels');
console.log('🔍 Perfect for testing multi-field search capabilities');
