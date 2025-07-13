/**
 * Utility functions for message formatting and variable replacement
 */

/**
 * Format rich text for WhatsApp
 * Supports: *bold*, _italic_, ~strikethrough~, ```monospace```
 */
function formatRichText(text) {
    if (!text) return '';
    
    let formatted = text;
    
    // Bold: *text* -> *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, '*$1*');
    
    // Italic: _text_ -> _text_
    formatted = formatted.replace(/_([^_]+)_/g, '_$1_');
    
    // Strikethrough: ~text~ -> ~text~
    formatted = formatted.replace(/~([^~]+)~/g, '~$1~');
    
    // Monospace: ```text``` -> ```text```
    formatted = formatted.replace(/```([^`]+)```/g, '```$1```');
    
    return formatted;
}

/**
 * Replace variables in message with contact data
 * Supports: {{name}}, {{number}}, {{email}}, etc.
 */
function replaceVariables(message, contact, customVariables = {}) {
    if (!message) return '';
    
    let result = message;
    
    // Replace contact fields
    const contactFields = {
        name: contact.name || '',
        number: contact.number || '',
        email: contact.email || '',
        company: contact.company || '',
        address: contact.address || '',
        notes: contact.notes || ''
    };
    
    // Replace standard contact variables
    Object.keys(contactFields).forEach(key => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        result = result.replace(regex, contactFields[key]);
    });
    
    // Replace custom variables
    Object.keys(customVariables).forEach(key => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        result = result.replace(regex, customVariables[key]);
    });
    
    // Replace any additional contact fields
    Object.keys(contact).forEach(key => {
        if (!contactFields.hasOwnProperty(key)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            result = result.replace(regex, contact[key] || '');
        }
    });
    
    // Add date/time variables
    const now = new Date();
    const dateVariables = {
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID'),
        datetime: now.toLocaleString('id-ID'),
        day: now.toLocaleDateString('id-ID', { weekday: 'long' }),
        month: now.toLocaleDateString('id-ID', { month: 'long' }),
        year: now.getFullYear().toString()
    };
    
    Object.keys(dateVariables).forEach(key => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        result = result.replace(regex, dateVariables[key]);
    });
    
    return result;
}

/**
 * Extract variables from message template
 */
function extractVariables(message) {
    if (!message) return [];
    
    const variableRegex = /{{([^}]+)}}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(message)) !== null) {
        const variable = match[1].trim();
        if (!variables.includes(variable)) {
            variables.push(variable);
        }
    }
    
    return variables;
}

/**
 * Validate message template
 */
function validateTemplate(message, contacts = []) {
    const errors = [];
    const warnings = [];
    
    if (!message || message.trim() === '') {
        errors.push('Message cannot be empty');
        return { isValid: false, errors, warnings };
    }
    
    // Extract variables from template
    const variables = extractVariables(message);
    
    if (contacts.length > 0) {
        // Check if all variables can be resolved for all contacts
        const sampleContact = contacts[0];
        const availableFields = Object.keys(sampleContact);
        
        variables.forEach(variable => {
            const isStandardField = ['name', 'number', 'email', 'company', 'address', 'notes'].includes(variable.toLowerCase());
            const isDateField = ['date', 'time', 'datetime', 'day', 'month', 'year'].includes(variable.toLowerCase());
            const isAvailableField = availableFields.includes(variable);
            
            if (!isStandardField && !isDateField && !isAvailableField) {
                warnings.push(`Variable "{{${variable}}}" may not be available for all contacts`);
            }
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        variables
    };
}

/**
 * Preview message with sample data
 */
function previewMessage(message, sampleContact = null) {
    const defaultContact = {
        name: 'John Doe',
        number: '628123456789',
        email: 'john@example.com',
        company: 'ABC Company',
        address: 'Jakarta, Indonesia',
        notes: 'Sample contact'
    };
    
    const contact = sampleContact || defaultContact;
    const preview = replaceVariables(message, contact);
    
    return {
        original: message,
        preview: formatRichText(preview),
        contact
    };
}

/**
 * Count message length and estimate parts
 */
function analyzeMessage(message) {
    if (!message) return { length: 0, parts: 0, type: 'text' };
    
    const length = message.length;
    let parts = 1;
    
    // SMS part calculation (rough estimate)
    if (length > 160) {
        parts = Math.ceil(length / 153); // 153 chars per part for concatenated SMS
    }
    
    // Check if message contains rich formatting
    const hasFormatting = /[*_~`]/.test(message);
    
    return {
        length,
        parts,
        type: hasFormatting ? 'rich' : 'text',
        hasFormatting
    };
}

module.exports = {
    formatRichText,
    replaceVariables,
    extractVariables,
    validateTemplate,
    previewMessage,
    analyzeMessage
};
