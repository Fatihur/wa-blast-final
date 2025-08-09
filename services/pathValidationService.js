const path = require('path');
const fs = require('fs-extra');

class PathValidationService {
    /**
     * Normalize and validate file path
     */
    static validateFilePath(filePath, baseFolder) {
        try {
            // Resolve to absolute path
            const absolutePath = path.resolve(filePath);
            
            // Ensure the path is within the base folder
            if (!absolutePath.startsWith(path.resolve(baseFolder))) {
                return {
                    valid: false,
                    error: 'File path is outside of allowed directory',
                    sanitizedPath: null
                };
            }

            // Check if file exists
            if (!fs.existsSync(absolutePath)) {
                return {
                    valid: false,
                    error: 'File does not exist',
                    sanitizedPath: null
                };
            }

            // Return validated path
            return {
                valid: true,
                error: null,
                sanitizedPath: absolutePath
            };
        } catch (error) {
            return {
                valid: false,
                error: `Path validation error: ${error.message}`,
                sanitizedPath: null
            };
        }
    }
}

module.exports = PathValidationService;
