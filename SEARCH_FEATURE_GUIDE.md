# 🔍 Fitur Pencarian Kontak - WA Blast

## 📋 Overview
Fitur pencarian kontak memungkinkan Anda untuk mencari dan memfilter kontak yang telah diimpor berdasarkan berbagai kriteria seperti nama, nomor telepon, email, perusahaan, dan nama file.

## 🎯 Fitur Utama

### 1. **Pencarian Real-time**
- Pencarian dilakukan secara real-time saat Anda mengetik
- Tidak perlu menekan tombol search
- Hasil langsung diperbarui

### 2. **Multi-field Search**
Pencarian dapat dilakukan pada field berikut:
- **Nama Kontak** - Cari berdasarkan nama lengkap
- **Nomor Telepon** - Cari berdasarkan nomor WhatsApp
- **Email** - Cari berdasarkan alamat email
- **Perusahaan** - Cari berdasarkan nama perusahaan
- **Nama File** - Cari berdasarkan nama file yang diharapkan
- **File yang Cocok** - Cari berdasarkan file yang berhasil dicocokkan

### 3. **Filter Khusus**
- **"Search in matched files only"** - Hanya tampilkan kontak yang memiliki file cocok
- Berguna untuk melihat kontak yang siap untuk blast

### 4. **Highlight Search Terms**
- Kata kunci pencarian akan di-highlight dengan warna kuning
- Memudahkan identifikasi hasil pencarian

### 5. **Search Statistics**
- Menampilkan jumlah hasil pencarian
- Format: "Showing X of Y contacts"
- Indikator warna berdasarkan hasil

## 🚀 Cara Menggunakan

### Langkah 1: Akses Fitur Pencarian
1. Buka halaman **File Matching**
2. Klik tab **"File Matching"**
3. Klik tombol **"Preview Matching"** untuk memuat data kontak
4. Search box akan muncul otomatis setelah data dimuat

### Langkah 2: Melakukan Pencarian
1. Ketik kata kunci di search box
2. Hasil akan langsung difilter
3. Gunakan checkbox **"Search in matched files only"** jika diperlukan

### Langkah 3: Membersihkan Pencarian
- Klik tombol **X** di sebelah search box
- Atau hapus teks di search box
- Atau klik tombol **"Clear Search"** jika tidak ada hasil

## 📊 Contoh Penggunaan

### Pencarian Berdasarkan Nama
```
Ketik: "ALVIN"
Hasil: Menampilkan semua kontak dengan nama mengandung "ALVIN"
```

### Pencarian Berdasarkan Perusahaan
```
Ketik: "ELECTRICIAN"
Hasil: Menampilkan semua kontak dari perusahaan ELECTRICIAN
```

### Pencarian Berdasarkan Nomor
```
Ketik: "818"
Hasil: Menampilkan kontak dengan nomor mengandung "818"
```

### Pencarian File
```
Ketik: "certificate"
Hasil: Menampilkan kontak dengan file certificate
```

## 🎨 Interface Elements

### Search Box
- **Icon**: 🔍 (Search icon)
- **Placeholder**: "Search contacts by name, number, email, or company..."
- **Clear Button**: ❌ untuk membersihkan pencarian

### Filter Options
- **Checkbox**: "Search in matched files only"
- **Counter**: Menampilkan jumlah hasil

### Results Display
- **Highlighted Terms**: Kata kunci di-highlight dengan `<mark>`
- **Statistics Cards**: Total, Matched, Unmatched, Match Rate
- **Table**: Hasil pencarian dalam format tabel

## 🔧 Technical Details

### JavaScript Functions
- `searchContacts()` - Fungsi utama pencarian
- `clearContactSearch()` - Membersihkan pencarian
- `displayFilteredMatchingResults()` - Menampilkan hasil filter

### Data Storage
- `window.originalMatchingResults` - Menyimpan data asli
- `currentSearchTerm` - Menyimpan kata kunci saat ini

### Search Algorithm
1. Convert search term ke lowercase
2. Filter berdasarkan semua field
3. Apply filter "matched files only" jika dicentang
4. Update counter dan statistics
5. Re-render table dengan highlight

## 📈 Performance
- **Real-time**: Pencarian dilakukan saat mengetik
- **Client-side**: Tidak ada request ke server
- **Memory efficient**: Menggunakan array filtering
- **Responsive**: Bekerja di semua ukuran layar

## 🎯 Tips Penggunaan

### 1. **Pencarian Efektif**
- Gunakan kata kunci spesifik untuk hasil lebih akurat
- Coba berbagai kombinasi kata kunci
- Manfaatkan filter "matched files only"

### 2. **Troubleshooting**
- Jika search box tidak muncul, klik "Preview Matching" dulu
- Pastikan data kontak sudah diimpor
- Refresh halaman jika ada masalah

### 3. **Best Practices**
- Import kontak dengan data lengkap untuk pencarian optimal
- Gunakan nama file yang konsisten
- Manfaatkan field email dan company untuk pencarian lebih spesifik

## 🔄 Integration
Fitur pencarian terintegrasi dengan:
- **File Matching System** - Pencarian berdasarkan status matching
- **Contact Import** - Semua field yang diimpor bisa dicari
- **Statistics Display** - Counter dan percentage otomatis update

## 🚀 Future Enhancements
- Advanced filters (date range, file type)
- Save search queries
- Export filtered results
- Bulk actions on filtered contacts
