#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const TEST_NUMBER = '6287758962661'; // Ganti dengan nomor test Anda

async function testFeatures() {
    console.log('🧪 Testing WhatsApp Blast Features...\n');

    try {
        // 1. Test WhatsApp Status
        console.log('1️⃣ Testing WhatsApp Status...');
        const statusResponse = await axios.get(`${BASE_URL}/messages/status`);
        console.log('✅ Status:', statusResponse.data);
        
        if (!statusResponse.data.isConnected) {
            console.log('❌ WhatsApp not connected. Please connect first.');
            return;
        }
        console.log('');

        // 2. Test Text Message
        console.log('2️⃣ Testing Text Message...');
        const textResponse = await axios.post(`${BASE_URL}/messages/send`, {
            number: TEST_NUMBER,
            message: 'Test text message from automated test',
            type: 'text'
        });
        console.log('✅ Text message:', textResponse.data);
        console.log('');

        // 3. Test File Upload
        console.log('3️⃣ Testing File Upload...');
        
        // Create test files if they don't exist
        if (!fs.existsSync('./test-image.png')) {
            console.log('Creating test files...');
            require('./create-test-image.js');
        }

        // Upload image
        const imageFormData = new FormData();
        imageFormData.append('file', fs.createReadStream('./test-image.png'));
        
        const imageUploadResponse = await axios.post(`${BASE_URL}/upload/file`, imageFormData, {
            headers: imageFormData.getHeaders()
        });
        console.log('✅ Image upload:', imageUploadResponse.data);

        // Upload document
        const docFormData = new FormData();
        docFormData.append('file', fs.createReadStream('./test-document.txt'));
        
        const docUploadResponse = await axios.post(`${BASE_URL}/upload/file`, docFormData, {
            headers: docFormData.getHeaders()
        });
        console.log('✅ Document upload:', docUploadResponse.data);
        console.log('');

        // 4. Test Image Message
        console.log('4️⃣ Testing Image Message...');
        const imageResponse = await axios.post(`${BASE_URL}/messages/send`, {
            number: TEST_NUMBER,
            message: 'Test image message 📸',
            type: 'image',
            fileName: imageUploadResponse.data.file.originalName,
            filePath: imageUploadResponse.data.file.path
        });
        console.log('✅ Image message:', imageResponse.data);
        console.log('');

        // 5. Test Document Message
        console.log('5️⃣ Testing Document Message...');
        const documentResponse = await axios.post(`${BASE_URL}/messages/send`, {
            number: TEST_NUMBER,
            message: 'Test document message 📄',
            type: 'document',
            fileName: docUploadResponse.data.file.originalName,
            filePath: docUploadResponse.data.file.path
        });
        console.log('✅ Document message:', documentResponse.data);
        console.log('');

        // 6. Test Rich Text Formatting
        console.log('6️⃣ Testing Rich Text Formatting...');
        const richTextResponse = await axios.post(`${BASE_URL}/messages/send`, {
            number: TEST_NUMBER,
            message: '*Bold text* _italic text_ ~strikethrough~ ```monospace```',
            type: 'text'
        });
        console.log('✅ Rich text message:', richTextResponse.data);
        console.log('');

        // 7. Test Contact Validation
        console.log('7️⃣ Testing Contact Validation...');
        const validationResponse = await axios.post(`${BASE_URL}/contacts/validate`, {
            contacts: [
                { name: 'Test User', number: TEST_NUMBER },
                { name: 'Invalid User', number: '123' }
            ]
        });
        console.log('✅ Contact validation:', validationResponse.data);
        console.log('');

        // 8. Test Blast Message
        console.log('8️⃣ Testing Blast Message...');
        const blastResponse = await axios.post(`${BASE_URL}/messages/blast`, {
            contacts: [
                { 
                    name: 'Test User', 
                    number: TEST_NUMBER,
                    email: 'test@example.com',
                    company: 'Test Company'
                }
            ],
            message: 'Hello {{name}} from {{company}}! Your number is {{number}}',
            delay: 1000
        });
        console.log('✅ Blast message:', blastResponse.data);
        console.log('');

        console.log('🎉 All tests completed successfully!');
        console.log('\n📱 Check your WhatsApp to see the test messages.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 400 && error.response?.data?.error?.includes('not connected')) {
            console.log('\n💡 Tip: Make sure WhatsApp is connected first by scanning the QR code at http://localhost:3000');
        }
    }
}

// Run tests
if (require.main === module) {
    testFeatures();
}

module.exports = testFeatures;
