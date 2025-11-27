/**
 * Test Configuration
 * 
 * Set preferred printer order and test options
 */

module.exports = {
    // Printer selection priority (in order of preference)
    printerPriority: [
        'NPI Integration Driver',      // Nippon printer
        'Microsoft Print to PDF',      // Windows virtual printer (safe for testing)
        'XPS Card Printer'             // Another Windows virtual printer
    ],

    // Skip printers that shouldn't be used for testing
    skipPrinters: [
        'BIXOLON',                     // Skip physical Bixolon printer
        'OneNote'                      // Skip OneNote printer
    ],

    // Test options
    options: {
        printTests: true,              // Enable actual printing tests
        statusTests: true,             // Enable status tests
        safeMode: false                // If true, only use virtual printers (PDF, XPS)
    }
};
