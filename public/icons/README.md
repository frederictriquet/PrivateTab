# Extension Icons

✅ **Icons have been generated!**

## Generated Files

All icons have been created using the automated icon generation script:

- ✅ **icon16.png** (16x16 pixels, 599 bytes) - Toolbar icon
- ✅ **icon48.png** (48x48 pixels, 1.9 KB) - Extension management page
- ✅ **icon128.png** (128x128 pixels, 5.0 KB) - Chrome Web Store / Firefox Add-ons
- ✅ **icon-locked.png** (48x48 pixels, 1.4 KB) - Locked status badge (red variant)

## Design

The icons feature a modern lock design with:
- **Primary color**: Purple gradient (#667eea → #764ba2)
- **Style**: Flat design with circular background
- **Lock elements**:
  - Rounded lock body (white)
  - Semi-circular shackle
  - Keyhole detail in center
- **Locked variant**: Red background (#ef4444) with white lock icon

## Regenerating Icons

If you need to regenerate the icons (e.g., to change colors or design):

```bash
npm run generate-icons
```

Edit the colors and design in `scripts/generate-icons.js`.

## Custom Icons

To use your own custom icons:
1. Replace the PNG files in this directory
2. Ensure they match the required sizes (16x16, 48x48, 128x128)
3. Use transparent backgrounds (PNG with alpha channel)
4. Keep important elements within 80% of canvas (avoid edges)

## Preview

To preview the icons in your browser:
- Load the extension in Chrome or Firefox
- Check the toolbar for icon16.png
- Visit chrome://extensions/ or about:addons for icon48.png
- The store listing will display icon128.png

---

**Generated**: 2025-11-12
**Script**: scripts/generate-icons.js
**Tool**: Canvas (node-canvas)
