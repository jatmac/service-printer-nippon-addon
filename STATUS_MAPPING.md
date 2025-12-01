# Nippon Printer Status Mapping

## Overview

The Nippon thermal printer uses a simple 3-bit status system to report printer conditions. This document details the status bit mapping discovered through testing.

## Status Bit Definition

| Bit | Hex Value | Condition         | Description                          |
|-----|-----------|-------------------|--------------------------------------|
| 0   | 0x01      | Paper Near End    | Paper roll is running low            |
| 1   | 0x02      | Cover Open        | Printer cover/lid is open            |
| 2   | 0x04      | Paper Out         | Paper roll is empty or not detected  |
| 3   | 0x08      | Overheat          | Printer head temperature too high    |
| 7   | 0x80      | Printing          | Printer is currently processing job  |

## Status Values

The raw status value is a combination of the bits above:

| Value | Hex  | Binary     | Conditions                                    |
|-------|------|------------|-----------------------------------------------|
| 0     | 0x00 | 0b00000000 | **Ready** - No issues, printer ready          |
| 1     | 0x01 | 0b00000001 | Paper Near End                                |
| 2     | 0x02 | 0b00000010 | Cover Open                                    |
| 3     | 0x03 | 0b00000011 | Paper Near End + Cover Open                   |
| 4     | 0x04 | 0b00000100 | Paper Out                                     |
| 5     | 0x05 | 0b00000101 | Paper Near End + Paper Out                    |
| 6     | 0x06 | 0b00000110 | Cover Open + Paper Out                        |
| 7     | 0x07 | 0b00000111 | Paper Near End + Cover Open + Paper Out       |
| 8     | 0x08 | 0b00001000 | Overheat                                      |
| 9     | 0x09 | 0b00001001 | Overheat + Paper Near End                     |
| 10    | 0x0A | 0b00001010 | Overheat + Cover Open                         |
| 11    | 0x0B | 0b00001011 | Overheat + Paper Near End + Cover Open        |
| 12    | 0x0C | 0b00001100 | Overheat + Paper Out                          |
| 13    | 0x0D | 0b00001101 | Overheat + Paper Near End + Paper Out         |
| 14    | 0x0E | 0b00001110 | Overheat + Cover Open + Paper Out             |
| 15    | 0x0F | 0b00001111 | All error conditions (bits 0-3)               |

**Note:** Add 128 (0x80) to any value above when the printer is actively printing (bit 7 set).

**Printing Status Examples:**

- 128 (0x80): Printing, no errors
- 129 (0x81): Printing + Paper Near End
- 132 (0x84): Printing + Paper Out
- 136 (0x88): Printing + Overheat

## API Response

The `getStatus()` method returns an object with the following properties:

```javascript
{
  status: number,        // Raw status value (same as rawStatus)
  rawStatus: number,     // Raw status value from printer (0-255)
  ready: boolean,        // true when no errors and not printing
  online: boolean,       // true when no error conditions (can be printing)
  printing: boolean,     // true when bit 7 is set (actively printing)
  error: boolean,        // true when any error exists (bits 0-3)
  paperNearEnd: boolean, // true when bit 0 is set
  coverOpen: boolean,    // true when bit 1 is set
  paperOut: boolean,     // true when bit 2 is set
  overheat: boolean      // true when bit 3 is set (printer head too hot)
}
```

## Usage Example

```javascript
const NipponPrinter = require('service-printer-nippon-addon');

const printer = new NipponPrinter();
await printer.open('NPI Integration Driver');

const status = await printer.getStatus();

if (status.printing) {
  console.log('Printer is busy printing...');
} else if (status.ready) {
  console.log('Printer is ready!');
} else {
  if (status.paperOut) {
    console.log('Please add paper');
  }
  if (status.paperNearEnd) {
    console.log('Paper running low');
  }
  if (status.coverOpen) {
    console.log('Please close the printer cover');
  }
  if (status.overheat) {
    console.log('Printer overheating - allow to cool down');
  }
}

await printer.close();
```

## Testing

Use the provided test scripts to verify status functionality:

```bash
# Monitor status in real-time
node test/test-status.js

# Detailed status mapping test
node test/test-status-mapping.js
```

The test scripts will display status changes as you manipulate the printer (open cover, remove paper, etc.).

## Important Notes

1. **Status 0 = Ready**: The printer is ready to print when status equals 0 (no bits set)
2. **Multiple Conditions**: Status values can represent multiple conditions simultaneously
3. **Non-Standard Mapping**: This mapping is specific to Nippon printers and differs from standard Windows printer status codes
4. **Paper Near End**: This warning appears before the paper actually runs out, giving you time to replace the roll
5. **Cover Detection**: The cover sensor is typically reliable and triggers immediately when opened
6. **Overheat Protection**: When bit 3 is set, the printer head is too hot. Allow cooling before resuming printing to prevent damage
7. **Printing Status**: Bit 7 (0x80) indicates active printing. The printer is online and processing, but not ready for new jobs
8. **Ready vs Online**: `ready` means idle and available; `online` means operational (can be printing); `error` means problem conditions exist

## Comparison with Standard Windows Status

Unlike standard Windows printer status codes (which use different bit positions), the Nippon printer uses a simplified 3-bit system:

| Feature          | Windows Status | Nippon Status       |
|------------------|----------------|---------------------|
| Online           | Bit 3 (0x08)   | No error bits (0-3) |
| Cover Open       | Bit 2 (0x04)   | Bit 1 (0x02)        |
| Paper Out        | Bit 5 (0x20)   | Bit 2 (0x04)        |
| Paper Near End   | N/A            | Bit 0 (0x01)        |
| Overheat         | N/A            | Bit 3 (0x08)        |
| Printing         | N/A            | Bit 7 (0x80)        |
| Error            | Bit 6 (0x40)   | Bits 0-3 set        |

## Troubleshooting

### Status always shows error

- Check if paper is loaded
- Ensure the cover is fully closed
- Verify printer is powered on and connected

### Paper Near End not triggering

- The sensor may need calibration
- Check the paper roll diameter threshold
- Consult Nippon printer documentation for sensor adjustment

### Cover Open false positives

- Clean the cover sensor
- Check for mechanical issues with the cover latch
- Verify nothing is blocking the cover sensor

### Overheat condition

- Allow printer to cool down (typically 1-5 minutes)
- Check ambient temperature - ensure adequate ventilation
- Reduce print duty cycle or print density
- Continuous heavy printing can trigger overheat protection
