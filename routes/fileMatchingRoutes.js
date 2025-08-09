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
        fileSize: 200 * 1024 * 1024, // 200MB limit per file
        files: 2000 // Maximum 1000 files
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types for documents
        cb(null, true);
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
router.post('/documents/upload', (req, res) => {
    // Use upload middleware with error handling
    upload.array('documents', 2000)(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'File too large. Maximum size is 200MB per file.'
                });
            }

            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    error: 'Too many files. Maximum is 2000 files per upload.'
                });
            }

            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    error: 'Unexpected field name. Use "documents" as field name.'
                });
            }

            return res.status(500).json({
                error: `Upload error: ${err.message}`
            });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            console.log(`Processing ${req.files.length} uploaded files...`);

            const uploadedFiles = req.files.map(file => ({
                fileName: file.filename,
                originalName: file.originalname,
                size: file.size,
                path: file.path,
                mimetype: file.mimetype
            }));

            console.log(`Successfully processed ${uploadedFiles.length} files`);

            // Clear file cache since new files were uploaded
            fileMatchingService.clearFileCache();

            res.json({
                success: true,
                message: `${uploadedFiles.length} files uploaded successfully`,
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Error processing uploaded files:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Delete file from documents folder
router.delete('/documents/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const deleted = await fileMatchingService.deleteFromDocuments(filename);

        if (deleted) {
            // Clear file cache since a file was deleted
            fileMatchingService.clearFileCache();

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

// Test file matching functionality
router.post('/test', async (req, res) => {
    try {
        const { contacts } = req.body;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        console.log('Testing file matching with contacts:', contacts.length);

        // Test file matching
        const result = await fileMatchingService.matchContactsWithFiles(contacts);

        // Add detailed validation info
        const detailedResults = {
            ...result,
            documentsFolder: fileMatchingService.documentsFolder,
            availableFiles: await fileMatchingService.scanDocumentsFolder(),
            testResults: result.matched.map(contact => ({
                name: contact.name,
                fileName: contact.matchedFile.fileName,
                filePath: contact.matchedFile.fullPath,
                fileExists: require('fs-extra').pathExistsSync(contact.matchedFile.fullPath),
                fileSize: contact.matchedFile.size,
                fileType: contact.matchedFile.type
            }))
        };

        res.json({
            success: true,
            ...detailedResults
        });
    } catch (error) {
        console.error('Error testing file matching:', error);
        res.status(500).json({ error: error.message });
    }
});

// Validate file matching before sending blast
router.post('/validate', async (req, res) => {
    try {
        const { contacts } = req.body;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        if (contacts.length === 0) {
            return res.status(400).json({ error: 'No contacts provided' });
        }

        // Perform file matching validation
        const result = await fileMatchingService.matchContactsWithFiles(contacts);

        // Add detailed validation information
        const validation = {
            success: true,
            matched: result.matched,
            unmatched: result.unmatched,
            statistics: {
                totalContacts: contacts.length,
                matchedCount: result.matched.length,
                unmatchedCount: result.unmatched.length,
                matchingRate: Math.round((result.matched.length / contacts.length) * 100),
                totalFiles: result.statistics.totalFiles,
                unusedFiles: result.statistics.unusedFilesCount
            },
            canProceed: result.matched.length > 0,
            warnings: []
        };

        // Add warnings based on validation results
        if (result.unmatched.length > 0) {
            validation.warnings.push(`${result.unmatched.length} contacts will be skipped due to missing files`);
        }

        if (result.matched.length === 0) {
            validation.warnings.push('No contacts have matching files - blast cannot proceed');
        }

        res.json(validation);

    } catch (error) {
        console.error('Error validating file matching:', error);
        res.status(500).json({ error: error.message });
    }
});

// Preview file matching
router.get('/preview', async (req, res) => {
    try {
        const contacts = contactStorage.getSelectedContacts();
        const files = await fileMatchingService.scanDocumentsFolder();
        
        // Get stored manual assignments from session
        const manualAssignments = req.session?.manualAssignments || {};

        // Create preview using exact filename matching and manual assignments
        const preview = contacts.map(contact => {
            const contactName = contact.name || contact.nama || 'Unnamed Contact';
            const specifiedFileName = contact.fileName || contact.namaFile || contact.nama_file || contact.file;

            let matchedFile = null;
            let matchingMethod = '';

            // Check for manual assignment first
            if (manualAssignments[contactName]) {
                const assignment = manualAssignments[contactName];
                const assignedFile = files.find(f => f.fileName === assignment.fileName);
                
                if (assignedFile) {
                    matchedFile = assignedFile;
                    matchingMethod = 'manual_assignment';
                }
            }

            // Look for exact filename match if no manual assignment
            if (!matchedFile && specifiedFileName) {
                matchedFile = fileMatchingService.findExactFile(specifiedFileName, files);
                if (matchedFile) {
                    matchingMethod = 'by_filename';
                }
            }

            const searchTerm = specifiedFileName || contactName || 'unknown';
            let reason = '';
            
            if (!matchedFile) {
                if (specifiedFileName) {
                    reason = `File "${specifiedFileName}" not found. Use manual assignment.`;
                } else {
                    reason = 'No file specified. Please use manual assignment.';
                }
            }

            return {
                contact: {
                    name: contactName,
                    number: contact.number,
                    fileName: specifiedFileName
                },
                matchedFile: matchedFile ? {
                    fileName: matchedFile.fileName,
                    fullPath: matchedFile.fullPath,
                    extension: matchedFile.extension,
                    size: matchedFile.size,
                    type: fileMatchingService.getFileType(matchedFile.extension),
                    matchingMethod: matchingMethod,
                    requiresValidation: false, // No validation needed for exact matches or manual assignments
                    validated: true // Both exact matches and manual assignments are considered validated
                } : null,
                status: matchedFile ? 'matched' : 'unmatched',
                reason: reason,
                searchTerm: searchTerm,
                validationRequired: false // No validation needed for exact matches or manual assignments
            };
        });

        const matchedItems = preview.filter(p => p.status === 'matched');
        const byFilenameItems = matchedItems.filter(p => p.matchedFile?.matchingMethod === 'by_filename');
        const manualMatchedItems = matchedItems.filter(p => p.matchedFile?.matchingMethod === 'manual_assignment');

        res.json({
            success: true,
            preview,
            statistics: {
                totalContacts: contacts.length,
                matched: matchedItems.length,
                unmatched: preview.filter(p => p.status === 'unmatched').length,
                byFilename: byFilenameItems.length,
                manualMatched: manualMatchedItems.length,
                requiresValidation: false // No validation needed for exact matches or manual assignments
            }
        });
    } catch (error) {
        console.error('Error creating preview:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint kept for API compatibility but returns empty queue
router.get('/validation-queue', async (req, res) => {
    try {
        // Return empty queue since we only support exact matches and manual assignments
        return res.json({
            validationQueue: [],
            totalAutoMatches: 0,
            message: 'Validation not required. System uses exact filename matches and manual assignments only.'
        });
    } catch (error) {
        console.error('Error getting validation queue:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save validation results
router.post('/save-validation', async (req, res) => {
    try {
        const { validationResults } = req.body;

        if (!validationResults) {
            return res.status(400).json({ error: 'Validation results are required' });
        }

        console.log('💾 Saving validation results:', {
            confirmed: validationResults.confirmed?.length || 0,
            changed: validationResults.changed?.length || 0,
            skipped: validationResults.skipped?.length || 0
        });

        // Store validation results in session or temporary storage
        req.session = req.session || {};
        req.session.validationResults = validationResults;

        // Initialize manual assignments if not exists
        req.session.manualAssignments = req.session.manualAssignments || {};

        // Update manual assignments for any changed files during validation
        const changedContacts = validationResults.changed || [];
        for (const item of changedContacts) {
            const contactName = item.contact.name || item.contact.nama;
            if (contactName && item.matchedFile) {
                console.log(`📝 Updating manual assignment from validation: ${contactName} -> ${item.matchedFile.fileName}`);

                req.session.manualAssignments[contactName] = {
                    fileName: item.matchedFile.fileName,
                    fullPath: item.matchedFile.fullPath,
                    extension: item.matchedFile.extension,
                    size: item.matchedFile.size,
                    lastModified: new Date().toISOString(),
                    type: item.matchedFile.type,
                    matchingMethod: 'validation_change',
                    assignmentType: 'validation_override',
                    assignedAt: new Date().toISOString()
                };
            }
        }

        // Also store validated contacts for use in blast
        req.session.validatedContacts = [
            ...(validationResults.confirmed || []),
            ...(validationResults.changed || [])
        ].map(item => ({
            ...item.contact,
            matchedFile: item.matchedFile
        }));

        console.log('✅ Validation results saved with manual assignment updates');
        console.log('📋 Updated manual assignments:', Object.keys(req.session.manualAssignments));

        res.json({
            success: true,
            message: 'Validation results saved successfully',
            summary: {
                confirmed: validationResults.confirmed?.length || 0,
                changed: validationResults.changed?.length || 0,
                skipped: validationResults.skipped?.length || 0
            }
        });
    } catch (error) {
        console.error('Error saving validation results:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update contact sending preferences for automatic matches
router.post('/update-sending-preferences', async (req, res) => {
    try {
        const { contactPreferences } = req.body;

        if (!contactPreferences || !Array.isArray(contactPreferences)) {
            return res.status(400).json({ error: 'Contact preferences array is required' });
        }

        // Store sending preferences in session (merge with existing)
        req.session = req.session || {};
        req.session.sendingPreferences = req.session.sendingPreferences || {};

        // Convert array to object and merge with existing preferences
        contactPreferences.forEach(pref => {
            req.session.sendingPreferences[pref.contactName] = {
                enabled: pref.enabled,
                updatedAt: new Date().toISOString()
            };
        });

        console.log('Updated sending preferences:', req.session.sendingPreferences);

        res.json({
            success: true,
            message: 'Sending preferences updated successfully',
            updatedCount: contactPreferences.length
        });
    } catch (error) {
        console.error('Error updating sending preferences:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manually assign file to contact
router.post('/manual-assignment', async (req, res) => {
    try {
        const { contactId, contactName, fileName, assignmentType } = req.body;

        console.log('📝 Manual assignment request:', { contactId, contactName, fileName, assignmentType });
        console.log('🔍 Session ID:', req.sessionID);
        console.log('📋 Current manual assignments before update:', req.session?.manualAssignments || {});

        if (!contactName || !fileName) {
            return res.status(400).json({ error: 'Contact name and file name are required' });
        }

        // Force refresh file cache to get latest files
        fileMatchingService.clearFileCache();
        const files = await fileMatchingService.scanDocumentsFolder();
        const selectedFile = files.find(file => file.fileName === fileName);

        if (!selectedFile) {
            console.log('❌ File not found:', fileName);
            console.log('📁 Available files:', files.map(f => f.fileName));
            return res.status(404).json({ error: `Selected file "${fileName}" not found. Please refresh and try again.` });
        }

        // Store manual assignment in session
        req.session = req.session || {};
        req.session.manualAssignments = req.session.manualAssignments || {};

        // Create assignment with fresh file data including absolute paths
        const assignmentData = {
            fileName: selectedFile.fileName,
            fullPath: selectedFile.fullPath,
            absolutePath: path.resolve(selectedFile.fullPath),
            extension: selectedFile.extension,
            size: selectedFile.size,
            lastModified: selectedFile.lastModified,
            type: fileMatchingService.getFileType(selectedFile.extension),
            matchingMethod: 'manual_assignment',
            assignmentType: assignmentType || 'override',
            assignedAt: new Date().toISOString(),
            validatedPath: path.resolve(path.join(fileMatchingService.documentsFolder, selectedFile.fileName))
        };

        req.session.manualAssignments[contactName] = assignmentData;

        console.log('✅ Manual assignment stored:', assignmentData);
        console.log('📋 All manual assignments:', Object.keys(req.session.manualAssignments));

        // Force save session to ensure persistence
        req.session.save((err) => {
            if (err) {
                console.error('❌ Error saving session:', err);
            } else {
                console.log('✅ Session saved successfully');
            }
        });

        res.json({
            success: true,
            message: 'File manually assigned successfully',
            assignment: {
                contactName,
                fileName: selectedFile.fileName,
                matchingMethod: 'manual_assignment'
            },
            // Include the full assignment data for immediate frontend update
            assignmentData: assignmentData
        });
    } catch (error) {
        console.error('Error in manual assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove manual assignment
router.delete('/manual-assignment/:contactName', async (req, res) => {
    try {
        const { contactName } = req.params;

        console.log('🗑️ Remove manual assignment request for:', contactName);
        console.log('🔍 Session ID:', req.sessionID);

        if (!contactName) {
            return res.status(400).json({ error: 'Contact name is required' });
        }

        // Remove manual assignment from session
        req.session = req.session || {};
        req.session.manualAssignments = req.session.manualAssignments || {};

        const removedAssignment = req.session.manualAssignments[contactName];

        if (removedAssignment) {
            delete req.session.manualAssignments[contactName];
            console.log('✅ Manual assignment removed for:', contactName);
            console.log('📁 Removed file:', removedAssignment.fileName);
            console.log('📋 Remaining assignments:', Object.keys(req.session.manualAssignments));
        } else {
            console.log('⚠️ No manual assignment found for:', contactName);
        }

        // Force save session to ensure persistence
        req.session.save((err) => {
            if (err) {
                console.error('❌ Error saving session:', err);
            } else {
                console.log('✅ Session saved successfully after removal');
            }
        });

        // Clear file cache to ensure fresh data on next request
        fileMatchingService.clearFileCache();

        res.json({
            success: true,
            message: 'Manual assignment removed successfully',
            contactName: contactName,
            removedFile: removedAssignment?.fileName || null
        });
    } catch (error) {
        console.error('Error removing manual assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search files for manual assignment
router.get('/search-files', async (req, res) => {
    try {
        const { query, limit = 50 } = req.query;

        const files = await fileMatchingService.scanDocumentsFolder();

        let filteredFiles = files;

        if (query && query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            filteredFiles = files.filter(file =>
                file.fileName.toLowerCase().includes(searchTerm)
            );
        }

        // Limit results for performance
        const limitedFiles = filteredFiles.slice(0, parseInt(limit));

        res.json({
            success: true,
            files: limitedFiles.map(file => ({
                fileName: file.fileName,
                fullPath: file.fullPath,
                extension: file.extension,
                size: file.size,
                type: fileMatchingService.getFileType(file.extension),
                lastModified: file.lastModified
            })),
            totalFound: filteredFiles.length,
            totalReturned: limitedFiles.length,
            hasMore: filteredFiles.length > parseInt(limit)
        });
    } catch (error) {
        console.error('Error searching files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get enhanced preview with manual assignments and preferences
router.get('/enhanced-preview', async (req, res) => {
    try {
        const contacts = contactStorage.getSelectedContacts();

        // Force refresh file cache to ensure we have the latest files
        fileMatchingService.clearFileCache();
        const files = await fileMatchingService.scanDocumentsFolder();

        // Get stored preferences and manual assignments
        const sendingPreferences = req.session?.sendingPreferences || {};
        const manualAssignments = req.session?.manualAssignments || {};

        console.log('🔍 Enhanced preview - Session ID:', req.sessionID);
        console.log('📋 Enhanced preview - manual assignments:', manualAssignments);
        console.log('⚙️ Enhanced preview - sending preferences:', sendingPreferences);
        console.log('👥 Enhanced preview - selected contacts:', contacts.length);
        console.log('📁 Enhanced preview - available files:', files.map(f => f.fileName));

        // Validate and clean up manual assignments - remove assignments for files that no longer exist
        const validatedManualAssignments = {};
        for (const [contactName, assignment] of Object.entries(manualAssignments)) {
            const fileExists = files.find(f => f.fileName === assignment.fileName);
            if (fileExists) {
                // Update assignment with current file info to ensure data is fresh
                validatedManualAssignments[contactName] = {
                    ...assignment,
                    fullPath: fileExists.fullPath,
                    size: fileExists.size,
                    lastModified: fileExists.lastModified
                };
                console.log(`✅ Manual assignment validated for ${contactName}: ${assignment.fileName}`);
            } else {
                console.log(`⚠️ Manual assignment removed for ${contactName}: file ${assignment.fileName} no longer exists`);
            }
        }

        // Update session with validated assignments
        req.session.manualAssignments = validatedManualAssignments;

        // Create enhanced preview
        const enhancedPreview = contacts.map(contact => {
            const specifiedFileName = contact.fileName || contact.namaFile || contact.nama_file || contact.file;
            const contactName = contact.name || contact.nama || contact.contactName || contact.contact_name;

            let matchedFile = null;
            let matchingMethod = '';
            let sendingEnabled = true; // Default to enabled

            // Check for manual assignment first (using validated assignments)
            console.log(`🔍 Checking manual assignment for contact: "${contactName}"`);
            console.log(`📋 Available manual assignments:`, Object.keys(validatedManualAssignments));

            if (validatedManualAssignments[contactName]) {
                console.log(`✅ Found manual assignment for contact: ${contactName}`);
                const assignment = validatedManualAssignments[contactName];
                console.log(`📁 Manual assignment details:`, assignment);

                matchedFile = {
                    fileName: assignment.fileName,
                    fullPath: assignment.absolutePath || assignment.validatedPath || assignment.fullPath,
                    absolutePath: assignment.absolutePath || assignment.validatedPath || path.resolve(assignment.fullPath),
                    extension: assignment.extension,
                    size: assignment.size,
                    type: assignment.type,
                    lastModified: assignment.lastModified
                };
                matchingMethod = 'manual_assignment';
                sendingEnabled = true; // Manual assignments are always enabled

                console.log(`✅ Manual assignment applied: ${assignment.fileName}`);
            } else {
                console.log(`❌ No manual assignment found for contact: "${contactName}"`);
            }

            // Try exact filename match - only if no manual assignment
            if (!matchedFile && specifiedFileName) {
                matchedFile = fileMatchingService.findExactFile(specifiedFileName, files);
                if (matchedFile) {
                    matchingMethod = 'by_filename';
                    sendingEnabled = true; // Exact matches are always enabled
                }
            }
            
            // We no longer use contact name matching - only exact filename matches and manual assignments

            const searchTerm = specifiedFileName || contactName || 'unknown';
            let reason = '';

            if (!matchedFile) {
                if (specifiedFileName) {
                    reason = `File "${specifiedFileName}" not found`;
                } else if (contactName) {
                    reason = `No file found matching contact name "${contactName}"`;
                } else {
                    reason = 'No file name specified and no contact name available';
                }
                sendingEnabled = false;
            }

            return {
                contact: {
                    name: contactName || 'Unnamed Contact',
                    number: contact.number,
                    fileName: specifiedFileName,
                    originalData: contact
                },
                matchedFile: matchedFile ? {
                    fileName: matchedFile.fileName,
                    fullPath: matchedFile.fullPath,
                    extension: matchedFile.extension,
                    size: matchedFile.size,
                    type: fileMatchingService.getFileType(matchedFile.extension),
                    matchingMethod: matchingMethod,
                    isManualAssignment: matchingMethod === 'manual_assignment',
                    assignedAt: matchedFile.assignedAt || null
                } : null,
                status: matchedFile ? 'matched' : 'unmatched',
                reason: reason,
                searchTerm: searchTerm,
                sendingEnabled: sendingEnabled,
                canToggleSending: matchingMethod === 'contact_name', // Only automatic matches can be toggled
                requiresValidation: matchingMethod === 'contact_name' && sendingEnabled
            };
        });

        const matchedItems = enhancedPreview.filter(p => p.status === 'matched');
        const enabledItems = matchedItems.filter(p => p.sendingEnabled);
        const autoMatchedItems = matchedItems.filter(p => p.matchedFile?.matchingMethod === 'contact_name');
        const manualAssignedItems = matchedItems.filter(p => p.matchedFile?.matchingMethod === 'manual_assignment');
        const specifiedItems = matchedItems.filter(p => p.matchedFile?.matchingMethod === 'specified_filename');

        res.json({
            success: true,
            preview: enhancedPreview,
            statistics: {
                totalContacts: contacts.length,
                matched: matchedItems.length,
                unmatched: enhancedPreview.filter(p => p.status === 'unmatched').length,
                enabled: enabledItems.length,
                disabled: matchedItems.length - enabledItems.length,
                autoMatched: autoMatchedItems.length,
                manualAssigned: manualAssignedItems.length,
                specified: specifiedItems.length,
                requiresValidation: autoMatchedItems.filter(p => p.sendingEnabled).length > 0
            }
        });
    } catch (error) {
        console.error('Error creating enhanced preview:', error);
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

// Test name matching functionality
router.get('/test-name-matching', (req, res) => {
    try {
        const testResults = fileMatchingService.testNameMatching();
        res.json({
            success: true,
            message: 'Name matching test completed',
            ...testResults
        });
    } catch (error) {
        console.error('Error testing name matching:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
