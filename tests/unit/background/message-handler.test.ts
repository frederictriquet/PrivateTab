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

  beforeEach(() => {
    (globalThis as any).resetMockStorage();
    vi.clearAllMocks();

    storageManager = new StorageManager();
    tabManager = new TabManager(storageManager);
    messageHandler = new MessageHandler(storageManager, tabManager);
    sendResponse = vi.fn();
  });

  describe('VERIFY_PASSWORD message', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);
      await storageManager.saveMasterPasswordHash({ hash, salt, iterations });

      const message = {
        type: 'VERIFY_PASSWORD' as const,
        password,
        tabId: 123,
      };

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        attempts: 1,
      });
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

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
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
      await messageHandler.handleMessage(message, {} as any, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        attempts: 1,
      });

      // Second attempt
      sendResponse.mockClear();
      await messageHandler.handleMessage(message, {} as any, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({
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

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
      });

      const hasPassword = await storageManager.hasMasterPassword();
      expect(hasPassword).toBe(true);
    });

    it('should reject weak password', async () => {
      const message = {
        type: 'SET_MASTER_PASSWORD' as const,
        password: 'weak',
      };

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
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

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          lockingEnabled: expect.any(Boolean),
          autoLockTimeout: expect.any(Number),
        })
      );
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

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      const settings = await storageManager.getSettings();
      expect(settings.autoLockTimeout).toBe(10);
      expect(settings.showNotifications).toBe(false);
    });
  });

  describe('GET_CURRENT_TAB_STATUS message', () => {
    it('should return normal status for non-private tab', async () => {
      const message = {
        type: 'GET_CURRENT_TAB_STATUS' as const,
        tabId: 123,
      };

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
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

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
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

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('error handling', () => {
    it('should handle unknown message types', async () => {
      const message = { type: 'UNKNOWN_TYPE' as any };

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        error: expect.stringContaining('Unknown message type'),
      });
    });

    it('should handle errors gracefully', async () => {
      const message = {
        type: 'GET_SETTINGS' as const,
      };

      vi.spyOn(storageManager, 'getSettings').mockRejectedValueOnce(new Error('Storage error'));

      await messageHandler.handleMessage(message, {} as any, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        error: expect.any(String),
      });
    });
  });

  describe('message sender validation', () => {
    it('should extract tabId from sender', async () => {
      const message = {
        type: 'REQUEST_LOCK_STATUS' as const,
      };

      const sender = {
        tab: { id: 456 },
      } as chrome.runtime.MessageSender;

      await messageHandler.handleMessage(message, sender, sendResponse);

      // Should respond with status for tab 456
      expect(sendResponse).toHaveBeenCalled();
    });
  });
});
