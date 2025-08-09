// Connection Status Page JavaScript

class ConnectionStatusApp {
    constructor() {
        this.socket = io();
        this.isConnected = false;
        this.connectionStartTime = null;
        this.messagesSent = 0;
        this.connectionErrors = 0;
        this.signalQuality = 'Unknown';
        this.loadStatisticsFromStorage();
        this.init();
    }

    init() {
        console.log('🚀 Initializing ConnectionStatusApp');
        console.log('📊 Initial statistics:', {
            messagesSent: this.messagesSent,
            connectionErrors: this.connectionErrors,
            connectionStartTime: this.connectionStartTime
        });

        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupGlobalFunctions();
        this.updateConnectionStatus();
        this.updateStatistics();
        this.startUptimeTimer();
        this.checkInitialStatus();

        console.log('✅ ConnectionStatusApp initialized');
    }

    loadStatisticsFromStorage() {
        try {
            const savedStats = localStorage.getItem('whatsapp-connection-stats');
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                this.messagesSent = stats.messagesSent || 0;
                this.connectionErrors = stats.connectionErrors || 0;
                
                // Load connection start time if exists and connection is still active
                if (stats.connectionStartTime && stats.wasConnected) {
                    this.connectionStartTime = new Date(stats.connectionStartTime);
                }
                
                console.log('📊 Loaded statistics from storage:', stats);
            }
        } catch (error) {
            console.error('Error loading statistics from storage:', error);
            // Reset to defaults if corrupted
            this.messagesSent = 0;
            this.connectionErrors = 0;
        }
    }

    saveStatisticsToStorage() {
        try {
            const stats = {
                messagesSent: this.messagesSent,
                connectionErrors: this.connectionErrors,
                connectionStartTime: this.connectionStartTime ? this.connectionStartTime.toISOString() : null,
                wasConnected: this.isConnected,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('whatsapp-connection-stats', JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving statistics to storage:', error);
        }
    }

    setupEventListeners() {
        // Connect button
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWhatsApp());
        }

        // New connection button
        const newConnectionBtn = document.getElementById('newConnectionBtn');
        if (newConnectionBtn) {
            newConnectionBtn.addEventListener('click', () => this.newConnection());
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnectBtn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectWhatsApp());
        }

        // Reset statistics button
        const resetStatsBtn = document.getElementById('resetStatsBtn');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
                    this.resetStatistics();
                }
            });
        }
    }

    setupSocketListeners() {
        // WhatsApp status updates
        this.socket.on('whatsapp-status', (data) => {
            console.log('Received whatsapp-status event:', data);

            const wasConnected = this.isConnected;
            this.isConnected = data.isConnected;

            // Update QR code if available
            if (data.qrCode) {
                this.displayQRCode(data.qrCode);
            } else if (data.status === 'connected') {
                // Clear QR code when connected
                this.displayQRCode(null);
            }

            // Handle connection state changes
            if (!wasConnected && this.isConnected) {
                // Just connected
                this.connectionStartTime = new Date();
                this.saveStatisticsToStorage();
                this.showAlert('WhatsApp connected successfully!', 'success');
                console.log('✅ WhatsApp connected at:', this.connectionStartTime);
            } else if (wasConnected && !this.isConnected) {
                // Just disconnected
                this.connectionStartTime = null;
                this.saveStatisticsToStorage();
                this.showAlert('WhatsApp disconnected', 'warning');
                console.log('❌ WhatsApp disconnected');
            }

            // Update status display
            this.updateConnectionStatus();
        });

        // Message sent event
        this.socket.on('message-sent', () => {
            this.messagesSent++;
            this.updateStatistics();
            this.saveStatisticsToStorage();
            console.log('📤 Message sent count updated:', this.messagesSent);
        });

        // Connection error event
        this.socket.on('connection-error', () => {
            this.connectionErrors++;
            this.updateStatistics();
            this.saveStatisticsToStorage();
            console.log('❌ Connection error count updated:', this.connectionErrors);
        });
    }

    updateConnectionStatus() {
        const statusIcon = document.getElementById('connectionStatusIcon');
        const statusText = document.getElementById('connectionStatusText');
        const statusDescription = document.getElementById('connectionStatusDescription');
        const statusBadge = document.getElementById('connectionStatusBadge');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const newConnectionBtn = document.getElementById('newConnectionBtn');

        if (this.isConnected) {
            // Update status icon
            if (statusIcon) {
                statusIcon.innerHTML = '<i class="fas fa-check"></i>';
                statusIcon.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success';
            }

            // Update status text
            if (statusText) {
                statusText.textContent = 'Connected';
                statusText.className = 'mt-3 mb-1 text-success';
            }

            // Update status description
            if (statusDescription) {
                statusDescription.textContent = 'WhatsApp is connected and ready to send messages';
                statusDescription.className = 'text-success';
            }

            // Update status badge
            if (statusBadge) {
                statusBadge.innerHTML = '<i class="fas fa-circle me-1"></i>Connected';
                statusBadge.className = 'badge bg-success';
            }

            // Update buttons
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
            if (connectBtn) connectBtn.style.display = 'none';
            if (newConnectionBtn) newConnectionBtn.style.display = 'none';

            // Start connection timer if not already started
            if (!this.connectionStartTime) {
                this.connectionStartTime = new Date();
            }
        } else {
            // Update status icon
            if (statusIcon) {
                statusIcon.innerHTML = '<i class="fas fa-times"></i>';
                statusIcon.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
            }

            // Update status text
            if (statusText) {
                statusText.textContent = 'Disconnected';
                statusText.className = 'mt-3 mb-1 text-danger';
            }

            // Update status description
            if (statusDescription) {
                statusDescription.textContent = 'Click connect to start WhatsApp session';
                statusDescription.className = 'text-muted';
            }

            // Update status badge
            if (statusBadge) {
                statusBadge.innerHTML = '<i class="fas fa-circle me-1"></i>Disconnected';
                statusBadge.className = 'badge bg-danger';
            }

            // Update buttons
            if (disconnectBtn) disconnectBtn.style.display = 'none';
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (newConnectionBtn) newConnectionBtn.style.display = 'inline-block';

            // Reset connection timer
            this.connectionStartTime = null;
        }

        this.updateStatistics();
    }



    async newConnection() {
        try {
            this.showLoading('Generating new QR code...');

            const response = await fetch('/api/messages/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fresh: true })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('New QR Code generated. Please scan with your WhatsApp app.', 'info');
            } else {
                throw new Error(data.error || 'Failed to create new connection');
            }
        } catch (error) {
            console.error('Error creating new connection:', error);
            this.showAlert('Error creating new connection: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async disconnectWhatsApp() {
        try {
            this.showLoading('Disconnecting WhatsApp...');

            const response = await fetch('/api/messages/disconnect', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                this.isConnected = false;
                this.updateConnectionStatus();
                this.showAlert('WhatsApp disconnected successfully', 'success');
            } else {
                throw new Error(data.error || 'Failed to disconnect');
            }
        } catch (error) {
            console.error('Error disconnecting WhatsApp:', error);
            this.showAlert('Error disconnecting WhatsApp: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    displayQRCode(qrData) {
        const qrPlaceholder = document.getElementById('qrPlaceholder');
        const qrCodeImage = document.getElementById('qrCodeImage');

        if (qrData) {
            qrCodeImage.src = qrData;
            qrCodeImage.style.display = 'block';
            qrPlaceholder.style.display = 'none';
        } else {
            qrCodeImage.style.display = 'none';
            qrPlaceholder.style.display = 'block';
        }
    }

    showLoading(text = 'Processing...') {
        document.getElementById('loadingText').textContent = text;
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }

    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) {
            modal.hide();
        }
    }

    showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.connection-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed connection-alert`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    updateStatistics() {
        // Update uptime
        const uptimeElement = document.getElementById('connectionUptime');
        if (uptimeElement) {
            if (this.connectionStartTime && this.isConnected) {
                const uptime = this.formatUptime(new Date() - this.connectionStartTime);
                uptimeElement.textContent = uptime;
            } else {
                uptimeElement.textContent = '--';
            }
        }

        // Update messages sent
        const messagesSentElement = document.getElementById('messagesSent');
        if (messagesSentElement) {
            messagesSentElement.textContent = this.messagesSent.toLocaleString();
        }

        // Update connection errors
        const connectionErrorsElement = document.getElementById('connectionErrors');
        if (connectionErrorsElement) {
            connectionErrorsElement.textContent = this.connectionErrors.toLocaleString();
        }

        // Update signal strength
        const signalStrengthElement = document.getElementById('signalStrength');
        if (signalStrengthElement) {
            signalStrengthElement.textContent = this.isConnected ? 'Good' : '--';
        }

        // Update last updated time
        const statsLastUpdatedElement = document.getElementById('statsLastUpdated');
        if (statsLastUpdatedElement) {
            statsLastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    startUptimeTimer() {
        // Update uptime every second
        setInterval(() => {
            if (this.isConnected && this.connectionStartTime) {
                this.updateStatistics();
            }
        }, 1000);

        // Auto-save statistics every 30 seconds
        setInterval(() => {
            this.saveStatisticsToStorage();
        }, 30000);
    }

    resetStatistics() {
        this.messagesSent = 0;
        this.connectionErrors = 0;
        this.connectionStartTime = this.isConnected ? new Date() : null;
        this.updateStatistics();
        this.saveStatisticsToStorage();
        this.showAlert('Statistics reset successfully', 'info');
        console.log('📊 Statistics reset');
    }

    exportStatistics() {
        const stats = {
            messagesSent: this.messagesSent,
            connectionErrors: this.connectionErrors,
            connectionStartTime: this.connectionStartTime ? this.connectionStartTime.toISOString() : null,
            isConnected: this.isConnected,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `whatsapp-stats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showAlert('Statistics exported successfully', 'success');
    }

    // Make functions globally available for console access
    setupGlobalFunctions() {
        window.connectionStats = {
            reset: () => this.resetStatistics(),
            export: () => this.exportStatistics(),
            current: () => ({
                messagesSent: this.messagesSent,
                connectionErrors: this.connectionErrors,
                uptime: this.connectionStartTime ? new Date() - this.connectionStartTime : 0,
                isConnected: this.isConnected
            }),
            // Test functions for debugging
            testMessageSent: () => {
                this.messagesSent++;
                this.updateStatistics();
                this.saveStatisticsToStorage();
                console.log('📤 Test message sent count updated:', this.messagesSent);
            },
            testConnectionError: () => {
                this.connectionErrors++;
                this.updateStatistics();
                this.saveStatisticsToStorage();
                console.log('❌ Test connection error count updated:', this.connectionErrors);
            },
            loadFromStorage: () => this.loadStatisticsFromStorage(),
            saveToStorage: () => this.saveStatisticsToStorage(),
            getStorageData: () => {
                const data = localStorage.getItem('whatsapp-connection-stats');
                return data ? JSON.parse(data) : null;
            }
        };
    }

    async checkInitialStatus() {
        try {
            const response = await fetch('/api/messages/status');
            const data = await response.json();

            if (data.isConnected) {
                this.isConnected = true;
                // Only set new connection time if we don't have one from storage
                if (!this.connectionStartTime) {
                    this.connectionStartTime = new Date();
                    this.saveStatisticsToStorage();
                }
                console.log('🔄 Connection restored, uptime continues from:', this.connectionStartTime);
            } else {
                // If not connected, clear connection time
                this.connectionStartTime = null;
                this.saveStatisticsToStorage();
            }

            if (data.qrCode) {
                this.displayQRCode(data.qrCode);
            }

            this.updateConnectionStatus();
        } catch (error) {
            console.error('Error checking initial status:', error);
        }
    }

    // Enhanced connection methods with better status updates
    async connectWhatsApp() {
        try {
            this.showLoading('Generating QR code...');

            // Update status to connecting
            const statusBadge = document.getElementById('connectionStatusBadge');
            const statusDescription = document.getElementById('connectionStatusDescription');

            if (statusBadge) {
                statusBadge.innerHTML = '<i class="fas fa-circle me-1"></i>Connecting...';
                statusBadge.className = 'badge bg-warning';
            }

            if (statusDescription) {
                statusDescription.textContent = 'Generating QR code...';
                statusDescription.className = 'text-warning';
            }

            const response = await fetch('/api/messages/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fresh: false })
            });

            const data = await response.json();

            if (data.success) {
                if (statusDescription) {
                    statusDescription.textContent = 'QR code generated. Please scan with your WhatsApp app.';
                    statusDescription.className = 'text-info';
                }
                this.showAlert('QR Code generated. Please scan with your WhatsApp app.', 'info');
            } else {
                throw new Error(data.error || 'Failed to connect');
            }
        } catch (error) {
            console.error('Error connecting WhatsApp:', error);
            this.connectionErrors++;
            this.updateConnectionStatus(); // Reset status on error
            this.showAlert('Error connecting WhatsApp: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.connectionApp = new ConnectionStatusApp();
});