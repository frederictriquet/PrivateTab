# PrivateTab - Project Structure

## Directory Layout

```
PrivateTab/
├── public/                          # Static assets
│   └── icons/                       # Extension icons
│       ├── icon16.png              # Toolbar icon (TODO)
│       ├── icon48.png              # Extension management (TODO)
│       ├── icon128.png             # Chrome Web Store (TODO)
│       ├── icon-locked.png         # Locked tab indicator (TODO)
│       └── README.md               # Icon requirements guide
│
├── src/                             # Source code
│   ├── background/                  # Background service worker
│   │   ├── index.ts                # Entry point
│   │   ├── tab-manager.ts          # Tab state management
│   │   ├── storage-manager.ts      # Storage operations
│   │   ├── crypto.ts               # Password hashing/encryption
│   │   └── message-handler.ts      # Message routing
│   │
│   ├── content/                     # Content scripts
│   │   ├── index.ts                # Entry point
│   │   ├── overlay-manager.ts      # Overlay injection/management
│   │   └── styles.css              # Overlay styles
│   │
│   ├── popup/                       # Extension popup
│   │   ├── index.html              # Popup HTML
│   │   ├── index.tsx               # React entry point
│   │   ├── App.tsx                 # Main popup component
│   │   ├── components/             # Popup components (TODO)
│   │   │   ├── TabList.tsx         # List of private tabs
│   │   │   ├── TabItem.tsx         # Single tab item
│   │   │   ├── MasterPassword.tsx  # Password setup/change
│   │   │   ├── Settings.tsx        # Settings panel
│   │   │   └── QuickActions.tsx    # Lock all, unlock buttons
│   │   └── styles.css              # Popup styles
│   │
│   └── shared/                      # Shared code
│       ├── types/                  # TypeScript types
│       │   ├── index.ts            # Core types (PrivateTab, Settings, etc.)
│       │   └── messages.ts         # Message types
│       ├── constants.ts            # Constants and config
│       └── utils.ts                # Utility functions
│
├── tests/                           # Test files
│   ├── unit/                       # Unit tests
│   │   └── shared/
│   │       └── utils.test.ts       # Utility function tests
│   ├── integration/                # Integration tests (TODO)
│   ├── mocks/                      # Mock data and utilities (TODO)
│   └── setup.ts                    # Test setup with Chrome API mocks
│
├── scripts/                         # Build and utility scripts
│   └── zip-extension.js            # Package for store submission
│
├── docs/                            # Documentation (TODO)
│   ├── ARCHITECTURE.md             # Technical architecture
│   ├── API.md                      # Internal API documentation
│   ├── SECURITY.md                 # Security implementation details
│   └── USER_GUIDE.md               # User-facing documentation
│
├── dist/                            # Build output (gitignored)
│   ├── chrome/                     # Chrome build
│   └── firefox/                    # Firefox build
│
├── packages/                        # Store packages (gitignored)
│   ├── privatetab-chrome.zip       # Chrome Web Store package
│   └── privatetab-firefox.zip      # Firefox Add-ons package
│
├── manifest.json                    # Base manifest file
├── package.json                     # NPM dependencies
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.node.json               # TypeScript for build scripts
├── vite.config.ts                   # Vite build configuration
├── vitest.config.ts                 # Vitest test configuration
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── .gitignore                       # Git ignore rules
├── README.md                        # Project overview
├── ROADMAP.md                       # Development roadmap
├── PROJECT_STRUCTURE.md             # This file
├── LICENSE                          # MIT License
├── CHANGELOG.md                     # Version history
└── specs.md                         # Original specifications (French)
```

---

## Key File Descriptions

### Core Extension Files

#### `manifest.json`
Main extension manifest with permissions, background script, content scripts, and popup configuration.

**Key sections:**
- `manifest_version: 3` - Uses Manifest V3 for modern browser support
- `permissions: ["storage", "activeTab", "scripting", "tabs"]` - Minimal required permissions
- `background.service_worker` - Points to background/index.ts
- `action.default_popup` - Points to popup/index.html
- `content_scripts` - Injected into all URLs
- `commands` - Keyboard shortcuts (Ctrl+Shift+P, Ctrl+Shift+L)
- `content_security_policy` - Security restrictions

#### `src/background/index.ts`
Background service worker entry point. Initializes all managers and sets up event listeners.

**Responsibilities:**
- Initialize TabManager, StorageManager, and MessageHandler
- Set up tab event listeners (onActivated, onRemoved, onUpdated)
- Route messages from content scripts and popup
- Handle keyboard commands
- Manage extension lifecycle (install, update)

