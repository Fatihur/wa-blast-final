// Anti-Ban Configuration for WhatsApp Blast
// Comprehensive settings to avoid WhatsApp account suspension

const antiBanConfig = {
    // Message Limits per Time Period
    limits: {
        // Per Hour Limits
        messagesPerHour: {
            new_account: 20,        // New WhatsApp accounts (< 30 days)
            normal_account: 50,     // Normal accounts (30-90 days)
            trusted_account: 100,   // Trusted accounts (> 90 days)
            business_account: 200   // WhatsApp Business accounts
        },
        
        // Per Day Limits
        messagesPerDay: {
            new_account: 100,
            normal_account: 300,
            trusted_account: 500,
            business_account: 1000
        },
        
        // Per Week Limits
        messagesPerWeek: {
            new_account: 500,
            normal_account: 1500,
            trusted_account: 2500,
            business_account: 5000
        },
        
        // Consecutive Message Limits
        maxConsecutiveMessages: 5,  // Max messages to same number in sequence
        
        // Group Limits
        maxGroupMessages: 10,       // Max messages per group per hour
        maxGroupsPerDay: 20         // Max groups to message per day
    },

    // Delay Settings (in milliseconds)
    delays: {
        // Between Messages
        betweenMessages: {
            minimum: 3000,          // 3 seconds minimum
            maximum: 15000,         // 15 seconds maximum
            recommended: 8000       // 8 seconds recommended
        },
        
        // Between Different Recipients
        betweenRecipients: {
            minimum: 5000,          // 5 seconds minimum
            maximum: 30000,         // 30 seconds maximum
            recommended: 12000      // 12 seconds recommended
        },
        
        // After Error/Failure
        afterError: {
            minimum: 30000,         // 30 seconds after error
            maximum: 300000,        // 5 minutes maximum
            recommended: 60000      // 1 minute recommended
        },
        
        // Random Delay Range
        randomRange: {
            enabled: true,
            minVariation: 0.7,      // 70% of base delay
            maxVariation: 1.5       // 150% of base delay
        }
    },

    // Message Pattern Detection
    patterns: {
        // Content Variation
        requireVariation: true,
        maxSimilarMessages: 3,      // Max similar messages before variation required
        
        // Template Variables
        useTemplateVariables: true,
        variableMarkers: ['{nama}', '{name}', '{nomor}', '{number}'],
        
        // Message Length
        minMessageLength: 10,       // Minimum characters
        maxMessageLength: 1000,     // Maximum characters
        
        // Avoid Spam Keywords
        spamKeywords: [
            'promo', 'diskon', 'gratis', 'bonus', 'hadiah',
            'menang', 'jackpot', 'untung', 'profit', 'investasi',
            'klik link', 'daftar sekarang', 'buruan', 'terbatas'
        ]
    },

    // Account Behavior Simulation
    behavior: {
        // Human-like Activity
        simulateTyping: true,       // Show typing indicator
        typingDuration: {
            minimum: 2000,          // 2 seconds
            maximum: 8000,          // 8 seconds
            perCharacter: 50        // 50ms per character
        },
        
        // Read Receipts
        markAsRead: true,
        readDelay: {
            minimum: 1000,          // 1 second
            maximum: 5000           // 5 seconds
        },
        
        // Online Status
        maintainOnlineStatus: true,
        onlineIntervals: {
            minimum: 300000,        // 5 minutes
            maximum: 1800000        // 30 minutes
        }
    },

    // Safety Features
    safety: {
        // Auto-pause on Errors
        autoPauseOnErrors: true,
        maxConsecutiveErrors: 3,
        pauseDurationAfterErrors: 600000,  // 10 minutes
        
        // Rate Limiting
        enableRateLimit: true,
        rateLimitWindow: 3600000,   // 1 hour window
        
        // Account Monitoring
        monitorAccountStatus: true,
        checkStatusInterval: 300000, // 5 minutes
        
        // Emergency Stop
        emergencyStopKeywords: ['banned', 'suspended', 'blocked'],
        
        // Backup Strategy
        enableBackup: true,
        backupInterval: 86400000    // 24 hours
    },

    // Time-based Restrictions
    timeRestrictions: {
        // Active Hours (24-hour format)
        activeHours: {
            start: 8,               // 8 AM
            end: 22                 // 10 PM
        },
        
        // Weekend Restrictions
        weekendLimits: {
            enabled: true,
            reducedRate: 0.5        // 50% of normal rate
        },
        
        // Holiday Restrictions
        holidayMode: {
            enabled: true,
            reducedRate: 0.3        // 30% of normal rate
        },
        
        // Timezone Consideration
        respectTimezone: true,
        targetTimezone: 'Asia/Jakarta'
    },

    // Content Safety
    contentSafety: {
        // Link Detection
        detectLinks: true,
        maxLinksPerMessage: 1,
        trustedDomains: ['bit.ly', 'tinyurl.com', 'short.link'],
        
        // Media Restrictions
        maxMediaSize: 16777216,     // 16MB
        allowedMediaTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        
        // Text Analysis
        analyzeContent: true,
        blockSuspiciousContent: true,
        
        // Language Detection
        detectLanguage: true,
        allowedLanguages: ['id', 'en']
    },

    // Account Types
    accountTypes: {
        new_account: {
            age: 30,                // Days
            trustLevel: 1,
            restrictions: 'high'
        },
        normal_account: {
            age: 90,                // Days
            trustLevel: 2,
            restrictions: 'medium'
        },
        trusted_account: {
            age: 365,               // Days
            trustLevel: 3,
            restrictions: 'low'
        },
        business_account: {
            verified: true,
            trustLevel: 4,
            restrictions: 'minimal'
        }
    },

    // Monitoring & Alerts
    monitoring: {
        // Performance Metrics
        trackMetrics: true,
        metricsRetention: 2592000000, // 30 days
        
        // Alert Thresholds
        alertThresholds: {
            errorRate: 0.1,         // 10% error rate
            responseTime: 30000,    // 30 seconds
            dailyLimit: 0.8         // 80% of daily limit
        },
        
        // Notification Methods
        notifications: {
            email: true,
            webhook: true,
            console: true
        }
    }
};

