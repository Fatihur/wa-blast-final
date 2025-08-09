/**
 * Dynamic Navigation Bar Component
 * A reusable and configurable navbar component for the WA Blast application
 */

class DynamicNavbar {
    constructor(config = {}) {
        this.config = {
            brandText: 'WA Blast',
            brandIcon: 'fab fa-whatsapp',
            brandLink: '/',
            theme: 'bg-success',
            container: true,
            mobileBreakpoint: 'lg',
            ...config
        };
        
        this.menuItems = [];
        this.currentPage = this.getCurrentPage();
        this.isInitialized = false;
    }

    /**
     * Get the current page identifier from the URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('file-matching')) return 'file-matching';
        if (path.includes('logs')) return 'logs';
        if (path.includes('connection-status')) return 'connection-status';
        if (path.includes('setup')) return 'setup';
        return path.replace('/', '').replace('.html', '');
    }

    /**
     * Set navigation menu items
     */
    setMenuItems(items) {
        this.menuItems = items.map(item => ({
            id: item.id || item.text.toLowerCase().replace(/\s+/g, '-'),
            text: item.text,
            href: item.href,
            icon: item.icon || 'fas fa-link',
            active: item.active || false,
            visible: item.visible !== false,
            external: item.external || false,
            badge: item.badge || null,
            dropdown: item.dropdown || null,
            ...item
        }));
        return this;
    }

    /**
     * Add a single menu item
     */
    addMenuItem(item) {
        this.menuItems.push({
            id: item.id || item.text.toLowerCase().replace(/\s+/g, '-'),
            text: item.text,
            href: item.href,
            icon: item.icon || 'fas fa-link',
            active: item.active || false,
            visible: item.visible !== false,
            external: item.external || false,
            badge: item.badge || null,
            dropdown: item.dropdown || null,
            ...item
        });
        return this;
    }

    /**
     * Generate the navbar HTML
     */
    generateHTML() {
        const containerClass = this.config.container ? 'container' : 'container-fluid';
        
        return `
            <nav class="navbar navbar-expand-${this.config.mobileBreakpoint} navbar-dark ${this.config.theme}" id="dynamic-navbar">
                <div class="${containerClass}">
                    <a class="navbar-brand" href="${this.config.brandLink}">
                        <i class="${this.config.brandIcon} me-2"></i>
                        ${this.config.brandText}
                    </a>
                    
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <div class="navbar-nav ms-auto">
                            ${this.generateMenuItems()}
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Generate menu items HTML
     */
    generateMenuItems() {
        return this.menuItems
            .filter(item => item.visible)
            .map(item => {
                if (item.dropdown) {
                    return this.generateDropdownItem(item);
                }
                return this.generateRegularItem(item);
            })
            .join('');
    }

    /**
     * Generate regular menu item HTML
     */
    generateRegularItem(item) {
        const isActive = this.isItemActive(item);
        const activeClass = isActive ? 'active' : '';
        const target = item.external ? 'target="_blank" rel="noopener noreferrer"' : '';
        const badge = item.badge ? `<span class="badge bg-${item.badge.color || 'primary'} ms-1">${item.badge.text}</span>` : '';
        
        return `
            <a class="nav-link ${activeClass}" href="${item.href}" ${target} data-page="${item.id}">
                <i class="${item.icon} me-1"></i>
                ${item.text}
                ${badge}
            </a>
        `;
    }

    /**
     * Generate dropdown menu item HTML
     */
    generateDropdownItem(item) {
        const dropdownItems = item.dropdown.map(dropItem => {
            const target = dropItem.external ? 'target="_blank" rel="noopener noreferrer"' : '';
            const divider = dropItem.divider ? '<li><hr class="dropdown-divider"></li>' : '';
            
            if (dropItem.divider) return divider;
            
            return `
                <li>
                    <a class="dropdown-item" href="${dropItem.href}" ${target}>
                        <i class="${dropItem.icon || 'fas fa-link'} me-2"></i>
                        ${dropItem.text}
                    </a>
                </li>
            `;
        }).join('');

        return `
            <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="${item.icon} me-1"></i>
                    ${item.text}
                </a>
                <ul class="dropdown-menu">
                    ${dropdownItems}
                </ul>
            </div>
        `;
    }

    /**
     * Check if a menu item should be active
     */
    isItemActive(item) {
        if (item.active) return true;
        
        // Auto-detect active state based on current page
        const currentPath = window.location.pathname;
        const itemPath = item.href;
        
        // Exact match
        if (currentPath === itemPath) return true;
        
        // Home page special case
        if ((currentPath === '/' || currentPath === '/index.html') && 
            (itemPath === '/' || itemPath === '/index.html')) return true;
        
        // Page identifier match
        if (item.id === this.currentPage) return true;
        
        return false;
    }

    /**
     * Render the navbar to a container element
     */
    render(containerId = 'navbar-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Navbar container with ID '${containerId}' not found`);
            return this;
        }
        
        container.innerHTML = this.generateHTML();
        this.isInitialized = true;
        this.attachEventListeners();
        return this;
    }

    /**
     * Insert navbar at the beginning of body (if no container specified)
     */
    renderToBody() {
        const navbarHTML = this.generateHTML();
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);
        this.isInitialized = true;
        this.attachEventListeners();
        return this;
    }

    /**
     * Attach event listeners for navbar functionality
     */
    attachEventListeners() {
        // Handle mobile menu toggle
        const toggler = document.querySelector('#dynamic-navbar .navbar-toggler');
        const collapse = document.querySelector('#dynamic-navbar .navbar-collapse');
        
        if (toggler && collapse) {
            // Close mobile menu when clicking on nav links
            const navLinks = document.querySelectorAll('#dynamic-navbar .nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 992) { // Bootstrap lg breakpoint
                        const bsCollapse = new bootstrap.Collapse(collapse, { toggle: false });
                        bsCollapse.hide();
                    }
                });
            });
        }

        // Add smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('#dynamic-navbar a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Update active menu item
     */
    setActiveItem(itemId) {
        if (!this.isInitialized) return this;
        
        // Remove active class from all items
        const navLinks = document.querySelectorAll('#dynamic-navbar .nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to specified item
        const activeLink = document.querySelector(`#dynamic-navbar .nav-link[data-page="${itemId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        return this;
    }

    /**
     * Show/hide menu items dynamically
     */
    toggleMenuItem(itemId, visible) {
        const menuItem = this.menuItems.find(item => item.id === itemId);
        if (menuItem) {
            menuItem.visible = visible;
            if (this.isInitialized) {
                this.refresh();
            }
        }
        return this;
    }

    /**
     * Update menu item badge
     */
    updateBadge(itemId, badge) {
        const menuItem = this.menuItems.find(item => item.id === itemId);
        if (menuItem) {
            menuItem.badge = badge;
            if (this.isInitialized) {
                this.refresh();
            }
        }
        return this;
    }

    /**
     * Refresh the navbar (re-render)
     */
    refresh() {
        if (!this.isInitialized) return this;
        
        const navbar = document.getElementById('dynamic-navbar');
        if (navbar) {
            const parent = navbar.parentNode;
            navbar.remove();
            parent.insertAdjacentHTML('afterbegin', this.generateHTML());
            this.attachEventListeners();
        }
        return this;
    }

    /**
     * Destroy the navbar
     */
    destroy() {
        const navbar = document.getElementById('dynamic-navbar');
        if (navbar) {
            navbar.remove();
        }
        this.isInitialized = false;
        return this;
    }
}

// Export for use in other scripts
window.DynamicNavbar = DynamicNavbar;
