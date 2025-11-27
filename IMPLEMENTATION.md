# Nippon Printer N-API Addon - Implementation Documentation

## Overview

This document describes the implementation process of converting the Nippon NPrinterLib C++ sample application into a Node.js N-API native addon.

## Project Structure

```
service-printer-nippon-addon/
├── src/
│   └── binding.cpp          # N-API C++ bindings
├── test/
│   ├── test-basic.js        # Basic functionality test
│   ├── test-enumerate.js    # Printer enumeration test
│   ├── test-receipt.js      # Receipt printing test
│   ├── test-status.js       # Status monitoring test
│   ├── test-print.js        # Formatting test
│   ├── test-helpers.js      # Test utility functions
│   └── test-config.js       # Test configuration
├── index.js                 # High-level JavaScript API
├── index.d.ts              # TypeScript definitions
├── binding.gyp             # Build configuration
├── package.json            # NPM package configuration
└── README.md               # User documentation
```

## Implementation Approach

### 1. Analyzing the C++ Source

**Source Material:**
- Original file: `dllCheckXE3/untDllCheck.cpp` (2180 lines)
- NPrinterLib SDK: Version 4.0.3.0
- Architecture: Windows-only, x64

**Key Findings:**
- NPrinterLib.dll provides the printer API
- No static `.lib` file available (DLL-only distribution)
- Functions must be loaded dynamically via `LoadLibrary`
- Uses a custom hex string format for print data

**Critical Functions Identified:**
```cpp
typedef INT (WINAPI *lpNEnumPrinters)(PWCHAR, PINT);
typedef INT (WINAPI *lpNOpenPrinter)(PWCHAR, BOOL, void*);
typedef INT (WINAPI *lpNClosePrinter)(PWCHAR);
typedef INT (WINAPI *lpNPrint)(PWCHAR, PCHAR, DWORD, PDWORD);
typedef INT (WINAPI *lpNGetStatus)(PWCHAR, LPDWORD);
typedef INT (WINAPI *lpNGetInformation)(PWCHAR, BYTE, PVOID, PDWORD);
typedef INT (WINAPI *lpNResetPrinter)(PWCHAR, void*);
typedef INT (WINAPI *lpNStartDoc)(PWCHAR, PDWORD);
typedef INT (WINAPI *lpNEndDoc)(PWCHAR);
typedef INT (WINAPI *lpNCancelDoc)(PWCHAR);
```

### 2. N-API Binding Architecture

**Challenge:** Napi::Function::New() Template Deduction Issues

**Initial Error:**
```
error C2672: 'Napi::Function::New': no matching overloaded function found
error C2783: no overloaded function could convert all the argument types
```

**Root Cause:**
N-API couldn't deduce the correct template type when passing function pointers directly.

**Solution:**
Created explicit wrapper functions to avoid template ambiguity:

```cpp
// Instead of:
exports.Set("enumeratePrinters", Napi::Function::New(env, EnumeratePrinters));

// We use:
Napi::Value EnumeratePrintersWrapper(const Napi::CallbackInfo& info) {
    return EnumeratePrinters(info);
}
exports.Set("enumeratePrinters", Napi::Function::New(env, EnumeratePrintersWrapper));
```

### 3. Build Configuration

**Challenge:** Missing NPrinterLib.lib File

**Initial Error:**
```
LINK : fatal error LNK1181: cannot open input file 'NPrinterLib.lib'
```

**Solution:**
Removed static linking requirement from `binding.gyp`:

```python
# Before:
'libraries': [
    'winspool.lib',
    '<(module_root_dir)/lib/NPrinterLib.lib'  # This file doesn't exist
]

# After:
'libraries': [
    'winspool.lib'  # Only link Windows print spooler
]
```

**Rationale:**
- NPrinterLib uses DLL-only distribution
- Functions are loaded dynamically via `LoadLibrary` at runtime
- No static linking required

### 4. Data Format Discovery

**Challenge:** Understanding NPrinterLib's Print Data Format

**Initial Approach (Failed):**
Used standard ESC/POS binary commands:
```javascript
printData += '\x1B@';        // Initialize
printData += '\x1Ba\x01';    // Center align
printData += text;
```

**Result:** Garbled output

**Investigation:**
Examined C++ sample code:
```cpp
str = "1d\"P\"00"
      "0a"
      "1C\"!\"06"
      "\"Text goes here\"0a";
```

**Discovery:**
NPrinterLib uses a custom hex string format:
- Hex bytes written as ASCII hex digits: `1B40` (not `\x1B\x40`)
- Text wrapped in quotes: `"Hello World"`
- Commands concatenated: `1B6101"Center Text"0A`

