const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs-extra');
const path = require('path');
const phoneUtils = require('../utils/phoneUtils');
const contactStorage = require('../services/contactStorage');
const router = express.Router();

// Configure multer for Excel file uploads
const upload = multer({
    dest: './uploads/temp',
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        
        if (allowedTypes.includes(file.mimetype) || 
            file.originalname.match(/\.(xlsx|xls|csv)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed'), false);
        }
    }
});

// Import contacts from Excel/CSV
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        let contacts = [];

        try {
            // Read the Excel/CSV file
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const data = xlsx.utils.sheet_to_json(worksheet);

            // Get headers from the worksheet
            const headers = Object.keys(data[0] || {});

            // Process and validate contacts
            contacts = data.map((row, index) => {
                const rawNumber = row.number || row.Number || row.NOMOR || row.phone || row.Phone || row.TELEPON || '';
                const contact = {
                    id: index + 1,
                    name: row.name || row.Name || row.NAMA || '',
                    number: phoneUtils.formatPhoneNumber(rawNumber),
                    originalNumber: rawNumber,
                    email: row.email || row.Email || row.EMAIL || '',
                    company: row.company || row.Company || row.PERUSAHAAN || '',
                    address: row.address || row.Address || row.ALAMAT || '',
                    notes: row.notes || row.Notes || row.CATATAN || ''
                };

                // Add any additional custom fields
                Object.keys(row).forEach(key => {
                    const lowerKey = key.toLowerCase();
                    if (!['name', 'number', 'phone', 'email', 'company', 'address', 'notes'].includes(lowerKey)) {
                        contact[key] = row[key];
                    }
                });

                return contact;
            }).filter(contact => contact.number); // Only include contacts with phone numbers

            // Validate phone numbers
            const validContacts = [];
            const invalidContacts = [];

            contacts.forEach(contact => {
                if (phoneUtils.isValidIndonesianNumber(contact.number)) {
                    validContacts.push({
                        ...contact,
                        displayNumber: phoneUtils.getDisplayFormat(contact.number)
                    });
                } else {
                    const detection = phoneUtils.detectNumberFormat(contact.originalNumber || contact.number);
                    invalidContacts.push({
                        ...contact,
                        error: 'Invalid phone number format',
                        detection: detection,
                        suggestions: detection.suggestions
                    });
                }
            });

            // Save to storage
            const storageResult = await contactStorage.addContacts(validContacts, headers);

            res.json({
                success: true,
                summary: {
                    total: contacts.length,
                    valid: validContacts.length,
                    invalid: invalidContacts.length,
                    added: storageResult.added,
                    duplicates: storageResult.duplicates,
                    totalStored: storageResult.total
                },
                contacts: validContacts,
                headers: headers,
                invalidContacts: invalidContacts.length > 0 ? invalidContacts : undefined
            });

        } catch (error) {
            console.error('Error processing file:', error);
            res.status(400).json({ error: 'Error processing file. Please check the file format.' });
        } finally {
            // Clean up temporary file
            await fs.remove(filePath);
        }

    } catch (error) {
        console.error('Error importing contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Validate contacts
router.post('/validate', (req, res) => {
    try {
        const { contacts } = req.body;
        
        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        const validContacts = [];
        const invalidContacts = [];

        contacts.forEach(contact => {
            const formattedNumber = phoneUtils.formatPhoneNumber(contact.number);

            if (phoneUtils.isValidIndonesianNumber(formattedNumber)) {
                validContacts.push({
                    ...contact,
                    number: formattedNumber,
                    displayNumber: phoneUtils.getDisplayFormat(formattedNumber)
                });
            } else {
                const detection = phoneUtils.detectNumberFormat(contact.number);
                invalidContacts.push({
                    ...contact,
                    error: 'Invalid phone number format',
                    detection: detection,
                    suggestions: detection.suggestions
                });
            }
        });

        res.json({
            success: true,
            summary: {
                total: contacts.length,
                valid: validContacts.length,
                invalid: invalidContacts.length
            },
            validContacts,
            invalidContacts: invalidContacts.length > 0 ? invalidContacts : undefined
        });

    } catch (error) {
        console.error('Error validating contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get sample Excel template
router.get('/template', (req, res) => {
    try {
        // Create sample data
        const sampleData = [
            {
                name: 'John Doe',
                number: '628123456789',
                email: 'john@example.com',
                company: 'ABC Company',
                address: 'Jakarta, Indonesia',
                notes: 'VIP Customer'
            },
            {
                name: 'Jane Smith',
                number: '628987654321',
                email: 'jane@example.com',
                company: 'XYZ Corp',
                address: 'Surabaya, Indonesia',
                notes: 'Regular Customer'
            }
        ];

        // Create workbook and worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sampleData);
        
        // Add worksheet to workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        
        // Generate buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add phone number formatting endpoint
router.post('/format-number', (req, res) => {
    try {
        const { number } = req.body;

        if (!number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const formatted = phoneUtils.formatPhoneNumber(number);
        const isValid = phoneUtils.isValidIndonesianNumber(formatted);
        const detection = phoneUtils.detectNumberFormat(number);

        res.json({
            success: true,
            original: number,
            formatted: formatted,
            display: phoneUtils.getDisplayFormat(formatted),
            isValid: isValid,
            detection: detection
        });
    } catch (error) {
        console.error('Error formatting number:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get stored contacts
router.get('/', async (req, res) => {
    try {
        const { search, selected } = req.query;
        const filters = {};

        if (search) filters.search = search;
        if (selected !== undefined) filters.selected = selected === 'true';

        const contacts = contactStorage.getContacts(filters);
        const headers = contactStorage.getHeaders();
        const statistics = contactStorage.getStatistics();

        res.json({
            success: true,
            contacts,
            headers,
            statistics
        });
    } catch (error) {
        console.error('Error getting contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update contact
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        const updatedContact = await contactStorage.updateContact(id, updates);

        if (updatedContact) {
            res.json({
                success: true,
                contact: updatedContact
            });
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete contact
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const deletedContact = await contactStorage.deleteContact(id);

        if (deletedContact) {
            res.json({
                success: true,
                message: 'Contact deleted successfully'
            });
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update contact selection
router.patch('/:id/select', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { selected } = req.body;

        const updatedContact = await contactStorage.updateContactSelection(id, selected);

        if (updatedContact) {
            res.json({
                success: true,
                contact: updatedContact
            });
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error updating contact selection:', error);
        res.status(500).json({ error: error.message });
    }
});

// Select/deselect all contacts
router.patch('/select-all', async (req, res) => {
    try {
        const { selected } = req.body;

        const count = await contactStorage.selectAllContacts(selected);

        res.json({
            success: true,
            message: `${selected ? 'Selected' : 'Deselected'} ${count} contacts`,
            count
        });
    } catch (error) {
        console.error('Error updating all contact selection:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear all contacts
router.delete('/', async (req, res) => {
    try {
        await contactStorage.clearContacts();

        res.json({
            success: true,
            message: 'All contacts cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export contacts
router.get('/export/:format', async (req, res) => {
    try {
        const format = req.params.format;
        const data = await contactStorage.exportContacts(format);

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=contacts.json');
        } else if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
        }

        res.send(data);
    } catch (error) {
        console.error('Error exporting contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available headers/variables
router.get('/headers', (req, res) => {
    try {
        const headers = contactStorage.getHeaders();
        const standardHeaders = ['name', 'number', 'email', 'company', 'address', 'notes'];
        const customHeaders = headers.filter(h => !standardHeaders.includes(h.toLowerCase()));

        res.json({
            success: true,
            headers: {
                standard: standardHeaders,
                custom: customHeaders,
                all: [...standardHeaders, ...customHeaders]
            }
        });
    } catch (error) {
        console.error('Error getting headers:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
