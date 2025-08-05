# 📁 File Matching Guide - Kirim File Berbeda untuk Setiap Kontak

## 🎯 Konsep File Matching

File Matching adalah fitur yang memungkinkan Anda mengirim file yang berbeda-beda untuk setiap kontak berdasarkan nama file yang sudah ditentukan dalam data kontak.

### Cara Kerja:
1. **Upload Documents**: Upload semua file ke folder `documents/`
2. **Import Contacts**: Import Excel dengan kolom `fileName` yang berisi nama file untuk setiap kontak
3. **Auto Matching**: Sistem otomatis mencocokkan nama file dengan file yang ada
4. **Send Blast**: Kirim pesan dengan file yang berbeda untuk setiap kontak

## 📋 Template Excel untuk File Matching

### Struktur Template:
```
name        | number      | email           | company     | fileName
John Doe    | 08123456789 | john@email.com  | ABC Corp    | john_certificate.pdf
Jane Smith  | 08234567890 | jane@email.com  | XYZ Ltd     | jane_report.docx
Bob Johnson | 08345678901 | bob@email.com   | Tech Sol    | bob_invoice.pdf
```

### Kolom Wajib:
- **name**: Nama kontak
- **number**: Nomor WhatsApp
- **fileName**: Nama file yang akan dikirim (WAJIB untuk file matching)

### Kolom Opsional:
- **email**: Email kontak
- **company**: Perusahaan
- **position**: Jabatan
- **department**: Departemen
- **city**: Kota
- Dan kolom custom lainnya

## 🗂️ Manajemen Documents Folder

### Upload Files:
1. Buka tab **Documents Manager**
2. Klik **Choose Files** dan pilih multiple files
3. Klik **Upload Files**
4. File akan tersimpan di folder `documents/`

### Supported File Types:
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- **Images**: JPG, JPEG, PNG, GIF, BMP, WEBP
- **Size Limit**: 100MB per file

### File Management:
- **Preview**: Klik icon mata untuk preview file
- **Delete**: Klik icon trash untuk hapus file
- **Statistics**: Lihat total files dan ukuran

## 🔗 File Matching Process

### 1. Exact Match (Prioritas Tertinggi):
```
fileName di Excel: "john_certificate.pdf"
File di folder: "john_certificate.pdf"
Status: ✅ MATCHED
```

### 2. Name Without Extension:
```
fileName di Excel: "john_certificate"
File di folder: "john_certificate.pdf"
Status: ✅ MATCHED
```

### 3. Partial Match:
```
fileName di Excel: "john"
File di folder: "john_certificate.pdf"
Status: ✅ MATCHED
```

### 4. No Match:
```
fileName di Excel: "john_document.pdf"
File di folder: "jane_report.docx"
Status: ❌ UNMATCHED
```

## 📊 Preview File Matching

### Cara Preview:
1. Import kontak dengan kolom `fileName`
2. Upload files ke Documents folder
3. Buka tab **File Matching**
4. Klik **Preview Matching**

### Hasil Preview:
- **Contact Name**: Nama kontak
- **Number**: Nomor WhatsApp
- **Expected File**: Nama file yang diharapkan
- **Matched File**: File yang berhasil dicocokkan
- **Status**: Matched/Unmatched

### Statistics:
- **Total Contacts**: Jumlah total kontak
- **Matched**: Kontak yang berhasil dicocokkan dengan file
- **Unmatched**: Kontak yang tidak ada file-nya

## 🚀 Send Blast with Files

### Langkah-langkah:
1. **Pastikan Matching**: Preview matching terlebih dahulu
2. **Compose Message**: Tulis template pesan
3. **Set Parameters**: Atur delay dan retry attempts
4. **Send Blast**: Klik tombol send

### Template Message:
```
Hello {{name}} from {{company}}!

Please find your {{fileName}} attached.

Best regards,
Admin Team
```

### Available Variables:
- **Standard**: {{name}}, {{number}}, {{email}}, {{company}}
- **File**: {{fileName}} - nama file yang dikirim
- **Custom**: Sesuai header Excel yang diimport
- **Date/Time**: {{date}}, {{time}}

## 📱 Contoh Penggunaan

### Skenario 1: Kirim Sertifikat
```excel
name        | number      | fileName
John Doe    | 08123456789 | john_certificate.pdf
Jane Smith  | 08234567890 | jane_certificate.pdf
Bob Johnson | 08345678901 | bob_certificate.pdf
```

**Message Template:**
```
Congratulations {{name}}!

Your certificate is ready. Please find your {{fileName}} attached.

Thank you for participating in our program.
```

