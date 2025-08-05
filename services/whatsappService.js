const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.io = null;
        this.qrCode = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.sessionPath = './sessions/wa-session';
    }

    initialize(io) {
        this.io = io;
    }

    async connect(forceQR = false) {
        try {
            await logger.whatsapp('Attempting to connect to WhatsApp', { forceQR });
            this.connectionStatus = 'connecting';
            this.emitStatus();

            // If force QR, clear session first
            if (forceQR) {
                await this.clearSession();
            }

            // Ensure session directory exists
            await fs.ensureDir(this.sessionPath);

            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            const { version, isLatest } = await fetchLatestBaileysVersion();

            await logger.whatsapp(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                browser: ['WA Blast', 'Chrome', '1.0.0'],
                // Force QR generation by not using cached auth
                ...(forceQR && { auth: undefined })
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    await logger.whatsapp('QR Code received');
                    this.qrCode = await QRCode.toDataURL(qr);
                    this.connectionStatus = 'qr-ready';
                    this.emitStatus();
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    await logger.whatsapp('Connection closed', {
                        error: lastDisconnect?.error?.message,
                        shouldReconnect
                    });

                    this.isConnected = false;
                    this.connectionStatus = 'disconnected';
                    this.qrCode = null;
                    this.emitStatus();

                    if (shouldReconnect) {
                        await logger.whatsapp('Attempting to reconnect in 3 seconds');
                        setTimeout(() => this.connect(), 3000);
                    }
                } else if (connection === 'open') {
                    await logger.whatsapp('WhatsApp connected successfully');
                    this.isConnected = true;
                    this.connectionStatus = 'connected';
                    this.qrCode = null;
                    this.emitStatus();
                }
            });

            this.sock.ev.on('creds.update', saveCreds);

        } catch (error) {
            await logger.error('Error connecting to WhatsApp', error);
            this.connectionStatus = 'error';
            this.emitStatus();
        }
    }

    async disconnect() {
        try {
            if (this.sock) {
                await logger.whatsapp('Disconnecting WhatsApp...');
                await this.sock.logout();
                this.sock = null;
            }

            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            this.emitStatus();

            // Clear session completely
            await this.clearSession();
            await logger.whatsapp('WhatsApp disconnected and session cleared');

        } catch (error) {
            await logger.error('Error during disconnect', error);
            // Force reset even if error
            this.sock = null;
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            await this.clearSession();
            this.emitStatus();
        }
    }

    async clearSession() {
        try {
            // Remove session directory completely
            if (await fs.pathExists(this.sessionPath)) {
                await fs.remove(this.sessionPath);
                await logger.whatsapp('Session directory removed');
            }

            // Ensure directory is recreated for next connection
            await fs.ensureDir(this.sessionPath);
            await logger.whatsapp('Fresh session directory created');

        } catch (error) {
            await logger.error('Error clearing session', error);
        }
    }

    async forceNewConnection() {
        try {
            await logger.whatsapp('Forcing new connection with fresh session...');

            // Disconnect if connected
            if (this.sock) {
                try {
                    await this.sock.logout();
                } catch (e) {
                    // Ignore logout errors
                }
                this.sock = null;
            }

            // Clear session completely
            await this.clearSession();

            // Reset state
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            this.emitStatus();

            // Wait a moment then connect
            setTimeout(() => {
                this.connect();
            }, 1000);

        } catch (error) {
            await logger.error('Error forcing new connection', error);
            this.connectionStatus = 'error';
            this.emitStatus();
        }
    }

    emitStatus() {
        if (this.io) {
            this.io.emit('whatsapp-status', this.getStatus());
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            status: this.connectionStatus,
            qrCode: this.qrCode
        };
    }

    async sendMessage(number, message, options = {}) {
        if (!this.isConnected || !this.sock) {
            throw new Error('WhatsApp not connected');
        }

        try {
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;

            await logger.whatsapp(`Sending ${options.type || 'text'} message to ${number}`);

            let result;
            if (options.type === 'image' && options.media) {
                // Validate image file
                if (!options.media || options.media.length === 0) {
                    throw new Error('Image file is empty or invalid');
                }

                // Check minimum file size
                if (options.media.length < 100) {
                    throw new Error('Image file is too small (minimum 100 bytes required)');
                }

                // Check maximum file size for images (WhatsApp limit is ~16MB for images)
                if (options.media.length > 16 * 1024 * 1024) {
                    throw new Error(`Image file is too large (${Math.round(options.media.length / 1024 / 1024)}MB). Maximum is 16MB.`);
                }

                const fileName = options.fileName || 'image';
                await logger.whatsapp(`Sending image: ${fileName} (${Math.round(options.media.length / 1024)}KB)`);

                result = await this.sock.sendMessage(jid, {
                    image: options.media,
                    caption: message
                });
            } else if (options.type === 'document' && options.media) {
                // Validate document file
                if (!options.media || options.media.length === 0) {
                    throw new Error('Document file is empty or invalid');
                }

                // Ensure minimum file size to avoid WhatsApp "empty file" error
                if (options.media.length < 10) {
                    throw new Error('Document file is too small (minimum 10 bytes required)');
                }

                // Check maximum file size (WhatsApp limit is ~100MB)
                if (options.media.length > 100 * 1024 * 1024) {
                    throw new Error(`Document file is too large (${Math.round(options.media.length / 1024 / 1024)}MB). Maximum is 100MB.`);
                }

                const fileName = options.fileName || 'document';
                const mimeType = this.getMimeType(fileName);

                await logger.whatsapp(`Sending document: ${fileName} (${Math.round(options.media.length / 1024)}KB, ${mimeType})`);

                result = await this.sock.sendMessage(jid, {
                    document: options.media,
                    fileName: fileName,
                    caption: message,
                    mimetype: mimeType
                });
            } else {
                result = await this.sock.sendMessage(jid, { text: message });
            }

            await logger.whatsapp(`Message sent successfully to ${number}`, { messageId: result.key.id });
            return result;
        } catch (error) {
            await logger.error(`Error sending message to ${number}`, error);
            throw error;
        }
    }

    isReady() {
        return this.isConnected && this.sock;
    }

    getMimeType(fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

module.exports = new WhatsAppService();
