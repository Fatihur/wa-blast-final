// Quick Fix for Rich Text Toolbar
// Paste this in browser console if toolbar still not visible

console.log('🔧 Quick Fix: Activating Rich Text Toolbar...');

// Function to force show toolbar
function forceShowToolbar() {
    // 1. Activate blast tab
    const blastTab = document.getElementById('blast-files-tab');
    const blastContent = document.getElementById('blast-files');
    
    if (blastTab && blastContent) {
        // Remove active from other tabs
        document.querySelectorAll('.nav-link').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        
        // Activate blast tab
        blastTab.classList.add('active');
        blastContent.classList.add('show', 'active');
        
        console.log('✅ Blast tab activated');
    }
    
    // 2. Force show toolbar
    const toolbar = document.querySelector('.btn-toolbar');
    if (toolbar) {
        toolbar.style.display = 'flex !important';
        toolbar.style.visibility = 'visible !important';
        toolbar.style.opacity = '1 !important';
        toolbar.style.height = 'auto !important';
        toolbar.style.overflow = 'visible !important';
        toolbar.style.position = 'relative !important';
        toolbar.style.zIndex = '1000 !important';
        
        console.log('✅ Toolbar forced visible');
    } else {
        console.log('❌ Toolbar not found');
    }
    
    // 3. Force show form
    const form = document.getElementById('blastFilesForm');
    if (form) {
        form.style.display = 'block !important';
        form.style.visibility = 'visible !important';
        form.style.opacity = '1 !important';
        
        console.log('✅ Form forced visible');
    } else {
        console.log('❌ Form not found');
    }
    
    // 4. Force show all buttons
    document.querySelectorAll('.btn-toolbar .btn').forEach((btn, index) => {
        btn.style.display = 'inline-block !important';
        btn.style.visibility = 'visible !important';
        btn.style.opacity = '1 !important';
        btn.style.position = 'relative !important';
        btn.style.zIndex = '1001 !important';
        
        console.log(`✅ Button ${index + 1} forced visible`);
    });
    
    // 5. Remove any conflicting styles
    const style = document.createElement('style');
    style.innerHTML = `
        #blast-files .btn-toolbar {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            overflow: visible !important;
            background-color: #f8f9fa !important;
            padding: 0.5rem !important;
            border: 1px solid #dee2e6 !important;
            border-radius: 0.375rem 0.375rem 0 0 !important;
            margin-bottom: 0.5rem !important;
        }
        
        #blast-files .btn-toolbar .btn {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        #blastFilesForm {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        #blast-files {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Override styles applied');
    
    // 6. Scroll to editor
    setTimeout(() => {
        const textarea = document.getElementById('blastFilesMessage');
        if (textarea) {
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            textarea.focus();
            console.log('✅ Scrolled to editor');
        }
    }, 500);
    
    console.log('🎉 Quick fix completed! Toolbar should now be visible.');
}

// Auto-run the fix
forceShowToolbar();

// Export for manual use
window.forceShowToolbar = forceShowToolbar;

// Add button to page for easy access
setTimeout(() => {
    const fixButton = document.createElement('button');
    fixButton.innerHTML = '🔧 Fix Toolbar';
    fixButton.className = 'btn btn-warning position-fixed';
    fixButton.style.top = '10px';
    fixButton.style.right = '10px';
    fixButton.style.zIndex = '9999';
    fixButton.onclick = forceShowToolbar;
    document.body.appendChild(fixButton);
    
    console.log('✅ Fix button added to page');
}, 1000);
