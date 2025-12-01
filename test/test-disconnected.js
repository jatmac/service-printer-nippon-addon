/**
 * Test handling of disconnected printer (error code -5)
 */

const NipponPrinter = require('..');

async function testDisconnectedPrinter() {
    console.log('=== Testing Disconnected Printer Handling ===\n');

    try {
        // Enumerate printers
        const printers = NipponPrinter.enumeratePrinters();
        console.log('Available printers:', printers);

        if (printers.length === 0) {
            console.log('No printers found. Exiting test.');
            return;
        }

        // Use a printer that's likely not connected or a fake name
        const printer = new NipponPrinter();
        
        // Test 1: Try with NPI Integration Driver (Nippon printer)
        console.log('\n--- Test 1: Checking status of potentially disconnected printer ---');
        const printerName = printers.find(p => p.includes('NPI Integration')) || printers[0];
        console.log(`Testing with: ${printerName}`);
        
        await printer.open(printerName);
        console.log('Printer opened successfully');

        // Get status
        const status = await printer.getStatus();
        console.log('Status result:', JSON.stringify(status, null, 2));

        if (!status.connected) {
            console.log('✓ Printer correctly identified as disconnected');
            console.log(`  Error message: ${status.errorMessage}`);
            console.log(`  Return code: ${status.returnCode}`);
        } else {
            console.log('✓ Printer is connected and responding');
            console.log(`  Online: ${status.online}`);
            console.log(`  Ready: ${status.ready}`);
            if (status.error) {
                console.log(`  Errors:`);
                if (status.paperOut) console.log('    - Paper out');
                if (status.paperNearEnd) console.log('    - Paper near end');
                if (status.coverOpen) console.log('    - Cover open');
                if (status.overheat) console.log('    - Overheat');
            }
        }

        await printer.close();
        console.log('\n=== Test Completed Successfully ===');

    } catch (error) {
        console.error('\nTest failed with error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testDisconnectedPrinter().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
