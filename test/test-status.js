/**
 * Test - Printer status monitoring
 */

const NipponPrinter = require('../index');

async function monitorStatus() {
    console.log('=== Nippon Printer Status Monitor ===\n');
    console.log('Press Ctrl+C to stop\n');

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
        console.log(`Monitoring: ${printerName}\n`);

        // Open printer
        const printer = new NipponPrinter();
        await printer.open(printerName);

        // Get device info
        try {
            const deviceInfo = await printer.getDeviceInfo();
            console.log(`Device Info: ${deviceInfo}`);
        } catch (e) {
            console.log('Device info not available');
        }

        try {
            const serialNumber = await printer.getSerialNumber();
            console.log(`Serial Number: ${serialNumber}`);
        } catch (e) {
            console.log('Serial number not available');
        }

        console.log('\n--- Status Updates ---\n');

        // Monitor status every 2 seconds
        const interval = setInterval(async () => {
            try {
                const status = await printer.getStatus();
                const timestamp = new Date().toLocaleTimeString();
                
                console.log(`[${timestamp}] Status: 0x${status.rawStatus.toString(16).padStart(2, '0')} (${status.rawStatus})`);
                console.log(`  Ready: ${status.ready ? 'YES' : 'NO'}  ` +
                          `Online: ${status.online ? 'YES' : 'NO'}  ` +
                          `Printing: ${status.printing ? 'YES' : 'NO'}  ` +
                          `Error: ${status.error ? 'YES' : 'No'}`);
                console.log(`  Paper Near End: ${status.paperNearEnd ? 'YES' : 'NO'}  ` +
                          `Cover Open: ${status.coverOpen ? 'YES' : 'NO'}  ` +
                          `Paper Out: ${status.paperOut ? 'YES' : 'NO'}  ` +
                          `Overheat: ${status.overheat ? 'YES' : 'NO'}`);
                console.log('');

                if (status.printing) {
                    console.log('[INFO] Printer is currently printing...');
                }
                if (status.paperOut) {
                    console.log('[WARNING] PAPER OUT!');
                }
                if (status.paperNearEnd) {
                    console.log('[WARNING] PAPER NEAR END!');
                }
                if (status.coverOpen) {
                    console.log('[WARNING] COVER OPEN!');
                }
                if (status.overheat) {
                    console.log('[WARNING] OVERHEAT! Allow printer to cool down.');
                }
                if (status.error) {
                    console.log('[WARNING] ERROR CONDITION DETECTED!');
                }

            } catch (error) {
                console.error('Error getting status:', error.message);
            }
        }, 2000);

        // Handle Ctrl+C
        process.on('SIGINT', async () => {
            clearInterval(interval);
            console.log('\n\nStopping monitor...');
            await printer.close();
            console.log('Printer closed');
            process.exit(0);
        });

    } catch (error) {
        console.error('[ERROR]:', error.message);
        process.exit(1);
    }
}

monitorStatus();
