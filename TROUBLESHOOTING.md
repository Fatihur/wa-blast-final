# Troubleshooting Guide

## Common Issues and Solutions

### 1. WhatsApp Connection Issues

#### Problem: QR Code not appearing
**Solutions:**
- Refresh the page
- Click "Connect WhatsApp" button again
- Check browser console for errors
- Ensure server is running

#### Problem: QR Code appears but connection fails
**Solutions:**
- Make sure your phone has internet connection
- Ensure WhatsApp is updated to latest version
- Try scanning the QR code again
- Clear browser cache and try again

#### Problem: Connection drops frequently
**Solutions:**
- Check internet stability
- Avoid using WhatsApp Web on other devices simultaneously
- Restart the application
- Clear sessions folder and reconnect

### 2. File Upload Issues

#### Problem: File upload fails
**Solutions:**
- Check file size (max 50MB)
- Ensure uploads folder exists and is writable
- Check server logs for detailed error
- Try with a smaller file first

#### Problem: "File not found" error when sending
**Solutions:**
- Ensure file was uploaded successfully first
- Check uploads folder permissions
- Verify file path in request
- Try uploading the file again

#### Problem: Image/Document not sending
**Solutions:**
1. **Check file upload first:**
   ```javascript
   // Test upload endpoint
   const formData = new FormData();
   formData.append('file', fileInput.files[0]);
   
   const response = await fetch('/api/upload/file', {
       method: 'POST',
       body: formData
   });
   ```

2. **Verify file path in send request:**
   ```javascript
   const requestData = {
       number: '628xxx',
       message: 'Test message',
       type: 'image', // or 'document'
       fileName: 'test.jpg',
       filePath: './uploads/uploaded-file.jpg'
   };
   ```

3. **Check server logs:**
   ```bash
   tail -f logs/app.log
   tail -f logs/error.log
   ```

### 3. Message Sending Issues

#### Problem: Messages not sending
**Solutions:**
- Verify WhatsApp connection status
- Check phone number format (628xxxxxxxxx)
- Ensure message is not empty
- Check rate limiting (add delays between messages)

#### Problem: Rich text formatting not working
**Solutions:**
- Use correct syntax: `*bold*`, `_italic_`, `~strikethrough~`, ``` `monospace` ```
- Ensure no extra spaces around formatting characters
- Test with simple formatting first

#### Problem: Variables not being replaced
**Solutions:**
- Check variable syntax: `{{name}}`, `{{email}}`
- Ensure contact data contains the required fields
- Use preview function to test variable replacement
- Check for typos in variable names

### 4. Excel Import Issues

#### Problem: Excel file not importing
**Solutions:**
- Use supported formats: .xlsx, .xls, .csv
- Check file is not corrupted
- Ensure required columns exist (name, number)
- Download and use the provided template

#### Problem: Phone numbers marked as invalid
**Solutions:**
- Use format: 628xxxxxxxxx (without +)
- Remove spaces and special characters
- Ensure numbers are Indonesian format
- Check for empty cells in number column

### 5. Blast Campaign Issues

#### Problem: Blast stops in the middle
**Solutions:**
- Check WhatsApp connection
- Reduce delay between messages
- Check for rate limiting
- Monitor server resources

#### Problem: High failure rate
**Solutions:**
- Verify phone numbers are valid and active
- Increase delay between messages (3-5 seconds)
- Check message content for spam triggers
- Ensure files are not too large

### 6. Performance Issues

#### Problem: Server running slow
**Solutions:**
- Check server resources (RAM, CPU)
- Reduce concurrent operations
- Increase delay between messages
- Monitor log file sizes

#### Problem: Memory usage high
**Solutions:**
- Restart the application periodically
- Clear old log files
- Reduce batch sizes for blast campaigns
- Monitor for memory leaks

### 7. Debugging Steps

#### Enable Debug Logging
1. Set environment variable:
   ```bash
   NODE_ENV=development
   ```

2. Check log files:
   ```bash
   tail -f logs/app.log
   tail -f logs/error.log
   tail -f logs/whatsapp.log
   tail -f logs/blast.log
   ```

#### Test Individual Components

1. **Test WhatsApp Connection:**
   ```bash
   curl http://localhost:3000/api/messages/status
   ```

2. **Test File Upload:**
   ```bash
   curl -X POST -F "file=@test-image.png" http://localhost:3000/api/upload/file
   ```

3. **Test Single Message:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -d '{"number":"628xxx","message":"test","type":"text"}' \
        http://localhost:3000/api/messages/send
   ```

#### Browser Console Debugging
1. Open browser developer tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests
4. Look for error messages in red

### 8. File and Folder Permissions

#### Linux/Mac:
```bash
# Ensure correct permissions
chmod 755 uploads/
chmod 755 sessions/
chmod 755 logs/

# Fix ownership if needed
chown -R $USER:$USER uploads/ sessions/ logs/
```

#### Windows:
- Ensure the application has write permissions to:
  - uploads/ folder
  - sessions/ folder
  - logs/ folder

### 9. Environment Issues

#### Problem: Environment variables not loading
**Solutions:**
- Ensure .env file exists in root directory
- Check .env file format (no spaces around =)
- Restart the application after changing .env
- Use .env.example as template

#### Problem: Port already in use
**Solutions:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac

# Or use different port
PORT=3001 npm start
```

### 10. Network Issues

#### Problem: Cannot access from other devices
**Solutions:**
- Bind to all interfaces: `0.0.0.0:3000`
- Check firewall settings
- Ensure port is open
- Use correct IP address

#### Problem: Slow response times
**Solutions:**
- Check internet connection
- Monitor server resources
- Reduce file sizes
- Optimize database queries (if using database)

### 11. Quick Fixes

#### Reset Everything:
```bash
# Stop application
pm2 stop wa-blast  # or Ctrl+C

# Clear sessions (will require re-scanning QR)
rm -rf sessions/*

# Clear uploads (optional)
rm -rf uploads/*

# Clear logs (optional)
rm -rf logs/*

# Restart
npm start
```

#### Test with Minimal Setup:
1. Use test-upload.html page
2. Upload a small image (test-image.png)
3. Send to your own number first
4. Check logs for detailed errors

### 12. Getting Help

If issues persist:

1. **Check logs first:**
   ```bash
   cat logs/error.log | tail -50
   ```

2. **Provide information when asking for help:**
   - Error messages from logs
   - Steps to reproduce the issue
   - File types and sizes being used
   - Phone number format
   - Browser and OS version

3. **Test with provided test files:**
   ```bash
   node create-test-image.js
   # Use test-image.png and test-document.txt for testing
   ```

### 13. Prevention Tips

- **Regular maintenance:**
  - Clear old log files weekly
  - Restart application daily in production
  - Monitor disk space
  - Backup sessions folder

- **Best practices:**
  - Use delays of 2-5 seconds between messages
  - Test with small batches first
  - Validate phone numbers before sending
  - Monitor for WhatsApp policy compliance

- **Monitoring:**
  - Set up log rotation
  - Monitor server resources
  - Track success/failure rates
  - Regular health checks
