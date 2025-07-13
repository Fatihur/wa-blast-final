// Fix Loading Issue Script
// Run this in browser console if loading modal is stuck

function forceHideLoading() {
    console.log('🔧 Fixing loading modal issue...');
    
    // Method 1: Hide via Bootstrap Modal
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        try {
            const modal = bootstrap.Modal.getInstance(loadingModal);
            if (modal) {
                modal.hide();
                console.log('✅ Bootstrap modal hidden');
            }
        } catch (e) {
            console.log('⚠️ Bootstrap modal not found');
        }
        
        // Method 2: Force hide via CSS
        loadingModal.style.display = 'none';
        loadingModal.classList.remove('show');
        console.log('✅ Modal hidden via CSS');
    }
    
    // Method 3: Remove backdrop
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        backdrop.remove();
        console.log('✅ Modal backdrop removed');
    });
    
    // Method 4: Remove modal-open class from body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    console.log('✅ Body classes cleaned');
    
    // Method 5: Force show rich text editor
    const blastForm = document.getElementById('blastFilesForm');
    if (blastForm) {
        blastForm.style.display = 'block';
        console.log('✅ Blast form shown');
    }
    
    // Method 6: Initialize rich text editor
    if (window.app && window.app.initBlastFilesTab) {
        window.app.initBlastFilesTab();
        console.log('✅ Blast files tab initialized');
    }
    
    console.log('🎉 Loading issue fixed!');
}

// Auto-run the fix
forceHideLoading();

// Export for manual use
window.forceHideLoading = forceHideLoading;
