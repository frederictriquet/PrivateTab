// Content script entry point

import { OverlayManager } from './overlay-manager';

console.log('PrivateTab content script loaded');

const overlayManager = new OverlayManager();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message.type);

  switch (message.type) {
    case 'LOCK_TAB':
      overlayManager.showOverlay();
      sendResponse({ success: true });
      break;

    case 'UNLOCK_TAB':
      overlayManager.hideOverlay();
      sendResponse({ success: true });
      break;

    case 'PASSWORD_VERIFIED':
      if (message.success) {
        overlayManager.hideOverlay();
      } else {
        overlayManager.showError(
          `Incorrect password${message.attempts ? ` (${message.attempts}/5 attempts)` : ''}`
        );
      }
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Async response
});

// Check if this tab should be locked on load
chrome.runtime.sendMessage({ type: 'REQUEST_LOCK_STATUS', tabId: getCurrentTabId() })
  .then(response => {
    if (response.status === 'private-locked') {
      overlayManager.showOverlay();
    }
  })
  .catch(error => {
    console.error('Failed to check lock status:', error);
  });

function getCurrentTabId(): number {
  // This will be set by the background script when injecting
  return -1; // Placeholder
}
