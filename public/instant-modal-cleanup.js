// Instant Modal Backdrop Cleanup - Simple and Direct Approach
(function() {
    'use strict';
    
    // Immediate backdrop removal function
    function removeBackdropNow() {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Clean body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.style.marginRight = '';
    }
    
    // Override Bootstrap Modal prototype as soon as it's available
    function hijackBootstrapModal() {
        if (window.bootstrap && bootstrap.Modal) {
            const originalHide = bootstrap.Modal.prototype.hide;
            
            bootstrap.Modal.prototype.hide = function() {
                // Remove backdrop BEFORE calling original hide
                removeBackdropNow();
                
                // Call original
                const result = originalHide.apply(this, arguments);
                
                // Remove backdrop AFTER as well
                setTimeout(removeBackdropNow, 0);
                setTimeout(removeBackdropNow, 10);
                
                return result;
            };
            
            console.log('✅ Bootstrap Modal hijacked for instant cleanup');
            return true;
        }
        return false;
    }
    
    // Try to hijack immediately
    if (!hijackBootstrapModal()) {
        // If Bootstrap not ready, wait for it
        const checkBootstrap = setInterval(() => {
            if (hijackBootstrapModal()) {
                clearInterval(checkBootstrap);
            }
        }, 50);
        
        // Stop trying after 5 seconds
        setTimeout(() => clearInterval(checkBootstrap), 5000);
    }
    
    // Global cleanup function
    window.instantCleanupBackdrop = removeBackdropNow;
    
    // Emergency cleanup on any click
    document.addEventListener('click', (e) => {
        // Small delay to let modal close first
        setTimeout(() => {
            if (!document.querySelector('.modal.show')) {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                if (backdrops.length > 0) {
                    removeBackdropNow();
                }
            }
        }, 50);
    });
    
    // Cleanup on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setTimeout(() => {
                if (!document.querySelector('.modal.show')) {
                    removeBackdropNow();
                }
            }, 100);
        }
    });
    
    console.log('🚀 Instant Modal Cleanup loaded');
})();