// File Matching Application JavaScript

class FileMatchingApp {
    constructor() {
        this.documents = [];
        this.matchingResults = null;
        this.contacts = [];
        this.headers = [];
        this.socket = io();

        // Validation state
        this.validationQueue = [];
        this.currentValidationIndex = 0;
        this.validationResults = {
            confirmed: [],
            changed: [],
            skipped: []
        };

        this.init();
    }

    init() {
        this.loadDocuments();
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        // Tab change events
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'matching-tab') {
                    this.initMatchingTab();
                } else if (e.target.id === 'blast-files-tab') {
                    this.initBlastFilesTab();
                }
            });
        });

        // File upload handler
        const fileInput = document.getElementById('documentsUpload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        // Blast form handler
        const blastForm = document.getElementById('blastFilesForm');
        if (blastForm) {
            blastForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBlastSubmission();
            });
        }

        // Load contacts and update variables
        this.loadContacts();

        // Validation modal event listeners
        this.setupValidationEventListeners();
    }

    setupValidationEventListeners() {
        // Confirm match button
        const confirmBtn = document.getElementById('confirmMatchBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmCurrentMatch());
        }

        // Skip contact button
        const skipBtn = document.getElementById('skipContactBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipCurrentContact());
        }

        // Change file button
        const changeBtn = document.getElementById('changeFileBtn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => this.showFileSelectionModal());
        }

        // File search input
        const fileSearchInput = document.getElementById('fileSearchInput');
        if (fileSearchInput) {
            fileSearchInput.addEventListener('input', (e) => this.filterFileSelection(e.target.value));
        }

        // Proceed with sending button
        const proceedBtn = document.getElementById('proceedWithSendingBtn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => this.proceedWithValidatedSending());
        }
    }

    setupSocketListeners() {
        // Blast progress updates
        this.socket.on('blast-progress', (progress) => {
            console.log('Received blast-progress event:', progress);
            this.updateBlastProgress(progress);
        });

        // Blast completion
        this.socket.on('blast-complete', (results) => {
            console.log('Received blast-complete event:', results);
            this.hideBlastProgress();
            this.showAlert(`Blast completed! Sent: ${results.successful}, Failed: ${results.failed}`, 'success');
        });
    }

    async loadDocuments() {
        try {
            const response = await fetch('/api/file-matching/documents');
            const data = await response.json();

            if (data.success) {
                this.documents = data.files;
                this.displayDocuments(data.files);
                this.displayStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            this.showAlert('Error loading documents', 'danger');
        }
    }

    displayDocuments(documents) {
        const tbody = document.getElementById('documentsTableBody');

        if (documents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="fas fa-folder-open me-2"></i>
                        No documents found. Upload some files to get started.
                    </td>
                </tr>
            `;
            this.updateBulkDeleteButton();
            return;
        }

        tbody.innerHTML = documents.map(doc => `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input document-checkbox" 
                           value="${doc.fileName}" onchange="app.updateBulkDeleteButton()">
                </td>
                <td>
                    <i class="fas fa-${this.getFileIcon(doc.extension)} me-2"></i>
                    ${doc.fileName}
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(doc.extension)}">
                        ${doc.extension.substring(1).toUpperCase()}
                    </span>
                </td>
                <td>${this.formatFileSize(doc.size)}</td>
                <td>${new Date(doc.lastModified).toLocaleDateString('id-ID')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1"
                            onclick="previewFile('${doc.fileName}')" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger"
                            onclick="deleteDocument('${doc.fileName}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateBulkDeleteButton();
    }

    displayStatistics(stats) {
        const statsDiv = document.getElementById('documentsStats');
        statsDiv.innerHTML = `
            <div class="row">
                <div class="col-6">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center p-2">
                            <h6 class="mb-1">${stats.totalFiles}</h6>
                            <small>Total Files</small>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center p-2">
                            <h6 class="mb-1">${this.formatFileSize(stats.totalSize)}</h6>
                            <small>Total Size</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-2">
                <small class="text-muted">
                    Images: ${stats.typeStats.image || 0} |
                    Documents: ${stats.typeStats.document || 0}
                </small>
            </div>
        `;
    }

    getFileIcon(extension) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const docExts = ['.pdf', '.doc', '.docx'];
        const excelExts = ['.xls', '.xlsx'];
        const pptExts = ['.ppt', '.pptx'];

        if (imageExts.includes(extension.toLowerCase())) return 'image';
        if (docExts.includes(extension.toLowerCase())) return 'file-pdf';
        if (excelExts.includes(extension.toLowerCase())) return 'file-excel';
        if (pptExts.includes(extension.toLowerCase())) return 'file-powerpoint';
        return 'file';
    }

    getTypeBadgeColor(extension) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        if (imageExts.includes(extension.toLowerCase())) return 'success';
        return 'primary';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async initMatchingTab() {
        // Auto preview when tab is opened
        await this.previewMatching();
    }

    async previewMatching() {
        try {
            this.showLoading('Analyzing file matching...');

            const response = await fetch('/api/file-matching/enhanced-preview');
            const data = await response.json();

            if (data.success) {
                this.matchingResults = data.preview;
                this.displayEnhancedMatchingResults(data.preview, data.statistics);

                // Show bulk actions if there are automatic matches
                if (data.statistics.autoMatched > 0) {
                    this.showBulkActionsSection();
                } else {
                    this.hideBulkActionsSection();
                }

                // Check if validation is required for automatic matches
                if (data.statistics.requiresValidation) {
                    await this.initializeValidation();
                } else {
                    this.hideValidationSection();
                }
            } else {
                throw new Error(data.error || 'Failed to preview matching');
            }
        } catch (error) {
            console.error('Error previewing matching:', error);
            this.showAlert('Error previewing file matching: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    displayMatchingResults(preview, stats) {
        const resultsDiv = document.getElementById('matchingResults');
        const statsDiv = document.getElementById('matchingStats');

        // Display statistics
        statsDiv.innerHTML = `
            <div class="row text-center">
                <div class="col-4">
                    <div class="card bg-info text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.totalContacts}</h6>
                            <small>Total Contacts</small>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card bg-success text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.matched}</h6>
                            <small>Matched</small>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card bg-warning text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.unmatched}</h6>
                            <small>Unmatched</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Display matching results
        if (preview.length === 0) {
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No contacts found. Please import contacts first.
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = `
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Smart File Matching:</strong> Files are automatically matched based on contact names.
                No need to specify file names in your Excel - just ensure your files are named after your contacts
                (e.g., "John Doe.pdf", "jane_smith.jpg", etc.).
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Contact Name</th>
                            <th>Number</th>
                            <th>Matched File</th>
                            <th>Matching Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${preview.map(item => `
                            <tr>
                                <td>
                                    <strong>${item.contact.name || item.contact.nama || 'Unnamed Contact'}</strong>
                                    ${item.contact.fileName ? `<br><small class="text-muted">Specified: ${item.contact.fileName}</small>` : ''}
                                </td>
                                <td><span class="badge bg-secondary">${item.contact.number}</span></td>
                                <td>
                                    ${item.matchedFile ?
                                        `<span class="badge bg-success">${item.matchedFile.fileName}</span>
                                         <br><small class="text-muted">${this.formatFileSize(item.matchedFile.size)}</small>` :
                                        '<span class="text-muted">No match found</span>'
                                    }
                                </td>
                                <td>
                                    ${item.matchedFile && item.matchedFile.matchingMethod ?
                                        `<span class="badge bg-${item.matchedFile.matchingMethod === 'contact_name' ? 'primary' : 'secondary'}">
                                            <i class="fas fa-${item.matchedFile.matchingMethod === 'contact_name' ? 'user' : 'file'} me-1"></i>
                                            ${item.matchedFile.matchingMethod === 'contact_name' ? 'By Name' : 'By Filename'}
                                         </span>` :
                                        '<span class="text-muted">-</span>'
                                    }
                                </td>
                                <td>
                                    <span class="badge bg-${item.status === 'matched' ? 'success' : 'warning'}">
                                        <i class="fas fa-${item.status === 'matched' ? 'check' : 'exclamation-triangle'} me-1"></i>
                                        ${item.status}
                                    </span>
                                    ${item.reason ? `<br><small class="text-muted">${item.reason}</small>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayEnhancedMatchingResults(preview, stats) {
        const resultsDiv = document.getElementById('matchingResults');
        const statsDiv = document.getElementById('matchingStats');

        // Display enhanced statistics
        statsDiv.innerHTML = `
            <div class="row text-center">
                <div class="col-2">
                    <div class="card bg-info text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.totalContacts}</h6>
                            <small>Total</small>
                        </div>
                    </div>
                </div>
                <div class="col-2">
                    <div class="card bg-success text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.matched}</h6>
                            <small>Matched</small>
                        </div>
                    </div>
                </div>
                <div class="col-2">
                    <div class="card bg-warning text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.unmatched}</h6>
                            <small>Unmatched</small>
                        </div>
                    </div>
                </div>
                <div class="col-2">
                    <div class="card bg-primary text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.enabled}</h6>
                            <small>Enabled</small>
                        </div>
                    </div>
                </div>
                <div class="col-2">
                    <div class="card bg-secondary text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.autoMatched}</h6>
                            <small>Auto</small>
                        </div>
                    </div>
                </div>
                <div class="col-2">
                    <div class="card bg-dark text-white">
                        <div class="card-body p-2">
                            <h6 class="mb-1">${stats.manualAssigned}</h6>
                            <small>Manual</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Display enhanced matching results
        if (preview.length === 0) {
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No contacts found. Please import contacts first.
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = `
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Enhanced File Matching:</strong> Files are automatically matched by contact names,
                with options for manual assignment and sending control.
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Contact Name</th>
                            <th>Number</th>
                            <th>Matched File</th>
                            <th>Matching Method</th>
                            <th>Sending</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${preview.map(item => this.renderEnhancedContactRow(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderEnhancedContactRow(item) {
        const contactName = item.contact.name || item.contact.nama || 'Unnamed Contact';
        const isAutoMatch = item.matchedFile?.matchingMethod === 'contact_name';
        const isManualAssignment = item.matchedFile?.matchingMethod === 'manual_assignment';
        const canToggleSending = item.canToggleSending;

        return `
            <tr class="${!item.sendingEnabled ? 'table-secondary' : ''}">
                <td>
                    <strong>${contactName}</strong>
                    ${item.contact.fileName ? `<br><small class="text-muted">Specified: ${item.contact.fileName}</small>` : ''}
                </td>
                <td><span class="badge bg-secondary">${item.contact.number}</span></td>
                <td>
                    ${item.matchedFile ?
                        `<span class="badge bg-success">${item.matchedFile.fileName}</span>
                         <br><small class="text-muted">${this.formatFileSize(item.matchedFile.size)}</small>
                         ${isManualAssignment ? '<br><small class="text-info"><i class="fas fa-hand-paper me-1"></i>Manual</small>' : ''}` :
                        '<span class="text-muted">No match found</span>'
                    }
                </td>
                <td>
                    ${item.matchedFile ?
                        `<span class="badge bg-${isAutoMatch ? 'primary' : isManualAssignment ? 'info' : 'secondary'}">
                            <i class="fas fa-${isAutoMatch ? 'user' : isManualAssignment ? 'hand-paper' : 'file'} me-1"></i>
                            ${isAutoMatch ? 'By Name' : isManualAssignment ? 'Manual' : 'By Filename'}
                         </span>` :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    ${item.status === 'matched' ?
                        `<div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox"
                                   id="sending_${contactName.replace(/\s+/g, '_')}"
                                   ${item.sendingEnabled ? 'checked' : ''}
                                   ${canToggleSending ? '' : 'disabled'}
                                   onchange="toggleContactSending('${contactName}', this.checked)">
                            <label class="form-check-label" for="sending_${contactName.replace(/\s+/g, '_')}">
                                ${item.sendingEnabled ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>` :
                        '<span class="text-muted">N/A</span>'
                    }
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm"
                                onclick="showManualAssignmentModal('${contactName}')"
                                title="Manual Assignment">
                            <i class="fas fa-link"></i>
                        </button>
                        ${item.matchedFile && isManualAssignment ?
                            `<button class="btn btn-outline-danger btn-sm"
                                     onclick="removeManualAssignment('${contactName}')"
                                     title="Remove Manual Assignment">
                                <i class="fas fa-unlink"></i>
                            </button>` : ''
                        }
                    </div>
                </td>
            </tr>
        `;
    }

    async initializeValidation() {
        try {
            // Get validation queue from server
            const response = await fetch('/api/file-matching/validation-queue');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get validation queue');
            }

            this.validationQueue = data.validationQueue;
            this.availableFiles = data.availableFiles;
            this.currentValidationIndex = 0;
            this.validationResults = {
                confirmed: [],
                changed: [],
                skipped: []
            };

            if (this.validationQueue.length > 0) {
                this.showValidationSection();
                this.setupValidationEventListeners();
                this.showCurrentValidationItem();
            } else {
                this.hideValidationSection();
            }
        } catch (error) {
            console.error('Error initializing validation:', error);
            this.showAlert('Error initializing validation: ' + error.message, 'danger');
        }
    }

    showValidationSection() {
        const validationSection = document.getElementById('validationSection');
        validationSection.style.display = 'block';

        // Update counter
        const counter = document.getElementById('validationCounter');
        counter.textContent = `0 of ${this.validationQueue.length}`;

        // Reset progress bar
        const progressBar = document.getElementById('validationProgressBar');
        progressBar.style.width = '0%';
    }

    hideValidationSection() {
        const validationSection = document.getElementById('validationSection');
        validationSection.style.display = 'none';
    }

    setupValidationEventListeners() {
        // Skip all button
        const skipAllBtn = document.getElementById('skipAllBtn');
        skipAllBtn.onclick = () => this.skipAllAutoMatches();

        // Skip current button
        const skipCurrentBtn = document.getElementById('skipCurrentBtn');
        skipCurrentBtn.onclick = () => this.skipCurrentContact();

        // Change file button
        const changeFileBtn = document.getElementById('changeFileBtn');
        changeFileBtn.onclick = () => this.showFileSelectionModal();

        // Confirm current button
        const confirmCurrentBtn = document.getElementById('confirmCurrentBtn');
        confirmCurrentBtn.onclick = () => this.confirmCurrentMatch();

        // Proceed with validated button
        const proceedBtn = document.getElementById('proceedWithValidatedBtn');
        proceedBtn.onclick = () => this.proceedWithValidated();

        // File search in modal
        const fileSearchInput = document.getElementById('validationFileSearch');
        fileSearchInput.oninput = (e) => this.filterValidationFiles(e.target.value);
    }

    showCurrentValidationItem() {
        if (this.currentValidationIndex >= this.validationQueue.length) {
            this.showValidationSummary();
            return;
        }

        const currentItem = this.validationQueue[this.currentValidationIndex];
        const itemDiv = document.getElementById('currentValidationItem');
        const counter = document.getElementById('validationCounter');
        const progressBar = document.getElementById('validationProgressBar');

        // Update progress
        const progress = ((this.currentValidationIndex) / this.validationQueue.length) * 100;
        progressBar.style.width = `${progress}%`;
        counter.textContent = `${this.currentValidationIndex + 1} of ${this.validationQueue.length}`;

        // Show current item
        itemDiv.style.display = 'block';
        itemDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-primary">Contact Information</h6>
                    <p class="mb-1"><strong>Name:</strong> ${currentItem.contact.name}</p>
                    <p class="mb-0"><strong>Phone:</strong> <span class="badge bg-secondary">${currentItem.contact.number}</span></p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-success">Automatically Matched File</h6>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file me-2 text-primary"></i>
                        <div>
                            <p class="mb-1"><strong>${currentItem.matchedFile.fileName}</strong></p>
                            <small class="text-muted">${this.formatFileSize(currentItem.matchedFile.size)}</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-warning mt-3">
                <i class="fas fa-question-circle me-2"></i>
                <strong>Is this file correct for ${currentItem.contact.name}?</strong>
            </div>
        `;

        // Show action buttons
        document.getElementById('skipCurrentBtn').style.display = 'inline-block';
        document.getElementById('changeFileBtn').style.display = 'inline-block';
        document.getElementById('confirmCurrentBtn').style.display = 'inline-block';
    }



    skipCurrentContact() {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        this.validationResults.skipped.push(currentItem);
        this.nextValidationItem();
    }

    nextValidationItem() {
        this.currentValidationIndex++;
        this.showCurrentValidationItem();
    }

    skipAllAutoMatches() {
        // Move all remaining items to skipped
        for (let i = this.currentValidationIndex; i < this.validationQueue.length; i++) {
            this.validationResults.skipped.push(this.validationQueue[i]);
        }
        this.currentValidationIndex = this.validationQueue.length;
        this.showValidationSummary();
    }

    showFileSelectionModal() {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        document.getElementById('validationContactName').textContent = currentItem.contact.name;

        this.populateValidationFileTable();

        const modal = new bootstrap.Modal(document.getElementById('fileSelectionValidationModal'));
        modal.show();
    }

    populateValidationFileTable() {
        const tbody = document.getElementById('validationFileTableBody');

        tbody.innerHTML = this.availableFiles.map(file => `
            <tr>
                <td>
                    <i class="fas fa-${this.getFileIcon(file.extension)} me-2"></i>
                    ${file.fileName}
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(file.extension)}">
                        ${file.extension.substring(1).toUpperCase()}
                    </span>
                </td>
                <td>${this.formatFileSize(file.size)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.selectValidationFile('${file.fileName}')">
                        Select
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterValidationFiles(searchTerm) {
        const filteredFiles = this.availableFiles.filter(file =>
            file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const tbody = document.getElementById('validationFileTableBody');
        tbody.innerHTML = filteredFiles.map(file => `
            <tr>
                <td>
                    <i class="fas fa-${this.getFileIcon(file.extension)} me-2"></i>
                    ${file.fileName}
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(file.extension)}">
                        ${file.extension.substring(1).toUpperCase()}
                    </span>
                </td>
                <td>${this.formatFileSize(file.size)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.selectValidationFile('${file.fileName}')">
                        Select
                    </button>
                </td>
            </tr>
        `).join('');
    }

    selectValidationFile(fileName) {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        const selectedFile = this.availableFiles.find(file => file.fileName === fileName);

        if (selectedFile) {
            // Update the matched file
            currentItem.matchedFile = {
                ...selectedFile,
                matchingMethod: 'user_selected',
                validated: true
            };

            this.validationResults.changed.push(currentItem);

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('fileSelectionValidationModal'));
            modal.hide();

            // Move to next item
            this.nextValidationItem();
        }
    }

    showValidationSummary() {
        // Hide current item
        document.getElementById('currentValidationItem').style.display = 'none';

        // Hide action buttons
        document.getElementById('skipCurrentBtn').style.display = 'none';
        document.getElementById('changeFileBtn').style.display = 'none';
        document.getElementById('confirmCurrentBtn').style.display = 'none';

        // Update progress to 100%
        document.getElementById('validationProgressBar').style.width = '100%';
        document.getElementById('validationCounter').textContent = `${this.validationQueue.length} of ${this.validationQueue.length}`;

        // Update summary counts
        document.getElementById('confirmedCount').textContent = this.validationResults.confirmed.length;
        document.getElementById('changedCount').textContent = this.validationResults.changed.length;
        document.getElementById('skippedCount').textContent = this.validationResults.skipped.length;

        // Show summary
        document.getElementById('validationSummary').style.display = 'block';
    }

    async proceedWithValidated() {
        try {
            // Save validation results
            const response = await fetch('/api/file-matching/save-validation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    validationResults: this.validationResults
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Validation completed successfully! You can now proceed to the Blast tab.', 'success');

                // Switch to blast tab
                const blastTab = document.getElementById('blast-files-tab');
                const tab = new bootstrap.Tab(blastTab);
                tab.show();
            } else {
                throw new Error(result.error || 'Failed to save validation results');
            }
        } catch (error) {
            console.error('Error saving validation results:', error);
            this.showAlert('Error saving validation results: ' + error.message, 'danger');
        }
    }

    async initBlastFilesTab() {
        const content = document.getElementById('blastFilesContent');

        // Check if we have matching results
        if (!this.matchingResults) {
            await this.previewMatching();
        }

        content.innerHTML = `
            <form id="blastFilesForm">
                <div class="mb-3">
                    <label for="blastFilesMessage" class="form-label">Message Template</label>
                    <textarea class="form-control" id="blastFilesMessage" rows="6"
                              placeholder="Type your message here...&#10;&#10;Use variables: {{name}}, {{number}}, {{fileName}}" required></textarea>
                    <div class="form-text">
                        <strong>Available variables:</strong> {{name}}, {{number}}, {{email}}, {{company}}, {{fileName}}
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="blastFilesDelay" class="form-label">Delay Between Messages (ms)</label>
                        <input type="number" class="form-control" id="blastFilesDelay" value="2000" min="1000" max="10000">
                    </div>
                    <div class="col-md-6">
                        <label for="blastFilesRetry" class="form-label">Retry Attempts</label>
                        <input type="number" class="form-control" id="blastFilesRetry" value="2" min="1" max="5">
                    </div>
                </div>

                <div class="mb-3">
                    <button type="button" class="btn btn-outline-secondary" onclick="previewFileBlast()">
                        <i class="fas fa-eye me-2"></i>
                        Preview Matching
                    </button>
                </div>

                <div class="d-grid">
                    <button type="submit" class="btn btn-success btn-lg">
                        <i class="fas fa-paper-plane me-2"></i>
                        Send Blast with Files
                    </button>
                </div>
            </form>
        `;

        // Setup form handler
        document.getElementById('blastFilesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendBlastWithFiles();
        });
    }

    async sendBlastWithFiles() {
        try {
            const message = document.getElementById('blastFilesMessage').value;
            const delay = parseInt(document.getElementById('blastFilesDelay').value);
            const retryAttempts = parseInt(document.getElementById('blastFilesRetry').value);

            if (!message) {
                this.showAlert('Please enter a message', 'danger');
                return;
            }

            // Get selected contacts
            const contactsResponse = await fetch('/api/contacts?selected=true');
            const contactsData = await contactsResponse.json();

            if (!contactsData.success || contactsData.contacts.length === 0) {
                this.showAlert('No contacts selected. Please select contacts first.', 'danger');
                return;
            }

            // Store blast parameters for validation flow
            this.blastParams = { message, delay, retryAttempts };

            // Start validation process
            await this.startFileMatchValidation();

        } catch (error) {
            console.error('Error starting blast with files:', error);
            this.showAlert('Error starting blast: ' + error.message, 'danger');
        }
    }

    showBlastProgress() {
        console.log('Showing blast progress modal');
        // Show the progress modal
        const modal = new bootstrap.Modal(document.getElementById('blastProgressModal'));
        modal.show();
    }

    hideBlastProgress() {
        console.log('Hiding blast progress modal');
        // Hide the progress modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('blastProgressModal'));
        if (modal) {
            modal.hide();
        }
    }

    updateBlastProgress(progress) {
        console.log('Updating blast progress:', progress);
        // Update stats
        document.getElementById('totalStat').textContent = progress.total || 0;
        document.getElementById('sentStat').textContent = progress.sent || 0;
        document.getElementById('failedStat').textContent = progress.failed || 0;
        document.getElementById('progressStat').textContent = (progress.percentage || 0) + '%';

        // Update progress bar
        const progressBar = document.getElementById('blastFilesProgressBar');
        if (progressBar) {
            progressBar.style.width = (progress.percentage || 0) + '%';
        }

        // Update current contact info
        const currentContactElement = document.getElementById('currentContact');
        if (currentContactElement && progress.currentContact) {
            currentContactElement.textContent =
                `Processing: ${progress.currentContact.name || 'Unknown'} (${progress.currentContact.phone || 'No phone'})`;
        } else if (currentContactElement) {
            currentContactElement.textContent =
                `Processing contact ${progress.current || 0} of ${progress.total || 0}`;
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
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateBulkDeleteButton() {
        const checkboxes = document.querySelectorAll('.document-checkbox:checked');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const allCheckboxes = document.querySelectorAll('.document-checkbox');

        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = checkboxes.length === 0;
            bulkDeleteBtn.innerHTML = `
                <i class="fas fa-trash me-1"></i>
                Delete Selected (${checkboxes.length})
            `;
        }

        // Update select all checkbox state
        if (selectAllCheckbox && allCheckboxes.length > 0) {
            if (checkboxes.length === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (checkboxes.length === allCheckboxes.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
                selectAllCheckbox.checked = false;
            }
        }
    }

    async bulkDeleteDocuments(filenames) {
        try {
            this.showLoading('Deleting selected files...');

            const response = await fetch('/api/file-matching/documents/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filenames })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(
                    `Bulk delete completed: ${result.summary.deleted} deleted, ${result.summary.failed} failed`,
                    result.summary.failed > 0 ? 'warning' : 'success'
                );
                await this.loadDocuments();
            } else {
                throw new Error(result.error || 'Bulk delete failed');
            }

        } catch (error) {
            console.error('Error in bulk delete:', error);
            this.showAlert('Error deleting files: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async clearAllDocuments() {
        try {
            this.showLoading('Clearing all documents...');

            const response = await fetch('/api/file-matching/documents', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(result.message, 'success');
                await this.loadDocuments();
            } else {
                throw new Error(result.error || 'Clear all failed');
            }

        } catch (error) {
            console.error('Error clearing all documents:', error);
            this.showAlert('Error clearing documents: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async loadContacts() {
        try {
            const response = await fetch('/api/contacts');
            const data = await response.json();

            if (data.success) {
                this.contacts = data.contacts;
                this.headers = data.headers || [];
                updateFileVariables(this.headers);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    }

    async handleBlastSubmission() {
        try {
            const message = document.getElementById('blastFilesMessage').value;
            const delay = parseInt(document.getElementById('fileBlastDelay').value) || 2000;
            const retryAttempts = parseInt(document.getElementById('fileBlastRetry').value) || 2;

            if (!message.trim()) {
                this.showAlert('Please enter a message', 'warning');
                return;
            }

            if (this.contacts.length === 0) {
                this.showAlert('No contacts available. Please import contacts first.', 'warning');
                return;
            }

            // Store blast parameters for later use
            this.blastParams = { message, delay, retryAttempts };

            // Start validation process
            await this.startFileMatchValidation();

        } catch (error) {
            console.error('Error starting blast:', error);
            this.showAlert('Error starting blast: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
            this.hideBlastProgress();
        }
    }

    async startFileMatchValidation() {
        try {
            this.showLoading('Preparing file validation...');

            // Get matching preview to find contacts with matched files
            const response = await fetch('/api/file-matching/preview');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get matching preview');
            }

            // Filter contacts that have matched files by name (automatic matching)
            const contactsWithAutoMatches = data.preview.filter(item =>
                item.status === 'matched' &&
                item.matchedFile &&
                item.matchedFile.matchingMethod === 'contact_name'
            );

            if (contactsWithAutoMatches.length === 0) {
                // No automatic matches to validate, proceed directly
                this.showAlert('No automatic file matches found. Proceeding with specified file matches only.', 'info');
                await this.proceedWithoutValidation();
                return;
            }

            // Initialize validation queue
            this.validationQueue = contactsWithAutoMatches;
            this.currentValidationIndex = 0;
            this.validationResults = {
                confirmed: [],
                changed: [],
                skipped: []
            };

            // Show validation modal
            this.showValidationModal();

        } catch (error) {
            console.error('Error starting validation:', error);
            this.showAlert('Error starting validation: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    showValidationModal() {
        if (this.currentValidationIndex >= this.validationQueue.length) {
            // All validations complete, show summary
            this.showValidationSummary();
            return;
        }

        const currentItem = this.validationQueue[this.currentValidationIndex];
        const modal = document.getElementById('fileMatchValidationModal');
        const progressSpan = document.getElementById('validationProgress');
        const contentDiv = document.getElementById('currentValidationItem');

        // Update progress
        progressSpan.textContent = `${this.currentValidationIndex + 1} of ${this.validationQueue.length}`;

        // Update content
        const contactName = currentItem.contact.name || currentItem.contact.nama || 'Unnamed Contact';
        const fileName = currentItem.matchedFile.fileName;
        const fileSize = this.formatFileSize(currentItem.matchedFile.size);

        contentDiv.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">Contact Information</h6>
                    <p class="mb-2"><strong>Name:</strong> ${contactName}</p>
                    <p class="mb-3"><strong>Phone:</strong> <span class="badge bg-secondary">${currentItem.contact.number}</span></p>

                    <h6 class="card-title">Matched File</h6>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file me-2 text-primary"></i>
                        <div>
                            <p class="mb-1"><strong>${fileName}</strong></p>
                            <small class="text-muted">${fileSize}</small>
                        </div>
                    </div>

                    <div class="alert alert-warning mt-3">
                        <i class="fas fa-question-circle me-2"></i>
                        <strong>Is this file correct for ${contactName}?</strong>
                    </div>
                </div>
            </div>
        `;

        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    confirmCurrentMatch() {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        if (currentItem && currentItem.matchedFile) {
            currentItem.matchedFile.validated = true;
        }
        this.validationResults.confirmed.push(currentItem);
        this.nextValidationItem();
    }

    skipCurrentContact() {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        this.validationResults.skipped.push(currentItem);
        this.nextValidationItem();
    }

    nextValidationItem() {
        this.currentValidationIndex++;

        // Hide current modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('fileMatchValidationModal'));
        if (modal) {
            modal.hide();
        }

        // Show next item or summary
        setTimeout(() => {
            this.showValidationModal();
        }, 300);
    }

    showFileSelectionModal() {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        const contactName = currentItem.contact.name || currentItem.contact.nama || 'Unnamed Contact';

        document.getElementById('fileSelectionContactName').textContent = contactName;

        // Populate file list
        this.populateFileSelection();

        const modal = new bootstrap.Modal(document.getElementById('fileSelectionModal'));
        modal.show();
    }

    populateFileSelection() {
        const tbody = document.getElementById('fileSelectionTableBody');

        tbody.innerHTML = this.documents.map(doc => `
            <tr>
                <td>
                    <i class="fas fa-${this.getFileIcon(doc.extension)} me-2"></i>
                    ${doc.fileName}
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(doc.extension)}">
                        ${doc.extension.substring(1).toUpperCase()}
                    </span>
                </td>
                <td>${this.formatFileSize(doc.size)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.selectFile('${doc.fileName}')">
                        Select
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterFileSelection(searchTerm) {
        const tbody = document.getElementById('fileSelectionTableBody');
        const filteredDocs = this.documents.filter(doc =>
            doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        tbody.innerHTML = filteredDocs.map(doc => `
            <tr>
                <td>
                    <i class="fas fa-${this.getFileIcon(doc.extension)} me-2"></i>
                    ${doc.fileName}
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(doc.extension)}">
                        ${doc.extension.substring(1).toUpperCase()}
                    </span>
                </td>
                <td>${this.formatFileSize(doc.size)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.selectFile('${doc.fileName}')">
                        Select
                    </button>
                </td>
            </tr>
        `).join('');
    }

    selectFile(fileName) {
        const currentItem = this.validationQueue[this.currentValidationIndex];
        const selectedFile = this.documents.find(doc => doc.fileName === fileName);

        if (selectedFile) {
            // Update the matched file
            currentItem.matchedFile = {
                fileName: selectedFile.fileName,
                fullPath: selectedFile.fullPath,
                extension: selectedFile.extension,
                size: selectedFile.size,
                type: this.getFileType(selectedFile.extension),
                validated: true,
                matchingMethod: 'user_selected'
            };

            this.validationResults.changed.push(currentItem);

            // Close file selection modal
            const fileModal = bootstrap.Modal.getInstance(document.getElementById('fileSelectionModal'));
            if (fileModal) {
                fileModal.hide();
            }

            // Move to next validation item
            setTimeout(() => {
                this.nextValidationItem();
            }, 300);
        }
    }

    showValidationSummary() {
        const modal = document.getElementById('validationSummaryModal');
        const content = document.getElementById('validationSummaryContent');

        const totalValidated = this.validationResults.confirmed.length +
                              this.validationResults.changed.length;

        content.innerHTML = `
            <div class="row text-center mb-4">
                <div class="col-4">
                    <div class="card bg-success text-white">
                        <div class="card-body p-3">
                            <h4 class="mb-1">${this.validationResults.confirmed.length}</h4>
                            <small>Confirmed</small>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card bg-info text-white">
                        <div class="card-body p-3">
                            <h4 class="mb-1">${this.validationResults.changed.length}</h4>
                            <small>Changed</small>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card bg-warning text-white">
                        <div class="card-body p-3">
                            <h4 class="mb-1">${this.validationResults.skipped.length}</h4>
                            <small>Skipped</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>${totalValidated} contacts</strong> will receive messages with files.
                <strong>${this.validationResults.skipped.length} contacts</strong> will be skipped.
            </div>

            ${totalValidated > 0 ? `
                <h6>Contacts to receive messages:</h6>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Contact</th>
                                <th>File</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${[...this.validationResults.confirmed, ...this.validationResults.changed].map(item => `
                                <tr>
                                    <td>${item.contact.name || item.contact.nama}</td>
                                    <td><small>${item.matchedFile.fileName}</small></td>
                                    <td>
                                        <span class="badge bg-${item.matchedFile.matchingMethod === 'user_selected' ? 'info' : 'success'}">
                                            ${item.matchedFile.matchingMethod === 'user_selected' ? 'Changed' : 'Confirmed'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    async proceedWithValidatedSending() {
        try {
            // Close summary modal
            const summaryModal = bootstrap.Modal.getInstance(document.getElementById('validationSummaryModal'));
            if (summaryModal) {
                summaryModal.hide();
            }

            // Prepare validated contacts for sending
            const validatedContacts = [...this.validationResults.confirmed, ...this.validationResults.changed];

            if (validatedContacts.length === 0) {
                this.showAlert('No contacts selected for sending', 'warning');
                return;
            }

            this.showLoading('Sending blast messages with validated files...');
            this.showBlastProgress();

            const response = await fetch('/api/messages/blast-with-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    validatedContacts: validatedContacts,
                    message: this.blastParams.message,
                    delay: this.blastParams.delay,
                    retryAttempts: this.blastParams.retryAttempts
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(
                    `Blast completed! Sent: ${result.summary.sent}, Failed: ${result.summary.failed}`,
                    result.summary.failed > 0 ? 'warning' : 'success'
                );

                // Clear form
                document.getElementById('blastFilesMessage').value = '';
                updateFilePreview();
            } else {
                throw new Error(result.error || 'Blast failed');
            }

        } catch (error) {
            console.error('Error sending validated blast:', error);
            this.showAlert('Error sending blast: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
            this.hideBlastProgress();
        }
    }

    async proceedWithoutValidation() {
        try {
            this.showLoading('Sending blast messages with files...');
            this.showBlastProgress();

            // Get selected contacts for the blast
            const contactsResponse = await fetch('/api/contacts?selected=true');
            const contactsData = await contactsResponse.json();

            if (!contactsData.success || contactsData.contacts.length === 0) {
                this.showAlert('No contacts selected. Please select contacts first.', 'danger');
                return;
            }

            const response = await fetch('/api/messages/blast-with-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contacts: contactsData.contacts,
                    message: this.blastParams.message,
                    delay: this.blastParams.delay,
                    retryAttempts: this.blastParams.retryAttempts
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(
                    `Blast completed! Sent: ${result.summary.sent}, Failed: ${result.summary.failed}`,
                    result.summary.failed > 0 ? 'warning' : 'success'
                );

                // Clear form
                document.getElementById('blastFilesMessage').value = '';
                updateFilePreview();
            } else {
                throw new Error(result.error || 'Blast failed');
            }

        } catch (error) {
            console.error('Error sending blast:', error);
            this.showAlert('Error sending blast: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
            this.hideBlastProgress();
        }
    }

    getFileType(extension) {
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const docExts = ['.pdf', '.doc', '.docx', '.txt'];
        const spreadsheetExts = ['.xls', '.xlsx'];
        const presentationExts = ['.ppt', '.pptx'];

        if (imageExts.includes(extension.toLowerCase())) return 'image';
        if (docExts.includes(extension.toLowerCase())) return 'document';
        if (spreadsheetExts.includes(extension.toLowerCase())) return 'spreadsheet';
        if (presentationExts.includes(extension.toLowerCase())) return 'presentation';
        return 'file';
    }

    // Bulk actions methods
    showBulkActionsSection() {
        const section = document.getElementById('bulkActionsSection');
        if (section) {
            section.style.display = 'block';
        }
    }

    hideBulkActionsSection() {
        const section = document.getElementById('bulkActionsSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async bulkEnableAutoMatches() {
        try {
            const autoMatches = this.matchingResults.filter(item =>
                item.matchedFile?.matchingMethod === 'contact_name'
            );

            const preferences = autoMatches.map(item => ({
                contactName: item.contact.name || item.contact.nama,
                enabled: true
            }));

            await this.updateSendingPreferences(preferences);
            await this.previewMatching(); // Refresh display
            this.showAlert('All automatic matches enabled', 'success');
        } catch (error) {
            console.error('Error enabling auto matches:', error);
            this.showAlert('Error enabling auto matches: ' + error.message, 'danger');
        }
    }

    async bulkDisableAutoMatches() {
        try {
            const autoMatches = this.matchingResults.filter(item =>
                item.matchedFile?.matchingMethod === 'contact_name'
            );

            const preferences = autoMatches.map(item => ({
                contactName: item.contact.name || item.contact.nama,
                enabled: false
            }));

            await this.updateSendingPreferences(preferences);
            await this.previewMatching(); // Refresh display
            this.showAlert('All automatic matches disabled', 'warning');
        } catch (error) {
            console.error('Error disabling auto matches:', error);
            this.showAlert('Error disabling auto matches: ' + error.message, 'danger');
        }
    }

    async updateSendingPreferences(preferences) {
        const response = await fetch('/api/file-matching/update-sending-preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contactPreferences: preferences })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update preferences');
        }
        return data;
    }

    async toggleContactSending(contactName, enabled) {
        try {
            await this.updateSendingPreferences([{
                contactName: contactName,
                enabled: enabled
            }]);

            // Refresh preview to show changes immediately
            await this.previewMatching();

            this.showAlert(`Sending ${enabled ? 'enabled' : 'disabled'} for ${contactName}`, 'success');
        } catch (error) {
            console.error('Error toggling contact sending:', error);
            this.showAlert('Error updating sending preference: ' + error.message, 'danger');

            // Revert checkbox state on error
            const checkbox = document.getElementById(`sending_${contactName.replace(/\s+/g, '_')}`);
            if (checkbox) {
                checkbox.checked = !enabled;
            }
        }
    }

    // Manual assignment methods
    async showManualAssignmentModal(contactName = null) {
        try {
            // Populate contact dropdown
            await this.populateContactDropdown();

            // Pre-select contact if provided
            if (contactName) {
                const contactSelect = document.getElementById('contactSelect');
                const option = Array.from(contactSelect.options).find(opt => opt.text === contactName);
                if (option) {
                    option.selected = true;
                }
            }

            // Setup file search
            this.setupFileSearch();

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('manualAssignmentModal'));
            modal.show();
        } catch (error) {
            console.error('Error showing manual assignment modal:', error);
            this.showAlert('Error opening manual assignment: ' + error.message, 'danger');
        }
    }

    async populateContactDropdown() {
        const contactSelect = document.getElementById('contactSelect');
        contactSelect.innerHTML = '<option value="">Choose a contact...</option>';

        if (this.matchingResults) {
            this.matchingResults.forEach(item => {
                const contactName = item.contact.name || item.contact.nama || 'Unnamed Contact';
                const option = document.createElement('option');
                option.value = contactName;
                option.textContent = contactName;
                option.dataset.status = item.status;
                option.dataset.hasMatch = item.matchedFile ? 'true' : 'false';
                contactSelect.appendChild(option);
            });
        }
    }

    setupFileSearch() {
        const fileSearch = document.getElementById('fileSearch');
        const resultsDiv = document.getElementById('fileSearchResults');
        let searchTimeout;

        fileSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                await this.searchFiles(e.target.value);
            }, 300);
        });
    }

    async searchFiles(query) {
        try {
            const response = await fetch(`/api/file-matching/search-files?query=${encodeURIComponent(query)}&limit=20`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to search files');
            }

            this.displayFileSearchResults(data.files);
        } catch (error) {
            console.error('Error searching files:', error);
            this.showAlert('Error searching files: ' + error.message, 'danger');
        }
    }

    displayFileSearchResults(files) {
        const resultsDiv = document.getElementById('fileSearchResults');

        if (files.length === 0) {
            resultsDiv.innerHTML = `
                <div class="text-muted text-center">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>No files found</p>
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = files.map(file => `
            <div class="file-search-item p-2 border-bottom" style="cursor: pointer;"
                 onclick="app.selectFileForAssignment('${file.fileName}', ${JSON.stringify(file).replace(/"/g, '&quot;')})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${file.fileName}</strong>
                        <br><small class="text-muted">${this.formatFileSize(file.size)} • ${file.type}</small>
                    </div>
                    <i class="fas fa-plus text-primary"></i>
                </div>
            </div>
        `).join('');
    }

    selectFileForAssignment(fileName, fileData) {
        this.selectedFile = fileData;

        // Update selected file info
        const infoDiv = document.getElementById('selectedFileInfo');
        const detailsDiv = document.getElementById('selectedFileDetails');

        detailsDiv.innerHTML = `
            <strong>${fileData.fileName}</strong><br>
            <small class="text-muted">
                Size: ${this.formatFileSize(fileData.size)} •
                Type: ${fileData.type} •
                Extension: ${fileData.extension}
            </small>
        `;

        infoDiv.style.display = 'block';

        // Enable assign button
        document.getElementById('assignFileBtn').disabled = false;
    }

    async assignFileToContact() {
        try {
            const contactSelect = document.getElementById('contactSelect');
            const assignmentType = document.getElementById('assignmentType').value;

            if (!contactSelect.value || !this.selectedFile) {
                this.showAlert('Please select both a contact and a file', 'warning');
                return;
            }

            const response = await fetch('/api/file-matching/manual-assignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contactName: contactSelect.value,
                    fileName: this.selectedFile.fileName,
                    assignmentType: assignmentType
                })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to assign file');
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('manualAssignmentModal'));
            modal.hide();

            // Refresh preview
            await this.previewMatching();

            this.showAlert(`File "${this.selectedFile.fileName}" assigned to "${contactSelect.value}"`, 'success');
        } catch (error) {
            console.error('Error assigning file:', error);
            this.showAlert('Error assigning file: ' + error.message, 'danger');
        }
    }

    async removeManualAssignment(contactName) {
        if (confirm(`Remove manual file assignment for ${contactName}?`)) {
            try {
                const response = await fetch(`/api/file-matching/manual-assignment/${encodeURIComponent(contactName)}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Failed to remove manual assignment');
                }

                // Refresh preview to show changes
                await this.previewMatching();
                this.showAlert(`Manual assignment removed for ${contactName}`, 'info');
            } catch (error) {
                console.error('Error removing assignment:', error);
                this.showAlert('Error removing assignment: ' + error.message, 'danger');
            }
        }
    }
}

// Global functions for validation
function selectValidationFile(fileName) {
    app.selectValidationFile(fileName);
}

// Global functions for enhanced file matching
function showManualAssignmentModal(contactName = null) {
    app.showManualAssignmentModal(contactName);
}

function bulkEnableAutoMatches() {
    app.bulkEnableAutoMatches();
}

function bulkDisableAutoMatches() {
    app.bulkDisableAutoMatches();
}

function toggleContactSending(contactName, enabled) {
    app.toggleContactSending(contactName, enabled);
}

function assignFileToContact() {
    app.assignFileToContact();
}

function removeManualAssignment(contactName) {
    app.removeManualAssignment(contactName);
}

// Global functions
async function uploadDocuments() {
    const fileInput = document.getElementById('documentsInput');

    if (!fileInput.files || fileInput.files.length === 0) {
        app.showAlert('Please select files to upload', 'warning');
        return;
    }

    const fileCount = fileInput.files.length;

    // Show warning for large uploads
    if (fileCount > 500) {
        const confirmed = confirm(`You are about to upload ${fileCount} files. This may take several minutes. Continue?`);
        if (!confirmed) return;
    }

    try {
        app.showLoading(`Uploading ${fileCount} documents... Please wait.`);

        const formData = new FormData();
        for (let file of fileInput.files) {
            formData.append('documents', file);
        }

        const response = await fetch('/api/file-matching/documents/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            app.showAlert(`Successfully uploaded ${result.files.length} files`, 'success');
            fileInput.value = '';
            await app.loadDocuments();
        } else {
            throw new Error(result.error || 'Upload failed');
        }

    } catch (error) {
        console.error('Error uploading documents:', error);
        app.showAlert('Error uploading files: ' + error.message, 'danger');
    } finally {
        app.hideLoading();
    }
}

async function deleteDocument(fileName) {
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
        const response = await fetch(`/api/file-matching/documents/${encodeURIComponent(fileName)}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            app.showAlert('File deleted successfully', 'success');
            await app.loadDocuments();
        } else {
            throw new Error(result.error || 'Delete failed');
        }

    } catch (error) {
        console.error('Error deleting document:', error);
        app.showAlert('Error deleting file: ' + error.message, 'danger');
    }
}

function previewFile(fileName) {
    const url = `/api/file-matching/documents/serve/${encodeURIComponent(fileName)}`;
    window.open(url, '_blank');
}

async function refreshDocuments() {
    await app.loadDocuments();
    app.showAlert('Documents refreshed', 'success');
}

async function previewMatching() {
    await app.previewMatching();
}

async function previewFileBlast() {
    await app.previewMatching();

    // Switch to matching tab to show results
    const matchingTab = document.getElementById('matching-tab');
    const tab = new bootstrap.Tab(matchingTab);
    tab.show();
}

// Rich Text Functions for File Matching
function formatFileText(format) {
    const textarea = document.getElementById('blastFilesMessage');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText) {
        let formattedText = '';

        switch (format) {
            case 'bold':
                formattedText = `*${selectedText}*`;
                break;
            case 'italic':
                formattedText = `_${selectedText}_`;
                break;
            case 'strikethrough':
                formattedText = `~${selectedText}~`;
                break;
            case 'monospace':
                formattedText = `\`\`\`${selectedText}\`\`\``;
                break;
            default:
                formattedText = selectedText;
        }

        textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);

        // Update preview if visible
        updateFilePreview();
    } else {
        app.showAlert('Please select text to format', 'warning');
    }
}

function insertFileVariable(variable) {
    const textarea = document.getElementById('blastFilesMessage');
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);

    let variableText = '';

    switch (variable) {
        case 'date':
            variableText = '{{date}}';
            break;
        case 'time':
            variableText = '{{time}}';
            break;
        default:
            variableText = `{{${variable}}}`;
    }

    textarea.value = textBefore + variableText + textAfter;
    textarea.focus();
    textarea.setSelectionRange(cursorPos + variableText.length, cursorPos + variableText.length);

    // Update preview if visible
    updateFilePreview();
}

function toggleFilePreview() {
    const preview = document.getElementById('fileMessagePreview');
    const toggle = document.getElementById('filePreviewToggle');

    if (preview.style.display === 'none') {
        preview.style.display = 'block';
        toggle.innerHTML = '<i class="fas fa-eye-slash me-1"></i>Hide Preview';
        updateFilePreview();
    } else {
        preview.style.display = 'none';
        toggle.innerHTML = '<i class="fas fa-eye me-1"></i>Show Preview';
    }
}

function updateFilePreview() {
    const textarea = document.getElementById('blastFilesMessage');
    const previewContent = document.getElementById('filePreviewContent');

    if (!previewContent || !textarea) return;

    let message = textarea.value;

    // Replace formatting
    message = message
        .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/~([^~]+)~/g, '<del>$1</del>')
        .replace(/```([^`]+)```/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    // Replace variables with sample data
    const sampleData = {
        name: 'John Doe',
        number: '628123456789',
        email: 'john@example.com',
        company: 'ABC Corp',
        fileName: 'document.pdf',
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID')
    };

    // Replace standard variables
    Object.keys(sampleData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, `<span class="badge bg-info">${sampleData[key]}</span>`);
    });

    // Replace any remaining variables with placeholder
    message = message.replace(/{{([^}]+)}}/g, '<span class="badge bg-secondary">$1</span>');

    previewContent.innerHTML = message || '<em class="text-muted">Type a message to see preview...</em>';
}

function updateFileVariables(headers) {
    const customVariablesGroup = document.getElementById('customFileVariables');
    const availableVariables = document.getElementById('availableFileVariables');

    if (!customVariablesGroup || !availableVariables) return;

    // Clear existing custom variables
    customVariablesGroup.innerHTML = '';

    // Standard variables
    const standardVars = ['name', 'number', 'email', 'company', 'fileName', 'date', 'time'];
    let allVariables = [...standardVars];

    // Add custom variables from headers
    if (headers && headers.length > 0) {
        const customHeaders = headers.filter(header => !standardVars.includes(header));

        customHeaders.forEach(header => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-primary btn-sm';
            button.onclick = () => insertFileVariable(header);
            button.title = `Insert ${header}`;
            button.textContent = `{{${header}}}`;
            customVariablesGroup.appendChild(button);

            allVariables.push(header);
        });
    }

    // Update available variables display
    availableVariables.textContent = allVariables.map(v => `{{${v}}}`).join(', ');
}

// Auto-update preview when typing
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('blastFilesMessage');
    if (textarea) {
        textarea.addEventListener('input', () => {
            if (document.getElementById('fileMessagePreview').style.display !== 'none') {
                updateFilePreview();
            }
        });
    }
});

// Global functions for bulk operations
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const documentCheckboxes = document.querySelectorAll('.document-checkbox');

    documentCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });

    app.updateBulkDeleteButton();
}

function selectAllDocuments() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const documentCheckboxes = document.querySelectorAll('.document-checkbox');

    const allSelected = Array.from(documentCheckboxes).every(cb => cb.checked);

    documentCheckboxes.forEach(checkbox => {
        checkbox.checked = !allSelected;
    });

    selectAllCheckbox.checked = !allSelected;
    selectAllCheckbox.indeterminate = false;

    app.updateBulkDeleteButton();

    // Update button text
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.innerHTML = `
            <i class="fas fa-${!allSelected ? 'check-square' : 'square'} me-1"></i>
            ${!allSelected ? 'Deselect All' : 'Select All'}
        `;
    }
}

async function bulkDeleteSelected() {
    const selectedCheckboxes = document.querySelectorAll('.document-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        app.showAlert('No files selected for deletion', 'warning');
        return;
    }

    const filenames = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!confirm(`Delete ${filenames.length} selected files? This action cannot be undone.`)) {
        return;
    }

    await app.bulkDeleteDocuments(filenames);
}

async function clearAllDocuments() {
    if (!confirm('Delete ALL documents? This action cannot be undone.')) {
        return;
    }

    await app.clearAllDocuments();
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FileMatchingApp();
});
