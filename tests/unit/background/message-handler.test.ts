// Unit tests for MessageHandler

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { MessageHandler } from '@background/message-handler';
import { StorageManager } from '@background/storage-manager';
import { TabManager } from '@background/tab-manager';
import { CryptoService } from '@background/crypto';

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let storageManager: StorageManager;
  let tabManager: TabManager;
  let sendResponse: Mock;

  // Mock sender object that passes validation
  const mockSender: chrome.runtime.MessageSender = {
    id: 'test-extension-id',
    url: 'chrome-extension://test-extension-id/popup.html',
    tab: { id: 123 } as chrome.tabs.Tab,
  };

  beforeEach(() => {
    (globalThis as any).resetMockStorage();
    vi.clearAllMocks();

    storageManager = new StorageManager();
    tabManager = new TabManager(storageManager);
    tabManager.stopCleanupScheduler(); // Stop cleanup scheduler to prevent infinite loops
    messageHandler = new MessageHandler(tabManager, storageManager);
    sendResponse = vi.fn();
  });

  describe('VERIFY_PASSWORD message', () => {
    it('should verify correct password', async () => {
      // Suppress expected warning for tab not found
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const password = 'TestPassword123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);
      await storageManager.saveMasterPasswordHash({ hash, salt, iterations });

      const message = {
        type: 'VERIFY_PASSWORD' as const,
        password,
        tabId: 123,
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toEqual({
        success: true,
      });

      consoleWarnSpy.mockRestore();
    });

    it('should reject incorrect password', async () => {
      const correctPassword = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(correctPassword);
      await storageManager.saveMasterPasswordHash({ hash, salt, iterations });

      const message = {
        type: 'VERIFY_PASSWORD' as const,
        password: wrongPassword,
        tabId: 123,
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toMatchObject({
        success: false,
        attempts: 1,
      });
    });

    it('should track failed attempts', async () => {
      const password = 'TestPassword123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);
      await storageManager.saveMasterPasswordHash({ hash, salt, iterations });

      const message = {
        type: 'VERIFY_PASSWORD' as const,
        password: 'wrong',
        tabId: 123,
      };

      // First attempt
      const result1 = await messageHandler.handleMessage(message, mockSender);
      expect(result1).toMatchObject({
        success: false,
        attempts: 1,
      });

      // Second attempt
      const result2 = await messageHandler.handleMessage(message, mockSender);
      expect(result2).toMatchObject({
        success: false,
        attempts: 2,
      });
    });
  });

  describe('SET_MASTER_PASSWORD message', () => {
    it('should set master password successfully', async () => {
      const message = {
        type: 'SET_MASTER_PASSWORD' as const,
        password: 'NewPassword123!',
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toEqual({
        success: true,
      });

      const hasPassword = await storageManager.hasMasterPassword();
      expect(hasPassword).toBe(true);
    });

    it('should reject weak password', async () => {
      const message = {
        type: 'SET_MASTER_PASSWORD' as const,
        password: '', // Empty password should be rejected
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('at least'),
      });

      const hasPassword = await storageManager.hasMasterPassword();
      expect(hasPassword).toBe(false);
    });
  });

  describe('GET_SETTINGS message', () => {
    it('should return current settings', async () => {
      const message = { type: 'GET_SETTINGS' as const };

      const result = await messageHandler.handleMessage(message, mockSender) as any;

      expect(result.settings).toMatchObject({
        lockingEnabled: expect.any(Boolean),
        autoLockTimeout: expect.any(Number),
      });
    });
  });

  describe('UPDATE_SETTINGS message', () => {
    it('should update settings', async () => {
      const message = {
        type: 'UPDATE_SETTINGS' as const,
        settings: {
          autoLockTimeout: 10,
          showNotifications: false,
        },
      };

      const result = await messageHandler.handleMessage(message, mockSender) as any;

      expect(result.settings.autoLockTimeout).toBe(10);
      expect(result.settings.showNotifications).toBe(false);
    });
  });

  describe('GET_CURRENT_TAB_STATUS message', () => {
    it('should return normal status for non-private tab', async () => {
      const message = {
        type: 'GET_CURRENT_TAB_STATUS' as const,
        tabId: 123,
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toEqual({
        status: 'normal',
      });
    });

    it('should return private-locked status for locked private tab', async () => {
      // Mock a private tab
      vi.spyOn(tabManager, 'getTabStatus').mockResolvedValue('private-locked');

      const message = {
        type: 'GET_CURRENT_TAB_STATUS' as const,
        tabId: 123,
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toEqual({
        status: 'private-locked',
      });
    });
  });

  describe('MARK_TAB_PRIVATE message', () => {
    it('should mark tab as private', async () => {
      // Mock tabs.get to return a valid tab
      vi.spyOn(chrome.tabs, 'get').mockResolvedValue({
        id: 123,
        url: 'https://example.com',
        title: 'Example',
        incognito: false,
      } as chrome.tabs.Tab);

      const message = {
        type: 'MARK_TAB_PRIVATE' as const,
        tabId: 123,
        isPrivate: true,
      };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toEqual({ success: true });
    });
  });

  describe('error handling', () => {
    it('should handle unknown message types', async () => {
      // Suppress expected warning log
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const message = { type: 'UNKNOWN_TYPE' as any };

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toMatchObject({
        error: expect.stringContaining('Unknown message type'),
      });

      consoleWarnSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      // Suppress expected error log
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const message = {
        type: 'GET_SETTINGS' as const,
      };

      vi.spyOn(storageManager, 'getSettings').mockRejectedValueOnce(new Error('Storage error'));

      const result = await messageHandler.handleMessage(message, mockSender);

      expect(result).toMatchObject({
        error: expect.any(String),
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('message sender validation', () => {
    it('should extract tabId from sender', async () => {
      const message = {
        type: 'REQUEST_LOCK_STATUS' as const,
      };

      const sender = {
        id: 'test-extension-id',
        url: 'chrome-extension://test-extension-id/content.js',
        tab: { id: 456 } as chrome.tabs.Tab,
      } as chrome.runtime.MessageSender;

      const result = await messageHandler.handleMessage(message, sender);

      // Should respond with status for tab 456
      expect(result).toMatchObject({
        status: expect.any(String),
      });
    });
  });
});
