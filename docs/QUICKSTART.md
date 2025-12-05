# Quick Start Guide

## ✅ Build Successful!

The Nippon Printer N-API addon has been successfully converted from the C++ sample program.

## 📦 What Was Created

- **Native Addon**: C++ N-API bindings to NPrinterLib
- **JavaScript API**: High-level async/await interface  
- **TypeScript Support**: Full type definitions
- **Test Suite**: 5 test files for different scenarios
- **Documentation**: Comprehensive README

## 🚀 Quick Start

### 1. Setup (One-time, as Administrator)

```powershell
# Run the setup script
.\setup.ps1
```

This will:
- Copy NPrinterLib DLLs
- Install NServiceDrv service
- Build the native addon
- Run tests

### 2. Manual Setup (if needed)

```powershell
# Copy library files
New-Item -ItemType Directory -Force -Path ".\lib\x64"
Copy-Item "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\x64\*" ".\lib\x64\"

# Build addon
npm install
```

### 3. Test

```bash
# List printers
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

## 💻 Usage Example

```javascript
const NipponPrinter = require('service-printer-nippon-addon');

async function example() {
    // List printers
    const printers = NipponPrinter.enumeratePrinters();
    console.log('Available printers:', printers);

    // Create printer instance
    const printer = new NipponPrinter();
    
    // Open connection
    await printer.open(printers[0]);

    // Print text
    await printer.printText('Hello from Nippon!', {
        align: 'center',
        bold: true,
        width: 2,
        height: 2,
        feed: 3,
        cut: 'partial'
    });

    // Print receipt
    await printer.printReceipt({
        header: 'STORE NAME',
        items: [
            { name: 'Item 1', price: 10.00 },
            { name: 'Item 2', price: 15.50 }
        ],
        total: 25.50,
        footer: 'Thank you!'
    });

    // Get status
    const status = await printer.getStatus();
    console.log('Printer status:', status);

    // Close connection
    await printer.close();
}

example().catch(console.error);
```

## 📁 File Structure

```
service-printer-nippon-addon/
├── binding.gyp              # Build configuration
├── package.json             # NPM package
├── index.js                 # JavaScript API
├── index.d.ts              # TypeScript definitions
├── README.md               # Full documentation
├── setup.ps1               # Setup script
├── src/
│   └── binding.cpp         # C++ N-API wrapper
├── lib/
│   └── x64/                # NPrinterLib DLLs (copied during setup)
├── test/
│   ├── test-basic.js       # Basic test
│   ├── test-enumerate.js   # List printers
│   ├── test-print.js       # Format test
│   ├── test-receipt.js     # Receipt test
│   └── test-status.js      # Status monitor
└── build/
    └── Release/
        └── nippon_printer.node  # Compiled addon
```

## 🔧 Troubleshooting

### No printers found

1. Check NServiceDrv is running:
   ```powershell
   sc query NServiceDrv
   ```

2. Start if stopped:
   ```powershell
   sc start NServiceDrv
   ```

### Build errors

1. Clean and rebuild:
   ```bash
   npm run clean
   npm run build
   ```

2. Ensure Visual Studio Build Tools are installed

### Runtime errors

1. Verify DLLs are in `build/Release/`:
   - NPrinterLib.dll
   - NPrinterCLib.dll
   - NBarCodeLib.dll

2. Check NBarCodeLib.dll is in `C:\Windows\SysWOW64\`

## 📚 API Reference

See [README.md](README.md) for complete API documentation.

### Main Methods

- `enumeratePrinters()` - List available printers
- `open(printerName)` - Connect to printer
- `close()` - Disconnect
- `print(data)` - Print raw data
- `printText(text, options)` - Print formatted text
- `printReceipt(receipt)` - Print structured receipt
- `getStatus()` - Get printer status
- `getInformation(id)` - Get device info
- `reset()` - Reset printer

## 🔗 Related

- **service-printer-nippon**: MQTT service using this addon
- **C++ Sample**: NPrinterLib_Windows_4.0.3.0_20250313/Document/dllCheckXE3

## 📄 License

This addon wraps the proprietary NPrinterLib. See Nippon Primex license terms.

## ✨ Next Steps

1. Integrate into your Node.js application
2. Use with the MQTT service (service-printer-nippon)
3. Customize receipt formatting as needed
4. Add barcode printing support (future enhancement)

## 🆘 Support

- **Addon Issues**: Check logs in `npm-debug.log`
- **NPrinterLib Issues**: Contact Nippon Primex Inc.
- **Documentation**: See README.md
