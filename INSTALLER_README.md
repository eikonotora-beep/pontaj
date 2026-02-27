# Building Installers for Pontaj Calendar

## Prerequisites

1. **Node.js and npm** - Already installed ✓
2. **Dependencies installed** - Run if needed:
   ```bash
   npm install
   ```

## Quick Start - Windows Installer

### Build Windows Installer (NSIS)
```bash
npm run dist
```

This creates:
- **Installer**: `dist/Pontaj Calendar Setup 1.0.0.exe` - Full installer with uninstaller
- **Portable**: `dist/Pontaj Calendar-1.0.0-portable.exe` - No installation required

### Build Only Portable Version
```bash
npm run dist:portable
```

## Build Steps Explained

The build process:
1. Builds the React app (`npm run build`)
2. Packages with Electron
3. Creates installer with electron-builder

## Output Location

All installers are created in the `dist/` folder:
```
dist/
  ├── Pontaj Calendar Setup 1.0.0.exe      (Windows Installer - ~80-150MB)
  ├── Pontaj Calendar-1.0.0-portable.exe   (Portable - ~80-150MB)
  └── win-unpacked/                         (Unpacked files)
```

## Installer Features

### NSIS Installer (Default)
- ✅ Custom installation directory
- ✅ Desktop shortcut creation
- ✅ Start menu shortcut
- ✅ Uninstaller
- ✅ Auto-update support (can be enabled)

### Portable Version
- ✅ No installation required
- ✅ Run from USB drive
- ✅ Self-contained

## Testing the Installer

1. **Build the installer**:
   ```bash
   npm run dist
   ```

2. **Locate the installer**:
   - Navigate to `dist/` folder
   - Find `.exe` files

3. **Test installation**:
   - Run the installer
   - Choose installation directory
   - Complete installation
   - Test the app

4. **Test uninstallation**:
   - Use Windows "Add or Remove Programs"
   - Or run uninstaller from installation directory

## Distribution

### File to Distribute
- **For most users**: `Pontaj Calendar Setup 1.0.0.exe`
- **For portable users**: `Pontaj Calendar-1.0.0-portable.exe`

### File Size
- Expect ~80-150MB (includes Electron + Chromium)

### Recommended Upload Locations
- GitHub Releases
- Your website
- Cloud storage (Google Drive, Dropbox)

## Before Building Icon

Currently using a placeholder icon. For professional distribution:

1. **Create or obtain an icon** (512x512 PNG)
2. **Convert to .ico format**:
   - Use https://icoconvert.com/
   - Or use: `npm install -g png-to-ico`
3. **Save as** `public/icon.ico`
4. **Rebuild**: `npm run dist`

See `public/ICON_README.md` for detailed icon instructions.

## Advanced: Build for Multiple Platforms

### All Platforms
```bash
npm run dist:all
```

**Note**: This requires the target platform's tools:
- **macOS**: Requires macOS to build .dmg
- **Linux**: Can build from Windows with WSL

## Updating Version Number

Before building for release:

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.0"  → "1.1.0"
   ```

2. **Rebuild**:
   ```bash
   npm run dist
   ```

The version appears in:
- Installer filename
- App "About" information
- Uninstaller details

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf dist build node_modules
npm install
npm run dist
```

### Icon Not Showing
- Ensure `public/icon.ico` exists
- Check electron-builder config in package.json
- Rebuild completely

### Large File Size
- Normal for Electron apps (Chromium bundle)
- Consider portable version for smaller distribution

### Development vs Production
- **Development**: `npm run electron-dev`
- **Build installer**: `npm run dist`

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start React development server |
| `npm run build` | Build React app only |
| `npm run electron-dev` | Run app in development mode |
| `npm run dist` | Build Windows installer + portable |
| `npm run dist:portable` | Build only portable version |
| `npm run dist:all` | Build for all platforms |

## Code Signing (Optional)

For professional distribution without "Unknown Publisher" warnings:

1. Obtain a code signing certificate
2. Add to `package.json`:
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "password"
   }
   ```
3. See: https://www.electronjs.org/docs/tutorial/code-signing

## Next Steps

1. ✅ Configuration complete
2. 🎨 Add custom icon (`public/icon.ico`)
3. 🔨 Build installer: `npm run dist`
4. ✅ Test installer
5. 📦 Distribute to users

---

**Ready to build?** Run: `npm run dist`
