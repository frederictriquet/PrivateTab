// Content script entry point

import './styles.css';

console.log('PrivateTab content script loaded');

// Expose blocker functions globally so overlay-manager can access them
declare global {
  interface Window {
    __privateTabHideBlocker?: () => void;
  }
}

// Lazy load overlay manager only when needed
let overlayManager: any = null;

async function getOverlayManager() {
  if (!overlayManager) {
    const { OverlayManager } = await import('./overlay-manager');
    overlayManager = new OverlayManager();
  }
  return overlayManager;
}

// Create a persistent blocker element
let blockerElement: HTMLDivElement | null = null;

function createBlocker(): HTMLDivElement {
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
  return blocker;
}

function showBlocker() {
  if (!blockerElement) {
    blockerElement = createBlocker();
    if (document.documentElement) {
      document.documentElement.appendChild(blockerElement);
    }
  } else {
    blockerElement.style.display = 'block';
  }
}

function hideBlocker() {
  console.log('[ContentScript] hideBlocker called, blockerElement:', blockerElement);
  if (blockerElement) {
    blockerElement.style.display = 'none';
    console.log('[ContentScript] Blocker display set to none');
  } else {
    console.warn('[ContentScript] hideBlocker called but blockerElement is null');
  }
}

// Expose hideBlocker globally for overlay-manager
window.__privateTabHideBlocker = hideBlocker;
console.log('[ContentScript] hideBlocker exposed globally, checking:', window.__privateTabHideBlocker !== undefined);

// Show blocker immediately on load
showBlocker();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message.type);

  // Handle async operations
  (async () => {
    try {
      switch (message.type) {
        case 'LOCK_TAB':
          // Show blocker first to hide content immediately, then show overlay
          showBlocker();
          const manager = await getOverlayManager();
          manager.showOverlay();
          // Hide blocker after a brief delay to let overlay render
          setTimeout(() => hideBlocker(), 100);
          sendResponse({ success: true });
          break;

        case 'UNLOCK_TAB':
          const unlockManager = await getOverlayManager();
          unlockManager.hideOverlay();
          hideBlocker();
          sendResponse({ success: true });
          break;

        case 'PASSWORD_VERIFIED':
          const verifyManager = await getOverlayManager();
          if (message.success) {
            verifyManager.hideOverlay();
            hideBlocker();
          } else {
            verifyManager.showError(
              `Incorrect password${message.attempts ? ` (${message.attempts}/5 attempts)` : ''}`
            );
          }
          sendResponse({ success: true });
          break;

        case 'SET_TITLE':
          // Update the document title
          if (message.title) {
            document.title = message.title;
            console.log(`Content script set title to: ${message.title}`);
          }
          sendResponse({ success: true });
          break;

        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: 'Failed to handle message' });
    }
  })();

  return true; // Async response
});

// Check if this tab should be locked on load
// Note: We don't send tabId - background script will use sender.tab.id
chrome.runtime.sendMessage({ type: 'REQUEST_LOCK_STATUS' })
  .then(async response => {
    console.log('Lock status response:', response);

    if (response.status === 'private-locked') {
      // Tab is locked - show overlay and hide blocker after overlay loads
      const manager = await getOverlayManager();
      manager.showOverlay();
      setTimeout(() => hideBlocker(), 100);
    } else {
      // Tab is not locked - just hide blocker
      hideBlocker();
    }
  })
  .catch(error => {
    console.error('Failed to check lock status:', error);
    // On error, hide blocker (fail open for usability)
    hideBlocker();
  });
