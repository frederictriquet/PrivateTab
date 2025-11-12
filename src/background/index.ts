// Background service worker entry point

import { TabManager } from './tab-manager';
import { StorageManager } from './storage-manager';
import { MessageHandler } from './message-handler';

console.log('PrivateTab background service worker started');

// Initialize managers
const storageManager = new StorageManager();
const tabManager = new TabManager(storageManager);
const messageHandler = new MessageHandler(tabManager, storageManager);

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async details => {
  console.log('Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First-time installation
    await storageManager.initialize();
    console.log('Extension initialized with default settings');
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated to version', chrome.runtime.getManifest().version);
  }

  // Restart session timers for any unlocked tabs
  await tabManager.restartSessionTimers();
});

// On startup (service worker restarted), restart session timers
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension started, restarting session timers');
  await tabManager.restartSessionTimers();
});

// Tab event listeners
chrome.tabs.onActivated.addListener(async activeInfo => {
  await tabManager.handleTabActivated(activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
  await tabManager.handleTabRemoved(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await tabManager.handleTabUpdated(tabId, tab);
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageHandler
    .handleMessage(message, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    });

  // Return true to indicate async response
  return true;
});

// Keyboard command listener
chrome.commands.onCommand.addListener(async command => {
  if (command === 'toggle-private') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const isPrivate = await tabManager.isPrivateTab(tab.id);
      await tabManager.toggleTabPrivate(tab.id, !isPrivate);
    }
  } else if (command === 'lock-all') {
    await tabManager.lockAllTabs();
  }
});

// Keep service worker alive (for Chrome)
chrome.runtime.onMessage.addListener(() => {
  // Empty listener to keep service worker alive
});

// Cleanup on shutdown (best effort)
self.addEventListener('beforeunload', async () => {
  console.log('Background service worker shutting down');
  tabManager.clearAllSessionTimers();
});

export { tabManager, storageManager, messageHandler };
