const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const messageUtils = require('../utils/messageUtils');
const logger = require('../utils/logger');
const logRoutes = require('./logRoutes');
const fileMatchingService = require('../services/fileMatchingService');
const fs = require('fs-extra');
const path = require('path');

// Send single message
router.post('/send', async (req, res) => {
    try {
        const { number, message, type = 'text', fileName, filePath } = req.body;

        await logger.info('Single message request', { number, type, fileName, filePath });

        if (!whatsappService.isReady()) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        if (!number || !message) {
            return res.status(400).json({ error: 'Number and message are required' });
        }

        // Format message with rich text
        const formattedMessage = messageUtils.formatRichText(message);

        const options = { type };

        // Handle file attachment
        if (type !== 'text') {
            if (!filePath) {
                return res.status(400).json({ error: `File path is required for ${type} message` });
            }

            try {
                // Check if file exists
                if (!await fs.pathExists(filePath)) {
                    await logger.error('File not found', { filePath });
                    return res.status(400).json({ error: 'Uploaded file not found' });
                }

                const fileBuffer = await fs.readFile(filePath);
                options.media = fileBuffer;

                if (type === 'document') {
                    options.fileName = fileName || path.basename(filePath);
                }

                await logger.info(`Preparing ${type} message`, {
                    number,
                    fileName: options.fileName,
                    fileSize: fileBuffer.length,
                    filePath
                });
            } catch (fileError) {
                await logger.error('Error reading file', fileError);
                return res.status(400).json({ error: 'Error reading uploaded file: ' + fileError.message });
            }
        }

        const result = await whatsappService.sendMessage(number, formattedMessage, options);

        // Log successful message
        logRoutes.addLog({
            number: number,
            message: formattedMessage.substring(0, 100) + (formattedMessage.length > 100 ? '...' : ''),
            type: type,
            status: 'success',
            messageId: result.key.id,
            fileName: options.fileName || null
        });

        res.json({
            success: true,
            messageId: result.key.id,
            message: 'Message sent successfully'
        });
    } catch (error) {
        await logger.error('Error sending single message', error);

        // Log failed message
        logRoutes.addLog({
            number: number || 'unknown',
            message: (message || '').substring(0, 100) + ((message || '').length > 100 ? '...' : ''),
            type: type || 'text',
            status: 'failed',
            error: error.message
        });

        res.status(500).json({ error: error.message });
    }
});

