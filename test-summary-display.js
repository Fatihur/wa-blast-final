async function testSummaryDisplay() {
    console.log('🧪 Testing Contact Summary Display...\n');

    try {
        // Test 1: Get current contacts
        console.log('👥 Getting current contacts...');
        const contactsResponse = await fetch('http://localhost:3000/api/contacts');
        const contactsData = await contactsResponse.json();
        
        if (contactsData.success) {
            console.log(`✅ API Response:`, {
                totalContacts: contactsData.contacts.length,
                headers: contactsData.headers,
                statistics: contactsData.statistics
            });

            // Calculate summary manually
            const contacts = contactsData.contacts;
            const summary = {
                total: contacts.length,
                valid: contacts.filter(c => c.number && c.number.trim()).length,
                invalid: contacts.filter(c => !c.number || !c.number.trim()).length,
                selected: contacts.filter(c => c.selected !== false).length
            };

            console.log('\n📊 Calculated Summary:');
            console.log(`  Total: ${summary.total}`);
            console.log(`  Valid: ${summary.valid}`);
            console.log(`  Invalid: ${summary.invalid}`);
            console.log(`  Selected: ${summary.selected}`);

            // Show contact details
            console.log('\n📋 Contact Details:');
            contacts.forEach((contact, index) => {
                console.log(`  ${index + 1}. ${contact.name || 'No Name'} - ${contact.number || 'No Number'} - Selected: ${contact.selected !== false}`);
            });

        } else {
            console.log('❌ Failed to get contacts:', contactsData.error);
        }

        // Test 2: Test with sample data
        console.log('\n🧪 Testing with sample data...');
        
        const sampleSummary = {
            total: 5,
            valid: 4,
            invalid: 1,
            selected: 3
        };

        console.log('Sample summary that should display correctly:');
        console.log(JSON.stringify(sampleSummary, null, 2));

        console.log('\n✅ Summary Display Test Completed!');
        console.log('\n📝 Expected UI Display:');
        console.log('┌─────────┬─────────┬─────────┬─────────┐');
        console.log('│  Total  │  Valid  │ Invalid │Selected │');
        console.log('├─────────┼─────────┼─────────┼─────────┤');
        console.log(`│    ${summary.total}    │    ${summary.valid}    │    ${summary.invalid}    │    ${summary.selected}    │`);
        console.log('└─────────┴─────────┴─────────┴─────────┘');

        console.log('\n🎯 If you still see "undefined", check:');
        console.log('1. Browser console for JavaScript errors');
        console.log('2. Network tab for failed API calls');
        console.log('3. Make sure contacts are properly imported');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testSummaryDisplay();
