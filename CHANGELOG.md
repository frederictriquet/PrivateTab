# Changelog

All notable changes to the PrivateTab extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Auto-lock timer (configurable timeout)
- Biometric authentication support
- Multiple password profiles
- Tab categories and organization
- Dark mode theme
- Import/export settings
- Sync across devices (optional)

## [1.0.0] - TBD

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
