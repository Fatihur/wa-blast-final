// File Matching Application JavaScript

class FileMatchingApp {
    constructor() {
        this.documents = [];
        this.matchingResults = null;
        this.contacts = [];
        this.headers = [];
        this.init();
    }

    init() {
        // Force hide any existing loading modal
        this.hideLoading();

        // Initialize notifications
        this.initializeNotifications();

        // Initialize socket connection
        this.initializeSocket();

        this.loadDocuments();
        this.setupEventListeners();

        // Initialize blast files tab content immediately
        setTimeout(() => {
            this.initBlastFilesTab();
        }, 500);
    }

    // Initialize notification system
    initializeNotifications() {
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

    // Notification methods
    showSuccessNotification(title, message = '') {
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

    // Blast result notification for file matching
    showBlastFileResult(results) {
        // Reset progress modal flag
        this.progressModalShowing = false;

        if (typeof Swal !== 'undefined') {
            const successRate = results.successRate || Math.round((results.successful / results.total) * 100);

            Swal.fire({
                icon: results.successful === results.total ? 'success' : 'warning',
                title: 'File Blast Complete!',
                html: `
                    <div class="text-start">
                        <div class="row">
                            <div class="col-6">
                                <p><strong>Total:</strong> ${results.total}</p>
                                <p><strong>Successful:</strong> <span class="text-success">${results.successful}</span></p>
                                <p><strong>Failed:</strong> <span class="text-danger">${results.failed}</span></p>
                            </div>
                            <div class="col-6">
                                <p><strong>Files Sent:</strong> ${results.filesSent || results.successful}</p>
                                <p><strong>Success Rate:</strong> ${successRate}%</p>
                                <p><strong>Duration:</strong> ${results.duration || 'N/A'}</p>
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

    // Initialize socket connection
    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();

            // Blast progress for file matching
            this.socket.on('blast-progress', (progress) => {
                this.showBlastProgress(progress);
            });

            // Blast completion
            this.socket.on('blast-complete', (results) => {
                this.showBlastFileResult(results);
                this.hideLoading();
            });
        }
    }

    // Blast progress notification for file matching
    showBlastProgress(progress) {
        if (typeof Swal !== 'undefined') {
            const percentage = progress.percentage || Math.round(((progress.sent + progress.failed) / progress.total) * 100);

            // Only show progress modal if not already showing
            if (!this.progressModalShowing) {
                this.progressModalShowing = true;

                Swal.fire({
                    title: 'Sending File Blast...',
                    html: `
                        <div class="text-center">
                            <div class="progress mb-3">
                                <div class="progress-bar progress-bar-striped progress-bar-animated"
                                     style="width: ${percentage}%"></div>
                            </div>
                            <p><strong>Progress:</strong> ${progress.sent + progress.failed}/${progress.total} (${percentage}%)</p>
                            <p><strong>Successful:</strong> <span class="text-success">${progress.sent}</span></p>
                            <p><strong>Failed:</strong> <span class="text-danger">${progress.failed}</span></p>
                            <p><strong>Files Sent:</strong> ${progress.sent}</p>
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
                            <p><strong>Files Sent:</strong> ${progress.sent}</p>
                        </div>
                    `;
                }
            }
        }
    }

    setupEventListeners() {
        // Tab change events
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'matching-tab') {
                    this.initMatchingTab();
                } else if (e.target.id === 'blast-files-tab') {
                    this.initBlastFilesTab();

                    // Force show form and toolbar after tab switch
                    setTimeout(() => {
                        const blastForm = document.getElementById('blastFilesForm');
                        const toolbar = document.querySelector('.btn-toolbar');

                        if (blastForm) {
                            blastForm.style.display = 'block';
                            blastForm.style.visibility = 'visible';
                            blastForm.style.opacity = '1';
                        }

                        if (toolbar) {
                            toolbar.style.display = 'flex';
                            toolbar.style.visibility = 'visible';
                            toolbar.style.opacity = '1';
                        }

                        console.log('✅ Blast form and toolbar forced visible after tab switch');
                    }, 100);
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

    async initBlastFilesTab() {
        try {
            // Hide any existing loading modal
            this.hideLoading();

            // Initialize blast files tab
            await this.loadContacts();
            await this.loadDocuments();

            // Update variables in toolbar
            updateFileVariables(this.headers);

            // Show form if contacts and documents are available
            const blastForm = document.getElementById('blastFilesForm');
            const alertInfo = document.querySelector('#blastFilesContent .alert-info');

            // Always show the form for demo purposes
            if (blastForm) blastForm.style.display = 'block';
            if (alertInfo && this.contacts.length === 0 && this.documents.length === 0) {
                alertInfo.innerHTML = `
                    <i class="fas fa-info-circle me-2"></i>
                    You can test the rich text editor below. Import contacts and upload documents for full functionality.
                `;
            } else if (alertInfo) {
                alertInfo.style.display = 'none';
            }

            // Load default template if textarea is empty
            const textarea = document.getElementById('blastFilesMessage');
            if (textarea && !textarea.value.trim()) {
                textarea.value = `Hello {{name}},

Your document *{{fileName}}* is ready for download.

Use the toolbar above to format your message and add variables.

Best regards,
{{company}}`;

                // Update preview if visible
                if (document.getElementById('fileMessagePreview').style.display !== 'none') {
                    updateFilePreview();
                }
            }
        } catch (error) {
            console.error('Error initializing blast files tab:', error);
            this.hideLoading();
        }
    }

    async previewMatching() {
        try {
            this.showLoading('Analyzing file matching...');

            // Check if API exists first
            const response = await fetch('/api/file-matching/preview');

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    this.displayMatchingResults(data.preview, data.statistics);
                } else {
                    throw new Error(data.error || 'Failed to preview matching');
                }
            } else {
                // Fallback: create mock preview
                this.displayMatchingResults([], {
                    totalContacts: 0,
                    matchedCount: 0,
                    unmatchedCount: 0,
                    totalFiles: this.documents.length,
                    unusedFilesCount: this.documents.length
                });
            }
        } catch (error) {
            console.error('Error previewing matching:', error);

            // Show fallback message instead of error
            const matchingContent = document.getElementById('matchingContent');
            if (matchingContent) {
                matchingContent.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Import contacts with fileName column to see file matching preview.
                    </div>
                `;
            }
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
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Contact Name</th>
                            <th>Number</th>
                            <th>Expected File</th>
                            <th>Matched File</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${preview.map(item => `
                            <tr>
                                <td>${item.contact.name || '-'}</td>
                                <td><span class="badge bg-secondary">${item.contact.number}</span></td>
                                <td><code>${item.contact.fileName || 'Not specified'}</code></td>
                                <td>
                                    ${item.matchedFile ? 
                                        `<span class="badge bg-success">${item.matchedFile.fileName}</span>` : 
                                        '<span class="text-muted">No match</span>'
                                    }
                                </td>
                                <td>
                                    <span class="badge bg-${item.status === 'matched' ? 'success' : 'warning'}">
                                        <i class="fas fa-${item.status === 'matched' ? 'check' : 'exclamation-triangle'} me-1"></i>
                                        ${item.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
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

            <div id="blastFilesProgress" class="mt-4" style="display: none;">
                <h5>Blast Progress</h5>
                <div class="progress mb-3">
                    <div class="progress-bar" id="blastFilesProgressBar" role="progressbar" style="width: 0%"></div>
                </div>
                <div id="blastFilesStatus" class="text-muted"></div>
            </div>
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

            if (!confirm(`Send blast with files to ${contactsData.contacts.length} contacts?`)) {
                return;
            }

            this.showBlastProgress();

            const response = await fetch('/api/messages/blast-with-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contacts: contactsData.contacts,
                    message: message,
                    delay: delay,
                    retryAttempts: retryAttempts
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
            console.error('Error sending blast with files:', error);
            this.showAlert('Error sending blast: ' + error.message, 'danger');
            this.hideBlastProgress();
        }
    }

    showBlastProgress() {
        document.getElementById('blastFilesForm').style.display = 'none';
        document.getElementById('blastFilesProgress').style.display = 'block';
    }

    hideBlastProgress() {
        document.getElementById('blastFilesForm').style.display = 'block';
        document.getElementById('blastFilesProgress').style.display = 'none';
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

            this.showLoading('Sending blast messages with files...');

            const response = await fetch('/api/messages/blast-with-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    delay,
                    retryAttempts
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
        }
    }
}

// Global functions
async function uploadDocuments() {
    const fileInput = document.getElementById('documentsInput');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        app.showAlert('Please select files to upload', 'warning');
        return;
    }

    try {
        app.showLoading('Uploading documents...');
        
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

// Template Management
const messageTemplates = {
    simple: {
        name: "Simple Document Delivery",
        content: `Hello {{name}},

Your document *{{fileName}}* is ready for download.

Thank you for using our service!

Best regards,
{{company}}`
    },
    formal: {
        name: "Formal Business Document",
        content: `Dear {{name}},

We are pleased to inform you that your requested document _{{fileName}}_ has been processed and is now available.

**Document Details:**
- File Name: {{fileName}}
- Processed Date: {{date}}
- Processing Time: {{time}}

Should you have any questions or require further assistance, please do not hesitate to contact us at {{number}}.

Sincerely,
{{company}} Team`
    },
    marketing: {
        name: "Marketing with File",
        content: `🎉 *Great news, {{name}}!* 🎉

Your personalized document {{fileName}} is now ready!

✅ *Premium Quality*
✅ *Fast Processing*
✅ *Secure Delivery*

~Limited time offer~ - Get additional services with 20% discount!

📞 Contact us: {{number}}
📧 Email: {{email}}
🏢 {{company}}

Valid until: {{date}}`
    },
    notification: {
        name: "Document Ready Notification",
        content: `📄 *Document Ready Notification*

Hi {{name}},

Your document *{{fileName}}* has been successfully processed and is ready for pickup/download.

**Processing Summary:**
- Status: ✅ Complete
- Date: {{date}}
- Time: {{time}}

Please save this file securely. If you need any assistance, contact us at {{number}}.

Thank you,
{{company}}`
    },
    invoice: {
        name: "Invoice/Receipt Delivery",
        content: `💰 *Invoice/Receipt Delivery*

Dear {{name}},

Please find attached your invoice/receipt: *{{fileName}}*

**Transaction Details:**
- Document: {{fileName}}
- Issue Date: {{date}}
- Issue Time: {{time}}

For any billing inquiries, please contact:
📞 {{number}}
📧 {{email}}

Thank you for your business!
{{company}}`
    },
    certificate: {
        name: "Certificate Delivery",
        content: `🏆 *Certificate Delivery*

Congratulations {{name}}!

Your certificate *{{fileName}}* is now ready and attached to this message.

**Certificate Details:**
- Certificate: {{fileName}}
- Issue Date: {{date}}
- Issued by: {{company}}

This is an official document. Please keep it safe for your records.

For verification or inquiries:
📞 {{number}}
📧 {{email}}

Congratulations once again!
{{company}} Team`
    }
};

function loadTemplate() {
    const selector = document.getElementById('templateSelector');
    const textarea = document.getElementById('blastFilesMessage');

    if (!selector || !textarea) return;

    const templateKey = selector.value;

    if (templateKey && messageTemplates[templateKey]) {
        textarea.value = messageTemplates[templateKey].content;
        updateFilePreview();

        // Show success message
        if (window.app) {
            app.showAlert(`Template "${messageTemplates[templateKey].name}" loaded successfully!`, 'success');
        }
    }
}

function clearTemplate() {
    const textarea = document.getElementById('blastFilesMessage');
    const selector = document.getElementById('templateSelector');

    if (textarea) {
        textarea.value = '';
        updateFilePreview();
    }

    if (selector) {
        selector.value = '';
    }

    if (window.app) {
        app.showAlert('Template cleared', 'info');
    }
}

function previewTemplates() {
    const previewContent = document.getElementById('templatePreviewContent');
    if (!previewContent) return;

    let html = '';

    Object.keys(messageTemplates).forEach(key => {
        const template = messageTemplates[key];

        // Process template with sample data
        let processedContent = template.content
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
            company: 'ABC Corporation',
            fileName: 'document.pdf',
            date: new Date().toLocaleDateString('id-ID'),
            time: new Date().toLocaleTimeString('id-ID')
        };

        Object.keys(sampleData).forEach(varKey => {
            const regex = new RegExp(`{{${varKey}}}`, 'g');
            processedContent = processedContent.replace(regex, `<span class="badge bg-info">${sampleData[varKey]}</span>`);
        });

        html += `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${template.name}</h6>
                    <button class="btn btn-sm btn-primary" onclick="selectTemplate('${key}')">
                        <i class="fas fa-check me-1"></i>
                        Use This Template
                    </button>
                </div>
                <div class="card-body">
                    <div class="template-preview">
                        ${processedContent}
                    </div>
                </div>
            </div>
        `;
    });

    previewContent.innerHTML = html;
}

function selectTemplate(templateKey) {
    const selector = document.getElementById('templateSelector');
    const textarea = document.getElementById('blastFilesMessage');

    if (selector && textarea && messageTemplates[templateKey]) {
        selector.value = templateKey;
        textarea.value = messageTemplates[templateKey].content;
        updateFilePreview();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('templatePreviewModal'));
        if (modal) {
            modal.hide();
        }

        if (window.app) {
            app.showAlert(`Template "${messageTemplates[templateKey].name}" selected!`, 'success');
        }
    }
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
    // Force hide any loading modal immediately
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        const modal = bootstrap.Modal.getInstance(loadingModal);
        if (modal) {
            modal.hide();
        }
        loadingModal.style.display = 'none';
    }

    window.app = new FileMatchingApp();

    // Auto-activate blast-files tab if URL hash is present
    if (window.location.hash === '#blast-files') {
        setTimeout(() => {
            const blastTab = document.getElementById('blast-files-tab');
            if (blastTab) {
                blastTab.click();
            }
        }, 100);
    }
});
