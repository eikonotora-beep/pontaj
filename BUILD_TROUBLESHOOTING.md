# Build Error: Symbolic Link Permission Issue

## The Problem

When building the installer, you're seeing:
```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
```

This is a Windows security restriction that prevents creating symbolic links without special privileges.

## Solutions (Choose One)

### ✅ Solution 1: Enable Developer Mode (Recommended - One Time Setup)

**Option A: Via PowerShell Script**
1. Right-click PowerShell → **Run as Administrator**
2. Navigate to project: `cd "C:\Users\alexa\Pontaj"`
3. Run: `.\enable-dev-mode.ps1`
4. Restart current terminal
5. Run: `npm run dist`

**Option B: Via Windows Settings**
1. Open **Windows Settings** (Win + I)
2. Go to **Update & Security** > **For developers**
3. Turn on **Developer Mode**
4. Restart terminal
5. Run: `npm run dist`

### ✅ Solution 2: Run as Administrator (Every Time)

1. Close current PowerShell
2. Right-click **PowerShell** → **Run as Administrator**
3. Navigate: `cd "C:\Users\alexa\Pontaj"`
4. Run: `npm run dist`

### ✅ Solution 3: Create Portable App Only

If you just need a working .exe without an installer:

```powershell
# Build React app
npm run build

# Copy build to portable folder
New-Item -ItemType Directory -Force -Path "portable"
Copy-Item -Recurse -Force "build\*" "portable\"
Copy-Item "public\electron.js" "portable\"
Copy-Item "public\preload.js" "portable\"

# The portable folder can now be zipped and distributed
```

Then users can run: `npm install electron -g` and `electron portable/electron.js`

## Why This Happens

electron-builder downloads signing tools (winCodeSign) that contain symbolic links. On Windows, creating symbolic links requires either:
- Administrator privileges, OR
- Developer Mode enabled

## After Enabling Developer Mode

Once Developer Mode is enabled, you'll be able to:
- Build installers without admin rights
- Create symbolic links freely
- Use various development tools

No downside - Developer Mode is meant for developers!

## Verify Developer Mode is Active

Run this in PowerShell:
```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" | Select-Object AllowDevelopmentWithoutDevLicense
```

Should show: `AllowDevelopmentWithoutDevLicense : 1`

## Still Having Issues?

Try clearing the cache:
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"
npm run dist
```

---

**Ready to build?**
- With Developer Mode: `npm run dist`
- As Administrator: Run PowerShell as admin, then `npm run dist`
