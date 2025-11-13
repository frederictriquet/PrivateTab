// Message types for communication between extension components

export type MessageType =
  // Content -> Background
  | 'VERIFY_PASSWORD'
  | 'TAB_LOCKED'
  | 'TAB_UNLOCKED'
  | 'REQUEST_LOCK_STATUS'
  // Background -> Content
  | 'LOCK_TAB'
  | 'UNLOCK_TAB'
  | 'PASSWORD_VERIFIED'
  | 'INJECT_OVERLAY'
  | 'SET_TITLE'
  // Popup -> Background
  | 'GET_PRIVATE_TABS'
  | 'MARK_TAB_PRIVATE'
  | 'LOCK_ALL_TABS'
  | 'SET_MASTER_PASSWORD'
  | 'VERIFY_MASTER_PASSWORD'
  | 'GET_CURRENT_TAB_STATUS'
  | 'CHANGE_MASTER_PASSWORD'
  | 'UPDATE_SETTINGS'
  | 'GET_SETTINGS'
  // Background -> Popup
  | 'PRIVATE_TABS_LIST'
  | 'TAB_STATUS_CHANGED'
  | 'MASTER_PASSWORD_SET'
  | 'PASSWORD_VERIFICATION_RESULT'
  | 'SETTINGS_UPDATED';

export interface BaseMessage {
  type: MessageType;
}

// Content -> Background messages
export interface VerifyPasswordMessage extends BaseMessage {
  type: 'VERIFY_PASSWORD';
  password: string;
  tabId: number;
}

export interface TabLockedMessage extends BaseMessage {
  type: 'TAB_LOCKED';
  tabId: number;
}

export interface TabUnlockedMessage extends BaseMessage {
  type: 'TAB_UNLOCKED';
  tabId: number;
}

export interface RequestLockStatusMessage extends BaseMessage {
  type: 'REQUEST_LOCK_STATUS';
  // Note: tabId is extracted from sender.tab.id by message handler
}

// Background -> Content messages
export interface LockTabMessage extends BaseMessage {
  type: 'LOCK_TAB';
  tabId: number;
}

export interface UnlockTabMessage extends BaseMessage {
  type: 'UNLOCK_TAB';
  tabId: number;
}

export interface PasswordVerifiedMessage extends BaseMessage {
  type: 'PASSWORD_VERIFIED';
  success: boolean;
  attempts?: number;
}

export interface InjectOverlayMessage extends BaseMessage {
  type: 'INJECT_OVERLAY';
  tabId: number;
}

export interface SetTitleMessage extends BaseMessage {
  type: 'SET_TITLE';
  title: string;
}

// Popup -> Background messages
export interface GetPrivateTabsMessage extends BaseMessage {
  type: 'GET_PRIVATE_TABS';
}

export interface MarkTabPrivateMessage extends BaseMessage {
  type: 'MARK_TAB_PRIVATE';
  tabId: number;
  isPrivate: boolean;
}

export interface LockAllTabsMessage extends BaseMessage {
  type: 'LOCK_ALL_TABS';
}

export interface SetMasterPasswordMessage extends BaseMessage {
  type: 'SET_MASTER_PASSWORD';
  password: string;
}

export interface VerifyMasterPasswordMessage extends BaseMessage {
  type: 'VERIFY_MASTER_PASSWORD';
  password: string;
}

export interface GetCurrentTabStatusMessage extends BaseMessage {
  type: 'GET_CURRENT_TAB_STATUS';
  tabId: number;
}

export interface ChangeMasterPasswordMessage extends BaseMessage {
  type: 'CHANGE_MASTER_PASSWORD';
  currentPassword: string;
  newPassword: string;
}

export interface UpdateSettingsMessage extends BaseMessage {
  type: 'UPDATE_SETTINGS';
  settings: Partial<import('./index').Settings>;
}

export interface GetSettingsMessage extends BaseMessage {
  type: 'GET_SETTINGS';
}

// Background -> Popup messages
export interface PrivateTabsListMessage extends BaseMessage {
  type: 'PRIVATE_TABS_LIST';
  tabs: import('./index').PrivateTab[];
}

export interface TabStatusChangedMessage extends BaseMessage {
  type: 'TAB_STATUS_CHANGED';
  tabId: number;
  status: import('./index').TabStatus;
}

export interface MasterPasswordSetMessage extends BaseMessage {
  type: 'MASTER_PASSWORD_SET';
  success: boolean;
  error?: string;
}

export interface PasswordVerificationResultMessage extends BaseMessage {
  type: 'PASSWORD_VERIFICATION_RESULT';
  success: boolean;
  attempts?: number;
}

export interface SettingsUpdatedMessage extends BaseMessage {
  type: 'SETTINGS_UPDATED';
  settings: import('./index').Settings;
}

export type ExtensionMessage =
  | VerifyPasswordMessage
  | TabLockedMessage
  | TabUnlockedMessage
  | RequestLockStatusMessage
  | LockTabMessage
  | UnlockTabMessage
  | PasswordVerifiedMessage
  | InjectOverlayMessage
  | SetTitleMessage
  | GetPrivateTabsMessage
  | MarkTabPrivateMessage
  | LockAllTabsMessage
  | SetMasterPasswordMessage
  | VerifyMasterPasswordMessage
  | GetCurrentTabStatusMessage
  | ChangeMasterPasswordMessage
  | UpdateSettingsMessage
  | GetSettingsMessage
  | PrivateTabsListMessage
  | TabStatusChangedMessage
  | MasterPasswordSetMessage
  | PasswordVerificationResultMessage
  | SettingsUpdatedMessage;
