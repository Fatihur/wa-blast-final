const express = require('express');
const router = express.Router();
const groupStorage = require('../services/groupStorage');
const contactStorage = require('../services/contactStorage');
const logger = require('../utils/logger');

// Get all groups
router.get('/', async (req, res) => {
    try {
        const groups = groupStorage.getGroups();
        const statistics = groupStorage.getGroupStatistics();

        // Add member count to each group
        const groupsWithCounts = groups.map(group => ({
            ...group,
            memberCount: groupStorage.getContactsInGroup(group.id).length
        }));

        res.json({
            success: true,
            groups: groupsWithCounts,
            statistics
        });
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific group with members
router.get('/:groupId', async (req, res) => {
    try {
        const groupId = parseFloat(req.params.groupId);
        const group = groupStorage.getGroup(groupId);
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const membershipData = groupStorage.getContactsInGroup(groupId);
        const allContacts = contactStorage.getContacts();
        
        // Get full contact details for group members
        const members = membershipData.map(membership => {
            const contact = allContacts.find(c => c.id === membership.contactId);
            return contact ? {
                ...contact,
                addedToGroupAt: membership.addedAt
            } : null;
        }).filter(Boolean);

        res.json({
            success: true,
            group: {
                ...group,
                members,
                memberCount: members.length
            }
        });
    } catch (error) {
        console.error('Error getting group:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new group
router.post('/', async (req, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const groupData = {
            name: name.trim(),
            description: description?.trim() || '',
            color: color || '#007bff'
        };

        const newGroup = await groupStorage.createGroup(groupData);
        
        await logger.info('Group created via API', { groupId: newGroup.id, name: newGroup.name });

        res.json({
            success: true,
            group: newGroup,
            message: 'Group created successfully'
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update group
router.put('/:groupId', async (req, res) => {
    try {
        const groupId = parseFloat(req.params.groupId);
        const { name, description, color } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (color !== undefined) updateData.color = color;

        const updatedGroup = await groupStorage.updateGroup(groupId, updateData);
        
        await logger.info('Group updated via API', { groupId, updateData });

        res.json({
            success: true,
            group: updatedGroup,
            message: 'Group updated successfully'
        });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete group
router.delete('/:groupId', async (req, res) => {
    try {
        const groupId = parseFloat(req.params.groupId);
        const deletedGroup = await groupStorage.deleteGroup(groupId);
        
        await logger.info('Group deleted via API', { groupId, name: deletedGroup.name });

        res.json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add contact to group
router.post('/:groupId/contacts/:contactId', async (req, res) => {
    try {
        const groupId = parseFloat(req.params.groupId);
        const contactId = parseInt(req.params.contactId);

        // Verify contact exists
        const contact = contactStorage.getContacts().find(c => c.id === contactId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const membership = await groupStorage.addContactToGroup(groupId, contactId);
        
        await logger.info('Contact added to group via API', { groupId, contactId, contactName: contact.name });

        res.json({
            success: true,
            membership,
            message: 'Contact added to group successfully'
        });
    } catch (error) {
        console.error('Error adding contact to group:', error);
        res.status(400).json({ error: error.message });
    }
});

// Remove contact from group
router.delete('/:groupId/contacts/:contactId', async (req, res) => {
    try {
        const groupId = parseFloat(req.params.groupId);
        const contactId = parseInt(req.params.contactId);

        await groupStorage.removeContactFromGroup(groupId, contactId);
        
        await logger.info('Contact removed from group via API', { groupId, contactId });

        res.json({
            success: true,
            message: 'Contact removed from group successfully'
        });
    } catch (error) {
        console.error('Error removing contact from group:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add multiple contacts to group
router.post('/:groupId/contacts/bulk', async (req, res) => {
    console.log('=== BULK ADD ROUTE CALLED ===');
    try {
        const groupId = parseFloat(req.params.groupId);
        const { contactIds } = req.body;

        console.log('Bulk add request:', { groupId, contactIds });

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ error: 'Contact IDs array is required' });
        }

        // Verify group exists
        const group = groupStorage.getGroup(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Get all contacts to verify they exist
        const allContacts = contactStorage.getContacts();
        console.log('Total contacts available:', allContacts.length);
        console.log('First 3 contact IDs:', allContacts.slice(0, 3).map(c => ({ id: c.id, name: c.name })));
        console.log('Requested contact IDs:', contactIds);

        const results = {
            added: [],
            failed: [],
            alreadyInGroup: []
        };

        for (let contactId of contactIds) {
            try {
                // Ensure contactId is a number
                contactId = parseInt(contactId);
                if (isNaN(contactId)) {
                    console.log(`Invalid contact ID: ${contactId}`);
                    results.failed.push({ contactId, error: 'Invalid contact ID' });
                    continue;
                }

                // Verify contact exists - use Number() for type-safe comparison
                console.log(`Looking for contact with ID: ${contactId} (type: ${typeof contactId})`);
                const contact = allContacts.find(c => {
                    const match = Number(c.id) === Number(contactId);
                    console.log(`Comparing contact ${c.id} (${typeof c.id}) with ${contactId} (${typeof contactId}) = ${match}`);
                    return match;
                });
                if (!contact) {
                    console.log(`Contact not found for ID: ${contactId}`);
                    console.log(`Available contact IDs: ${allContacts.slice(0, 5).map(c => c.id).join(', ')}`);
                    results.failed.push({ contactId, error: 'Contact not found' });
                    continue;
                }
                console.log(`Found contact: ${contact.name} (ID: ${contact.id})`);

                const membership = await groupStorage.addContactToGroup(groupId, contactId);
                results.added.push({ contactId, membership });
                console.log(`Successfully added contact ${contactId} (${contact.name}) to group ${group.name}`);
            } catch (error) {
                console.log(`Failed to add contact ${contactId} to group ${group.name}:`, error.message);
                if (error.message.includes('already in this group')) {
                    results.alreadyInGroup.push(contactId);
                } else {
                    results.failed.push({ contactId, error: error.message });
                }
            }
        }

        await logger.info('Bulk contact addition to group via API', {
            groupId,
            groupName: group.name,
            added: results.added.length,
            failed: results.failed.length,
            alreadyInGroup: results.alreadyInGroup.length,
            totalRequested: contactIds.length
        });

        console.log('Bulk add results:', results);

        res.json({
            success: true,
            results,
            message: `Added ${results.added.length} contacts to group`
        });
    } catch (error) {
        console.error('Error bulk adding contacts to group:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get contacts for a group (with pagination and search)
router.get('/:groupId/contacts', async (req, res) => {
    try {
        const groupId = parseFloat(req.params.groupId);
        const { search, page = 1, limit = 50 } = req.query;

        const group = groupStorage.getGroup(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const membershipData = groupStorage.getContactsInGroup(groupId);
        const allContacts = contactStorage.getContacts();
        
        let members = membershipData.map(membership => {
            const contact = allContacts.find(c => c.id === membership.contactId);
            return contact ? {
                ...contact,
                addedToGroupAt: membership.addedAt
            } : null;
        }).filter(Boolean);

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            members = members.filter(contact => 
                (contact.name || '').toLowerCase().includes(searchLower) ||
                (contact.number || '').includes(search) ||
                (contact.email || '').toLowerCase().includes(searchLower) ||
                (contact.company || '').toLowerCase().includes(searchLower)
            );
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedMembers = members.slice(startIndex, endIndex);

        res.json({
            success: true,
            group: {
                id: group.id,
                name: group.name
            },
            contacts: paginatedMembers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: members.length,
                totalPages: Math.ceil(members.length / limit)
            }
        });
    } catch (error) {
        console.error('Error getting group contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get groups for a specific contact
router.get('/contact/:contactId', async (req, res) => {
    try {
        const contactId = parseInt(req.params.contactId);
        
        // Verify contact exists
        const contact = contactStorage.getContacts().find(c => c.id === contactId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const groups = groupStorage.getGroupsForContact(contactId);

        res.json({
            success: true,
            contact: {
                id: contact.id,
                name: contact.name,
                number: contact.number
            },
            groups
        });
    } catch (error) {
        console.error('Error getting contact groups:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
