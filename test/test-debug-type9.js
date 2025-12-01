/**
 * Debug - Check what data is actually returned for Type 9
 */

const NipponPrinter = require('../index');

async function debugType9() {
    console.log('=== Debug Type 9 (Mileage) Data ===\n');

    try {
        const printers = NipponPrinter.enumeratePrinters();
        if (printers.length === 0) {
            throw new Error('No printers found');
        }

        const printerName = printers.find(p => p.includes('NPI Integration')) || printers[0];
        console.log(`Testing with: ${printerName}\n`);

        const printer = new NipponPrinter();
        await printer.open(printerName);
        console.log('Printer opened\n');

        // Test multiple types to see which ones work
        const types = [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13];
        
        for (const id of types) {
            try {
                console.log(`Testing Type ${id}:`);
                const result = await printer.getInformation(id);
                
                console.log(`  Data type: ${typeof result.data}`);
                console.log(`  Data length: ${result.data.length}`);
                console.log(`  Data (string): "${result.data.substring(0, 100)}"`);
                
                // Convert to buffer
                const buffer = Buffer.from(result.data.split('').map(c => c.charCodeAt(0)));
                console.log(`  Buffer length: ${buffer.length}`);
                console.log(`  Hex: ${buffer.toString('hex')}`);
                console.log(`  Timeout: ${result.timeout}ms`);
                console.log('');
                
            } catch (error) {
                console.log(`  Error: ${error.message}`);
                console.log('');
            }
        }

        await printer.close();
        console.log('Test complete');

    } catch (error) {
        console.error('[ERROR]:', error.message);
    }
}

debugType9();
