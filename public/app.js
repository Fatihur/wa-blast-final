// WhatsApp Blast Application - Frontend JavaScript

class WABlastApp {
    constructor() {
        this.socket = io();
        this.contacts = [];
        this.headers = [];
        this.isConnected = false;
        this.init();
    }

    init() {
        this.setupSocketListeners();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.checkConnectionStatus();
        this.loadStoredContacts();
    }

    setupSocketListeners() {
        // WhatsApp connection status updates
        this.socket.on('whatsapp-status', (status) => {
            this.updateConnectionStatus(status);
        });

        // Blast progress updates
        this.socket.on('blast-progress', (progress) => {
            this.updateBlastProgress(progress);
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

        // Tab changes
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'blast-tab') {
                    this.initBlastTab();
                }
            });
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
            const response = await fetch('/api/contacts');
            const data = await response.json();

            if (data.success) {
                this.contacts = data.contacts;
                this.headers = data.headers;

                if (this.contacts.length > 0) {
                    this.updateContactSummary(data.statistics);
                    this.displayContacts(this.contacts);
                }
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

    updateConnectionStatus(status) {
        this.isConnected = status.isConnected;
        const statusElement = document.getElementById('connectionStatus');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const qrCodeImage = document.getElementById('qrCodeImage');
        const qrPlaceholder = document.getElementById('qrPlaceholder');
        const messageElement = document.getElementById('connectionMessage');

        // Update status display
        if (status.isConnected) {
            statusElement.innerHTML = '<i class="fas fa-circle text-success me-1"></i>Connected';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            qrCodeImage.style.display = 'none';
            qrPlaceholder.style.display = 'block';
            qrPlaceholder.innerHTML = '<i class="fas fa-check-circle fa-3x text-success"></i><p class="mt-2 text-success">WhatsApp Connected!</p>';
            messageElement.innerHTML = '<div class="alert alert-success">WhatsApp connected successfully!</div>';
        } else if (status.status === 'connecting') {
            statusElement.innerHTML = '<i class="fas fa-circle text-warning me-1"></i>Connecting...';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            messageElement.innerHTML = '<div class="alert alert-info">Connecting to WhatsApp...</div>';
        } else if (status.status === 'qr-ready' && status.qrCode) {
            statusElement.innerHTML = '<i class="fas fa-circle text-warning me-1"></i>Scan QR Code';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            qrPlaceholder.style.display = 'none';
            qrCodeImage.src = status.qrCode;
            qrCodeImage.style.display = 'block';
            messageElement.innerHTML = '<div class="alert alert-warning">Please scan the QR code with your WhatsApp mobile app</div>';
        } else {
            statusElement.innerHTML = '<i class="fas fa-circle text-danger me-1"></i>Disconnected';
            connectBtn.style.display = 'block';
            disconnectBtn.style.display = 'none';
            qrCodeImage.style.display = 'none';
            qrPlaceholder.style.display = 'block';
            qrPlaceholder.innerHTML = '<i class="fas fa-qrcode fa-3x text-muted"></i><p class="mt-2 text-muted">Click connect to generate QR code</p>';
            messageElement.innerHTML = '';
        }

        this.hideLoading();
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
            this.showAlert('Please connect to WhatsApp first', 'danger');
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
                this.showAlert('Message sent successfully!', 'success');
                document.getElementById('singleMessageForm').reset();
                this.toggleFileUpload('single', 'text');
            } else {
                throw new Error(result.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showAlert(error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async importContacts() {
        const fileInput = document.getElementById('contactFile');
        
        if (!fileInput.files[0]) {
            this.showAlert('Please select a file to import', 'danger');
            return;
        }

        this.showLoading('Importing contacts...');

        try {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

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

                let message = `Successfully imported ${result.summary.valid} contacts`;
                if (result.summary.added !== undefined) {
                    message += ` (${result.summary.added} new, ${result.summary.duplicates} duplicates)`;
                }
                this.showAlert(message, 'success');

                if (result.invalidContacts && result.invalidContacts.length > 0) {
                    this.showAlert(`${result.summary.invalid} contacts were invalid and skipped`, 'warning');
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
            this.showAlert(error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    updateContactSummary(summary) {
        const summaryElement = document.getElementById('contactSummary');
        summaryElement.innerHTML = `
            <div class="row">
                <div class="col-4">
                    <div class="summary-card">
                        <div class="summary-number">${summary.total}</div>
                        <div class="summary-label">Total</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="summary-card">
                        <div class="summary-number">${summary.valid}</div>
                        <div class="summary-label">Valid</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="summary-card">
                        <div class="summary-number">${summary.invalid}</div>
                        <div class="summary-label">Invalid</div>
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
                    <button class="btn btn-sm btn-outline-danger" onclick="app.removeContact(${contact.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add select all/none buttons
        const selectAllRow = document.createElement('tr');
        selectAllRow.innerHTML = `
            <td colspan="6" class="text-center bg-light">
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
                } catch (error) {
                    console.error('Error updating contact selection:', error);
                    // Revert checkbox state on error
                    e.target.checked = !selected;
                }
            });
        });

        table.style.display = 'block';
        this.updateSelectedCount();
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
        const selectedContacts = this.getSelectedContacts();
        const countElement = document.getElementById('blastContactCount');
        if (countElement) {
            countElement.textContent = selectedContacts.length;
        }
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
            this.showAlert('Please connect to WhatsApp first', 'danger');
            return;
        }

        const message = document.getElementById('blastMessage').value;
        const type = document.getElementById('blastType').value;
        const delay = parseInt(document.getElementById('blastDelay').value);
        const selectedContacts = this.getSelectedContacts();

        if (!message) {
            this.showAlert('Please enter a message', 'danger');
            return;
        }

        if (selectedContacts.length === 0) {
            this.showAlert('Please select at least one contact', 'danger');
            return;
        }

        // Show confirmation
        if (!confirm(`Are you sure you want to send blast message to ${selectedContacts.length} selected contacts?`)) {
            return;
        }

        // Show progress
        this.showBlastProgress();

        try {
            const response = await fetch('/api/messages/blast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contacts: selectedContacts,
                    message: message,
                    delay: delay
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(`Blast completed! Sent: ${result.summary.sent}, Failed: ${result.summary.failed}`, 'success');
                this.hideBlastProgress();
            } else {
                throw new Error(result.error || 'Failed to send blast');
            }

        } catch (error) {
            console.error('Error sending blast:', error);
            this.showAlert(error.message, 'danger');
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WABlastApp();
});
