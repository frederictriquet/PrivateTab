// Core types for the PrivateTab extension

export interface PrivateTab {
  id: number;
  url: string;
  title: string;
  isLocked: boolean;
  markedAt: number;
  lastUnlocked?: number;
}

export interface StorageData {
  masterPasswordHash?: {
    hash: string;
    salt: string;
    iterations: number;
  };
  privateTabs: Record<number, PrivateTab>;
  settings: Settings;
  session: SessionState;
}

export type IncognitoMode = 'disabled' | 'always-lock' | 'normal';

export interface Settings {
  lockingEnabled: boolean; // Master switch to enable/disable all locking
  autoLockTimeout: number; // minutes, 0 = never
  lockOnTabSwitch: boolean;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  incognitoMode: IncognitoMode; // How to handle incognito tabs
  privateMode: boolean; // Global mode: keep all private tabs locked
  whitelistedUrls: string[]; // URL patterns that never auto-lock
}

export interface SessionState {
  lastActivity: number;
  unlockedTabs: number[];
}

export type TabStatus = 'private-locked' | 'private-unlocked' | 'normal';

export const DEFAULT_SETTINGS: Settings = {
  lockingEnabled: true,
  autoLockTimeout: 5,
  lockOnTabSwitch: true,
  showNotifications: true,
  theme: 'auto',
  incognitoMode: 'normal',
  privateMode: false,
  whitelistedUrls: [],
};