### Skenario 2: Kirim Invoice
```excel
name        | number      | company     | fileName
ABC Corp    | 08123456789 | ABC Corp    | invoice_001.pdf
XYZ Ltd     | 08234567890 | XYZ Ltd     | invoice_002.pdf
Tech Sol    | 08345678901 | Tech Sol    | invoice_003.pdf
```

**Message Template:**
```
Dear {{company}},

Your invoice for this month is ready.

Please find {{fileName}} attached for your records.

Payment due: 30 days from invoice date.
```

### Skenario 3: Kirim Report Personalized
```excel
name        | number      | department  | fileName
John Doe    | 08123456789 | Sales       | sales_report_john.xlsx
Jane Smith  | 08234567890 | Marketing   | marketing_report_jane.xlsx
Bob Johnson | 08345678901 | IT          | it_report_bob.xlsx
```

**Message Template:**
```
Hi {{name}},

Your monthly {{department}} report is ready.

Please review the attached {{fileName}} and let us know if you have any questions.

Best regards,
Management Team
```

## 🔧 API Endpoints

### Documents Management:
```
GET    /api/file-matching/documents           - List documents
POST   /api/file-matching/documents/upload    - Upload files
DELETE /api/file-matching/documents/:filename - Delete file
GET    /api/file-matching/documents/serve/:filename - Serve file
```

### File Matching:
```
POST   /api/file-matching/match               - Match contacts with files
POST   /api/file-matching/match-stored        - Match stored contacts
GET    /api/file-matching/preview             - Preview matching
GET    /api/file-matching/template            - Download template
```

### Blast with Files:
```
POST   /api/messages/blast-with-files         - Send blast with file matching
```

## 📂 File Structure

```
wa-blast/
├── documents/                    # Documents storage folder
│   ├── john_certificate.pdf
│   ├── jane_report.docx
│   ├── bob_invoice.pdf
│   └── .gitkeep
├── services/
│   └── fileMatchingService.js    # File matching logic
├── routes/
│   └── fileMatchingRoutes.js     # File matching API
├── public/
│   ├── file-matching.html        # File matching UI
│   └── file-matching.js          # Frontend logic
└── sample-contacts-with-files.xlsx # Sample template
```

## ⚠️ Troubleshooting

### 🧪 Quick Diagnostic Tool:
**Access:** `http://localhost:3000/test-file-matching.html`

This tool helps you:
- Test documents folder access
- Validate file matching logic
- Check stored contacts
- Debug blast validation

### File Tidak Terdeteksi:
1. Pastikan file ada di folder `documents/`
2. Check nama file sesuai dengan kolom `fileName`
3. Refresh documents list
4. Check file permissions
5. **NEW:** Use test tool to verify file detection

### Matching Gagal:
1. Periksa ejaan nama file
2. Pastikan ekstensi file benar
3. Coba gunakan nama tanpa ekstensi
4. Check case sensitivity
5. **NEW:** File validation now checks file integrity

### Upload Gagal:
1. Check ukuran file (max 200MB per file, 100MB for blast)
2. Pastikan format file didukung
3. Check koneksi internet
4. Restart server jika perlu
5. **NEW:** Enhanced error messages show specific issues

### Blast Gagal:
1. Pastikan WhatsApp terkoneksi
2. Check file masih ada di folder
3. Pastikan kontak valid
4. Check log untuk error detail
5. **NEW:** Pre-blast validation prevents common failures
6. **NEW:** Detailed progress tracking with file info

### 🔧 Enhanced Error Handling:
- File validation before sending (size, integrity, permissions)
- Automatic retry mechanisms for failed sends
- Detailed logging with file information
- Progress tracking shows current file being sent
- Comprehensive validation reports before blast

## 🎯 Best Practices

### 1. Naming Convention:
- Gunakan nama file yang konsisten
- Hindari spasi, gunakan underscore
- Include identifier unik (nama/ID)
- Contoh: `john_doe_certificate.pdf`

### 2. File Organization:
- Group files by type/category
- Use descriptive names
- Keep file sizes reasonable
- Regular cleanup unused files

### 3. Template Design:
- Always include `fileName` column
- Use clear, descriptive headers
- Test with small batch first
- Validate data before import

### 4. Message Template:
- Keep messages concise
- Use appropriate variables
- Include file context
- Add contact information

## 🚀 Advanced Features

### Batch Upload:
- Select multiple files at once
- Drag & drop support (future)
- Folder upload (future)
- Progress tracking

### Smart Matching:
- Fuzzy matching algorithm
- Multiple matching strategies
- Confidence scoring
- Manual override options

### File Validation:
- File type checking
- Size validation
- Virus scanning (future)
- Content verification

### Analytics:
- Matching success rate
- File usage statistics
- Delivery tracking
- Performance metrics

File Matching memberikan fleksibilitas maksimal untuk mengirim konten yang personal dan relevan untuk setiap kontak! 🎯
