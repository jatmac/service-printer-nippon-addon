# Nippon Printer Node.js Addon

Native Node.js addon for Nippon thermal printers using the NPrinterLib SDK. This addon provides a high-performance interface to control Nippon thermal printers from Node.js applications.

## Features

- **Native Performance**: Direct access to NPrinterLib through N-API
- **Simple API**: Easy-to-use JavaScript wrapper with async/await support
- **TypeScript Support**: Full TypeScript definitions included
- **Comprehensive**: Supports printing, status monitoring, device information, and more
- **Receipt Printing**: Built-in support for formatted receipt printing
- **ESC/POS Commands**: Support for raw ESC/POS command printing

## Prerequisites

- **Windows OS**: Windows 7 or later (64-bit)
- **Node.js**: Version 16.0.0 or higher
- **NPrinterLib**: Version 4.0.3.0 or compatible
- **NServiceDrv**: Nippon service driver must be installed and running
- **Visual Studio Build Tools**: Required for building the native addon

## Installation

### 1. Install NServiceDrv Service

The NPrinterLib requires the NServiceDrv service to be registered and running:

**For 64-bit Windows:**
```powershell
# Run PowerShell as Administrator

# Copy NServiceDrv.exe
Copy-Item "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\NServiceDrv.exe" "C:\Windows\SysWOW64\"

# Register the service
sc create NServiceDrv binpath= "C:\Windows\SysWOW64\NServiceDrv.exe"

# Set to automatic startup
sc config NServiceDrv start= auto

# Start the service
sc start NServiceDrv

# Verify service is running
sc query NServiceDrv
```

### 2. Copy NPrinterLib Files

Copy the required DLL files to the `lib` directory:

```powershell
# Create lib directory structure
New-Item -ItemType Directory -Force -Path ".\lib\x64"

# Copy DLLs
Copy-Item "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\x64\*.dll" ".\lib\x64\"
Copy-Item "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\x64\*.lib" ".\lib\x64\"

# Also copy NBarCodeLib.dll to system directory (required by NPrinterLib)
Copy-Item "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\x64\NBarCodeLib.dll" "C:\Windows\SysWOW64\"
```

### 3. Install Node.js Package

```bash
npm install
```

This will:
- Install dependencies (node-addon-api)
- Build the native addon using node-gyp
- Copy DLL files to the build directory

## Quick Start

```javascript
const NipponPrinter = require('service-printer-nippon-addon');

async function main() {
    // Enumerate printers
    const printers = NipponPrinter.enumeratePrinters();
    console.log('Available printers:', printers);

    // Select printer (prioritize NPI Integration Driver)
    const printerName = printers.find(p => p.includes('NPI Integration')) ||
                       printers.find(p => p.includes('Microsoft Print to PDF')) ||
                       printers[0];

    // Create printer instance
    const printer = new NipponPrinter();
    
    // Open connection
    await printer.open(printerName);

    // Print text
    await printer.printText('Hello from Nippon Printer!', {
        align: 'center',
        bold: true,
        feed: 3
    });

    // Close connection
    await printer.close();
}

main().catch(console.error);
```

## API Reference

### Static Methods

#### `NipponPrinter.enumeratePrinters()`

Enumerate all available Nippon printers.

**Returns:** `string[]` - Array of printer names/addresses

```javascript
const printers = NipponPrinter.enumeratePrinters();
console.log(printers); // ['192.168.1.100', 'USB001', ...]
```

### Instance Methods

#### `constructor()`

Create a new NipponPrinter instance.

```javascript
const printer = new NipponPrinter();
```

#### `open(printerName)`

Open connection to a printer.

**Parameters:**
- `printerName` (string): Printer name or IP address

**Returns:** `Promise<boolean>` - Success status

```javascript
await printer.open('192.168.1.100');
```

#### `close()`

Close the printer connection.

**Returns:** `Promise<boolean>` - Success status

```javascript
await printer.close();
```

#### `print(data)`

Print raw text data (can include ESC/POS commands).

**Parameters:**
- `data` (string): Raw print data

**Returns:** `Promise<PrintResult>`

```javascript
const result = await printer.print('Hello\n\x1Bi'); // Print and cut
console.log(`Job ID: ${result.jobId}`);
```

#### `printText(text, options)`

Print formatted text with styling options.

