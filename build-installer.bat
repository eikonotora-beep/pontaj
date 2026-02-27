@echo off
echo =====================================
echo  Pontaj Calendar - Installer Builder
echo =====================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not found
    pause
    exit /b 1
)
echo ✓ npm found

echo.
echo =====================================
echo  Step 1: Installing Dependencies
echo =====================================
echo.

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed
)

echo.
echo =====================================
echo  Step 2: Building React Application
echo =====================================
echo.

call npm run build
if errorlevel 1 (
    echo ERROR: React build failed
    pause
    exit /b 1
)

echo.
echo =====================================
echo  Step 3: Creating Installer
echo =====================================
echo.

call npm run electron-build
if errorlevel 1 (
    echo ERROR: Installer build failed
    pause
    exit /b 1
)

echo.
echo =====================================
echo  ✓ Build Complete!
echo =====================================
echo.
echo Installers created in 'dist' folder:
echo.

if exist "dist\*.exe" (
    dir /b "dist\*.exe"
) else (
    echo No .exe files found - check for errors above
)

echo.
echo =====================================
echo  Next Steps
echo =====================================
echo.
echo 1. Navigate to the 'dist' folder
echo 2. Run the .exe installer to test
echo 3. Distribute the installer to users
echo.
echo Press any key to open dist folder...
pause >nul

if exist "dist\" (
    explorer "dist"
)
