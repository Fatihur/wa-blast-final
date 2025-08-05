# 🚀 cPanel Deployment Guide untuk WA Blast

Panduan lengkap deploy aplikasi WhatsApp Blast ke hosting cPanel.

## ⚠️ Persyaratan cPanel

### Minimum Requirements:
- **Node.js Support**: cPanel harus mendukung Node.js (versi 14+)
- **SSH Access**: Untuk install dependencies
- **File Manager**: Untuk upload files
- **Subdomain/Domain**: Untuk aplikasi
- **Memory**: Minimal 512MB RAM
- **Storage**: Minimal 1GB space

### Hosting yang Mendukung:
- ✅ **Hostinger** (Business plan ke atas)
- ✅ **Namecheap** (Stellar Plus ke atas)
- ✅ **A2 Hosting** (Swift plan ke atas)
- ✅ **InMotion Hosting** (VPS/Dedicated)
- ❌ **Shared hosting biasa** (tidak mendukung Node.js)

## 📋 Langkah-langkah Deployment

### 1. 📁 Persiapan Files

Pastikan struktur file seperti ini:
```
wa-blast/
├── app.js                 # Entry point untuk cPanel
├── server.js              # Main server file
├── package.json           # Dependencies
├── public/
│   ├── .htaccess          # Apache configuration
│   ├── index.html         # Main UI
│   ├── app.js             # Frontend JavaScript
│   └── ...
├── routes/                # API routes
├── services/              # Services
├── utils/                 # Utilities
├── config/                # Configuration
└── uploads/               # Upload directory
```

### 2. 🔧 Setup Node.js di cPanel

1. **Login ke cPanel**
2. **Cari "Node.js"** di menu
3. **Create Node.js App**:
   - **Node.js Version**: 18.x atau terbaru
   - **Application Mode**: Production
   - **Application Root**: `wa-blast` (atau nama folder Anda)
   - **Application URL**: subdomain atau path yang diinginkan
   - **Application Startup File**: `app.js`

### 3. 📤 Upload Files

#### Option A: File Manager
1. **Buka File Manager** di cPanel
2. **Navigate** ke folder aplikasi (biasanya `public_html/wa-blast/`)
3. **Upload** semua files kecuali `node_modules/`
4. **Extract** jika upload dalam bentuk ZIP

#### Option B: Git (Jika tersedia)
```bash
# Clone repository
git clone https://github.com/your-username/wa-blast.git

# Atau upload manual files
```

### 4. 📦 Install Dependencies

1. **Buka Terminal** di cPanel (jika tersedia)
2. **Navigate** ke folder aplikasi:
   ```bash
   cd public_html/wa-blast
   ```
3. **Install dependencies**:
   ```bash
   npm install --production
   ```

#### Jika Terminal tidak tersedia:
1. **Download** `node_modules` di local
2. **Compress** folder `node_modules`
3. **Upload** dan extract di server

### 5. ⚙️ Environment Configuration

1. **Buat file `.env`** di root aplikasi:
   ```env
   NODE_ENV=production
   PORT=3000
   SESSION_NAME=wa-blast-session
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=50MB
   ```

2. **Set Environment Variables** di cPanel Node.js app:
   - `NODE_ENV=production`
   - `SESSION_NAME=wa-blast-session`

### 6. 📁 Set Permissions

Pastikan folder berikut memiliki permission 755:
```bash
chmod 755 uploads/
chmod 755 sessions/
chmod 755 logs/
chmod 644 public/.htaccess
```

### 7. 🚀 Start Application

1. **Kembali ke Node.js App** di cPanel
2. **Click "Start"** untuk menjalankan aplikasi
3. **Check Status** - harus menunjukkan "Running"

## 🔧 Troubleshooting

### Common Issues:

#### 1. **"Module not found" Error**
```bash
# Install missing modules
npm install module-name

# Atau install semua dependencies
npm install
```

#### 2. **Permission Denied**
```bash
# Set correct permissions
chmod 755 uploads/ sessions/ logs/
chmod 644 .env
```

#### 3. **Port Already in Use**
- cPanel biasanya auto-assign port
- Jangan hardcode port di aplikasi
- Gunakan `process.env.PORT`

#### 4. **WhatsApp Session Issues**
- Backup folder `sessions/` secara berkala
- Set permission 755 untuk folder sessions
- Pastikan tidak ada file corrupt

#### 5. **File Upload Issues**
```bash
# Check upload directory
ls -la uploads/
chmod 755 uploads/
```

### 6. **Memory Issues**
- Upgrade hosting plan
- Optimize aplikasi
- Restart Node.js app secara berkala

## 📊 Monitoring & Maintenance

### 1. **Check Application Status**
- Login ke cPanel
- Go to Node.js Apps
- Check status (Running/Stopped)

### 2. **View Logs**
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# cPanel logs
tail -f ~/logs/access_log
```

### 3. **Restart Application**
- Go to cPanel Node.js Apps
- Click "Restart"

### 4. **Update Application**
```bash
# Backup first
cp -r wa-blast wa-blast-backup

# Update files
# Upload new files

# Restart app
# Go to cPanel and restart
```

## 🔒 Security Considerations

### 1. **File Permissions**
```bash
# Secure permissions
chmod 644 .env
chmod 755 uploads/ sessions/
chmod 644 public/.htaccess
```

### 2. **Environment Variables**
- Jangan commit file `.env`
- Use cPanel environment variables
- Secure API keys

### 3. **Regular Backups**
```bash
# Backup sessions (important!)
tar -czf sessions-backup.tar.gz sessions/

# Backup uploads
tar -czf uploads-backup.tar.gz uploads/
```

## 📱 Access Your Application

Setelah deployment berhasil:

- **Main App**: `https://yourdomain.com/wa-blast/`
- **Anti-Ban Dashboard**: `https://yourdomain.com/wa-blast/anti-ban-dashboard.html`
- **File Matching**: `https://yourdomain.com/wa-blast/file-matching.html`
- **Logs**: `https://yourdomain.com/wa-blast/logs.html`

## 🎯 Performance Tips

### 1. **Optimize for Shared Hosting**
- Use minimal dependencies
- Implement caching
- Optimize images
- Minify CSS/JS

### 2. **Resource Management**
- Monitor memory usage
- Restart app regularly
- Clean old sessions
- Limit concurrent connections

### 3. **Database Optimization**
- Use file-based storage
- Implement data cleanup
- Regular backups

## 🆘 Support & Help

### If deployment fails:

1. **Check cPanel Error Logs**
2. **Verify Node.js version compatibility**
3. **Check file permissions**
4. **Verify all dependencies installed**
5. **Contact hosting support**

### Common cPanel Hosting Issues:

- **Shared hosting limitations**
- **Memory/CPU limits**
- **Node.js version restrictions**
- **File permission issues**
- **Network/firewall restrictions**

## 📞 Alternative Solutions

Jika cPanel tidak mendukung Node.js dengan baik:

1. **VPS Hosting** (DigitalOcean, Linode)
2. **Cloud Hosting** (Railway, Render)
3. **Dedicated Server**
4. **Docker Hosting**

## ✅ Final Checklist

- [ ] Node.js app created in cPanel
- [ ] All files uploaded
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Permissions configured
- [ ] Application started
- [ ] WhatsApp connection tested
- [ ] All features working
- [ ] Backup strategy in place

**Selamat! Aplikasi WA Blast Anda sekarang running di cPanel hosting!** 🎉
