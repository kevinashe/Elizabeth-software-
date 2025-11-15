# Quick Start - Build Your Desktop App

## Super Simple 3-Step Process

### Step 1: Install Dependencies
```bash
cd dashboard
npm install
```
Wait for packages to install (2-3 minutes)

### Step 2: Build Desktop App
```bash
npm run package
```
This creates installers for your operating system in the `release/` folder.

Build time: 5-10 minutes

### Step 3: Find Your Installer

Look in `dashboard/release/` folder:

**Windows Users:**
- `SD Platform Setup.exe` (installer)
- `SD Platform.exe` (portable - no install needed)

**Mac Users:**
- `SD Platform.dmg`

**Linux Users:**
- `SD Platform.AppImage`

---

## Install and Run

### Windows
Double-click `SD Platform Setup.exe` → Follow wizard → Done!

### Mac
Open `SD Platform.dmg` → Drag to Applications → Launch!

### Linux
```bash
chmod +x SD\ Platform.AppImage
./SD\ Platform.AppImage
```

---

## Build Only for Your OS

**Windows only:**
```bash
npm run package-win
```

**Mac only:**
```bash
npm run package-mac
```

**Linux only:**
```bash
npm run package-linux
```

---

## Test Before Building

Want to test the desktop app first?

```bash
npm run electron-dev
```

This opens the app window for testing.

---

## Distribution

To share with others:
1. Find installer in `dashboard/release/`
2. Upload to cloud storage or email
3. Users download and install
4. They can use it offline!

---

## That's It!

Your app now works as:
- Desktop application (Windows/Mac/Linux)
- Web application (browser)
- Offline-capable
- Auto-syncing

Questions? Check `BUILD_INSTRUCTIONS.md` for detailed info.
