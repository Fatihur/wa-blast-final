# 📋 Template System Guide - File Matching

## 🎯 Template System untuk File Matching

Template system menyediakan template siap pakai untuk memudahkan pembuatan pesan blast dengan file matching.

## ✨ Fitur Template System

### 1. **Quick Template Selector**
- Dropdown dengan 6 template siap pakai
- One-click template loading
- Template preview modal
- Clear template function

### 2. **Template Categories**
- **Simple Document Delivery**: Template sederhana untuk pengiriman dokumen
- **Formal Business Document**: Template formal untuk bisnis
- **Marketing with File**: Template marketing dengan promosi
- **Document Ready Notification**: Notifikasi dokumen siap
- **Invoice/Receipt Delivery**: Template untuk invoice/receipt
- **Certificate Delivery**: Template untuk sertifikat

### 3. **Template Preview**
- Modal preview dengan sample data
- Formatted text preview
- Variable replacement preview
- One-click template selection

## 📋 Available Templates

### 1. **Simple Document Delivery**
```
Hello {{name}},

Your document *{{fileName}}* is ready for download.

Thank you for using our service!

Best regards,
{{company}}
```

### 2. **Formal Business Document**
```
Dear {{name}},

We are pleased to inform you that your requested document _{{fileName}}_ has been processed and is now available.

**Document Details:**
- File Name: {{fileName}}
- Processed Date: {{date}}
- Processing Time: {{time}}

Should you have any questions or require further assistance, please do not hesitate to contact us at {{number}}.

Sincerely,
{{company}} Team
```

### 3. **Marketing with File**
```
🎉 *Great news, {{name}}!* 🎉

Your personalized document {{fileName}} is now ready!

✅ *Premium Quality*
✅ *Fast Processing*
✅ *Secure Delivery*

~Limited time offer~ - Get additional services with 20% discount!

📞 Contact us: {{number}}
📧 Email: {{email}}
🏢 {{company}}

Valid until: {{date}}
```

### 4. **Document Ready Notification**
```
📄 *Document Ready Notification*

Hi {{name}},

Your document *{{fileName}}* has been successfully processed and is ready for pickup/download.

**Processing Summary:**
- Status: ✅ Complete
- Date: {{date}}
- Time: {{time}}

Please save this file securely. If you need any assistance, contact us at {{number}}.

Thank you,
{{company}}
```

### 5. **Invoice/Receipt Delivery**
```
💰 *Invoice/Receipt Delivery*

Dear {{name}},

Please find attached your invoice/receipt: *{{fileName}}*

**Transaction Details:**
- Document: {{fileName}}
- Issue Date: {{date}}
- Issue Time: {{time}}

For any billing inquiries, please contact:
📞 {{number}}
📧 {{email}}

Thank you for your business!
{{company}}
```

### 6. **Certificate Delivery**
```
🏆 *Certificate Delivery*

Congratulations {{name}}!

Your certificate *{{fileName}}* is now ready and attached to this message.

**Certificate Details:**
- Certificate: {{fileName}}
- Issue Date: {{date}}
- Issued by: {{company}}

This is an official document. Please keep it safe for your records.

For verification or inquiries:
📞 {{number}}
📧 {{email}}

Congratulations once again!
{{company}} Team
```

## 🎨 User Interface

### Template Selector:
```
┌─────────────────────────────────────────────────────────┐
│ Quick Templates: [Select a template...        ▼] [👁️ Preview] [🗑️ Clear] │
└─────────────────────────────────────────────────────────┘
```

### Template Options:
- Simple Document Delivery
- Formal Business Document  
- Marketing with File
- Document Ready Notification
- Invoice/Receipt Delivery
- Certificate Delivery

## 🔧 Cara Menggunakan

### 1. **Select Template dari Dropdown**
1. **Klik dropdown** "Quick Templates"
2. **Pilih template** yang diinginkan
3. **Template otomatis** dimuat ke message area
4. **Edit sesuai kebutuhan** jika diperlukan