**Dependencies:**
- TabManager - Manages private tab state
- StorageManager - Handles all storage operations
- MessageHandler - Routes and handles all messages

#### `src/background/tab-manager.ts`
Manages the state and operations of private tabs.

**Key methods:**
- `toggleTabPrivate(tabId, isPrivate)` - Mark/unmark tab as private
- `lockTab(tabId)` - Lock a tab (show overlay)
- `unlockTab(tabId)` - Unlock a tab (hide overlay)
- `lockAllTabs()` - Lock all private tabs
- `getAllPrivateTabs()` - Get list of all private tabs
- `handleTabActivated(tabId)` - Auto-lock on tab switch
- `handleTabRemoved(tabId)` - Cleanup on tab close
- `handleTabUpdated(tabId, tab)` - Update tab info on navigation

**Internal state:**
- `privateTabs: Map<number, PrivateTab>` - In-memory tab registry

#### `src/background/storage-manager.ts`
Handles all storage operations with Chrome Storage API.

**Key methods:**
- `initialize()` - Set up default values on first run
- `getMasterPasswordHash()` / `saveMasterPasswordHash()` - Password hash operations
- `hasMasterPassword()` - Check if password is set
- `getPrivateTabs()` / `savePrivateTabs()` - Private tabs persistence
- `getSettings()` / `saveSettings()` / `updateSettings()` - Settings management
- `getSession()` / `updateSession()` - Session state tracking
- `clearAll()` - Reset extension (debugging)

**Storage schema:**
- `masterPasswordHash: { hash, salt, iterations }`
- `privateTabs: Record<tabId, PrivateTab>`
- `settings: Settings`
- `session: SessionState`

#### `src/background/crypto.ts`
Cryptographic operations for password security.

**Key methods:**
- `hashPassword(password, salt?)` - PBKDF2 hash generation (100k iterations)
- `verifyPassword(password, hash, salt, iterations)` - Constant-time verification
- `validatePassword(password)` - Strength validation (min 8 chars)

**Security features:**
- PBKDF2-SHA256 with 100,000 iterations
- Random salt generation (16 bytes)
- Base64 encoding for storage
- Web Crypto API for all operations

#### `src/background/message-handler.ts`
Routes and handles all messages between extension components.

**Handles message types:**
- Password verification (VERIFY_PASSWORD, SET_MASTER_PASSWORD, etc.)
- Tab management (GET_PRIVATE_TABS, MARK_TAB_PRIVATE, LOCK_ALL_TABS)
- Settings (GET_SETTINGS, UPDATE_SETTINGS)
- Tab status (GET_CURRENT_TAB_STATUS, TAB_LOCKED, TAB_UNLOCKED)

**Security features:**
- Rate limiting on password attempts (5 max, 5-minute lockout)
- Password attempt tracking per tab
- Secure message validation

#### `src/content/index.ts`
Content script entry point. Injected into all tabs.

**Responsibilities:**
- Listen for lock/unlock messages from background
- Initialize OverlayManager
- Check initial lock status on page load
- Relay password verification results

#### `src/content/overlay-manager.ts`
Manages the privacy overlay UI that hides page content.

**Key methods:**
- `showOverlay()` - Display password overlay
- `hideOverlay()` - Remove overlay and reveal content
- `showError(message)` - Display error message
- `createOverlay()` - Build overlay DOM structure
- `handleUnlock()` - Process password submission

**UI features:**
- Full-screen overlay with blur backdrop
- Password input form with validation
- Lock icon and description
- Error message display
- Loading states during verification
- Keyboard event handling
- Click/context menu prevention

**Styling:**
- z-index: 2147483647 (maximum)
- Backdrop blur effect
- Gradient background
- Modern card design
- Responsive layout
- Smooth animations

#### `src/content/styles.css`
Styles for the content script overlay.

**Features:**
- Full-screen overlay styling
- Form input styling
- Error message animations
- Fade-in animation for overlay
- Page interaction prevention

#### `src/popup/index.html`
HTML template for the popup. Minimal structure with a root div.

#### `src/popup/index.tsx`
React entry point for the popup. Renders App component into root div.

#### `src/popup/App.tsx`
Main popup component with tab management UI.

**Features:**
- Current tab status display
- Toggle private status for current tab
- List of all private tabs with lock status
- Master password setup flow
- Lock all tabs button
- Visual indicators (locked/unlocked badges)
- Empty state message
- Keyboard shortcut hint

