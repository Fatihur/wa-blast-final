// WhatsApp Blast Application - Frontend JavaScript

class WABlastApp {
    constructor() {
        this.socket = io();
        this.contacts = [];
        this.headers = [];
        this.groups = [];
        this.isConnected = false;
        this.isDesktop = window.electronAPI ? true : false;
        this.init();
    }

    init() {
        this.initializeNotifications();
        this.setupSocketListeners();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.checkConnectionStatus();
        this.loadStoredContacts();
        this.loadGroups();

        // Initialize empty summary if no contacts
        if (this.contacts.length === 0) {
            this.updateContactSummary({
                total: 0,
                valid: 0,
                invalid: 0,
                selected: 0
            });
        }

        // Setup desktop menu handlers
        if (this.isDesktop) {
            this.setupDesktopMenuHandlers();
        }
    }

    setupSocketListeners() {
        // WhatsApp connection status updates
        this.socket.on('whatsapp-status', (status) => {
            this.updateConnectionStatus(status);
        });

        // Blast progress updates
        this.socket.on('blast-progress', (progress) => {
            this.updateBlastProgress(progress);
            this.showBlastProgress(progress);
        });

        // Blast completion
        this.socket.on('blast-complete', (results) => {
            this.showBlastComplete(results);
            this.hideBlastProgress();
        });

        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    setupEventListeners() {
        // Connection buttons
        document.getElementById('connectBtn').addEventListener('click', () => {
            this.connectWhatsApp();
        });

        document.getElementById('newConnectionBtn').addEventListener('click', () => {
            this.forceNewConnection();
        });

        document.getElementById('disconnectBtn').addEventListener('click', () => {
            this.disconnectWhatsApp();
        });

        // Message type change
        document.getElementById('singleType').addEventListener('change', (e) => {
            this.toggleFileUpload('single', e.target.value);
        });

        // Contact import
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importContacts();
        });

        // Contact search input
        const contactSearchInput = document.getElementById('contactSearchInput');
        if (contactSearchInput) {
            contactSearchInput.addEventListener('keyup', () => {
                searchMainContacts();
            });
        }

