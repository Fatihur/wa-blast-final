# WhatsApp Blast Application

A powerful WhatsApp blast messaging application built with Baileys, Express.js, and Socket.io. Send personalized messages, images, and documents to multiple contacts with advanced features like variable replacement and rich text formatting.

## Features

✅ **QR Code Connection** - Easy WhatsApp Web connection via QR code
✅ **Single & Blast Messaging** - Send to individual contacts or bulk messaging
✅ **Excel Import** - Import contacts from Excel/CSV files
✅ **Variable Support** - Personalize messages with {{name}}, {{email}}, etc.
✅ **Rich Text Formatting** - Support for *bold*, _italic_, ~strikethrough~, ```monospace```
✅ **Multi-Media Support** - Send text, images, and documents
✅ **Different Files Per Contact** - Assign different files to different contacts
✅ **Real-time Progress** - Live progress tracking for blast campaigns
✅ **Responsive Design** - Works on desktop and mobile devices

### 🆕 New Features:
✅ **Message Logging** - Complete log system with success/failure tracking
✅ **Rich Text Editor** - Toolbar with formatting buttons and variable insertion
✅ **Contact Selection** - Choose specific contacts for blast campaigns
✅ **Auto Phone Formatting** - Smart phone number detection and formatting (08xx → 628xx)
✅ **Persistent Storage** - Contacts saved permanently, auto-load on restart
✅ **Dynamic Variables** - Variables auto-generated from Excel headers ({{position}}, {{department}}, etc.)
✅ **File Matching** - Send different files to each contact based on fileName column in Excel

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wa-blast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env file with your settings
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Usage

### 1. Connect WhatsApp

1. Click "Connect WhatsApp" button
2. Scan the QR code with your WhatsApp mobile app
3. Go to WhatsApp > Settings > Linked Devices
4. Tap "Link a Device" and scan the QR code
5. Wait for connection confirmation

### 2. Import Contacts

1. Go to "Contacts" tab
2. Download the Excel template or prepare your own file
3. Upload Excel/CSV file with contact information
4. Review imported contacts

**Required columns:**
- `name` - Contact name
- `number` - Phone number (format: 628xxxxxxxxx)

**Optional columns:**
- `email` - Email address
- `company` - Company name
- `address` - Address
- `notes` - Additional notes
- Any custom fields (position, department, city, etc.)

### 2.1. Search and Filter Contacts

**🔍 Search Features:**
- **Real-time search** - Search as you type
- **Multi-field search** - Search across name, number, email, company, and custom fields
- **Highlight results** - Search terms are highlighted in yellow
- **Search statistics** - Shows "X of Y contacts" with color indicators

**🎯 Filter Options:**
- **Group filter** - Filter by specific groups
- **Selected only** - Show only selected contacts
- **With groups only** - Show contacts that have groups
- **Advanced options** - Toggle additional filter options

**⚡ Bulk Actions:**
- **Select Filtered** - Select all contacts matching current search/filter
- **Select All/None** - Quick selection controls
- **Add to Group** - Add selected contacts to groups

**Usage Examples:**
```
Search "ELECTRICIAN" → Shows all electrician contacts
Search "Jakarta" → Shows contacts from Jakarta
Search "Level 3" → Shows contacts with Level 3 skills
Filter by group + search → Combine filters for precise results
```

### 3. Send Single Message

1. Go to "Single Message" tab
2. Enter phone number and message
3. Choose message type (text, image, document)
4. Upload file if needed
5. Click "Send Message"

### 4. Send Blast Message

1. Go to "Blast Message" tab
2. Choose message type:
   - **Text Only** - Plain text messages
   - **Text + Image** - Same image for all contacts
   - **Text + Document** - Same document for all contacts
   - **Mixed** - Different files per contact
3. Write your message with variables
4. Set delay between messages (recommended: 1000-3000ms)
5. Select contacts to send (use checkboxes)
6. Preview message before sending
7. Click "Send Blast"

### 5. File Matching (Send Different Files per Contact)

1. Click "File Matching" button in navbar
2. Upload documents to Documents folder
3. Import Excel with `fileName` column
4. Preview file matching results
5. Send blast with different files per contact

**Excel Template for File Matching:**
```
name        | number      | email           | fileName
John Doe    | 08123456789 | john@email.com  | john_certificate.pdf
Jane Smith  | 08234567890 | jane@email.com  | jane_report.docx
```

### 6. View Message Logs

1. Click "Logs" button in navbar
2. View statistics and message history
3. Filter logs by status, type, or number
4. Monitor success rates and troubleshoot issues

## Variables

Use these variables in your messages for personalization:

