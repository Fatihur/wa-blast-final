# Fitur Storage Kontak & Variabel Dinamis

## 🗄️ Penyimpanan Kontak di Storage

### Fitur Storage:
- **Persistent Storage**: Kontak tersimpan permanen di file `data/contacts.json`
- **Auto Load**: Kontak otomatis dimuat saat aplikasi dibuka
- **Duplicate Prevention**: Mencegah duplikasi berdasarkan nomor telepon
- **Selection State**: Status pilihan kontak tersimpan
- **Header Preservation**: Header dari file Excel tersimpan untuk variabel

### Cara Kerja:
1. **Import Kontak**: File Excel/CSV diproses dan disimpan ke storage
2. **Auto Merge**: Kontak baru digabung dengan yang sudah ada
3. **Duplicate Check**: Nomor yang sama tidak akan diduplikasi
4. **Persistent Selection**: Status centang/tidak tersimpan

### API Endpoints Storage:
```
GET    /api/contacts           - Get all stored contacts
PUT    /api/contacts/:id       - Update contact
DELETE /api/contacts/:id       - Delete contact
PATCH  /api/contacts/:id/select - Update selection
PATCH  /api/contacts/select-all - Select/deselect all
DELETE /api/contacts           - Clear all contacts
GET    /api/contacts/export/json - Export as JSON
GET    /api/contacts/export/csv  - Export as CSV
GET    /api/contacts/headers    - Get available headers
```

## 🎯 Variabel Dinamis dari Header File

### Fitur Variabel Dinamis:
- **Auto Detection**: Sistem otomatis deteksi header dari file Excel/CSV
- **Dynamic Buttons**: Tombol variabel muncul otomatis sesuai header
- **Custom Variables**: Selain variabel standar, bisa gunakan header custom
- **Live Update**: Variabel update otomatis saat import file baru

### Variabel Standar:
- `{{name}}` - Nama kontak
- `{{number}}` - Nomor telepon
- `{{email}}` - Email
- `{{company}}` - Perusahaan
- `{{address}}` - Alamat
- `{{notes}}` - Catatan
- `{{date}}` - Tanggal hari ini
- `{{time}}` - Waktu sekarang

### Variabel Custom (dari Header Excel):
Contoh jika file Excel memiliki kolom:
- `position` → `{{position}}`
- `department` → `{{department}}`
- `city` → `{{city}}`
- `birthday` → `{{birthday}}`
- `hobby` → `{{hobby}}`
- `status` → `{{status}}`

## 🎨 Rich Text Editor untuk Blast Message

### Fitur Rich Text:
- **Formatting Toolbar**: Bold, Italic, Strikethrough, Monospace
- **Standard Variables**: Tombol untuk variabel umum
- **Dynamic Variables**: Tombol untuk variabel dari header file
- **Date/Time Variables**: Tombol untuk tanggal dan waktu
- **Live Preview**: Preview pesan dengan formatting

### Toolbar Sections:
1. **Formatting**: Bold, Italic, Strikethrough, Monospace
2. **Standard Variables**: name, number, email, company
3. **Custom Variables**: Dari header file yang diimport (warna kuning)
4. **Date/Time**: date, time

## 📝 Cara Menggunakan

### 1. Import File dengan Header Custom:
```excel
name        | number      | email           | position  | department | city
John Doe    | 08123456789 | john@email.com  | Manager   | Sales      | Jakarta
Jane Smith  | 08234567890 | jane@email.com  | Director  | Marketing  | Surabaya
```

### 2. Variabel Otomatis Tersedia:
Setelah import, tombol variabel akan muncul:
- Standard: {{name}}, {{number}}, {{email}}, {{company}}
- Custom: {{position}}, {{department}}, {{city}}
- Date/Time: {{date}}, {{time}}

### 3. Compose Blast Message:
```
Hello {{name}} from {{company}}!

We are excited to connect with a {{position}} 
in the {{department}} department.

Hope you are doing well in {{city}}!

Best regards,
Marketing Team

Date: {{date}}
```

