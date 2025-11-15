# Desktop App Icons Guide

## Current Status

Placeholder SVG-based icons have been created in the `build/` directory. These will work for testing but should be replaced with proper icons for production.

## Icon Requirements

### Windows (.ico)
- **Location**: `build/icon.ico`
- **Sizes**: Multi-resolution ICO file with 16x16, 32x32, 48x48, 256x256
- **Format**: ICO format

### macOS (.icns)
- **Location**: `build/icon.icns`
- **Sizes**: Multiple resolutions (16x16 to 1024x1024)
- **Format**: ICNS format

### Linux (.png)
- **Location**: `build/icon.png`
- **Size**: 512x512 or 1024x1024
- **Format**: PNG with transparency

## Creating Professional Icons

### Method 1: Online Tools (Easiest)

1. **Create base design** (1024x1024 PNG):
   - Use Figma, Canva, or Adobe Express
   - Keep it simple and recognizable at small sizes
   - Use your brand colors

2. **Convert to all formats**:
   - Visit https://icon.kitchen/
   - Upload your 1024x1024 PNG
   - Download .ico, .icns, and .png versions
   - Replace files in `build/` directory

### Method 2: Using ImageMagick (Command Line)

```bash
# Install ImageMagick first
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# From a 1024x1024 PNG source:
# For Windows .ico
convert icon-1024.png -define icon:auto-resize=256,128,96,64,48,32,16 build/icon.ico

# For macOS .icns (requires iconutil)
mkdir icon.iconset
sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o build/icon.icns
rm -rf icon.iconset

# For Linux .png
cp icon-1024.png build/icon.png
```

### Method 3: Professional Design Service

1. Hire on Fiverr/Upwork for $20-50
2. Provide brand guidelines
3. Request all three formats

## Design Tips

1. **Simplicity**: Icons must be recognizable at 16x16 pixels
2. **Contrast**: Use high contrast for visibility
3. **Brand Colors**: Match your app's color scheme
4. **No Text**: Avoid text in icons (hard to read when small)
5. **Unique Shape**: Make it distinctive and memorable

## Testing Icons

After replacing icons:

```bash
# Rebuild the app
npm run package

# Check the built application:
# - Windows: Right-click exe → Properties → Details
# - macOS: Get Info on .app file
# - Linux: Check application launcher
```

## Current Placeholder

The current icons are blue with a checkmark/grid design. They will work but are generic.

For production, replace with:
- Your company logo
- Brand-specific design
- Professional quality icons

## Icon Dimensions Reference

| Platform | Format | Dimensions |
|----------|--------|------------|
| Windows | .ico | 16, 32, 48, 256 |
| macOS | .icns | 16-1024 (multiple) |
| Linux | .png | 512 or 1024 |
| PWA | .png | 192, 512 |

---

**Pro Tip**: Keep your source design file (Figma/Sketch/AI) at 1024x1024 so you can easily regenerate icons when needed.
