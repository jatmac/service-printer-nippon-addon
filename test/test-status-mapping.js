/**
 * Test - Printer Status Bit Mapping
 * Interactive test to map Nippon printer status values
 */

const NipponPrinter = require('../index');

// Status bit mapping based on observations
const STATUS_MAPPING = {
    // Bit 0 (0x01): Paper Near End
    PAPER_NEAR_END: 0x01,
    
    // Bit 1 (0x02): Cover Open
    COVER_OPEN: 0x02,
    
    // Bit 2 (0x04): Paper Out
    PAPER_OUT: 0x04,
    
    // Bit 3 (0x08): Overheat
    OVERHEAT: 0x08,
    
    // Bit 7 (0x80): Printing
    PRINTING: 0x80,
    
    // Status values observed:
    // 0 = Ready (no flags)
    // 1 = Paper near end
    // 2 = Cover open
    // 3 = Paper near end + Cover open
    // 4 = Paper out
    // 5 = Paper near end + Paper out
    // 6 = Cover open + Paper out
    // 7 = Paper near end + Cover open + Paper out
    // 8+ = Include overheat condition
    // 128+ = Include printing status (bit 7)
};

function decodeStatus(rawStatus) {
    const status = {
        rawValue: rawStatus,
        hexValue: '0x' + rawStatus.toString(16).toUpperCase().padStart(2, '0'),
        binaryValue: '0b' + rawStatus.toString(2).padStart(8, '0'),
        conditions: []
    };

    // Check each bit
    if (rawStatus & STATUS_MAPPING.PAPER_NEAR_END) {
        status.conditions.push('Paper Near End');
        status.paperNearEnd = true;
    } else {
        status.paperNearEnd = false;
    }

    if (rawStatus & STATUS_MAPPING.COVER_OPEN) {
        status.conditions.push('Cover Open');
        status.coverOpen = true;
    } else {
        status.coverOpen = false;
    }

    if (rawStatus & STATUS_MAPPING.PAPER_OUT) {
        status.conditions.push('Paper Out');
        status.paperOut = true;
    } else {
        status.paperOut = false;
    }

    if (rawStatus & STATUS_MAPPING.OVERHEAT) {
        status.conditions.push('Overheat');
        status.overheat = true;
    } else {
        status.overheat = false;
    }

    if (rawStatus & STATUS_MAPPING.PRINTING) {
        status.conditions.push('Printing');
        status.printing = true;
    } else {
        status.printing = false;
    }

    // Overall status
    const hasError = (rawStatus & 0x0F) !== 0;  // Check bits 0-3 for errors
    
    if (!hasError && !status.printing) {
        status.conditions.push('Ready');
        status.ready = true;
    } else if (!hasError && status.printing) {
        status.ready = false;
    } else {
        status.ready = false;
    }

    // Online means no error conditions (can be printing)
    status.online = !hasError;
    
    // Error means any problem condition (bits 0-3)
    status.error = hasError;

    return status;
}

function printStatusTable() {
    console.log('\n=== Nippon Printer Status Mapping Reference ===\n');
    console.log('Common Status Values (0-15):');
    console.log('Value | Hex  | Binary   | Conditions');
    console.log('------|------|----------|------------------------------------------');
    
    for (let i = 0; i <= 15; i++) {
        const status = decodeStatus(i);
        const conditions = status.conditions.join(', ');
        const valueStr = i.toString().padStart(2, ' ');
        console.log(`  ${valueStr}  | ${status.hexValue} | ${status.binaryValue} | ${conditions}`);
    }
    console.log('');
    console.log('Note: Add 128 (0x80) to any value when printing (bit 7 set)');
    console.log('Examples: 128=Printing+Ready, 129=Printing+Paper Near End, etc.');
    console.log('');
}

async function testStatusDecoding() {
    console.log('=== Nippon Printer Status Decoder ===\n');

    try {
        // Get printers
        const printers = NipponPrinter.enumeratePrinters();
        if (printers.length === 0) {
            throw new Error('No printers found');
        }

        // Select printer
        const printerName = printers.find(p => p.includes('NPI Integration')) || 
                           printers.find(p => p.includes('Nippon')) ||
                           printers[0];
        console.log(`Testing with: ${printerName}\n`);

        // Open printer
        const printer = new NipponPrinter();
        await printer.open(printerName);
        console.log('Printer opened successfully\n');

        // Print reference table
        printStatusTable();

        console.log('=== Live Status Monitoring ===');
        console.log('Manipulate the printer to test different conditions:');
        console.log('  - Open the cover');
        console.log('  - Remove/add paper');
        console.log('  - Wait for paper near end warning\n');
        console.log('Press Ctrl+C to stop\n');

        let lastStatus = null;

        // Monitor status
        const interval = setInterval(async () => {
            try {
                const result = await printer.getStatus();
                const rawStatus = result.rawStatus;

                // Only print when status changes
                if (rawStatus !== lastStatus) {
                    const decoded = decodeStatus(rawStatus);
                    const timestamp = new Date().toLocaleTimeString();
                    
                    console.log(`[${timestamp}] STATUS CHANGE: ${decoded.rawValue} (${decoded.hexValue}, ${decoded.binaryValue})`);
                    console.log(`  Conditions: ${decoded.conditions.join(', ')}`);
                    console.log(`  Details:`);
                    console.log(`    - Ready: ${decoded.ready ? 'YES' : 'NO'}`);
                    console.log(`    - Online: ${decoded.online ? 'YES' : 'NO'}`);
                    console.log(`    - Printing: ${decoded.printing ? 'YES' : 'NO'}`);
                    console.log(`    - Paper Near End: ${decoded.paperNearEnd ? 'YES' : 'NO'}`);
                    console.log(`    - Cover Open: ${decoded.coverOpen ? 'YES' : 'NO'}`);
                    console.log(`    - Paper Out: ${decoded.paperOut ? 'YES' : 'NO'}`);
                    console.log(`    - Overheat: ${decoded.overheat ? 'YES' : 'NO'}`);
                    console.log(`    - Error: ${decoded.error ? 'YES' : 'NO'}`);
                    console.log('');

                    lastStatus = rawStatus;
                }

            } catch (error) {
                console.error('Error getting status:', error.message);
            }
        }, 500); // Check every 500ms for faster response

        // Handle Ctrl+C
        process.on('SIGINT', async () => {
            clearInterval(interval);
            console.log('\n\nStopping test...');
            await printer.close();
            console.log('Printer closed');
            console.log('\n=== Test Complete ===');
            process.exit(0);
        });

    } catch (error) {
        console.error('[ERROR]:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    testStatusDecoding();
} else {
    module.exports = { decodeStatus, STATUS_MAPPING };
}