**Parameters:**
- `text` (string): Text to print
- `options` (object): Formatting options
  - `initialize` (boolean): Initialize printer (default: true)
  - `align` ('left' | 'center' | 'right'): Text alignment (default: 'left')
  - `width` (number): Text width multiplier 1-8 (default: 1)
  - `height` (number): Text height multiplier 1-8 (default: 1)
  - `bold` (boolean): Enable bold text (default: false)
  - `underline` (boolean): Enable underline (default: false)
  - `feed` (boolean | number): Line feeds after text (default: 1)
  - `cut` ('full' | 'partial' | false): Paper cut type (default: false)

**Returns:** `Promise<PrintResult>`

```javascript
await printer.printText('RECEIPT HEADER', {
    align: 'center',
    width: 2,
    height: 2,
    bold: true,
    feed: 2
});
```

#### `printReceipt(receipt)`

Print a formatted receipt.

**Parameters:**
- `receipt` (object): Receipt structure
  - `header` (string): Header text (centered, double size)
  - `subheader` (string): Subheader text
  - `items` (array): Receipt items `[{ name, price }, ...]`
  - `total` (number | string): Total amount
  - `footer` (string): Footer text (centered)
  - `width` (number): Receipt width in characters (default: 48)

**Returns:** `Promise<PrintResult>`

```javascript
await printer.printReceipt({
    header: 'STORE NAME',
    subheader: 'Thank you for shopping!\n123 Main St\n' + new Date().toLocaleString(),
    items: [
        { name: 'Coffee', price: 3.50 },
        { name: 'Sandwich', price: 7.95 }
    ],
    total: 11.45,
    footer: 'Please come again!'
});
```

#### `getStatus()`

Get current printer status.

**Returns:** `Promise<PrinterStatus>`

```javascript
const status = await printer.getStatus();
console.log(`Online: ${status.online}`);
console.log(`Paper: ${status.paperOut ? 'Out' : 'OK'}`);
console.log(`Cover: ${status.coverOpen ? 'Open' : 'Closed'}`);
```

#### `getInformation(infoId)`

Get printer information by ID.

**Parameters:**
- `infoId` (number): Information ID (0-255)

**Returns:** `Promise<InformationResult>`

Common Info IDs:
- `10`: Device information
- `11`: Firmware version
- `12`: Serial number

```javascript
const info = await printer.getInformation(10);
console.log(`Device Info: ${info.data}`);
```

#### `getDeviceInfo()`

Get device information (shortcut for `getInformation(10)`).

**Returns:** `Promise<string>` - Device info string

```javascript
const deviceInfo = await printer.getDeviceInfo();
```

#### `getFirmwareVersion()`

Get firmware version (shortcut for `getInformation(11)`).

**Returns:** `Promise<string>` - Firmware version

```javascript
const version = await printer.getFirmwareVersion();
```

#### `getSerialNumber()`

Get serial number (shortcut for `getInformation(12)`).

**Returns:** `Promise<string>` - Serial number

```javascript
const serial = await printer.getSerialNumber();
```

#### `reset()`

Reset printer to default state.

**Returns:** `Promise<boolean>` - Success status

```javascript
await printer.reset();
```

#### `startDoc()`

Start a multi-command document.

**Returns:** `Promise<DocumentInfo>` - Document info with job ID

```javascript
const doc = await printer.startDoc();
console.log(`Document started: ${doc.jobId}`);
```

#### `endDoc()`

End the current document.

**Returns:** `Promise<boolean>` - Success status

```javascript
await printer.endDoc();
```

#### `cancelDoc()`

Cancel the current document.

**Returns:** `Promise<boolean>` - Success status

```javascript
await printer.cancelDoc();
```

## Examples

### Basic Printing

```javascript
const NipponPrinter = require('service-printer-nippon-addon');

async function basicPrint() {
    const printers = NipponPrinter.enumeratePrinters();
    const printer = new NipponPrinter();
    
    await printer.open(printers[0]);
    
    await printer.printText('Test Print', {
        align: 'center',
        bold: true,
        cut: 'partial'
    });
    
    await printer.close();
}
```

### Receipt Printing

