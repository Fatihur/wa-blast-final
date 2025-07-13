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

    async connect() {
        try {
            await logger.whatsapp('Attempting to connect to WhatsApp');
            this.connectionStatus = 'connecting';
            this.emitStatus();

            // Ensure session directory exists
            await fs.ensureDir(this.sessionPath);

            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            const { version, isLatest } = await fetchLatestBaileysVersion();
            
            await logger.whatsapp(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                browser: ['WA Blast', 'Chrome', '1.0.0']
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
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            this.emitStatus();
            
            // Clear session
            await fs.remove(this.sessionPath);
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
                result = await this.sock.sendMessage(jid, {
                    image: options.media,
                    caption: message
                });
            } else if (options.type === 'document' && options.media) {
                result = await this.sock.sendMessage(jid, {
                    document: options.media,
                    fileName: options.fileName || 'document',
                    caption: message
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
}

module.exports = new WhatsAppService();
