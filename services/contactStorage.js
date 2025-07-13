const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class ContactStorage {
    constructor() {
        this.storageFile = path.join('./data', 'contacts.json');
        this.contacts = [];
        this.headers = [];
        this.init();
    }

    async init() {
        try {
            // Ensure data directory exists
            await fs.ensureDir('./data');
            
            // Load existing contacts
            await this.loadContacts();
        } catch (error) {
            await logger.error('Error initializing contact storage', error);
        }
    }

    async loadContacts() {
        try {
            if (await fs.pathExists(this.storageFile)) {
                const data = await fs.readFile(this.storageFile, 'utf8');
                const parsed = JSON.parse(data);
                this.contacts = parsed.contacts || [];
                this.headers = parsed.headers || [];
                await logger.info(`Loaded ${this.contacts.length} contacts from storage`);
            }
        } catch (error) {
            await logger.error('Error loading contacts from storage', error);
            this.contacts = [];
            this.headers = [];
        }
    }

    async saveContacts() {
        try {
            const data = {
                contacts: this.contacts,
                headers: this.headers,
                lastUpdated: new Date().toISOString(),
                totalContacts: this.contacts.length
            };
            
            await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2));
            await logger.info(`Saved ${this.contacts.length} contacts to storage`);
        } catch (error) {
            await logger.error('Error saving contacts to storage', error);
            throw error;
        }
    }

    async addContacts(contacts, headers = []) {
        try {
            // Store headers from imported file
            this.headers = [...new Set([...this.headers, ...headers])];
            
            // Add unique ID and timestamp to each contact
            const newContacts = contacts.map((contact, index) => ({
                ...contact,
                id: Date.now() + index,
                importedAt: new Date().toISOString(),
                selected: true // Default selected
            }));

            // Merge with existing contacts (avoid duplicates by phone number)
            const existingNumbers = new Set(this.contacts.map(c => c.number));
            const uniqueContacts = newContacts.filter(c => !existingNumbers.has(c.number));
            
            this.contacts = [...this.contacts, ...uniqueContacts];
            
            await this.saveContacts();
            
            return {
                added: uniqueContacts.length,
                duplicates: newContacts.length - uniqueContacts.length,
                total: this.contacts.length
            };
        } catch (error) {
            await logger.error('Error adding contacts', error);
            throw error;
        }
    }

    async updateContact(id, updates) {
        try {
            const index = this.contacts.findIndex(c => c.id === id);
            if (index !== -1) {
                this.contacts[index] = { ...this.contacts[index], ...updates };
                await this.saveContacts();
                return this.contacts[index];
            }
            return null;
        } catch (error) {
            await logger.error('Error updating contact', error);
            throw error;
        }
    }

    async deleteContact(id) {
        try {
            const index = this.contacts.findIndex(c => c.id === id);
            if (index !== -1) {
                const deleted = this.contacts.splice(index, 1)[0];
                await this.saveContacts();
                return deleted;
            }
            return null;
        } catch (error) {
            await logger.error('Error deleting contact', error);
            throw error;
        }
    }

    async clearContacts() {
        try {
            this.contacts = [];
            this.headers = [];
            await this.saveContacts();
            await logger.info('All contacts cleared from storage');
        } catch (error) {
            await logger.error('Error clearing contacts', error);
            throw error;
        }
    }

    getContacts(filters = {}) {
        let filtered = [...this.contacts];

        // Apply filters
        if (filters.selected !== undefined) {
            filtered = filtered.filter(c => c.selected === filters.selected);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(c => 
                (c.name || '').toLowerCase().includes(search) ||
                (c.number || '').includes(search) ||
                (c.email || '').toLowerCase().includes(search) ||
                (c.company || '').toLowerCase().includes(search)
            );
        }

        return filtered;
    }

    getHeaders() {
        return this.headers;
    }

    getContactById(id) {
        return this.contacts.find(c => c.id === id);
    }

    getSelectedContacts() {
        return this.contacts.filter(c => c.selected);
    }

    async updateContactSelection(id, selected) {
        return await this.updateContact(id, { selected });
    }

    async selectAllContacts(selected = true) {
        try {
            this.contacts = this.contacts.map(c => ({ ...c, selected }));
            await this.saveContacts();
            return this.contacts.length;
        } catch (error) {
            await logger.error('Error updating contact selection', error);
            throw error;
        }
    }

    getStatistics() {
        const total = this.contacts.length;
        const selected = this.contacts.filter(c => c.selected).length;
        const unselected = total - selected;
        
        return {
            total,
            selected,
            unselected,
            headers: this.headers,
            lastUpdated: this.contacts.length > 0 ? 
                Math.max(...this.contacts.map(c => new Date(c.importedAt || 0).getTime())) : null
        };
    }

    // Export contacts to various formats
    async exportContacts(format = 'json') {
        try {
            const data = {
                contacts: this.contacts,
                headers: this.headers,
                exportedAt: new Date().toISOString(),
                total: this.contacts.length
            };

            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(data, null, 2);
                
                case 'csv':
                    if (this.contacts.length === 0) return '';
                    
                    const headers = this.headers.length > 0 ? this.headers : Object.keys(this.contacts[0]);
                    const csvHeaders = headers.join(',');
                    const csvRows = this.contacts.map(contact => 
                        headers.map(header => `"${(contact[header] || '').toString().replace(/"/g, '""')}"`).join(',')
                    );
                    
                    return [csvHeaders, ...csvRows].join('\n');
                
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            await logger.error('Error exporting contacts', error);
            throw error;
        }
    }
}

module.exports = new ContactStorage();
