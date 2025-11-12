import React, { useState, useEffect } from 'react';
import type { PrivateTab, TabStatus } from '@shared/types';

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load extension data');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivate = async () => {
    if (!currentTab) return;

    if (!hasMasterPassword) {
      setShowPasswordSetup(true);
      return;
    }

    try {
      const isPrivate = currentTab.status !== 'normal';
      await chrome.runtime.sendMessage({
        type: 'MARK_TAB_PRIVATE',
        tabId: currentTab.id,
        isPrivate: !isPrivate,
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
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
            placeholder="Enter password (min 8 chars)"
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

  return (
    <div className="popup-container">
      <div className="header">
        <h1>PrivateTab</h1>
        {privateTabs.length > 0 && (
          <span className="badge">{privateTabs.length}</span>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {currentTab && (
        <div className="current-tab">
          <div className="tab-info">
            <div className="tab-title">{currentTab.title}</div>
            <div className="tab-url">{new URL(currentTab.url).hostname}</div>
          </div>
          <button
            onClick={handleTogglePrivate}
            className={`toggle-button ${currentTab.status !== 'normal' ? 'active' : ''}`}
          >
            {currentTab.status !== 'normal' ? 'Remove Private' : 'Mark as Private'}
          </button>
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
