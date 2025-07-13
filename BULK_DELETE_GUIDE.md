# 🗑️ Bulk Delete Guide - Documents Management

## 🎯 Fitur Bulk Delete untuk Documents

Fitur bulk delete memungkinkan Anda untuk menghapus multiple files sekaligus dari documents folder dengan efisien dan aman.

## ✨ Fitur yang Tersedia

### 1. **Select All/Deselect All**
- Checkbox di header tabel untuk select/deselect semua files
- Tombol "Select All" yang toggle antara select dan deselect
- Visual indicator dengan indeterminate state untuk partial selection

### 2. **Individual Selection**
- Checkbox untuk setiap file
- Real-time counter untuk files yang dipilih
- Visual feedback untuk selection state

### 3. **Bulk Delete Selected**
- Tombol "Delete Selected" dengan counter
- Konfirmasi dialog sebelum delete
- Progress indicator saat proses delete
- Detailed result reporting

### 4. **Clear All Documents**
- Tombol "Clear All" untuk hapus semua files
- Double confirmation untuk safety
- Exclude .gitkeep file otomatis

## 🎨 User Interface

### Toolbar Documents:
```
[Select All] [Delete Selected (0)] [Clear All]
```

### Table Header:
```
[☐] File Name | Type | Size | Last Modified | Actions
```

### Selection States:
- **Empty**: ☐ (unchecked)
- **Selected**: ☑️ (checked)  
- **Partial**: ☑️ (indeterminate)

## 🔧 API Endpoints

### 1. Bulk Delete Selected Files
```http
POST /api/file-matching/documents/bulk-delete
Content-Type: application/json

{
  "filenames": ["file1.pdf", "file2.docx", "file3.xlsx"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk delete completed: 2 deleted, 1 failed",
  "summary": {
    "total": 3,
    "deleted": 2,
    "failed": 1,
    "successRate": 67
  },
  "results": [
    {
      "filename": "file1.pdf",
      "status": "deleted",
      "success": true
    },
    {
      "filename": "file2.docx",
      "status": "not_found",
      "success": false,
      "error": "File not found"
    },
    {
      "filename": "file3.xlsx",
      "status": "deleted",
      "success": true
    }
  ]
}
```

### 2. Clear All Documents
```http
DELETE /api/file-matching/documents
```

**Response:**
```json
{
  "success": true,
  "message": "All documents cleared: 5 files deleted",
  "summary": {
    "total": 5,
    "deleted": 5,
    "failed": 0,
    "results": [...]
  }
}
```

## 📋 Cara Menggunakan

### Via Web Interface:

#### 1. **Select Files**
1. Buka http://localhost:3000/file-matching.html
2. Go to "Documents Manager" tab
3. Centang checkbox files yang ingin dihapus
4. Atau klik "Select All" untuk pilih semua

#### 2. **Delete Selected**
1. Klik tombol "Delete Selected (X)" 
2. Konfirmasi dialog akan muncul
3. Klik "OK" untuk proceed
4. Lihat progress dan hasil delete

#### 3. **Clear All**
1. Klik tombol "Clear All"
2. Konfirmasi double dialog
3. Semua files akan dihapus (kecuali .gitkeep)

### Via API:

#### 1. **Get Documents List**
```javascript
const response = await fetch('/api/file-matching/documents');
const data = await response.json();
console.log(data.files); // Array of files
```

#### 2. **Bulk Delete**
```javascript
const filesToDelete = ['file1.pdf', 'file2.docx'];

const response = await fetch('/api/file-matching/documents/bulk-delete', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        filenames: filesToDelete
    })
});

const result = await response.json();
console.log(result.summary); // Delete summary
```

#### 3. **Clear All**
```javascript
const response = await fetch('/api/file-matching/documents', {
    method: 'DELETE'
});

const result = await response.json();
console.log(result.message); // Clear all result
```

## 🛡️ Safety Features

