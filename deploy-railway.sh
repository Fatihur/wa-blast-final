#!/bin/bash

# Quick Railway Deployment Script for WA Blast
echo "🚂 Deploying WA Blast to Railway..."

# Colors
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

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed."
    print_status "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
print_status "Logging in to Railway..."
railway login

# Create new project or link existing
print_status "Setting up Railway project..."
if [ ! -f "railway.toml" ]; then
    print_warning "railway.toml not found. Creating new project..."
    railway init
else
    print_status "Using existing railway.toml configuration"
fi

# Set environment variables
print_status "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set HOST=0.0.0.0
railway variables set SESSION_NAME=wa-blast-session
railway variables set UPLOAD_PATH=./uploads
railway variables set MAX_FILE_SIZE=50MB

# Deploy to Railway
print_status "Deploying to Railway..."
railway up

# Get deployment URL
RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$RAILWAY_URL" ]; then
    print_status "✅ Deployment successful!"
    print_status "🌐 Your application is available at: $RAILWAY_URL"
    print_status "📁 File Matching: $RAILWAY_URL/file-matching.html"
    print_status "📋 Logs: $RAILWAY_URL/logs.html"
    echo ""
    print_status "📝 Useful Railway commands:"
    echo "  - View logs: railway logs"
    echo "  - Check status: railway status"
    echo "  - Open dashboard: railway open"
    echo "  - Redeploy: railway up"
else
    print_error "❌ Deployment failed. Check Railway dashboard for details."
    print_status "Run 'railway logs' to see error details."
fi
