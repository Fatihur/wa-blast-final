// Enhanced test script for modal backdrop removal
function testModalBackdropFix() {
    console.log('=== Enhanced Modal Backdrop Test ===');
    
    // Check current state
    const backdrops = document.querySelectorAll('.modal-backdrop');
    const modals = document.querySelectorAll('.modal.show');
    const bodyClasses = document.body.className;
    
    console.log('Current backdrops:', backdrops.length);
    console.log('Active modals:', modals.length);
    console.log('Body classes:', bodyClasses);
    
    // Show backdrop details
    backdrops.forEach((backdrop, i) => {
        console.log(`Backdrop ${i}:`, {
            classes: backdrop.className,
            style: backdrop.style.cssText,
            visible: backdrop.offsetParent !== null
        });
    });
    
    // Force cleanup using all available methods
    if (backdrops.length > 0 && modals.length === 0) {
        console.log('🧹 Cleaning up lingering backdrops...');
        
        // Method 1: Instant cleanup
        if (window.instantCleanupBackdrop) {
            window.instantCleanupBackdrop();
            console.log('✅ Used instant cleanup');
        }
        
        // Method 2: Regular cleanup
        if (window.cleanupModalArtifacts) {
            window.cleanupModalArtifacts();
            console.log('✅ Used regular cleanup');
        }
        
        // Method 3: Force remove
        if (window.forceRemoveModalBackdrop) {
            window.forceRemoveModalBackdrop();
            console.log('✅ Used force remove');
        }
        
        // Method 4: Manual removal
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        console.log('✅ Manual removal complete');
        
    } else if (backdrops.length === 0) {
        console.log('✅ No backdrops found - all clean!');
    } else {
        console.log('ℹ️ Modal is active, backdrops are expected');
    }
    
    // Final check
    setTimeout(() => {
        const remainingBackdrops = document.querySelectorAll('.modal-backdrop');
        console.log('Final backdrop count:', remainingBackdrops.length);
        console.log('=== Test Complete ===');
    }, 100);
}

// Quick cleanup function
function quickCleanup() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    console.log('Quick cleanup done - removed', backdrops.length, 'backdrops');
}

// Make functions globally available
window.testModalBackdropFix = testModalBackdropFix;
window.quickCleanup = quickCleanup;

console.log('🔧 Enhanced modal test script loaded');
console.log('Available commands:');
console.log('- testModalBackdropFix() - Full test and cleanup');
console.log('- quickCleanup() - Instant backdrop removal');
console.log('- instantCleanupBackdrop() - Instant cleanup method');