const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

// In-memory log storage (in production, use database)
let messageLogs = [];

// Add log entry
function addLog(logEntry) {
    const log = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...logEntry
    };
    
    messageLogs.unshift(log); // Add to beginning
    
    // Keep only last 1000 logs in memory
    if (messageLogs.length > 1000) {
        messageLogs = messageLogs.slice(0, 1000);
    }
    
    // Also save to file for persistence
    saveLogsToFile();
    
    return log;
}

// Save logs to file
async function saveLogsToFile() {
    try {
        await fs.ensureDir('./logs');
        const logFile = path.join('./logs', 'message-logs.json');
        await fs.writeFile(logFile, JSON.stringify(messageLogs, null, 2));
    } catch (error) {
        console.error('Error saving logs to file:', error);
    }
}

// Load logs from file
async function loadLogsFromFile() {
    try {
        const logFile = path.join('./logs', 'message-logs.json');
        if (await fs.pathExists(logFile)) {
            const data = await fs.readFile(logFile, 'utf8');
            messageLogs = JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading logs from file:', error);
        messageLogs = [];
    }
}

// Initialize logs on startup
loadLogsFromFile();

// Get all logs
router.get('/', (req, res) => {
    try {
        const { status, type, number, limit = 100, offset = 0 } = req.query;
        
        let filteredLogs = [...messageLogs];
        
        // Apply filters
        if (status) {
            filteredLogs = filteredLogs.filter(log => log.status === status);
        }
        
        if (type) {
            filteredLogs = filteredLogs.filter(log => log.type === type);
        }
        
        if (number) {
            filteredLogs = filteredLogs.filter(log => 
                log.number.includes(number)
            );
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            logs: paginatedLogs,
            total: filteredLogs.length,
            statistics: {
                total: messageLogs.length,
                successful: messageLogs.filter(log => log.status === 'success').length,
                failed: messageLogs.filter(log => log.status === 'failed').length
            }
        });
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear all logs
router.delete('/', async (req, res) => {
    try {
        messageLogs = [];
        await saveLogsToFile();
        
        res.json({
            success: true,
            message: 'All logs cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get log statistics
router.get('/stats', (req, res) => {
    try {
        const total = messageLogs.length;
        const successful = messageLogs.filter(log => log.status === 'success').length;
        const failed = messageLogs.filter(log => log.status === 'failed').length;
        const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
        
        // Group by date for chart data
        const dateGroups = {};
        messageLogs.forEach(log => {
            const date = new Date(log.timestamp).toDateString();
            if (!dateGroups[date]) {
                dateGroups[date] = { total: 0, successful: 0, failed: 0 };
            }
            dateGroups[date].total++;
            if (log.status === 'success') {
                dateGroups[date].successful++;
            } else {
                dateGroups[date].failed++;
            }
        });
        
        res.json({
            success: true,
            statistics: {
                total,
                successful,
                failed,
                successRate,
                dailyStats: dateGroups
            }
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export the addLog function for use in other modules
router.addLog = addLog;

module.exports = router;
