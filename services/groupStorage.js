const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class GroupStorage {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.storageFile = path.join(this.dataDir, 'groups.json');
        this.groups = [];
        this.groupMemberships = []; // Array of {groupId, contactId} relationships
        this.init();
    }

    async init() {
        try {
            // Ensure data directory exists
            await fs.ensureDir(this.dataDir);
            await this.loadGroups();
        } catch (error) {
            await logger.error('Error initializing group storage', error);
        }
    }

    async loadGroups() {
        try {
            if (await fs.pathExists(this.storageFile)) {
                const data = await fs.readFile(this.storageFile, 'utf8');
                const parsed = JSON.parse(data);
                this.groups = parsed.groups || [];
                this.groupMemberships = parsed.groupMemberships || [];
                await logger.info(`Loaded ${this.groups.length} groups and ${this.groupMemberships.length} memberships from storage`);
            }
        } catch (error) {
            await logger.error('Error loading groups from storage', error);
            this.groups = [];
            this.groupMemberships = [];
        }
    }

    async saveGroups() {
        try {
            const data = {
                groups: this.groups,
                groupMemberships: this.groupMemberships,
                lastUpdated: new Date().toISOString(),
                totalGroups: this.groups.length,
                totalMemberships: this.groupMemberships.length
            };
            
            await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2));
            await logger.info(`Saved ${this.groups.length} groups and ${this.groupMemberships.length} memberships to storage`);
        } catch (error) {
            await logger.error('Error saving groups to storage', error);
            throw error;
        }
    }

    async createGroup(groupData) {
        try {
            // Check if group name already exists
            const existingGroup = this.groups.find(g => g.name.toLowerCase() === groupData.name.toLowerCase());
            if (existingGroup) {
                throw new Error('Group name already exists');
            }

            const newGroup = {
                id: Date.now() + Math.random(), // Unique ID
                name: groupData.name,
                description: groupData.description || '',
                color: groupData.color || '#007bff',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.groups.push(newGroup);
            await this.saveGroups();
            
            await logger.info(`Created new group: ${newGroup.name}`);
            return newGroup;
        } catch (error) {
            await logger.error('Error creating group', error);
            throw error;
        }
    }

    async updateGroup(groupId, updateData) {
        try {
            const groupIndex = this.groups.findIndex(g => g.id === groupId);
            if (groupIndex === -1) {
                throw new Error('Group not found');
            }

            // Check if new name conflicts with existing groups (excluding current group)
            if (updateData.name) {
                const existingGroup = this.groups.find(g => 
                    g.id !== groupId && g.name.toLowerCase() === updateData.name.toLowerCase()
                );
                if (existingGroup) {
                    throw new Error('Group name already exists');
                }
            }

            const updatedGroup = {
                ...this.groups[groupIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            this.groups[groupIndex] = updatedGroup;
            await this.saveGroups();
            
            await logger.info(`Updated group: ${updatedGroup.name}`);
            return updatedGroup;
        } catch (error) {
            await logger.error('Error updating group', error);
            throw error;
        }
    }

    async deleteGroup(groupId) {
        try {
            const groupIndex = this.groups.findIndex(g => g.id === groupId);
            if (groupIndex === -1) {
                throw new Error('Group not found');
            }

            const deletedGroup = this.groups[groupIndex];
            
            // Remove group
            this.groups.splice(groupIndex, 1);
            
            // Remove all memberships for this group
            this.groupMemberships = this.groupMemberships.filter(m => m.groupId !== groupId);
            
            await this.saveGroups();
            
            await logger.info(`Deleted group: ${deletedGroup.name}`);
            return deletedGroup;
        } catch (error) {
            await logger.error('Error deleting group', error);
            throw error;
        }
    }

    async addContactToGroup(groupId, contactId) {
        try {
            // Check if group exists
            const group = this.groups.find(g => g.id === groupId);
            if (!group) {
                throw new Error('Group not found');
            }

            // Check if membership already exists
            const existingMembership = this.groupMemberships.find(m => 
                m.groupId === groupId && m.contactId === contactId
            );
            if (existingMembership) {
                throw new Error('Contact is already in this group');
            }

            const membership = {
                groupId,
                contactId,
                addedAt: new Date().toISOString()
            };

            this.groupMemberships.push(membership);
            await this.saveGroups();
            
            await logger.info(`Added contact ${contactId} to group ${group.name}`);
            return membership;
        } catch (error) {
            await logger.error('Error adding contact to group', error);
            throw error;
        }
    }

    async removeContactFromGroup(groupId, contactId) {
        try {
            const membershipIndex = this.groupMemberships.findIndex(m => 
                m.groupId === groupId && m.contactId === contactId
            );
            
            if (membershipIndex === -1) {
                throw new Error('Contact is not in this group');
            }

            this.groupMemberships.splice(membershipIndex, 1);
            await this.saveGroups();
            
            await logger.info(`Removed contact ${contactId} from group ${groupId}`);
            return true;
        } catch (error) {
            await logger.error('Error removing contact from group', error);
            throw error;
        }
    }

    getGroups() {
        return [...this.groups];
    }

    getGroup(groupId) {
        return this.groups.find(g => g.id === groupId);
    }

    getGroupsForContact(contactId) {
        const contactMemberships = this.groupMemberships.filter(m => m.contactId === contactId);
        return contactMemberships.map(m => {
            const group = this.groups.find(g => g.id === m.groupId);
            return {
                ...group,
                addedAt: m.addedAt
            };
        }).filter(g => g.id); // Filter out any groups that might have been deleted
    }

    getContactsInGroup(groupId) {
        return this.groupMemberships
            .filter(m => m.groupId === groupId)
            .map(m => ({
                contactId: m.contactId,
                addedAt: m.addedAt
            }));
    }

    getGroupStatistics() {
        const stats = {
            totalGroups: this.groups.length,
            totalMemberships: this.groupMemberships.length,
            groupsWithContacts: 0,
            averageContactsPerGroup: 0
        };

        if (this.groups.length > 0) {
            const groupsWithMembers = new Set(this.groupMemberships.map(m => m.groupId));
            stats.groupsWithContacts = groupsWithMembers.size;
            stats.averageContactsPerGroup = Math.round(this.groupMemberships.length / this.groups.length * 100) / 100;
        }

        return stats;
    }

    async clearAllGroups() {
        try {
            this.groups = [];
            this.groupMemberships = [];
            await this.saveGroups();
            await logger.info('All groups and memberships cleared from storage');
        } catch (error) {
            await logger.error('Error clearing groups', error);
            throw error;
        }
    }
}

// Create singleton instance
const groupStorage = new GroupStorage();

module.exports = groupStorage;