// Send blast messages with retry mechanism
router.post('/blast', async (req, res) => {
    const startTime = Date.now();

    try {
        const { contacts, message, variables = {}, delay = 1000, retryAttempts = 2 } = req.body;

        await logger.blast(`Starting blast campaign`, {
            totalContacts: contacts?.length || 0,
            delay,
            retryAttempts
        });

        if (!whatsappService.isReady()) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const results = [];
        const total = contacts.length;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            let success = false;
            let lastError = null;

            // Retry mechanism
            for (let attempt = 1; attempt <= retryAttempts && !success; attempt++) {
                try {
                    // Replace variables in message
                    let personalizedMessage = messageUtils.replaceVariables(message, contact, variables);

                    // Format rich text
                    personalizedMessage = messageUtils.formatRichText(personalizedMessage);

                    // Determine message type and options
                    const options = { type: 'text' };

                    // Handle different media types per contact
                    if (contact.media) {
                        if (contact.media.type === 'image') {
                            options.type = 'image';
                            options.media = await fs.readFile(contact.media.path);
                        } else if (contact.media.type === 'document') {
                            options.type = 'document';
                            options.media = await fs.readFile(contact.media.path);
                            options.fileName = contact.media.fileName || path.basename(contact.media.path);
                        }
                    } else if (contact.imagePath) {
                        // Support for image path in contact data
                        options.type = 'image';
                        options.media = await fs.readFile(contact.imagePath);
                    } else if (contact.documentPath) {
                        // Support for document path in contact data
                        options.type = 'document';
                        options.media = await fs.readFile(contact.documentPath);
                        options.fileName = contact.documentName || path.basename(contact.documentPath);
                    }

                    const result = await whatsappService.sendMessage(contact.number, personalizedMessage, options);

                    results.push({
                        number: contact.number,
                        name: contact.name || '',
                        status: 'sent',
                        messageId: result.key.id,
                        attempts: attempt
                    });

                    sent++;
                    success = true;

                    await logger.blast(`Message sent successfully`, {
                        contact: contact.number,
                        attempt,
                        messageId: result.key.id
                    });

                    // Log successful blast message
                    logRoutes.addLog({
                        number: contact.number,
                        message: personalizedMessage.substring(0, 100) + (personalizedMessage.length > 100 ? '...' : ''),
                        type: options.type || 'text',
                        status: 'success',
                        messageId: result.key.id,
                        attempts: attempt,
                        fileName: options.fileName || null,
                        contactName: contact.name || null
                    });

                } catch (error) {
                    lastError = error;
                    await logger.error(`Attempt ${attempt} failed for ${contact.number}`, error);

                    if (attempt < retryAttempts) {
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            if (!success) {
                results.push({
                    number: contact.number,
                    name: contact.name || '',
                    status: 'failed',
                    error: lastError?.message || 'Unknown error',
                    attempts: retryAttempts
                });
                failed++;

                await logger.error(`All attempts failed for ${contact.number}`, lastError);

                // Log failed blast message
                logRoutes.addLog({
                    number: contact.number,
                    message: personalizedMessage.substring(0, 100) + (personalizedMessage.length > 100 ? '...' : ''),
                    type: options.type || 'text',
                    status: 'failed',
                    error: lastError?.message || 'Unknown error',
                    attempts: retryAttempts,
                    contactName: contact.name || null
                });
            }

            // Emit progress update
            req.app.get('io')?.emit('blast-progress', {
                total,
                sent,
                failed,
                current: i + 1,
                percentage: Math.round(((i + 1) / total) * 100)
            });

            // Add delay between messages
            if (i < contacts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        const duration = Date.now() - startTime;

        await logger.blast(`Blast campaign completed`, {
            total,
            sent,
            failed,
            duration: `${Math.round(duration / 1000)}s`,
            successRate: `${Math.round((sent / total) * 100)}%`
        });

        res.json({
            success: true,
            summary: {
                total,
                sent,
                failed,
                duration,
                successRate: Math.round((sent / total) * 100)
            },
            results
        });

    } catch (error) {
        await logger.error('Error in blast campaign', error);
        res.status(500).json({ error: error.message });
    }
});

// Send blast messages with file matching
router.post('/blast-with-files', async (req, res) => {
    const startTime = Date.now();

    try {
        const { contacts, message, variables = {}, delay = 1000, retryAttempts = 2 } = req.body;

        await logger.blast(`Starting file matching blast campaign`, {
            totalContacts: contacts?.length || 0,
            delay,
            retryAttempts
        });

        if (!whatsappService.isReady()) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Match contacts with files
        const matchingResult = await fileMatchingService.matchContactsWithFiles(contacts);

        if (matchingResult.matched.length === 0) {
            return res.status(400).json({
                error: 'No contacts could be matched with files',
                details: matchingResult
            });
        }

        const results = [];
        const total = matchingResult.matched.length;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < matchingResult.matched.length; i++) {
            const contact = matchingResult.matched[i];
            let success = false;
            let lastError = null;

            // Retry mechanism
            for (let attempt = 1; attempt <= retryAttempts && !success; attempt++) {
                try {
                    // Replace variables in message
                    let personalizedMessage = messageUtils.replaceVariables(message, contact, variables);

                    // Format rich text
                    personalizedMessage = messageUtils.formatRichText(personalizedMessage);

                    // Prepare file options
                    const options = {
                        type: contact.matchedFile.type,
                        media: await fs.readFile(contact.matchedFile.fullPath),
                        fileName: contact.matchedFile.fileName
                    };

                    const result = await whatsappService.sendMessage(contact.number, personalizedMessage, options);

                    results.push({
                        number: contact.number,
                        name: contact.name || '',
                        fileName: contact.matchedFile.fileName,
                        status: 'sent',
                        messageId: result.key.id,
                        attempts: attempt
                    });

                    sent++;
                    success = true;

                    await logger.blast(`File message sent successfully`, {
                        contact: contact.number,
                        fileName: contact.matchedFile.fileName,
                        attempt,
                        messageId: result.key.id
                    });

                    // Log successful blast message
                    logRoutes.addLog({
                        number: contact.number,
                        message: personalizedMessage.substring(0, 100) + (personalizedMessage.length > 100 ? '...' : ''),
                        type: contact.matchedFile.type,
                        status: 'success',
                        messageId: result.key.id,
                        attempts: attempt,
                        fileName: contact.matchedFile.fileName,
                        contactName: contact.name || null
                    });

                } catch (error) {
                    lastError = error;
                    await logger.error(`Attempt ${attempt} failed for ${contact.number}`, error);

                    if (attempt < retryAttempts) {
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            if (!success) {
                results.push({
                    number: contact.number,
                    name: contact.name || '',
                    fileName: contact.matchedFile?.fileName || 'unknown',
                    status: 'failed',
                    error: lastError?.message || 'Unknown error',
                    attempts: retryAttempts
                });
                failed++;

                await logger.error(`All attempts failed for ${contact.number}`, lastError);

                // Log failed blast message
                logRoutes.addLog({
                    number: contact.number,
                    message: personalizedMessage?.substring(0, 100) + (personalizedMessage?.length > 100 ? '...' : ''),
                    type: contact.matchedFile?.type || 'document',
                    status: 'failed',
                    error: lastError?.message || 'Unknown error',
                    attempts: retryAttempts,
                    fileName: contact.matchedFile?.fileName || 'unknown',
                    contactName: contact.name || null
                });
            }

            // Emit progress update
            req.app.get('io')?.emit('blast-progress', {
                total,
                sent,
                failed,
                current: i + 1,
                percentage: Math.round(((i + 1) / total) * 100)
            });

            // Add delay between messages
            if (i < matchingResult.matched.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        const duration = Date.now() - startTime;

        await logger.blast(`File matching blast campaign completed`, {
            total,
            sent,
            failed,
            unmatched: matchingResult.unmatched.length,
            duration: `${Math.round(duration / 1000)}s`,
            successRate: `${Math.round((sent / total) * 100)}%`
        });

        res.json({
            success: true,
            summary: {
                total,
                sent,
                failed,
                unmatched: matchingResult.unmatched.length,
                duration,
                successRate: Math.round((sent / total) * 100)
            },
            results,
            unmatchedContacts: matchingResult.unmatched,
            fileMatchingStats: matchingResult.statistics
        });

    } catch (error) {
        await logger.error('Error in file matching blast campaign', error);
        res.status(500).json({ error: error.message });
    }
});

// Get WhatsApp status
router.get('/status', (req, res) => {
    res.json(whatsappService.getStatus());
});

module.exports = router;
