/**
 * Test - Get printer mileage/usage counter
 */

const NipponPrinter = require('../index');

async function testMileage() {
    console.log('=== Nippon Printer Mileage/Usage Counter ===\n');

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

        console.log('\n=== Printer Information ===\n');

        // Get model name
        try {
            const modelName = await printer.getModelName();
            console.log(`Model Name: ${modelName}`);
        } catch (e) {
            console.log('Model name not available');
        }

        // Get device info
        try {
            const deviceInfo = await printer.getDeviceInfo();
            console.log(`Device Info: ${deviceInfo}`);
        } catch (e) {
            console.log('Device info not available');
        }

        // Get firmware version
        try {
            const firmware = await printer.getFirmwareVersion();
            console.log(`Firmware Version: ${firmware}`);
        } catch (e) {
            console.log('Firmware version not available');
        }

        // Get serial number
        try {
            const serial = await printer.getSerialNumber();
            console.log(`Serial Number: ${serial}`);
        } catch (e) {
            console.log('Serial number not available');
        }

        console.log('\n=== Usage Counter (Mileage) ===\n');

        // Get mileage data
        const mileage = await printer.getMileage();

        if (!mileage.supported) {
            console.log('⚠ Mileage counter not supported by this printer model');
            console.log(`  ${mileage.message}`);
            console.log('\nNote: This feature (Type 9) may only be available on certain models.');
            console.log('The printer model can still be used for all other functions.\n');
        } else {
            console.log('User Maintenance Counter (Type 9):');
            console.log('─────────────────────────────────────────');
            console.log(`Dot Lines Energizing Head: ${mileage.dotLinesEnergizing.toLocaleString()} lines`);
            console.log(`Dot Lines Fed:             ${mileage.dotLinesFed.toLocaleString()} lines`);
            console.log(`Number of Cuts:            ${mileage.cuts.toLocaleString()} cuts`);
            console.log(`Reserved:                  ${mileage.reserved}`);
            console.log(`Raw Hex Data:              ${mileage.raw}`);
            console.log('─────────────────────────────────────────\n');

            // Calculate approximate metrics
            const dotsPerMm = 8;  // Assuming 203 DPI (8 dots/mm)
            const approxPaperFedMm = mileage.dotLinesFed / dotsPerMm;
            const approxPaperFedMeters = approxPaperFedMm / 1000;

            console.log('=== Estimated Usage ===\n');
            console.log(`Approximate Paper Fed: ${approxPaperFedMm.toFixed(0)} mm (${approxPaperFedMeters.toFixed(2)} meters)`);
            console.log(`Print Operations: ${mileage.cuts.toLocaleString()} receipts/documents`);
            console.log(`Print Head Usage: ${mileage.dotLinesEnergizing.toLocaleString()} dot lines`);
        }

        // Close printer
        await printer.close();
        console.log('\n✓ Test complete');

    } catch (error) {
        console.error('[ERROR]:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testMileage();