### 4. Preview & Send:
- Klik "Preview Message" untuk melihat hasil
- Pilih kontak yang akan dikirimi
- Klik "Send Blast"

## 🔧 Manajemen Kontak

### Fitur Manajemen:
- **Refresh**: Reload kontak dari storage
- **Export JSON**: Download kontak dalam format JSON
- **Export CSV**: Download kontak dalam format CSV
- **Clear All**: Hapus semua kontak (dengan konfirmasi)
- **Individual Delete**: Hapus kontak satu per satu
- **Selection Management**: Pilih/tidak pilih kontak

### Tombol Manajemen:
```html
[Refresh] [Export JSON] [Export CSV] [Clear All]
```

## 📊 Statistik Storage

### Data yang Ditampilkan:
- **Total Contacts**: Jumlah total kontak tersimpan
- **Selected**: Jumlah kontak yang dipilih
- **Headers**: Daftar header/variabel yang tersedia
- **Last Updated**: Waktu terakhir update

### Format Storage (`data/contacts.json`):
```json
{
  "contacts": [
    {
      "id": 1640995200000,
      "name": "John Doe",
      "number": "628123456789",
      "email": "john@email.com",
      "position": "Manager",
      "department": "Sales",
      "city": "Jakarta",
      "selected": true,
      "importedAt": "2023-12-07T10:30:00.000Z"
    }
  ],
  "headers": ["name", "number", "email", "position", "department", "city"],
  "lastUpdated": "2023-12-07T10:30:00.000Z",
  "totalContacts": 1
}
```

## 🚀 Keuntungan Fitur Baru

### 1. Persistent Storage:
- Kontak tidak hilang saat restart aplikasi
- Tidak perlu import ulang setiap kali
- Status seleksi tersimpan

### 2. Variabel Dinamis:
- Fleksibilitas tinggi untuk personalisasi
- Otomatis sesuai dengan struktur data
- Tidak terbatas pada variabel standar

### 3. Rich Text Editor:
- User-friendly interface
- Visual feedback untuk formatting
- Quick access ke semua variabel

### 4. Manajemen Kontak:
- Export/import mudah
- Backup dan restore
- Cleaning dan maintenance

## 📱 Contoh Penggunaan

### Skenario: Campaign Marketing
1. **Import** file Excel dengan data customer
2. **Headers**: name, email, company, package, expiry_date
3. **Compose Message**:
```
Dear {{name}},

Your {{package}} package will expire on {{expiry_date}}.

Please renew your subscription to continue enjoying our services.

Contact us at: support@company.com

Best regards,
{{company}} Team
```

### Skenario: Event Invitation
1. **Import** file dengan data peserta
2. **Headers**: name, position, company, event_date, venue
3. **Compose Message**:
```
Hello {{name}},

You are invited to our exclusive event on {{event_date}} at {{venue}}.

As a {{position}} at {{company}}, we believe this event will be valuable for you.

Please confirm your attendance.

RSVP: events@company.com
```

## 🔒 Keamanan & Backup

### Backup Otomatis:
- Data tersimpan di `data/contacts.json`
- Backup manual via Export JSON/CSV
- Version control friendly (JSON format)

### Keamanan:
- Data tersimpan lokal (tidak di cloud)
- Akses terbatas pada server
- Dapat dienkripsi jika diperlukan

## 🛠️ Troubleshooting

### Kontak Tidak Muncul:
1. Check file `data/contacts.json` exists
2. Restart aplikasi
3. Klik tombol "Refresh"

### Variabel Tidak Muncul:
1. Pastikan file Excel memiliki header
2. Re-import file
3. Check console untuk error

### Storage Penuh:
1. Export kontak ke backup
2. Clear kontak lama
3. Import kontak baru

Fitur storage dan variabel dinamis ini memberikan fleksibilitas maksimal untuk campaign WhatsApp yang personal dan efektif! 🎯
