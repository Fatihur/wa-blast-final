# 🔍 Fitur Pencarian Kontak Utama - WA Blast

## 📋 Overview
Fitur pencarian kontak utama memungkinkan Anda untuk mencari, memfilter, dan mengelola kontak yang telah diimpor dengan berbagai kriteria pencarian yang canggih.

## 🎯 Fitur Utama

### 1. **🔍 Pencarian Real-time**
- Pencarian langsung saat mengetik
- Tidak perlu menekan tombol search
- Hasil langsung diperbarui dengan highlighting

### 2. **🎯 Multi-field Search**
Pencarian dapat dilakukan pada field berikut:
- **Nama Kontak** - Cari berdasarkan nama lengkap
- **Nomor Telepon** - Cari berdasarkan nomor WhatsApp
- **Email** - Cari berdasarkan alamat email
- **Perusahaan** - Cari berdasarkan nama perusahaan
- **Custom Fields** - Cari berdasarkan field tambahan yang diimpor

### 3. **🔧 Filter Lanjutan**
- **Filter by Group** - Filter berdasarkan grup tertentu
- **Selected Only** - Hanya tampilkan kontak yang dipilih
- **With Groups Only** - Hanya tampilkan kontak yang memiliki grup
- **Advanced Options** - Opsi pencarian lanjutan yang dapat disembunyikan

### 4. **💡 Highlight Search Terms**
- Kata kunci pencarian di-highlight dengan warna kuning
- Memudahkan identifikasi hasil pencarian
- Berlaku untuk semua field yang dicari

### 5. **📊 Search Statistics**
- Counter hasil pencarian real-time
- Format: "Showing X of Y contacts"
- Indikator warna berdasarkan hasil

### 6. **⚡ Bulk Actions pada Hasil Filter**
- **Select Filtered** - Pilih semua kontak hasil filter
- **Select All/None** - Pilih semua atau tidak ada
- **Add to Group** - Tambahkan kontak terpilih ke grup

## 🚀 Cara Menggunakan

### Langkah 1: Akses Fitur Pencarian
1. Buka halaman utama WA Blast
2. Klik tab **"Contacts"**
3. Import kontak jika belum ada
4. Search box akan muncul otomatis setelah ada kontak

### Langkah 2: Pencarian Dasar
1. Ketik kata kunci di search box
2. Hasil akan langsung difilter
3. Kata kunci akan di-highlight pada hasil

### Langkah 3: Filter Berdasarkan Grup
1. Pilih grup dari dropdown "Filter by Group"
2. Kombinasikan dengan pencarian teks jika diperlukan

### Langkah 4: Menggunakan Advanced Options
1. Klik tombol **"Advanced"** untuk membuka opsi lanjutan
2. Centang **"Show selected contacts only"** untuk melihat kontak terpilih
3. Centang **"Show contacts with groups only"** untuk melihat kontak yang memiliki grup

### Langkah 5: Bulk Actions
1. Gunakan **"Select Filtered"** untuk memilih semua hasil pencarian
2. Klik **"Add Selected to Group"** untuk menambahkan ke grup
3. Gunakan **"Select All"** atau **"Select None"** untuk kontrol cepat

## 📊 Contoh Penggunaan

### Pencarian Berdasarkan Nama
```
Ketik: "John"
Hasil: Menampilkan semua kontak dengan nama mengandung "John"
Highlight: "John" akan di-highlight dengan warna kuning
```

### Pencarian Berdasarkan Perusahaan
```
Ketik: "ELECTRICIAN"
Hasil: Menampilkan semua kontak dari perusahaan ELECTRICIAN
```

### Kombinasi Filter
```
1. Ketik: "ALVIN" di search box
2. Pilih: "ELECTRICIAN" di filter grup
3. Centang: "Show selected contacts only"
Hasil: Kontak ALVIN yang terpilih dan ada di grup ELECTRICIAN
```

### Pencarian Custom Field
```
Ketik: "Skill 3"
Hasil: Menampilkan kontak yang memiliki "Skill 3" di field manapun
```

## 🎨 Interface Elements

### Search Box
- **Icon**: 🔍 (Search icon)
- **Placeholder**: "Search by name, number, email, or company..."
- **Clear Button**: ❌ untuk membersihkan pencarian
- **Counter**: Menampilkan jumlah hasil di bawah search box

### Filter Options
- **Group Dropdown**: Filter berdasarkan grup
- **Advanced Checkbox**: Opsi pencarian lanjutan
- **Toggle Button**: Tampilkan/sembunyikan opsi advanced

### Bulk Actions
- **Select Filtered**: Pilih semua hasil filter
- **Select All/None**: Kontrol seleksi cepat
- **Add to Group**: Tambahkan kontak terpilih ke grup

## 🔧 Technical Features

### JavaScript Functions
- `searchMainContacts()` - Fungsi utama pencarian
- `clearMainContactSearch()` - Membersihkan pencarian
- `displayFilteredContacts()` - Menampilkan hasil filter
- `selectFilteredContacts()` - Pilih semua hasil filter
- `toggleAdvancedSearch()` - Toggle opsi advanced

### Search Algorithm
1. Convert search term ke lowercase
2. Filter berdasarkan semua field (nama, nomor, email, company, custom fields)
3. Apply filter grup jika dipilih
4. Apply filter selected only jika dicentang
5. Apply filter with groups only jika dicentang
6. Update counter dan statistics
7. Re-render table dengan highlight

### Performance Optimization
- **Client-side filtering**: Tidak ada request ke server
- **Real-time search**: Pencarian saat mengetik
- **Memory efficient**: Menggunakan array filtering
- **Responsive design**: Bekerja di semua ukuran layar

## 📈 Advanced Features

### 1. **Custom Field Search**
- Otomatis mencari di semua field yang diimpor
- Tidak terbatas pada field standar
- Mendukung field dinamis dari Excel/CSV

### 2. **Kombinasi Filter**
- Pencarian teks + filter grup
- Pencarian teks + selected only
- Semua filter dapat dikombinasikan

### 3. **Bulk Operations**
- Select filtered contacts untuk operasi massal
- Integrasi dengan sistem grup
- Update real-time pada UI

## 🎯 Tips Penggunaan

### 1. **Pencarian Efektif**
- Gunakan kata kunci spesifik untuk hasil lebih akurat
- Kombinasikan pencarian teks dengan filter grup
- Manfaatkan advanced options untuk filter lebih detail

### 2. **Bulk Operations**
- Gunakan "Select Filtered" untuk operasi massal pada hasil pencarian
- Kombinasikan dengan filter grup untuk manajemen kontak yang efisien

### 3. **Troubleshooting**
- Jika search box tidak muncul, pastikan kontak sudah diimpor
- Refresh halaman jika ada masalah dengan pencarian
- Gunakan "Clear Search" untuk reset semua filter

## 🔄 Integration

Fitur pencarian terintegrasi dengan:
- **Contact Import System** - Semua field yang diimpor bisa dicari
- **Group Management** - Filter dan bulk operations dengan grup
- **Bulk Actions** - Select filtered contacts untuk operasi massal
- **Statistics Display** - Counter dan percentage otomatis update

## 🚀 Future Enhancements
- Save search queries
- Advanced date filters
- Export filtered results
- Search history
- Regex search support
- Column-specific search