**Final Solution:**
```javascript
printData += '1B40';              // ESC @ (initialize)
printData += '1B6101';            // ESC a 1 (center)
printData += '1C2106';            // FS ! 6 (double size)
printData += '"Hello World"';     // Text in quotes
printData += '0A';                // Line feed
```

### 5. Text Size Command Investigation

**Challenge:** Incorrect Text Size Implementation

**Attempt 1:** Standard ESC/POS GS ! n
```javascript
// GS ! n (0x1D 0x21 n)
// Bits 0-3: width, Bits 4-7: height
const size = ((w & 0x07) | ((h & 0x07) << 4));
printData += '\x1D!' + String.fromCharCode(size);
```
**Result:** All text except "LARGE" was garbled

**Attempt 2:** Swapped width/height bits
```javascript
const size = ((h & 0x07) | ((w & 0x07) << 4));
```
**Result:** Still garbled

**Analysis of C++ Sample:**
```cpp
"1C\"!\"00"  // Normal size
"1C\"!\"06"  // Double size (2x2)
"1C\"!\"20"  // Large size (bold + double)
```

**Discovery:**
Nippon printers use FS ! n (0x1C 0x21 n), not GS ! n (0x1D 0x21 n), with specific size codes:
- `0x00` = Normal (1x1)
- `0x06` = Double (2x2)
- `0x20` = Large (3x3+)

**Final Implementation:**
```javascript
let sizeCode = '00';
if (w >= 3 || h >= 3) {
    sizeCode = '20';  // Large
} else if (w === 2 && h === 2) {
    sizeCode = '06';  // Double
}
printData += `1C21${sizeCode}`;  // FS ! n in hex string format
```

### 6. Printer Selection Logic

**Challenge:** Tests Defaulting to Wrong Printer

**Issue:**
Tests were selecting BIXOLON SRP-G300 instead of NPI Integration Driver.

**Solution:**
Implemented priority-based printer selection:

```javascript
// test-config.js
module.exports = {
    printerPriority: [
        'NPI Integration Driver',
        'Microsoft Print to PDF',
        'XPS Card Printer'
    ],
    skipPrinters: [
        'BIXOLON',
        'OneNote',
        'Fax'
    ]
};

// test-helpers.js
function selectBestPrinter(printers) {
    for (const preferred of config.printerPriority) {
        const found = printers.find(p => 
            p.includes(preferred) && 
            !config.skipPrinters.some(skip => p.includes(skip))
        );
        if (found) return found;
    }
    return printers[0];
}
```

### 7. Code Quality Improvements

**Challenge:** Unicode Icons in Terminal Output

**Issue:**
Icons (✅✓❌⚠️→) caused display issues in some terminals.

**Solution:**
Replaced with ASCII equivalents:
- ✅ → `[SUCCESS]`
- ✓ → `[OK]`
- ❌ → `[ERROR]`
- ⚠️ → `[WARNING]`
- → → `*`

## Key Technical Decisions

### 1. Dynamic Library Loading

**Decision:** Use `LoadLibrary` instead of static linking

**Rationale:**
- NPrinterLib doesn't provide `.lib` files
- More flexible for DLL version updates
- Matches the original C++ implementation pattern

### 2. Hex String Format

**Decision:** Use NPrinterLib's custom hex string format

**Rationale:**
- Native format expected by NPrinterLib
- Simplifies text and command mixing
- Avoids binary encoding issues

### 3. Synchronous JavaScript API with Async Wrapper

**Decision:** C++ bindings are synchronous, JavaScript API uses async/await

**Implementation:**
```javascript
async open(printerName) {
    const result = addon.openPrinter(printerName);  // Synchronous C++ call
    if (result.success) {
        this.printerName = printerName;
        this.isOpen = true;
        return true;
    }
    throw new Error(`Open failed with code ${result.returnCode}`);
}
```

**Rationale:**
- Maintains simple C++ implementation
- Provides modern JavaScript API
- Allows future async implementation if needed

### 4. Wrapper Functions for N-API

**Decision:** Create explicit wrapper functions instead of direct exports

**Implementation:**
```cpp
Napi::Value EnumeratePrintersWrapper(const Napi::CallbackInfo& info) {
    return EnumeratePrinters(info);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("enumeratePrinters", 
                Napi::Function::New(env, EnumeratePrintersWrapper));
    return exports;
}
```

**Rationale:**
- Resolves template deduction issues
- Cleaner error messages during compilation
- More explicit type conversion

## ESC/POS Command Reference (Nippon Format)

### Basic Commands
| Command | Hex String | Description |
|---------|-----------|-------------|
| Initialize | `1B40` | ESC @ - Reset printer |
| Line Feed | `0A` | LF - New line |
| Form Feed | `0C` | FF - Page break |

