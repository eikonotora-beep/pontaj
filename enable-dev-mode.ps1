# Enable Windows Developer Mode
# This allows creating symbolic links without admin privileges

Write-Host "=================================" -ForegroundColor Cyan
Write-Host " Enable Windows Developer Mode " -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will enable Developer Mode to allow building installers" -ForegroundColor Yellow
Write-Host "without Administrator privileges." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to enable Developer Mode? (Y/N)"

if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
    Write-Host ""
    Write-Host "Enabling Developer Mode..." -ForegroundColor Green
    
    try {
        # Enable Developer Mode
        $registryPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
        
        if (!(Test-Path $registryPath)) {
            New-Item -Path $registryPath -Force | Out-Null
        }
        
        Set-ItemProperty -Path $registryPath -Name "AllowDevelopmentWithoutDevLicense" -Value 1 -Type DWord
        
        Write-Host ""
        Write-Host "✓ Developer Mode enabled successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run: npm run dist" -ForegroundColor Cyan
    }
    catch {
        Write-Host ""
        Write-Host "✗ Failed to enable Developer Mode" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "This script must be run as Administrator." -ForegroundColor Yellow
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Right-click PowerShell" -ForegroundColor Cyan
        Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Cyan
        Write-Host "3. Run this script again" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Cancelled. Developer Mode not enabled." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Run this as Administrator instead:" -ForegroundColor Cyan
    Write-Host "  npm run dist" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
