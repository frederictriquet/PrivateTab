// Unit tests for utility functions

import { describe, it, expect } from 'vitest';
import {
  isProtectableUrl,
  formatTimestamp,
  validatePasswordStrength,
} from '@shared/utils';

describe('isProtectableUrl', () => {
  it('should return true for regular HTTP/HTTPS URLs', () => {
    expect(isProtectableUrl('https://example.com')).toBe(true);
    expect(isProtectableUrl('http://example.com')).toBe(true);
  });

  it('should return false for browser internal pages', () => {
    expect(isProtectableUrl('chrome://extensions')).toBe(false);
    expect(isProtectableUrl('about:blank')).toBe(false);
    expect(isProtectableUrl('chrome-extension://abc123')).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(isProtectableUrl('not-a-url')).toBe(false);
    expect(isProtectableUrl('')).toBe(false);
  });
});

describe('formatTimestamp', () => {
  it('should format recent timestamps correctly', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 30000)).toBe('just now'); // 30 seconds ago
  });

  it('should format minute timestamps', () => {
    const now = Date.now();
    const result = formatTimestamp(now - 120000); // 2 minutes ago
    expect(result).toContain('minute');
  });
});

describe('validatePasswordStrength', () => {
  it('should reject passwords that are too short', () => {
    const result = validatePasswordStrength('short');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should accept strong passwords', () => {
    const result = validatePasswordStrength('StrongPass123!');
    expect(result.strength).toBe('strong');
  });

  it('should identify weak passwords', () => {
    const result = validatePasswordStrength('password');
    expect(result.strength).toBe('weak');
  });
});