        // Tab changes
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'blast-tab') {
                    this.initBlastTab();
                } else if (e.target.id === 'groups-tab') {
                    this.loadGroups();
                }
            });
        });

        // Group filter change
        document.getElementById('contactGroupFilter').addEventListener('change', (e) => {
            this.filterContactsByGroup(e.target.value);
        });
    }

    setupFormHandlers() {
        // Single message form
        document.getElementById('singleMessageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendSingleMessage();
        });

        // Phone number formatting
        document.getElementById('singleNumber').addEventListener('input', (e) => {
            this.formatPhoneNumberInput(e.target);
        });

        document.getElementById('singleNumber').addEventListener('blur', (e) => {
            this.validatePhoneNumber(e.target);
        });

        // Group creation form
        document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('groupName').value.trim(),
                description: document.getElementById('groupDescription').value.trim(),
                color: document.getElementById('groupColor').value
            };

            if (!formData.name) {
                this.showWarningNotification('Group Name Required', 'Please enter a group name');
                return;
            }

            try {
                await this.createGroup(formData);
                // Reset form
                document.getElementById('createGroupForm').reset();
                document.getElementById('groupColor').value = '#007bff';
            } catch (error) {
                // Error already handled in createGroup method
            }
        });

        // Add to Group Modal handlers
        document.getElementById('addToGroupBtn').addEventListener('click', async () => {
            await this.handleAddToGroup();
        });

        document.getElementById('bulkAddToGroupBtn').addEventListener('click', async () => {
            await this.handleBulkAddToGroup();
        });
    }

    async checkConnectionStatus() {
        try {
            const response = await fetch('/api/messages/status');
            const status = await response.json();
            this.updateConnectionStatus(status);
        } catch (error) {
            console.error('Error checking status:', error);
        }
    }

    async loadStoredContacts() {
        try {
            const response = await fetch('/api/contacts?includeGroups=true');
            const data = await response.json();

            if (data.success) {
                this.contacts = data.contacts || [];
                this.headers = data.headers;

                // Ensure all contact IDs are integers
                this.contacts = this.contacts.map(contact => ({
                    ...contact,
                    id: parseInt(contact.id)
                }));

                console.log('Loaded contacts:', this.contacts.length);
                if (this.contacts.length > 0) {
                    console.log('Sample contact IDs:', this.contacts.slice(0, 3).map(c => ({ id: c.id, type: typeof c.id })));
                }

                // Calculate proper summary
                const summary = {
                    total: this.contacts.length,
                    valid: this.contacts.filter(c => c.number && c.number.trim()).length,
                    invalid: this.contacts.filter(c => !c.number || !c.number.trim()).length,
                    selected: this.contacts.filter(c => c.selected !== false).length
                };

                this.updateContactSummary(summary);
                this.displayContacts(this.contacts);

                // Update search count if search is active
                setTimeout(() => {
                    const searchCount = document.getElementById('mainContactSearchCount');
                    if (searchCount && !searchCount.textContent.includes('Showing')) {
                        searchCount.textContent = `${this.contacts.length} contacts total`;
                        searchCount.className = 'text-muted';
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error loading stored contacts:', error);
        }
    }

    connectWhatsApp() {
        this.socket.emit('connect-whatsapp');
        this.showLoading('Connecting to WhatsApp...');
    }

    disconnectWhatsApp() {
        this.socket.emit('disconnect-whatsapp');
        this.showLoading('Disconnecting...');
    }

    forceNewConnection() {
        const message = this.isConnected
            ? 'This will disconnect current WhatsApp and generate a new QR code for a different account. Continue?'
            : 'This will clear any existing session and generate a fresh QR code. Continue?';

        if (confirm(message)) {
            this.socket.emit('force-new-connection');
            this.showLoading('Clearing session and generating new QR code...');
        }
    }

    updateConnectionStatus(status) {
        this.isConnected = status.isConnected;
        const statusElement = document.getElementById('connectionStatus');
        const connectBtn = document.getElementById('connectBtn');
        const newConnectionBtn = document.getElementById('newConnectionBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const qrCodeImage = document.getElementById('qrCodeImage');
        const qrPlaceholder = document.getElementById('qrPlaceholder');
        const messageElement = document.getElementById('connectionMessage');

        // Update status display
        if (status.isConnected) {
            statusElement.innerHTML = '<i class="fas fa-circle text-success me-1"></i>Connected';
            connectBtn.style.display = 'none';
            newConnectionBtn.style.display = 'block';
            disconnectBtn.style.display = 'block';
            qrCodeImage.style.display = 'none';
            qrPlaceholder.style.display = 'block';
            qrPlaceholder.innerHTML = '<i class="fas fa-check-circle fa-3x text-success"></i><p class="mt-2 text-success">WhatsApp Connected!</p>';
            messageElement.innerHTML = '<div class="alert alert-success">WhatsApp connected successfully! <br><small class="text-muted">Use "New QR Code" to connect a different WhatsApp account.</small></div>';
        } else if (status.status === 'connecting') {
            statusElement.innerHTML = '<i class="fas fa-circle text-warning me-1"></i>Connecting...';
            connectBtn.style.display = 'none';
            newConnectionBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            messageElement.innerHTML = '<div class="alert alert-info">Connecting to WhatsApp...</div>';
        } else if (status.status === 'qr-ready' && status.qrCode) {
            statusElement.innerHTML = '<i class="fas fa-circle text-warning me-1"></i>Scan QR Code';
            connectBtn.style.display = 'none';
            newConnectionBtn.style.display = 'block';
            disconnectBtn.style.display = 'block';
            qrPlaceholder.style.display = 'none';
            qrCodeImage.src = status.qrCode;
            qrCodeImage.style.display = 'block';
            messageElement.innerHTML = '<div class="alert alert-warning">Please scan the QR code with your WhatsApp mobile app <br><small class="text-muted">Click "New QR Code" to generate a fresh QR code.</small></div>';
        } else {
            statusElement.innerHTML = '<i class="fas fa-circle text-danger me-1"></i>Disconnected';
            connectBtn.style.display = 'block';
            newConnectionBtn.style.display = 'block'; // Always show when disconnected
            disconnectBtn.style.display = 'none';
            qrCodeImage.style.display = 'none';
            qrPlaceholder.style.display = 'block';
            qrPlaceholder.innerHTML = '<i class="fas fa-qrcode fa-3x text-muted"></i><p class="mt-2 text-muted">Click connect to generate QR code</p>';
            messageElement.innerHTML = '<div class="alert alert-info">Choose: <strong>Connect WhatsApp</strong> (use existing session) or <strong>New QR Code</strong> (fresh session for different WhatsApp)</div>';
        }

        this.hideLoading();
    }

    // Initialize notification system
    initializeNotifications() {
        // Configure SweetAlert2 defaults
        if (typeof Swal !== 'undefined') {
            this.Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
        }
    }

    // Desktop menu handlers
    setupDesktopMenuHandlers() {
        if (window.electronAPI && window.electronAPI.onMenuAction) {
            window.electronAPI.onMenuAction((event, action) => {
                this.handleDesktopMenuAction(action);
            });
        }
    }

    handleDesktopMenuAction(action) {
        switch (action) {
            case 'new-contact':
                this.showAddContactModal();
                break;
            case 'import-contacts':
                this.importContacts();
                break;
            case 'connect-whatsapp':
                this.connectWhatsApp();
                break;
            case 'disconnect-whatsapp':
                this.disconnectWhatsApp();
                break;
            case 'test-message':
                this.showTestMessageModal();
                break;
            default:
                console.log('Unknown menu action:', action);
        }
    }

    showAddContactModal() {
        // Show modal to add new contact
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Add New Contact',
                html: `
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" id="newContactName" class="form-control" placeholder="Contact Name">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Phone Number</label>
                        <input type="text" id="newContactNumber" class="form-control" placeholder="628xxxxxxxxx">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email (Optional)</label>
                        <input type="email" id="newContactEmail" class="form-control" placeholder="email@example.com">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Add Contact',
                cancelButtonText: 'Cancel',
                preConfirm: () => {
                    const name = document.getElementById('newContactName').value;
                    const number = document.getElementById('newContactNumber').value;
                    const email = document.getElementById('newContactEmail').value;

                    if (!name || !number) {
                        Swal.showValidationMessage('Name and phone number are required');
                        return false;
                    }

                    return { name, number, email };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    this.addNewContact(result.value);
                }
            });
        }
    }

    showTestMessageModal() {
        // Switch to single message tab and focus
        const singleTab = document.getElementById('single-tab');
        if (singleTab) {
            singleTab.click();
            setTimeout(() => {
                const numberInput = document.getElementById('singleNumber');
                if (numberInput) {
                    numberInput.focus();
                }
            }, 100);
        }
    }

    addNewContact(contactData) {
        // Add contact to the list
        const newContact = {
            name: contactData.name,
            number: contactData.number,
            email: contactData.email || '',
            selected: false
        };

        this.contacts.push(newContact);
        this.saveContactsToStorage();
        this.renderContacts();
        this.updateContactSummary();

        this.showSuccessNotification('Contact Added', `${contactData.name} has been added to your contacts`);
    }

    // Notification methods
    showSuccessNotification(title, message = '') {
        // Desktop notification
        if (this.isDesktop && window.desktopNotifications) {
            window.desktopNotifications.success(title, message);
        }

        if (this.Toast) {
            this.Toast.fire({
                icon: 'success',
                title: title,
                text: message
            });
        } else {
            alert(`✅ ${title}${message ? ': ' + message : ''}`);
        }
    }

    showErrorNotification(title, message = '') {
        // Desktop notification
        if (this.isDesktop && window.desktopNotifications) {
            window.desktopNotifications.error(title, message);
        }

        if (this.Toast) {
            this.Toast.fire({
                icon: 'error',
                title: title,
                text: message
            });
        } else {
            alert(`❌ ${title}${message ? ': ' + message : ''}`);
        }
    }

    showWarningNotification(title, message = '') {
        // Desktop notification
        if (this.isDesktop && window.desktopNotifications) {
            window.desktopNotifications.warning(title, message);
        }

        if (this.Toast) {
            this.Toast.fire({
                icon: 'warning',
                title: title,
                text: message
            });
        } else {
            alert(`⚠️ ${title}${message ? ': ' + message : ''}`);
        }
    }

    showInfoNotification(title, message = '') {
        // Desktop notification
        if (this.isDesktop && window.desktopNotifications) {
            window.desktopNotifications.info(title, message);
        }

        if (this.Toast) {
            this.Toast.fire({
                icon: 'info',
                title: title,
                text: message
            });
        } else {
            alert(`ℹ️ ${title}${message ? ': ' + message : ''}`);
        }
    }

    // Detailed notification for message sending
    showMessageResult(success, data) {
        if (success) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Message Sent Successfully!',
                    html: `
                        <div class="text-start">
                            <p><strong>To:</strong> ${data.number || 'Unknown'}</p>
                            <p><strong>Type:</strong> ${data.type || 'text'}</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                            ${data.fileName ? `<p><strong>File:</strong> ${data.fileName}</p>` : ''}
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#28a745'
                });
            } else {
                this.showSuccessNotification('Message Sent!', `To: ${data.number}`);
            }
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Send Message',
                    html: `
                        <div class="text-start">
                            <p><strong>Error:</strong> ${data.error || 'Unknown error'}</p>
                            <p><strong>To:</strong> ${data.number || 'Unknown'}</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc3545'
                });
            } else {
                this.showErrorNotification('Send Failed!', data.error || 'Unknown error');
            }
        }
    }

    // Blast progress notification
    showBlastProgress(progress) {
        if (typeof Swal !== 'undefined') {
            const percentage = progress.percentage || Math.round(((progress.sent + progress.failed) / progress.total) * 100);

            // Only show progress modal if not already showing
            if (!this.progressModalShowing) {
                this.progressModalShowing = true;

                Swal.fire({
                    title: 'Sending Blast Messages...',
                    html: `
                        <div class="text-center">
                            <div class="progress mb-3">
                                <div class="progress-bar progress-bar-striped progress-bar-animated"
                                     style="width: ${percentage}%"></div>
                            </div>
                            <p><strong>Progress:</strong> ${progress.sent + progress.failed}/${progress.total} (${percentage}%)</p>
                            <p><strong>Successful:</strong> <span class="text-success">${progress.sent}</span></p>
                            <p><strong>Failed:</strong> <span class="text-danger">${progress.failed}</span></p>
                            <p><strong>Current:</strong> ${progress.current || progress.sent + progress.failed + 1}</p>
                        </div>
                    `,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            } else {
                // Update existing modal content
                const progressBar = document.querySelector('.progress-bar');
                const progressText = document.querySelector('.swal2-html-container');

                if (progressBar) {
                    progressBar.style.width = `${percentage}%`;
                }

                if (progressText) {
                    progressText.innerHTML = `
                        <div class="text-center">
                            <div class="progress mb-3">
                                <div class="progress-bar progress-bar-striped progress-bar-animated"
                                     style="width: ${percentage}%"></div>
                            </div>
                            <p><strong>Progress:</strong> ${progress.sent + progress.failed}/${progress.total} (${percentage}%)</p>
                            <p><strong>Successful:</strong> <span class="text-success">${progress.sent}</span></p>
                            <p><strong>Failed:</strong> <span class="text-danger">${progress.failed}</span></p>
                            <p><strong>Current:</strong> ${progress.current || progress.sent + progress.failed + 1}</p>
                        </div>
                    `;
                }
            }
        }
    }

    // Blast completion notification
    showBlastComplete(results) {
        // Reset progress modal flag
        this.progressModalShowing = false;

        if (typeof Swal !== 'undefined') {
            const successRate = results.successRate || Math.round((results.successful / results.total) * 100);

            Swal.fire({
                icon: results.successful === results.total ? 'success' : 'warning',
                title: 'Blast Complete!',
                html: `
                    <div class="text-start">
                        <div class="row">
                            <div class="col-6">
                                <p><strong>Total:</strong> ${results.total}</p>
                                <p><strong>Successful:</strong> <span class="text-success">${results.successful}</span></p>
                                <p><strong>Failed:</strong> <span class="text-danger">${results.failed}</span></p>
                            </div>
                            <div class="col-6">
                                <p><strong>Success Rate:</strong> ${successRate}%</p>
                                <p><strong>Duration:</strong> ${results.duration || 'N/A'}</p>
                                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                                ${results.filesSent ? `<p><strong>Files Sent:</strong> ${results.filesSent}</p>` : ''}
                                ${results.unmatched ? `<p><strong>Unmatched:</strong> ${results.unmatched}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: results.successful === results.total ? '#28a745' : '#ffc107'
            });
        } else {
            this.showInfoNotification('Blast Complete!', `${results.successful}/${results.total} sent successfully`);
        }
    }

    // Show blast progress modal (non-socket version)
    showBlastProgressModal(totalContacts) {
        if (typeof Swal !== 'undefined') {
            this.blastProgressModal = Swal.fire({
                title: 'Sending Blast Messages...',
                html: `
                    <div class="text-center">
                        <div class="progress mb-3">
                            <div class="progress-bar progress-bar-striped progress-bar-animated"
                                 id="blastProgressBar" style="width: 0%"></div>
                        </div>
                        <p id="blastProgressText"><strong>Progress:</strong> 0/${totalContacts} (0%)</p>
                        <p id="blastSuccessText"><strong>Successful:</strong> <span class="text-success">0</span></p>
                        <p id="blastFailedText"><strong>Failed:</strong> <span class="text-danger">0</span></p>
                        <p id="blastCurrentText"><strong>Current:</strong> Preparing...</p>
                    </div>
                `,
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
    }

    // Update blast progress modal
    updateBlastProgressModal(sent, failed, total, current) {
        if (this.blastProgressModal && typeof Swal !== 'undefined') {
            const percentage = Math.round(((sent + failed) / total) * 100);

            // Update progress bar
            const progressBar = document.getElementById('blastProgressBar');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }

            // Update text elements
            const progressText = document.getElementById('blastProgressText');
            if (progressText) {
                progressText.innerHTML = `<strong>Progress:</strong> ${sent + failed}/${total} (${percentage}%)`;
            }

            const successText = document.getElementById('blastSuccessText');
            if (successText) {
                successText.innerHTML = `<strong>Successful:</strong> <span class="text-success">${sent}</span>`;
            }

            const failedText = document.getElementById('blastFailedText');
            if (failedText) {
                failedText.innerHTML = `<strong>Failed:</strong> <span class="text-danger">${failed}</span>`;
            }

            const currentText = document.getElementById('blastCurrentText');
            if (currentText) {
                currentText.innerHTML = `<strong>Current:</strong> Contact ${current}`;
            }
        }
    }

    // Close blast progress modal
    closeBlastProgressModal() {
        if (this.blastProgressModal && typeof Swal !== 'undefined') {
            Swal.close();
            this.blastProgressModal = null;
        }

        // Clear simulation interval
        if (this.blastSimulationInterval) {
            clearInterval(this.blastSimulationInterval);
            this.blastSimulationInterval = null;
        }
    }

    // Simulate blast progress
    simulateBlastProgress(totalContacts, delay) {
        let currentContact = 0;
        let sent = 0;
        let failed = 0;

        // Update progress every delay/2 milliseconds or minimum 500ms
        const updateInterval = Math.max(delay / 2, 500);

        this.blastSimulationInterval = setInterval(() => {
            if (currentContact < totalContacts) {
                currentContact++;

                // Simulate success/failure (90% success rate)
                if (Math.random() > 0.1) {
                    sent++;
                } else {
                    failed++;
                }

                // Update progress modal
                this.updateBlastProgressModal(sent, failed, totalContacts, currentContact);

            } else {
                // Clear interval when done
                clearInterval(this.blastSimulationInterval);
                this.blastSimulationInterval = null;
            }
        }, updateInterval);
    }

    toggleFileUpload(type, messageType) {
        const fileUpload = document.getElementById(`${type}FileUpload`);
        if (messageType === 'text') {
            fileUpload.style.display = 'none';
        } else {
            fileUpload.style.display = 'block';
        }
    }

    async sendSingleMessage() {
        if (!this.isConnected) {
            this.showErrorNotification('WhatsApp Not Connected', 'Please connect to WhatsApp first');
            return;
        }

        const number = document.getElementById('singleNumber').value;
        const message = document.getElementById('singleMessage').value;
        const type = document.getElementById('singleType').value;
        const fileInput = document.getElementById('singleFile');

        if (!number || !message) {
            this.showAlert('Please fill in all required fields', 'danger');
            return;
        }

        this.showLoading('Sending message...');

        try {
            let requestData = { number, message, type };

            // Handle file upload if needed
            if (type !== 'text') {
                if (!fileInput.files[0]) {
                    this.showAlert('Please select a file for ' + type + ' message', 'danger');
                    this.hideLoading();
                    return;
                }

                const file = fileInput.files[0];
                console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

                const formData = new FormData();
                formData.append('file', file);

                const uploadResponse = await fetch('/api/upload/file', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    console.error('Upload failed:', errorText);
                    throw new Error('File upload failed: ' + errorText);
                }

                const uploadResult = await uploadResponse.json();
                console.log('Upload result:', uploadResult);

                if (!uploadResult.success) {
                    throw new Error('File upload failed: ' + uploadResult.error);
                }

                requestData.fileName = uploadResult.file.originalName;
                requestData.filePath = uploadResult.file.path;

                console.log('File uploaded successfully:', requestData.fileName, requestData.filePath);
            }

            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                // Show detailed success notification
                this.showMessageResult(true, {
                    number: number,
                    type: type,
                    fileName: fileName
                });

                // Reset form
                document.getElementById('singleMessageForm').reset();
                this.toggleFileUpload('single', 'text');
            } else {
                throw new Error(result.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('Error sending message:', error);

            // Show detailed error notification
            this.showMessageResult(false, {
                number: number,
                error: error.message
            });
        } finally {
            this.hideLoading();
        }
    }

    async importContacts() {
        let file = null;

        // Desktop file selection
        if (this.isDesktop && window.desktopFiles) {
            try {
                const result = await window.desktopFiles.importContacts();
                if (result.canceled) {
                    return;
                }

                if (result.filePaths && result.filePaths.length > 0) {
                    // For desktop, we need to handle file differently
                    // Create a File object from the path
                    const filePath = result.filePaths[0];
                    const fileName = filePath.split('\\').pop().split('/').pop();

                    // Read file content (this would need to be implemented in preload)
                    // For now, we'll use the regular file input as fallback
                    this.showInfoNotification('File Selected', `Selected: ${fileName}`);
                }
            } catch (error) {
                console.error('Desktop file selection error:', error);
                this.showErrorNotification('File Selection Failed', error.message);
                return;
            }
        }

        // Fallback to regular file input
        const fileInput = document.getElementById('contactFile');

        if (!file && (!fileInput.files || !fileInput.files[0])) {
            this.showWarningNotification('No File Selected', 'Please select a file to import');
            return;
        }

        file = file || fileInput.files[0];

        this.showLoading('Importing contacts...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/contacts/import', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.contacts = result.contacts;
                this.headers = result.headers || [];
                this.updateContactSummary(result.summary);
                this.displayContacts(result.contacts);

                // Show detailed import success notification
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Contacts Imported Successfully!',
                        html: `
                            <div class="text-start">
                                <p><strong>Valid Contacts:</strong> ${result.summary.valid}</p>
                                ${result.summary.added !== undefined ? `<p><strong>New:</strong> ${result.summary.added}</p>` : ''}
                                ${result.summary.duplicates !== undefined ? `<p><strong>Duplicates:</strong> ${result.summary.duplicates}</p>` : ''}
                                ${result.summary.invalid > 0 ? `<p><strong>Invalid:</strong> <span class="text-warning">${result.summary.invalid}</span></p>` : ''}
                                <p><strong>File:</strong> ${fileInput.files[0].name}</p>
                            </div>
                        `,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#28a745'
                    });
                } else {
                    let message = `Successfully imported ${result.summary.valid} contacts`;
                    if (result.summary.added !== undefined) {
                        message += ` (${result.summary.added} new, ${result.summary.duplicates} duplicates)`;
                    }
                    this.showSuccessNotification('Import Complete', message);
                }

                if (result.invalidContacts && result.invalidContacts.length > 0) {
                    this.showWarningNotification('Some Contacts Skipped', `${result.summary.invalid} contacts were invalid and skipped`);
                }

                // Reload stored contacts to get updated data
                await this.loadStoredContacts();

                // Update dynamic variables in blast form
                this.updateDynamicVariables();
            } else {
                throw new Error(result.error || 'Failed to import contacts');
            }

        } catch (error) {
            console.error('Error importing contacts:', error);
            this.showErrorNotification('Import Failed', error.message);
        } finally {
            this.hideLoading();
        }
    }

    updateContactSummary(summary) {
        const summaryElement = document.getElementById('contactSummary');
        if (!summaryElement) return;

        // Ensure summary object exists and has default values
        const safeSummary = {
            total: 0,
            valid: 0,
            invalid: 0,
            selected: 0,
            ...summary
        };

        // Calculate values based on available data
        const total = safeSummary.total || safeSummary.totalContacts || this.contacts.length || 0;
        const valid = safeSummary.valid || safeSummary.matched || this.contacts.filter(c => c.number && c.number.trim()).length || 0;
        const invalid = safeSummary.invalid || safeSummary.unmatched || (total - valid) || 0;
        const selected = safeSummary.selected || this.contacts.filter(c => c.selected !== false).length || 0;

        summaryElement.innerHTML = `
            <div class="row">
                <div class="col-3">
                    <div class="card bg-primary text-white mb-3">
                        <div class="card-body text-center">
                            <h3 class="mb-1">${total}</h3>
                            <p class="mb-0">Total</p>
                        </div>
                    </div>
                </div>
                <div class="col-3">
                    <div class="card bg-success text-white mb-3">
                        <div class="card-body text-center">
                            <h3 class="mb-1">${valid}</h3>
                            <p class="mb-0">Valid</p>
                        </div>
                    </div>
                </div>
                <div class="col-3">
                    <div class="card bg-warning text-white mb-3">
                        <div class="card-body text-center">
                            <h3 class="mb-1">${invalid}</h3>
                            <p class="mb-0">Invalid</p>
                        </div>
                    </div>
                </div>
                <div class="col-3">
                    <div class="card bg-info text-white mb-3">
                        <div class="card-body text-center">
                            <h3 class="mb-1">${selected}</h3>
                            <p class="mb-0">Selected</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displayContacts(contacts) {
        const tableBody = document.getElementById('contactsTableBody');
        const table = document.getElementById('contactsTable');

        tableBody.innerHTML = '';

        contacts.forEach((contact, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input contact-checkbox"
                           data-id="${contact.id}" data-index="${index}"
                           ${contact.selected !== false ? 'checked' : ''}>
                </td>
                <td>${contact.name || '-'}</td>
                <td>
                    <span class="badge bg-secondary">${contact.displayNumber || contact.number}</span>
                    <button class="btn btn-sm btn-outline-primary ms-1"
                            onclick="app.selectNumberForSingle('${contact.number}')"
                            title="Use for single message">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </td>
                <td>${contact.email || '-'}</td>
                <td>${contact.company || '-'}</td>
                <td>
                    ${contact.groups ? contact.groups.map(group =>
                        `<span class="badge me-1" style="background-color: ${group.color}">${group.name}</span>`
                    ).join('') : '-'}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.showEditContactModal(${contact.id})" title="Edit Contact">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="app.showAddToGroupModal(${contact.id})" title="Add to Group">
                            <i class="fas fa-users"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.removeContact(${contact.id})" title="Delete Contact">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add select all/none buttons
        const selectAllRow = document.createElement('tr');
        selectAllRow.innerHTML = `
            <td colspan="7" class="text-center bg-light">
                <button class="btn btn-sm btn-outline-primary me-2" onclick="app.selectAllContacts(true)">
                    <i class="fas fa-check-square me-1"></i>
                    Select All
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="app.selectAllContacts(false)">
                    <i class="fas fa-square me-1"></i>
                    Select None
                </button>
                <span class="ms-3 text-muted">
                    <span id="selectedCount">${contacts.length}</span> of ${contacts.length} selected
                </span>
            </td>
        `;
        tableBody.appendChild(selectAllRow);

        // Add event listeners for checkboxes
        document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const contactId = parseInt(e.target.dataset.id);
                const selected = e.target.checked;

                try {
                    await fetch(`/api/contacts/${contactId}/select`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ selected })
                    });

                    // Update local contact data
                    const contact = this.contacts.find(c => c.id === contactId);
                    if (contact) {
                        contact.selected = selected;
                    }

                    this.updateSelectedCount();
                    this.updateBulkActionButtons();
                } catch (error) {
                    console.error('Error updating contact selection:', error);
                    // Revert checkbox state on error
                    e.target.checked = !selected;
                }
            });
        });

        table.style.display = 'block';
        this.updateSelectedCount();
        this.updateBulkActionButtons();
    }

    selectNumberForSingle(number) {
        document.getElementById('singleNumber').value = number;

        // Switch to single message tab
        const singleTab = document.getElementById('single-tab');
        const tab = new bootstrap.Tab(singleTab);
        tab.show();

        // Focus on message field
        setTimeout(() => {
            document.getElementById('singleMessage').focus();
        }, 100);

        this.showAlert(`Number ${number} selected for single message`, 'success');
    }

    async selectAllContacts(selectAll) {
        try {
            const response = await fetch('/api/contacts/select-all', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selected: selectAll })
            });

            if (response.ok) {
                // Update UI
                document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
                    checkbox.checked = selectAll;
                });

                // Update local data
                this.contacts.forEach(contact => {
                    contact.selected = selectAll;
                });

                this.updateSelectedCount();
                this.updateBulkActionButtons();
            }
        } catch (error) {
            console.error('Error updating all contact selection:', error);
        }
    }

    updateSelectedCount() {
        const checkboxes = document.querySelectorAll('.contact-checkbox');
        const selectedCount = document.querySelectorAll('.contact-checkbox:checked').length;
        const countElement = document.getElementById('selectedCount');

        if (countElement) {
            countElement.textContent = selectedCount;
        }

        // Update summary with current data
        const summary = {
            total: this.contacts.length,
            valid: this.contacts.filter(c => c.number && c.number.trim()).length,
            invalid: this.contacts.filter(c => !c.number || !c.number.trim()).length,
            selected: selectedCount
        };

        this.updateContactSummary(summary);
    }

    updateBulkActionButtons() {
        const selectedCount = document.querySelectorAll('.contact-checkbox:checked').length;
        const bulkAddBtn = document.getElementById('bulkAddToGroupBtnMain');
        const bulkEditBtn = document.getElementById('bulkEditBtnMain');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtnMain');

        if (bulkAddBtn) {
            if (selectedCount > 0) {
                bulkAddBtn.disabled = false;
                bulkAddBtn.innerHTML = `<i class="fas fa-users me-1"></i>Add Selected (${selectedCount}) to Group`;
            } else {
                bulkAddBtn.disabled = true;
                bulkAddBtn.innerHTML = `<i class="fas fa-users me-1"></i>Add Selected to Group`;
            }
        }

        if (bulkEditBtn) {
            if (selectedCount > 0) {
                bulkEditBtn.disabled = false;
                bulkEditBtn.innerHTML = `<i class="fas fa-edit me-1"></i>Edit Selected (${selectedCount})`;
            } else {
                bulkEditBtn.disabled = true;
                bulkEditBtn.innerHTML = `<i class="fas fa-edit me-1"></i>Edit Selected`;
            }
        }

        if (bulkDeleteBtn) {
            if (selectedCount > 0) {
                bulkDeleteBtn.disabled = false;
                bulkDeleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i>Delete Selected (${selectedCount})`;
            } else {
                bulkDeleteBtn.disabled = true;
                bulkDeleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i>Delete Selected`;
            }
        }
    }

    getSelectedContacts() {
        return this.contacts.filter(contact => contact.selected !== false);
    }

    async removeContact(contactId) {
        try {
            const response = await fetch(`/api/contacts/${contactId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local array
                this.contacts = this.contacts.filter(c => c.id !== contactId);
                this.displayContacts(this.contacts);
                this.updateContactSummary({
                    total: this.contacts.length,
                    selected: this.contacts.filter(c => c.selected).length,
                    invalid: 0
                });
                this.showAlert('Contact deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            this.showAlert('Error deleting contact', 'danger');
        }
    }

    // Show edit contact modal
    showEditContactModal(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) {
            this.showAlert('Contact not found', 'danger');
            return;
        }

        // Populate form fields
        document.getElementById('editContactId').value = contact.id;
        document.getElementById('editContactName').value = contact.name || '';
        document.getElementById('editContactNumber').value = contact.number || '';
        document.getElementById('editContactEmail').value = contact.email || '';
        document.getElementById('editContactCompany').value = contact.company || '';
        document.getElementById('editContactAddress').value = contact.address || '';
        document.getElementById('editContactNotes').value = contact.notes || '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editContactModal'));
        modal.show();
    }

    // Save edited contact
    async saveEditContact() {
        try {
            const contactId = parseInt(document.getElementById('editContactId').value);
            const updates = {
                name: document.getElementById('editContactName').value.trim(),
                number: document.getElementById('editContactNumber').value.trim(),
                email: document.getElementById('editContactEmail').value.trim(),
                company: document.getElementById('editContactCompany').value.trim(),
                address: document.getElementById('editContactAddress').value.trim(),
                notes: document.getElementById('editContactNotes').value.trim()
            };

            if (!updates.name || !updates.number) {
                this.showAlert('Name and phone number are required', 'danger');
                return;
            }

            const response = await fetch(`/api/contacts/${contactId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const result = await response.json();

                // Update local contact
                const contactIndex = this.contacts.findIndex(c => c.id === contactId);
                if (contactIndex !== -1) {
                    this.contacts[contactIndex] = { ...this.contacts[contactIndex], ...updates };
                }

                // Refresh display
                this.displayContacts(this.contacts);

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editContactModal'));
                modal.hide();

                this.showAlert('Contact updated successfully', 'success');
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Error updating contact', 'danger');
            }
        } catch (error) {
            console.error('Error updating contact:', error);
            this.showAlert('Error updating contact', 'danger');
        }
    }

    // Show bulk edit modal
    showBulkEditModal() {
        const selectedContacts = this.getSelectedContacts();
        if (selectedContacts.length === 0) {
            this.showAlert('Please select contacts to edit', 'warning');
            return;
        }

        // Clear form fields
        document.getElementById('bulkEditEmail').value = '';
        document.getElementById('bulkEditCompany').value = '';
        document.getElementById('bulkEditAddress').value = '';
        document.getElementById('bulkEditNotes').value = '';

        // Update selected count
        document.getElementById('bulkEditSelectedCount').textContent =
            `${selectedContacts.length} contacts selected for bulk edit`;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkEditModal'));
        modal.show();
    }

    // Save bulk edit
    async saveBulkEdit() {
        try {
            const selectedContacts = this.getSelectedContacts();
            if (selectedContacts.length === 0) {
                this.showAlert('No contacts selected', 'warning');
                return;
            }

            const updates = {};
            const email = document.getElementById('bulkEditEmail').value.trim();
            const company = document.getElementById('bulkEditCompany').value.trim();
            const address = document.getElementById('bulkEditAddress').value.trim();
            const notes = document.getElementById('bulkEditNotes').value.trim();

            // Only include non-empty fields
            if (email) updates.email = email;
            if (company) updates.company = company;
            if (address) updates.address = address;
            if (notes) updates.notes = notes;

            if (Object.keys(updates).length === 0) {
                this.showAlert('Please fill in at least one field to update', 'warning');
                return;
            }

            const contactIds = selectedContacts.map(c => c.id);

            const response = await fetch('/api/contacts/bulk', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactIds, updates })
            });

            if (response.ok) {
                const result = await response.json();

                // Update local contacts
                selectedContacts.forEach(contact => {
                    const contactIndex = this.contacts.findIndex(c => c.id === contact.id);
                    if (contactIndex !== -1) {
                        this.contacts[contactIndex] = { ...this.contacts[contactIndex], ...updates };
                    }
                });

                // Refresh display
                this.displayContacts(this.contacts);

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('bulkEditModal'));
                modal.hide();

                this.showAlert(`Successfully updated ${result.updatedCount} contacts`, 'success');
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Error updating contacts', 'danger');
            }
        } catch (error) {
            console.error('Error bulk updating contacts:', error);
            this.showAlert('Error updating contacts', 'danger');
        }
    }

    // Bulk delete contacts
    async bulkDeleteContacts() {
        try {
            const selectedContacts = this.getSelectedContacts();
            if (selectedContacts.length === 0) {
                this.showAlert('Please select contacts to delete', 'warning');
                return;
            }

            // Confirm deletion
            const confirmed = await this.showConfirmDialog(
                'Delete Contacts',
                `Are you sure you want to delete ${selectedContacts.length} selected contacts? This action cannot be undone.`,
                'danger'
            );

            if (!confirmed) return;

            const contactIds = selectedContacts.map(c => c.id);

            const response = await fetch('/api/contacts/bulk', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactIds })
            });

            if (response.ok) {
                const result = await response.json();

                // Remove deleted contacts from local array
                this.contacts = this.contacts.filter(c => !contactIds.includes(c.id));

                // Refresh display
                this.displayContacts(this.contacts);
                this.updateContactSummary({
                    total: this.contacts.length,
                    selected: this.contacts.filter(c => c.selected).length,
                    invalid: 0
                });

                this.showAlert(`Successfully deleted ${result.deletedCount} contacts`, 'success');
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Error deleting contacts', 'danger');
            }
        } catch (error) {
            console.error('Error bulk deleting contacts:', error);
            this.showAlert('Error deleting contacts', 'danger');
        }
    }

    // Show confirmation dialog
    async showConfirmDialog(title, message, type = 'warning') {
        if (this.Toast && window.Swal) {
            const result = await window.Swal.fire({
                title: title,
                text: message,
                icon: type,
                showCancelButton: true,
                confirmButtonColor: type === 'danger' ? '#dc3545' : '#0d6efd',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, proceed',
                cancelButtonText: 'Cancel'
            });
            return result.isConfirmed;
        } else {
            return confirm(`${title}\n\n${message}`);
        }
    }

    async clearAllContacts() {
        if (!confirm('Are you sure you want to delete ALL stored contacts? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/contacts', {
                method: 'DELETE'
            });

            if (response.ok) {
                this.contacts = [];
                this.headers = [];
                this.displayContacts([]);
                this.updateContactSummary({
                    total: 0,
                    selected: 0,
                    invalid: 0
                });
                this.updateDynamicVariables();
                this.showAlert('All contacts cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Error clearing contacts:', error);
            this.showAlert('Error clearing contacts', 'danger');
        }
    }

    // Group Management Methods
    async loadGroups() {
        try {
            const response = await fetch('/api/groups');
            const data = await response.json();

            if (data.success) {
                this.groups = data.groups || [];

                // Ensure all group IDs are numbers (but keep as they are since they might be floats)
                this.groups = this.groups.map(group => ({
                    ...group,
                    id: parseFloat(group.id) // Use parseFloat to handle decimal IDs
                }));

                console.log('Loaded groups:', this.groups.length);
                if (this.groups.length > 0) {
                    console.log('Sample group IDs:', this.groups.slice(0, 3).map(g => ({ id: g.id, type: typeof g.id })));
                }

                this.updateGroupStatistics(data.statistics);
                this.displayGroups();
                this.updateGroupFilter();
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    async createGroup(groupData) {
        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });

            const result = await response.json();

            if (result.success) {
                this.groups.push(result.group);
                this.displayGroups();
                this.updateGroupFilter();
                this.showSuccessNotification('Group Created', `Group "${result.group.name}" has been created successfully`);
                return result.group;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating group:', error);
            this.showErrorNotification('Error Creating Group', error.message);
            throw error;
        }
    }

    async deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group? This will remove all contacts from the group but won\'t delete the contacts themselves.')) {
            return;
        }

        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.groups = this.groups.filter(g => g.id !== groupId);
                this.displayGroups();
                this.updateGroupFilter();
                this.showSuccessNotification('Group Deleted', 'Group has been deleted successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            this.showErrorNotification('Error Deleting Group', error.message);
        }
    }

    async addContactsToGroup(groupId, contactIds) {
        try {
            // Ensure contactIds are integers
            const validContactIds = contactIds.map(id => parseInt(id)).filter(id => !isNaN(id));

            console.log('Original contactIds:', contactIds);
            console.log('Valid contactIds:', validContactIds);
            console.log('GroupId:', groupId, typeof groupId);

            const response = await fetch(`/api/groups/${groupId}/contacts/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactIds: validContactIds })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccessNotification('Contacts Added', `${result.results.added.length} contacts added to group`);
                this.loadStoredContacts(); // Refresh contacts to show updated group info
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error adding contacts to group:', error);
            this.showErrorNotification('Error Adding Contacts', error.message);
            throw error;
        }
    }

    async removeContactFromGroup(groupId, contactId) {
        try {
            const response = await fetch(`/api/groups/${groupId}/contacts/${contactId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccessNotification('Contact Removed', 'Contact removed from group successfully');
                this.loadStoredContacts(); // Refresh contacts to show updated group info
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error removing contact from group:', error);
            this.showErrorNotification('Error Removing Contact', error.message);
        }
    }

    updateGroupStatistics(statistics) {
        const statsContainer = document.getElementById('groupStatistics');
        if (statsContainer && statistics) {
            statsContainer.innerHTML = `
                <div class="row">
                    <div class="col-6">
                        <div class="text-center">
                            <h4 class="text-primary">${statistics.totalGroups}</h4>
                            <small class="text-muted">Total Groups</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center">
                            <h4 class="text-success">${statistics.totalMemberships}</h4>
                            <small class="text-muted">Total Memberships</small>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    displayGroups() {
        const container = document.getElementById('groupsContainer');
        if (!container) return;

        if (this.groups.length === 0) {
            container.innerHTML = '<p class="text-muted">No groups created yet. Create your first group above.</p>';
            return;
        }

        container.innerHTML = this.groups.map(group => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title">
                                <span class="badge me-2" style="background-color: ${group.color}">&nbsp;</span>
                                ${group.name}
                                <span class="badge bg-secondary ms-2">${group.memberCount} members</span>
                            </h6>
                            ${group.description ? `<p class="card-text text-muted">${group.description}</p>` : ''}
                            <small class="text-muted">Created: ${new Date(group.createdAt).toLocaleDateString()}</small>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="app.showGroupDetails(${group.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="app.showAddContactsToGroupModal(${group.id})" title="Add Contacts">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteGroup(${group.id})" title="Delete Group">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateGroupFilter() {
        const filterSelect = document.getElementById('contactGroupFilter');
        if (!filterSelect) return;

        // Clear existing options except "All Contacts"
        filterSelect.innerHTML = '<option value="">All Contacts</option>';

        // Add group options
        this.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name} (${group.memberCount} members)`;
            filterSelect.appendChild(option);
        });
    }

    filterContactsByGroup(groupId) {
        if (!groupId) {
            // Show all contacts
            this.displayContacts(this.contacts);
        } else {
            // Filter contacts by group
            const filteredContacts = this.contacts.filter(contact =>
                contact.groups && contact.groups.some(group => group.id == groupId)
            );
            this.displayContacts(filteredContacts);
        }
    }

    showGroupDetails(groupId) {
        // This could open a modal with detailed group information
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            alert(`Group: ${group.name}\nMembers: ${group.memberCount}\nDescription: ${group.description || 'No description'}`);
        }
    }

    showAddContactsToGroupModal(groupId) {
        // Simple implementation - could be enhanced with a proper modal
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const selectedContacts = this.getSelectedContacts();
        if (selectedContacts.length === 0) {
            this.showWarningNotification('No Contacts Selected', 'Please select contacts to add to the group');
            return;
        }

        if (confirm(`Add ${selectedContacts.length} selected contacts to group "${group.name}"?`)) {
            const contactIds = selectedContacts.map(c => c.id);
            this.addContactsToGroup(groupId, contactIds);
        }
    }

    showAddToGroupModal(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        if (this.groups.length === 0) {
            this.showWarningNotification('No Groups Available', 'Please create a group first in the Groups tab');
            return;
        }

        // Set selected contact info
        document.getElementById('selectedContactName').textContent = `${contact.name} (${contact.number})`;

        // Store contact ID for later use
        this.selectedContactForGroup = contactId;

        // Load groups into modal
        this.loadGroupsIntoModal('groupSelectionList', 'noGroupsAlert');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addToGroupModal'));
        modal.show();
    }

    showBulkAddToGroupModal() {
        const selectedContacts = this.getSelectedContacts();

        if (selectedContacts.length === 0) {
            this.showWarningNotification('No Contacts Selected', 'Please select contacts first');
            return;
        }

        // Refresh groups first to ensure we have latest data
        this.loadGroups().then(() => {
            if (this.groups.length === 0) {
                this.showWarningNotification('No Groups Available', 'Please create a group first in the Groups tab');
                return;
            }

            // Set selected contacts info
            document.getElementById('selectedContactsCount').textContent = selectedContacts.length;

            // Store selected contacts for later use
            this.selectedContactsForGroup = selectedContacts.map(c => c.id);

            // Load groups into modal
            this.loadGroupsIntoModal('bulkGroupSelectionList', 'bulkNoGroupsAlert');

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('bulkAddToGroupModal'));
            modal.show();
        });
    }

    loadGroupsIntoModal(containerId, alertId) {
        const container = document.getElementById(containerId);
        const alert = document.getElementById(alertId);

        if (this.groups.length === 0) {
            container.style.display = 'none';
            alert.style.display = 'block';
            return;
        }

        alert.style.display = 'none';
        container.style.display = 'block';

        container.innerHTML = this.groups.map(group => `
            <div class="form-check mb-2">
                <input class="form-check-input group-modal-checkbox" type="checkbox" value="${group.id}" id="modal_group_${group.id}">
                <label class="form-check-label d-flex align-items-center" for="modal_group_${group.id}">
                    <span class="badge me-2" style="background-color: ${group.color}">&nbsp;</span>
                    <div class="flex-grow-1">
                        <strong>${group.name}</strong>
                        ${group.description ? `<br><small class="text-muted">${group.description}</small>` : ''}
                        <br><small class="text-info">${group.memberCount} members</small>
                    </div>
                </label>
            </div>
        `).join('');
    }

    async handleAddToGroup() {
        const selectedGroupIds = Array.from(document.querySelectorAll('.group-modal-checkbox:checked'))
            .map(cb => parseFloat(cb.value));

        if (selectedGroupIds.length === 0) {
            this.showWarningNotification('No Groups Selected', 'Please select at least one group');
            return;
        }

        const contactId = this.selectedContactForGroup;
        const contact = this.contacts.find(c => c.id === contactId);

        if (!contact) {
            this.showErrorNotification('Contact Not Found', 'Selected contact not found');
            return;
        }

        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const groupId of selectedGroupIds) {
                try {
                    await this.addContactsToGroup(groupId, [contactId]);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    const group = this.groups.find(g => g.id === groupId);
                    errors.push(`${group?.name || 'Unknown Group'}: ${error.message}`);
                }
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addToGroupModal'));
            modal.hide();

            // Show results
            if (successCount > 0) {
                this.showSuccessNotification(
                    'Contact Added to Groups',
                    `${contact.name} was added to ${successCount} group(s)`
                );
            }

            if (errorCount > 0) {
                this.showWarningNotification(
                    'Some Groups Failed',
                    `Failed to add to ${errorCount} group(s): ${errors.join(', ')}`
                );
            }

            // Refresh contact display
            this.loadStoredContacts();

        } catch (error) {
            console.error('Error in handleAddToGroup:', error);
            this.showErrorNotification('Error Adding to Group', error.message);
        }
    }

    async handleBulkAddToGroup() {
        const selectedGroupIds = Array.from(document.querySelectorAll('.group-modal-checkbox:checked'))
            .map(cb => parseFloat(cb.value));

        if (selectedGroupIds.length === 0) {
            this.showWarningNotification('No Groups Selected', 'Please select at least one group');
            return;
        }

        const contactIds = this.selectedContactsForGroup;

        if (!contactIds || contactIds.length === 0) {
            this.showErrorNotification('No Contacts Selected', 'No contacts selected for bulk operation');
            return;
        }

        // Debug logging
        console.log('Selected Group IDs:', selectedGroupIds);
        console.log('Contact IDs to add:', contactIds);
        console.log('Available groups:', this.groups);

        try {
            let totalSuccess = 0;
            let totalErrors = 0;
            let totalAlreadyInGroup = 0;
            const groupResults = [];
            const errorDetails = [];

            for (const groupId of selectedGroupIds) {
                try {
                    const group = this.groups.find(g => g.id === groupId);
                    if (!group) {
                        errorDetails.push(`Group with ID ${groupId} not found`);
                        totalErrors += contactIds.length;
                        continue;
                    }

                    console.log(`Adding ${contactIds.length} contacts to group: ${group.name}`);

                    const result = await this.addContactsToGroup(groupId, contactIds);

                    console.log('Add result:', result);

                    if (result && result.results) {
                        totalSuccess += result.results.added.length;
                        totalErrors += result.results.failed.length;
                        totalAlreadyInGroup += result.results.alreadyInGroup.length;

                        groupResults.push(`${group.name}: ${result.results.added.length} added, ${result.results.alreadyInGroup.length} already in group, ${result.results.failed.length} failed`);

                        // Log failed contacts for debugging
                        if (result.results.failed.length > 0) {
                            console.log(`Failed contacts for group ${group.name}:`, result.results.failed);
                            result.results.failed.forEach(failure => {
                                errorDetails.push(`${group.name}: Contact ${failure.contactId} - ${failure.error}`);
                            });
                        }
                    }
                } catch (error) {
                    const group = this.groups.find(g => g.id === groupId);
                    console.error(`Error adding contacts to group ${group?.name}:`, error);
                    totalErrors += contactIds.length;
                    groupResults.push(`${group?.name}: Failed - ${error.message}`);
                    errorDetails.push(`${group?.name}: ${error.message}`);
                }
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkAddToGroupModal'));
            modal.hide();

            // Show detailed results
            if (totalSuccess > 0) {
                this.showSuccessNotification(
                    'Bulk Add Completed',
                    `${totalSuccess} contacts successfully added to groups.`
                );
            }

            if (totalAlreadyInGroup > 0) {
                this.showInfoNotification(
                    'Some Contacts Already in Groups',
                    `${totalAlreadyInGroup} contacts were already in the selected groups.`
                );
            }

            if (totalErrors > 0) {
                console.error('Error details:', errorDetails);
                this.showErrorNotification(
                    'Some Operations Failed',
                    `${totalErrors} operations failed. Details: ${errorDetails.slice(0, 3).join('; ')}${errorDetails.length > 3 ? '...' : ''}`
                );
            }

            // Show summary
            console.log('Bulk add summary:', {
                totalSuccess,
                totalAlreadyInGroup,
                totalErrors,
                groupResults,
                errorDetails
            });

            // Refresh contact display
            this.loadStoredContacts();

        } catch (error) {
            console.error('Error in handleBulkAddToGroup:', error);
            this.showErrorNotification('Error in Bulk Operation', error.message);
        }
    }

    debugGroupInfo() {
        const selectedContacts = this.getSelectedContacts();
        const debugInfo = {
            totalContacts: this.contacts.length,
            selectedContacts: selectedContacts.length,
            selectedContactIds: selectedContacts.map(c => c.id),
            selectedContactIdsTypes: selectedContacts.map(c => ({ id: c.id, type: typeof c.id })),
            totalGroups: this.groups.length,
            groups: this.groups.map(g => ({
                id: g.id,
                type: typeof g.id,
                name: g.name,
                memberCount: g.memberCount
            })),
            contactSample: this.contacts.slice(0, 3).map(c => ({
                id: c.id,
                type: typeof c.id,
                name: c.name,
                number: c.number
            })),
            selectedContactsForGroup: this.selectedContactsForGroup
        };

        console.log('=== DEBUG GROUP INFO ===');
        console.log(debugInfo);

        alert(`Debug Info (check console for details):

Total Contacts: ${debugInfo.totalContacts}
Selected Contacts: ${debugInfo.selectedContacts}
Total Groups: ${debugInfo.totalGroups}

Selected Contact IDs: ${debugInfo.selectedContactIds.join(', ')}
Contact ID Types: ${debugInfo.selectedContactIdsTypes.map(c => `${c.id}(${c.type})`).join(', ')}

Groups: ${debugInfo.groups.map(g => `${g.name} (ID: ${g.id}, Type: ${g.type})`).join(', ')}

Check browser console for full details.`);
    }

    initBlastTab() {
        const blastContent = document.getElementById('blastContent');

        if (this.contacts.length === 0) {
            blastContent.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Please import contacts first from the Contacts tab to start blast messaging.
                </div>
            `;
            return;
        }

        this.renderBlastForm();
        this.updateBlastContactCount();
        this.updateDynamicVariables();
    }

    updateBlastContactCount() {
        const countElement = document.getElementById('blastContactCount');
        if (!countElement) return;

        const recipientType = document.getElementById('recipientType')?.value || 'selected';
        let contactCount = 0;

        if (recipientType === 'all') {
            contactCount = this.contacts.length;
        } else if (recipientType === 'groups') {
            // Count contacts in selected groups
            const selectedGroupIds = Array.from(document.querySelectorAll('.group-checkbox:checked'))
                .map(cb => parseFloat(cb.value));

            const contactsInGroups = new Set();
            selectedGroupIds.forEach(groupId => {
                this.contacts.forEach(contact => {
                    if (contact.groups && contact.groups.some(g => g.id === groupId)) {
                        contactsInGroups.add(contact.id);
                    }
                });
            });
            contactCount = contactsInGroups.size;
        } else {
            // Selected contacts
            const selectedContacts = this.getSelectedContacts();
            contactCount = selectedContacts.length;
        }

        countElement.textContent = contactCount;
    }

    updateDynamicVariables() {
        const customVariablesContainer = document.getElementById('customVariables');
        const availableVariablesSpan = document.getElementById('availableVariables');

        if (!customVariablesContainer || !this.headers) return;

        // Clear existing custom variables
        customVariablesContainer.innerHTML = '';

        // Standard variables
        const standardVars = ['name', 'number', 'email', 'company', 'address', 'notes', 'date', 'time'];

        // Get custom variables from headers
        const customVars = this.headers.filter(header =>
            !standardVars.includes(header.toLowerCase())
        );

        // Add buttons for custom variables
        customVars.forEach(variable => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-warning btn-sm me-1 mb-1';
            button.onclick = () => insertVariable('blastMessage', variable);
            button.title = `Insert ${variable}`;
            button.innerHTML = `{{${variable}}}`;
            customVariablesContainer.appendChild(button);
        });

        // Update available variables text
        if (availableVariablesSpan) {
            const allVars = [...standardVars, ...customVars].map(v => `{{${v}}}`);
            availableVariablesSpan.textContent = allVars.join(', ');
        }
    }

    renderBlastForm() {
        const blastContent = document.getElementById('blastContent');

        blastContent.innerHTML = `
            <form id="blastMessageForm">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="blastType" class="form-label">Message Type</label>
                        <select class="form-select" id="blastType">
                            <option value="text">Text Only</option>
                            <option value="image">Text + Image</option>
                            <option value="document">Text + Document</option>
                            <option value="mixed">Mixed (Different files per contact)</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="blastDelay" class="form-label">Delay Between Messages (ms)</label>
                        <input type="number" class="form-control" id="blastDelay" value="1000" min="500" max="10000">
                        <div class="form-text">Recommended: 1000-3000ms to avoid being blocked</div>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="recipientType" class="form-label">Send To</label>
                        <select class="form-select" id="recipientType">
                            <option value="selected">Selected Contacts</option>
                            <option value="groups">Specific Groups</option>
                            <option value="all">All Contacts</option>
                        </select>
                    </div>
                    <div class="col-md-6" id="groupSelectionContainer" style="display: none;">
                        <label for="selectedGroups" class="form-label">Select Groups</label>
                        <div id="groupCheckboxes" class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
                            ${this.groups.map(group => `
                                <div class="form-check">
                                    <input class="form-check-input group-checkbox" type="checkbox" value="${group.id}" id="group_${group.id}">
                                    <label class="form-check-label" for="group_${group.id}">
                                        <span class="badge me-2" style="background-color: ${group.color}">&nbsp;</span>
                                        ${group.name} (${group.memberCount} members)
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="blastMessage" class="form-label">Message Template</label>

                    <!-- Rich Text Toolbar for Blast -->
                    <div class="btn-toolbar mb-2" role="toolbar">
                        <div class="btn-group me-2" role="group">
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="formatText('blastMessage', 'bold')" title="Bold">
                                <i class="fas fa-bold"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="formatText('blastMessage', 'italic')" title="Italic">
                                <i class="fas fa-italic"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="formatText('blastMessage', 'strikethrough')" title="Strikethrough">
                                <i class="fas fa-strikethrough"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="formatText('blastMessage', 'monospace')" title="Monospace">
                                <i class="fas fa-code"></i>
                            </button>
                        </div>
                        <div class="btn-group me-2" role="group" id="standardVariables">
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="insertVariable('blastMessage', 'name')" title="Insert Name">
                                {{name}}
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="insertVariable('blastMessage', 'number')" title="Insert Number">
                                {{number}}
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="insertVariable('blastMessage', 'email')" title="Insert Email">
                                {{email}}
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="insertVariable('blastMessage', 'company')" title="Insert Company">
                                {{company}}
                            </button>
                        </div>
                        <div class="btn-group me-2" role="group" id="customVariables">
                            <!-- Dynamic variables from imported headers will be added here -->
                        </div>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-success btn-sm" onclick="insertVariable('blastMessage', 'date')" title="Insert Date">
                                {{date}}
                            </button>
                            <button type="button" class="btn btn-outline-success btn-sm" onclick="insertVariable('blastMessage', 'time')" title="Insert Time">
                                {{time}}
                            </button>
                        </div>
                    </div>

                    <textarea class="form-control" id="blastMessage" rows="6" placeholder="Type your message here...&#10;&#10;Use toolbar buttons or type: *bold*, _italic_, ~strikethrough~, \`\`\`monospace\`\`\`&#10;Use variables from your imported file headers" required></textarea>
                    <div class="form-text">
                        <strong>Available variables:</strong> <span id="availableVariables">{{name}}, {{number}}, {{email}}, {{company}}, {{address}}, {{notes}}, {{date}}, {{time}}</span>
                    </div>
                </div>

                <div id="blastFileUpload" class="mb-3" style="display: none;">
                    <label for="blastFile" class="form-label">Upload File</label>
                    <input type="file" class="form-control" id="blastFile" accept="*/*">
                </div>

                <div id="mixedFileUpload" class="mb-3" style="display: none;">
                    <label class="form-label">Upload Multiple Files (Different files per contact)</label>
                    <input type="file" class="form-control mb-2" id="mixedFiles" accept="*/*" multiple>
                    <div class="form-text">Upload multiple files. Each contact will get a different file in order.</div>
                    <div id="fileAssignments" class="mt-3"></div>
                </div>

                <div class="mb-3">
                    <button type="button" class="btn btn-outline-secondary" id="previewBtn">
                        <i class="fas fa-eye me-2"></i>
                        Preview Message
                    </button>
                </div>

                <div id="messagePreview" class="message-preview" style="display: none;">
                    <h6>Message Preview:</h6>
                    <div id="previewContent"></div>
                </div>

                <div class="d-grid">
                    <button type="submit" class="btn btn-success btn-lg" id="sendBlastBtn">
                        <i class="fas fa-broadcast-tower me-2"></i>
                        Send Blast to <span id="blastContactCount">${this.contacts.length}</span> Selected Contacts
                    </button>
                </div>
            </form>

            <div id="blastProgress" class="blast-progress" style="display: none;">
                <h5>Blast Progress</h5>
                <div class="progress-stats">
                    <div class="stat-item">
                        <div class="stat-number" id="totalStat">0</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="sentStat">0</div>
                        <div class="stat-label">Sent</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="failedStat">0</div>
                        <div class="stat-label">Failed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="progressStat">0%</div>
                        <div class="stat-label">Progress</div>
                    </div>
                </div>
                <div class="progress mb-3">
                    <div class="progress-bar" id="progressBar" role="progressbar" style="width: 0%"></div>
                </div>
                <div id="currentContact" class="text-muted"></div>
            </div>
        `;

        // Setup blast form event listeners
        this.setupBlastFormListeners();
    }

    setupBlastFormListeners() {
        // Blast message type change
        document.getElementById('blastType').addEventListener('change', (e) => {
            this.toggleBlastFileUpload(e.target.value);
        });

        // Mixed files change
        document.getElementById('mixedFiles').addEventListener('change', (e) => {
            this.handleMixedFilesUpload(e.target.files);
        });

        // Preview button
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.previewMessage();
        });

        // Recipient type change
        document.getElementById('recipientType').addEventListener('change', (e) => {
            this.toggleGroupSelection(e.target.value);
            this.updateBlastContactCount();
        });

        // Group checkbox changes
        document.querySelectorAll('.group-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBlastContactCount();
            });
        });

        // Blast form submission
        document.getElementById('blastMessageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendBlastMessage();
        });
    }

    toggleBlastFileUpload(type) {
        const singleFileUpload = document.getElementById('blastFileUpload');
        const mixedFileUpload = document.getElementById('mixedFileUpload');

        singleFileUpload.style.display = 'none';
        mixedFileUpload.style.display = 'none';

        if (type === 'image' || type === 'document') {
            singleFileUpload.style.display = 'block';
        } else if (type === 'mixed') {
            mixedFileUpload.style.display = 'block';
        }
    }

    toggleGroupSelection(recipientType) {
        const groupContainer = document.getElementById('groupSelectionContainer');
        const sendButton = document.getElementById('sendBlastBtn');

        if (recipientType === 'groups') {
            groupContainer.style.display = 'block';
        } else {
            groupContainer.style.display = 'none';
        }

        // Update button text based on recipient type
        const buttonText = recipientType === 'groups' ? 'Send Blast to Selected Groups' :
                          recipientType === 'all' ? 'Send Blast to All Contacts' :
                          'Send Blast to Selected Contacts';

        sendButton.innerHTML = `
            <i class="fas fa-broadcast-tower me-2"></i>
            ${buttonText} (<span id="blastContactCount">0</span>)
        `;
    }

    async handleMixedFilesUpload(files) {
        if (!files || files.length === 0) return;

        const fileAssignments = document.getElementById('fileAssignments');
        fileAssignments.innerHTML = '<h6>File Assignments:</h6>';

        // Upload all files first
        const uploadedFiles = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload/file', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    uploadedFiles.push({
                        originalName: file.name,
                        path: result.file.path,
                        url: result.file.url,
                        type: file.type.startsWith('image/') ? 'image' : 'document'
                    });
                }
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        // Show file assignments
        const table = document.createElement('table');
        table.className = 'table table-sm';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Contact</th>
                    <th>File</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        this.contacts.forEach((contact, index) => {
            const fileIndex = index % uploadedFiles.length;
            const assignedFile = uploadedFiles[fileIndex];

            if (assignedFile) {
                // Assign file to contact
                contact.media = {
                    type: assignedFile.type,
                    path: assignedFile.path,
                    fileName: assignedFile.originalName
                };

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contact.name || contact.number}</td>
                    <td>${assignedFile.originalName}</td>
                    <td><span class="badge bg-${assignedFile.type === 'image' ? 'primary' : 'secondary'}">${assignedFile.type}</span></td>
                `;
                tbody.appendChild(row);
            }
        });

        fileAssignments.appendChild(table);
        this.showAlert(`Successfully assigned ${uploadedFiles.length} files to ${this.contacts.length} contacts`, 'success');
    }

    previewMessage() {
        const message = document.getElementById('blastMessage').value;
        const previewDiv = document.getElementById('messagePreview');
        const previewContent = document.getElementById('previewContent');

        if (!message) {
            this.showAlert('Please enter a message to preview', 'warning');
            return;
        }

        // Use first contact for preview
        const sampleContact = this.contacts[0];
        let previewText = message;

        // Replace variables
        previewText = previewText.replace(/{{name}}/gi, sampleContact.name || '[Name]');
        previewText = previewText.replace(/{{number}}/gi, sampleContact.number || '[Number]');
        previewText = previewText.replace(/{{email}}/gi, sampleContact.email || '[Email]');
        previewText = previewText.replace(/{{company}}/gi, sampleContact.company || '[Company]');
        previewText = previewText.replace(/{{address}}/gi, sampleContact.address || '[Address]');
        previewText = previewText.replace(/{{notes}}/gi, sampleContact.notes || '[Notes]');

        // Add date/time
        const now = new Date();
        previewText = previewText.replace(/{{date}}/gi, now.toLocaleDateString('id-ID'));
        previewText = previewText.replace(/{{time}}/gi, now.toLocaleTimeString('id-ID'));

        // Format rich text for display
        previewText = previewText.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        previewText = previewText.replace(/_([^_]+)_/g, '<em>$1</em>');
        previewText = previewText.replace(/~([^~]+)~/g, '<del>$1</del>');
        previewText = previewText.replace(/```([^`]+)```/g, '<code>$1</code>');

        previewContent.innerHTML = `
            <p><strong>Sample contact:</strong> ${sampleContact.name} (${sampleContact.number})</p>
            <hr>
            <div style="white-space: pre-wrap;">${previewText}</div>
        `;

        previewDiv.style.display = 'block';
    }

    async sendBlastMessage() {
        if (!this.isConnected) {
            this.showErrorNotification('WhatsApp Not Connected', 'Please connect to WhatsApp first');
            return;
        }

        const message = document.getElementById('blastMessage').value;
        const type = document.getElementById('blastType').value;
        const delay = parseInt(document.getElementById('blastDelay').value);
        const recipientType = document.getElementById('recipientType').value;

        if (!message) {
            this.showWarningNotification('Message Required', 'Please enter a message');
            return;
        }

        // Get target contacts based on recipient type
        let targetContacts = [];
        let recipientDescription = '';

        if (recipientType === 'all') {
            targetContacts = this.contacts;
            recipientDescription = `${targetContacts.length} contacts (All Contacts)`;
        } else if (recipientType === 'groups') {
            const selectedGroupIds = Array.from(document.querySelectorAll('.group-checkbox:checked'))
                .map(cb => parseFloat(cb.value));

            if (selectedGroupIds.length === 0) {
                this.showWarningNotification('No Groups Selected', 'Please select at least one group');
                return;
            }

            const contactsInGroups = new Set();
            const selectedGroupNames = [];

            selectedGroupIds.forEach(groupId => {
                const group = this.groups.find(g => g.id === groupId);
                if (group) selectedGroupNames.push(group.name);

                this.contacts.forEach(contact => {
                    if (contact.groups && contact.groups.some(g => g.id === groupId)) {
                        contactsInGroups.add(contact);
                    }
                });
            });

            targetContacts = Array.from(contactsInGroups);
            recipientDescription = `${targetContacts.length} contacts from groups: ${selectedGroupNames.join(', ')}`;
        } else {
            targetContacts = this.getSelectedContacts();
            recipientDescription = `${targetContacts.length} selected contacts`;
        }

        if (targetContacts.length === 0) {
            this.showWarningNotification('No Recipients', 'No contacts found for the selected criteria');
            return;
        }

        // Show confirmation with SweetAlert
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: 'Confirm Blast Message',
                html: `
                    <div class="text-start">
                        <p><strong>Recipients:</strong> ${recipientDescription}</p>
                        <p><strong>Message Type:</strong> ${type}</p>
                        <p><strong>Delay:</strong> ${delay}ms between messages</p>
                        <hr>
                        <p><strong>Message Preview:</strong></p>
                        <div class="p-2 bg-light rounded" style="max-height: 150px; overflow-y: auto;">
                            ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
                        </div>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Send Blast',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6c757d'
            });

            if (!result.isConfirmed) {
                return;
            }
        } else {
            if (!confirm(`Are you sure you want to send blast message to ${selectedContacts.length} selected contacts?`)) {
                return;
            }
        }

        // Show progress
        // Show start notification
        this.showInfoNotification('Blast Started', `Sending messages to ${targetContacts.length} contacts...`);

        // Show initial blast progress modal
        this.showBlastProgressModal(targetContacts.length);
        this.blastStartTime = Date.now(); // Track start time

        try {
            // Start progress simulation
            this.simulateBlastProgress(targetContacts.length, delay);

            const response = await fetch('/api/messages/blast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contacts: targetContacts,
                    message: message,
                    delay: delay
                })
            });

            const result = await response.json();

            // Close progress modal
            this.closeBlastProgressModal();

            if (result.success) {
                // Show detailed blast completion notification
                this.showBlastComplete({
                    total: result.summary.total || targetContacts.length,
                    successful: result.summary.sent,
                    failed: result.summary.failed,
                    duration: this.calculateBlastDuration()
                });
                this.hideBlastProgress();
            } else {
                throw new Error(result.error || 'Failed to send blast');
            }

        } catch (error) {
            console.error('Error sending blast:', error);

            // Close progress modal
            this.closeBlastProgressModal();

            this.showErrorNotification('Blast Failed', error.message);
            this.hideBlastProgress();
        }
    }

    showBlastProgress() {
        document.getElementById('blastMessageForm').style.display = 'none';
        document.getElementById('blastProgress').style.display = 'block';

        // Initialize stats
        document.getElementById('totalStat').textContent = this.contacts.length;
        document.getElementById('sentStat').textContent = '0';
        document.getElementById('failedStat').textContent = '0';
        document.getElementById('progressStat').textContent = '0%';
        document.getElementById('progressBar').style.width = '0%';
    }

    hideBlastProgress() {
        document.getElementById('blastMessageForm').style.display = 'block';
        document.getElementById('blastProgress').style.display = 'none';
    }

    updateBlastProgress(progress) {
        document.getElementById('sentStat').textContent = progress.sent;
        document.getElementById('failedStat').textContent = progress.failed;
        document.getElementById('progressStat').textContent = progress.percentage + '%';
        document.getElementById('progressBar').style.width = progress.percentage + '%';

        if (progress.current <= progress.total) {
            document.getElementById('currentContact').textContent =
                `Processing contact ${progress.current} of ${progress.total}`;
        }

        // Note: Blast completion is now handled by socket event 'blast-complete'
    }

    calculateBlastDuration() {
        if (this.blastStartTime) {
            const duration = Date.now() - this.blastStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
        return 'N/A';
    }

    showLoading(text = 'Loading...') {
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
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of container
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Rich text formatting functions
    formatText(textareaId, format) {
        const textarea = document.getElementById(textareaId);
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        let formattedText = '';

        switch(format) {
            case 'bold':
                formattedText = selectedText ? `*${selectedText}*` : '*bold text*';
                break;
            case 'italic':
                formattedText = selectedText ? `_${selectedText}_` : '_italic text_';
                break;
            case 'strikethrough':
                formattedText = selectedText ? `~${selectedText}~` : '~strikethrough text~';
                break;
            case 'monospace':
                formattedText = selectedText ? `\`\`\`${selectedText}\`\`\`` : '```monospace text```';
                break;
        }

        // Replace selected text with formatted text
        const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        textarea.value = newValue;

        // Set cursor position
        const newCursorPos = start + formattedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
    }

    insertVariable(textareaId, variable) {
        const textarea = document.getElementById(textareaId);
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const variableText = `{{${variable}}}`;

        // Insert variable at cursor position
        const newValue = textarea.value.substring(0, start) + variableText + textarea.value.substring(end);
        textarea.value = newValue;

        // Set cursor position after the variable
        const newCursorPos = start + variableText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
    }

    formatPhoneNumberInput(input) {
        const value = input.value;
        const cursorPos = input.selectionStart;

        // Remove non-digits for processing
        const digits = value.replace(/\D/g, '');

        // Auto-format for display
        let formatted = this.autoFormatNumber(digits);

        // Update input value
        input.value = formatted;

        // Try to maintain cursor position
        const newCursorPos = Math.min(cursorPos, formatted.length);
        input.setSelectionRange(newCursorPos, newCursorPos);

        // Show preview
        this.showNumberPreview(digits);
    }

    autoFormatNumber(digits) {
        if (!digits) return '';

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

    async showNumberPreview(digits) {
        const previewElement = document.getElementById('numberPreview');

        if (!digits) {
            previewElement.innerHTML = '';
            return;
        }

        try {
            const response = await fetch('/api/contacts/format-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ number: digits })
            });

            const result = await response.json();

            if (result.success) {
                const statusClass = result.isValid ? 'text-success' : 'text-warning';
                const statusIcon = result.isValid ? 'fa-check-circle' : 'fa-exclamation-triangle';

                previewElement.innerHTML = `
                    <small class="${statusClass}">
                        <i class="fas ${statusIcon} me-1"></i>
                        ${result.isValid ? 'Valid' : 'Invalid'}: ${result.display}
                        ${result.detection.suggestions.length > 0 ?
                          '<br><span class="text-muted">' + result.detection.suggestions[0] + '</span>' : ''}
                    </small>
                `;
            }
        } catch (error) {
            console.error('Error formatting number:', error);
        }
    }

    async validatePhoneNumber(input) {
        const value = input.value.replace(/\D/g, '');

        if (!value) return;

        try {
            const response = await fetch('/api/contacts/format-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ number: value })
            });

            const result = await response.json();

            if (result.success && result.isValid) {
                // Update input with properly formatted number
                input.value = result.formatted;
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
        } catch (error) {
            console.error('Error validating number:', error);
        }
    }
}

