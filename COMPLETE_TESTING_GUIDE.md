# 🧪 Complete File Matching & Dialog Testing Guide

## 🎯 Objective
Test both the dialog confirmation issue and message sending functionality in the file matching blast system.

## 📋 Prerequisites
- ✅ Server running on port 3000
- ✅ 110 files available in documents folder
- ✅ API endpoints functioning
- ✅ Test data prepared

## 🔧 Step-by-Step Testing Process

### Phase 1: API & Backend Testing

#### Step 1.1: Test API Endpoints
```bash
node test-api-endpoints.js
```

**Expected Results:**
```
✅ Documents endpoint: 200 SUCCESS - Files found: 110
✅ Contacts endpoint: 200 SUCCESS - Contacts found: X
✅ Validation endpoint: 200 SUCCESS - Matched: 3, Unmatched: 1
✅ WhatsApp status: DISCONNECTED/CONNECTED
```

#### Step 1.2: Verify File Matching Logic
The validation test should show:
- ✅ ALVIN HOSTIADI SAPUTRA → KIS BPJS Kesehatan - ALVIN HOSTIADI SAPUTRA.pdf
- ✅ CANDRA ADE PRASETYA → KIS BPJS Kesehatan - CANDRA ADE PRASETYA.pdf  
- ✅ DENI SUDIARJO → KIS BPJS Kesehatan - DENI SUDIARJO.pdf
- ❌ Test User No File → File "nonexistent.pdf" not found

### Phase 2: Frontend Dialog Testing

#### Step 2.1: Test SweetAlert2 Loading
1. **Open**: `http://localhost:3000/test-dialog.html`
2. **Click**: "Check SweetAlert2"
3. **Expected**: `✅ Swal available: true`
4. **Click**: "Test Basic Dialog"
5. **Expected**: SweetAlert2 dialog appears
6. **Click**: "Test File Matching Dialog"
7. **Expected**: File matching confirmation dialog appears

#### Step 2.2: Test File Matching Page Dialog
1. **Open**: `http://localhost:3000/file-matching.html`
2. **Open Browser Console** (F12)
3. **Click**: "Test Dialog" button
4. **Expected Console Output**:
   ```
   🧪 Testing validation dialog...
   🔍 Checking SweetAlert2 availability...
   Swal available: true
   🔔 Testing basic SweetAlert2...
   🔔 Testing showFileMatchingConfirmation with mock data...
   ✅ Test result: true/false
   ```
5. **Expected**: Dialog appears with file matching summary

### Phase 3: Full Integration Testing

#### Step 3.1: Import Test Contacts
1. **Use file**: `test-contacts-with-files.csv`
2. **Go to**: Contacts tab → Import
3. **Upload**: test-contacts-with-files.csv
4. **Expected**: 6 contacts imported with fileName column

#### Step 3.2: Test Full Validation Flow
1. **Go to**: File Matching tab
2. **Click**: "Test Full Flow" button
3. **Expected Console Output**:
   ```
   🧪 Testing full validation flow...
   📤 Testing validation API with current contacts...
   🔍 Starting file matching validation...
   📤 Sending validation request with contacts: 6
   📥 Validation response: {...}
   📊 Validation results: {matched: 5, unmatched: 1}
   🔔 Showing confirmation dialog...
   ```
4. **Expected**: Dialog shows 5 matched, 1 unmatched

#### Step 3.3: Test Actual Blast Submission
1. **Enter message**: "Test message with file attachment"
2. **Set delay**: 2000ms
3. **Click**: "Send Blast with Files"
4. **Expected Console Output**:
   ```
   🚀 handleBlastSubmission called!
   📝 Form data: {...}
   ✅ Basic validation passed, proceeding to file matching validation...
   🔍 Starting file matching validation...
   🔔 Showing confirmation dialog...
   ```
5. **Expected**: Confirmation dialog appears
6. **Click**: "Send to X contacts" (if you want to test actual sending)

### Phase 4: Message Sending Testing

