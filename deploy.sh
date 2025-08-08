#!/bin/bash

# WA Blast Deployment Script
echo "🚀 Starting WA Blast deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p sessions uploads logs

# Set permissions
print_status "Setting permissions..."
chmod 755 sessions uploads logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found. Copying from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running the application."
fi

# Build and start the application
print_status "Building and starting the application..."
docker-compose up -d --build

# Wait for the application to start
print_status "Waiting for application to start..."
sleep 10

# Check if the application is running
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Application deployed successfully!"
    print_status "🌐 Access your application at: http://localhost:3000"
    print_status "📁 File Matching: http://localhost:3000/file-matching.html"
    print_status "📋 Logs: http://localhost:3000/logs.html"
    echo ""
    print_status "📝 Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop application: docker-compose down"
    echo "  - Restart application: docker-compose restart"
    echo "  - Update application: git pull && docker-compose up -d --build"
else
    print_error "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi
