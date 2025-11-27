/**
 * Test - Print formatted text with various options
 */

const NipponPrinter = require('../index');

async function testPrintFormatting() {
    console.log('=== Nippon Printer Formatting Test ===\n');

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
        console.log('[OK] Printer opened\n');

        // Test 1: Normal text
        console.log('Test 1: Normal text');
        await printer.printText('Normal text');

        // Test 2: Bold text
        console.log('Test 2: Bold text');
        await printer.printText('Bold Text', { bold: true });

        // Test 3: Underline
        console.log('Test 3: Underline');
        await printer.printText('Underlined Text', { underline: true });

        // Test 4: Center aligned
        console.log('Test 4: Center aligned');
        await printer.printText('Centered Text', { align: 'center' });

        // Test 5: Right aligned
        console.log('Test 5: Right aligned');
        await printer.printText('Right Aligned', { align: 'right' });

        // Test 6: Double size
        console.log('Test 6: Double size');
        await printer.printText('DOUBLE SIZE', { width: 2, height: 2 });

        // Test 7: Large text
        console.log('Test 7: Large text');
        await printer.printText('LARGE', { width: 3, height: 3 });

        // Test 8: Combined formatting
        console.log('Test 8: Combined');
        await printer.printText('BOLD CENTERED', { 
            bold: true, 
            align: 'center',
            width: 2,
            height: 2
        });

        // Test 9: With cut
        console.log('Test 9: With partial cut');
        await printer.printText('Test Complete!', { 
            align: 'center',
            feed: 5,
            cut: 'partial'
        });

        console.log('[OK] All formatting tests completed\n');

        // Close printer
        await printer.close();
        console.log('[OK] Printer closed');

        console.log('\n[SUCCESS] Formatting test completed!');

    } catch (error) {
        console.error('[ERROR]:', error.message);
        process.exit(1);
    }
}

testPrintFormatting();
