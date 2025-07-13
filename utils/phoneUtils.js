/**
 * Utility functions for phone number formatting and validation
 */

/**
 * Format phone number to Indonesian WhatsApp format (62xxxxxxxxx)
 * @param {string} number - Input phone number
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(number) {
    if (!number) return '';
    
    // Remove all non-digit characters
    let cleaned = number.toString().replace(/\D/g, '');
    
    // Handle different Indonesian number formats
    if (cleaned.startsWith('0')) {
        // 08xxxxxxxxx -> 628xxxxxxxxx
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        // 8xxxxxxxxx -> 628xxxxxxxxx
        cleaned = '62' + cleaned;
    } else if (cleaned.startsWith('628')) {
        // Already in correct format
        cleaned = cleaned;
    } else if (cleaned.startsWith('62')) {
        // 62xxxxxxxxx (might be missing 8)
        if (cleaned.length >= 10 && !cleaned.startsWith('628')) {
            // 62xxxxxxxxx -> 628xxxxxxxxx (add missing 8)
            cleaned = '628' + cleaned.substring(2);
        }
    } else if (cleaned.startsWith('+62')) {
        // +628xxxxxxxxx -> 628xxxxxxxxx
        cleaned = cleaned.substring(1);
    } else {
        // Assume it's Indonesian number without country code
        cleaned = '62' + cleaned;
    }
    
    return cleaned;
}

/**
 * Validate Indonesian phone number
 * @param {string} number - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidIndonesianNumber(number) {
    if (!number) return false;
    
    const formatted = formatPhoneNumber(number);
    
    // Indonesian mobile numbers: 628xxxxxxxxx (10-13 digits after 628)
    const indonesianPattern = /^628[0-9]{8,11}$/;
    
    return indonesianPattern.test(formatted);
}

/**
 * Get phone number display format
 * @param {string} number - Phone number
 * @returns {string} - Display format (e.g., +62 812-3456-7890)
 */
function getDisplayFormat(number) {
    const formatted = formatPhoneNumber(number);
    
    if (formatted.length >= 12) {
        // 628123456789 -> +62 812-3456-7890
        const countryCode = formatted.substring(0, 2);
        const areaCode = formatted.substring(2, 5);
        const part1 = formatted.substring(5, 9);
        const part2 = formatted.substring(9);
        
        return `+${countryCode} ${areaCode}-${part1}-${part2}`;
    }
    
    return `+${formatted}`;
}

/**
 * Parse and validate multiple phone numbers
 * @param {Array} numbers - Array of phone numbers
 * @returns {Object} - Object with valid and invalid numbers
 */
function parsePhoneNumbers(numbers) {
    const valid = [];
    const invalid = [];
    
    numbers.forEach((number, index) => {
        const original = number;
        const formatted = formatPhoneNumber(number);
        
        if (isValidIndonesianNumber(formatted)) {
            valid.push({
                original,
                formatted,
                display: getDisplayFormat(formatted),
                index
            });
        } else {
            invalid.push({
                original,
                formatted,
                error: 'Invalid Indonesian phone number format',
                index
            });
        }
    });
    
    return { valid, invalid };
}

/**
 * Auto-format phone number as user types
 * @param {string} input - Current input
 * @returns {string} - Formatted input for display
 */
function autoFormatInput(input) {
    if (!input) return '';
    
    // Remove non-digits
    let digits = input.replace(/\D/g, '');
    
    // Limit length
    if (digits.length > 15) {
        digits = digits.substring(0, 15);
    }
    
    // Format for display while typing
    if (digits.startsWith('0')) {
        // 08xx-xxxx-xxxx
        if (digits.length > 4) {
            return digits.substring(0, 4) + '-' + 
                   (digits.length > 8 ? digits.substring(4, 8) + '-' + digits.substring(8) : digits.substring(4));
        }
        return digits;
    } else if (digits.startsWith('62')) {
        // +62 8xx-xxxx-xxxx
        if (digits.length > 5) {
            return '+62 ' + digits.substring(2, 5) + 
                   (digits.length > 9 ? '-' + digits.substring(5, 9) + 
                   (digits.length > 9 ? '-' + digits.substring(9) : '') : '-' + digits.substring(5));
        } else if (digits.length > 2) {
            return '+62 ' + digits.substring(2);
        }
        return '+' + digits;
    } else {
        // 8xx-xxxx-xxxx
        if (digits.length > 3) {
            return digits.substring(0, 3) + '-' + 
                   (digits.length > 7 ? digits.substring(3, 7) + '-' + digits.substring(7) : digits.substring(3));
        }
        return digits;
    }
}

/**
 * Get WhatsApp JID format
 * @param {string} number - Phone number
 * @returns {string} - WhatsApp JID format
 */
function getWhatsAppJID(number) {
    const formatted = formatPhoneNumber(number);
    return formatted.includes('@') ? formatted : `${formatted}@s.whatsapp.net`;
}

/**
 * Detect number format and provide suggestions
 * @param {string} number - Input number
 * @returns {Object} - Detection result with suggestions
 */
function detectNumberFormat(number) {
    if (!number) return { format: 'empty', suggestions: [] };
    
    const cleaned = number.replace(/\D/g, '');
    const suggestions = [];
    
    if (cleaned.startsWith('0')) {
        return {
            format: 'local',
            description: 'Indonesian local format (08xx)',
            formatted: formatPhoneNumber(cleaned),
            suggestions: [
                `Convert to international: ${formatPhoneNumber(cleaned)}`,
                `Display format: ${getDisplayFormat(cleaned)}`
            ]
        };
    } else if (cleaned.startsWith('628')) {
        return {
            format: 'international',
            description: 'Indonesian international format',
            formatted: cleaned,
            suggestions: [
                `Already in correct format: ${cleaned}`,
                `Display format: ${getDisplayFormat(cleaned)}`
            ]
        };
    } else if (cleaned.startsWith('62')) {
        return {
            format: 'partial_international',
            description: 'Partial international format',
            formatted: formatPhoneNumber(cleaned),
            suggestions: [
                `Corrected format: ${formatPhoneNumber(cleaned)}`,
                `Display format: ${getDisplayFormat(cleaned)}`
            ]
        };
    } else if (cleaned.startsWith('8')) {
        return {
            format: 'mobile_only',
            description: 'Mobile number without country code',
            formatted: formatPhoneNumber(cleaned),
            suggestions: [
                `Add country code: ${formatPhoneNumber(cleaned)}`,
                `Display format: ${getDisplayFormat(cleaned)}`
            ]
        };
    } else {
        return {
            format: 'unknown',
            description: 'Unknown format',
            formatted: formatPhoneNumber(cleaned),
            suggestions: [
                'Please check the number format',
                'Indonesian numbers should start with 08, 628, or 8'
            ]
        };
    }
}

module.exports = {
    formatPhoneNumber,
    isValidIndonesianNumber,
    getDisplayFormat,
    parsePhoneNumbers,
    autoFormatInput,
    getWhatsAppJID,
    detectNumberFormat
};