// Global functions for toolbar buttons
function formatText(textareaId, format) {
    if (window.app) {
        window.app.formatText(textareaId, format);
    }
}

function insertVariable(textareaId, variable) {
    if (window.app) {
        window.app.insertVariable(textareaId, variable);
    }
}

function formatCurrentNumber() {
    if (window.app) {
        const input = document.getElementById('singleNumber');
        window.app.validatePhoneNumber(input);
    }
}

// Contact Search Functions
let currentContactSearchTerm = '';
let isAdvancedSearchVisible = false;

function searchMainContacts() {
    const searchInput = document.getElementById('contactSearchInput');
    const groupFilter = document.getElementById('contactGroupFilter');
    const selectedOnlyFilter = document.getElementById('searchSelectedOnly');
    const withGroupsOnlyFilter = document.getElementById('searchWithGroupsOnly');
    const searchCount = document.getElementById('mainContactSearchCount');

    if (!searchInput || !window.app || !window.app.contacts) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedGroupId = groupFilter ? groupFilter.value : '';
    const selectedOnly = selectedOnlyFilter ? selectedOnlyFilter.checked : false;
    const withGroupsOnly = withGroupsOnlyFilter ? withGroupsOnlyFilter.checked : false;

    currentContactSearchTerm = searchTerm;

    let filteredContacts = [...window.app.contacts];

    // Apply text search filter
    if (searchTerm) {
        filteredContacts = filteredContacts.filter(contact => {
            const nameMatch = (contact.name || '').toLowerCase().includes(searchTerm);
            const numberMatch = (contact.number || '').toLowerCase().includes(searchTerm);
            const emailMatch = (contact.email || '').toLowerCase().includes(searchTerm);
            const companyMatch = (contact.company || '').toLowerCase().includes(searchTerm);

            // Search in custom fields
            let customFieldMatch = false;
            Object.keys(contact).forEach(key => {
                if (!['id', 'name', 'number', 'email', 'company', 'selected', 'groups', 'importedAt'].includes(key)) {
                    const value = contact[key];
                    if (value && value.toString().toLowerCase().includes(searchTerm)) {
                        customFieldMatch = true;
                    }
                }
            });

            return nameMatch || numberMatch || emailMatch || companyMatch || customFieldMatch;
        });
    }

    // Apply group filter
    if (selectedGroupId) {
        filteredContacts = filteredContacts.filter(contact =>
            contact.groups && contact.groups.some(group => group.id == selectedGroupId)
        );
    }

    // Apply selected only filter
    if (selectedOnly) {
        filteredContacts = filteredContacts.filter(contact => contact.selected !== false);
    }

    // Apply with groups only filter
    if (withGroupsOnly) {
        filteredContacts = filteredContacts.filter(contact => contact.groups && contact.groups.length > 0);
    }

    // Update search count
    if (searchCount) {
        const totalContacts = window.app.contacts.length;
        const filteredCount = filteredContacts.length;

        if (searchTerm || selectedGroupId || selectedOnly || withGroupsOnly) {
            searchCount.textContent = `Showing ${filteredCount} of ${totalContacts} contacts`;
            searchCount.className = filteredCount === 0 ? 'text-warning' : 'text-info';
        } else {
            searchCount.textContent = `${totalContacts} contacts total`;
            searchCount.className = 'text-muted';
        }
    }

    // Display filtered contacts with highlighting
    displayFilteredContacts(filteredContacts);
}

