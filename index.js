const addon = require('./build/Release/nippon_printer');

/**
 * Nippon Thermal Printer Class
 * High-level wrapper for NPrinterLib native addon
 */
class NipponPrinter {
    constructor() {
        this.printerName = null;
        this.isOpen = false;
    }

    /**
     * Get list of available Nippon printers
     * @returns {string[]} Array of printer names
     */
    static enumeratePrinters() {
        try {
            return addon.enumeratePrinters();
        } catch (error) {
            throw new Error(`Failed to enumerate printers: ${error.message}`);
        }
    }

    /**
     * Open connection to printer
     * @param {string} printerName - Printer name or IP address
     * @returns {Promise<boolean>} Success status
     */
    async open(printerName) {
        try {
            const result = addon.openPrinter(printerName);
            if (result.success) {
                this.printerName = printerName;
                this.isOpen = true;
                return true;
            }
            throw new Error(`Open failed with code ${result.returnCode}`);
        } catch (error) {
            throw new Error(`Failed to open printer: ${error.message}`);
        }
    }

    /**
     * Close connection to printer
     * @returns {Promise<boolean>} Success status
     */
    async close() {
        if (!this.isOpen || !this.printerName) {
            return true;
        }

        try {
            const result = addon.closePrinter(this.printerName);
            this.isOpen = false;
            return result.success;
        } catch (error) {
            throw new Error(`Failed to close printer: ${error.message}`);
        }
    }