**State management:**
- `currentTab` - Active tab info and status
- `privateTabs` - Array of all private tabs
- `hasMasterPassword` - Password setup status
- `showPasswordSetup` - Setup wizard visibility
- `loading` - Loading state
- `error` - Error message display

**Message passing:**
- Communicates with background script via chrome.runtime.sendMessage
- Handles responses for all operations
- Real-time updates on tab status changes

#### `src/popup/styles.css`
Comprehensive styles for the popup UI.

**Design features:**
- 400px width, max 600px height
- Gradient header (purple theme)
- Card-based layout
- Hover effects on interactive elements
- Status indicators (red for locked, green for unlocked)
- Empty state illustration
- Smooth transitions
- Custom scrollbar styling
- Form input styling

#### `src/shared/types/index.ts`
Core TypeScript types for the extension.

**Key types:**
- `PrivateTab` - Private tab data structure
- `StorageData` - Complete storage schema
- `Settings` - User settings
- `SessionState` - Session tracking
- `TabStatus` - Tab state enum ('private-locked' | 'private-unlocked' | 'normal')
- `DEFAULT_SETTINGS` - Default settings object

#### `src/shared/types/messages.ts`
Message types for component communication.

**Message categories:**
- Content → Background (VERIFY_PASSWORD, TAB_LOCKED, etc.)
- Background → Content (LOCK_TAB, UNLOCK_TAB, etc.)
- Popup → Background (GET_PRIVATE_TABS, MARK_TAB_PRIVATE, etc.)
- Background → Popup (PRIVATE_TABS_LIST, TAB_STATUS_CHANGED, etc.)

**Type safety:**
- Each message has a specific interface
- Union type `ExtensionMessage` for all messages
- Full TypeScript coverage for all communication

#### `src/shared/constants.ts`
Global constants for the extension.

**Constants:**
- `STORAGE_KEYS` - Chrome storage key names
- `SECURITY` - Security settings (iterations, min length, max attempts, lockout duration)
- `UI` - UI constants (z-index, delays, max lengths)
- `EXTENSION` - Extension metadata (name, version)
- `DEFAULTS` - Default configuration values

#### `src/shared/utils.ts`
Utility functions used throughout the extension.

**Key functions:**
- `stringifyError(error)` - Safe error stringification
- `isProtectableUrl(url)` - Check if URL can be protected
- `generateSalt()` - Random salt generation
- `arrayBufferToBase64()` / `base64ToArrayBuffer()` - Encoding utilities
- `debounce(func, wait)` - Debounce helper
- `formatTimestamp(timestamp)` - Human-readable time formatting
- `validatePasswordStrength(password)` - Password strength checker

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Tabs                          │
│                       (Web Pages)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Content Script Injection
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Content Script                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  overlay-manager.ts                                 │    │
│  │  • Checks tab privacy status                        │    │
│  │  • Shows/hides overlay                              │    │
│  │  • Handles password input                           │    │
│  │  • Prevents page interaction when locked            │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ chrome.runtime.sendMessage()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Service Worker                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  tab-manager.ts                                     │    │
│  │  • Tracks private tabs (Map<tabId, PrivateTab>)    │    │
│  │  • Manages lock states                              │    │
│  │  • Handles tab lifecycle events                     │    │
│  │  • Injects content scripts                          │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  storage-manager.ts                                 │    │
│  │  • Persists tab states                              │    │
│  │  • Stores master password hash                      │    │
│  │  • Manages settings and session                     │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  crypto.ts                                          │    │
│  │  • Hashes passwords (PBKDF2-SHA256)                │    │
│  │  • Verifies passwords                               │    │
│  │  • Validates password strength                      │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  message-handler.ts                                 │    │
│  │  • Routes messages between components               │    │
│  │  • Rate limits password attempts                    │    │
│  │  • Coordinates operations                           │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ chrome.runtime.sendMessage()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Extension Popup                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  App.tsx (React Component)                          │    │
│  │  • Displays current tab status                      │    │
│  │  • Lists all private tabs                           │    │
│  │  • Toggles privacy status                           │    │
│  │  • Master password setup wizard                     │    │
│  │  • Lock all tabs button                             │    │
│  │  • Visual lock/unlock indicators                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

                     ▼ ▲
              ┌─────────────┐
              │   Chrome    │
              │   Storage   │
              │  (Local)    │
              └─────────────┘
```

---

## Message Passing Flow

### Example: Marking a Tab as Private

```
1. User clicks "Mark as Private" in popup
   ↓