### 2. **Preview Templates**
1. **Klik "Preview Templates"** untuk melihat semua template
2. **Modal preview** akan terbuka dengan sample data
3. **Klik "Use This Template"** untuk memilih
4. **Template otomatis** dimuat dan modal tertutup

### 3. **Clear Template**
1. **Klik "Clear"** untuk mengosongkan template
2. **Message area** akan dikosongkan
3. **Dropdown** akan direset

### 4. **Edit Template**
1. **Load template** yang diinginkan
2. **Edit text** sesuai kebutuhan
3. **Gunakan rich text toolbar** untuk formatting
4. **Tambah/ubah variables** sesuai data

## 🎯 Template Features

### 1. **Variable Support**
- **Standard Variables**: {{name}}, {{number}}, {{email}}, {{company}}
- **File Variables**: {{fileName}}
- **System Variables**: {{date}}, {{time}}
- **Custom Variables**: Dari Excel headers

### 2. **Rich Text Formatting**
- **Bold**: `*text*`
- **Italic**: `_text_`
- **Strikethrough**: `~text~`
- **Monospace**: ``` `text` ```

### 3. **Emoji Support**
- 🎉 Celebration emojis
- 📄 Document emojis
- ✅ Status emojis
- 📞 Contact emojis

### 4. **Professional Structure**
- Clear greeting
- Main message body
- Document details
- Contact information
- Professional closing

## 🔍 Technical Implementation

### JavaScript Functions:
```javascript
loadTemplate()           // Load selected template
clearTemplate()          // Clear template
previewTemplates()       // Show preview modal
selectTemplate(key)      // Select template from preview
```

### Template Object Structure:
```javascript
messageTemplates = {
    templateKey: {
        name: "Template Name",
        content: "Template content with {{variables}}"
    }
}
```

### CSS Classes:
```css
.template-preview        // Preview styling
#templateSelector        // Dropdown styling
#templatePreviewModal    // Modal styling
```

## 📊 Template Usage Examples

### Business Use Case:
```
Template: Formal Business Document
Variables: name="John Doe", fileName="contract.pdf", company="ABC Corp"
Result: Professional document delivery message
```

### Marketing Use Case:
```
Template: Marketing with File
Variables: name="Jane", fileName="brochure.pdf", company="XYZ Marketing"
Result: Promotional message with file attachment
```

### Certificate Use Case:
```
Template: Certificate Delivery
Variables: name="Student", fileName="certificate.pdf", company="University"
Result: Congratulatory certificate delivery message
```

## 🚀 Benefits

### For Users:
✅ **Quick Start**: Template siap pakai untuk berbagai kebutuhan  
✅ **Professional**: Template dengan struktur profesional  
✅ **Customizable**: Dapat diedit sesuai kebutuhan  
✅ **Preview**: Lihat hasil sebelum menggunakan  
✅ **Time Saving**: Tidak perlu menulis dari awal  

### For Business:
✅ **Consistency**: Pesan yang konsisten dan profesional  
✅ **Branding**: Template dapat disesuaikan dengan brand  
✅ **Efficiency**: Proses blast yang lebih cepat  
✅ **Quality**: Template yang sudah teruji  

## 🎉 Ready to Use

### File Matching Page:
- **URL**: http://localhost:3000/file-matching.html
- **Tab**: "Send Blast with File Matching"
- **Template Selector**: Dropdown dengan 6 template
- **Preview Modal**: Modal dengan preview semua template

### Features Available:
✅ **6 Ready Templates**: Berbagai kategori template  
✅ **Quick Selection**: Dropdown selector  
✅ **Preview Modal**: Preview dengan sample data  
✅ **One-Click Load**: Load template dengan satu klik  
✅ **Clear Function**: Reset template dengan mudah  
✅ **Rich Text Integration**: Compatible dengan rich text editor  

Template system membuat pembuatan pesan blast menjadi cepat dan profesional! 📋✨
