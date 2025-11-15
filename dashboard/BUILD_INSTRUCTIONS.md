# SD Platform - Desktop Build Instructions

## Overview
SD Platform is now a **hybrid web and desktop application** that works both online and offline.

## Features
- **Desktop App**: Native Windows, macOS, and Linux applications
- **Web App**: Works in any modern browser
- **Offline Mode**: Continue working without internet connection
- **Auto-Sync**: Automatically syncs when connection is restored
- **Local Storage**: All data cached locally for offline access

---

## Prerequisites

Before building, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Git (optional)

---

## Installation

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

This will install:
- Electron (for desktop app)
- Vite (build tool)
- React and all dependencies
- PWA support for offline mode
- Electron Builder (for packaging)

---

## Development

### Run as Web App (Development)
```bash
npm run dev
```
Opens at http://localhost:5173

### Run as Desktop App (Development)
```bash
npm run electron-dev
```
Launches Electron window with hot-reload

---

## Building for Desktop

### Build for All Platforms
```bash
npm run package
```

### Build for Specific Platform

**Windows:**
```bash
npm run package-win
```
Creates:
- `release/SD Platform Setup.exe` (Installer)
- `release/SD Platform.exe` (Portable)

**macOS:**
```bash
npm run package-mac
```
Creates:
- `release/SD Platform.dmg` (Installer)
- `release/SD Platform-mac.zip` (Archive)

**Linux:**
```bash
npm run package-linux
```
Creates:
- `release/SD Platform.AppImage` (Universal)
- `release/SD Platform.deb` (Debian/Ubuntu)

---

## Output Location

All built applications will be in:
```
dashboard/release/
```

---

## Distribution

### For Windows Users:
Share `SD Platform Setup.exe` or `SD Platform.exe` (portable)

### For macOS Users:
Share `SD Platform.dmg`

### For Linux Users:
Share `SD Platform.AppImage` (no installation needed)

---

## Installation on User's Computer

### Windows
1. Double-click `SD Platform Setup.exe`
2. Follow installation wizard
3. Desktop shortcut created automatically
4. Launch from Start Menu or Desktop

### macOS
1. Open `SD Platform.dmg`
2. Drag "SD Platform" to Applications folder
3. Launch from Applications or Spotlight

### Linux
1. Make AppImage executable: `chmod +x SD\ Platform.AppImage`
2. Double-click or run: `./SD\ Platform.AppImage`

---

## Offline Functionality

### How It Works:
1. **First Use**: Requires internet to login and sync initial data
2. **Cached Data**: All projects, resources, and settings stored locally
3. **Offline Editing**: Make changes without internet
4. **Auto-Sync**: Changes sync automatically when online
5. **Conflict Resolution**: Latest changes always win

### Local Data Location:
- **Windows**: `%APPDATA%/sd-platform-desktop/local-data/`
- **macOS**: `~/Library/Application Support/sd-platform-desktop/local-data/`
- **Linux**: `~/.config/sd-platform-desktop/local-data/`

---

## Web Version (PWA)

The app also works as a Progressive Web App in browsers:

1. Visit your hosted URL
2. Click "Install" in browser
3. Works offline after first visit
4. Updates automatically

---

## Troubleshooting

### Build fails on Windows:
- Install Windows Build Tools: `npm install --global windows-build-tools`

### Build fails on macOS:
- Ensure Xcode Command Line Tools installed: `xcode-select --install`

### Build fails on Linux:
- Install required packages: `sudo apt-get install -y libgtk-3-dev libnotify-dev`

### App won't start:
- Check antivirus isn't blocking
- Run as administrator (Windows)
- Check app permissions (macOS)

---

## File Sizes

Expected installer sizes:
- Windows: ~150MB
- macOS: ~180MB
- Linux: ~160MB

---

## Updating the App

### For Developers:
1. Update version in `package.json`
2. Rebuild: `npm run package`
3. Distribute new installers

### For Users:
- Desktop app checks for updates on launch
- Web version updates automatically
- No action required

---

## Configuration

Edit these files to customize:
- `package.json` - App metadata and build settings
- `electron.js` - Desktop window settings
- `.env` - Supabase credentials (DO NOT share)

---

## Security Notes

1. **.env file**: Never include in distributions
2. **Local data**: Encrypted at rest on user's machine
3. **Supabase keys**: Use Row Level Security
4. **Updates**: Sign installers for production use

---

## Support

For issues or questions:
1. Check console logs (Ctrl+Shift+I / Cmd+Option+I)
2. Check local-data folder for corruption
3. Clear cache and reinstall if needed

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Web development server |
| `npm run electron-dev` | Desktop development |
| `npm run build` | Build web version |
| `npm run package` | Build desktop for all platforms |
| `npm run package-win` | Build Windows installer |
| `npm run package-mac` | Build macOS installer |
| `npm run package-linux` | Build Linux installer |

---

## Next Steps

1. Build the desktop version: `npm run package`
2. Test the installer on your OS
3. Distribute to users
4. Users can work offline!

Enjoy your hybrid web + desktop app!
