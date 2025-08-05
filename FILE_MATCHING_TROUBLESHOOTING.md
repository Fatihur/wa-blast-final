# 🔧 File Matching Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: "No contacts could be matched with files"

**Symptoms:**
- Blast fails with error message about no matched contacts
- All contacts show as "unmatched" in validation

**Causes & Solutions:**

1. **Missing fileName column in contacts**
   ```
   ❌ Contact data: { "name": "John", "number": "123456789" }
   ✅ Contact data: { "name": "John", "number": "123456789", "fileName": "john.pdf" }
   ```
   
2. **Wrong column name for file**
   - Supported column names: `fileName`, `namaFile`, `nama_file`, `file`
   - Make sure your Excel/CSV uses one of these column names

3. **Files not in documents folder**
   - Check if files exist in `./documents/` folder
   - Use test tool: `http://localhost:3000/test-file-matching.html`

### Issue 2: "File not found" or "File validation failed"

**Symptoms:**
- Some contacts match but files can't be read
- Error messages about missing or corrupted files

**Solutions:**

1. **Check file permissions**
   ```bash
   # Make sure files are readable
   chmod 644 documents/*
   ```

2. **Verify file integrity**
   - Files must be at least 10 bytes
   - Maximum size: 100MB for documents, 16MB for images
   - Files must not be corrupted

3. **Check file names**
   - No special characters that might cause path issues
   - File extensions must match actual file type

### Issue 3: "WhatsApp not connected" during blast

**Symptoms:**
- File matching works but blast fails immediately
- Error about WhatsApp connection

**Solutions:**

1. **Check WhatsApp connection**
   - Go to main page and verify WhatsApp is connected
   - Look for green "Connected" status

2. **Reconnect if needed**
   - Click "Disconnect" then "Connect" 
   - Scan QR code if prompted

### Issue 4: Files send but appear corrupted or empty

**Symptoms:**
- Messages send successfully but files are empty/corrupted
- Recipients can't open the files

**Solutions:**

1. **Check file size limits**
   - Documents: Max 100MB
   - Images: Max 16MB
   - Minimum: 10 bytes for documents, 100 bytes for images

2. **Verify file types**
   - Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
   - Images: JPG, JPEG, PNG, GIF, BMP, WEBP

3. **Test file integrity**
   - Try opening files manually before uploading
   - Re-upload corrupted files

## 🧪 Testing & Debugging

### Step 1: Use Test Tool
1. Open: `http://localhost:3000/test-file-matching.html`
2. Click "Test Documents Folder" - should show available files
3. Click "Test File Matching" - should show matching results
4. Check for any error messages

### Step 2: Check Server Logs
Look for these log entries:
```
[BLAST] Starting file matching process
[BLAST] File matching completed - matched: X, unmatched: Y
[BLAST] Processing contact 1/X
[WHATSAPP] Sending document: filename.pdf (123KB, application/pdf)
```

### Step 3: Manual Validation
```javascript
// Test in browser console
fetch('/api/file-matching/documents')
  .then(r => r.json())
  .then(data => console.log('Documents:', data));

// Test matching
fetch('/api/file-matching/test', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    contacts: [{name: 'Test', number: '123', fileName: 'test.pdf'}]
  })
}).then(r => r.json()).then(console.log);
```

## 📋 Checklist Before Sending Blast

### ✅ Pre-flight Checklist:

1. **Files Ready**
   - [ ] Files uploaded to documents folder
   - [ ] File names match contact data
   - [ ] Files are not corrupted
   - [ ] File sizes within limits

2. **Contacts Ready**
   - [ ] Contacts imported successfully
   - [ ] fileName column exists and populated
   - [ ] Phone numbers formatted correctly

3. **System Ready**
   - [ ] WhatsApp connected (green status)
   - [ ] Server running without errors
   - [ ] Test file matching passes

4. **Message Ready**
   - [ ] Message text entered
   - [ ] Variables tested (if used)
   - [ ] Delay settings configured

### ✅ Validation Steps:

1. **Run File Matching Test**
   ```
   http://localhost:3000/test-file-matching.html
   → Test File Matching → Should show matched contacts
   ```

2. **Check Validation Results**
   - Matched contacts should be > 0
   - Unmatched contacts should have clear reasons
   - File paths should exist and be readable

3. **Test Single Message First**
   - Send one test message with file
   - Verify recipient receives file correctly
   - Check file opens properly

## 🔍 Advanced Debugging

### Enable Detailed Logging
Add this to your contact data for debugging:
```json
{
  "name": "Debug User",
  "number": "628123456789", 
  "fileName": "test.pdf",
  "_debug": true
}
```

### Check File Matching Logic
The system tries these matching strategies:
1. Exact filename match: `test.pdf` = `test.pdf`
2. Name without extension: `test.pdf` = `test.docx`
3. Partial match: `test` matches `test_final.pdf`
4. Reverse partial: `test_final` matches `test.pdf`

### Common File Name Issues
```
❌ "test file.pdf" (spaces can cause issues)
❌ "tëst.pdf" (special characters)
❌ "test.PDF" (case sensitivity)
✅ "test.pdf" (simple, lowercase)
✅ "test_file.pdf" (underscores OK)
✅ "test-file.pdf" (hyphens OK)
```

## 📞 Support Commands

### Quick Diagnostic Commands:
```bash
# Check documents folder
ls -la documents/

# Check file permissions
ls -la documents/ | head -5

# Check disk space
df -h

# Check server logs
tail -f logs/app.log | grep -i "file\|blast"
```

### Browser Console Tests:
```javascript
// Test API endpoints
fetch('/api/file-matching/documents').then(r=>r.json()).then(console.log);
fetch('/api/contacts').then(r=>r.json()).then(d=>console.log(d.contacts.length));

// Check app state
console.log('App loaded:', !!window.fileMatchingApp);
console.log('Contacts:', window.fileMatchingApp?.contacts?.length);
```

## 🎯 Success Indicators

### ✅ Everything Working:
- Test tool shows matched contacts
- File validation passes
- WhatsApp status is "Connected"
- Blast progress shows files being sent
- Recipients receive files correctly
- Server logs show successful file transfers

### ❌ Something Wrong:
- No matched contacts in test
- File validation errors
- WhatsApp disconnected
- Blast fails immediately
- Empty/corrupted files received
- Error messages in server logs

## 📈 Performance Tips

1. **Optimize File Sizes**
   - Compress large PDFs
   - Resize images appropriately
   - Remove unnecessary files

2. **Batch Processing**
   - Test with small batches first
   - Increase delay for large files
   - Monitor server resources

3. **Error Recovery**
   - Use retry attempts (default: 2)
   - Check failed contacts in logs
   - Re-send to failed contacts only

Remember: Always test with a small batch first before sending to all contacts!
