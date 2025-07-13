const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const xlsx = require('xlsx');
const fileMatchingService = require('../services/fileMatchingService');
const contactStorage = require('../services/contactStorage');
const router = express.Router();

// Configure multer for documents upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const documentsPath = './documents';
        fs.ensureDirSync(documentsPath);
        cb(null, documentsPath);
    },
    filename: (req, file, cb) => {
        // Keep original filename
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for documents
    }
});

// Get documents folder contents
router.get('/documents', async (req, res) => {
    try {
        const files = await fileMatchingService.scanDocumentsFolder();
        const statistics = await fileMatchingService.getStatistics();
        
        res.json({
            success: true,
            files,
            statistics
        });
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload files to documents folder
router.post('/documents/upload', upload.array('documents', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map(file => ({
            fileName: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path,
            mimetype: file.mimetype
        }));

        res.json({
            success: true,
            message: `${uploadedFiles.length} files uploaded successfully`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete file from documents folder
router.delete('/documents/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const deleted = await fileMatchingService.deleteFromDocuments(filename);

        if (deleted) {
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk delete files from documents folder
router.post('/documents/bulk-delete', async (req, res) => {
    try {
        const { filenames } = req.body;

        if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
            return res.status(400).json({ error: 'Filenames array is required' });
        }

        const results = [];
        let deletedCount = 0;
        let failedCount = 0;

        for (const filename of filenames) {
            try {
                const deleted = await fileMatchingService.deleteFromDocuments(filename);
                if (deleted) {
                    results.push({
                        filename,
                        status: 'deleted',
                        success: true
                    });
                    deletedCount++;
                } else {
                    results.push({
                        filename,
                        status: 'not_found',
                        success: false,
                        error: 'File not found'
                    });
                    failedCount++;
                }
            } catch (error) {
                results.push({
                    filename,
                    status: 'error',
                    success: false,
                    error: error.message
                });
                failedCount++;
            }
        }

        res.json({
            success: true,
            message: `Bulk delete completed: ${deletedCount} deleted, ${failedCount} failed`,
            summary: {
                total: filenames.length,
                deleted: deletedCount,
                failed: failedCount,
                successRate: Math.round((deletedCount / filenames.length) * 100)
            },
            results
        });

    } catch (error) {
        console.error('Error in bulk delete:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear all documents from folder
router.delete('/documents', async (req, res) => {
    try {
        const result = await fileMatchingService.clearAllDocuments();

        res.json({
            success: true,
            message: `All documents cleared: ${result.deleted} files deleted`,
            summary: result
        });
    } catch (error) {
        console.error('Error clearing all documents:', error);
        res.status(500).json({ error: error.message });
    }
});

// Match contacts with files
router.post('/match', async (req, res) => {
    try {
        const { contacts } = req.body;
        
        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        const result = await fileMatchingService.matchContactsWithFiles(contacts);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error matching files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Match stored contacts with files
router.post('/match-stored', async (req, res) => {
    try {
        const contacts = contactStorage.getSelectedContacts();
        
        if (contacts.length === 0) {
            return res.status(400).json({ error: 'No contacts selected' });
        }

        const result = await fileMatchingService.matchContactsWithFiles(contacts);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error matching stored contacts with files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Preview file matching
router.get('/preview', async (req, res) => {
    try {
        const contacts = contactStorage.getSelectedContacts();
        const files = await fileMatchingService.scanDocumentsFolder();
        
        // Create preview without actual matching
        const preview = contacts.map(contact => {
            const fileName = contact.fileName || contact.namaFile || contact.nama_file || contact.file;
            const matchedFile = fileName ? 
                fileMatchingService.findMatchingFile(fileName, files) : null;
            
            return {
                contact: {
                    name: contact.name,
                    number: contact.number,
                    fileName: fileName
                },
                matchedFile: matchedFile ? {
                    fileName: matchedFile.fileName,
                    size: matchedFile.size,
                    type: fileMatchingService.getFileType(matchedFile.extension)
                } : null,
                status: matchedFile ? 'matched' : 'unmatched'
            };
        });

        res.json({
            success: true,
            preview,
            statistics: {
                totalContacts: contacts.length,
                matched: preview.filter(p => p.status === 'matched').length,
                unmatched: preview.filter(p => p.status === 'unmatched').length
            }
        });
    } catch (error) {
        console.error('Error creating preview:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download sample template with file matching
router.get('/template', (req, res) => {
    try {
        const sampleData = fileMatchingService.generateSampleTemplate();
        
        // Create workbook and worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sampleData);
        
        // Add worksheet to workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        
        // Generate buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename=file_matching_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve documents (for preview/download)
router.get('/documents/serve/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../documents', filename);
        
        if (fs.existsSync(filePath)) {
            res.sendFile(path.resolve(filePath));
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Error serving document:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
