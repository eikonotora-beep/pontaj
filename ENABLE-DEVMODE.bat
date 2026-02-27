@echo off
echo =====================================
echo  Enabling Windows Developer Mode
echo =====================================
echo.
echo This will allow building installers without admin rights.
echo.
pause

powershell -Command "Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' -Name 'AllowDevelopmentWithoutDevLicense' -Value 1 -Type DWord"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo  SUCCESS! Developer Mode Enabled
    echo =====================================
    echo.
    echo Now you can build the installer:
    echo   npm run dist
    echo.
) else (
    echo.
    echo =====================================
    echo  ERROR: Permission Denied
    echo =====================================
    echo.
    echo Please right-click this file and
    echo select "Run as administrator"
    echo.
)

pause
