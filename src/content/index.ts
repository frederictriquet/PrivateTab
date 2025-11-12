// Content script entry point

import { OverlayManager } from './overlay-manager';
import './styles.css';

console.log('PrivateTab content script loaded');

const overlayManager = new OverlayManager();

// Immediately create a full-page blocker to hide content
// This prevents content flash when switching to locked tabs
const blocker = document.createElement('div');
blocker.id = 'privatetab-content-blocker';
blocker.style.cssText = `
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: #000 !important;
  z-index: 2147483646 !important;
  display: block !important;
`;

// Inject blocker immediately (even before DOM is fully ready)
if (document.documentElement) {
  document.documentElement.appendChild(blocker);
} else {
  // If documentElement isn't ready, inject on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.appendChild(blocker);
  });
}

function removeBlocker() {
  const blockerElement = document.getElementById('privatetab-content-blocker');
  if (blockerElement) {
    blockerElement.remove();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message.type);

  switch (message.type) {
    case 'LOCK_TAB':
      overlayManager.showOverlay();
      removeBlocker();
      sendResponse({ success: true });
      break;

    case 'UNLOCK_TAB':
      overlayManager.hideOverlay();
      removeBlocker();
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
// Note: We don't send tabId - background script will use sender.tab.id
chrome.runtime.sendMessage({ type: 'REQUEST_LOCK_STATUS' })
  .then(response => {
    console.log('Lock status response:', response);

    if (response.status === 'private-locked') {
      // Tab is locked - show overlay and remove blocker
      overlayManager.showOverlay();
      removeBlocker();
    } else {
      // Tab is not locked - just remove blocker
      removeBlocker();
    }
  })
  .catch(error => {
    console.error('Failed to check lock status:', error);
    // On error, remove blocker (fail open for usability)
    removeBlocker();
  });
