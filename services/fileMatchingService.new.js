const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

// Note: This service now only supports manual file assignments.
// Name-based matching has been removed to enforce explicit file assignments.
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
            await fs.ensureDir(this.documentsFolder);
            await logger.info('File matching service initialized - Manual assignments only');
        } catch (error) {
            await logger.error('Error initializing file matching service', error);
        }
    }

    async scanDocumentsFolder(forceRefresh = false) {
        try {
            const now = Date.now();
            if (!forceRefresh && this.fileCache && this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheTimeout) {
                return this.fileCache;
            }

            const files = await fs.readdir(this.documentsFolder);
            const fileList = [];

            for (const file of files) {
                const filePath = path.join(this.documentsFolder, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        fileList.push({
                            fileName: file,
                            extension: ext,
                            fullPath: filePath,
                            absolutePath: path.resolve(filePath),
                            size: stats.size,
                            lastModified: stats.mtime,
                            isSupported: this.supportedExtensions.includes(ext)
                        });
                    }
                } catch (error) {
                    await logger.error(`Error accessing file ${file}:`, error);
                }
            }

            this.fileCache = fileList;
            this.cacheTimestamp = now;

            await logger.info(`Documents folder scan complete: ${fileList.length} files found`);
            return fileList;
        } catch (error) {
            await logger.error('Error scanning documents folder', error);
            return [];
        }
    }

    clearFileCache() {
        this.fileCache = null;
        this.cacheTimestamp = null;
    }

    getFileType(extension) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExts.includes(extension.toLowerCase()) ? 'image' : 'document';
    }

    async matchContactsWithFiles(contacts, manualAssignments = {}) {
        try {
            const availableFiles = await this.scanDocumentsFolder();
            const matchedContacts = [];
            const unmatchedContacts = [];
            const unusedFiles = [...availableFiles];

            await logger.info('Starting file matching (manual assignments only)', {
                totalContacts: contacts.length,
                availableAssignments: Object.keys(manualAssignments).length
            });

            for (const contact of contacts) {
                const contactName = contact.name || contact.nama || contact.contactName || contact.contact_name;
                
                if (manualAssignments[contactName]) {
                    const assignment = manualAssignments[contactName];
                    const assignedFile = availableFiles.find(f => f.fileName === assignment.fileName);
                    
                    if (assignedFile) {
                        const PathValidationService = require('./pathValidationService');
                        const pathValidation = PathValidationService.validateFilePath(assignedFile.fullPath, this.documentsFolder);
                        
                        if (pathValidation.valid) {
                            matchedContacts.push({
                                ...contact,
                                matchedFile: {
                                    fileName: assignedFile.fileName,
                                    fullPath: pathValidation.sanitizedPath,
                                    absolutePath: pathValidation.sanitizedPath,
                                    extension: assignedFile.extension,
                                    size: assignedFile.size,
                                    type: this.getFileType(assignedFile.extension),
                                    validated: true,
                                    matchingMethod: 'manual_assignment'
                                }
                            });
                            
                            const index = unusedFiles.findIndex(f => f.fileName === assignedFile.fileName);
                            if (index > -1) {
                                unusedFiles.splice(index, 1);
                            }
                            continue;
                        }
                    }
                }
                
                unmatchedContacts.push({
                    ...contact,
                    reason: 'Manual file assignment required. Please assign a file explicitly.',
                    searchTerm: contactName || 'unknown'
                });
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
                    unusedFilesCount: unusedFiles.length,
                    manualAssignments: Object.keys(manualAssignments).length
                }
            };

            await logger.info('File matching completed (manual assignments only)', result.statistics);
            return result;
        } catch (error) {
            await logger.error('Error in file matching', error);
            throw error;
        }
    }

    async validateFile(filePath) {
        try {
            if (!await fs.pathExists(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            await fs.access(filePath, fs.constants.R_OK);
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
                throw new Error(`Not a file: ${filePath}`);
            }

            if (stats.size === 0) {
                throw new Error(`File is empty: ${filePath}`);
            }

            if (stats.size > 100 * 1024 * 1024) {
                throw new Error(`File too large (${Math.round(stats.size / 1024 / 1024)}MB): ${filePath}`);
            }

            return { valid: true, size: stats.size, lastModified: stats.mtime };
        } catch (error) {
            await logger.error(`File validation failed: ${filePath}`, error);
            return { valid: false, error: error.message };
        }
    }
}

module.exports = new FileMatchingService();
