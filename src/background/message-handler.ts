// Message handler - routes messages between components

import type { ExtensionMessage } from '@shared/types/messages';
import type { TabManager } from './tab-manager';
import type { StorageManager } from './storage-manager';
import { CryptoService } from './crypto';

export class MessageHandler {
  private tabManager: TabManager;
  private storageManager: StorageManager;
  private passwordAttempts: Map<number, { count: number; lastAttempt: number }> = new Map();

  constructor(tabManager: TabManager, storageManager: StorageManager) {
    this.tabManager = tabManager;
    this.storageManager = storageManager;
  }

  /**
   * Validate message source for security
   */
  private isValidMessageSource(sender: chrome.runtime.MessageSender): boolean {
    // Only accept messages from our extension
    if (sender.id !== chrome.runtime.id) {
      console.warn('Rejected message from invalid extension ID:', sender.id);
      return false;
    }

    // Accept messages from extension pages (popup, background)
    if (sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
      return true;
    }

    // Accept messages from content scripts (they have a tab but no frameId or frameId === 0)
    if (sender.tab && (sender.frameId === 0 || sender.frameId === undefined)) {
      return true;
    }

    console.warn('Rejected message from invalid source:', sender);
    return false;
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<unknown> {
    console.log('Received message:', message.type, sender);

    // Validate message source
    if (!this.isValidMessageSource(sender)) {
      return { error: 'Invalid message source' };
    }

    try {
      switch (message.type) {
        // Password verification
        case 'VERIFY_PASSWORD':
          // Extract tabId from sender since content scripts can't access chrome.tabs
          const verifyTabId = sender.tab?.id ?? -1;
          if (verifyTabId === -1) {
            console.warn('VERIFY_PASSWORD: No tab ID in sender');
            return { success: false, error: 'Invalid tab' };
          }
          return await this.handleVerifyPassword(message.password, verifyTabId);

        // Password management
        case 'SET_MASTER_PASSWORD':
          return await this.handleSetMasterPassword(message.password);

        case 'VERIFY_MASTER_PASSWORD':
          return await this.handleVerifyMasterPassword(message.password);

        case 'CHANGE_MASTER_PASSWORD':
          return await this.handleChangeMasterPassword(
            message.currentPassword,
            message.newPassword
          );

        // Tab management
        case 'GET_PRIVATE_TABS':
          return { tabs: this.tabManager.getAllPrivateTabs() };

        case 'MARK_TAB_PRIVATE':
          await this.tabManager.toggleTabPrivate(message.tabId, message.isPrivate);
          return { success: true };

        case 'LOCK_ALL_TABS':
          await this.tabManager.lockAllTabs();
          return { success: true };

        case 'GET_CURRENT_TAB_STATUS':
          const status = await this.tabManager.getTabStatus(message.tabId);
          return { status };

        // Settings
        case 'GET_SETTINGS':
          const settings = await this.storageManager.getSettings();
          return { settings };

        case 'UPDATE_SETTINGS':
          const updatedSettings = await this.storageManager.updateSettings(
            message.settings
          );
          return { settings: updatedSettings };

        // Tab events
        case 'TAB_LOCKED':
          console.log(`Tab ${message.tabId} locked`);
          return { success: true };

        case 'TAB_UNLOCKED':
          console.log(`Tab ${message.tabId} unlocked`);
          return { success: true };

        case 'REQUEST_LOCK_STATUS':
          // Use sender.tab.id since content scripts can't access their own tab ID
          const tabId = sender.tab?.id ?? -1;
          if (tabId === -1) {
            console.warn('REQUEST_LOCK_STATUS: No tab ID in sender');
            return { status: 'normal' };
          }
          const isLocked = await this.tabManager.getTabStatus(tabId);
          return { status: isLocked };

        default:
          console.warn('Unknown message type:', (message as ExtensionMessage).type);
          return { error: 'Unknown message type' };
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Handle password verification for unlocking a tab
   */
  private async handleVerifyPassword(
    password: string,
    tabId: number
  ): Promise<{ success: boolean; attempts?: number }> {
    // Check rate limiting
    const attempts = this.passwordAttempts.get(tabId) || {
      count: 0,
      lastAttempt: 0,
    };

    const now = Date.now();
    if (attempts.count >= 5 && now - attempts.lastAttempt < 300000) {
      // 5 minutes lockout
      return {
        success: false,
        attempts: attempts.count,
      };
    }

    // Get stored password hash
    const storedHash = await this.storageManager.getMasterPasswordHash();
    if (!storedHash) {
      return { success: false };
    }

    // Verify password
    const isValid = await CryptoService.verifyPassword(
      password,
      storedHash.hash,
      storedHash.salt,
      storedHash.iterations
    );

    if (isValid) {
      // Reset attempts on success
      this.passwordAttempts.delete(tabId);
      // Unlock the tab
      await this.tabManager.unlockTab(tabId);
      return { success: true };
    } else {
      // Increment attempts
      attempts.count += 1;
      attempts.lastAttempt = now;
      this.passwordAttempts.set(tabId, attempts);
      return { success: false, attempts: attempts.count };
    }
  }

  /**
   * Set master password for first time
   */
  private async handleSetMasterPassword(
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    // Check if password already exists
    const hasPassword = await this.storageManager.hasMasterPassword();
    if (hasPassword) {
      return { success: false, error: 'Master password already set' };
    }

    // Validate password
    const validation = CryptoService.validatePassword(password);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Hash and store password
    const hash = await CryptoService.hashPassword(password);
    await this.storageManager.saveMasterPasswordHash(hash);

    return { success: true };
  }

  /**
   * Verify master password (for settings access)
   */
  private async handleVerifyMasterPassword(
    password: string
  ): Promise<{ success: boolean }> {
    const storedHash = await this.storageManager.getMasterPasswordHash();
    if (!storedHash) {
      return { success: false };
    }

    const isValid = await CryptoService.verifyPassword(
      password,
      storedHash.hash,
      storedHash.salt,
      storedHash.iterations
    );

    return { success: isValid };
  }

  /**
   * Change master password
   */
  private async handleChangeMasterPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify current password
    const verifyResult = await this.handleVerifyMasterPassword(currentPassword);
    if (!verifyResult.success) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password
    const validation = CryptoService.validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Hash and store new password
    const hash = await CryptoService.hashPassword(newPassword);
    await this.storageManager.saveMasterPasswordHash(hash);

    return { success: true };
  }
}
