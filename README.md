# PrivateTab Browser Extension

A cross-browser extension for Chrome and Firefox that allows you to mark tabs as "private" and protect their content with password authentication.

## Features

- **Mark tabs as private**: Easily designate which tabs contain sensitive information
- **Password protection**: Content is hidden behind a secure password overlay
- **Auto-lock on tab switch**: Private tabs automatically lock when you navigate away
- **Cross-browser support**: Works seamlessly on both Chrome and Firefox
- **Secure encryption**: Uses PBKDF2 with 100,000+ iterations for password hashing
- **Keyboard shortcuts**: Quick access with customizable hotkeys
- **Minimal permissions**: Only requests necessary permissions for functionality

## Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/privatetab.git
   cd privatetab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**

   For Chrome:
   ```bash
   npm run build:chrome
   ```

   For Firefox:
   ```bash
   npm run build:firefox
   ```

4. **Load the extension**

   **Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/chrome` directory

   **Firefox:**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist/firefox` directory

### From Web Stores

- **Chrome Web Store**: [Coming soon]
- **Firefox Add-ons**: [Coming soon]

## Usage

### First-Time Setup

1. Click the PrivateTab icon in your browser toolbar
2. Set up your master password (required on first use)
3. Your password is securely hashed and never stored in plain text

### Marking Tabs as Private

**Method 1: Using the popup**
- Click the PrivateTab icon
- Toggle "Mark as Private" for the current tab

**Method 2: Using keyboard shortcut**
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

### Unlocking Private Tabs

When you switch to a private tab, you'll see a password overlay:
1. Enter your master password
2. Click "Unlock" or press Enter
3. The tab content will be revealed

### Managing Private Tabs

- **View all private tabs**: Click the PrivateTab icon to see a list
- **Remove private status**: Click the toggle to unmark a tab
- **Lock all tabs**: Use the "Lock All" button or press `Ctrl+Shift+L`

### Changing Your Password

1. Open the PrivateTab popup
2. Click the settings icon
3. Select "Change Master Password"
4. Enter your current password and new password

## Development

### Project Structure

```
PrivateTab/
├── src/
│   ├── background/      # Background service worker
│   ├── content/         # Content scripts and overlay
│   ├── popup/           # Extension popup UI
│   └── shared/          # Shared types and utilities
├── public/
│   └── icons/           # Extension icons
├── tests/               # Test files
└── dist/                # Build output
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:chrome` - Dev build for Chrome
- `npm run dev:firefox` - Dev build for Firefox
- `npm run build` - Build for both browsers
- `npm run build:chrome` - Production build for Chrome
- `npm run build:firefox` - Production build for Firefox
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Lint code
- `npm run type-check` - Check TypeScript types
- `npm run format` - Format code with Prettier

### Technology Stack

- **Language**: TypeScript
- **UI Framework**: React
- **Build Tool**: Vite with @crxjs/vite-plugin
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Browser APIs**: Manifest V3 (Chrome & Firefox)

## Security

PrivateTab takes security seriously:

- **Password hashing**: PBKDF2-SHA256 with 100,000+ iterations
- **No plaintext storage**: Passwords are never stored in readable form
- **Minimal permissions**: Only requests necessary browser permissions
- **CSP compliant**: No inline scripts or unsafe evaluations
- **Local storage only**: No data is sent to external servers
- **Rate limiting**: Protection against brute-force password attempts

### Security Best Practices

1. **Use a strong master password**: Minimum 8 characters with mixed case, numbers, and symbols
2. **Don't reuse passwords**: Use a unique password for PrivateTab
3. **Lock tabs when away**: Use auto-lock timer for additional security
4. **Keep extension updated**: Install updates promptly for security fixes

## Privacy

PrivateTab respects your privacy:

- ✅ All data is stored locally on your device
- ✅ No analytics or tracking
- ✅ No external network requests
- ✅ No data collection or telemetry
- ✅ Open source for transparency

## Troubleshooting

### Extension not working after browser restart

Try reloading the extension:
- Chrome: Go to `chrome://extensions/`, find PrivateTab, and click the reload icon
- Firefox: Go to `about:debugging`, find PrivateTab, and click "Reload"

### Forgot master password

Unfortunately, if you forget your master password, you'll need to:
1. Remove the extension
2. Reinstall it
3. Set up a new master password

This is by design - we cannot recover your password as it's securely hashed.

### Content still visible briefly when switching tabs

This is normal. The content script needs a moment to inject the overlay. The delay should be minimal (<100ms).

## Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (enforced by ESLint/Prettier)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits focused and atomic

## Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development plans.

**Upcoming features:**
- [ ] Auto-lock timer (configurable timeout)
- [ ] Biometric authentication support
- [ ] Multiple password profiles
- [ ] Tab categories and organization
- [ ] Dark mode
- [ ] Import/export settings
- [ ] Sync across devices (optional, privacy-respecting)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Report bugs**: [GitHub Issues](https://github.com/yourusername/privatetab/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/yourusername/privatetab/discussions)
- **Security issues**: Please email security@example.com

## Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [@crxjs/vite-plugin](https://crxjs.dev/)
- Icons from [Heroicons](https://heroicons.com/)
- Inspired by the need for better privacy in browser tabs

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

**Made with ❤️ for privacy-conscious users**
