## 1.0.0 (2025-11-13)

### Features

* embed package-lock.json ([9a8afb5](https://github.com/frederictriquet/PrivateTab/commit/9a8afb5ac93c7b90fa1902f71027494e8a176c0a))

### Bug Fixes

* **ci:** correct additional-packages format in semantic-release action ([e3d5c2c](https://github.com/frederictriquet/PrivateTab/commit/e3d5c2c47605b156b9122bb104ce4e89a2b4ccc3))
* **ci:** correct manifest.json path in semantic-release config ([a631832](https://github.com/frederictriquet/PrivateTab/commit/a631832b159c83cb158ca4f2b670d041b5820fda))
* **ci:** resolve dependency conflicts and optimize test environment ([0ecfef3](https://github.com/frederictriquet/PrivateTab/commit/0ecfef391987087ea52e8b06526ce1f24943155d))
* **ci:** use JSON array format for additional-packages in semantic-release ([265d8b1](https://github.com/frederictriquet/PrivateTab/commit/265d8b146349f4bb968f5de963f617aa1372de5f))
* **deps:** add missing archiver dependency for package script ([eeb9bf2](https://github.com/frederictriquet/PrivateTab/commit/eeb9bf2183e92c83d6a2c6d4413c3948e6f6c310))
* **types:** correct setTimeout timer type for browser environment ([91acd35](https://github.com/frederictriquet/PrivateTab/commit/91acd358642c773086b0ef4de69acdfc72104fc3))

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
- **Unlock button not responding to clicks**: Fixed CSS ::before pseudo-element on overlay that had pointer-events: auto, blocking all clicks to the button - removed the pseudo-element and added pointer-events: none to overlay with pointer-events: auto on content panel instead
- **Overlay not removing after unlock**: Fixed DOM protection code blocking legitimate overlay removal - added allowRemoval flag to distinguish between legitimate hideOverlay() calls and malicious removal attempts

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
