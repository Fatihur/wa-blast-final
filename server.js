const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const whatsappService = require('./services/whatsappService');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const contactRoutes = require('./routes/contactRoutes');
const logRoutes = require('./routes/logRoutes');
const fileMatchingRoutes = require('./routes/fileMatchingRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Ensure directories exist
fs.ensureDirSync('./uploads');
fs.ensureDirSync('./sessions');

// Initialize WhatsApp service with socket
whatsappService.initialize(io);

// Add io to app for access in routes
app.set('io', io);

// Routes
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/file-matching', fileMatchingRoutes);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve test page
app.get('/test-upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-upload.html'));
});

// Serve logs page
app.get('/logs.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

// Serve file matching page
app.get('/file-matching.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'file-matching.html'));
});

// Serve test buttons page
app.get('/test-buttons.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-buttons.html'));
});

// Serve test notifications page
app.get('/test-notifications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-notifications.html'));
});

// Serve anti-ban dashboard page
app.get('/anti-ban-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'anti-ban-dashboard.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send current WhatsApp status
    socket.emit('whatsapp-status', whatsappService.getStatus());
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
    
    socket.on('connect-whatsapp', () => {
        whatsappService.connect();
    });

    socket.on('force-new-connection', () => {
        whatsappService.forceNewConnection();
    });

    socket.on('disconnect-whatsapp', () => {
        whatsappService.disconnect();
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to access the application`);
});

module.exports = { app, server, io };
