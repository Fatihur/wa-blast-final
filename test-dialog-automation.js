const puppeteer = require('puppeteer');

async function testDialogAutomation() {
    console.log('🤖 Starting automated dialog testing...\n');
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({ 
            headless: false, // Set to true for headless mode
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error') {
                console.log('🔴 Browser Error:', text);
            } else if (type === 'warn') {
                console.log('🟡 Browser Warning:', text);
            } else if (text.includes('🔍') || text.includes('✅') || text.includes('❌') || text.includes('🔔')) {
                console.log('📱 Browser Log:', text);
            }
        });
        
        // Navigate to file matching page
        console.log('📄 Loading file-matching.html...');
        await page.goto('http://localhost:3000/file-matching.html', { waitUntil: 'networkidle2' });
        
        // Wait for page to load
        await page.waitForSelector('#blastFilesForm', { timeout: 10000 });
        console.log('✅ Page loaded successfully');
        
        // Check if SweetAlert2 is loaded
        const swalAvailable = await page.evaluate(() => {
            return typeof Swal !== 'undefined';
        });
        console.log('🔍 SweetAlert2 available:', swalAvailable);
        
        if (!swalAvailable) {
            console.log('❌ SweetAlert2 not loaded! This is the main issue.');
            return;
        }
        
        // Test 1: Test Dialog button
        console.log('\n🧪 Test 1: Testing "Test Dialog" button...');
        try {
            await page.click('button[onclick="fileMatchingApp.testValidation()"]');
            console.log('✅ Test Dialog button clicked');
            
            // Wait for dialog to appear
            await page.waitForSelector('.swal2-container', { timeout: 5000 });
            console.log('✅ SweetAlert2 dialog appeared');
            
            // Close dialog
            await page.click('.swal2-confirm');
            console.log('✅ Dialog closed');
        } catch (error) {
            console.log('❌ Test Dialog failed:', error.message);
        }
        
        // Test 2: Fill form and test submission
        console.log('\n🧪 Test 2: Testing form submission...');
        try {
            // Fill message
            await page.type('#blastFilesMessage', 'Test message for file matching');
            console.log('✅ Message entered');
            
            // Set delay
            await page.evaluate(() => {
                document.getElementById('fileBlastDelay').value = '2000';
            });
            console.log('✅ Delay set');
            
            // Click Send Blast with Files button
            await page.click('button[type="submit"]');
            console.log('✅ Send button clicked');
            
            // Wait for validation dialog
            await page.waitForSelector('.swal2-container', { timeout: 10000 });
            console.log('✅ Validation dialog appeared');
            
            // Check dialog content
            const dialogTitle = await page.$eval('.swal2-title', el => el.textContent);
            console.log('📋 Dialog title:', dialogTitle);
            
            // Close dialog
            await page.click('.swal2-cancel');
            console.log('✅ Dialog cancelled');
            
        } catch (error) {
            console.log('❌ Form submission test failed:', error.message);
        }
        
        // Test 3: Test Full Flow button
        console.log('\n🧪 Test 3: Testing "Test Full Flow" button...');
        try {
            await page.click('button[onclick="fileMatchingApp.testFullValidationFlow()"]');
            console.log('✅ Test Full Flow button clicked');
            
            // Wait for potential dialog
            try {
                await page.waitForSelector('.swal2-container', { timeout: 5000 });
                console.log('✅ Full flow dialog appeared');
                await page.click('.swal2-cancel');
            } catch (e) {
                console.log('ℹ️ No dialog appeared (might be expected if no contacts)');
            }
            
        } catch (error) {
            console.log('❌ Test Full Flow failed:', error.message);
        }
        
        // Get final console logs
        console.log('\n📊 Final browser state check...');
        const finalState = await page.evaluate(() => {
            return {
                swalAvailable: typeof Swal !== 'undefined',
                appAvailable: typeof fileMatchingApp !== 'undefined',
                contactsCount: window.fileMatchingApp?.contacts?.length || 0,
                formExists: !!document.getElementById('blastFilesForm')
            };
        });
        console.log('📊 Final state:', finalState);
        
        console.log('\n🎉 Automated testing completed!');
        
    } catch (error) {
        console.error('❌ Automation error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    testDialogAutomation().catch(console.error);
} catch (error) {
    console.log('❌ Puppeteer not available. Install with: npm install puppeteer');
    console.log('📝 Manual testing instructions:');
    console.log('1. Open http://localhost:3000/file-matching.html');
    console.log('2. Open browser console (F12)');
    console.log('3. Click "Test Dialog" button');
    console.log('4. Fill message and click "Send Blast with Files"');
    console.log('5. Check console for debugging output');
}
