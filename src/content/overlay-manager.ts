// Overlay manager - handles the privacy overlay UI

import { UI } from '@shared/constants';

export class OverlayManager {
  private overlay: HTMLDivElement | null = null;
  private passwordInput: HTMLInputElement | null = null;

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
  }

  /**
   * Hide the privacy overlay
   */
  hideOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.passwordInput = null;
    }
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

    // Prevent context menu
    this.overlay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Prevent keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.overlay && this.overlay.style.display !== 'none') {
        // Only allow typing in password input
        if (e.target !== this.passwordInput) {
          if (e.key !== 'Tab') {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    }, true);
  }
}
