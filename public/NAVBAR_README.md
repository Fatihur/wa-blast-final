# Dynamic Navbar Component

A reusable and dynamic navigation bar component for the WA Blast application that provides responsive design, active page highlighting, and easy customization.

## Features

- **Responsive Design**: Automatically adapts to different screen sizes with mobile hamburger menu
- **Active Page Highlighting**: Automatically highlights the current page in navigation
- **Dynamic Content**: Menu items can be shown/hidden and updated programmatically
- **Easy Configuration**: Simple JavaScript configuration for different pages
- **Smooth Animations**: Hover effects, transitions, and mobile menu animations
- **Badge Support**: Menu items can display notification badges
- **Dropdown Menus**: Support for dropdown menu items
- **Auto-initialization**: Automatically initializes on page load (can be disabled)

## Files

- `navbar.js` - Main navbar component class
- `navbar-config.js` - Configuration and auto-initialization
- `style.css` - Contains navbar-specific CSS styles
- `navbar-demo.html` - Demo page showing all features

## Quick Start

### 1. Include Required Files

Add these scripts to your HTML page:

```html
<!-- Bootstrap (required) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Dynamic Navbar Scripts -->
<script src="navbar.js"></script>
<script src="navbar-config.js"></script>
```

### 2. Add Navbar Container (Optional)

If you want to control where the navbar appears:

```html
<body>
    <div id="navbar-container"></div>
    <!-- Your page content -->
</body>
```

If you don't add a container, the navbar will automatically be inserted at the beginning of the body.

### 3. Auto-Initialization

The navbar will automatically initialize based on the current page. No additional code needed!

To disable auto-initialization, add this attribute to your body tag:

```html
<body data-navbar-auto-init-disabled>
```

## Manual Usage

### Basic Manual Initialization

```javascript
// Initialize with default settings for current page
const navbar = initializeNavbar();

// Initialize with custom configuration
const navbar = initializeNavbar({
    brandText: 'My Custom App',
    theme: 'bg-primary'
});
```

### Creating Custom Navbar

```javascript
// Create a completely custom navbar
const navbar = new DynamicNavbar({
    brandText: 'My App',
    brandIcon: 'fas fa-star',
    brandLink: '/dashboard',
    theme: 'bg-dark',
    container: true,
    mobileBreakpoint: 'md'
});

// Add menu items
navbar.setMenuItems([
    {
        id: 'home',
        text: 'Home',
        href: '/',
        icon: 'fas fa-home'
    },
    {
        id: 'users',
        text: 'Users',
        href: '/users',
        icon: 'fas fa-users',
        badge: { text: '5', color: 'danger' }
    },
    {
        id: 'settings',
        text: 'Settings',
        icon: 'fas fa-cog',
        dropdown: [
            { text: 'Profile', href: '/profile', icon: 'fas fa-user' },
            { text: 'Logout', href: '/logout', icon: 'fas fa-sign-out-alt' }
        ]
    }
]);

// Render the navbar
navbar.renderToBody(); // or navbar.render('container-id')
```

## Configuration Options

### Navbar Configuration

```javascript
{
    brandText: 'WA Blast',           // Brand text
    brandIcon: 'fab fa-whatsapp',    // Brand icon (Font Awesome)
    brandLink: '/',                  // Brand link URL
    theme: 'bg-success',             // Bootstrap theme class
    container: true,                 // Use container or container-fluid
    mobileBreakpoint: 'lg'           // Bootstrap breakpoint for mobile menu
}
```

### Menu Item Configuration

```javascript
{
    id: 'unique-id',                 // Unique identifier
    text: 'Menu Text',               // Display text
    href: '/path',                   // Link URL
    icon: 'fas fa-icon',             // Font Awesome icon
    active: false,                   // Force active state
    visible: true,                   // Show/hide item
    external: false,                 // Open in new tab
    badge: {                         // Optional badge
        text: '5',
        color: 'danger'              // Bootstrap color
    },
    dropdown: [                      // Optional dropdown items
        { text: 'Item 1', href: '/item1', icon: 'fas fa-item' },
        { divider: true },           // Dropdown divider
        { text: 'Item 2', href: '/item2', icon: 'fas fa-item' }
    ]
}
```

## API Methods

### DynamicNavbar Class Methods

```javascript
// Set all menu items
navbar.setMenuItems(items)

// Add a single menu item
navbar.addMenuItem(item)

// Render to specific container
navbar.render('container-id')

// Render to body
navbar.renderToBody()

// Update active menu item
navbar.setActiveItem('item-id')

// Show/hide menu item
navbar.toggleMenuItem('item-id', visible)

// Update menu item badge
navbar.updateBadge('item-id', { text: '10', color: 'primary' })

// Refresh navbar (re-render)
navbar.refresh()

// Destroy navbar
navbar.destroy()
```

### Global Functions

```javascript
// Initialize navbar for current page
initializeNavbar(customConfig)

// Create custom navbar
createCustomNavbar(config, menuItems)

// Get current page identifier
getCurrentPageId()
```

## Page-Specific Configuration

The navbar automatically configures itself based on the current page. You can customize this in `navbar-config.js`:

```javascript
const PAGE_CONFIGS = {
    'home': {
        config: { brandText: 'WA Blast' },
        menuItems: [/* menu items */]
    },
    'custom-page': {
        config: { brandText: 'Custom Page' },
        menuItems: [/* custom menu items */]
    }
};
```

## Styling

The navbar uses Bootstrap 5 classes and custom CSS. Key CSS classes:

- `#dynamic-navbar` - Main navbar container
- `#dynamic-navbar .nav-link` - Navigation links
- `#dynamic-navbar .nav-link.active` - Active navigation link
- `#dynamic-navbar .badge` - Notification badges

## Browser Support

- Modern browsers supporting ES6+
- Bootstrap 5 compatible browsers
- Mobile responsive (iOS Safari, Chrome Mobile, etc.)

## Demo

Visit `navbar-demo.html` to see all features in action and test the component interactively.
