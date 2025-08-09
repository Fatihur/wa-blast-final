/**
 * Navigation Configuration for WA Blast Application
 * Defines the navigation structure and menu items for different pages
 */

// Default navigation configuration
const DEFAULT_NAVBAR_CONFIG = {
    brandText: 'WA Blast',
    brandIcon: 'fab fa-whatsapp',
    brandLink: '/',
    theme: 'bg-success',
    container: true,
    mobileBreakpoint: 'lg'
};

// Main navigation menu items
const MAIN_MENU_ITEMS = [
    {
        id: 'home',
        text: 'Home',
        href: '/',
        icon: 'fas fa-home'
    },
    {
        id: 'file-matching',
        text: 'File Matching',
        href: '/file-matching.html',
        icon: 'fas fa-file-alt'
    },
    {
        id: 'logs',
        text: 'Logs',
        href: '/logs.html',
        icon: 'fas fa-list-alt'
    },
    {
        id: 'connection-status',
        text: 'Connection',
        href: '/connection-status.html',
        icon: 'fas fa-plug'
    }
];

// Page-specific configurations
const PAGE_CONFIGS = {
    // Home page - show all main navigation
    'home': {
        config: DEFAULT_NAVBAR_CONFIG,
        menuItems: MAIN_MENU_ITEMS.filter(item => item.id !== 'home')
    },
    
    // File matching page - show home and other pages
    'file-matching': {
        config: {
            ...DEFAULT_NAVBAR_CONFIG,
            brandText: 'WA Blast - File Matching'
        },
        menuItems: [
            {
                id: 'home',
                text: 'Home',
                href: '/',
                icon: 'fas fa-home'
            },
            ...MAIN_MENU_ITEMS.filter(item => !['home', 'file-matching'].includes(item.id))
        ]
    },
    
    // Logs page
    'logs': {
        config: {
            ...DEFAULT_NAVBAR_CONFIG,
            brandText: 'WA Blast - Logs'
        },
        menuItems: [
            {
                id: 'home',
                text: 'Home',
                href: '/',
                icon: 'fas fa-home'
            },
            ...MAIN_MENU_ITEMS.filter(item => !['home', 'logs'].includes(item.id))
        ]
    },

    // Connection status page
    'connection-status': {
        config: {
            ...DEFAULT_NAVBAR_CONFIG,
            brandText: 'WA Blast - Connection'
        },
        menuItems: [
            {
                id: 'home',
                text: 'Home',
                href: '/',
                icon: 'fas fa-home'
            },
            ...MAIN_MENU_ITEMS.filter(item => !['home', 'connection-status'].includes(item.id))
        ]
    },
    
    // Setup page
    'setup': {
        config: {
            ...DEFAULT_NAVBAR_CONFIG,
            brandText: 'WA Blast - Setup'
        },
        menuItems: [
            {
                id: 'home',
                text: 'Home',
                href: '/',
                icon: 'fas fa-home'
            }
        ]
    }
};

/**
 * Initialize navbar for the current page
 */
function initializeNavbar(customConfig = {}) {
    // Get current page
    const currentPage = getCurrentPageId();
    
    // Get page-specific configuration
    const pageConfig = PAGE_CONFIGS[currentPage] || PAGE_CONFIGS['home'];
    
    // Merge configurations
    const config = {
        ...pageConfig.config,
        ...customConfig
    };
    
    // Create and render navbar
    const navbar = new DynamicNavbar(config);
    navbar.setMenuItems(pageConfig.menuItems);
    
    // Check if there's a navbar container, otherwise render to body
    const container = document.getElementById('navbar-container');
    if (container) {
        navbar.render('navbar-container');
    } else {
        navbar.renderToBody();
    }
    
    return navbar;
}

/**
 * Get current page identifier
 */
function getCurrentPageId() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('file-matching')) return 'file-matching';
    if (path.includes('logs')) return 'logs';
    if (path.includes('connection-status')) return 'connection-status';
    if (path.includes('setup')) return 'setup';
    return path.replace('/', '').replace('.html', '');
}

/**
 * Create a navbar with custom menu items
 */
function createCustomNavbar(config, menuItems) {
    const navbar = new DynamicNavbar(config);
    navbar.setMenuItems(menuItems);
    return navbar;
}

/**
 * Auto-initialize navbar when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Only auto-initialize if no navbar exists and auto-init is not disabled
    const existingNavbar = document.querySelector('.navbar');
    const autoInitDisabled = document.body.hasAttribute('data-navbar-auto-init-disabled');
    
    if (!existingNavbar && !autoInitDisabled) {
        initializeNavbar();
    }
});

// Export functions for manual initialization
window.initializeNavbar = initializeNavbar;
window.createCustomNavbar = createCustomNavbar;
window.getCurrentPageId = getCurrentPageId;
window.NAVBAR_CONFIG = {
    DEFAULT_NAVBAR_CONFIG,
    MAIN_MENU_ITEMS,
    PAGE_CONFIGS
};
