// Tab manager - handles private tab state and operations

import type { PrivateTab, TabStatus } from '@shared/types';
import type { StorageManager } from './storage-manager';

export class TabManager {
  private privateTabs: Map<number, PrivateTab> = new Map();
  private storageManager: StorageManager;
  private sessionTimers: Map<number, number> = new Map();

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load private tabs from storage
    const tabs = await this.storageManager.getPrivateTabs();
    this.privateTabs = new Map(
      Object.entries(tabs).map(([id, tab]) => [Number(id), tab])
    );
    console.log(`Loaded ${this.privateTabs.size} private tabs from storage`);
  }

  /**
   * Check if a tab is marked as private
   */
  async isPrivateTab(tabId: number): Promise<boolean> {
    return this.privateTabs.has(tabId);
  }

  /**
   * Get the status of a tab
   */
  async getTabStatus(tabId: number): Promise<TabStatus> {
    const privateTab = this.privateTabs.get(tabId);
    if (!privateTab) return 'normal';
    return privateTab.isLocked ? 'private-locked' : 'private-unlocked';
  }

  /**
   * Toggle private status for a tab
   */
  async toggleTabPrivate(tabId: number, isPrivate: boolean): Promise<void> {
    if (isPrivate) {
      // Mark tab as private
      const tab = await chrome.tabs.get(tabId);
      const privateTab: PrivateTab = {
        id: tabId,
        url: tab.url || '',
        title: tab.title || 'Untitled',
        isLocked: true,
        markedAt: Date.now(),
      };
      this.privateTabs.set(tabId, privateTab);

      // Lock tab (content script is auto-injected via manifest.json)
      await this.lockTab(tabId);
    } else {
      // Remove private status
      // Clear session timer before removing tab
      this.clearSessionTimer(tabId);

      // Tell content script to hide overlay/blocker
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'UNLOCK_TAB', tabId });
      } catch (error) {
        // Content script might not be loaded, that's okay
        console.log(`Content script not available for tab ${tabId}, skipping unlock message`);
      }

      // Remove from private tabs
      this.privateTabs.delete(tabId);
    }

    // Persist to storage
    await this.savePrivateTabs();

    // Notify popup of status change
    this.notifyTabStatusChanged(tabId);
  }

  /**
   * Lock a specific tab
   */
  async lockTab(tabId: number): Promise<void> {
    const privateTab = this.privateTabs.get(tabId);
    if (!privateTab) return;

    privateTab.isLocked = true;

    // Clear session timer when locking
    this.clearSessionTimer(tabId);

    // Memory cleanup: Remove lastUnlocked timestamp
    if (privateTab.lastUnlocked) {
      delete privateTab.lastUnlocked;
    }

    await this.savePrivateTabs();

    // Send message to content script to show overlay
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'LOCK_TAB', tabId });
    } catch (error) {
      console.error(`Failed to send lock message to tab ${tabId}:`, error);
    }
  }

  /**
   * Unlock a specific tab
   * Note: When unlocking via password verification, the content script handles
   * hiding the overlay/blocker itself based on the VERIFY_PASSWORD response.
   * This method only updates the state and manages the session timer.
   */
  async unlockTab(tabId: number): Promise<void> {
    const privateTab = this.privateTabs.get(tabId);
    if (!privateTab) return;

    privateTab.isLocked = false;
    privateTab.lastUnlocked = Date.now();
    await this.savePrivateTabs();

    // Note: We don't send UNLOCK_TAB message here because:
    // 1. For password verification: content script handles it via VERIFY_PASSWORD response
    // 2. For removing private status: tab will be deleted from privateTabs anyway

    // Start session timeout timer for this tab
    await this.startSessionTimer(tabId);

    this.notifyTabStatusChanged(tabId);
  }

  /**
   * Lock all private tabs
   */
  async lockAllTabs(): Promise<void> {
    const lockPromises = Array.from(this.privateTabs.keys()).map(tabId =>
      this.lockTab(tabId)
    );
    await Promise.all(lockPromises);
  }

  /**
   * Get all private tabs
   */
  getAllPrivateTabs(): PrivateTab[] {
    return Array.from(this.privateTabs.values());
  }

  /**
   * Handle tab activated event
   * Only locks the tab if it's currently unlocked (to avoid re-locking during unlock)
   */
  async handleTabActivated(tabId: number): Promise<void> {
    const privateTab = this.privateTabs.get(tabId);
    if (privateTab && !privateTab.isLocked) {
      // Tab is private and unlocked, check if we should lock it on switch
      const settings = await this.storageManager.getSettings();
      if (settings.lockOnTabSwitch) {
        await this.lockTab(tabId);
      }
    }
  }

  /**
   * Handle tab removed event
   */
  async handleTabRemoved(tabId: number): Promise<void> {
    if (this.privateTabs.has(tabId)) {
      this.privateTabs.delete(tabId);
      await this.savePrivateTabs();

      // Clear any active session timer for this tab
      this.clearSessionTimer(tabId);
    }
  }

  /**
   * Handle tab updated event
   */
  async handleTabUpdated(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    const privateTab = this.privateTabs.get(tabId);
    if (privateTab) {
      // Update tab info
      privateTab.url = tab.url || privateTab.url;
      privateTab.title = tab.title || privateTab.title;
      await this.savePrivateTabs();

      // Content script is auto-injected via manifest.json on navigation
      // If tab is locked, send lock message to content script
      if (privateTab.isLocked) {
        await this.lockTab(tabId);
      }
    }
  }

  /**
   * Save private tabs to storage
   */
  private async savePrivateTabs(): Promise<void> {
    const tabsObject: Record<number, PrivateTab> = {};
    this.privateTabs.forEach((tab, id) => {
      tabsObject[id] = tab;
    });
    await this.storageManager.savePrivateTabs(tabsObject);
  }

  /**
   * Notify popup of tab status change
   */
  private notifyTabStatusChanged(tabId: number): void {
    this.getTabStatus(tabId).then(status => {
      chrome.runtime.sendMessage({
        type: 'TAB_STATUS_CHANGED',
        tabId,
        status,
      }).catch(() => {
        // Popup might not be open, ignore error
      });
    });
  }

  /**
   * Start session timeout timer for a tab
   */
  private async startSessionTimer(tabId: number): Promise<void> {
    // Clear any existing timer for this tab
    this.clearSessionTimer(tabId);

    // Get auto-lock timeout from settings
    const settings = await this.storageManager.getSettings();
    const timeoutMinutes = settings.autoLockTimeout;

    // If timeout is 0, never auto-lock
    if (timeoutMinutes === 0) {
      console.log(`Auto-lock disabled for tab ${tabId}`);
      return;
    }

    // Convert minutes to milliseconds
    const timeoutMs = timeoutMinutes * 60 * 1000;

    console.log(`Starting session timer for tab ${tabId}: ${timeoutMinutes} minutes`);

    // Create timer that will lock the tab after timeout
    const timer = setTimeout(async () => {
      const privateTab = this.privateTabs.get(tabId);
      if (privateTab && !privateTab.isLocked) {
        console.log(`Session timeout reached for tab ${tabId}, auto-locking`);
        await this.lockTab(tabId);

        // Send notification if enabled
        if (settings.showNotifications) {
          try {
            await chrome.notifications.create(`session-timeout-${tabId}`, {
              type: 'basic',
              iconUrl: 'icons/icon128.png',
              title: 'PrivateTab Auto-Locked',
              message: `Tab "${privateTab.title}" has been locked due to inactivity.`,
              priority: 1,
            });
          } catch (error) {
            console.error('Failed to show notification:', error);
          }
        }
      }

      // Clean up timer reference
      this.sessionTimers.delete(tabId);
    }, timeoutMs);

    // Store timer reference
    this.sessionTimers.set(tabId, timer);
  }

  /**
   * Clear session timeout timer for a tab
   */
  private clearSessionTimer(tabId: number): void {
    const timer = this.sessionTimers.get(tabId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(tabId);
      console.log(`Cleared session timer for tab ${tabId}`);
    }
  }

  /**
   * Clear all session timers
   */
  clearAllSessionTimers(): void {
    this.sessionTimers.forEach((timer, tabId) => {
      clearTimeout(timer);
      console.log(`Cleared session timer for tab ${tabId}`);
    });
    this.sessionTimers.clear();
  }

  /**
   * Restart session timers for all unlocked tabs
   * Useful when settings change or extension restarts
   */
  async restartSessionTimers(): Promise<void> {
    console.log('Restarting session timers for unlocked tabs');

    for (const [tabId, privateTab] of this.privateTabs.entries()) {
      if (!privateTab.isLocked && privateTab.lastUnlocked) {
        await this.startSessionTimer(tabId);
      }
    }
  }
}
