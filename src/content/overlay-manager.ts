// Overlay manager - handles the privacy overlay UI

import { UI } from '@shared/constants';

export class OverlayManager {
  private overlay: HTMLDivElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private devtoolsCheckInterval: number | null = null;
  private mutationObserver: MutationObserver | null = null;

  /**
   * Show the privacy overlay
   */
  showOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      return;
    }

    this.createOverlay();
    this.attachEventListeners();
    this.startDevtoolsDetection();
    this.startDOMProtection();
  }

  /**
   * Hide the privacy overlay
   */
  hideOverlay(): void {
    // Stop DOM protection
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.passwordInput = null;
    }

    // Stop devtools detection
    if (this.devtoolsCheckInterval) {
      clearInterval(this.devtoolsCheckInterval);
      this.devtoolsCheckInterval = null;
    }

    // Memory cleanup: clear any sensitive data
    this.clearSensitiveData();
  }

  /**
   * Show an error message
   */
  showError(message: string): void {
    const errorElement = this.overlay?.querySelector('.privatetab-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');

      setTimeout(() => {
        errorElement.classList.remove('visible');
      }, 3000);
    }
  }

  /**
   * Create the overlay DOM structure
   */
  private createOverlay(): void {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.className = 'privatetab-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(20px);
      z-index: ${UI.OVERLAY_Z_INDEX};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create lock icon
    const lockIcon = document.createElement('div');
    lockIcon.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;
    lockIcon.style.cssText = `
      color: #fff;
      margin-bottom: 24px;
      opacity: 0.9;
    `;

    // Create content container
    const content = document.createElement('div');
    content.className = 'privatetab-content';
    content.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    `;

    // Create title
    const title = document.createElement('h1');
    title.textContent = 'Private Tab';
    title.style.cssText = `
      color: #fff;
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
    `;

    // Create description
    const description = document.createElement('p');
    description.textContent = 'Enter your password to unlock this tab';
    description.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      margin: 0 0 32px 0;
    `;

    // Create password form
    const form = document.createElement('form');
    form.className = 'privatetab-form';

    // Create password input
    this.passwordInput = document.createElement('input');
    this.passwordInput.type = 'password';
    this.passwordInput.placeholder = 'Enter password';
    this.passwordInput.className = 'privatetab-input';
    this.passwordInput.style.cssText = `
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      outline: none;
      transition: all 0.2s;
      margin-bottom: 16px;
      box-sizing: border-box;
    `;

    // Create unlock button
    const unlockButton = document.createElement('button');
    unlockButton.type = 'submit';
    unlockButton.textContent = 'Unlock';
    unlockButton.className = 'privatetab-unlock-btn';
    unlockButton.style.cssText = `
      width: 100%;
      padding: 14px 16px;
      background: #3b82f6;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    `;

    // Create error message
    const error = document.createElement('div');
    error.className = 'privatetab-error';
    error.style.cssText = `
      color: #ef4444;
      font-size: 14px;
      margin-top: 16px;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    // Assemble the overlay
    form.appendChild(this.passwordInput);
    form.appendChild(unlockButton);
    form.appendChild(error);

    content.appendChild(lockIcon);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(form);

    this.overlay.appendChild(content);
    document.body.appendChild(this.overlay);

    // Focus password input
    setTimeout(() => this.passwordInput?.focus(), 100);

    // Prevent page interaction
    this.preventPageInteraction();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const form = this.overlay?.querySelector('.privatetab-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUnlock();
      });
    }

    // Hover effects
    const button = this.overlay?.querySelector('.privatetab-unlock-btn') as HTMLElement;
    if (button) {
      button.addEventListener('mouseenter', () => {
        button.style.background = '#2563eb';
        button.style.transform = 'translateY(-1px)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = '#3b82f6';
        button.style.transform = 'translateY(0)';
      });
    }

    const input = this.passwordInput;
    if (input) {
      input.addEventListener('focus', () => {
        input.style.borderColor = 'rgba(59, 130, 246, 0.5)';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
    }
  }

  /**
   * Handle unlock attempt
   */
  private async handleUnlock(): Promise<void> {
    const password = this.passwordInput?.value;
    if (!password) {
      this.showError('Please enter a password');
      return;
    }

    // Disable button during verification
    const button = this.overlay?.querySelector('.privatetab-unlock-btn') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = 'Verifying...';
    }

    try {
      // Send password to background for verification
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_PASSWORD',
        password,
        tabId: await this.getCurrentTabId(),
      });

      if (response.success) {
        this.hideOverlay();
      } else {
        this.showError(
          response.attempts >= 5
            ? 'Too many attempts. Please wait 5 minutes.'
            : `Incorrect password (${response.attempts}/5 attempts)`
        );
        if (this.passwordInput) {
          this.passwordInput.value = '';
          this.passwordInput.focus();
        }
      }
    } catch (error) {
      this.showError('Failed to verify password');
      console.error('Unlock error:', error);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Unlock';
      }
    }
  }

  /**
   * Get current tab ID
   */
  private async getCurrentTabId(): Promise<number> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.id || -1;
  }

  /**
   * Prevent interaction with the underlying page
   */
  private preventPageInteraction(): void {
    if (!this.overlay) return;

    // Prevent all clicks
    this.overlay.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Prevent context menu on overlay
    this.overlay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Prevent context menu globally when overlay is shown
    document.addEventListener('contextmenu', (e) => {
      if (this.overlay && this.overlay.style.display !== 'none') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('Right-click blocked while tab is locked');
        return false;
      }
    }, true);

    // Prevent keyboard shortcuts and devtools access
    document.addEventListener('keydown', (e) => {
      if (this.overlay && this.overlay.style.display !== 'none') {
        // Block common devtools shortcuts
        const blockedShortcuts = [
          e.key === 'F12', // F12 devtools
          e.key === 'I' && e.ctrlKey && e.shiftKey, // Ctrl+Shift+I
          e.key === 'J' && e.ctrlKey && e.shiftKey, // Ctrl+Shift+J (console)
          e.key === 'C' && e.ctrlKey && e.shiftKey, // Ctrl+Shift+C (inspect)
          e.key === 'U' && e.ctrlKey, // Ctrl+U (view source)
          e.key === 'S' && e.ctrlKey, // Ctrl+S (save page)
          e.key === 'P' && e.ctrlKey, // Ctrl+P (print)
          e.key === 'F' && e.ctrlKey, // Ctrl+F (find)
        ];

        if (blockedShortcuts.some(blocked => blocked)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn('Blocked keyboard shortcut while tab is locked');
          return false;
        }

        // Only allow typing in password input and Tab key
        if (e.target !== this.passwordInput) {
          if (e.key !== 'Tab') {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    }, true);

    // Prevent devtools element inspection on the overlay
    this.preventInspection();
  }

  /**
   * Detect if developer tools are open
   * This is a best-effort detection and can be bypassed
   */
  private startDevtoolsDetection(): void {
    // Only run devtools detection if overlay is shown
    if (!this.overlay) return;

    // Check devtools status periodically
    this.devtoolsCheckInterval = window.setInterval(() => {
      // Detect devtools by checking window size differences
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isDevtoolsOpen = widthThreshold || heightThreshold;

      if (isDevtoolsOpen) {
        console.warn('Developer tools detected while private tab is locked');
        // Show warning to user
        this.showError(
          'Warning: Developer tools detected. Content protection may be compromised.'
        );
      }
    }, 1000);
  }

  /**
   * Prevent inspection of the overlay element
   */
  private preventInspection(): void {
    if (!this.overlay) return;

    // Make the overlay harder to inspect by preventing certain events
    const preventInspectionEvent = (e: Event) => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };

    // Prevent select start (text selection)
    this.overlay.addEventListener('selectstart', preventInspectionEvent);

    // Prevent drag start
    this.overlay.addEventListener('dragstart', preventInspectionEvent);

    // Add pointer-events protection via CSS
    this.overlay.style.userSelect = 'none';
    this.overlay.style.webkitUserSelect = 'none';

    // Make overlay non-printable
    this.overlay.style.printColorAdjust = 'exact';

    // Protect against screenshot attempts (limited effectiveness)
    Object.defineProperty(this.overlay, 'className', {
      get: () => 'privatetab-overlay',
      set: () => {
        console.warn('Attempted to modify overlay className');
      },
      configurable: false,
    });
  }

  /**
   * Clear sensitive data from memory
   */
  private clearSensitiveData(): void {
    // Clear password input value if it exists
    if (this.passwordInput) {
      this.passwordInput.value = '';
    }

    // Clear any cached error messages
    const errorElement = document.querySelector('.privatetab-error');
    if (errorElement) {
      errorElement.textContent = '';
    }

    // Force garbage collection hint (not guaranteed)
    if (this.passwordInput) {
      this.passwordInput = null;
    }
  }

  /**
   * Start DOM protection to prevent overlay manipulation
   * Uses MutationObserver to detect and prevent overlay removal or modification
   */
  private startDOMProtection(): void {
    if (!this.overlay) return;

    // Create mutation observer to watch for DOM manipulation attempts
    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check if overlay was removed
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node === this.overlay) {
              console.warn('Overlay removal detected! Restoring...');
              // Re-inject overlay immediately
              if (document.body) {
                document.body.appendChild(this.overlay!);
              }
            }
          });
        }

        // Check if overlay was modified
        if (mutation.type === 'attributes' && mutation.target === this.overlay) {
          const attribute = mutation.attributeName;

          // Prevent display changes
          if (attribute === 'style' && this.overlay.style.display !== 'flex') {
            console.warn('Overlay display modification detected! Restoring...');
            this.overlay.style.display = 'flex';
          }

          // Prevent z-index changes
          if (attribute === 'style' &&
              this.overlay.style.zIndex !== String(UI.OVERLAY_Z_INDEX)) {
            console.warn('Overlay z-index modification detected! Restoring...');
            this.overlay.style.zIndex = String(UI.OVERLAY_Z_INDEX);
          }

          // Prevent class changes
          if (attribute === 'class' && this.overlay.className !== 'privatetab-overlay') {
            console.warn('Overlay class modification detected! Restoring...');
            this.overlay.className = 'privatetab-overlay';
          }
        }
      }
    });

    // Observe the entire document for changes
    this.mutationObserver.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    // Also prevent direct property manipulation
    this.protectOverlayProperties();
  }

  /**
   * Protect overlay properties from direct manipulation
   */
  private protectOverlayProperties(): void {
    if (!this.overlay) return;

    const overlay = this.overlay;

    try {
      // Override the remove method to prevent removal
      overlay.remove = () => {
        console.warn('Attempted to remove overlay via remove() method');
        // Don't actually remove it - just log the attempt
      };

      // Override removeChild if someone tries to remove via parent
      if (overlay.parentNode) {
        const originalRemoveChild = overlay.parentNode.removeChild.bind(overlay.parentNode);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        overlay.parentNode.removeChild = function(child: Node): Node {
          if (child === overlay) {
            console.warn('Attempted to remove overlay via removeChild()');
            return child; // Return the child but don't actually remove it
          }
          return originalRemoveChild(child as HTMLDivElement);
        } as any;
      }
    } catch (error) {
      console.error('Error protecting overlay properties:', error);
    }
  }
}
