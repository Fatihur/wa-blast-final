const fs = require('fs-extra');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = './logs';
        this.ensureLogDir();
    }

    async ensureLogDir() {
        await fs.ensureDir(this.logDir);
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        return JSON.stringify(logEntry) + '\n';
    }

    async writeLog(filename, content) {
        const logPath = path.join(this.logDir, filename);
        await fs.appendFile(logPath, content);
    }

    async info(message, data = null) {
        console.log(`[INFO] ${message}`, data || '');
        const content = this.formatMessage('INFO', message, data);
        await this.writeLog('app.log', content);
    }

    async error(message, error = null) {
        console.error(`[ERROR] ${message}`, error || '');
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null;
        
        const content = this.formatMessage('ERROR', message, errorData);
        await this.writeLog('error.log', content);
        await this.writeLog('app.log', content);
    }

    async warn(message, data = null) {
        console.warn(`[WARN] ${message}`, data || '');
        const content = this.formatMessage('WARN', message, data);
        await this.writeLog('app.log', content);
    }

    async debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${message}`, data || '');
        }
        const content = this.formatMessage('DEBUG', message, data);
        await this.writeLog('debug.log', content);
    }

    async whatsapp(message, data = null) {
        console.log(`[WA] ${message}`, data || '');
        const content = this.formatMessage('WHATSAPP', message, data);
        await this.writeLog('whatsapp.log', content);
    }

    async blast(message, data = null) {
        console.log(`[BLAST] ${message}`, data || '');
        const content = this.formatMessage('BLAST', message, data);
        await this.writeLog('blast.log', content);
    }
}

module.exports = new Logger();