```javascript
async function printSalesReceipt() {
    const printer = new NipponPrinter();
    await printer.open('192.168.1.100');
    
    await printer.printReceipt({
        header: 'MY STORE',
        subheader: `Date: ${new Date().toLocaleString()}\nCashier: John`,
        items: [
            { name: 'Item 1', price: 10.00 },
            { name: 'Item 2', price: 15.50 },
            { name: 'Item 3', price: 7.25 }
        ],
        total: 32.75,
        footer: 'Thank you!'
    });
    
    await printer.close();
}
```

### Status Monitoring

```javascript
async function monitorPrinter() {
    const printer = new NipponPrinter();
    await printer.open('192.168.1.100');
    
    setInterval(async () => {
        const status = await printer.getStatus();
        console.log({
            timestamp: new Date().toISOString(),
            online: status.online,
            paperOut: status.paperOut,
            coverOpen: status.coverOpen
        });
    }, 5000);
}
```

### Raw ESC/POS Commands

```javascript
async function rawPrint() {
    const printer = new NipponPrinter();
    await printer.open('192.168.1.100');
    
    // ESC/POS commands
    const commands = [
        '\x1B@',      // Initialize
        '\x1Ba\x01',  // Center align
        '\x1BE\x01',  // Bold on
        'HELLO WORLD\n',
        '\x1BE\x00',  // Bold off
        '\x1Ba\x00',  // Left align
        '\x1Bi'       // Cut paper
    ].join('');
    
    await printer.print(commands);
    await printer.close();
}
```

## Testing

Run the included test scripts:

```bash
# Enumerate printers
npm run test:enum

# Basic test
npm test

# Print test
npm run test:print

# Receipt test
npm run test:receipt

# Status monitoring
npm run test:status
```

## Troubleshooting

### "Failed to load NPrinterLib.dll"

**Solution:**
1. Ensure DLLs are in `lib/x64/` directory
2. Verify DLLs are copied to `build/Release/` after build
3. Check that you're running 64-bit Node.js

### "NServiceDrv not running"

**Solution:**
```powershell
# Check service status
sc query NServiceDrv

# Start service if stopped
sc start NServiceDrv

# If service doesn't exist, reinstall it
sc create NServiceDrv binpath= "C:\Windows\SysWOW64\NServiceDrv.exe"
sc start NServiceDrv
```

### "No printers found"

**Solution:**
1. Verify printer is powered on and connected
2. Check NServiceDrv is running: `sc query NServiceDrv`
3. For network printers, verify IP address is reachable
4. Check Windows firewall settings

### Build Errors

**Solution:**
```bash
# Clean and rebuild
npm run clean
npm run build

# If Visual Studio tools are missing, install them
# Download from: https://visualstudio.microsoft.com/downloads/
# Install "Desktop development with C++" workload
```

### NBarCodeLib.dll Missing

**Solution:**
```powershell
# Copy to system directory (run as Administrator)
Copy-Item ".\lib\x64\NBarCodeLib.dll" "C:\Windows\SysWOW64\"
```

## Architecture

```
┌─────────────────────┐
│   Your Node.js App  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   index.js          │  High-level JavaScript API
│   (NipponPrinter)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   binding.cpp       │  N-API Native Addon
│   (C++ Wrapper)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   NPrinterLib.dll   │  Nippon SDK
│   NPrinterCLib.dll  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   NServiceDrv       │  Windows Service
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Nippon Printer     │  Hardware
│  (Thermal Printer)  │
└─────────────────────┘
```

## Performance Considerations

- **Connection Pooling**: Keep printer connections open for multiple operations
- **Async Operations**: All methods are async to prevent blocking
- **Native Performance**: Direct C++ bindings provide minimal overhead
- **Error Handling**: Comprehensive error checking and reporting

## License

This addon wraps the proprietary NPrinterLib SDK. Refer to Nippon Primex Inc. license agreement for SDK usage terms.

## Related Projects

- [service-printer-nippon](../service-printer-nippon) - MQTT-based service using this addon
- [service-printer-seiko-addon](../service-printer-seiko-addon) - Similar addon for Seiko printers

## Support

For issues:
- **NPrinterLib SDK**: Contact Nippon Primex Inc.
- **This Addon**: Open an issue in the project repository

## Version History

### 1.0.0 (2025-11-27)
- Initial release
- Full N-API wrapper for NPrinterLib
- Text and receipt printing support
- Status monitoring and device information
- TypeScript definitions
- Comprehensive test suite
