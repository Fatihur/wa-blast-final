// Anti-Ban Service for WhatsApp Blast
// Implements comprehensive anti-ban strategies

const { antiBanConfig, antiBanHelpers } = require('../config/antiBan');
const logger = require('../utils/logger');

class AntiBanService {
    constructor() {
        this.messageHistory = new Map(); // Track message history per number
        this.accountStats = {
            messagesPerHour: 0,
            messagesPerDay: 0,
            messagesPerWeek: 0,
            errorCount: 0,
            lastReset: {
                hour: new Date(),
                day: new Date(),
                week: new Date()
            }
        };
        this.accountType = 'normal_account'; // Default account type
        this.isBlastPaused = false;
        this.lastMessageTime = 0;
        this.consecutiveErrors = 0;
        
        // Start monitoring
        this.startMonitoring();
    }

    // Set account type based on account age and verification
    setAccountType(accountAge, isBusinessAccount = false, isVerified = false) {
        if (isBusinessAccount && isVerified) {
            this.accountType = 'business_account';
        } else if (accountAge > 365) {
            this.accountType = 'trusted_account';
        } else if (accountAge > 30) {
            this.accountType = 'normal_account';
        } else {
            this.accountType = 'new_account';
        }
        
        logger.info(`Account type set to: ${this.accountType}`);
        return this.accountType;
    }

    // Check if message can be sent (rate limiting)
    async canSendMessage(recipientNumber) {
        try {
            // Reset counters if needed
            this.resetCountersIfNeeded();
            
            // Check if blast is paused
            if (this.isBlastPaused) {
                throw new Error('Blast is paused due to safety restrictions');
            }
            
            // Check time restrictions
            if (!antiBanHelpers.isWithinActiveHours()) {
                throw new Error('Outside active hours (8 AM - 10 PM)');
            }
            
            // Check rate limits
            const limits = antiBanConfig.limits;
            const accountLimits = {
                hour: limits.messagesPerHour[this.accountType],
                day: limits.messagesPerDay[this.accountType],
                week: limits.messagesPerWeek[this.accountType]
            };
            
            if (this.accountStats.messagesPerHour >= accountLimits.hour) {
                throw new Error(`Hourly limit reached (${accountLimits.hour} messages)`);
            }
            
            if (this.accountStats.messagesPerDay >= accountLimits.day) {
                throw new Error(`Daily limit reached (${accountLimits.day} messages)`);
            }
            
            if (this.accountStats.messagesPerWeek >= accountLimits.week) {
                throw new Error(`Weekly limit reached (${accountLimits.week} messages)`);
            }
            
            // Check consecutive messages to same number
            const history = this.messageHistory.get(recipientNumber) || [];
            const recentMessages = history.filter(time => 
                Date.now() - time < 3600000 // Last hour
            );
            
            if (recentMessages.length >= limits.maxConsecutiveMessages) {
                throw new Error(`Too many messages to ${recipientNumber} in the last hour`);
            }
            
            return true;
            
        } catch (error) {
            logger.warn(`Rate limit check failed: ${error.message}`);
            throw error;
        }
    }

    // Calculate optimal delay for next message
    calculateOptimalDelay(recipientNumber, hasError = false) {
        const baseDelay = antiBanHelpers.calculateDelay(
            this.accountType,
            this.accountStats.messagesPerHour,
            this.consecutiveErrors
        );
        
        // Add extra delay if there was an error
        if (hasError) {
            const errorDelay = antiBanConfig.delays.afterError.recommended;
            return Math.max(baseDelay, errorDelay);
        }
        
        // Add random variation
        const randomDelay = antiBanHelpers.getRandomDelay(baseDelay);
        
        // Ensure minimum delay between messages
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        const minimumDelay = antiBanConfig.delays.betweenMessages.minimum;
        
        if (timeSinceLastMessage < minimumDelay) {
            return minimumDelay - timeSinceLastMessage + randomDelay;
        }
        
        return randomDelay;
    }

    // Record message sent
    recordMessageSent(recipientNumber, success = true) {
        const now = Date.now();
        
        // Update account stats
        this.accountStats.messagesPerHour++;
        this.accountStats.messagesPerDay++;
        this.accountStats.messagesPerWeek++;
        this.lastMessageTime = now;
        
        // Update message history for recipient
        if (!this.messageHistory.has(recipientNumber)) {
            this.messageHistory.set(recipientNumber, []);
        }
        this.messageHistory.get(recipientNumber).push(now);
        
        // Handle success/failure
        if (success) {
            this.consecutiveErrors = 0;
            logger.info(`Message sent successfully to ${recipientNumber}`);
        } else {
            this.consecutiveErrors++;
            this.accountStats.errorCount++;
            logger.warn(`Message failed to ${recipientNumber}. Consecutive errors: ${this.consecutiveErrors}`);
            
            // Auto-pause if too many consecutive errors
            if (this.consecutiveErrors >= antiBanConfig.safety.maxConsecutiveErrors) {
                this.pauseBlast('Too many consecutive errors');
            }
        }
        
        // Clean old history (keep only last 24 hours)
        this.cleanOldHistory();
    }

