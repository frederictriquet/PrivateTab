// Global constants for the PrivateTab extension

// Storage keys
export const STORAGE_KEYS = {
  MASTER_PASSWORD_HASH: 'masterPasswordHash',
  PRIVATE_TABS: 'privateTabs',
  SETTINGS: 'settings',
  SESSION: 'session',
} as const;

// Security settings
export const SECURITY = {
  PBKDF2_ITERATIONS: 100000,
  PASSWORD_MIN_LENGTH: 1,
  MAX_PASSWORD_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 300000, // 5 minutes
  SESSION_TIMEOUT_MS: 900000, // 15 minutes
} as const;

// UI constants
export const UI = {
  OVERLAY_Z_INDEX: 2147483647, // Max z-index
  OVERLAY_INJECTION_DELAY_MS: 50,
  PASSWORD_INPUT_MAX_LENGTH: 128,
} as const;

// Extension metadata
export const EXTENSION = {
  NAME: 'PrivateTab',
  VERSION: '1.1.0',
} as const;

// Default values
export const DEFAULTS = {
  AUTO_LOCK_TIMEOUT: 5, // minutes
  LOCK_ON_TAB_SWITCH: true,
} as const;
