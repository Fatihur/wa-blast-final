# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required. For production use, consider implementing authentication.

## Response Format
All API responses follow this format:

```json
{
  "success": true|false,
  "data": {},
  "error": "Error message if success is false"
}
```

## Endpoints

### WhatsApp Connection

#### Get Connection Status
```http
GET /messages/status
```

**Response:**
```json
{
  "isConnected": true,
  "status": "connected|connecting|disconnected|qr-ready",
  "qrCode": "data:image/png;base64,..." // Only when status is qr-ready
}
```

### Single Message

#### Send Single Message
```http
POST /messages/send
```

**Request Body:**
```json
{
  "number": "628123456789",
  "message": "Hello {{name}}!",
  "type": "text|image|document",
  "fileName": "document.pdf" // Required for document type
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message_id_from_whatsapp",
  "message": "Message sent successfully"
}
```

### Blast Messages

#### Send Blast Messages
```http
POST /messages/blast
```

**Request Body:**
```json
{
  "contacts": [
    {
      "name": "John Doe",
      "number": "628123456789",
      "email": "john@example.com",
      "company": "ABC Corp",
      "media": {
        "type": "image|document",
        "path": "./uploads/file.jpg",
        "fileName": "image.jpg"
      }
    }
  ],
  "message": "Hello {{name}} from {{company}}!",
  "variables": {
    "custom_var": "Custom Value"
  },
  "delay": 1000,
  "retryAttempts": 2
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "sent": 95,
    "failed": 5,
    "duration": 120000,
    "successRate": 95
  },
  "results": [
    {
      "number": "628123456789",
      "name": "John Doe",
      "status": "sent|failed",
      "messageId": "message_id",
      "attempts": 1,
      "error": "Error message if failed"
    }
  ]
}
```

### Contact Management

#### Import Contacts from Excel/CSV
```http
POST /contacts/import
```

**Request:** Multipart form data with file upload

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "valid": 95,
    "invalid": 5
  },
  "contacts": [
    {
      "id": 1,
      "name": "John Doe",
      "number": "628123456789",
      "email": "john@example.com",
      "company": "ABC Corp",
      "address": "Jakarta",
      "notes": "VIP Customer"
    }
  ],
  "invalidContacts": [
    {
      "name": "Invalid Contact",
      "number": "invalid_number",
      "error": "Invalid phone number format"
    }
  ]
}
```

#### Validate Contacts
```http
POST /contacts/validate
```

**Request Body:**
```json
{
  "contacts": [
    {
      "name": "John Doe",
      "number": "628123456789"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  },
  "validContacts": [...],
  "invalidContacts": [...]
}
```

#### Download Excel Template
```http
GET /contacts/template
```

**Response:** Excel file download

### File Upload

#### Upload Single File
```http
POST /upload/file
```

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "file": {
    "filename": "file-1234567890.jpg",
    "originalName": "image.jpg",
    "path": "./uploads/file-1234567890.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg",
    "url": "/uploads/file-1234567890.jpg"
  }
}
```

#### Upload Multiple Files
```http
POST /upload/files
```

**Request:** Multipart form data with multiple files

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "filename": "file-1234567890.jpg",
      "originalName": "image.jpg",
      "path": "./uploads/file-1234567890.jpg",
      "size": 1024000,
      "mimetype": "image/jpeg",
      "url": "/uploads/file-1234567890.jpg"
    }
  ]
}
```

#### Get Uploaded Files List
```http
GET /upload/files
```

**Response:**
```json
{
  "files": [
    {
      "filename": "file-1234567890.jpg",
      "size": 1024000,
      "uploadDate": "2023-12-07T10:30:00.000Z",
      "url": "/uploads/file-1234567890.jpg"
    }
  ]
}
```

#### Delete Uploaded File
```http
DELETE /upload/file/:filename
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### Serve Uploaded File
```http
GET /upload/:filename
```

**Response:** File content

## WebSocket Events

The application uses Socket.io for real-time communication.

### Client to Server Events

#### Connect WhatsApp
```javascript
socket.emit('connect-whatsapp');
```

#### Disconnect WhatsApp
```javascript
socket.emit('disconnect-whatsapp');
```

### Server to Client Events

#### WhatsApp Status Update
```javascript
socket.on('whatsapp-status', (status) => {
  // status object same as GET /messages/status
});
```

#### Blast Progress Update
```javascript
socket.on('blast-progress', (progress) => {
  console.log(progress);
  // {
  //   total: 100,
  //   sent: 50,
  //   failed: 2,
  //   current: 52,
  //   percentage: 52
  // }
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider implementing rate limiting to prevent abuse.

## File Upload Limits

- Maximum file size: 50MB (configurable via MAX_FILE_SIZE env var)
- Supported formats: All file types
- Storage: Local filesystem (uploads/ directory)

## Message Variables

Available variables for message templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{name}}` | Contact name | John Doe |
| `{{number}}` | Phone number | 628123456789 |
| `{{email}}` | Email address | john@example.com |
| `{{company}}` | Company name | ABC Corp |
| `{{address}}` | Address | Jakarta, Indonesia |
| `{{notes}}` | Notes | VIP Customer |
| `{{date}}` | Current date | 07/12/2023 |
| `{{time}}` | Current time | 14:30:00 |
| `{{datetime}}` | Date and time | 07/12/2023 14:30:00 |
| `{{day}}` | Day of week | Thursday |
| `{{month}}` | Month name | December |
| `{{year}}` | Current year | 2023 |

## Rich Text Formatting

WhatsApp formatting supported in messages:

| Format | Syntax | Result |
|--------|--------|--------|
| Bold | `*text*` | **text** |
| Italic | `_text_` | _text_ |
| Strikethrough | `~text~` | ~~text~~ |
| Monospace | ``` `text` ``` | `text` |

## Phone Number Format

Phone numbers must be in international format without + sign:
- ✅ Correct: `628123456789`
- ❌ Wrong: `+628123456789`, `08123456789`, `8123456789`

The system automatically converts Indonesian numbers:
- `08123456789` → `628123456789`
- `8123456789` → `628123456789`

## Example Usage

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Send single message
const response = await axios.post('http://localhost:3000/api/messages/send', {
  number: '628123456789',
  message: 'Hello from API!',
  type: 'text'
});

console.log(response.data);
```

### cURL
```bash
# Send single message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Hello from cURL!",
    "type": "text"
  }'

# Upload file
curl -X POST http://localhost:3000/api/upload/file \
  -F "file=@/path/to/your/file.jpg"
```

### Python
```python
import requests

# Send single message
response = requests.post('http://localhost:3000/api/messages/send', json={
    'number': '628123456789',
    'message': 'Hello from Python!',
    'type': 'text'
})

print(response.json())
```
