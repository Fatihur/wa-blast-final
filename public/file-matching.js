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
                // Use new progress modal instead of old SweetAlert
                this.updateBlastProgress({
                    processed: progress.sent + progress.failed,
                    total: progress.total,
                    sent: progress.sent,
                    failed: progress.failed,
                    currentContact: progress.currentContact,
                    status: `Processing ${progress.sent + progress.failed}/${progress.total} contacts...`
                });
            });

            // Blast completion
            this.socket.on('blast-complete', (results) => {
                // Update final progress
                this.updateBlastProgress({
                    processed: results.total,
                    total: results.total,
                    sent: results.successful,
                    failed: results.failed,
                    status: 'Blast completed!'
                });

                this.showBlastFileResult(results);
            });

            // Handle blast stop
            this.socket.on('blast-stopped', (data) => {
                this.updateBlastProgress({
                    processed: data.processed || 0,
                    total: data.total || 0,
                    sent: data.sent || 0,
                    failed: data.failed || 0,
                    status: 'Blast stopped by user'
                });
            });
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
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

            const response = await fetch('/api/file-matching/documents', {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    this.documents = data.files;
                    this.displayDocuments(data.files);
                    this.displayStatistics(data.statistics);
                } else {
                    throw new Error(data.error || 'Failed to load documents');
                }
            } else {
                // Fallback: show empty state
                this.documents = [];
                this.displayDocuments([]);
                this.displayStatistics({ totalFiles: 0, totalSize: 0 });
            }
        } catch (error) {
            console.error('Error loading documents:', error);

            // Show fallback instead of error
            this.documents = [];
            this.displayDocuments([]);
            this.displayStatistics({ totalFiles: 0, totalSize: 0 });

            if (error.name !== 'AbortError') {
                this.showAlert('Could not connect to server. Please refresh the page.', 'warning');
            }
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

            // Add timeout to prevent infinite loading
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

            try {
                // Check if API exists first
                const response = await fetch('/api/file-matching/preview', {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

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
            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (fetchError.name === 'AbortError') {
                    console.log('Request timed out, showing fallback');
                } else {
                    console.error('Fetch error:', fetchError);
                }

                // Always show fallback on any error
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
        const searchRow = document.getElementById('contactSearchRow');
        const searchResultsCount = document.getElementById('searchResultsCount');

        // Store original results for search functionality
        if (typeof window !== 'undefined') {
            window.originalMatchingResults = preview;
        }

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
            // Hide search box when no results
            if (searchRow) searchRow.style.display = 'none';

            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No contacts found. Please import contacts first.
                </div>
            `;
            return;
        }

        // Show search box when results are available
        if (searchRow) {
            searchRow.style.display = 'flex';
            if (searchResultsCount) {
                searchResultsCount.textContent = `${preview.length} contacts total`;
                searchResultsCount.className = 'text-muted';
            }
        }

        resultsDiv.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Contact Name</th>
                            <th>Number</th>
                            <th>Email</th>
                            <th>Company</th>
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
                                <td>${item.contact.email || '-'}</td>
                                <td>${item.contact.company || '-'}</td>
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

    showBlastProgressModal(title = 'Sending Messages', totalContacts = 0) {
        this.blastAborted = false;
        this.totalContacts = totalContacts;
        this.processedContacts = 0;

        // Create or update modal content
        const modalHtml = `
            <div class="modal fade" id="blastProgressModal" tabindex="-1" aria-labelledby="blastProgressModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="blastProgressModalLabel">
                                <i class="fas fa-paper-plane me-2"></i>
                                ${title}
                            </h5>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="card border-info">
                                            <div class="card-body text-center">
                                                <h4 class="text-info mb-1" id="totalContactsCount">${totalContacts}</h4>
                                                <small class="text-muted">Total Contacts</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card border-success">
                                            <div class="card-body text-center">
                                                <h4 class="text-success mb-1" id="sentCount">0</h4>
                                                <small class="text-muted">Sent Successfully</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card border-danger">
                                            <div class="card-body text-center">
                                                <h4 class="text-danger mb-1" id="failedCount">0</h4>
                                                <small class="text-muted">Failed</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="fw-bold">Progress</span>
                                    <span id="progressPercentage">0%</span>
                                </div>
                                <div class="progress" style="height: 20px;">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                                         id="blastProgressBar"
                                         role="progressbar"
                                         style="width: 0%"
                                         aria-valuenow="0"
                                         aria-valuemin="0"
                                         aria-valuemax="100">
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="fw-bold mb-2">Current Status:</label>
                                <div class="alert alert-info mb-0" id="currentStatus">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Initializing blast process...
                                </div>
                            </div>

                            <div class="mb-3" id="lastProcessedContact" style="display: none;">
                                <label class="fw-bold mb-2">Last Processed:</label>
                                <div class="card">
                                    <div class="card-body py-2">
                                        <div class="row align-items-center">
                                            <div class="col-md-6">
                                                <strong id="lastContactName">-</strong>
                                            </div>
                                            <div class="col-md-4">
                                                <span id="lastContactPhone" class="text-muted">-</span>
                                            </div>
                                            <div class="col-md-2 text-end">
                                                <span id="lastContactStatus" class="badge bg-secondary">-</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="errorLog" style="display: none;">
                                <label class="fw-bold mb-2 text-danger">
                                    <i class="fas fa-exclamation-triangle me-1"></i>
                                    Recent Errors:
                                </label>
                                <div class="alert alert-danger" style="max-height: 150px; overflow-y: auto;">
                                    <ul id="errorList" class="mb-0"></ul>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" id="stopBlastBtn" onclick="fileMatchingApp.stopBlast()">
                                <i class="fas fa-stop me-2"></i>
                                Stop Blast
                            </button>
                            <button type="button" class="btn btn-secondary" id="closeBlastBtn" onclick="fileMatchingApp.hideBlastProgressModal()" style="display: none;">
                                <i class="fas fa-times me-2"></i>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('blastProgressModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('blastProgressModal'));
        modal.show();

        return modal;
    }

    updateBlastProgress(data) {
        const { processed, total, sent, failed, currentContact, status, error } = data;

        // Update counters
        document.getElementById('sentCount').textContent = sent || 0;
        document.getElementById('failedCount').textContent = failed || 0;

        // Update progress bar
        const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
        const progressBar = document.getElementById('blastProgressBar');
        const progressPercentage = document.getElementById('progressPercentage');

        if (progressBar && progressPercentage) {
            progressBar.style.width = percentage + '%';
            progressBar.setAttribute('aria-valuenow', percentage);
            progressPercentage.textContent = percentage + '%';
        }

        // Update current status
        const statusElement = document.getElementById('currentStatus');
        if (statusElement) {
            if (this.blastAborted) {
                statusElement.innerHTML = '<i class="fas fa-stop-circle me-2"></i>Blast stopped by user';
                statusElement.className = 'alert alert-warning mb-0';
            } else if (status) {
                statusElement.innerHTML = `<i class="fas fa-info-circle me-2"></i>${status}`;
                statusElement.className = 'alert alert-info mb-0';
            }
        }

        // Update last processed contact
        if (currentContact) {
            const lastProcessedDiv = document.getElementById('lastProcessedContact');
            const nameElement = document.getElementById('lastContactName');
            const phoneElement = document.getElementById('lastContactPhone');
            const statusElement = document.getElementById('lastContactStatus');

            if (lastProcessedDiv && nameElement && phoneElement && statusElement) {
                lastProcessedDiv.style.display = 'block';
                nameElement.textContent = currentContact.name || currentContact.nama || 'Unknown';
                phoneElement.textContent = currentContact.phone || currentContact.nomor || 'No phone';

                if (currentContact.success) {
                    statusElement.textContent = 'Sent';
                    statusElement.className = 'badge bg-success';
                } else {
                    statusElement.textContent = 'Failed';
                    statusElement.className = 'badge bg-danger';
                }
            }
        }

        // Handle errors
        if (error) {
            const errorLog = document.getElementById('errorLog');
            const errorList = document.getElementById('errorList');

            if (errorLog && errorList) {
                errorLog.style.display = 'block';
                const errorItem = document.createElement('li');
                errorItem.innerHTML = `<strong>${currentContact?.name || 'Unknown'}:</strong> ${error}`;
                errorList.appendChild(errorItem);

                // Keep only last 5 errors
                while (errorList.children.length > 5) {
                    errorList.removeChild(errorList.firstChild);
                }
            }
        }

        // Show close button when completed
        if (percentage >= 100 || this.blastAborted) {
            const stopBtn = document.getElementById('stopBlastBtn');
            const closeBtn = document.getElementById('closeBlastBtn');

            if (stopBtn) stopBtn.style.display = 'none';
            if (closeBtn) closeBtn.style.display = 'inline-block';
        }
    }

    hideBlastProgressModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('blastProgressModal'));
        if (modal) {
            modal.hide();
        }

        // Remove modal from DOM after hiding
        setTimeout(() => {
            const modalElement = document.getElementById('blastProgressModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 300);
    }

    stopBlast() {
        if (confirm('Are you sure you want to stop the blast process?')) {
            this.blastAborted = true;

            // Update UI to show stopping status
            const statusElement = document.getElementById('currentStatus');
            if (statusElement) {
                statusElement.innerHTML = '<i class="fas fa-stop-circle me-2"></i>Stopping blast process...';
                statusElement.className = 'alert alert-warning mb-0';
            }

            // Disable stop button
            const stopBtn = document.getElementById('stopBlastBtn');
            if (stopBtn) {
                stopBtn.disabled = true;
                stopBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Stopping...';
            }

            // Send stop signal to server
            fetch('/api/messages/stop-blast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.error('Error stopping blast:', error);
            });
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

    async validateFileMatching() {
        try {
            this.showLoading('Validating file matching...');

            // Get file matching validation from server
            const response = await fetch('/api/file-matching/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contacts: this.contacts
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                this.showAlert('Error validating file matching: ' + (result.error || 'Unknown error'), 'danger');
                return { canProceed: false };
            }

            const { matched, unmatched, statistics } = result;

            // If no contacts have matching files, prevent sending
            if (matched.length === 0) {
                this.showAlert('No contacts have matching files. Please ensure your contacts have a "fileName" column that matches files in the documents folder.', 'danger');
                return { canProceed: false };
            }

            // Show validation summary and get user confirmation
            const confirmed = await this.showFileMatchingConfirmation(matched, unmatched, statistics);

            return { canProceed: confirmed, matched, unmatched };

        } catch (error) {
            console.error('Error validating file matching:', error);
            this.showAlert('Error validating file matching: ' + error.message, 'danger');
            return { canProceed: false };
        } finally {
            this.hideLoading();
        }
    }

    async showFileMatchingConfirmation(matched, unmatched, statistics) {
        return new Promise((resolve) => {
            // Create unmatched contacts list HTML
            let unmatchedListHtml = '';
            if (unmatched.length > 0) {
                unmatchedListHtml = `
                    <div class="mt-3">
                        <h6 class="text-warning">⚠️ Contacts that will be SKIPPED:</h6>
                        <div class="alert alert-warning" style="max-height: 200px; overflow-y: auto;">
                            <ul class="mb-0">
                                ${unmatched.map(contact => `
                                    <li><strong>${contact.name || contact.nama || 'Unknown'}</strong>
                                        (${contact.phone || contact.nomor || 'No phone'}) -
                                        <em>${contact.reason || 'No matching file'}</em>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            }

            const html = `
                <div class="file-matching-confirmation">
                    <div class="text-center mb-3">
                        <i class="fas fa-file-check fa-3x text-primary"></i>
                        <h4 class="mt-2">File Matching Validation</h4>
                    </div>

                    <div class="row text-center mb-3">
                        <div class="col-md-6">
                            <div class="card border-success">
                                <div class="card-body">
                                    <h5 class="text-success">${matched.length}</h5>
                                    <small>Contacts with matching files<br><strong>WILL RECEIVE MESSAGES</strong></small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-warning">
                                <div class="card-body">
                                    <h5 class="text-warning">${unmatched.length}</h5>
                                    <small>Contacts without matching files<br><strong>WILL BE SKIPPED</strong></small>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${unmatchedListHtml}

                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Only contacts with matching files will receive messages.</strong>
                        Skipped contacts will be logged for your review.
                    </div>
                </div>
            `;

            Swal.fire({
                title: 'Confirm File Matching Blast',
                html: html,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: matched.length > 0 ? '#28a745' : '#6c757d',
                cancelButtonColor: '#dc3545',
                confirmButtonText: `Send to ${matched.length} contacts`,
                cancelButtonText: 'Cancel',
                width: '600px',
                customClass: {
                    popup: 'file-matching-popup'
                }
            }).then((result) => {
                resolve(result.isConfirmed);
            });
        });
    }

    showSkippedContactsInfo(skippedContacts) {
        if (!skippedContacts || skippedContacts.length === 0) {
            return;
        }

        const skippedListHtml = skippedContacts.map(contact => `
            <tr>
                <td>${contact.name || contact.nama || 'Unknown'}</td>
                <td>${contact.phone || contact.nomor || 'No phone'}</td>
                <td>${contact.fileName || contact.namaFile || 'Not specified'}</td>
                <td><span class="text-muted">${contact.reason || 'No matching file found'}</span></td>
            </tr>
        `).join('');

        const html = `
            <div class="skipped-contacts-info">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>${skippedContacts.length} contacts were skipped</strong> because their files were not found in the documents folder.
                </div>

                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                    <table class="table table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>Contact Name</th>
                                <th>Phone</th>
                                <th>Expected File</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${skippedListHtml}
                        </tbody>
                    </table>
                </div>

                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        To include these contacts in future blasts, upload their corresponding files to the documents folder.
                    </small>
                </div>
            </div>
        `;

        Swal.fire({
            title: 'Skipped Contacts Report',
            html: html,
            icon: 'info',
            confirmButtonText: 'OK',
            width: '700px',
            customClass: {
                popup: 'skipped-contacts-popup'
            }
        });
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

            // Validate file matching before sending
            const validationResult = await this.validateFileMatching();
            if (!validationResult.canProceed) {
                return; // User cancelled or validation failed
            }

            // Show progress modal instead of loading
            const matchedContacts = validationResult.matched || [];
            this.showBlastProgressModal('Sending File Matching Blast', matchedContacts.length);

            const response = await fetch('/api/messages/blast-with-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contacts: this.contacts,
                    message,
                    delay,
                    retryAttempts
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update final progress
                this.updateBlastProgress({
                    processed: result.summary.total,
                    total: result.summary.total,
                    sent: result.summary.sent,
                    failed: result.summary.failed,
                    status: 'Blast completed successfully!'
                });

                let alertMessage = `Blast completed! Sent: ${result.summary.sent}`;

                if (result.summary.failed > 0) {
                    alertMessage += `, Failed: ${result.summary.failed}`;
                }

                if (result.summary.unmatched > 0) {
                    alertMessage += `, Skipped: ${result.summary.unmatched} (no matching files)`;
                }

                // Show detailed results if there were skipped contacts
                if (result.summary.unmatched > 0) {
                    setTimeout(() => {
                        this.showSkippedContactsInfo(result.unmatchedContacts || []);
                    }, 3000);
                }

                // Clear form
                document.getElementById('blastFilesMessage').value = '';
                if (typeof updateFilePreview === 'function') {
                    updateFilePreview();
                }
            } else {
                throw new Error(result.error || 'Blast failed');
            }

        } catch (error) {
            console.error('Error sending blast:', error);

            // Update progress modal with error
            this.updateBlastProgress({
                processed: this.processedContacts || 0,
                total: this.totalContacts || 0,
                sent: 0,
                failed: this.processedContacts || 0,
                status: 'Blast failed: ' + error.message,
                error: error.message
            });

            this.showAlert('Error sending blast: ' + error.message, 'danger');
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

    // Check file count
    if (fileInput.files.length > 200) {
        app.showAlert('Maximum 200 files allowed per upload', 'warning');
        return;
    }

    // Check total size
    let totalSize = 0;
    for (let file of fileInput.files) {
        totalSize += file.size;
        if (file.size > 200 * 1024 * 1024) { // 200MB per file
            app.showAlert(`File "${file.name}" is too large. Maximum size is 200MB per file.`, 'warning');
            return;
        }
    }

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`Uploading ${fileInput.files.length} files, total size: ${totalSizeMB}MB`);

    try {
        app.showLoading(`Uploading ${fileInput.files.length} documents (${totalSizeMB}MB)...`);

        const formData = new FormData();
        for (let file of fileInput.files) {
            formData.append('documents', file);
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await fetch('/api/file-matching/documents/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const result = await response.json();

        if (response.ok && result.success) {
            app.showAlert(`Successfully uploaded ${result.files.length} files`, 'success');
            fileInput.value = '';
            await app.loadDocuments();
        } else {
            throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        console.error('Error uploading documents:', error);

        let errorMessage = 'Unknown error occurred';

        if (error.message.includes('413')) {
            errorMessage = 'Files too large. Try uploading fewer files or smaller files.';
        } else if (error.message.includes('400')) {
            errorMessage = error.message.replace('HTTP 400: Bad Request', '').trim() || 'Invalid request. Check file types and sizes.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again or contact support.';
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
            errorMessage = 'Network timeout. Try uploading fewer files at once.';
        } else {
            errorMessage = error.message;
        }

        app.showAlert(`Error uploading files: ${errorMessage}`, 'danger');
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
