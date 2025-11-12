# Changelog

All notable changes to the PrivateTab extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Biometric authentication support
- Multiple password profiles
- Tab categories and organization
- Dark mode theme
- Import/export settings
- Sync across devices (optional)

### Fixed
- **Content visibility leak on tab switch**: Made blocker persistent instead of one-time use - now shows/hides when locking/unlocking tabs
- **Content visibility leak on initial load**: Implemented full-page blocker to prevent content flash when page loads
- **Hardcoded password length**: Replaced all hardcoded minimum password length values (including UI placeholders) with SECURITY.PASSWORD_MIN_LENGTH constant
- **Content script injection error**: Removed unnecessary manual content script injection (already auto-injected via manifest.json)
- **Unlock button not working**: Fixed content script trying to access chrome.tabs API (not available to content scripts) - background now extracts tab ID from message sender
- **Message sending race condition**: Fixed "Could not establish connection" error by having content script handle unlock directly via VERIFY_PASSWORD response instead of separate UNLOCK_TAB message
- **Tab re-locking after unlock**: Fixed handleTabActivated() re-locking tabs immediately after unlocking them - now only locks tabs that are currently unlocked
- **Unlock button not responding to clicks**: Removed overlay click event listener that was blocking button clicks with stopPropagation() - overlay already blocks clicks to underlying page

## [1.1.0] - 2025-11-12

### Added
- **Session timeout management**: Automatic locking of private tabs after configurable inactivity period (default: 5 minutes)
- **Browser notifications**: Notify users when tabs are auto-locked due to inactivity
- **Developer tools detection**: Warns users when devtools are opened on locked tabs
- **Message source validation**: Validates all extension messages to prevent external script injection
- **Memory cleanup**: Automatic clearing of sensitive data when tabs are locked
- **Anti-inspection measures**: Prevents element inspection and text selection on privacy overlay
- **Enhanced overlay protection**: Makes overlay harder to bypass or inspect

### Security
- Message source validation for all extension communications
- Memory cleanup on tab lock (removes lastUnlocked timestamps)
- DevTools detection with user warnings
- Overlay element protection against inspection attempts
- Sensitive data cleanup on unlock
- Session timer management with automatic cleanup

### Changed
- Extension permissions updated to include notifications
- Improved security hardening across all components

## [1.0.0] - 2025-11-12

### Added
- Initial release
- Mark tabs as private with password protection
- Content overlay that hides page content when tab is locked
- Auto-lock on tab switch
- PBKDF2 password hashing with 100,000+ iterations
- Master password setup and management
- Popup interface for managing private tabs
- Keyboard shortcuts (Ctrl+Shift+P to toggle private, Ctrl+Shift+L to lock all)
- Cross-browser support (Chrome and Firefox)
- Rate limiting on password attempts (5 attempts max with 5-minute lockout)
- Minimal permissions (storage, activeTab, scripting, tabs)
- CSP-compliant implementation
- Local-only storage (no external data transmission)

### Security
- PBKDF2-SHA256 password hashing
- Web Crypto API for cryptographic operations
- No plaintext password storage
- Secure message passing between components
- Content Security Policy enforcement

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements
