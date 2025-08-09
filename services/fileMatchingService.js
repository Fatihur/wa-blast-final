const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class FileMatchingService {
    constructor() {
        this.documentsFolder = path.resolve('./documents');
        this.supportedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        this.fileCache = null;
        this.cacheTimestamp = null;
        this.cacheTimeout = 30000; // 30 seconds cache
        this.init();
    }

    async init() {
        try {
            // Ensure documents directory exists
            await fs.ensureDir(this.documentsFolder);
            await logger.info('File matching service initialized');
        } catch (error) {
            await logger.error('Error initializing file matching service', error);
        }
    }

    /**
     * Scan documents folder and return available files
     */
    async scanDocumentsFolder(forceRefresh = false) {
        try {
            // Check if cache is valid (unless force refresh is requested)
            const now = Date.now();
            if (!forceRefresh && this.fileCache && this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheTimeout) {
                console.log('📁 Using cached file list');
                return this.fileCache;
            }

            console.log('📁 Scanning documents folder (force refresh:', forceRefresh, ')');
            const files = await fs.readdir(this.documentsFolder);
            const fileList = [];

            for (const file of files) {
                const filePath = path.join(this.documentsFolder, file);

                try {
                    const stats = await fs.stat(filePath);

                    if (stats.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        const nameWithoutExt = path.basename(file, ext);

                        fileList.push({
                            fileName: file,
                            nameWithoutExt: nameWithoutExt,
                            extension: ext,
                            fullPath: filePath,
                            size: stats.size,
                            lastModified: stats.mtime,
                            isSupported: this.supportedExtensions.includes(ext)
                        });
                    }
                } catch (statError) {
                    console.warn(`⚠️ Could not stat file ${file}:`, statError.message);
                    // Skip files that can't be accessed
                    continue;
                }
            }

            // Update cache
            this.fileCache = fileList;
            this.cacheTimestamp = now;

            await logger.info(`Scanned documents folder: ${fileList.length} files found`);
            console.log('📁 Files found:', fileList.map(f => f.fileName));
            return fileList;
        } catch (error) {
            await logger.error('Error scanning documents folder', error);
            console.error('❌ Error scanning documents folder:', error);
            return [];
        }
    }

    /**
     * Clear file cache (call when files are added/removed)
     */
    clearFileCache() {
        this.fileCache = null;
        this.cacheTimestamp = null;
        console.log('🗑️ File cache cleared');
    }

    /**
     * Validate if a file exists in the documents folder
     */
    async validateFileExists(fileName) {
        try {
            const filePath = path.join(this.documentsFolder, fileName);
            const stats = await fs.stat(filePath);
            return stats.isFile();
        } catch (error) {
            console.log(`❌ File validation failed for ${fileName}:`, error.message);
            return false;
        }
    }

    /**
     * Get fresh file information for a specific file
     */
    async getFileInfo(fileName) {
        try {
            const filePath = path.join(this.documentsFolder, fileName);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                const ext = path.extname(fileName).toLowerCase();
                const nameWithoutExt = path.basename(fileName, ext);

                return {
                    fileName: fileName,
                    nameWithoutExt: nameWithoutExt,
                    extension: ext,
                    fullPath: filePath,
                    size: stats.size,
                    lastModified: stats.mtime,
                    isSupported: this.supportedExtensions.includes(ext)
                };
            }
            return null;
        } catch (error) {
            console.log(`❌ Could not get file info for ${fileName}:`, error.message);
            return null;
        }
    }

    /**
     * Match contacts with their corresponding files based on contact names
     */
    async matchContactsWithFiles(contacts) {
        try {
            const availableFiles = await this.scanDocumentsFolder();
            const matchedContacts = [];
            const unmatchedContacts = [];
            const unusedFiles = [...availableFiles];

            for (const contact of contacts) {
                // First try to use specified file name if provided (backward compatibility)
                const specifiedFileName = contact.fileName || contact.namaFile || contact.nama_file || contact.file;

                let matchedFile = null;
                let matchingMethod = '';

                // If file name is specified, try that first
                if (specifiedFileName) {
                    matchedFile = this.findMatchingFile(specifiedFileName, availableFiles);
                    if (matchedFile) {
                        matchingMethod = 'specified_filename';
                    }
                }

                // If no match found with specified filename or no filename specified, try contact name
                if (!matchedFile) {
                    const contactName = contact.name || contact.nama || contact.contactName || contact.contact_name;

                    if (contactName) {
                        matchedFile = this.findMatchingFileByName(contactName, availableFiles);
                        if (matchedFile) {
                            matchingMethod = 'contact_name';
                        }
                    }
                }

                if (matchedFile) {
                    // Validate the matched file
                    const validation = await this.validateFile(matchedFile.fullPath);

                    if (validation.valid) {
                        matchedContacts.push({
                            ...contact,
                            matchedFile: {
                                fileName: matchedFile.fileName,
                                fullPath: matchedFile.fullPath,
                                extension: matchedFile.extension,
                                size: matchedFile.size,
                                type: this.getFileType(matchedFile.extension),
                                validated: true,
                                matchingMethod: matchingMethod
                            }
                        });

                        // Remove from unused files
                        const index = unusedFiles.findIndex(f => f.fileName === matchedFile.fileName);
                        if (index > -1) {
                            unusedFiles.splice(index, 1);
                        }
                    } else {
                        const searchTerm = specifiedFileName || contact.name || contact.nama || 'unknown';
                        unmatchedContacts.push({
                            ...contact,
                            reason: `File "${matchedFile.fileName}" validation failed: ${validation.error}`,
                            searchTerm: searchTerm
                        });
                    }
                } else {
                    const searchTerm = specifiedFileName || contact.name || contact.nama || 'unknown';
                    const contactName = contact.name || contact.nama || contact.contactName || contact.contact_name;

                    let reason = '';
                    if (specifiedFileName) {
                        reason = `File "${specifiedFileName}" not found in documents folder`;
                    } else if (contactName) {
                        reason = `No file found matching contact name "${contactName}"`;
                    } else {
                        reason = 'No file name specified and no contact name available for matching';
                    }

                    unmatchedContacts.push({
                        ...contact,
                        reason: reason,
                        searchTerm: searchTerm
                    });
                }
            }

            const result = {
                matched: matchedContacts,
                unmatched: unmatchedContacts,
                unusedFiles: unusedFiles,
                statistics: {
                    totalContacts: contacts.length,
                    matchedCount: matchedContacts.length,
                    unmatchedCount: unmatchedContacts.length,
                    totalFiles: availableFiles.length,
                    unusedFilesCount: unusedFiles.length
                }
            };

            await logger.info('File matching completed', result.statistics);
            return result;
        } catch (error) {
            await logger.error('Error matching contacts with files', error);
            throw error;
        }
    }

    /**
     * Find matching file for given filename (legacy method for backward compatibility)
     */
    findMatchingFile(fileName, availableFiles) {
        // Remove extension from search term if present
        const searchName = path.basename(fileName, path.extname(fileName)).toLowerCase();

        // Try exact match first (with and without extension)
        let match = availableFiles.find(file =>
            file.fileName.toLowerCase() === fileName.toLowerCase() ||
            file.nameWithoutExt.toLowerCase() === searchName
        );

        if (match) return match;

        // Try partial match
        match = availableFiles.find(file =>
            file.nameWithoutExt.toLowerCase().includes(searchName) ||
            searchName.includes(file.nameWithoutExt.toLowerCase())
        );

        return match;
    }

    /**
     * Find matching file based on contact name with intelligent matching
     */
    findMatchingFileByName(contactName, availableFiles) {
        if (!contactName || typeof contactName !== 'string') {
            return null;
        }

        const normalizedContactName = this.normalizeNameForMatching(contactName);

        // Generate possible name variations
        const nameVariations = this.generateNameVariations(normalizedContactName);

        // Try exact matches first
        for (const variation of nameVariations) {
            const match = availableFiles.find(file => {
                const normalizedFileName = this.normalizeNameForMatching(file.nameWithoutExt);
                return normalizedFileName === variation;
            });
            if (match) return match;
        }

        // Try partial matches (file name contains contact name or vice versa)
        for (const variation of nameVariations) {
            const match = availableFiles.find(file => {
                const normalizedFileName = this.normalizeNameForMatching(file.nameWithoutExt);
                return normalizedFileName.includes(variation) || variation.includes(normalizedFileName);
            });
            if (match) return match;
        }

        // Try fuzzy matching for common name patterns
        const match = availableFiles.find(file => {
            const normalizedFileName = this.normalizeNameForMatching(file.nameWithoutExt);
            return this.isFuzzyNameMatch(normalizedContactName, normalizedFileName);
        });

        return match;
    }

    /**
     * Normalize name for matching (lowercase, remove special chars, standardize separators)
     */
    normalizeNameForMatching(name) {
        if (!name || typeof name !== 'string') return '';

        return name
            .toLowerCase()
            .trim()
            // Replace various separators with spaces
            .replace(/[_\-\.]+/g, ' ')
            // Remove extra spaces
            .replace(/\s+/g, ' ')
            // Remove special characters except spaces
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    }

    /**
     * Generate name variations for matching
     */
    generateNameVariations(normalizedName) {
        const variations = new Set();

        // Original normalized name
        variations.add(normalizedName);

        // With underscores instead of spaces
        variations.add(normalizedName.replace(/\s+/g, '_'));

        // With dashes instead of spaces
        variations.add(normalizedName.replace(/\s+/g, '-'));

        // With dots instead of spaces
        variations.add(normalizedName.replace(/\s+/g, '.'));

        // Without spaces (concatenated)
        variations.add(normalizedName.replace(/\s+/g, ''));

        // First name only (if multiple words)
        const words = normalizedName.split(/\s+/);
        if (words.length > 1) {
            variations.add(words[0]);

            // Last name only
            variations.add(words[words.length - 1]);

            // First + Last (skip middle names)
            if (words.length > 2) {
                variations.add(`${words[0]} ${words[words.length - 1]}`);
                variations.add(`${words[0]}_${words[words.length - 1]}`);
                variations.add(`${words[0]}-${words[words.length - 1]}`);
            }
        }

        return Array.from(variations).filter(v => v.length > 0);
    }

    /**
     * Check if two normalized names are a fuzzy match
     */
    isFuzzyNameMatch(name1, name2) {
        if (!name1 || !name2) return false;

        const words1 = name1.split(/\s+/).filter(w => w.length > 0);
        const words2 = name2.split(/\s+/).filter(w => w.length > 0);

        // If either has only one word, check if it's contained in the other
        if (words1.length === 1 || words2.length === 1) {
            return words1.some(w1 => words2.some(w2 => w1.includes(w2) || w2.includes(w1)));
        }

        // For multi-word names, check if at least 2 words match
        let matchCount = 0;
        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
                    matchCount++;
                    break;
                }
            }
        }

        return matchCount >= Math.min(2, Math.min(words1.length, words2.length));
    }

    /**
     * Get file type based on extension
     */
    getFileType(extension) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];

        if (imageExts.includes(extension.toLowerCase())) {
            return 'image';
        } else if (documentExts.includes(extension.toLowerCase())) {
            return 'document';
        } else {
            return 'document'; // Default to document for unknown types
        }
    }

    /**
     * Validate file exists and is readable
     */
    async validateFile(filePath) {
        try {
            // Check if file exists
            if (!await fs.pathExists(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Check if file is readable
            await fs.access(filePath, fs.constants.R_OK);

            // Get file stats
            const stats = await fs.stat(filePath);

            // Check if it's actually a file
            if (!stats.isFile()) {
                throw new Error(`Path is not a file: ${filePath}`);
            }

            // Check file size (minimum 1 byte, maximum 100MB)
            if (stats.size === 0) {
                throw new Error(`File is empty: ${filePath}`);
            }

            if (stats.size > 100 * 1024 * 1024) { // 100MB limit
                throw new Error(`File too large (${Math.round(stats.size / 1024 / 1024)}MB): ${filePath}`);
            }

            return {
                valid: true,
                size: stats.size,
                lastModified: stats.mtime
            };
        } catch (error) {
            await logger.error(`File validation failed for ${filePath}`, error);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Upload file to documents folder
     */
    async uploadToDocuments(sourceFile, targetFileName) {
        try {
            const targetPath = path.join(this.documentsFolder, targetFileName);
            await fs.copy(sourceFile, targetPath);
            
            await logger.info(`File uploaded to documents folder: ${targetFileName}`);
            return {
                fileName: targetFileName,
                fullPath: targetPath,
                size: (await fs.stat(targetPath)).size
            };
        } catch (error) {
            await logger.error('Error uploading file to documents folder', error);
            throw error;
        }
    }

    /**
     * Delete file from documents folder
     */
    async deleteFromDocuments(fileName) {
        try {
            const filePath = path.join(this.documentsFolder, fileName);

            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                await logger.info(`File deleted from documents folder: ${fileName}`);
                return true;
            }

            return false;
        } catch (error) {
            await logger.error('Error deleting file from documents folder', error);
            throw error;
        }
    }

    /**
     * Bulk delete files from documents folder
     */
    async bulkDeleteFromDocuments(fileNames) {
        try {
            const results = [];
            let deletedCount = 0;
            let failedCount = 0;

            for (const fileName of fileNames) {
                try {
                    const deleted = await this.deleteFromDocuments(fileName);
                    if (deleted) {
                        results.push({
                            fileName,
                            status: 'deleted',
                            success: true
                        });
                        deletedCount++;
                    } else {
                        results.push({
                            fileName,
                            status: 'not_found',
                            success: false,
                            error: 'File not found'
                        });
                        failedCount++;
                    }
                } catch (error) {
                    results.push({
                        fileName,
                        status: 'error',
                        success: false,
                        error: error.message
                    });
                    failedCount++;
                }
            }

            await logger.info(`Bulk delete completed: ${deletedCount} deleted, ${failedCount} failed`);

            return {
                total: fileNames.length,
                deleted: deletedCount,
                failed: failedCount,
                results
            };
        } catch (error) {
            await logger.error('Error in bulk delete operation', error);
            throw error;
        }
    }

    /**
     * Clear all files from documents folder
     */
    async clearAllDocuments() {
        try {
            const files = await this.scanDocumentsFolder();
            const fileNames = files.map(file => file.fileName).filter(name => name !== '.gitkeep');

            if (fileNames.length === 0) {
                return {
                    total: 0,
                    deleted: 0,
                    failed: 0,
                    results: []
                };
            }

            const result = await this.bulkDeleteFromDocuments(fileNames);
            await logger.info(`Cleared all documents: ${result.deleted} files deleted`);

            return result;
        } catch (error) {
            await logger.error('Error clearing all documents', error);
            throw error;
        }
    }

    /**
     * Get file statistics
     */
    async getStatistics() {
        try {
            const files = await this.scanDocumentsFolder();
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            
            const typeStats = {};
            files.forEach(file => {
                const type = this.getFileType(file.extension);
                typeStats[type] = (typeStats[type] || 0) + 1;
            });

            return {
                totalFiles: files.length,
                totalSize: totalSize,
                typeStats: typeStats,
                supportedFiles: files.filter(f => f.isSupported).length,
                unsupportedFiles: files.filter(f => !f.isSupported).length
            };
        } catch (error) {
            await logger.error('Error getting file statistics', error);
            return {
                totalFiles: 0,
                totalSize: 0,
                typeStats: {},
                supportedFiles: 0,
                unsupportedFiles: 0
            };
        }
    }

    /**
     * Test the name matching functionality
     */
    testNameMatching() {
        const testFiles = [
            { fileName: 'John Doe.pdf', nameWithoutExt: 'John Doe', extension: '.pdf' },
            { fileName: 'jane_smith.jpg', nameWithoutExt: 'jane_smith', extension: '.jpg' },
            { fileName: 'MIKE-WILSON.docx', nameWithoutExt: 'MIKE-WILSON', extension: '.docx' },
            { fileName: 'alice.png', nameWithoutExt: 'alice', extension: '.png' },
            { fileName: 'Bob Johnson Certificate.pdf', nameWithoutExt: 'Bob Johnson Certificate', extension: '.pdf' }
        ];

        const testContacts = [
            'John Doe',
            'Jane Smith',
            'Mike Wilson',
            'Alice Brown',
            'Bob Johnson',
            'Unknown Person'
        ];

        console.log('=== File Matching Test Results ===');
        testContacts.forEach(contactName => {
            const match = this.findMatchingFileByName(contactName, testFiles);
            console.log(`Contact: "${contactName}" → ${match ? `Matched: "${match.fileName}"` : 'No match'}`);
        });
        console.log('=== End Test Results ===');

        return {
            testFiles,
            testContacts,
            results: testContacts.map(name => ({
                contactName: name,
                matchedFile: this.findMatchingFileByName(name, testFiles)
            }))
        };
    }

    /**
     * Create sample template for file matching
     */
    generateSampleTemplate() {
        return [
            {
                name: 'John Doe',
                number: '628123456789',
                email: 'john@example.com',
                notes: 'Files will be automatically matched by name (e.g., "John Doe.pdf", "john_doe.jpg")'
            },
            {
                name: 'Jane Smith',
                number: '628234567890',
                email: 'jane@example.com',
                notes: 'Smart matching supports various formats: "Jane Smith.docx", "jane-smith.png"'
            },
            {
                name: 'Bob Johnson',
                number: '628345678901',
                email: 'bob@example.com',
                fileName: 'specific_file.pdf',
                notes: 'Optional: Use fileName column to specify exact file name'
            },
            {
                name: 'Alice Brown',
                number: '628456789012',
                email: 'alice@example.com',
                notes: 'Works with partial names too: "alice.jpg" will match "Alice Brown"'
            },
            {
                name: 'Mike Wilson',
                number: '628567890123',
                email: 'mike@example.com',
                notes: 'Case-insensitive: "MIKE WILSON.PDF" or "mike_wilson.docx" both work'
            }
        ];
    }
}

module.exports = new FileMatchingService();
