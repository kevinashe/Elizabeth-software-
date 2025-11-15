# SD Platform - Hybrid System Guide

Complete guide for running the platform as both a desktop application and web application.

## Overview

The SD Platform now supports both deployment modes:

- **Desktop App**: Electron-based native application (Windows, Mac, Linux)
- **Web App**: Progressive Web App (PWA) with offline capabilities
- **Shared Backend**: Both use the same Supabase database for real-time sync

## Features

### Desktop Application
- Native OS integration
- System tray support
- Local file system access
- Auto-updates
- Enhanced performance

### Web Application
- Installable PWA
- Offline-first architecture
- Service worker caching
- Cross-platform browser support
- No installation required

### Shared Features
- Real-time data synchronization via Supabase
- Offline support with local storage
- Automatic sync when back online
- State persistence across sessions

## Quick Start

### Development

#### Web Version
```bash
cd dashboard
npm install
npm run dev
```
Access at: http://localhost:3000

#### Desktop Version
```bash
cd dashboard
npm install
npm run dev:electron
```

### Production Build

#### Build Everything
```bash
cd dashboard
./build-all.sh
```

#### Build Web Only
```bash
cd dashboard
npm run build
```
Output: `./dist/`

#### Build Desktop Only
```bash
cd dashboard
npm run build:electron
```
Output: `./release/`

Desktop installers created:
- **Mac**: `.dmg` and `.zip`
- **Windows**: `.exe` (NSIS installer) and portable
- **Linux**: `.AppImage` and `.deb`

## Environment Setup

Create `dashboard/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture

### State Management
- **Zustand**: Client-side state management
- **Persistence**: LocalStorage for offline support
- **Sync**: Automatic background sync with Supabase

### Data Flow
```
User Action
    ↓
Zustand Store (Local State)
    ↓
Supabase Client
    ↓
Database (Shared)
    ↓
Real-time Updates
    ↓
All Connected Clients
```

### Offline Strategy
1. All actions update local state immediately
2. Network requests execute in background
3. Failed requests queued for retry
4. Auto-sync when connection restored

## Project Structure

```
dashboard/
├── electron/              # Electron app files
│   ├── main.js           # Main process
│   └── preload.js        # Preload script
├── src/
│   ├── lib/
│   │   └── supabase.ts   # Supabase client
│   ├── store/
│   │   └── platformStore.ts  # State management
│   ├── App.tsx
│   └── main.tsx
├── dist/                 # Web build output
├── release/              # Desktop build output
├── package.json
├── vite.config.ts        # Vite + PWA config
└── build-all.sh          # Build script
```

## Deployment

### Web Deployment
Deploy the `dist/` folder to:
- Vercel
- Netlify
- Azure Static Web Apps
- Any static hosting

### Desktop Distribution
Distribute installers from `release/`:
- Upload to GitHub Releases
- Distribute directly to users
- Set up auto-update server

## Testing

### Test Offline Mode
1. Open browser DevTools
2. Network tab → Throttle to "Offline"
3. Verify app continues to work
4. Make changes (stored locally)
5. Go back online
6. Verify sync occurs automatically

### Test Desktop App
```bash
npm run dev:electron
```
- Test native menus
- Verify window state persistence
- Check system integration

## Troubleshooting

### Desktop app won't start
- Check Node.js version (18+ required)
- Run `npm install` again
- Delete `node_modules` and reinstall

### Web app not installing
- Ensure HTTPS (required for PWA)
- Check manifest.json is generated
- Verify service worker registration

### Sync issues
- Check Supabase credentials in `.env`
- Verify network connectivity
- Check browser console for errors
- Ensure RLS policies are configured

## Next Steps

1. **Authentication**: Add user auth via Supabase Auth
2. **Real-time Updates**: Implement Supabase Realtime subscriptions
3. **Push Notifications**: Add desktop notifications
4. **Auto-Updates**: Configure Electron auto-updater
5. **Analytics**: Track usage across platforms

## Support

For issues or questions:
- Check logs in browser console (web)
- Check main process logs (desktop)
- Review Supabase dashboard for errors