### Alignment
| Command | Hex String | Description |
|---------|-----------|-------------|
| Left Align | `1B6100` | ESC a 0 |
| Center Align | `1B6101` | ESC a 1 |
| Right Align | `1B6102` | ESC a 2 |

### Text Formatting
| Command | Hex String | Description |
|---------|-----------|-------------|
| Bold ON | `1B4501` | ESC E 1 |
| Bold OFF | `1B4500` | ESC E 0 |
| Underline ON | `1B2D01` | ESC - 1 |
| Underline OFF | `1B2D00` | ESC - 0 |

### Text Size (Nippon Specific)
| Size | Hex String | Description |
|------|-----------|-------------|
| Normal (1x1) | `1C2100` | FS ! 0 |
| Double (2x2) | `1C2106` | FS ! 6 |
| Large (3x3+) | `1C2120` | FS ! 32 |

### Paper Control
| Command | Hex String | Description |
|---------|-----------|-------------|
| Feed n dots | `1B4A60` | ESC J 96 (feed before cut) |
| Full Cut | `1B69` | ESC i |
| Partial Cut | `1B6D` | ESC m |

### Text Format
All text must be wrapped in quotes:
```javascript
printData += '"Hello World"';
printData += '"Line 1"0A"Line 2"0A';
```

## Testing Strategy

### Test Suite Structure

1. **test-enumerate.js** - Printer discovery
   - Validates NEnumPrinters function
   - Lists all available printers
   - Verifies NPI Integration Driver presence

2. **test-basic.js** - Core functionality
   - Open/close printer connections
   - Simple text printing
   - Job ID verification

3. **test-status.js** - Status monitoring
   - Real-time status polling
   - Error condition detection
   - Paper out detection

4. **test-print.js** - Formatting tests
   - Text alignment (left, center, right)
   - Text styling (bold, underline)
   - Text sizing (normal, double, large)
   - Combined formatting

5. **test-receipt.js** - Receipt printing
   - Structured receipt format
   - Item list formatting
   - Total calculation
   - Paper cutting

## Lessons Learned

### 1. N-API Template Deduction
**Issue:** Direct function pointer passing fails with template deduction errors.
**Solution:** Always use explicit wrapper functions for N-API exports.

### 2. DLL-Only Libraries
**Issue:** Not all Windows libraries provide .lib files for static linking.
**Solution:** Use LoadLibrary/GetProcAddress pattern for dynamic loading.

### 3. Vendor-Specific Formats
**Issue:** Assuming standard ESC/POS format led to garbled output.
**Solution:** Always reference vendor documentation and sample code for data formats.

### 4. Command Set Variations
**Issue:** Different printers use different ESC/POS command variants.
**Solution:** Test with actual hardware and compare against vendor samples.

### 5. Character Encoding
**Issue:** Unicode vs ANSI function variants in Windows APIs.
**Solution:** Use wide character (WCHAR) variants and proper UTF-8 conversion.

## Performance Considerations

### Memory Management
- DLL handle cached globally to avoid repeated LoadLibrary calls
- Function pointers loaded once at initialization
- No memory leaks detected in testing

### Print Speed
- Commands sent synchronously (acceptable for thermal printers)
- Job IDs returned immediately
- Actual printing happens in Windows spooler

### Error Handling
- All functions return structured error codes
- JavaScript wrapper throws descriptive errors
- Status codes mapped to boolean flags

## Future Enhancements

### Potential Improvements
1. **Async C++ Implementation** - Use libuv for true async operations
2. **Image Printing** - Implement NImagePrint wrapper
3. **Barcode Support** - Add NBarcode/NBarcode2 functions
4. **Network Printing** - Support TCP/IP printer connections
5. **Callback Support** - Implement NSetCallback for async notifications

### API Extensions
1. **Template Engine** - Built-in receipt templating
2. **QR Codes** - High-level QR code generation
3. **Logo Printing** - Automatic image conversion
4. **Batch Printing** - Queue multiple jobs

## Conclusion

The conversion from C++ to N-API addon required:
1. Understanding vendor-specific print data formats
2. Resolving N-API template deduction issues
3. Implementing dynamic library loading
4. Creating a clean JavaScript API layer
5. Comprehensive testing with actual hardware

The final implementation provides a robust, type-safe Node.js interface to the Nippon NPrinterLib SDK while maintaining compatibility with the original C++ functionality.

## References

- **NPrinterLib SDK**: Version 4.0.3.0 (March 13, 2025)
- **node-addon-api**: Version 7.0.0
- **N-API Documentation**: https://nodejs.org/api/n-api.html
- **ESC/POS Reference**: (Vendor-specific implementation)
