/**
 * Test - Query multiple information IDs to find mileage/counter data
 */

const NipponPrinter = require('../index');

async function scanInformationIds() {
    console.log('=== Scanning for Printer Information IDs ===\n');
    console.log('Looking for mileage/counter data...\n');

    try {
        // Get printers
        const printers = NipponPrinter.enumeratePrinters();
        if (printers.length === 0) {
            throw new Error('No printers found');
        }

        const printerName = printers.find(p => p.includes('NPI Integration')) || 
                           printers.find(p => p.includes('Nippon')) ||
                           printers[0];
        console.log(`Testing with: ${printerName}\n`);

        // Open printer
        const printer = new NipponPrinter();
        await printer.open(printerName);
        console.log('Printer opened successfully\n');

        // Known IDs from SDK documentation
        console.log('=== Known Information IDs (from SDK) ===');
        console.log('ID  2: Model name');
        console.log('ID  3: F/W version');
        console.log('ID  4: Boot version');
        console.log('ID  6: Number of dot lines energizing head');
        console.log('ID  7: Number of fed dot lines');
        console.log('ID  8: Number of cuts');
        console.log('ID  9: User maintenance counter (Mileage!)');
        console.log('ID 10: Device Info');
        console.log('ID 11: Firmware Version');
        console.log('ID 12: Serial Number');
        console.log('ID 13: NV registration status');
        console.log('ID 28: F/W checksum');
        console.log('ID 31: Communication status information');
        console.log('ID 41: Log Data\n');

        // Test common IDs that might contain mileage/counter
        const testIds = [
            { id: 13, description: 'Unknown (possible mileage)' },
            { id: 14, description: 'Unknown' },
            { id: 15, description: 'Unknown' },
            { id: 16, description: 'Unknown' },
            { id: 17, description: 'Unknown' },
            { id: 18, description: 'Unknown' },
            { id: 19, description: 'Unknown' },
            { id: 20, description: 'Unknown' },
            { id: 21, description: 'Unknown' },
            { id: 22, description: 'Unknown' },
            { id: 23, description: 'Unknown' },
            { id: 24, description: 'Unknown' },
            { id: 25, description: 'Unknown' },
            { id: 30, description: 'Unknown' },
            { id: 31, description: 'Unknown' },
            { id: 32, description: 'Unknown' },
            { id: 33, description: 'Unknown' },
            { id: 34, description: 'Unknown' },
            { id: 35, description: 'Unknown' },
            { id: 40, description: 'Unknown' }
        ];

        console.log('=== Testing Information IDs ===\n');

        for (const test of testIds) {
            try {
                const result = await printer.getInformation(test.id);
                
                // Try to parse as different data types
                const data = result.data;
                const hex = Buffer.from(data, 'binary').toString('hex');
                const numeric = parseInt(data) || 'N/A';
                
                console.log(`ID ${test.id}: ${test.description}`);
                console.log(`  Data: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`);
                console.log(`  Hex: ${hex.substring(0, 50)}${hex.length > 50 ? '...' : ''}`);
                console.log(`  Numeric: ${numeric}`);
                console.log(`  Length: ${data.length} bytes`);
                console.log(`  Timeout: ${result.timeout}ms`);
                console.log('');
                
            } catch (error) {
                console.log(`ID ${test.id}: ${test.description}`);
                console.log(`  Error: ${error.message}`);
                console.log('');
            }
            
            // Small delay between queries
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Close printer
        await printer.close();
        console.log('\n=== Scan Complete ===');
        console.log('Review the output above to identify which ID contains mileage/counter data.');
        console.log('Look for numeric values that might represent:');
        console.log('  - Total prints');
        console.log('  - Total pages');
        console.log('  - Paper length used');
        console.log('  - Operation hours');

    } catch (error) {
        console.error('[ERROR]:', error.message);
        console.error(error.stack);
    }
}

// Run scan
scanInformationIds();