### 1. **Confirmation Dialogs**
- Single confirmation untuk bulk delete selected
- Double confirmation untuk clear all
- Clear warning messages

### 2. **File Protection**
- .gitkeep file otomatis di-exclude dari clear all
- System files protection
- Read-only file handling

### 3. **Error Handling**
- Individual file error tracking
- Partial success reporting
- Detailed error messages
- Graceful failure handling

### 4. **Progress Feedback**
- Loading indicators
- Real-time progress updates
- Success/failure notifications
- Detailed result summaries

## 📊 Status Codes

### Delete Status:
- **deleted**: File berhasil dihapus
- **not_found**: File tidak ditemukan
- **error**: Error saat menghapus file

### Response Codes:
- **200**: Success
- **400**: Bad request (invalid filenames)
- **404**: File not found
- **500**: Server error

## 🎯 Use Cases

### 1. **Cleanup Old Files**
```javascript
// Delete files older than 30 days
const oldFiles = files.filter(file => {
    const fileDate = new Date(file.lastModified);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return fileDate < thirtyDaysAgo;
});

await bulkDelete(oldFiles.map(f => f.fileName));
```

### 2. **Delete by File Type**
```javascript
// Delete all PDF files
const pdfFiles = files.filter(file => file.extension === '.pdf');
await bulkDelete(pdfFiles.map(f => f.fileName));
```

### 3. **Delete Large Files**
```javascript
// Delete files larger than 10MB
const largeFiles = files.filter(file => file.size > 10 * 1024 * 1024);
await bulkDelete(largeFiles.map(f => f.fileName));
```

### 4. **Maintenance Cleanup**
```javascript
// Clear all and start fresh
await clearAllDocuments();
```

## 🔍 Monitoring & Logging

### Server Logs:
```
[INFO] File deleted from documents folder: alice_contract.pdf
[INFO] File deleted from documents folder: charlie_presentation.pptx
[INFO] Bulk delete completed: 2 deleted, 0 failed
```

### Client Logs:
```javascript
console.log('Bulk delete result:', {
    total: 3,
    deleted: 2,
    failed: 1,
    successRate: 67
});
```

## ⚡ Performance

### Optimizations:
- **Async Operations**: Parallel file deletion
- **Batch Processing**: Efficient bulk operations
- **Memory Management**: Stream-based file handling
- **Error Isolation**: Individual file error handling

### Limits:
- **Max Files**: 100 files per bulk operation
- **Timeout**: 30 seconds per bulk operation
- **Retry**: No automatic retry (manual retry required)

## 🚀 Advanced Features

### 1. **Selective Bulk Delete**
```javascript
// Delete files matching pattern
const pattern = /^temp_/;
const tempFiles = files.filter(file => pattern.test(file.fileName));
await bulkDelete(tempFiles.map(f => f.fileName));
```

### 2. **Conditional Delete**
```javascript
// Delete files not used in any contact
const usedFiles = contacts.map(c => c.fileName);
const unusedFiles = files.filter(file => !usedFiles.includes(file.fileName));
await bulkDelete(unusedFiles.map(f => f.fileName));
```

### 3. **Backup Before Delete**
```javascript
// Backup files before delete
const filesToBackup = selectedFiles.map(f => f.fileName);
await backupFiles(filesToBackup);
await bulkDelete(filesToBackup);
```

## 🎉 Summary

Fitur bulk delete memberikan:
- ✅ **Efficient Management**: Delete multiple files sekaligus
- ✅ **Safety Features**: Confirmation dialogs dan error handling
- ✅ **User Friendly**: Intuitive UI dengan visual feedback
- ✅ **API Access**: Programmatic access untuk automation
- ✅ **Monitoring**: Detailed logging dan reporting
- ✅ **Performance**: Optimized untuk large file operations

Bulk delete adalah fitur essential untuk maintenance dan management documents folder yang efisien! 🗑️✨
