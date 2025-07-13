const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads';
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types for documents and images
        cb(null, true);
    }
});

// Upload single file
router.post('/file', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: `/uploads/${req.file.filename}`
        };

        res.json({
            success: true,
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload multiple files
router.post('/files', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const filesInfo = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/${file.filename}`
        }));

        res.json({
            success: true,
            files: filesInfo
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete uploaded file
router.delete('/file/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join('./uploads', filename);
        
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get uploaded files list
router.get('/files', async (req, res) => {
    try {
        const uploadPath = './uploads';
        
        if (!(await fs.pathExists(uploadPath))) {
            return res.json({ files: [] });
        }

        const files = await fs.readdir(uploadPath);
        const filesInfo = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(uploadPath, filename);
                const stats = await fs.stat(filePath);
                
                return {
                    filename,
                    size: stats.size,
                    uploadDate: stats.birthtime,
                    url: `/uploads/${filename}`
                };
            })
        );

        res.json({ files: filesInfo });
    } catch (error) {
        console.error('Error getting files list:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve uploaded files
router.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

module.exports = router;