// Helper Functions
const antiBanHelpers = {
    // Calculate appropriate delay based on account type and current usage
    calculateDelay(accountType, messageCount, errorCount) {
        const baseDelay = antiBanConfig.delays.betweenMessages.recommended;
        const accountMultiplier = this.getAccountMultiplier(accountType);
        const usageMultiplier = this.getUsageMultiplier(messageCount);
        const errorMultiplier = this.getErrorMultiplier(errorCount);
        
        return Math.round(baseDelay * accountMultiplier * usageMultiplier * errorMultiplier);
    },
    
    // Get account type multiplier
    getAccountMultiplier(accountType) {
        const multipliers = {
            new_account: 2.0,
            normal_account: 1.5,
            trusted_account: 1.0,
            business_account: 0.8
        };
        return multipliers[accountType] || 1.5;
    },
    
    // Get usage-based multiplier
    getUsageMultiplier(messageCount) {
        if (messageCount < 10) return 1.0;
        if (messageCount < 50) return 1.2;
        if (messageCount < 100) return 1.5;
        return 2.0;
    },
    
    // Get error-based multiplier
    getErrorMultiplier(errorCount) {
        if (errorCount === 0) return 1.0;
        if (errorCount < 3) return 1.5;
        if (errorCount < 5) return 2.0;
        return 3.0;
    },
    
    // Check if within time restrictions
    isWithinActiveHours() {
        const now = new Date();
        const hour = now.getHours();
        const { start, end } = antiBanConfig.timeRestrictions.activeHours;
        return hour >= start && hour <= end;
    },
    
    // Generate random delay within range
    getRandomDelay(baseDelay) {
        const { minVariation, maxVariation } = antiBanConfig.delays.randomRange;
        const min = baseDelay * minVariation;
        const max = baseDelay * maxVariation;
        return Math.round(Math.random() * (max - min) + min);
    }
};

module.exports = {
    antiBanConfig,
    antiBanHelpers
};
