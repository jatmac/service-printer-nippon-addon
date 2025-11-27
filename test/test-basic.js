/**
 * Basic test - Enumerate and print test
 */

const NipponPrinter = require('../index');

async function runBasicTest() {
    console.log('=== Nippon Printer Basic Test ===\n');

    try {
        // Enumerate printers
        console.log('1. Enumerating printers...');
        const printers = NipponPrinter.enumeratePrinters();
        console.log(`   Found ${printers.length} printer(s):`);
        printers.forEach((printer, index) => {
            console.log(`   ${index + 1}. ${printer}`);
        });

        if (printers.length === 0) {
            console.log('\n[ERROR] No printers found. Please ensure NServiceDrv is running and printers are connected.');
            return;
        }

        // Prioritize NPI Integration Driver or Microsoft Print to PDF
        let printerName = printers.find(p => p.includes('NPI Integration')) || 
                         printers.find(p => p.includes('Microsoft Print to PDF')) ||
                         printers[0];
        
        console.log(`   Selected: ${printerName}`);
        console.log('');
        console.log(`\n2. Opening printer: ${printerName}`);
        
        const printer = new NipponPrinter();
        await printer.open(printerName);
        console.log('   [OK] Printer opened successfully');

        // Get status
        console.log('\n3. Getting printer status...');
        const status = await printer.getStatus();
        console.log(`   Status: ${status.online ? 'Online' : 'Offline'}`);
        console.log(`   Cover: ${status.coverOpen ? 'Open' : 'Closed'}`);
        console.log(`   Paper: ${status.paperOut ? 'Out' : 'OK'}`);
        console.log(`   Error: ${status.error ? 'Yes' : 'No'}`);
        console.log(`   Raw Status: 0x${status.rawStatus.toString(16)}`);

        // Print test
        console.log('\n4. Printing test receipt...');
        const result = await printer.printText('Hello from Nippon Printer!\nTest Print Successful', {
            align: 'center',
            bold: true,
            feed: 3
        });
        console.log(`   [OK] Print job submitted (Job ID: ${result.jobId})`);

        // Close printer
        console.log('\n5. Closing printer...');
        await printer.close();
        console.log('   [OK] Printer closed');

        console.log('\n[SUCCESS] Test completed successfully!');

    } catch (error) {
        console.error('\n[ERROR] Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
runBasicTest();
