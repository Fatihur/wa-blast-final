const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class FileMatchingService {
    constructor() {
        this.documentsFolder = './documents';
        this.supportedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
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
    async scanDocumentsFolder() {
        try {
            const files = await fs.readdir(this.documentsFolder);
            const fileList = [];

            for (const file of files) {
                const filePath = path.join(this.documentsFolder, file);
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
            }

            await logger.info(`Scanned documents folder: ${fileList.length} files found`);
            return fileList;
        } catch (error) {
            await logger.error('Error scanning documents folder', error);
            return [];
        }
    }

    /**
     * Match contacts with their corresponding files
     */
    async matchContactsWithFiles(contacts) {
        try {
            const availableFiles = await this.scanDocumentsFolder();
            const matchedContacts = [];
            const unmatchedContacts = [];
            const unusedFiles = [...availableFiles];

            for (const contact of contacts) {
                const fileName = contact.fileName || contact.namaFile || contact.nama_file || contact.file;
                
                if (!fileName) {
                    unmatchedContacts.push({
                        ...contact,
                        reason: 'No file name specified in contact data'
                    });
                    continue;
                }

                // Try to find matching file
                const matchedFile = this.findMatchingFile(fileName, availableFiles);
                
                if (matchedFile) {
                    matchedContacts.push({
                        ...contact,
                        matchedFile: {
                            fileName: matchedFile.fileName,
                            fullPath: matchedFile.fullPath,
                            extension: matchedFile.extension,
                            size: matchedFile.size,
                            type: this.getFileType(matchedFile.extension)
                        }
                    });

                    // Remove from unused files
                    const index = unusedFiles.findIndex(f => f.fileName === matchedFile.fileName);
                    if (index > -1) {
                        unusedFiles.splice(index, 1);
                    }
                } else {
                    unmatchedContacts.push({
                        ...contact,
                        reason: `File "${fileName}" not found in documents folder`
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
     * Find matching file for given filename
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
     * Create sample template for file matching
     */
    generateSampleTemplate() {
        return [
            {
                name: 'John Doe',
                number: '628123456789',
                email: 'john@example.com',
                fileName: 'john_certificate.pdf'
            },
            {
                name: 'Jane Smith',
                number: '628234567890',
                email: 'jane@example.com',
                fileName: 'jane_report.docx'
            },
            {
                name: 'Bob Johnson',
                number: '628345678901',
                email: 'bob@example.com',
                fileName: 'bob_invoice.pdf'
            }
        ];
    }
}

module.exports = new FileMatchingService();