2. Popup sends: { type: 'MARK_TAB_PRIVATE', tabId: 123, isPrivate: true }
   ↓
3. Background (MessageHandler) receives message
   ↓
4. MessageHandler → TabManager.toggleTabPrivate(123, true)
   ↓
5. TabManager:
   - Creates PrivateTab object
   - Adds to privateTabs Map
   - Calls StorageManager.savePrivateTabs()
   - Injects content script into tab
   - Sends LOCK_TAB message to content script
   ↓
6. Content script receives LOCK_TAB
   ↓
7. OverlayManager.showOverlay()
   ↓
8. Page content is hidden, overlay displayed
```

### Example: Unlocking a Tab

```
1. User enters password in overlay
   ↓
2. Content script sends: { type: 'VERIFY_PASSWORD', password: 'xxx', tabId: 123 }
   ↓
3. Background (MessageHandler) receives message
   ↓
4. MessageHandler.handleVerifyPassword():
   - Checks rate limiting (max 5 attempts)
   - Gets stored password hash from StorageManager
   - Calls CryptoService.verifyPassword()
   ↓
5. If valid:
   - TabManager.unlockTab(123)
   - Updates PrivateTab.isLocked = false
   - Sends UNLOCK_TAB to content script
   ↓
6. Content script receives UNLOCK_TAB
   ↓
7. OverlayManager.hideOverlay()
   ↓
8. Page content revealed
```

---

## Storage Schema

### Chrome Storage Local

```typescript
{
  // Master password (PBKDF2 hash)
  masterPasswordHash: {
    hash: string;          // Base64 encoded hash
    salt: string;          // Base64 encoded salt (16 bytes)
    iterations: number;    // PBKDF2 iterations (100,000)
  },

  // Private tabs registry
  privateTabs: {
    [tabId: string]: {
      id: number;
      url: string;
      title: string;
      isLocked: boolean;
      markedAt: number;        // Timestamp (Date.now())
      lastUnlocked?: number;   // Timestamp
    }
  },

  // Settings
  settings: {
    autoLockTimeout: number;        // Minutes (0 = never)
    lockOnTabSwitch: boolean;       // Auto-lock on tab change
    showNotifications: boolean;     // Show notifications
    theme: 'light' | 'dark' | 'auto';
    protectIncognito: boolean;      // Protect incognito tabs
  },

  // Session state
  session: {
    lastActivity: number;           // Timestamp
    unlockedTabs: number[];         // Currently unlocked tab IDs
  }
}
```

---

## Build Configuration

### Development

```bash
npm run dev              # Start dev server with hot reload
npm run dev:chrome       # Chrome-specific dev build
npm run dev:firefox      # Firefox-specific dev build
```

**Features:**
- Hot module replacement (HMR)
- Source maps enabled
- Fast refresh for React components
- Auto-reload on file changes
- Port 5173 (configurable)

### Production Build

```bash
npm run build            # Build for both browsers
npm run build:chrome     # Chrome production build
npm run build:firefox    # Firefox production build
```

**Output:**
- `dist/chrome/` - Chrome extension bundle
- `dist/firefox/` - Firefox extension bundle

**Features:**
- Minified code
- Tree shaking
- Code splitting
- Optimized assets
- Production source maps

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run lint             # Lint code
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
```

### Packaging

```bash
npm run package          # Create ZIP files for store submission
```

**Output:**
- `packages/privatetab-chrome.zip` - Chrome Web Store package
- `packages/privatetab-firefox.zip` - Firefox Add-ons package

---

## Dependencies

### Core Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

### Build Tools

```json
{
  "vite": "^5.3.1",
  "@crxjs/vite-plugin": "^2.0.0-beta.23",
  "@vitejs/plugin-react": "^4.3.1",
  "typescript": "^5.5.2"
}
```

### Development Dependencies

```json
{
  "@types/chrome": "^0.0.268",
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0",
  "vitest": "^1.6.0",
  "@vitest/coverage-v8": "^1.6.0",
  "eslint": "^8.57.0",
  "@typescript-eslint/eslint-plugin": "^7.13.1",
  "@typescript-eslint/parser": "^7.13.1",
  "prettier": "^3.3.2"
}
```

---

## Security Considerations

### File-Level Security

1. **manifest.json**:
   - Minimal permissions (storage, activeTab, scripting, tabs)
   - Strict CSP (no eval, no inline scripts)
   - Host permissions limited to <all_urls> for content script injection only

