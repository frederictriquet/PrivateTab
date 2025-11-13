import React, { useState, useEffect } from 'react';
import type { PrivateTab, TabStatus, Settings, IncognitoMode } from '@shared/types';
import { SECURITY } from '@shared/constants';

interface CurrentTab {
  id: number;
  title: string;
  url: string;
  status: TabStatus;
}

function App() {
  const [currentTab, setCurrentTab] = useState<CurrentTab | null>(null);
  const [privateTabs, setPrivateTabs] = useState<PrivateTab[]>([]);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newWhitelistUrl, setNewWhitelistUrl] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingRemoveTabId, setPendingRemoveTabId] = useState<number | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const statusResponse = await chrome.runtime.sendMessage({
          type: 'GET_CURRENT_TAB_STATUS',
          tabId: tab.id,
        });

        setCurrentTab({
          id: tab.id,
          title: tab.title || 'Untitled',
          url: tab.url || '',
          status: statusResponse.status || 'normal',
        });
      }

      // Get all private tabs
      const tabsResponse = await chrome.runtime.sendMessage({
        type: 'GET_PRIVATE_TABS',
      });
      setPrivateTabs(tabsResponse.tabs || []);

      // Check if master password is set
      const storage = await chrome.storage.local.get('masterPasswordHash');
      setHasMasterPassword(!!storage.masterPasswordHash);

      // Load settings
      const settingsResponse = await chrome.runtime.sendMessage({
        type: 'GET_SETTINGS',
      });
      setSettings(settingsResponse.settings);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load extension data');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (partialSettings: Partial<Settings>) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: partialSettings,
      });
      setSettings(response.settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError('Failed to update settings');
    }
  };

  const handleAddWhitelistUrl = () => {
    if (!newWhitelistUrl.trim() || !settings) return;

    const updatedWhitelist = [...settings.whitelistedUrls, newWhitelistUrl.trim()];
    updateSetting({ whitelistedUrls: updatedWhitelist });
    setNewWhitelistUrl('');
  };

  const handleRemoveWhitelistUrl = (pattern: string) => {
    if (!settings) return;

    const updatedWhitelist = settings.whitelistedUrls.filter(p => p !== pattern);
    updateSetting({ whitelistedUrls: updatedWhitelist });
  };

  const handleTogglePrivate = async () => {
    if (!currentTab) return;

    if (!hasMasterPassword) {
      setShowPasswordSetup(true);
      return;
    }

    try {
      const isPrivate = currentTab.status !== 'normal';

      // If removing private status, require password verification
      if (isPrivate) {
        setPendingRemoveTabId(currentTab.id);
        setShowPasswordPrompt(true);
        setError('');
        return;
      }

      // If marking as private, no password needed
      await chrome.runtime.sendMessage({
        type: 'MARK_TAB_PRIVATE',
        tabId: currentTab.id,
        isPrivate: true,
      });

      await loadData();
    } catch (error) {
      console.error('Failed to toggle private:', error);
      setError('Failed to update tab status');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < SECURITY.PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${SECURITY.PASSWORD_MIN_LENGTH} characters`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_MASTER_PASSWORD',
        password,
      });

      if (response.success) {
        setHasMasterPassword(true);
        setShowPasswordSetup(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(response.error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Failed to set password:', error);
      setError('Failed to set password');
    }
  };

  const handleVerifyAndRemovePrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRemoveTabId || !verifyPassword) return;

    setError('');
    setVerifying(true);

    try {
      // Verify password
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_MASTER_PASSWORD',
        password: verifyPassword,
      });

      if (response.success) {
        // Password correct, remove private status
        await chrome.runtime.sendMessage({
          type: 'MARK_TAB_PRIVATE',
          tabId: pendingRemoveTabId,
          isPrivate: false,
        });

        // Reset state and reload
        setShowPasswordPrompt(false);
        setPendingRemoveTabId(null);
        setVerifyPassword('');
        await loadData();
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      console.error('Failed to verify password:', error);
      setError('Failed to verify password');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelPasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPendingRemoveTabId(null);
    setVerifyPassword('');
    setError('');
  };

  const handleLockAll = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'LOCK_ALL_TABS' });
      await loadData();
    } catch (error) {
      console.error('Failed to lock all tabs:', error);
    }
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (showPasswordSetup) {
    return (
      <div className="popup-container">
        <div className="header">
          <h1>Set Master Password</h1>
          <p className="subtitle">Create a password to protect your private tabs</p>
        </div>

        <form onSubmit={handleSetPassword} className="password-form">
          <input
            type="password"
            placeholder={`Enter password (min ${SECURITY.PASSWORD_MIN_LENGTH} chars)`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoFocus
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" className="button primary">
            Set Password
          </button>
          <button
            type="button"
            onClick={() => setShowPasswordSetup(false)}
            className="button secondary"
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  if (showSettings && settings) {
    return (
      <div className="popup-container">
        <div className="header">
          <button onClick={() => setShowSettings(false)} className="back-button">
            ← Back
          </button>
          <h1>Settings</h1>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="settings-section">
          <h3>Privacy Mode</h3>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.privateMode}
                onChange={(e) => updateSetting({ privateMode: e.target.checked })}
              />
              <span>Enable Private Mode</span>
            </label>
            <p className="setting-description">
              Keep all private tabs locked. Disables session timeout.
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Auto-Lock Timeout</h3>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="number"
                min="0"
                max="60"
                value={settings.autoLockTimeout}
                onChange={(e) => updateSetting({ autoLockTimeout: parseInt(e.target.value) })}
                className="input-small"
              />
              <span>minutes (0 = never)</span>
            </label>
            <p className="setting-description">
              Automatically lock unlocked private tabs after inactivity.
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Incognito Mode</h3>
          <div className="setting-item">
            <select
              value={settings.incognitoMode}
              onChange={(e) => updateSetting({ incognitoMode: e.target.value as IncognitoMode })}
              className="select"
            >
              <option value="normal">Normal (same as regular tabs)</option>
              <option value="always-lock">Always Lock (never auto-unlock)</option>
              <option value="disabled">Disabled (can't mark as private)</option>
            </select>
            <p className="setting-description">
              How to handle incognito/private browsing tabs.
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>URL Whitelist</h3>
          <p className="setting-description">
            URLs matching these patterns will never auto-lock.
            Use * for wildcards (e.g., https://example.com/* or **/*.example.com).
          </p>
          <div className="whitelist-add">
            <input
              type="text"
              placeholder="https://example.com/*"
              value={newWhitelistUrl}
              onChange={(e) => setNewWhitelistUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddWhitelistUrl()}
              className="input"
            />
            <button onClick={handleAddWhitelistUrl} className="button primary">
              Add
            </button>
          </div>
          {settings.whitelistedUrls.length > 0 && (
            <div className="whitelist-list">
              {settings.whitelistedUrls.map((pattern, index) => (
                <div key={index} className="whitelist-item">
                  <span className="whitelist-pattern">{pattern}</span>
                  <button
                    onClick={() => handleRemoveWhitelistUrl(pattern)}
                    className="button-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>Other Settings</h3>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.lockOnTabSwitch}
                onChange={(e) => updateSetting({ lockOnTabSwitch: e.target.checked })}
              />
              <span>Lock on tab switch</span>
            </label>
          </div>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => updateSetting({ showNotifications: e.target.checked })}
              />
              <span>Show notifications</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h1>PrivateTab</h1>
        <div className="header-actions">
          {privateTabs.length > 0 && (
            <span className="badge">{privateTabs.length}</span>
          )}
          <button onClick={() => setShowSettings(true)} className="settings-button" title="Settings">
            ⚙️
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {currentTab && (
        <div className="current-tab">
          <div className="tab-info">
            <div className="tab-title">{currentTab.title}</div>
            <div className="tab-url">{new URL(currentTab.url).hostname}</div>
          </div>

          {showPasswordPrompt ? (
            <div className="inline-password-prompt">
              <p className="prompt-label">Enter password to remove private status:</p>
              <form onSubmit={handleVerifyAndRemovePrivate} className="inline-password-form">
                <input
                  type="password"
                  placeholder="Master password"
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  className="input"
                  autoFocus
                  disabled={verifying}
                />
                <div className="inline-buttons">
                  <button
                    type="submit"
                    className="button primary small"
                    disabled={verifying || !verifyPassword}
                  >
                    {verifying ? 'Verifying...' : 'Remove'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPasswordPrompt}
                    className="button secondary small"
                    disabled={verifying}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={handleTogglePrivate}
              className={`toggle-button ${currentTab.status !== 'normal' ? 'active' : ''}`}
            >
              {currentTab.status !== 'normal' ? 'Remove Private' : 'Mark as Private'}
            </button>
          )}
        </div>
      )}

      {privateTabs.length > 0 && (
        <>
          <div className="section-header">
            <span>Private Tabs ({privateTabs.length})</span>
            <button onClick={handleLockAll} className="button-small">
              Lock All
            </button>
          </div>

          <div className="tabs-list">
            {privateTabs.map((tab) => (
              <div key={tab.id} className="tab-item">
                <div className="tab-icon">
                  {tab.isLocked ? '🔒' : '🔓'}
                </div>
                <div className="tab-details">
                  <div className="tab-item-title">{tab.title}</div>
                  <div className="tab-item-url">
                    {new URL(tab.url).hostname}
                  </div>
                </div>
                <div className={`status-indicator ${tab.isLocked ? 'locked' : 'unlocked'}`}>
                  {tab.isLocked ? 'Locked' : 'Unlocked'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {privateTabs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <div className="empty-title">No Private Tabs</div>
          <div className="empty-description">
            Mark tabs as private to protect their content with a password
          </div>
        </div>
      )}

      <div className="footer">
        <div className="footer-text">
          Press Ctrl+Shift+P to quickly mark tabs
        </div>
      </div>
    </div>
  );
}

export default App;
