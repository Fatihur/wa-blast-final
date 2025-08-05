# 🧪 Panduan Testing Fitur Pencarian Kontak

## 📋 Status Implementasi

### ✅ **Yang Sudah Ditambahkan:**

1. **HTML Elements** (di `public/index.html`):
   - Search box dengan ID `contactSearchInput`
   - Search count dengan ID `mainContactSearchCount`
   - Advanced search options
   - Event handlers yang benar

2. **JavaScript Functions** (di `public/app.js`):
   - `searchMainContacts()` - Fungsi pencarian utama ✅
   - `clearMainContactSearch()` - Reset pencarian ✅
   - `displayFilteredContacts()` - Tampilkan hasil filter ✅
   - `selectFilteredContacts()` - Pilih hasil filter ✅
   - `toggleAdvancedSearch()` - Toggle opsi advanced ✅

## 🔧 Langkah-langkah Testing

### Step 1: Akses Debug Page
1. Buka browser dan akses: `http://localhost:3000/debug-search.html`
2. Klik tombol **"Test Function Exists"** untuk memastikan semua fungsi ada
3. Klik tombol **"Test DOM Elements"** untuk memastikan semua element HTML ada
4. Klik tombol **"Test App Object"** untuk cek app object
5. Klik tombol **"Test Search Function"** untuk test fungsi pencarian

### Step 2: Test di Halaman Utama
1. Buka: `http://localhost:3000`
2. Klik tab **"Contacts"**
3. Import file kontak (gunakan `diverse-test-contacts.xlsx`)
4. Setelah import berhasil, search box akan muncul
5. Coba ketik di search box

### Step 3: Test Manual di Browser Console
Buka Developer Tools (F12) dan jalankan:

```javascript
// 1. Check if functions exist
console.log('Functions:', {
    searchMainContacts: typeof searchMainContacts,
    clearMainContactSearch: typeof clearMainContactSearch,
    displayFilteredContacts: typeof displayFilteredContacts
});

// 2. Check DOM elements
console.log('Elements:', {
    searchInput: !!document.getElementById('contactSearchInput'),
    searchCount: !!document.getElementById('mainContactSearchCount'),
    tableBody: !!document.getElementById('contactsTableBody')
});

// 3. Check app object
console.log('App:', {
    exists: !!window.app,
    contacts: window.app ? window.app.contacts.length : 'No app'
});

// 4. Manual search test
if (window.app && window.app.contacts.length > 0) {
    const searchInput = document.getElementById('contactSearchInput');
    if (searchInput) {
        searchInput.value = 'test';
        searchMainContacts();
        console.log('Search executed');
    }
}
```

## 🐛 Troubleshooting

### Masalah 1: Fungsi Tidak Ditemukan
**Gejala**: `searchMainContacts is not defined`

**Solusi**:
```javascript
// Check di console
console.log('Search function:', typeof searchMainContacts);

// Jika undefined, reload halaman atau check app.js
```

### Masalah 2: Search Box Tidak Muncul
**Gejala**: Search box tidak terlihat di halaman Contacts

**Solusi**:
1. Pastikan kontak sudah diimpor
2. Check element di console:
```javascript
console.log('Search input:', document.getElementById('contactSearchInput'));
```

### Masalah 3: Search Tidak Berfungsi
**Gejala**: Ketik di search box tapi tidak ada hasil

**Solusi**:
1. Check app object:
```javascript
console.log('App contacts:', window.app ? window.app.contacts : 'No app');
```

2. Manual test:
```javascript
// Set search term
document.getElementById('contactSearchInput').value = 'test';
// Call search function
searchMainContacts();
```

### Masalah 4: Error di Console
**Gejala**: Ada error JavaScript di console

**Solusi**:
1. Buka Developer Tools (F12)
2. Check tab Console untuk error messages
3. Refresh halaman (Ctrl+F5)
4. Test di debug page: `http://localhost:3000/debug-search.html`

## 📝 Test Cases

### Test Case 1: Basic Search
1. Import kontak dengan data beragam
2. Ketik "ELECTRICIAN" di search box
3. **Expected**: Hanya kontak dengan company "ELECTRICIAN" yang muncul
4. **Expected**: Search count menunjukkan "Showing X of Y contacts"

### Test Case 2: Name Search
1. Ketik "ALVIN" di search box
2. **Expected**: Kontak dengan nama "ALVIN" muncul dengan highlight
3. **Expected**: Nama "ALVIN" di-highlight dengan warna kuning

### Test Case 3: Number Search
1. Ketik "818" di search box
2. **Expected**: Kontak dengan nomor mengandung "818" muncul
3. **Expected**: Nomor di-highlight

### Test Case 4: Clear Search
1. Setelah search aktif, klik tombol X (clear)
2. **Expected**: Search box kosong
3. **Expected**: Semua kontak muncul kembali
4. **Expected**: Search count kembali ke "X contacts total"

### Test Case 5: Advanced Filters
1. Centang "Show selected contacts only"
2. **Expected**: Hanya kontak terpilih yang muncul
3. Centang "Show contacts with groups only"
4. **Expected**: Hanya kontak yang punya grup yang muncul

### Test Case 6: Group Filter
1. Pilih grup dari dropdown "Filter by Group"
2. **Expected**: Hanya kontak dari grup tersebut yang muncul
3. Kombinasi dengan text search
4. **Expected**: Filter grup + text search bekerja bersamaan

## 🎯 Expected Results

### ✅ **Hasil yang Diharapkan:**

1. **Search Box Muncul**: Setelah import kontak
2. **Real-time Search**: Hasil langsung saat mengetik
3. **Multi-field Search**: Cari di nama, nomor, email, company
4. **Highlight Terms**: Kata kunci di-highlight kuning
5. **Search Count**: Menampilkan "Showing X of Y contacts"
6. **Clear Function**: Tombol X membersihkan pencarian
7. **Advanced Options**: Checkbox filters berfungsi
8. **Group Filter**: Dropdown grup berfungsi
9. **No Results**: Pesan "No contacts found" jika tidak ada hasil
10. **Bulk Actions**: "Select Filtered" berfungsi

## 🚀 Quick Test Commands

### Browser Console Quick Tests:
```javascript
// Quick function check
typeof searchMainContacts === 'function' ? '✅ Function exists' : '❌ Function missing'

// Quick element check
document.getElementById('contactSearchInput') ? '✅ Search box exists' : '❌ Search box missing'

// Quick app check
window.app && window.app.contacts ? `✅ App has ${window.app.contacts.length} contacts` : '❌ No app or contacts'

// Quick search test
(() => {
    const input = document.getElementById('contactSearchInput');
    if (input && typeof searchMainContacts === 'function') {
        input.value = 'test';
        searchMainContacts();
        return '✅ Search test executed';
    }
    return '❌ Cannot execute search test';
})()
```

## 📞 Support

Jika masalah masih berlanjut:

1. **Check Server**: Pastikan server berjalan di port 3000
2. **Clear Cache**: Refresh dengan Ctrl+F5
3. **Check Console**: Lihat error di Developer Tools
4. **Test Debug Page**: Gunakan `debug-search.html`
5. **Manual Import**: Import `diverse-test-contacts.xlsx`

## 📊 Test Data

Gunakan file test yang sudah disediakan:
- `diverse-test-contacts.xlsx` - 12 kontak dengan data beragam
- `test-search-simple.html` - Halaman test mandiri
- `debug-search.html` - Tool debug untuk troubleshooting
