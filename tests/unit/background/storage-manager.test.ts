// Unit tests for StorageManager

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '@background/storage-manager';
import { DEFAULT_SETTINGS } from '@shared/types';

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    // Reset mock storage before each test
    (globalThis as any).resetMockStorage();
    vi.clearAllMocks();
    storageManager = new StorageManager();
  });

  describe('initialization', () => {
    it('should initialize with default settings if none exist', async () => {
      const settings = await storageManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should load existing settings from storage', async () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        lockingEnabled: false,
        autoLockTimeout: 10,
      };

      await chrome.storage.local.set({ settings: customSettings });

      const newManager = new StorageManager();
      const settings = await newManager.getSettings();

      expect(settings.lockingEnabled).toBe(false);
      expect(settings.autoLockTimeout).toBe(10);
    });
  });

  describe('settings management', () => {
    it('should save settings to storage', async () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        autoLockTimeout: 15,
      };

      await storageManager.saveSettings(newSettings);

      const storage = (globalThis as any).getMockStorage();
      expect(storage.settings).toEqual(newSettings);
    });

    it('should update partial settings', async () => {
      await storageManager.updateSettings({ autoLockTimeout: 20 });

      const settings = await storageManager.getSettings();
      expect(settings.autoLockTimeout).toBe(20);
      expect(settings.lockingEnabled).toBe(DEFAULT_SETTINGS.lockingEnabled);
    });

    it('should merge updated settings with existing ones', async () => {
      await storageManager.updateSettings({
        lockingEnabled: false,
        showNotifications: false
      });

      const settings = await storageManager.getSettings();
      expect(settings.lockingEnabled).toBe(false);
      expect(settings.showNotifications).toBe(false);
      expect(settings.autoLockTimeout).toBe(DEFAULT_SETTINGS.autoLockTimeout);
    });
  });

  describe('private tabs management', () => {
    it('should save and retrieve private tabs', async () => {
      const privateTabs = {
        123: {
          id: 123,
          url: 'https://example.com',
          title: 'Example',
          isLocked: true,
          markedAt: Date.now(),
        },
      };

      await storageManager.savePrivateTabs(privateTabs);
      const retrieved = await storageManager.getPrivateTabs();

      expect(retrieved).toEqual(privateTabs);
    });

    it('should return empty object if no private tabs exist', async () => {
      const tabs = await storageManager.getPrivateTabs();
      expect(tabs).toEqual({});
    });

    it('should overwrite existing private tabs on save', async () => {
      const tabs1 = { 1: { id: 1, url: 'url1', title: 'Tab 1', isLocked: true, markedAt: Date.now() } };
      const tabs2 = { 2: { id: 2, url: 'url2', title: 'Tab 2', isLocked: false, markedAt: Date.now() } };

      await storageManager.savePrivateTabs(tabs1);
      await storageManager.savePrivateTabs(tabs2);

      const retrieved = await storageManager.getPrivateTabs();
      expect(retrieved).toEqual(tabs2);
      expect(retrieved).not.toEqual(tabs1);
    });
  });

  describe('master password management', () => {
    it('should check if master password is set', async () => {
      const isSet = await storageManager.hasMasterPassword();
      expect(isSet).toBe(false);
    });

    it('should save master password hash', async () => {
      const passwordHash = {
        hash: 'hash123',
        salt: 'salt123',
        iterations: 100000,
      };

      await storageManager.saveMasterPasswordHash(passwordHash);
      const retrieved = await storageManager.getMasterPasswordHash();

      expect(retrieved).toEqual(passwordHash);
    });

    it('should indicate password is set after saving', async () => {
      await storageManager.saveMasterPasswordHash({
        hash: 'test',
        salt: 'test',
        iterations: 100000,
      });

      const isSet = await storageManager.hasMasterPassword();
      expect(isSet).toBe(true);
    });

    it('should return null if no password hash exists', async () => {
      const hash = await storageManager.getMasterPasswordHash();
      expect(hash).toBeNull();
    });
  });

  describe('storage error handling', () => {
    it('should handle storage.get errors gracefully', async () => {
      vi.spyOn(chrome.storage.local, 'get').mockRejectedValueOnce(new Error('Storage error'));

      await expect(storageManager.getSettings()).rejects.toThrow('Storage error');
    });

    it('should handle storage.set errors gracefully', async () => {
      vi.spyOn(chrome.storage.local, 'set').mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        storageManager.saveSettings(DEFAULT_SETTINGS)
      ).rejects.toThrow('Storage error');
    });
  });
});