    // Validate message content for safety
    validateMessageContent(message) {
        const issues = [];
        
        // Check message length
        if (message.length < antiBanConfig.patterns.minMessageLength) {
            issues.push(`Message too short (min ${antiBanConfig.patterns.minMessageLength} chars)`);
        }
        
        if (message.length > antiBanConfig.patterns.maxMessageLength) {
            issues.push(`Message too long (max ${antiBanConfig.patterns.maxMessageLength} chars)`);
        }
        
        // Check for spam keywords
        const spamKeywords = antiBanConfig.patterns.spamKeywords;
        const lowerMessage = message.toLowerCase();
        const foundSpamWords = spamKeywords.filter(keyword => 
            lowerMessage.includes(keyword.toLowerCase())
        );
        
        if (foundSpamWords.length > 0) {
            issues.push(`Contains spam keywords: ${foundSpamWords.join(', ')}`);
        }
        
        // Check for excessive links
        const linkRegex = /(https?:\/\/[^\s]+)/gi;
        const links = message.match(linkRegex) || [];
        
        if (links.length > antiBanConfig.contentSafety.maxLinksPerMessage) {
            issues.push(`Too many links (max ${antiBanConfig.contentSafety.maxLinksPerMessage})`);
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues,
            riskLevel: this.calculateRiskLevel(message, issues)
        };
    }

    // Calculate risk level for message
    calculateRiskLevel(message, issues) {
        let riskScore = 0;
        
        // Base risk from issues
        riskScore += issues.length * 10;
        
        // Additional risk factors
        if (message.includes('http')) riskScore += 5;
        if (message.includes('wa.me')) riskScore += 10;
        if (message.includes('bit.ly')) riskScore += 5;
        if (/[A-Z]{5,}/.test(message)) riskScore += 5; // Excessive caps
        if (/!{3,}/.test(message)) riskScore += 5; // Excessive exclamation
        
        // Risk levels
        if (riskScore === 0) return 'low';
        if (riskScore <= 10) return 'medium';
        if (riskScore <= 20) return 'high';
        return 'critical';
    }

    // Pause blast for safety
    pauseBlast(reason) {
        this.isBlastPaused = true;
        const pauseDuration = antiBanConfig.safety.pauseDurationAfterErrors;
        
        logger.warn(`Blast paused: ${reason}. Will resume in ${pauseDuration / 60000} minutes`);
        
        setTimeout(() => {
            this.resumeBlast();
        }, pauseDuration);
    }

    // Resume blast
    resumeBlast() {
        this.isBlastPaused = false;
        this.consecutiveErrors = 0;
        logger.info('Blast resumed');
    }

    // Reset counters when time periods expire
    resetCountersIfNeeded() {
        const now = new Date();
        
        // Reset hourly counter
        if (now.getTime() - this.accountStats.lastReset.hour.getTime() >= 3600000) {
            this.accountStats.messagesPerHour = 0;
            this.accountStats.lastReset.hour = now;
        }
        
        // Reset daily counter
        if (now.getDate() !== this.accountStats.lastReset.day.getDate()) {
            this.accountStats.messagesPerDay = 0;
            this.accountStats.lastReset.day = now;
        }
        
        // Reset weekly counter
        const weeksDiff = Math.floor((now - this.accountStats.lastReset.week) / (7 * 24 * 60 * 60 * 1000));
        if (weeksDiff >= 1) {
            this.accountStats.messagesPerWeek = 0;
            this.accountStats.lastReset.week = now;
        }
    }

    // Clean old message history
    cleanOldHistory() {
        const cutoff = Date.now() - 86400000; // 24 hours ago
        
        for (const [number, history] of this.messageHistory.entries()) {
            const recentHistory = history.filter(time => time > cutoff);
            if (recentHistory.length === 0) {
                this.messageHistory.delete(number);
            } else {
                this.messageHistory.set(number, recentHistory);
            }
        }
    }

    // Get current account statistics
    getAccountStats() {
        this.resetCountersIfNeeded();
        
        const limits = antiBanConfig.limits;
        const accountLimits = {
            hour: limits.messagesPerHour[this.accountType],
            day: limits.messagesPerDay[this.accountType],
            week: limits.messagesPerWeek[this.accountType]
        };
        
        return {
            accountType: this.accountType,
            current: this.accountStats,
            limits: accountLimits,
            usage: {
                hourly: Math.round((this.accountStats.messagesPerHour / accountLimits.hour) * 100),
                daily: Math.round((this.accountStats.messagesPerDay / accountLimits.day) * 100),
                weekly: Math.round((this.accountStats.messagesPerWeek / accountLimits.week) * 100)
            },
            isPaused: this.isBlastPaused,
            consecutiveErrors: this.consecutiveErrors
        };
    }

    // Start monitoring service
    startMonitoring() {
        // Monitor every 5 minutes
        setInterval(() => {
            this.resetCountersIfNeeded();
            this.cleanOldHistory();
            
            const stats = this.getAccountStats();
            
            // Alert if approaching limits
            if (stats.usage.hourly > 80) {
                logger.warn(`Approaching hourly limit: ${stats.usage.hourly}%`);
            }
            
            if (stats.usage.daily > 80) {
                logger.warn(`Approaching daily limit: ${stats.usage.daily}%`);
            }
            
        }, 300000); // 5 minutes
    }
}

module.exports = AntiBanService;
