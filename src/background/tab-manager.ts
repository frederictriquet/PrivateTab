// Tab manager - handles private tab state and operations

import type { PrivateTab, TabStatus } from '@shared/types';
import type { StorageManager } from './storage-manager';

export class TabManager {
  private privateTabs: Map<number, PrivateTab> = new Map();
  private storageManager: StorageManager;

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

      // Inject content script and lock tab
      await this.injectContentScript(tabId);
      await this.lockTab(tabId);
    } else {
      // Remove private status
      this.privateTabs.delete(tabId);
      await this.unlockTab(tabId);
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
   */
  async unlockTab(tabId: number): Promise<void> {
    const privateTab = this.privateTabs.get(tabId);
    if (!privateTab) return;

    privateTab.isLocked = false;
    privateTab.lastUnlocked = Date.now();
    await this.savePrivateTabs();

    // Send message to content script to hide overlay
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'UNLOCK_TAB', tabId });
    } catch (error) {
      console.error(`Failed to send unlock message to tab ${tabId}:`, error);
    }

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
   */
  async handleTabActivated(tabId: number): Promise<void> {
    const isPrivate = await this.isPrivateTab(tabId);
    if (isPrivate) {
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

      // Re-inject content script if needed
      if (privateTab.isLocked) {
        await this.injectContentScript(tabId);
      }
    }
  }

  /**
   * Inject content script into a tab
   */
  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/index.js'],
      });
    } catch (error) {
      console.error(`Failed to inject content script into tab ${tabId}:`, error);
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
}
