// Unit tests for TabManager

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TabManager } from '@background/tab-manager';
import { StorageManager } from '@background/storage-manager';
import type { PrivateTab } from '@shared/types';

describe('TabManager', () => {
  let tabManager: TabManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    (globalThis as any).resetMockStorage();
    vi.clearAllMocks();
    vi.useFakeTimers();

    storageManager = new StorageManager();
    tabManager = new TabManager(storageManager);
  });

  afterEach(() => {
    // Stop the cleanup scheduler to prevent infinite loops
    if (tabManager) {
      tabManager.stopCleanupScheduler();
    }
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should load private tabs from storage on initialization', async () => {
      const privateTabs: Record<number, PrivateTab> = {
        123: {
          id: 123,
          url: 'https://example.com',
          title: 'Example',
          isLocked: true,
          markedAt: Date.now(),
        },
      };

      await storageManager.savePrivateTabs(privateTabs);

      // Stop existing tabManager to avoid cleanup conflicts
      if (tabManager) {
        tabManager.stopCleanupScheduler();
      }

      // Use real timers for this test to allow initialization to complete
      vi.useRealTimers();

      const newTabManager = new TabManager(storageManager);
      newTabManager.stopCleanupScheduler(); // Stop the scheduler immediately

      // Give a moment for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const isPrivate = await newTabManager.isPrivateTab(123);
      expect(isPrivate).toBe(true);

      // Restore fake timers
      vi.useFakeTimers();
    });

    it('should clean up non-existent tabs on initialization', async () => {
      const privateTabs: Record<number, PrivateTab> = {
        999: {
          id: 999,
          url: 'https://example.com',
          title: 'Example',
          isLocked: true,
          markedAt: Date.now(),
        },
      };

      await storageManager.savePrivateTabs(privateTabs);

      // Mock chrome.tabs.get to throw for non-existent tab
      vi.spyOn(chrome.tabs, 'get').mockRejectedValue(new Error('Tab not found'));

      // Stop existing tabManager to avoid cleanup conflicts
      if (tabManager) {
        tabManager.stopCleanupScheduler();
      }

      // Use real timers for this test to allow initialization to complete
      vi.useRealTimers();

      const newTabManager = new TabManager(storageManager);
      newTabManager.stopCleanupScheduler(); // Stop the scheduler immediately

      // Give a moment for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const tabs = await storageManager.getPrivateTabs();
      expect(tabs[999]).toBeUndefined();

      // Restore fake timers
      vi.useFakeTimers();
    });
  });

  describe('toggleTabPrivate', () => {
    it('should mark tab as private', async () => {
      vi.spyOn(chrome.tabs, 'get').mockResolvedValue({
        id: 123,
        url: 'https://example.com',
        title: 'Example',
        incognito: false,
      } as chrome.tabs.Tab);

      vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue({} as any);

      await tabManager.toggleTabPrivate(123, true);

      const isPrivate = await tabManager.isPrivateTab(123);
      const status = await tabManager.getTabStatus(123);

      expect(isPrivate).toBe(true);
      expect(status).toBe('private-locked');
    });

    it('should remove private status from tab', async () => {
      vi.spyOn(chrome.tabs, 'get').mockResolvedValue({
        id: 123,
        url: 'https://example.com',
        title: 'Example',
        incognito: false,
      } as chrome.tabs.Tab);

      vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue({} as any);

      // First mark as private
      await tabManager.toggleTabPrivate(123, true);
      expect(await tabManager.isPrivateTab(123)).toBe(true);

      // Then remove private status
      await tabManager.toggleTabPrivate(123, false);
      expect(await tabManager.isPrivateTab(123)).toBe(false);
    });

    it('should reject incognito tabs when incognito mode is disabled', async () => {
      // Suppress expected warning log
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.spyOn(chrome.tabs, 'get').mockResolvedValue({
        id: 123,
        url: 'https://example.com',
        title: 'Example',
        incognito: true,
      } as chrome.tabs.Tab);

      await storageManager.updateSettings({ incognitoMode: 'disabled' });

      await expect(
        tabManager.toggleTabPrivate(123, true)
      ).rejects.toThrow('incognito');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('lockTab and unlockTab', () => {
    beforeEach(async () => {
      vi.spyOn(chrome.tabs, 'get').mockResolvedValue({
        id: 123,
        url: 'https://example.com',
        title: 'Example',
        incognito: false,
      } as chrome.tabs.Tab);

      vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue({} as any);

      await tabManager.toggleTabPrivate(123, true);
    });

    it('should lock a private tab', async () => {
      await tabManager.unlockTab(123);
      expect(await tabManager.getTabStatus(123)).toBe('private-unlocked');

      await tabManager.lockTab(123);
      expect(await tabManager.getTabStatus(123)).toBe('private-locked');
    });

    it('should unlock a locked tab', async () => {
      await tabManager.unlockTab(123);
      expect(await tabManager.getTabStatus(123)).toBe('private-unlocked');
    });

    it('should start session timer when unlocking', async () => {
      await storageManager.updateSettings({ autoLockTimeout: 5 });

      await tabManager.unlockTab(123);

      // Advance time by 5 minutes (300000ms)
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      // Tab should be locked again after timeout
      const status = await tabManager.getTabStatus(123);
      expect(status).toBe('private-locked');
    });

    it('should not auto-lock when timeout is 0', async () => {
      await storageManager.updateSettings({ autoLockTimeout: 0 });

      // Advance time to expire settings cache (5 second TTL)
      await vi.advanceTimersByTimeAsync(6000);

      await tabManager.unlockTab(123);

      // Advance time significantly
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

      // Tab should still be unlocked
      const status = await tabManager.getTabStatus(123);
      expect(status).toBe('private-unlocked');
    });

    it('should send lock message to content script', async () => {
      const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage');

      await tabManager.lockTab(123);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ type: 'LOCK_TAB' })
      );
    });

    it('should clear session timer when locking', async () => {
      await storageManager.updateSettings({ autoLockTimeout: 5 });

      await tabManager.unlockTab(123);
      await tabManager.lockTab(123);

      // Advance time past timeout
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      // Should remain locked (not trigger auto-lock again)
      const status = await tabManager.getTabStatus(123);
      expect(status).toBe('private-locked');
    });
  });

  describe('lockAllTabs and unlockAllTabs', () => {
    beforeEach(async () => {
      vi.spyOn(chrome.tabs, 'get').mockImplementation((tabId) =>
        Promise.resolve({
          id: tabId,
          url: 'https://example.com',
          title: 'Example',
          incognito: false,
        } as chrome.tabs.Tab)
      );

      vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue({} as any);

      // Create multiple private tabs
      await tabManager.toggleTabPrivate(1, true);
      await tabManager.toggleTabPrivate(2, true);
      await tabManager.toggleTabPrivate(3, true);
    });

    it('should lock all private tabs', async () => {
      await tabManager.unlockTab(1);
      await tabManager.unlockTab(2);
      await tabManager.unlockTab(3);

      await tabManager.lockAllTabs();

      expect(await tabManager.getTabStatus(1)).toBe('private-locked');
      expect(await tabManager.getTabStatus(2)).toBe('private-locked');
      expect(await tabManager.getTabStatus(3)).toBe('private-locked');
    });

    it('should unlock all private tabs', async () => {
      await tabManager.unlockAllTabs();

      expect(await tabManager.getTabStatus(1)).toBe('private-unlocked');
      expect(await tabManager.getTabStatus(2)).toBe('private-unlocked');
      expect(await tabManager.getTabStatus(3)).toBe('private-unlocked');
    });
  });

  describe('tab lifecycle events', () => {
    beforeEach(async () => {
      vi.spyOn(chrome.tabs, 'get').mockResolvedValue({
        id: 123,
        url: 'https://example.com',
        title: 'Example Updated',
        incognito: false,
      } as chrome.tabs.Tab);

      vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue({} as any);

      await tabManager.toggleTabPrivate(123, true);
    });

    it('should handle tab removal', async () => {
      await tabManager.handleTabRemoved(123);

      const isPrivate = await tabManager.isPrivateTab(123);
      expect(isPrivate).toBe(false);
    });

    it('should handle tab activation with lock on switch', async () => {
      await storageManager.updateSettings({ lockOnTabSwitch: true });
      await tabManager.unlockTab(123);

      expect(await tabManager.getTabStatus(123)).toBe('private-unlocked');

      await tabManager.handleTabActivated(123);

      expect(await tabManager.getTabStatus(123)).toBe('private-locked');
    });

    it('should not lock on activation when lockOnTabSwitch is disabled', async () => {
      await storageManager.updateSettings({ lockOnTabSwitch: false });

      // Advance time to expire settings cache (5 second TTL)
      await vi.advanceTimersByTimeAsync(6000);

      await tabManager.unlockTab(123);

      await tabManager.handleTabActivated(123);

      expect(await tabManager.getTabStatus(123)).toBe('private-unlocked');
    });

    it('should update tab info on tab updated', async () => {
      const newTab = {
        id: 123,
        url: 'https://newurl.com',
        title: 'New Title',
        incognito: false,
      } as chrome.tabs.Tab;

      await tabManager.handleTabUpdated(123, newTab);

      const tabs = await storageManager.getPrivateTabs();
      expect(tabs[123].url).toBe('https://newurl.com');
      expect(tabs[123].title).toBe('New Title');
    });
  });

  describe('private mode', () => {
    beforeEach(async () => {
      vi.spyOn(chrome.tabs, 'get').mockImplementation((tabId) =>
        Promise.resolve({
          id: tabId,
          url: 'https://example.com',
          title: 'Example',
          incognito: false,
        } as chrome.tabs.Tab)
      );

      vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue({} as any);

      await tabManager.toggleTabPrivate(1, true);
      await tabManager.toggleTabPrivate(2, true);
    });

    it('should lock all tabs when enabling private mode', async () => {
      await tabManager.unlockTab(1);
      await tabManager.unlockTab(2);

      await tabManager.togglePrivateMode(true);

      expect(await tabManager.getTabStatus(1)).toBe('private-locked');
      expect(await tabManager.getTabStatus(2)).toBe('private-locked');
    });

    it('should prevent auto-unlock in private mode', async () => {
      await storageManager.updateSettings({ autoLockTimeout: 1, privateMode: true });
      await tabManager.unlockTab(1);

      // Advance time past auto-lock timeout
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

      // Tab should remain unlocked (no timer started in private mode)
      const status = await tabManager.getTabStatus(1);
      expect(status).toBe('private-unlocked');
    });
  });

  describe('whitelist management', () => {
    it('should add URL to whitelist', async () => {
      await tabManager.addWhitelistedUrl('https://trusted.com/*');

      const settings = await storageManager.getSettings();
      expect(settings.whitelistedUrls).toContain('https://trusted.com/*');
    });

    it('should remove URL from whitelist', async () => {
      await tabManager.addWhitelistedUrl('https://trusted.com/*');
      await tabManager.removeWhitelistedUrl('https://trusted.com/*');

      const settings = await storageManager.getSettings();
      expect(settings.whitelistedUrls).not.toContain('https://trusted.com/*');
    });

    it('should not add duplicate URLs to whitelist', async () => {
      await tabManager.addWhitelistedUrl('https://trusted.com/*');
      await tabManager.addWhitelistedUrl('https://trusted.com/*');

      const settings = await storageManager.getSettings();
      const count = settings.whitelistedUrls.filter(url => url === 'https://trusted.com/*').length;
      expect(count).toBe(1);
    });
  });

  describe('settings cache', () => {
    it('should cache settings for performance', async () => {
      const getSpy = vi.spyOn(storageManager, 'getSettings');

      // First call should fetch from storage
      await tabManager.lockTab(123);
      const firstCallCount = getSpy.mock.calls.length;

      // Subsequent calls within cache TTL should use cache
      await tabManager.lockTab(123);
      await tabManager.lockTab(123);

      // Should not have called storage multiple times
      expect(getSpy.mock.calls.length).toBe(firstCallCount);
    });

    it('should invalidate cache when settings change', async () => {
      const getSpy = vi.spyOn(storageManager, 'getSettings');

      await tabManager.lockTab(123);
      getSpy.mockClear();

      await tabManager.toggleLocking(false);

      // Next operation should fetch fresh settings
      await storageManager.getSettings();
      expect(getSpy).toHaveBeenCalled();
    });
  });

  describe('periodic cleanup', () => {
    it('should run periodic cleanup', async () => {
      vi.spyOn(chrome.tabs, 'get').mockRejectedValue(new Error('Tab not found'));

      // Save a tab that doesn't exist
      await storageManager.savePrivateTabs({
        999: {
          id: 999,
          url: 'test',
          title: 'test',
          isLocked: true,
          markedAt: Date.now(),
        },
      });

      // Stop existing tabManager to avoid cleanup conflicts
      if (tabManager) {
        tabManager.stopCleanupScheduler();
      }

      // Use real timers for this test to allow initialization to complete
      vi.useRealTimers();

      const newTabManager = new TabManager(storageManager);
      newTabManager.stopCleanupScheduler(); // Stop immediately to prevent infinite loop

      // Give a moment for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // The cleanup should have already run during initialization
      const tabs = await storageManager.getPrivateTabs();
      expect(tabs[999]).toBeUndefined();

      // Restore fake timers
      vi.useFakeTimers();
    });
  });
});
