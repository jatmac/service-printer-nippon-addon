# Nippon Printer Addon Setup Script
# Run this script as Administrator

Write-Host "=== Nippon Printer Addon Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Paths
$scriptDir = $PSScriptRoot
$libDir = Join-Path $scriptDir "lib\x64"
$nprinterLibPath = "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\x64"

Write-Host "Step 1: Creating lib directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $libDir | Out-Null
Write-Host "  ✓ Directory created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Copying NPrinterLib files..." -ForegroundColor Yellow
if (Test-Path $nprinterLibPath) {
    Copy-Item (Join-Path $nprinterLibPath "*") $libDir -Force
    Write-Host "  ✓ Files copied to lib\x64\" -ForegroundColor Green
} else {
    Write-Host "  ❌ NPrinterLib source path not found: $nprinterLibPath" -ForegroundColor Red
    Write-Host "  Please adjust the path in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Copying NBarCodeLib.dll to system directory..." -ForegroundColor Yellow
$nbarcodeSource = Join-Path $libDir "NBarCodeLib.dll"
$nbarcodeTarget = "C:\Windows\SysWOW64\NBarCodeLib.dll"

if (Test-Path $nbarcodeSource) {
    Copy-Item $nbarcodeSource $nbarcodeTarget -Force
    Write-Host "  ✓ NBarCodeLib.dll copied to SysWOW64" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  NBarCodeLib.dll not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Checking NServiceDrv service..." -ForegroundColor Yellow
$service = Get-Service -Name "NServiceDrv" -ErrorAction SilentlyContinue

if ($null -eq $service) {
    Write-Host "  NServiceDrv not installed. Installing..." -ForegroundColor Yellow
    
    $nserviceExe = "..\service-printer-nippon\NPrinterLib_Windows_4.0.3.0_20250313\Library\NServiceDrv.exe"
    $nserviceTarget = "C:\Windows\SysWOW64\NServiceDrv.exe"
    
    if (Test-Path $nserviceExe) {
        Copy-Item $nserviceExe $nserviceTarget -Force
        sc.exe create NServiceDrv binpath= $nserviceTarget
        sc.exe config NServiceDrv start= auto
        sc.exe start NServiceDrv
        Write-Host "  ✓ NServiceDrv installed and started" -ForegroundColor Green
    } else {
        Write-Host "  ❌ NServiceDrv.exe not found: $nserviceExe" -ForegroundColor Red
        Write-Host "  Please install NServiceDrv manually" -ForegroundColor Yellow
    }
} elseif ($service.Status -ne "Running") {
    Write-Host "  NServiceDrv exists but not running. Starting..." -ForegroundColor Yellow
    Start-Service -Name "NServiceDrv"
    Write-Host "  ✓ NServiceDrv started" -ForegroundColor Green
} else {
    Write-Host "  ✓ NServiceDrv is already running" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dependencies installed and addon built" -ForegroundColor Green
} else {
    Write-Host "  ❌ npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 6: Testing addon..." -ForegroundColor Yellow
npm run test:enum
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now use the Nippon Printer addon:" -ForegroundColor Cyan
    Write-Host "  - npm test          : Run basic tests" -ForegroundColor White
    Write-Host "  - npm run test:enum : List printers" -ForegroundColor White
    Write-Host "  - npm run test:print: Test printing" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Setup completed but tests failed" -ForegroundColor Yellow
    Write-Host "The addon may still work if printers are properly configured" -ForegroundColor Yellow
}

Write-Host ""
