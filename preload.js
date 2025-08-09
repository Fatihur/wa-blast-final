const { contextBridge, ipcRenderer } = require('electron');

// Helper function to handle IPC invocations with timeout
async function invokeWithTimeout(channel, ...args) {
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`IPC ${channel} timed out after 5000ms`)), 5000);
        });
        const responsePromise = ipcRenderer.invoke(channel, ...args);
        const response = await Promise.race([responsePromise, timeoutPromise]);
        return response;
    } catch (error) {
        console.error(`Error in IPC ${channel}:`, error);
        throw error;
    }
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Notification API
    showNotification: (title, body) => invokeWithTimeout('show-notification', title, body),
    
    // Dialog API
    showSaveDialog: (options) => invokeWithTimeout('show-save-dialog', options),
    showOpenDialog: (options) => invokeWithTimeout('show-open-dialog', options),
    
    // Menu actions
    onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
    removeMenuActionListener: (callback) => ipcRenderer.removeListener('menu-action', callback),
    
    // App info
    platform: process.platform,
    isElectron: true,
    
    // File system operations (limited)
    selectFile: async (options = {}) => {
        const defaultOptions = {
            properties: ['openFile'],
            filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        };
        return await invokeWithTimeout('show-open-dialog', { ...defaultOptions, ...options });
    },
    
    selectMultipleFiles: async (options = {}) => {
        const defaultOptions = {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        };
        return await invokeWithTimeout('show-open-dialog', { ...defaultOptions, ...options });
    },
    
    selectFolder: async () => {
        return await invokeWithTimeout('show-open-dialog', {
            properties: ['openDirectory']
        });
    },
    
    saveFile: async (options = {}) => {
        const defaultOptions = {
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        };
        return await invokeWithTimeout('show-save-dialog', { ...defaultOptions, ...options });
    }
});

// Enhanced notification system for desktop
contextBridge.exposeInMainWorld('desktopNotifications', {
    success: (title, message) => {
        invokeWithTimeout('show-notification', title || 'Success', message);
    },
    
    error: (title, message) => {
        invokeWithTimeout('show-notification', title || 'Error', message);
    },
    
    info: (title, message) => {
        invokeWithTimeout('show-notification', title || 'Information', message);
    },
    
    warning: (title, message) => {
        invokeWithTimeout('show-notification', title || 'Warning', message);
    },
    
    blast: (title, message) => {
        invokeWithTimeout('show-notification', title || 'Blast Update', message);
    }
});

// Desktop-specific utilities
contextBridge.exposeInMainWorld('desktopUtils', {
    // Check if running in desktop mode
    isDesktop: () => true,
    
    // Get platform info
    getPlatform: () => process.platform,
    
    // App version (you can set this dynamically)
    getVersion: () => '1.0.0',
    
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    
    // Theme detection
    isDarkMode: () => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    
    // Listen for theme changes
    onThemeChange: (callback) => {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', callback);
            return () => mediaQuery.removeEventListener('change', callback);
        }
        return () => {};
    }
});

// Enhanced file operations for desktop
contextBridge.exposeInMainWorld('desktopFiles', {
    // Import contacts with better UX
    importContacts: async () => {
        const result = await ipcRenderer.invoke('show-open-dialog', {
            title: 'Import Contacts',
            properties: ['openFile'],
            filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        return result;
    },
    
    // Import documents for file matching
    importDocuments: async () => {
        const result = await ipcRenderer.invoke('show-open-dialog', {
            title: 'Select Documents Folder',
            properties: ['openDirectory']
        });
        return result;
    },
    
    // Export logs
    exportLogs: async () => {
        const result = await ipcRenderer.invoke('show-save-dialog', {
            title: 'Export Logs',
            defaultPath: `wa-blast-logs-${new Date().toISOString().split('T')[0]}.xlsx`,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        return result;
    },
    
    // Export contacts
    exportContacts: async () => {
        const result = await ipcRenderer.invoke('show-save-dialog', {
            title: 'Export Contacts',
            defaultPath: `contacts-${new Date().toISOString().split('T')[0]}.xlsx`,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        return result;
    }
});

// Desktop keyboard shortcuts
contextBridge.exposeInMainWorld('desktopShortcuts', {
    // Register shortcuts
    register: (shortcuts) => {
        // This would be handled by the main process
        ipcRenderer.send('register-shortcuts', shortcuts);
    },
    
    // Common shortcuts info
    getShortcuts: () => {
        return {
            newContact: 'Ctrl+N',
            importContacts: 'Ctrl+I',
            connectWhatsApp: 'Ctrl+Shift+C',
            disconnectWhatsApp: 'Ctrl+Shift+D',
            testMessage: 'Ctrl+T',
            backToMain: 'Ctrl+Home',
            quit: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q'
        };
    }
});

// Desktop window management
contextBridge.exposeInMainWorld('desktopWindow', {
    // Set window title
    setTitle: (title) => {
        document.title = title;
    },
    
    // Get window info
    getInfo: () => {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            isMaximized: window.outerWidth === screen.width && window.outerHeight === screen.height
        };
    },
    
    // Focus window
    focus: () => {
        window.focus();
    }
});

// Console logging for debugging
console.log('Preload script loaded successfully');
console.log('Platform:', process.platform);
console.log('Electron APIs exposed to renderer process');
