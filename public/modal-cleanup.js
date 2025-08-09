// Function to clean up modal artifacts
function cleanupModalArtifacts() {
    // Remove any lingering backdrop immediately
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        // Remove immediately without waiting for transitions
        backdrop.remove();
    });

    // Remove modal-open class and inline styles from body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('margin-right');

    // Additional cleanup for any remaining modal artifacts
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// Add event listener to all modals to clean up backdrop
document.addEventListener('DOMContentLoaded', function() {
    // Get all modals in the document
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Add hidden.bs.modal event listener to each modal
        modal.addEventListener('hidden.bs.modal', cleanupModalArtifacts);
        
        // Also add hidePreventedModal event listener in case modal hide is prevented
        modal.addEventListener('hidePrevented.bs.modal', cleanupModalArtifacts);
    });
});

// Override Bootstrap's Modal hide method to ensure cleanup
function overrideBootstrapModal() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal && !bootstrap.Modal.prototype._cleanupOverridden) {
        const originalBootstrapModalHide = bootstrap.Modal.prototype.hide;
        bootstrap.Modal.prototype.hide = function() {
            // Call original hide method
            const result = originalBootstrapModalHide.apply(this, arguments);

            // Immediate cleanup
            cleanupModalArtifacts();

            // Additional cleanup after a short delay to catch any remaining artifacts
            setTimeout(cleanupModalArtifacts, 50);

            return result;
        };

        // Mark as overridden to prevent multiple overrides
        bootstrap.Modal.prototype._cleanupOverridden = true;
        console.log('✅ Bootstrap Modal hide method overridden for cleanup');
    }
}

// Try to override immediately if Bootstrap is available
overrideBootstrapModal();

// If Bootstrap isn't ready yet, wait for it
if (typeof bootstrap === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Try again after DOM is loaded
        setTimeout(overrideBootstrapModal, 100);
    });
}

// Create a MutationObserver to watch for modal-backdrop additions and removals
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        // Check for added backdrop nodes
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('modal-backdrop')) {
                // Set up immediate cleanup when backdrop loses 'show' class
                const checkBackdrop = () => {
                    if (!node.classList.contains('show') && !document.querySelector('.modal.show')) {
                        setTimeout(() => {
                            if (node.parentNode && !document.querySelector('.modal.show')) {
                                node.remove();
                                cleanupModalArtifacts();
                            }
                        }, 10);
                    }
                };

                // Watch for class changes on the backdrop
                const backdropObserver = new MutationObserver(checkBackdrop);
                backdropObserver.observe(node, { attributes: true, attributeFilter: ['class'] });

                // Also check periodically
                const intervalId = setInterval(() => {
                    if (!node.parentNode) {
                        clearInterval(intervalId);
                        backdropObserver.disconnect();
                    } else if (!node.classList.contains('show') && !document.querySelector('.modal.show')) {
                        node.remove();
                        cleanupModalArtifacts();
                        clearInterval(intervalId);
                        backdropObserver.disconnect();
                    }
                }, 100);
            }
        });
    });
});

// Start observing the body for modal backdrop additions
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Cleanup on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Small delay to let modal close first
        setTimeout(() => {
            if (!document.querySelector('.modal.show')) {
                cleanupModalArtifacts();
            }
        }, 100);
    }
});

// Additional cleanup on any click outside modals
document.addEventListener('click', () => {
    // Small delay to let modal close first
    setTimeout(() => {
        if (!document.querySelector('.modal.show')) {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            if (backdrops.length > 0) {
                cleanupModalArtifacts();
            }
        }
    }, 50);
});

// Periodic cleanup to catch any missed backdrops
setInterval(() => {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    const activeModals = document.querySelectorAll('.modal.show');

    if (backdrops.length > 0 && activeModals.length === 0) {
        cleanupModalArtifacts();
    }
}, 1000);

// Make cleanup function globally available for manual cleanup
window.cleanupModalArtifacts = cleanupModalArtifacts;

console.log('🧹 Enhanced Modal Cleanup loaded');
