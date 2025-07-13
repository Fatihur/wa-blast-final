async function testBulkDelete() {
    console.log('🧪 Testing Bulk Delete API...\n');

    try {
        // Test 1: Get current documents
        console.log('📁 Getting current documents...');
        const docsResponse = await fetch('http://localhost:3000/api/file-matching/documents');
        const docsData = await docsResponse.json();
        
        if (docsData.success) {
            console.log(`✅ Found ${docsData.files.length} documents:`);
            docsData.files.forEach(file => {
                console.log(`  - ${file.fileName} (${file.size} bytes)`);
            });
        }

        // Test 2: Bulk delete selected files
        const filesToDelete = ['alice_contract.pdf', 'charlie_presentation.pptx'];
        console.log(`\n🗑️  Testing bulk delete for: ${filesToDelete.join(', ')}`);

        const bulkDeleteResponse = await fetch('http://localhost:3000/api/file-matching/documents/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filenames: filesToDelete
            })
        });

        const bulkDeleteResult = await bulkDeleteResponse.json();
        console.log('\n📊 Bulk Delete Result:');
        console.log(JSON.stringify(bulkDeleteResult, null, 2));

        // Test 3: Verify deletion
        console.log('\n🔍 Verifying deletion...');
        const verifyResponse = await fetch('http://localhost:3000/api/file-matching/documents');
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
            console.log(`✅ Remaining documents: ${verifyData.files.length}`);
            verifyData.files.forEach(file => {
                console.log(`  - ${file.fileName}`);
            });
        }

        // Test 4: Test clear all (commented out for safety)
        console.log('\n⚠️  Clear All Test (commented out for safety)');
        console.log('To test clear all, uncomment the code below:');
        console.log('// const clearResponse = await fetch("http://localhost:3000/api/file-matching/documents", { method: "DELETE" });');

        console.log('\n🎉 Bulk Delete API Test Completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testBulkDelete();
