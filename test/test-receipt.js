/**
 * Test - Print sample receipt
 */

const NipponPrinter = require('../index');

async function printSampleReceipt() {
    console.log('=== Nippon Printer Receipt Test ===\n');

    try {
        // Get printers
        const printers = NipponPrinter.enumeratePrinters();
        if (printers.length === 0) {
            throw new Error('No printers found');
        }

        // Prioritize NPI Integration Driver or Microsoft Print to PDF
        const printerName = printers.find(p => p.includes('NPI Integration')) || 
                           printers.find(p => p.includes('Microsoft Print to PDF')) ||
                           printers[0];
        console.log(`Using printer: ${printerName}\n`);

        // Open printer
        const printer = new NipponPrinter();
        await printer.open(printerName);
        console.log('[OK] Printer opened');

        // Create sample receipt
        const receipt = {
            header: 'SAMPLE STORE',
            subheader: 'Thank you for your purchase!\n' +
                      '123 Main Street, City\n' +
                      'Tel: (555) 123-4567\n' +
                      new Date().toLocaleString(),
            items: [
                { name: 'Coffee', price: 3.50 },
                { name: 'Sandwich', price: 7.95 },
                { name: 'Water', price: 1.50 },
                { name: 'Cookie', price: 2.00 }
            ],
            total: 14.95,
            footer: 'Have a great day!\nPlease come again',
            width: 48
        };

        console.log('Printing receipt...');
        const result = await printer.printReceipt(receipt);
        console.log(`[OK] Receipt printed (Job ID: ${result.jobId})`);

        // Close printer
        await printer.close();
        console.log('[OK] Printer closed');

        console.log('\n[SUCCESS] Receipt test completed!');

    } catch (error) {
        console.error('[ERROR]:', error.message);
        process.exit(1);
    }
}

printSampleReceipt();
