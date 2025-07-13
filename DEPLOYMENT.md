# Deployment Guide

## Production Deployment

### 1. Server Requirements

- **Node.js**: Version 16 or higher
- **RAM**: Minimum 1GB, recommended 2GB+
- **Storage**: At least 5GB free space
- **Network**: Stable internet connection
- **OS**: Linux (Ubuntu/CentOS), Windows Server, or macOS

### 2. Environment Setup

```bash
# Clone repository
git clone <your-repo-url>
cd wa-blast

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
```

### 3. Environment Configuration

Edit `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Session Configuration
SESSION_NAME=wa-blast-production

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB

# Security (Optional)
JWT_SECRET=your-jwt-secret-here
ADMIN_PASSWORD=your-admin-password
```

### 4. Process Manager (PM2)

Install PM2 for production process management:

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'wa-blast',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 5. Reverse Proxy (Nginx)

Install and configure Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Handle file uploads
    client_max_body_size 50M;
}
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Or specific port for direct access
sudo ufw allow 3000/tcp
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads sessions logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  wa-blast:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./uploads:/app/uploads
      - ./sessions:/app/sessions
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - wa-blast
    restart: unless-stopped
```

### 3. Build and Run

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f wa-blast

# Stop
docker-compose down
```

## Cloud Deployment

### 1. Heroku

```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_NAME=wa-blast-heroku

# Deploy
git push heroku main
```

### 2. DigitalOcean App Platform

```yaml
name: wa-blast
services:
- name: web
  source_dir: /
  github:
    repo: your-username/wa-blast
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "8080"
```

### 3. AWS EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup application
git clone <your-repo>
cd wa-blast
npm install --production

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## Monitoring and Maintenance

### 1. Log Management

```bash
# View application logs
pm2 logs wa-blast

# View specific log files
tail -f logs/app.log
tail -f logs/error.log
tail -f logs/whatsapp.log
tail -f logs/blast.log
```

### 2. Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

### 3. Backup Strategy

```bash
# Backup sessions (important!)
tar -czf sessions-backup-$(date +%Y%m%d).tar.gz sessions/

# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### 4. Update Process

```bash
# Stop application
pm2 stop wa-blast

# Backup current version
cp -r . ../wa-blast-backup-$(date +%Y%m%d)

# Pull updates
git pull origin main

# Install new dependencies
npm install --production

# Start application
pm2 start wa-blast

# Verify deployment
pm2 logs wa-blast
```

## Security Considerations

### 1. Basic Security

- Change default ports
- Use strong passwords
- Enable firewall
- Regular updates
- Monitor logs

### 2. Advanced Security

- Implement rate limiting
- Add authentication
- Use HTTPS only
- Regular security audits
- Backup encryption

### 3. WhatsApp Security

- Don't share session files
- Monitor for unusual activity
- Use official WhatsApp guidelines
- Respect rate limits
- Regular session refresh

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Permission errors**
   ```bash
   sudo chown -R $USER:$USER .
   chmod -R 755 .
   ```

3. **Memory issues**
   ```bash
   # Increase swap space
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **WhatsApp connection issues**
   - Clear sessions folder
   - Check internet connection
   - Verify phone is connected
   - Try different QR code

For more troubleshooting, check the main README.md file.
