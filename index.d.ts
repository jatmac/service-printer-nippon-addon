/**
 * Nippon Thermal Printer Node.js N-API Addon
 * TypeScript definitions
 */

declare module 'service-printer-nippon-addon' {
    /**
     * Print options for formatted text printing
     */
    export interface PrintOptions {
        /** Initialize printer before printing (default: true) */
        initialize?: boolean;
        /** Text alignment: 'left', 'center', or 'right' (default: 'left') */
        align?: 'left' | 'center' | 'right';
        /** Text width multiplier (1-8) */
        width?: number;
        /** Text height multiplier (1-8) */
        height?: number;
        /** Enable bold text */
        bold?: boolean;
        /** Enable underline */
        underline?: boolean;
        /** Number of line feeds after text, or true for 3 lines */
        feed?: boolean | number;
        /** Paper cut type: 'full' or 'partial', or false for no cut */
        cut?: 'full' | 'partial' | false;
    }

    /**
     * Receipt item
     */
    export interface ReceiptItem {
        /** Item name */
        name: string;
        /** Item price */
        price: number | string;
    }

    /**
     * Receipt structure
     */
    export interface Receipt {
        /** Receipt header (centered, double size) */
        header?: string;
        /** Subheader text */
        subheader?: string;
        /** Array of receipt items */
        items?: ReceiptItem[];
        /** Total amount */
        total?: number | string;
        /** Footer text (centered) */
        footer?: string;
        /** Receipt width in characters (default: 48) */
        width?: number;
    }

    /**
     * Printer status information
     */
    export interface PrinterStatus {
        /** Raw status code */
        status: number;
        /** Printer is online */
        online: boolean;
        /** Printer is ready (no errors and not printing) */
        ready: boolean;
        /** Printer is connected and responding */
        connected: boolean;
        /** Currently printing */
        printing: boolean;
        /** Paper is near end */
        paperNearEnd: boolean;
        /** Cover is open */
        coverOpen: boolean;
        /** Paper is out */
        paperOut: boolean;
        /** Printer head overheat */
        overheat: boolean;
        /** Error condition */
        error: boolean;
        /** Error message (if error occurred) */
        errorMessage?: string;
        /** Return code from the status call */
        returnCode?: number;
        /** Raw status value */
        rawStatus: number;
    }

    /**
     * Print result
     */
    export interface PrintResult {
        /** Operation succeeded */
        success: boolean;
        /** Job ID assigned by printer */
        jobId: number;
        /** Return code from printer */
        returnCode: number;
    }

    /**
     * Information result
     */
    export interface InformationResult {
        /** Information data string */
        data: string;
        /** Timeout value used */
        timeout: number;
        /** Information ID requested */
        infoId: number;
    }

    /**
     * Document info
     */
    export interface DocumentInfo {
        /** Job ID for the document */
        jobId: number;
    }

    /**
     * Main Nippon Printer class
     */
    export class NipponPrinter {
        constructor();

        /**
         * Get list of available Nippon printers
         * @returns Array of printer names/addresses
         */
        static enumeratePrinters(): string[];

        /**
         * Open connection to printer
         * @param printerName - Printer name or IP address
         * @returns Promise resolving to success status
         */
        open(printerName: string): Promise<boolean>;

        /**
         * Close connection to printer
         * @returns Promise resolving to success status
         */
        close(): Promise<boolean>;

        /**
         * Print raw text data (can include ESC/POS commands)
         * @param data - Text data to print
         * @returns Promise resolving to print result
         */
        print(data: string): Promise<PrintResult>;

        /**
         * Print formatted text with options
         * @param text - Text to print
         * @param options - Print formatting options
         * @returns Promise resolving to print result
         */
        printText(text: string, options?: PrintOptions): Promise<PrintResult>;

        /**
         * Print receipt with formatted sections
         * @param receipt - Receipt data structure
         * @returns Promise resolving to print result
         */
        printReceipt(receipt: Receipt): Promise<PrintResult>;

        /**
         * Get printer status
         * @returns Promise resolving to status information
         */
        getStatus(): Promise<PrinterStatus>;

        /**
         * Get printer information by ID
         * @param infoId - Information ID (0-255)
         * @returns Promise resolving to information data
         */
        getInformation(infoId: number): Promise<InformationResult>;

        /**
         * Get device information (infoId = 10)
         * @returns Promise resolving to device info string
         */
        getDeviceInfo(): Promise<string>;

        /**
         * Get firmware version (infoId = 11)
         * @returns Promise resolving to firmware version
         */
        getFirmwareVersion(): Promise<string>;

        /**
         * Get serial number (infoId = 12)
         * @returns Promise resolving to serial number
         */
        getSerialNumber(): Promise<string>;

        /**
         * Reset printer to default state
         * @returns Promise resolving to success status
         */
        reset(): Promise<boolean>;

        /**
         * Start a multi-command document
         * @returns Promise resolving to document info with job ID
         */
        startDoc(): Promise<DocumentInfo>;

        /**
         * End the current document
         * @returns Promise resolving to success status
         */
        endDoc(): Promise<boolean>;

        /**
         * Cancel the current document
         * @returns Promise resolving to success status
         */
        cancelDoc(): Promise<boolean>;

        /** Current printer name (null if not open) */
        printerName: string | null;

        /** Whether printer connection is open */
        isOpen: boolean;
    }

    /**
     * Enumerate printers (static function export)
     * @returns Array of printer names/addresses
     */
    export function enumeratePrinters(): string[];

    export default NipponPrinter;
}
