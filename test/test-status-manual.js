/**
 * Manual Status Verification Test
 * Step-by-step interactive test to verify each status condition
 */

const NipponPrinter = require('../index');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function checkStatus(printer, expectedStatus, description) {
    const status = await printer.getStatus();
    const match = status.rawStatus === expectedStatus;
    
    console.log(`\n  Current Status: ${status.rawStatus} (0x${status.rawStatus.toString(16).padStart(2, '0')})`);
    console.log(`  Expected: ${expectedStatus}`);
    console.log(`  Match: ${match ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Details:`);
    console.log(`    - Ready: ${status.ready}`);
    console.log(`    - Online: ${status.online}`);
    console.log(`    - Paper Near End: ${status.paperNearEnd}`);
    console.log(`    - Cover Open: ${status.coverOpen}`);
    console.log(`    - Paper Out: ${status.paperOut}`);
    console.log(`    - Error: ${status.error}`);
    
    return match;
}

async function runManualTest() {
    console.log('=== Nippon Printer Manual Status Test ===\n');
    console.log('This test will guide you through verifying each status condition.\n');

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

        const results = [];

        // Test 0: Ready
        console.log('═══════════════════════════════════════════');
        console.log('TEST 1: Status 0 (Ready)');
        console.log('═══════════════════════════════════════════');
        console.log('Prepare the printer:');
        console.log('  ✓ Paper loaded and sufficient');
        console.log('  ✓ Cover closed');
        console.log('  ✓ No error conditions');
        await prompt('\nPress Enter when ready...');
        const test0 = await checkStatus(printer, 0, 'Ready');
        results.push({ test: 'Status 0 (Ready)', passed: test0 });

        // Test 1: Paper Near End
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 2: Status 1 (Paper Near End)');
        console.log('═══════════════════════════════════════════');
        console.log('Adjust the printer:');
        console.log('  ⚠ Remove paper until near-end sensor triggers');
        console.log('  ✓ Cover should remain closed');
        console.log('  Note: Exact threshold depends on your printer model');
        await prompt('\nPress Enter when paper near end condition is set...');
        const test1 = await checkStatus(printer, 1, 'Paper Near End');
        results.push({ test: 'Status 1 (Paper Near End)', passed: test1 });

        // Test 2: Cover Open
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 3: Status 2 (Cover Open)');
        console.log('═══════════════════════════════════════════');
        console.log('Adjust the printer:');
        console.log('  ✓ Add sufficient paper (clear near-end)');
        console.log('  ⚠ Open the printer cover');
        await prompt('\nPress Enter when cover is open...');
        const test2 = await checkStatus(printer, 2, 'Cover Open');
        results.push({ test: 'Status 2 (Cover Open)', passed: test2 });

        // Test 3: Paper Near End + Cover Open
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 4: Status 3 (Paper Near End + Cover Open)');
        console.log('═══════════════════════════════════════════');
        console.log('Adjust the printer:');
        console.log('  ⚠ Remove paper until near-end triggers');
        console.log('  ⚠ Keep cover open');
        await prompt('\nPress Enter when both conditions are set...');
        const test3 = await checkStatus(printer, 3, 'Paper Near End + Cover Open');
        results.push({ test: 'Status 3 (Near End + Cover)', passed: test3 });

        // Test 4: Paper Out
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 5: Status 4 (Paper Out)');
        console.log('═══════════════════════════════════════════');
        console.log('Adjust the printer:');
        console.log('  ⚠ Remove all paper or ensure paper-out sensor triggers');
        console.log('  ✓ Close the cover');
        await prompt('\nPress Enter when paper is out and cover closed...');
        const test4 = await checkStatus(printer, 4, 'Paper Out');
        results.push({ test: 'Status 4 (Paper Out)', passed: test4 });

        // Test 5: Paper Near End + Paper Out
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 6: Status 5 (Paper Near End + Paper Out)');
        console.log('═══════════════════════════════════════════');
        console.log('Note: This combination may be difficult to achieve.');
        console.log('It would require both sensors to trigger simultaneously.');
        await prompt('\nPress Enter to attempt this test (or Ctrl+C to skip)...');
        const test5 = await checkStatus(printer, 5, 'Paper Near End + Paper Out');
        results.push({ test: 'Status 5 (Near End + Paper Out)', passed: test5 });

        // Test 6: Cover Open + Paper Out
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 7: Status 6 (Cover Open + Paper Out)');
        console.log('═══════════════════════════════════════════');
        console.log('Adjust the printer:');
        console.log('  ⚠ Keep paper out');
        console.log('  ⚠ Open the cover');
        await prompt('\nPress Enter when both conditions are set...');
        const test6 = await checkStatus(printer, 6, 'Cover Open + Paper Out');
        results.push({ test: 'Status 6 (Cover + Paper Out)', passed: test6 });

        // Test 7: All conditions
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST 8: Status 7 (All Conditions)');
        console.log('═══════════════════════════════════════════');
        console.log('Adjust the printer:');
        console.log('  ⚠ Paper near end');
        console.log('  ⚠ Cover open');
        console.log('  ⚠ Paper out');
        console.log('Note: This may be difficult to achieve.');
        await prompt('\nPress Enter to attempt this test (or Ctrl+C to skip)...');
        const test7 = await checkStatus(printer, 7, 'All Conditions');
        results.push({ test: 'Status 7 (All Conditions)', passed: test7 });

        // Print results
        console.log('\n═══════════════════════════════════════════');
        console.log('TEST RESULTS SUMMARY');
        console.log('═══════════════════════════════════════════\n');
        
        let passed = 0;
        let total = results.length;
        
        results.forEach((result, index) => {
            const symbol = result.passed ? '✓' : '✗';
            console.log(`${symbol} ${result.test}`);
            if (result.passed) passed++;
        });
        
        console.log(`\nPassed: ${passed}/${total}`);
        console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%\n`);

        // Close printer
        await printer.close();
        console.log('Printer closed');

    } catch (error) {
        console.error('\n[ERROR]:', error.message);
    } finally {
        rl.close();
    }
}

// Run test
runManualTest();
