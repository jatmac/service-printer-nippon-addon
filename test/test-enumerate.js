/**
 * Test - Enumerate printers only
 */

const NipponPrinter = require('../index');

console.log('=== Nippon Printer Enumeration Test ===\n');

try {
    console.log('Enumerating printers...\n');
    const printers = NipponPrinter.enumeratePrinters();
    
    if (printers.length === 0) {
        console.log('[ERROR] No printers found.');
        console.log('\nTroubleshooting:');
        console.log('1. Ensure NServiceDrv service is running:');
        console.log('   sc query NServiceDrv');
        console.log('2. Check if NPrinterLib.dll is accessible');
        console.log('3. Verify printer is connected and powered on');
    } else {
        console.log(`[OK] Found ${printers.length} printer(s):\n`);
        printers.forEach((printer, index) => {
            console.log(`${index + 1}. ${printer}`);
        });
    }

} catch (error) {
    console.error('[ERROR]:', error.message);
    console.error('\nMake sure:');
    console.error('- NPrinterLib.dll is in the build/Release directory');
    console.error('- NServiceDrv service is registered and running');
    console.error('- You have administrator privileges');
}
