# 🔧 Troubleshooting Fitur Pencarian Kontak

## 📋 Status Implementasi

### ✅ Yang Sudah Ditambahkan:

1. **HTML Elements** (di `public/index.html`):
   - Search box dengan ID `contactSearchInput`
   - Clear button dengan onclick `clearMainContactSearch()`
   - Search count dengan ID `mainContactSearchCount`
   - Advanced search options dengan checkbox
   - Proper event handlers (`onkeyup="searchMainContacts()"`)

2. **JavaScript Functions** (di `public/app.js`):
   - `searchMainContacts()` - Fungsi pencarian utama
   - `clearMainContactSearch()` - Reset pencarian
   - `displayFilteredContacts()` - Tampilkan hasil filter
   - `selectFilteredContacts()` - Pilih hasil filter
   - `toggleAdvancedSearch()` - Toggle opsi advanced

3. **Integration**:
   - Event listeners untuk checkbox
   - Update search count otomatis
   - Highlight search terms
   - Multi-field search (name, number, email, company, custom fields)

## 🔍 Cara Test Fitur Pencarian

### Method 1: Test Page
1. Buka `http://localhost:3000/test-search-simple.html`
2. Klik "Load Test Data"
3. Coba ketik di search box
4. Lihat hasil di tabel dan debug info

### Method 2: Main Application
1. Buka `http://localhost:3000`
2. Go to "Contacts" tab
3. Import file Excel dengan kontak (gunakan `diverse-test-contacts.xlsx`)
4. Coba search box yang muncul di atas tabel

### Method 3: Browser Console Test
```javascript
// Test di browser console
console.log('Testing search functions...');
console.log('searchMainContacts:', typeof searchMainContacts);
console.log('clearMainContactSearch:', typeof clearMainContactSearch);
console.log('displayFilteredContacts:', typeof displayFilteredContacts);

// Test dengan data mock
window.app = {
    contacts: [
        { id: 1, name: 'John Doe', number: '123', email: 'john@test.com', company: 'Test Corp' }
    ]
};

// Test search
document.getElementById('contactSearchInput').value = 'John';
searchMainContacts();
```

## 🐛 Kemungkinan Masalah & Solusi

### 1. **Search Box Tidak Muncul**
**Gejala**: Search box tidak terlihat di halaman Contacts

**Penyebab**:
- Kontak belum diimpor
- CSS/Bootstrap tidak load
- HTML structure bermasalah

**Solusi**:
```javascript
// Check di browser console
console.log('Search input:', document.getElementById('contactSearchInput'));
console.log('Contacts count:', window.app ? window.app.contacts.length : 'No app');
```

### 2. **Fungsi Search Tidak Berfungsi**
**Gejala**: Ketik di search box tapi tidak ada hasil

**Penyebab**:
- JavaScript error
- Function tidak terdefinisi
- Event handler tidak terpasang

**Solusi**:
```javascript
// Check di browser console
console.log('Search function:', typeof searchMainContacts);
console.log('App object:', window.app);
console.log('Contacts:', window.app ? window.app.contacts : 'No contacts');

// Manual test
searchMainContacts();
```

### 3. **Search Results Tidak Update**
**Gejala**: Search berjalan tapi tabel tidak berubah

**Penyebab**:
- displayFilteredContacts() error
- DOM elements tidak ditemukan
- Event listeners tidak terpasang

**Solusi**:
```javascript
// Check elements
console.log('Table body:', document.getElementById('contactsTableBody'));
console.log('Table:', document.getElementById('contactsTable'));

// Manual display test
displayFilteredContacts([{id: 1, name: 'Test', number: '123'}]);
```

### 4. **Highlight Tidak Berfungsi**
**Gejala**: Search berjalan tapi tidak ada highlight

**Penyebab**:
- CSS untuk `<mark>` tidak ada
- highlightText function error

**Solusi**:
```css
/* Tambahkan CSS jika perlu */
mark {
    background-color: yellow;
    padding: 0 2px;
}
```

### 5. **Advanced Options Tidak Muncul**
**Gejala**: Tombol Advanced tidak menampilkan opsi

**Penyebab**:
- toggleAdvancedSearch() error
- CSS display issue

**Solusi**:
```javascript
// Manual toggle
const advancedOptions = document.getElementById('advancedSearchOptions');
advancedOptions.style.display = 'block';
```

## 🔧 Debug Commands

### Browser Console Commands:
```javascript
// 1. Check if functions exist
console.log('Functions check:', {
    searchMainContacts: typeof searchMainContacts,
    clearMainContactSearch: typeof clearMainContactSearch,
    displayFilteredContacts: typeof displayFilteredContacts
});

// 2. Check DOM elements
console.log('DOM elements:', {
    searchInput: !!document.getElementById('contactSearchInput'),
    searchCount: !!document.getElementById('mainContactSearchCount'),
    tableBody: !!document.getElementById('contactsTableBody'),
    table: !!document.getElementById('contactsTable')
});

// 3. Check app state
console.log('App state:', {
    app: !!window.app,
    contacts: window.app ? window.app.contacts.length : 'No app',
    sampleContact: window.app ? window.app.contacts[0] : 'No contacts'
});

// 4. Manual search test
if (window.app && window.app.contacts.length > 0) {
    document.getElementById('contactSearchInput').value = 'test';
    searchMainContacts();
    console.log('Manual search executed');
}

// 5. Check search count
const searchCount = document.getElementById('mainContactSearchCount');
console.log('Search count element:', searchCount);
console.log('Search count text:', searchCount ? searchCount.textContent : 'Not found');
```

## 📝 Checklist Troubleshooting

### Pre-requisites:
- [ ] Server berjalan di port 3000
- [ ] Browser dapat akses http://localhost:3000
- [ ] Bootstrap CSS loaded
- [ ] FontAwesome icons loaded
- [ ] app.js loaded tanpa error

### HTML Elements:
- [ ] `contactSearchInput` element exists
- [ ] `mainContactSearchCount` element exists
- [ ] `contactsTableBody` element exists
- [ ] `contactsTable` element exists
- [ ] Event handlers terpasang (`onkeyup`, `onclick`)

### JavaScript Functions:
- [ ] `searchMainContacts` function defined
- [ ] `clearMainContactSearch` function defined
- [ ] `displayFilteredContacts` function defined
- [ ] `window.app` object exists
- [ ] `window.app.contacts` array exists

### Functionality:
- [ ] Search box muncul setelah import kontak
- [ ] Ketik di search box memicu pencarian
- [ ] Hasil pencarian ditampilkan di tabel
- [ ] Search count terupdate
- [ ] Clear button berfungsi
- [ ] Advanced options dapat di-toggle

## 🚀 Quick Fix

Jika semua troubleshooting gagal, coba langkah berikut:

1. **Refresh halaman** dan coba lagi
2. **Clear browser cache** (Ctrl+F5)
3. **Check browser console** untuk error
4. **Import test data** menggunakan `diverse-test-contacts.xlsx`
5. **Test di halaman terpisah** `test-search-simple.html`

## 📞 Support

Jika masalah masih berlanjut:
1. Buka browser console (F12)
2. Copy semua error messages
3. Test dengan `test-search-simple.html`
4. Dokumentasikan langkah yang sudah dicoba