#### Step 4.1: WhatsApp Connection (Optional)
1. **Go to**: Main page
2. **Connect WhatsApp** if you want to test actual sending
3. **Scan QR code**
4. **Verify**: Green "Connected" status

#### Step 4.2: Test Message Sending (Careful!)
⚠️ **WARNING**: This will send actual messages!

1. **Use small test batch**: Only 1-2 contacts
2. **Confirm dialog**: Click "Send to X contacts"
3. **Monitor console** for sending progress:
   ```
   [BLAST] Processing contact 1/X - fileName: document.pdf (123KB)
   [WHATSAPP] Sending document: document.pdf (123KB, application/pdf)
   ```
4. **Check recipient**: Verify file received correctly

## 🔍 Debugging Checklist

### Dialog Not Appearing Issues:

#### Check 1: SweetAlert2 Loading
```javascript
// Browser console
console.log('Swal available:', typeof Swal !== 'undefined');
console.log('Swal.fire available:', typeof Swal?.fire === 'function');
```

#### Check 2: Form Submission
```javascript
// Should see in console when clicking "Send Blast with Files"
🚀 handleBlastSubmission called!
📝 Form data: {...}
```

#### Check 3: Validation API
```javascript
// Should see successful API response
📥 Validation response: {success: true, matched: [...], unmatched: [...]}
```

#### Check 4: Dialog Function Call
```javascript
// Should see dialog function being called
🔔 showFileMatchingConfirmation called with: {...}
🔔 Calling Swal.fire...
```

### Message Sending Issues:

#### Check 1: File Matching
- Ensure contacts have `fileName` column
- Verify files exist in documents folder
- Check file permissions and integrity

#### Check 2: WhatsApp Connection
- Verify WhatsApp is connected
- Check QR code scan status
- Test with simple text message first

#### Check 3: File Validation
- Check file sizes (max 100MB documents, 16MB images)
- Verify file types are supported
- Ensure files are not corrupted

## 🎯 Success Criteria

### ✅ Dialog Working Correctly:
1. SweetAlert2 loads successfully
2. Test Dialog button shows confirmation dialog
3. Form submission triggers validation
4. Validation API returns matched/unmatched contacts
5. Confirmation dialog appears with summary
6. User can confirm/cancel blast

### ✅ Message Sending Working Correctly:
1. File matching correctly identifies files
2. Validation passes for matched contacts
3. WhatsApp connection is stable
4. Files attach correctly to messages
5. Messages deliver successfully
6. Recipients receive files properly

## 🚨 Common Issues & Solutions

### Issue 1: "SweetAlert2 not loaded"
**Solution**: Check internet connection, try alternative CDN, or download locally

### Issue 2: "No contacts matched"
**Solution**: Verify fileName column exists and matches actual files

### Issue 3: "Validation API fails"
**Solution**: Check server logs, verify documents folder permissions

### Issue 4: "Files not attaching"
**Solution**: Check file sizes, permissions, and WhatsApp connection

### Issue 5: "Dialog appears but sending fails"
**Solution**: Check WhatsApp connection, file validation, and server logs

## 📞 Support Commands

### Browser Console Quick Tests:
```javascript
// Test SweetAlert2
typeof Swal !== 'undefined' ? 'SweetAlert2 OK' : 'SweetAlert2 MISSING'

// Test app object
window.fileMatchingApp ? 'App OK' : 'App MISSING'

// Test validation function
fileMatchingApp.testValidation()

// Test full flow
fileMatchingApp.testFullValidationFlow()
```

### Server-side Tests:
```bash
# Test API endpoints
node test-api-endpoints.js

# Check server logs
tail -f logs/app.log

# Check documents folder
ls -la documents/ | head -10
```

## 🎉 Expected Final Result

After completing all tests:
1. ✅ Dialog confirmation appears reliably
2. ✅ File matching works correctly
3. ✅ Messages send with file attachments
4. ✅ Recipients receive files properly
5. ✅ System handles errors gracefully
6. ✅ Progress tracking works correctly

The file matching blast system should be fully functional with proper confirmation dialogs and reliable message delivery with file attachments.
