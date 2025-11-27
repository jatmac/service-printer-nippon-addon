/**
 * Helper utilities for Nippon Printer tests
 */

const NipponPrinter = require('../index');
const config = require('./test-config');

/**
 * Select the best available printer
 * Prioritizes based on test-config settings
 * @param {string[]} printers - Array of available printer names
 * @returns {string} Selected printer name
 */
function selectBestPrinter(printers) {
    if (!printers || printers.length === 0) {
        throw new Error('No printers available');
    }

    // Filter out skipped printers
    let availablePrinters = printers.filter(p => {
        return !config.skipPrinters.some(skip => p.includes(skip));
    });

    // If safe mode, only use virtual printers
    if (config.options.safeMode) {
        availablePrinters = availablePrinters.filter(p => 
            p.includes('PDF') || p.includes('XPS') || p.includes('OneNote')
        );
    }

    // If no printers after filtering, use original list
    if (availablePrinters.length === 0) {
        availablePrinters = printers;
    }

    // Check each priority
    for (const priority of config.printerPriority) {
        const found = availablePrinters.find(p => p.includes(priority));
        if (found) {
            return found;
        }
    }

    // Fall back to first available printer
    return availablePrinters[0];
}

/**
 * Get printers and select the best one
 * @returns {string} Selected printer name
 */
function getDefaultPrinter() {
    const printers = NipponPrinter.enumeratePrinters();
    return selectBestPrinter(printers);
}

/**
 * Print available printers with selection indicator
 * @param {string} selectedPrinter - The selected printer name
 */
function printPrinterList(selectedPrinter) {
    const printers = NipponPrinter.enumeratePrinters();
    
    console.log('Available printers:');
    printers.forEach((printer, index) => {
        const indicator = printer === selectedPrinter ? '*' : ' ';
        console.log(`  ${indicator} ${index + 1}. ${printer}`);
    });
    console.log('');
}

module.exports = {
    selectBestPrinter,
    getDefaultPrinter,
    printPrinterList
};
