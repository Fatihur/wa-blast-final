# 📝 Rich Text Editor Guide - File Matching

## 🎯 Rich Text Editor untuk File Matching

Rich text editor memudahkan pembuatan template pesan dengan formatting dan variabel dinamis untuk file matching blast.

## ✨ Fitur Rich Text Editor

### 1. **Text Formatting Toolbar**
- **Bold**: `*text*` - Membuat teks tebal
- **Italic**: `_text_` - Membuat teks miring  
- **Strikethrough**: `~text~` - Membuat teks dicoret
- **Monospace**: ``` `text` ``` - Membuat teks monospace/code

### 2. **Variable Buttons**
#### **Standard Variables:**
- `{{name}}` - Nama kontak
- `{{number}}` - Nomor WhatsApp
- `{{email}}` - Email kontak
- `{{company}}` - Perusahaan kontak

#### **File-Specific Variables:**
- `{{fileName}}` - Nama file yang akan dikirim

#### **System Variables:**
- `{{date}}` - Tanggal hari ini
- `{{time}}` - Waktu saat ini

#### **Custom Variables:**
- Variabel dinamis dari header Excel yang diimport

### 3. **Live Preview**
- Preview real-time dengan sample data
- Formatting preview dengan HTML rendering
- Variable replacement preview

## 🎨 User Interface

### Toolbar Layout:
```
[B] [I] [S] [</>] | {{name}} {{number}} {{email}} {{company}} | {{fileName}} | {{custom}} | {{date}} {{time}}
```

### Message Area:
```
┌─────────────────────────────────────────────────────────┐
│ [Toolbar with formatting and variable buttons]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Type your message here...                              │
│                                                         │
│  Use toolbar buttons or type:                           │
│  *bold*, _italic_, ~strikethrough~, ```monospace```     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Preview Panel:
```
┌─────────────────────────────────────────────────────────┐
│ Message Preview:                                        │
│                                                         │
│ Hello **John Doe**, your document document.pdf         │
│ has been processed successfully!                        │
│                                                         │
│ Date: 13/07/2025                                        │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Cara Menggunakan

### 1. **Text Formatting**
1. **Select text** yang ingin diformat
2. **Klik button** formatting di toolbar
3. **Text akan otomatis** dibungkus dengan markup

**Contoh:**
```
Input: "Hello World"
Select: "World"
Click: Bold button
Result: "Hello *World*"
Preview: "Hello **World**"
```

### 2. **Insert Variables**
1. **Posisikan cursor** di tempat yang diinginkan
2. **Klik button variable** di toolbar
3. **Variable akan diinsert** di posisi cursor

**Contoh:**
```
Input: "Hello "
Click: {{name}} button
Result: "Hello {{name}}"
Preview: "Hello John Doe"
```

### 3. **Live Preview**
1. **Klik "Show Preview"** untuk melihat hasil
2. **Preview update otomatis** saat mengetik
3. **Klik "Hide Preview"** untuk menyembunyikan

### 4. **Manual Formatting**
Anda juga bisa mengetik markup secara manual:
```
*bold text*
_italic text_
~strikethrough text~
```monospace text```
{{variableName}}
```

## 📋 Template Examples

### 1. **Simple Template**
```
Hello {{name}},

Your document *{{fileName}}* is ready for download.

Best regards,
{{company}}
```

**Preview:**
```
Hello John Doe,

Your document **document.pdf** is ready for download.

Best regards,
ABC Corp
```

### 2. **Formal Template**
```
Dear {{name}},

We are pleased to inform you that your document _{{fileName}}_ has been processed successfully.

**Document Details:**
- File: {{fileName}}
- Date: {{date}}
- Time: {{time}}

Please contact us at {{email}} if you have any questions.

Sincerely,
{{company}}
```

### 3. **Marketing Template**
```
🎉 *Special Offer for {{name}}!* 🎉

Your personalized document {{fileName}} is now available!

~Limited time offer~ - Download now and get:
✅ Free consultation
✅ 24/7 support
✅ Premium features

Contact: {{number}}
Valid until: {{date}}
```

## 🎯 Advanced Features

### 1. **Dynamic Variables**
Saat import Excel dengan header custom, button variable otomatis ditambahkan:

**Excel Headers:** `name, number, email, company, fileName, address, notes`

**Generated Buttons:**
```
{{name}} {{number}} {{email}} {{company}} {{fileName}} {{address}} {{notes}}
```

### 2. **Variable Validation**
- Variables yang tidak ada di data akan ditampilkan sebagai placeholder
- Preview menunjukkan sample data untuk semua variables
- Error handling untuk variables yang tidak valid

### 3. **Responsive Design**
- Toolbar responsive untuk mobile devices
- Button size adjustment untuk layar kecil
- Touch-friendly interface

## 🔍 Technical Implementation

### JavaScript Functions:
```javascript
// Format selected text
formatFileText('bold')

// Insert variable at cursor
insertFileVariable('name')

// Toggle preview
toggleFilePreview()

// Update preview content
updateFilePreview()

// Update available variables
updateFileVariables(headers)
```

### CSS Classes:
```css
.btn-toolbar          // Toolbar container
.preview-content      // Preview area
.badge               // Variable display
.btn-outline-info    // Standard variables
.btn-outline-warning // File variables
.btn-outline-success // System variables
```

## 📊 Variable Processing

### Input Processing:
```
Template: "Hello {{name}}, your {{fileName}} is ready!"
Data: { name: "John", fileName: "report.pdf" }
Output: "Hello John, your report.pdf is ready!"
```

### Formatting Processing:
```
Input: "This is *important* and _emphasized_"
HTML: "This is <strong>important</strong> and <em>emphasized</em>"
WhatsApp: "This is *important* and _emphasized_"
```

## 🚀 Benefits

### For Users:
✅ **Easy Formatting**: Visual toolbar untuk formatting  
✅ **Variable Management**: One-click variable insertion  
✅ **Live Preview**: See hasil sebelum kirim  
✅ **Dynamic Variables**: Auto-detect dari Excel headers  
✅ **Mobile Friendly**: Responsive design  

### For Developers:
✅ **Modular Code**: Reusable functions  
✅ **Event Handling**: Proper event listeners  
✅ **Error Handling**: Graceful error management  
✅ **Performance**: Efficient DOM manipulation  

## 🎉 Ready to Use

### File Matching Page:
- **URL**: http://localhost:3000/file-matching.html
- **Tab**: "Send Blast with File Matching"
- **Rich Text Editor**: Fully functional dengan toolbar

### Features Available:
✅ **Text Formatting**: Bold, Italic, Strikethrough, Monospace  
✅ **Variable Insertion**: Standard, File, System, Custom variables  
✅ **Live Preview**: Real-time preview dengan sample data  
✅ **Form Integration**: Submit blast dengan formatted message  
✅ **Responsive Design**: Works on all devices  

Rich text editor membuat pembuatan template pesan menjadi mudah dan intuitif! 📝✨