2. **crypto.ts**:
   - All password operations isolated
   - PBKDF2 with 100k+ iterations
   - Web Crypto API only (no custom crypto)
   - Constant-time comparison for password verification

3. **storage-manager.ts**:
   - No plaintext passwords stored
   - Salt stored separately from hash
   - Settings validated before storage

4. **overlay-manager.ts**:
   - CSP-compliant UI (no inline scripts/styles)
   - Maximum z-index to prevent overlay bypass
   - Event prevention to block page interaction

5. **message-handler.ts**:
   - Rate limiting on password attempts
   - Message source validation
   - Error messages don't leak sensitive info

### Security Checklist

- ✅ No use of `eval()`, `Function()`, `innerHTML` with user data
- ✅ All external inputs validated and sanitized
- ✅ CSP-compliant code (no inline scripts/styles)
- ✅ Secure message validation
- ✅ Proper error handling (no sensitive info in errors)
- ✅ Rate limiting on password attempts
- ✅ PBKDF2 with 100k iterations
- ✅ Random salt per installation
- ✅ No plaintext password storage
- ✅ Constant-time password comparison

---

## Browser Compatibility

### Chrome/Chromium
- **Minimum version**: 109
- **Manifest**: V3
- **APIs**: Full support for all used APIs

### Firefox
- **Minimum version**: 109
- **Manifest**: V3
- **APIs**: Full support with `browser` namespace
- **Special handling**: `browser_specific_settings` in manifest

### API Compatibility
- `chrome.storage.local` ✅
- `chrome.tabs` ✅
- `chrome.runtime` ✅
- `chrome.scripting` ✅
- `chrome.commands` ✅
- Web Crypto API ✅

---

## Performance Considerations

### Optimization Strategies

1. **Content Script Injection**:
   - Inject only when needed
   - Use `document_start` for early injection
   - Minimize script size

2. **Background Script**:
   - Use Map for O(1) tab lookups
   - Debounce storage writes
   - Cache frequently accessed data

3. **Overlay**:
   - Use CSS for animations (GPU accelerated)
   - Minimize DOM manipulations
   - Lazy load components

4. **Bundle Size**:
   - Code splitting for popup
   - Tree shaking enabled
   - Minification in production
   - Target: <1MB total

5. **Memory**:
   - Clean up event listeners
   - Remove tabs from Map on close
   - Limit storage quota usage

---

## Development Workflow

### 1. Setup
```bash
git clone <repo>
cd PrivateTab
npm install
```

### 2. Create Icons
Add PNG files to `public/icons/`:
- icon16.png
- icon48.png
- icon128.png

### 3. Development
```bash
npm run dev:chrome    # or dev:firefox
```

Load extension in browser:
- Chrome: chrome://extensions/ → Load unpacked → dist/chrome
- Firefox: about:debugging → Load Temporary Add-on → dist/firefox

### 4. Testing
```bash
npm test              # Unit tests
npm run lint          # Code linting
npm run type-check    # Type checking
```

### 5. Build
```bash
npm run build         # Production build
npm run package       # Create store packages
```

### 6. Deployment
- Upload ZIP to Chrome Web Store
- Upload ZIP to Firefox Add-ons

---

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**
- Run `npm run type-check` to see all errors
- Check path aliases in tsconfig.json
- Ensure all imports use correct paths

**Extension not loading:**
- Check console in chrome://extensions/
- Verify manifest.json is valid
- Check for CSP violations

**Content script not injecting:**
- Verify `<all_urls>` permission
- Check if URL is protectable (not chrome://)
- Look for errors in background console

**Hot reload not working:**
- Restart dev server
- Manually reload extension
- Check port 5173 is not in use

**Tests failing:**
- Ensure test setup mocks Chrome API
- Check for async issues (missing await)
- Run tests in watch mode for debugging

---

## Future Enhancements

### Planned Directory Additions

```
src/
├── options/                    # Options page (full settings UI)
│   ├── index.html
│   ├── index.tsx
│   └── App.tsx
│
docs/
├── screenshots/               # Screenshots for stores
├── promotional/               # Marketing materials
└── guides/                    # User guides
```

### Planned Features
- Biometric authentication
- Multiple password profiles
- Tab categories
- Sync across devices
- Password manager integration

---

## Contributing

When modifying the project structure:
1. Update this document
2. Update ROADMAP.md if adding new phases
3. Document new files in "Key File Descriptions"
4. Update data flow diagrams if architecture changes
5. Keep dependencies section current

---

**Last Updated**: 2025-11-12
**Version**: 1.0.0
**Status**: 🟢 Active Development
