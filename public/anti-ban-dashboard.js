// Anti-Ban Dashboard JavaScript

class AntiBanDashboard {
    constructor() {
        this.data = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.loadAntiBanStatus();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Account configuration form
        document.getElementById('accountConfigForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAccountConfiguration();
        });
    }

    async loadAntiBanStatus() {
        try {
            const response = await fetch('/api/messages/anti-ban/status');
            const result = await response.json();

            if (result.success) {
                this.data = result.antiBan;
                this.updateUI();
                this.updateLastUpdated();
            } else {
                throw new Error(result.error || 'Failed to load anti-ban status');
            }
        } catch (error) {
            console.error('Error loading anti-ban status:', error);
            this.showError('Failed to load anti-ban status: ' + error.message);
        }
    }

    updateUI() {
        if (!this.data) return;

        // Update status card
        this.updateStatusCard();
        
        // Update usage metrics
        this.updateUsageMetrics();
        
        // Update detailed stats
        this.updateDetailedStats();
        
        // Update recommendations
        this.updateRecommendations();
    }

    updateStatusCard() {
        const statusCard = document.getElementById('statusCard');
        const statusText = document.getElementById('statusText');
        const statusIcon = document.getElementById('statusIcon');
        const accountTypeBadge = document.getElementById('accountTypeBadge');

        // Update account type badge
        const accountTypeColors = {
            'new_account': 'bg-warning',
            'normal_account': 'bg-info',
            'trusted_account': 'bg-success',
            'business_account': 'bg-primary'
        };

        const accountTypeLabels = {
            'new_account': 'New Account',
            'normal_account': 'Normal Account',
            'trusted_account': 'Trusted Account',
            'business_account': 'Business Account'
        };

        accountTypeBadge.className = `badge account-badge ms-2 ${accountTypeColors[this.data.accountType]}`;
        accountTypeBadge.textContent = accountTypeLabels[this.data.accountType];

        // Update status
        if (this.data.status.isPaused) {
            statusCard.className = 'card status-card danger';
            statusText.textContent = 'Blast is paused for safety. Please wait before sending more messages.';
            statusIcon.className = 'fas fa-circle text-danger';
        } else if (!this.data.status.canSendMessage) {
            statusCard.className = 'card status-card warning';
            statusText.textContent = 'Approaching rate limits. Use caution when sending messages.';
            statusIcon.className = 'fas fa-circle text-warning';
        } else {
            statusCard.className = 'card status-card success';
            statusText.textContent = 'Anti-ban protection is active. Safe to send messages.';
            statusIcon.className = 'fas fa-circle text-success';
        }
    }

    updateUsageMetrics() {
        // Hourly usage
        this.updateUsageMeter('hourly', this.data.current.messagesPerHour, this.data.limits.hour, this.data.usage.hourly);
        
        // Daily usage
        this.updateUsageMeter('daily', this.data.current.messagesPerDay, this.data.limits.day, this.data.usage.daily);
        
        // Weekly usage
        this.updateUsageMeter('weekly', this.data.current.messagesPerWeek, this.data.limits.week, this.data.usage.weekly);
    }

    updateUsageMeter(period, current, limit, percentage) {
        const usageElement = document.getElementById(`${period}Usage`);
        const percentageElement = document.getElementById(`${period}Percentage`);
        const fillElement = document.getElementById(`${period}UsageFill`);

        usageElement.textContent = `${current}/${limit}`;
        percentageElement.textContent = `${percentage}%`;
        fillElement.style.width = `${Math.min(percentage, 100)}%`;

        // Update color based on usage
        fillElement.className = 'usage-fill';
        if (percentage < 50) {
            fillElement.classList.add('low');
        } else if (percentage < 75) {
            fillElement.classList.add('medium');
        } else if (percentage < 90) {
            fillElement.classList.add('high');
        } else {
            fillElement.classList.add('critical');
        }
    }

    updateDetailedStats() {
        document.getElementById('messagesPerHour').textContent = this.data.current.messagesPerHour;
        document.getElementById('messagesPerDay').textContent = this.data.current.messagesPerDay;
        document.getElementById('messagesPerWeek').textContent = this.data.current.messagesPerWeek;
        document.getElementById('errorCount').textContent = this.data.status.consecutiveErrors;
    }

    updateRecommendations() {
        document.getElementById('optimalDelay').value = this.data.recommendations.optimalDelay;
        document.getElementById('dailyRemaining').value = this.data.recommendations.dailyRemaining;
        document.getElementById('hourlyRemaining').value = this.data.recommendations.hourlyRemaining;
    }

    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('lastUpdated').textContent = timeString;
    }

    async updateAccountConfiguration() {
        try {
            const accountAge = parseInt(document.getElementById('accountAge').value);
            const isBusinessAccount = document.getElementById('isBusinessAccount').checked;
            const isVerified = document.getElementById('isVerified').checked;

            if (!accountAge || accountAge < 1) {
                throw new Error('Please enter a valid account age');
            }

            const response = await fetch('/api/messages/anti-ban/configure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accountAge,
                    isBusinessAccount,
                    isVerified
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Account configuration updated successfully!');
                
                // Reload status to reflect changes
                setTimeout(() => {
                    this.loadAntiBanStatus();
                }, 1000);
            } else {
                throw new Error(result.error || 'Failed to update configuration');
            }
        } catch (error) {
            console.error('Error updating account configuration:', error);
            this.showError('Failed to update configuration: ' + error.message);
        }
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadAntiBanStatus();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showSuccess(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: message,
                timer: 3000,
                showConfirmButton: false
            });
        } else {
            alert('✅ ' + message);
        }
    }

    showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: message,
                confirmButtonText: 'OK'
            });
        } else {
            alert('❌ ' + message);
        }
    }

    showInfo(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Information',
                text: message,
                confirmButtonText: 'OK'
            });
        } else {
            alert('ℹ️ ' + message);
        }
    }
}