function clearMainContactSearch() {
    const searchInput = document.getElementById('contactSearchInput');
    const groupFilter = document.getElementById('contactGroupFilter');
    const selectedOnlyFilter = document.getElementById('searchSelectedOnly');
    const withGroupsOnlyFilter = document.getElementById('searchWithGroupsOnly');
    const searchCount = document.getElementById('mainContactSearchCount');

    if (searchInput) searchInput.value = '';
    if (groupFilter) groupFilter.value = '';
    if (selectedOnlyFilter) selectedOnlyFilter.checked = false;
    if (withGroupsOnlyFilter) withGroupsOnlyFilter.checked = false;

    if (searchCount) {
        const totalContacts = window.app ? window.app.contacts.length : 0;
        searchCount.textContent = `${totalContacts} contacts total`;
        searchCount.className = 'text-muted';
    }

    currentContactSearchTerm = '';

    // Show all contacts
    if (window.app && window.app.contacts) {
        window.app.displayContacts(window.app.contacts);
    }
}

function displayFilteredContacts(contacts) {
    const tableBody = document.getElementById('contactsTableBody');
    const table = document.getElementById('contactsTable');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (contacts.length === 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="7" class="text-center text-muted py-4">
                <i class="fas fa-search me-2"></i>
                No contacts found matching your search criteria.
                <br>
                <button class="btn btn-sm btn-outline-secondary mt-2" onclick="clearMainContactSearch()">
                    <i class="fas fa-times me-1"></i>Clear Search
                </button>
            </td>
        `;
        tableBody.appendChild(noResultsRow);
        table.style.display = 'block';
        return;
    }

    contacts.forEach((contact, index) => {
        const row = document.createElement('tr');

        // Highlight search terms
        const highlightText = (text, term) => {
            if (!term || !text) return text || '-';
            const regex = new RegExp(`(${term})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        row.innerHTML = `
            <td>
                <input type="checkbox" class="form-check-input contact-checkbox"
                       data-id="${contact.id}" data-index="${index}"
                       ${contact.selected !== false ? 'checked' : ''}
                       onchange="window.app.updateBulkActionButtons()">
            </td>
            <td>${highlightText(contact.name, currentContactSearchTerm)}</td>
            <td>
                <span class="badge bg-secondary">${highlightText(contact.displayNumber || contact.number, currentContactSearchTerm)}</span>
                <button class="btn btn-sm btn-outline-primary ms-1"
                        onclick="app.selectNumberForSingle('${contact.number}')"
                        title="Use for single message">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </td>
            <td>${highlightText(contact.email, currentContactSearchTerm)}</td>
            <td>${highlightText(contact.company, currentContactSearchTerm)}</td>
            <td>
                ${contact.groups ? contact.groups.map(group =>
                    `<span class="badge me-1" style="background-color: ${group.color}">${group.name}</span>`
                ).join('') : '-'}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="app.showEditContactModal(${contact.id})" title="Edit Contact">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="app.showAddToGroupModal(${contact.id})" title="Add to Group">
                        <i class="fas fa-users"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.removeContact(${contact.id})" title="Delete Contact">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners for checkboxes
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const contactId = parseInt(e.target.dataset.id);
            const selected = e.target.checked;

            try {
                await fetch(`/api/contacts/${contactId}/select`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ selected })
                });

                // Update local contact data
                const contact = window.app.contacts.find(c => c.id === contactId);
                if (contact) {
                    contact.selected = selected;
                }

                window.app.updateSelectedCount();
                window.app.updateBulkActionButtons();
            } catch (error) {
                console.error('Error updating contact selection:', error);
                // Revert checkbox state on error
                e.target.checked = !selected;
            }
        });
    });

    table.style.display = 'block';
}

function selectFilteredContacts() {
    const searchInput = document.getElementById('contactSearchInput');
    const groupFilter = document.getElementById('contactGroupFilter');
    const selectedOnlyFilter = document.getElementById('searchSelectedOnly');
    const withGroupsOnlyFilter = document.getElementById('searchWithGroupsOnly');

    if (!window.app || !window.app.contacts) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedGroupId = groupFilter ? groupFilter.value : '';
    const selectedOnly = selectedOnlyFilter ? selectedOnlyFilter.checked : false;
    const withGroupsOnly = withGroupsOnlyFilter ? withGroupsOnlyFilter.checked : false;

    let filteredContacts = [...window.app.contacts];

    // Apply same filters as search
    if (searchTerm) {
        filteredContacts = filteredContacts.filter(contact => {
            const nameMatch = (contact.name || '').toLowerCase().includes(searchTerm);
            const numberMatch = (contact.number || '').toLowerCase().includes(searchTerm);
            const emailMatch = (contact.email || '').toLowerCase().includes(searchTerm);
            const companyMatch = (contact.company || '').toLowerCase().includes(searchTerm);

            let customFieldMatch = false;
            Object.keys(contact).forEach(key => {
                if (!['id', 'name', 'number', 'email', 'company', 'selected', 'groups', 'importedAt'].includes(key)) {
                    const value = contact[key];
                    if (value && value.toString().toLowerCase().includes(searchTerm)) {
                        customFieldMatch = true;
                    }
                }
            });

            return nameMatch || numberMatch || emailMatch || companyMatch || customFieldMatch;
        });
    }

    if (selectedGroupId) {
        filteredContacts = filteredContacts.filter(contact =>
            contact.groups && contact.groups.some(group => group.id == selectedGroupId)
        );
    }

    if (selectedOnly) {
        filteredContacts = filteredContacts.filter(contact => contact.selected !== false);
    }

    if (withGroupsOnly) {
        filteredContacts = filteredContacts.filter(contact => contact.groups && contact.groups.length > 0);
    }

    // Select all filtered contacts
    filteredContacts.forEach(contact => {
        contact.selected = true;
        const checkbox = document.querySelector(`input[data-id="${contact.id}"]`);
        if (checkbox) checkbox.checked = true;
    });

    // Update bulk action button
    window.app.updateBulkActionButtons();

    alert(`Selected ${filteredContacts.length} filtered contacts`);
}

function toggleAdvancedSearch() {
    const advancedOptions = document.getElementById('advancedSearchOptions');
    const toggleButton = document.getElementById('advancedSearchToggle');

    if (!advancedOptions || !toggleButton) return;

    isAdvancedSearchVisible = !isAdvancedSearchVisible;

    if (isAdvancedSearchVisible) {
        advancedOptions.style.display = 'block';
        toggleButton.innerHTML = '<i class="fas fa-cog me-1"></i>Hide Advanced';
        toggleButton.classList.remove('btn-outline-info');
        toggleButton.classList.add('btn-info', 'text-white');
    } else {
        advancedOptions.style.display = 'none';
        toggleButton.innerHTML = '<i class="fas fa-cog me-1"></i>Advanced';
        toggleButton.classList.remove('btn-info', 'text-white');
        toggleButton.classList.add('btn-outline-info');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WABlastApp();

    // Initialize advanced search as hidden
    setTimeout(() => {
        const advancedOptions = document.getElementById('advancedSearchOptions');
        if (advancedOptions) {
            advancedOptions.style.display = 'none';
        }

        // Initialize search count
        const searchCount = document.getElementById('mainContactSearchCount');
        if (searchCount && window.app && window.app.contacts) {
            searchCount.textContent = `${window.app.contacts.length} contacts total`;
            searchCount.className = 'text-muted';
        }
    }, 1000);
});
