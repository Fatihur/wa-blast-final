const { app, BrowserWindow, Menu, shell, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;
let serverProcess;
let splashWindow;

// Enable live reload for Electron in development
if (isDev) {
    try {
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
            hardResetMethod: 'exit'
        });
    } catch (error) {
        console.log('Electron reload not available:', error.message);
    }
}

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));

    splashWindow.on('closed', () => {
        splashWindow = null;
    });
}

function createMainWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        show: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        // Open DevTools in development
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL('http://localhost:3000');
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
        }
        mainWindow.show();
        
        // Focus on window
        if (isDev) {
            mainWindow.focus();
        }
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation to external URLs
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:3000') {
            event.preventDefault();
        }
    });
}

function startServer() {
    return new Promise((resolve, reject) => {
        // Start the Express server
        serverProcess = spawn('node', ['server.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let serverStarted = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Server:', output);
            
            if (output.includes('Server running on port 3000') && !serverStarted) {
                serverStarted = true;
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('Server Error:', data.toString());
        });

        serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
        });

        serverProcess.on('error', (error) => {
            console.error('Failed to start server:', error);
            reject(error);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!serverStarted) {
                reject(new Error('Server failed to start within 30 seconds'));
            }
        }, 30000);
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Contact',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'new-contact');
                    }
                },
                {
                    label: 'Import Contacts',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'import-contacts');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'WhatsApp',
            submenu: [
                {
                    label: 'Connect',
                    accelerator: 'CmdOrCtrl+Shift+C',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'connect-whatsapp');
                    }
                },
                {
                    label: 'Disconnect',
                    accelerator: 'CmdOrCtrl+Shift+D',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'disconnect-whatsapp');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Send Test Message',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'test-message');
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Anti-Ban Dashboard',
                    click: () => {
                        mainWindow.loadURL('http://localhost:3000/anti-ban-dashboard.html');
                    }
                },
                {
                    label: 'File Matching',
                    click: () => {
                        mainWindow.loadURL('http://localhost:3000/file-matching.html');
                    }
                },
                {
                    label: 'Logs',
                    click: () => {
                        mainWindow.loadURL('http://localhost:3000/logs.html');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Back to Main',
                    accelerator: 'CmdOrCtrl+Home',
                    click: () => {
                        mainWindow.loadURL('http://localhost:3000');
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About WA Blast',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About WA Blast',
                            message: 'WA Blast Desktop',
                            detail: 'WhatsApp Blast Application with Anti-Ban Protection\nVersion 1.0.0\n\nBuilt with Electron and Node.js'
                        });
                    }
                },
                {
                    label: 'Learn More',
                    click: () => {
                        shell.openExternal('https://github.com');
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Window menu
        template[5].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(async () => {
    createSplashWindow();
    
    try {
        await startServer();
        createMainWindow();
        createMenu();
    } catch (error) {
        console.error('Failed to start application:', error);
        dialog.showErrorBox('Startup Error', 'Failed to start the application server.');
        app.quit();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

// IPC handlers
ipcMain.handle('show-notification', (event, title, body) => {
    new Notification({ title, body }).show();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

// Handle app protocol for deep linking
app.setAsDefaultProtocolClient('wa-blast');