// Initialize dashboard when page loads
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AntiBanDashboard();
});

// Global function for refresh button
function loadAntiBanStatus() {
    if (dashboard) {
        dashboard.loadAntiBanStatus();
    }
}

// Handle page visibility change to pause/resume auto-refresh
document.addEventListener('visibilitychange', () => {
    if (dashboard) {
        if (document.hidden) {
            dashboard.stopAutoRefresh();
        } else {
            dashboard.startAutoRefresh();
            dashboard.loadAntiBanStatus(); // Refresh immediately when page becomes visible
        }
    }
});

// Utility functions for account type recommendations
function getAccountTypeRecommendations(accountType) {
    const recommendations = {
        'new_account': {
            maxPerHour: 20,
            maxPerDay: 100,
            recommendedDelay: 15000,
            tips: [
                'Start slowly with 10-15 messages per hour',
                'Use longer delays (15+ seconds)',
                'Avoid sending during weekends',
                'Monitor for any error messages'
            ]
        },
        'normal_account': {
            maxPerHour: 50,
            maxPerDay: 300,
            recommendedDelay: 10000,
            tips: [
                'Gradually increase message volume',
                'Use 8-12 second delays',
                'Personalize messages with variables',
                'Respect active hours (8 AM - 10 PM)'
            ]
        },
        'trusted_account': {
            maxPerHour: 100,
            maxPerDay: 500,
            recommendedDelay: 8000,
            tips: [
                'Can handle higher volumes safely',
                'Use 5-10 second delays',
                'Focus on message quality',
                'Monitor success rates'
            ]
        },
        'business_account': {
            maxPerHour: 200,
            maxPerDay: 1000,
            recommendedDelay: 5000,
            tips: [
                'Highest limits available',
                'Use 3-8 second delays',
                'Leverage business features',
                'Maintain professional content'
            ]
        }
    };

    return recommendations[accountType] || recommendations['normal_account'];
}
