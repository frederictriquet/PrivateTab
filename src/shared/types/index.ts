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

export interface Settings {
  autoLockTimeout: number; // minutes, 0 = never
  lockOnTabSwitch: boolean;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  protectIncognito: boolean;
}

export interface SessionState {
  lastActivity: number;
  unlockedTabs: number[];
}

export type TabStatus = 'private-locked' | 'private-unlocked' | 'normal';

export const DEFAULT_SETTINGS: Settings = {
  autoLockTimeout: 5,
  lockOnTabSwitch: true,
  showNotifications: true,
  theme: 'auto',
  protectIncognito: false,
};
