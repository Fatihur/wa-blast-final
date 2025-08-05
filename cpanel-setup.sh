#!/bin/bash

# cPanel Setup Script for WA Blast
# Run this script after uploading files to cPanel

echo "🚀 Setting up WA Blast on cPanel..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "app.js" ] || [ ! -f "server.js" ]; then
    print_error "app.js or server.js not found. Please run this script in the application directory."
    exit 1
fi

print_status "Found application files ✅"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads sessions logs
chmod 755 uploads sessions logs

# Set file permissions
print_status "Setting file permissions..."
chmod 644 *.js *.json *.md
chmod 755 *.sh
chmod 644 public/.htaccess

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_status "Created .env file. Please edit it with your configuration."
fi

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check if version is 14 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 14 ]; then
        print_warning "Node.js version $NODE_VERSION detected. Recommended: 14 or higher"
    fi
else
    print_error "Node.js not found. Please ensure Node.js is available in cPanel."
fi

# Install dependencies
print_status "Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install --production
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully ✅"
    else
        print_error "Failed to install dependencies. Please check npm logs."
    fi
else
    print_error "npm not found. Please install dependencies manually."
fi

# Test application
print_status "Testing application startup..."
timeout 10s node app.js &
APP_PID=$!
sleep 5

if kill -0 $APP_PID 2>/dev/null; then
    print_status "Application starts successfully ✅"
    kill $APP_PID
else
    print_warning "Application test failed. Check logs for errors."
fi

# Display final instructions
echo ""
print_status "🎉 Setup completed!"
echo ""
print_status "📋 Next steps in cPanel:"
echo "1. Go to 'Node.js Apps' in cPanel"
echo "2. Click 'Create Application'"
echo "3. Set Application Root to current directory"
echo "4. Set Application Startup File to 'app.js'"
echo "5. Set Node.js version to 14 or higher"
echo "6. Click 'Create'"
echo "7. Start the application"
echo ""
print_status "📱 After starting, your app will be available at:"
echo "   https://yourdomain.com/your-app-path/"
echo ""
print_status "🔧 Important files:"
echo "   - app.js (startup file)"
echo "   - .env (configuration)"
echo "   - uploads/ (file uploads)"
echo "   - sessions/ (WhatsApp sessions)"
echo ""
print_status "📖 For detailed instructions, see CPANEL-DEPLOYMENT.md"
