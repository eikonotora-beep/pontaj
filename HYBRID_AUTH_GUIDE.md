# Hybrid Authentication System
## Desktop (Electron) + Web (Firebase)

Pontaj Calendar now works in both environments with automatic platform detection:

### 🖥️ **Desktop (Electron Installer)**
- **Auth**: Local accounts (stored in browser storage)
- **Data**: All stored locally
- **Internet**: ❌ Not required
- **Usage**: Employee personal laptops, local PCs

### 🌐 **Web (GitHub Pages)**
- **Auth**: Firebase authentication
- **Data**: Synced to Firebase cloud
- **Internet**: ✅ Required
- **Usage**: Browser access, multi-device sync

## How It Works

### Auto-Detection
The app automatically detects its environment:

```typescript
if running in Electron (desktop app)
  → Use local auth + local storage
else (running in browser)
  → Use Firebase auth + cloud sync
```

### Desktop Flow
1. Open installer → App runs in Electron
2. Fill email + password → Creates local account
3. All data saved to browser storage (no internet needed)
4. Data survives app restarts, PC restarts
5. Accessible only on that PC

### Web Flow
1. Visit GitHub Pages URL → App loads in browser
2. Login with Firebase account
3. All data synced to Firebase cloud
4. Access from any device, anytime
5. Requires internet connection

## Technical Implementation

### Files Modified
- `src/utils/platform.ts` - Platform detection
- `src/utils/localAuth.ts` - Desktop auth (local only)
- `src/utils/authAdapter.ts` - Unified auth interface
- `src/components/Login.tsx` - Adaptive login UI
- `src/App.tsx` - Adaptive app logic

### Architecture

```
┌──────────────────────────────┐
│   App (React components)     │
│   Login, Calendar, etc.      │
└──────────────┬───────────────┘
               │
        ┌──────▼──────┐
        │ authAdapter │ (unified interface)
        └──────┬──────┘
               │
      ┌────────┴────────┐
      │                 │
   (Electron)       (Browser)
      │                 │
┌─────▼──────┐  ┌──────▼─────┐
│ localAuth  │  │  Firebase  │
│(local stor)│  │ (cloud DB) │
└────────────┘  └────────────┘
```

## Login Credentials

### Desktop (First Time)
```
Email: any@email.com
Password: 4+ characters
→ Creates local account stored in PC
```

### Web (GitHub Pages)
```
Email: Firebase account email
Password: Firebase account password
→ Syncs with Firebase
```

## Data Storage

### Desktop
```
Location: Browser localStorage
Survives: App restart, PC restart
Lost if: Clear browser storage
Backup:  Export to Excel button
```

### Web
```
Location: Firebase Firestore database
Survives: Forever (cloud backup)
Lost if: Delete Firebase project
Backup:  Built-in cloud storage
```

## Features by Platform

| Feature | Desktop | Web |
|---------|---------|-----|
| Registration | ✅ Local | ✅ Firebase |
| Login Offline | ✅ Yes | ❌ No |
| Auto-sync | ❌ No | ✅ Yes |
| Multi-device | ❌ No | ✅ Yes |
| Data Backup | Manual | Automatic |
| Internet Need | ❌ No | ✅ Yes |
| Speed | ⚡ Fast | Normal |

## Development

### Build for Desktop
```bash
npm run dist
# Creates: dist/Pontaj Calendar Setup 1.0.0.exe
# Uses: Local auth
```

### Deploy for Web
```bash
npm run deploy
# Deploys to GitHub Pages
# Uses: Firebase auth
```

### Test Both
```bash
# Desktop
npm run electron-dev

# Web
npm start
# Open: http://localhost:3000
```

## Security

### Desktop
- ✅ No internet connection = no risk
- ⚠️ Simple password hashing (client-side)
- ⚠️ Passwords visible to developer tools
- ✅ Data never leaves PC

### Web
- ✅ HTTPS encrypted (GitHub Pages)
- ✅ Firebase bcrypt hashing
- ✅ Secure authentication
- ✅ Cloud backup

### Production Recommendations

For enterprise desktop deployment:
- Add server-side password hashing
- Implement secure session tokens
- Add activity logging
- Consider encryption at rest

## Troubleshooting

### Desktop: "User already exists"
- Already registered on this PC
- Use same password to login
- Or use different email to create new account

### Desktop: "Can't remember password"
- No password recovery implemented yet
- Reinstall app to create new account
- Export data before reinstalling

### Web: "Login failed - check internet"
- No internet connection
- Use desktop version (works offline)
- Or fix internet and retry

### Web: "Firebase error"
- Firebase project misconfigured
- Check credentials in src/utils/firebase.ts
- Verify Firebase project is active

## Future Enhancements

- [ ] local server sync option
- [ ] password reset via email
- [ ] encrypted local storage
- [ ] multi-user support on same PC
- [ ] cloud backup for desktop
- [ ] biometric login (fingerprint)

## Migration Between Platforms

### From Desktop to Web
1. Open desktop app
2. Click "Export to Excel"
3. Save the file
4. Login to web version
5. Create calendars manually
6. Entries auto-sync to cloud

### From Web to Desktop
1. Login to web, export data
2. Install desktop app
3. Register account
4. Import the spreadsheet (future feature)

## FAQ

**Q: Can I use same account on desktop and web?**
A: No. Desktop uses local accounts, web uses Firebase accounts. They're separate systems.

**Q: Will my data on desktop sync to web?**
A: Not automatically. Must export from desktop, import to web (feature in development).

**Q: What if I uninstall the desktop app?**
A: Data remains in localStorage until you clear browser storage.

**Q: Can multiple people use the desktop app?**
A: Yes! Each person registers separate account. Each account has own data.

**Q: Is my data safe?**
A: Desktop: safe as long as you don't share PC passwords
Web: safe (Firebase HTTPS + cloud backup)

---

**Status**: ✅ Hybrid system implemented
**Desktop**: Working with local auth
**Web**: Working with Firebase auth
**Auto-detection**: ✅ Automatic
