// Setup JavaScript for cPanel deployment

class CPanelSetup {
    constructor() {
        this.init();
    }

    init() {
        this.checkSystemRequirements();
        this.setupEventListeners();
        this.detectAppRoot();
    }

    setupEventListeners() {
        document.getElementById('envForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEnvironmentConfig();
        });
    }

    detectAppRoot() {
        // Try to detect the application root from current URL
        const path = window.location.pathname;
        const appRoot = path.split('/').filter(p => p).slice(0, -1).join('/') || 'wa-blast';
        document.getElementById('appRoot').textContent = appRoot;
    }

    async checkSystemRequirements() {
        const systemCheck = document.getElementById('systemCheck');
        
        try {
            // Check if we can access the API
            const response = await fetch('/api/health');
            const isApiWorking = response.ok;

            // Check Node.js version (if available)
            let nodeVersion = 'Unknown';
            try {
                const versionResponse = await fetch('/api/system/version');
                if (versionResponse.ok) {
                    const versionData = await versionResponse.json();
                    nodeVersion = versionData.node || 'Unknown';
                }
            } catch (e) {
                // Version endpoint might not exist
            }

            // Check directories
            const directories = ['uploads', 'sessions', 'logs'];
            const dirChecks = await Promise.all(
                directories.map(dir => this.checkDirectory(dir))
            );

            // Render results
            systemCheck.innerHTML = this.renderSystemCheck({
                apiWorking: isApiWorking,
                nodeVersion: nodeVersion,
                directories: directories.map((dir, i) => ({
                    name: dir,
                    exists: dirChecks[i]
                }))
            });

        } catch (error) {
            systemCheck.innerHTML = this.renderSystemError(error.message);
        }
    }

    async checkDirectory(dirName) {
        try {
            const response = await fetch(`/${dirName}/`);
            return response.status !== 404;
        } catch (e) {
            return false;
        }
    }

    renderSystemCheck(data) {
        const { apiWorking, nodeVersion, directories } = data;
        
        let html = '';
        
        // API Check
        html += `
            <div class="status-check ${apiWorking ? 'status-success' : 'status-error'}">
                <i class="fas ${apiWorking ? 'fa-check-circle' : 'fa-times-circle'} me-2"></i>
                <strong>API Connection:</strong> ${apiWorking ? 'Working' : 'Failed'}
            </div>
        `;

        // Node.js Version
        const nodeOk = nodeVersion !== 'Unknown' && !nodeVersion.includes('v12') && !nodeVersion.includes('v10');
        html += `
            <div class="status-check ${nodeOk ? 'status-success' : 'status-warning'}">
                <i class="fas ${nodeOk ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                <strong>Node.js Version:</strong> ${nodeVersion}
                ${!nodeOk ? '<br><small>Recommended: Node.js 14 or higher</small>' : ''}
            </div>
        `;

        // Directory Checks
        directories.forEach(dir => {
            html += `
                <div class="status-check ${dir.exists ? 'status-success' : 'status-warning'}">
                    <i class="fas ${dir.exists ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                    <strong>Directory ${dir.name}/:</strong> ${dir.exists ? 'Exists' : 'Missing (will be created)'}
                </div>
            `;
        });

        return html;
    }

    renderSystemError(error) {
        return `
            <div class="status-check status-error">
                <i class="fas fa-times-circle me-2"></i>
                <strong>System Check Failed:</strong> ${error}
                <br><small>This might be normal if the application hasn't been started yet.</small>
            </div>
        `;
    }

    async saveEnvironmentConfig() {
        const formData = {
            sessionName: document.getElementById('sessionName').value,
            uploadPath: document.getElementById('uploadPath').value,
            maxFileSize: document.getElementById('maxFileSize').value,
            nodeEnv: document.getElementById('nodeEnv').value
        };

        try {
            const response = await fetch('/api/setup/environment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showAlert('success', 'Environment configuration saved successfully!');
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            this.showAlert('danger', 'Failed to save configuration: ' + error.message);
            
            // Fallback: show manual configuration
            this.showManualConfig(formData);
        }
    }

    showManualConfig(formData) {
        const envContent = `NODE_ENV=${formData.nodeEnv}
SESSION_NAME=${formData.sessionName}
UPLOAD_PATH=${formData.uploadPath}
MAX_FILE_SIZE=${formData.maxFileSize}
PORT=3000`;

        this.showAlert('info', `
            <strong>Manual Configuration:</strong><br>
            Create a <code>.env</code> file with this content:<br>
            <div class="code-block mt-2">${envContent.replace(/\n/g, '<br>')}</div>
        `);
    }

    checkPermissions() {
        // This would need server-side implementation
        this.showAlert('info', 'Please check file permissions manually in cPanel File Manager.');
    }

    async testApp() {
        const testResults = document.getElementById('testResults');
        testResults.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Testing...';

        try {
            const response = await fetch('/api/health');
            const data = await response.json();

            if (response.ok) {
                testResults.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Application Test: PASSED</strong><br>
                        Server is running and responding correctly.
                    </div>
                `;
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            testResults.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle me-2"></i>
                    <strong>Application Test: FAILED</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }

    async testWhatsApp() {
        const testResults = document.getElementById('testResults');
        testResults.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Testing WhatsApp connection...';

        try {
            const response = await fetch('/api/whatsapp/status');
            const data = await response.json();

            if (response.ok) {
                testResults.innerHTML = `
                    <div class="alert alert-${data.connected ? 'success' : 'warning'}">
                        <i class="fas fa-${data.connected ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                        <strong>WhatsApp Test: ${data.connected ? 'CONNECTED' : 'NOT CONNECTED'}</strong><br>
                        ${data.connected ? 'WhatsApp is ready to send messages.' : 'Please scan QR code to connect WhatsApp.'}
                    </div>
                `;

                if (data.connected) {
                    this.showSuccessCard();
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            testResults.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle me-2"></i>
                    <strong>WhatsApp Test: FAILED</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }

    showSuccessCard() {
        document.getElementById('successCard').style.display = 'block';
        document.getElementById('successCard').scrollIntoView({ behavior: 'smooth' });
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert after the form
        const form = document.getElementById('envForm');
        form.parentNode.insertBefore(alertDiv, form.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Global functions for button clicks
function checkPermissions() {
    setup.checkPermissions();
}

function testApp() {
    setup.testApp();
}

function testWhatsApp() {
    setup.testWhatsApp();
}

// Initialize setup when page loads
let setup;
document.addEventListener('DOMContentLoaded', () => {
    setup = new CPanelSetup();
});