- `{{name}}` - Contact name
- `{{number}}` - Phone number
- `{{email}}` - Email address
- `{{company}}` - Company name
- `{{address}}` - Address
- `{{notes}}` - Notes
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{day}}` - Day of week
- `{{month}}` - Month name
- `{{year}}` - Current year
- `{{fileName}}` - File name (for file matching)
- **Custom variables** from Excel headers (e.g., {{position}}, {{department}})

**Example:**
```
Hello {{name}}!

Thank you for your interest in our services. 
We will contact you at {{number}} soon.

Best regards,
{{company}}

Date: {{date}}
```

## Rich Text Formatting

Support for WhatsApp text formatting:

- `*bold text*` - **Bold**
- `_italic text_` - _Italic_
- `~strikethrough~` - ~~Strikethrough~~
- ``` `monospace` ``` - `Monospace`

## API Endpoints

### Messages
- `POST /api/messages/send` - Send single message
- `POST /api/messages/blast` - Send blast messages
- `GET /api/messages/status` - Get WhatsApp connection status

### Contacts
- `POST /api/contacts/import` - Import contacts from Excel/CSV
- `POST /api/contacts/validate` - Validate contact data
- `GET /api/contacts/template` - Download Excel template

### Upload
- `POST /api/upload/file` - Upload single file
- `POST /api/upload/files` - Upload multiple files
- `GET /api/upload/files` - List uploaded files
- `DELETE /api/upload/file/:filename` - Delete uploaded file

## Configuration

Environment variables in `.env`:

```env
PORT=3000
SESSION_NAME=wa-blast-session
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB
```

## File Structure

```
wa-blast/
├── public/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── app.js          # Frontend JavaScript
│   └── style.css       # CSS styles
├── routes/             # API routes
│   ├── messageRoutes.js
│   ├── contactRoutes.js
│   └── uploadRoutes.js
├── services/           # Business logic
│   └── whatsappService.js
├── utils/              # Utility functions
│   └── messageUtils.js
├── uploads/            # Uploaded files
├── sessions/           # WhatsApp session data
├── server.js           # Main server file
└── package.json        # Dependencies
```

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- The `sessions/` directory contains sensitive WhatsApp session data
- Uploaded files are stored locally in `uploads/` directory
- Use appropriate delays between messages to avoid being blocked
- Monitor your WhatsApp account for any restrictions

## Testing

### Automated Testing
```bash
# Run all feature tests
npm test

# Test individual components
npm run health
```

### Manual Testing
```bash
# Open test page in browser
npm run test:upload
# Then go to: http://localhost:3000/test-upload.html
```

### Test Files
```bash
# Create test files
node create-test-image.js
```

## Troubleshooting

### Image/Document Upload Issues

1. **File upload fails**
   - Check file size (max 50MB)
   - Ensure uploads folder exists: `mkdir uploads`
   - Check permissions: `chmod 755 uploads`

2. **Image/Document not sending**
   - Verify file uploaded successfully first
   - Check file path in request
   - Use test page: http://localhost:3000/test-upload.html
   - Check logs: `tail -f logs/error.log`

3. **"File not found" error**
   - File may not be uploaded properly
   - Check uploads folder for the file
   - Try uploading again

### Connection Issues
- Make sure your phone has internet connection
- Try refreshing the QR code
- Check if WhatsApp Web is working in your browser
- Restart the application if needed

### Message Sending Issues
- Verify phone numbers are in correct format (628xxxxxxxxx)
- Check if WhatsApp is still connected
- Ensure files are not too large (max 50MB)
- Use appropriate delays between messages

### Import Issues
- Check Excel file format and column names
- Ensure phone numbers are in correct format
- Verify file is not corrupted

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📱 Available Pages

- **Main App**: http://localhost:3000 - Main WhatsApp blast interface
- **File Matching**: http://localhost:3000/file-matching.html - Send different files per contact
- **Logs**: http://localhost:3000/logs.html - Message logs and statistics
- **Test Upload**: http://localhost:3000/test-upload.html - File upload testing

## 📚 Documentation

- [FILE_MATCHING_GUIDE.md](FILE_MATCHING_GUIDE.md) - Complete guide for file matching feature
- [STORAGE_AND_VARIABLES.md](STORAGE_AND_VARIABLES.md) - Storage and dynamic variables guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Troubleshooting guide

## License

This project is licensed under the ISC License.

## Support

For support and questions, please create an issue in the repository.

## Disclaimer

This tool is for educational and legitimate business purposes only. Please comply with WhatsApp's Terms of Service and avoid spamming. The developers are not responsible for any misuse of this application.