    /**
     * Print text data
     * @param {string} data - Text data to print (can include ESC/POS commands)
     * @returns {Promise<Object>} Print result with jobId
     */
    async print(data) {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.print(this.printerName, data);
            if (!result.success) {
                throw new Error(`Print failed with code ${result.returnCode}`);
            }
            return {
                success: true,
                jobId: result.jobId,
                returnCode: result.returnCode
            };
        } catch (error) {
            throw new Error(`Print failed: ${error.message}`);
        }
    }

    /**
     * Print formatted text with options
     * @param {string} text - Text to print
     * @param {Object} options - Print options
     * @returns {Promise<Object>} Print result
     */
    async printText(text, options = {}) {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        let printData = '';

        // Initialize
        if (options.initialize !== false) {
            printData += '1B40'; // ESC @
        }

        // Alignment
        if (options.align === 'center') {
            printData += '1B6101'; // ESC a 1
        } else if (options.align === 'right') {
            printData += '1B6102'; // ESC a 2
        } else {
            printData += '1B6100'; // ESC a 0
        }

        // Text size using Nippon's FS ! n format
        if (options.width || options.height) {
            const w = options.width || 1;
            const h = options.height || 1;
            // Nippon uses specific size codes: 0x00=normal, 0x06=2x2, 0x20=large
            let sizeCode = '00';
            if (w >= 3 || h >= 3) {
                sizeCode = '20'; // Large (3x3 or more)
            } else if (w === 2 && h === 2) {
                sizeCode = '06'; // Double (2x2)
            }
            printData += `1C21${sizeCode}`; // FS ! n
        }

        // Bold
        if (options.bold) {
            printData += '1B4501'; // ESC E 1
        }

        // Underline
        if (options.underline) {
            printData += '1B2D01'; // ESC - 1
        }

        // Add text
        printData += `"${text}"`;

        // Reset formatting
        if (options.bold) {
            printData += '1B4500'; // ESC E 0
        }
        if (options.underline) {
            printData += '1B2D00'; // ESC - 0
        }

        // Reset text size
        if (options.width || options.height) {
            printData += '1C2100'; // FS ! 0
        }

        // Reset alignment
        printData += '1B6100'; // ESC a 0

        // Line feeds
        printData += '0A'; // LF
        if (options.feed) {
            const feedLines = typeof options.feed === 'number' ? options.feed : 3;
            for (let i = 0; i < feedLines; i++) {
                printData += '0A';
            }
        }

        // Cut paper
        if (options.cut) {
            printData += '1B4A60'; // Feed before cut
            if (options.cut === 'full') {
                printData += '1B69'; // Full cut
            } else {
                printData += '1B6D'; // Partial cut
            }
        }

        return await this.print(printData);
    }

    /**
     * Print receipt with formatted sections
     * @param {Object} receipt - Receipt data
     * @returns {Promise<Object>} Print result
     */
    async printReceipt(receipt) {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        let printData = '\x1B@'; // Initialize

        // Header
        if (receipt.header) {
            printData += '\x1Ba\x01';  // Center align
            printData += '\x1D!\x11';  // Double size
            printData += receipt.header + '\n';
            printData += '\x1D!\x00';  // Normal size
            printData += '\x1Ba\x00';  // Left align
            printData += '\n';
        }

        // Subheader
        if (receipt.subheader) {
            printData += receipt.subheader + '\n';
            printData += '\n';
        }

        // Items
        if (receipt.items && receipt.items.length > 0) {
            receipt.items.forEach(item => {
                const line = this._formatReceiptLine(item.name, item.price, receipt.width || 48);
                printData += line + '\n';
            });
            printData += '\n';
        }

        // Separator
        if (receipt.items && receipt.items.length > 0) {
            printData += '-'.repeat(receipt.width || 48) + '\n';
        }

        // Total
        if (receipt.total !== undefined) {
            const totalLine = this._formatReceiptLine('TOTAL', receipt.total, receipt.width || 48);
            printData += '\x1BE\x01';  // Bold
            printData += totalLine + '\n';
            printData += '\x1BE\x00';  // Bold off
        }

        // Footer
        if (receipt.footer) {
            printData += '\n';
            printData += '\x1Ba\x01';  // Center align
            printData += receipt.footer + '\n';
            printData += '\x1Ba\x00';  // Left align
        }

        // Cut paper
        printData += '\n\n';
        printData += '\x1Bd\x05';   // Feed 5 lines
        printData += '\x1DV\x01';   // Partial cut

        return await this.print(printData);
    }

    /**
     * Get printer status
     * @returns {Promise<Object>} Status information
     * 
     * Status bit mapping (based on actual Nippon printer behavior):
     * - Bit 0 (0x01): Paper Near End
     * - Bit 1 (0x02): Cover Open
     * - Bit 2 (0x04): Paper Out
     * - Bit 3 (0x08): Overheat (printer head temperature too high)
     * - Bit 7 (0x80): Printing (printer is currently processing a print job)
     * 
     * Observed values:
     * - 0: Ready (no issues)
     * - 1: Paper near end
     * - 2: Cover open
     * - 3: Paper near end + Cover open
     * - 4: Paper out
     * - 5: Paper near end + Paper out
     * - 6: Cover open + Paper out
     * - 7: Paper near end + Cover open + Paper out
     * - 8+: Include overheat condition
     * - 128+: Include printing status (bit 7)
     */
    async getStatus() {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.getStatus(this.printerName);
            
            // Handle any error return code gracefully
            if (result.returnCode < 0) {
                return {
                    status: 0,
                    online: false,
                    ready: false,
                    connected: false,
                    printing: false,
                    paperNearEnd: false,
                    coverOpen: false,
                    paperOut: false,
                    overheat: false,
                    error: true,
                    errorMessage: result.errorMessage || `Printer error (code ${result.returnCode})`,
                    returnCode: result.returnCode,
                    rawStatus: result.status
                };
            }

            const status = result.status;
            
            // Correct bit mapping for Nippon printer
            const paperNearEnd = (status & 0x01) !== 0;  // Bit 0
            const coverOpen = (status & 0x02) !== 0;     // Bit 1
            const paperOut = (status & 0x04) !== 0;      // Bit 2
            const overheat = (status & 0x08) !== 0;      // Bit 3
            const printing = (status & 0x80) !== 0;      // Bit 7
            
            // Printer is online/ready when no error conditions exist (printing status doesn't count as error)
            const hasError = (status & 0x0F) !== 0;  // Check bits 0-3 for errors
            const ready = !hasError && !printing;
            const online = !hasError;  // Online even while printing
            const error = hasError;

            return {
                status: result.status,
                online: online,              // true when no error conditions
                ready: ready,                // true when no issues and not printing
                connected: result.connected !== false,  // Printer is connected
                printing: printing,          // Bit 7: Currently printing
                paperNearEnd: paperNearEnd,  // Bit 0: Paper running low
                coverOpen: coverOpen,        // Bit 1: Cover is open
                paperOut: paperOut,          // Bit 2: Paper is out
                overheat: overheat,          // Bit 3: Printer head overheat
                error: error,                // true when any error condition exists
                rawStatus: result.status     // Raw status value for debugging
            };
        } catch (error) {
            throw new Error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Get printer information
     * @param {number} infoId - Information ID (0-255)
     * @returns {Promise<Object>} Information data
     */
    async getInformation(infoId) {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.getInformation(this.printerName, infoId);
            if (!result.success) {
                throw new Error(`Get information failed with code ${result.returnCode}`);
            }

            return {
                data: result.data,
                timeout: result.timeout,
                infoId: infoId
            };
        } catch (error) {
            throw new Error(`Failed to get information: ${error.message}`);
        }
    }

    /**
     * Get device information (infoId = 10)
     * @returns {Promise<string>} Device info string
     */
    async getDeviceInfo() {
        const result = await this.getInformation(10);
        return result.data;
    }

    /**
     * Get firmware version (infoId = 11)
     * @returns {Promise<string>} Firmware version
     */
    async getFirmwareVersion() {
        const result = await this.getInformation(11);
        return result.data;
    }

    /**
     * Get serial number (infoId = 12)
     * @returns {Promise<string>} Serial number
     */
    async getSerialNumber() {
        const result = await this.getInformation(12);
        return result.data;
    }

    /**
     * Get mileage/usage counter (infoId = 9)
     * Returns user maintenance counter with print head usage statistics
     * Note: This feature may not be supported on all printer models
     * @returns {Promise<Object>} Mileage data with usage counters
     */
    async getMileage() {
        const result = await this.getInformation(9);
        
        // Type 9 returns 16 bytes:
        // - Bytes 0-3: Number of dot lines energizing head (4 bytes)
        // - Bytes 4-7: Number of fed dot lines (4 bytes)
        // - Bytes 8-11: Number of cuts (4 bytes)
        // - Bytes 12-15: Reserved (4 bytes)
        
        // The data might be returned as a string, convert to buffer properly
        let buffer;
        if (typeof result.data === 'string') {
            // Create buffer from string bytes
            buffer = Buffer.from(result.data.split('').map(c => c.charCodeAt(0)));
        } else if (Buffer.isBuffer(result.data)) {
            buffer = result.data;
        } else {
            buffer = Buffer.from(result.data);
        }
        
        // Check if we have data (some models don't support this)
        if (buffer.length === 0) {
            return {
                supported: false,
                message: 'Mileage counter not supported by this printer model'
            };
        }
        
        // Check if we have enough data
        if (buffer.length < 16) {
            throw new Error(`Expected 16 bytes for mileage data, got ${buffer.length} bytes. Data: ${buffer.toString('hex')}`);
        }
        
        return {
            supported: true,
            dotLinesEnergizing: buffer.readUInt32LE(0),  // Total dot lines printed
            dotLinesFed: buffer.readUInt32LE(4),         // Total paper feed in dot lines
            cuts: buffer.readUInt32LE(8),                // Total number of cuts
            reserved: buffer.readUInt32LE(12),           // Reserved field
            raw: buffer.toString('hex')                  // Raw hex data for debugging
        };
    }

    /**
     * Get model name (infoId = 2)
     * @returns {Promise<string>} Model name
     */
    async getModelName() {
        const result = await this.getInformation(2);
        return result.data;
    }

    /**
     * Reset printer
     * @returns {Promise<boolean>} Success status
     */
    async reset() {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.resetPrinter(this.printerName);
            return result.success;
        } catch (error) {
            throw new Error(`Failed to reset printer: ${error.message}`);
        }
    }

    /**
     * Start a document (for multi-command documents)
     * @returns {Promise<Object>} Document info with jobId
     */
    async startDoc() {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.startDoc(this.printerName);
            if (!result.success) {
                throw new Error(`Start doc failed with code ${result.returnCode}`);
            }
            return { jobId: result.jobId };
        } catch (error) {
            throw new Error(`Failed to start document: ${error.message}`);
        }
    }

    /**
     * End the current document
     * @returns {Promise<boolean>} Success status
     */
    async endDoc() {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.endDoc(this.printerName);
            return result.success;
        } catch (error) {
            throw new Error(`Failed to end document: ${error.message}`);
        }
    }

    /**
     * Cancel the current document
     * @returns {Promise<boolean>} Success status
     */
    async cancelDoc() {
        if (!this.isOpen) {
            throw new Error('Printer not open');
        }

        try {
            const result = addon.cancelDoc(this.printerName);
            return result.success;
        } catch (error) {
            throw new Error(`Failed to cancel document: ${error.message}`);
        }
    }

    /**
     * Format a receipt line with right-aligned price
     * @private
     */
    _formatReceiptLine(name, price, width = 48) {
        const priceStr = typeof price === 'number' ? `$${price.toFixed(2)}` : price.toString();
        
        let itemName = name;
        const maxNameLength = width - priceStr.length - 2;
        
        if (itemName.length > maxNameLength) {
            itemName = itemName.substring(0, maxNameLength - 3) + '...';
        }
        
        const spaces = width - itemName.length - priceStr.length;
        return itemName + ' '.repeat(Math.max(1, spaces)) + priceStr;
    }
}

module.exports = NipponPrinter;
module.exports.NipponPrinter = NipponPrinter;
module.exports.enumeratePrinters = addon.enumeratePrinters;
