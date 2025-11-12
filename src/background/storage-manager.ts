// Storage manager - handles all storage operations

import type { StorageData, Settings, PrivateTab } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { STORAGE_KEYS } from '@shared/constants';

export class StorageManager {
  /**
   * Initialize storage with default values
   */
  async initialize(): Promise<void> {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.PRIVATE_TABS,
      STORAGE_KEYS.SESSION,
    ]);

    // Set defaults if not present
    if (!data[STORAGE_KEYS.SETTINGS]) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }

    if (!data[STORAGE_KEYS.PRIVATE_TABS]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.PRIVATE_TABS]: {} });
    }

    if (!data[STORAGE_KEYS.SESSION]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SESSION]: {
          lastActivity: Date.now(),
          unlockedTabs: [],
        },
      });
    }
  }

  /**
   * Get master password hash from storage
   */
  async getMasterPasswordHash(): Promise<StorageData['masterPasswordHash'] | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.MASTER_PASSWORD_HASH);
    return result[STORAGE_KEYS.MASTER_PASSWORD_HASH] || null;
  }

  /**
   * Save master password hash to storage
   */
  async saveMasterPasswordHash(
    hash: StorageData['masterPasswordHash']
  ): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.MASTER_PASSWORD_HASH]: hash,
    });
  }

  /**
   * Check if master password is set
   */
  async hasMasterPassword(): Promise<boolean> {
    const hash = await this.getMasterPasswordHash();
    return hash !== null;
  }

  /**
   * Get all private tabs
   */
  async getPrivateTabs(): Promise<Record<number, PrivateTab>> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PRIVATE_TABS);
    return result[STORAGE_KEYS.PRIVATE_TABS] || {};
  }

  /**
   * Save private tabs to storage
   */
  async savePrivateTabs(tabs: Record<number, PrivateTab>): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.PRIVATE_TABS]: tabs,
    });
  }

  /**
   * Get settings
   */
  async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
  }

  /**
   * Save settings
   */
  async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: settings,
    });
  }

  /**
   * Update partial settings
   */
  async updateSettings(partialSettings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...partialSettings };
    await this.saveSettings(newSettings);
    return newSettings;
  }

  /**
   * Get session state
   */
  async getSession(): Promise<StorageData['session']> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SESSION);
    return (
      result[STORAGE_KEYS.SESSION] || {
        lastActivity: Date.now(),
        unlockedTabs: [],
      }
    );
  }

  /**
   * Update session state
   */
  async updateSession(session: Partial<StorageData['session']>): Promise<void> {
    const currentSession = await this.getSession();
    const newSession = { ...currentSession, ...session };
    await chrome.storage.local.set({
      [STORAGE_KEYS.SESSION]: newSession,
    });
  }

  /**
   * Clear all extension data (for debugging/reset)
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  }
}
