// Unit tests for CryptoService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CryptoService } from '@background/crypto';
import { SECURITY } from '@shared/constants';

describe('CryptoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with default salt', async () => {
      const password = 'TestPassword123!';
      const result = await CryptoService.hashPassword(password);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iterations).toBe(SECURITY.PBKDF2_ITERATIONS);
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should hash password with provided salt', async () => {
      const password = 'TestPassword123!';
      const salt = new Uint8Array(16);
      for (let i = 0; i < 16; i++) salt[i] = i;

      const result = await CryptoService.hashPassword(password, salt);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iterations).toBe(SECURITY.PBKDF2_ITERATIONS);
    });

    it('should produce different hashes for different passwords', async () => {
      const password1 = 'Password1';
      const password2 = 'Password2';

      const result1 = await CryptoService.hashPassword(password1);
      const result2 = await CryptoService.hashPassword(password2);

      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should produce different salts for same password (if no salt provided)', async () => {
      const password = 'TestPassword123!';

      const result1 = await CryptoService.hashPassword(password);
      const result2 = await CryptoService.hashPassword(password);

      // Different salts should produce different hashes
      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should produce same hash for same password and salt', async () => {
      const password = 'TestPassword123!';
      const salt = new Uint8Array(16);
      for (let i = 0; i < 16; i++) salt[i] = 42;

      const result1 = await CryptoService.hashPassword(password, salt);
      const result2 = await CryptoService.hashPassword(password, salt);

      expect(result1.hash).toBe(result2.hash);
      expect(result1.salt).toBe(result2.salt);
    });

    it('should handle empty password', async () => {
      const password = '';
      const result = await CryptoService.hashPassword(password);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(200);
      const result = await CryptoService.hashPassword(password);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);

      const isValid = await CryptoService.verifyPassword(password, hash, salt, iterations);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(correctPassword);

      const isValid = await CryptoService.verifyPassword(wrongPassword, hash, salt, iterations);
      expect(isValid).toBe(false);
    });

    it('should handle password with special characters', async () => {
      const password = 'P@$$w0rd!#$%^&*()';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);

      const isValid = await CryptoService.verifyPassword(password, hash, salt, iterations);
      expect(isValid).toBe(true);
    });

    it('should be case-sensitive', async () => {
      const password = 'CaseSensitive123!';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);

      const isValidLower = await CryptoService.verifyPassword('casesensitive123!', hash, salt, iterations);
      const isValidUpper = await CryptoService.verifyPassword('CASESENSITIVE123!', hash, salt, iterations);

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const password = '';
      const { hash, salt, iterations } = await CryptoService.hashPassword(password);

      const isValid = await CryptoService.verifyPassword('', hash, salt, iterations);
      expect(isValid).toBe(true);

      const isInvalid = await CryptoService.verifyPassword('notEmpty', hash, salt, iterations);
      expect(isInvalid).toBe(false);
    });

    it('should return false for invalid salt', async () => {
      // Suppress expected error log
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const password = 'TestPassword123!';
      const { hash, iterations } = await CryptoService.hashPassword(password);
      const invalidSalt = 'invalid-base64!!!';

      const isValid = await CryptoService.verifyPassword(password, hash, invalidSalt, iterations);
      expect(isValid).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should handle crypto errors gracefully', async () => {
      // Suppress expected error log
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const password = 'TestPassword123!';

      // Mock crypto.subtle to throw an error
      const originalImportKey = crypto.subtle.importKey;
      vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new Error('Crypto error'));

      const isValid = await CryptoService.verifyPassword(password, 'hash', 'salt', 100000);
      expect(isValid).toBe(false);

      // Restore original function
      crypto.subtle.importKey = originalImportKey;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const password = 'ValidPassword123!';
      const result = CryptoService.validatePassword(password);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject password that is too short', () => {
      const password = ''; // Empty password is shorter than PASSWORD_MIN_LENGTH (1)
      const result = CryptoService.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject empty password', () => {
      const password = '';
      const result = CryptoService.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject password that is too long', () => {
      const password = 'a'.repeat(200);
      const result = CryptoService.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should accept password exactly at minimum length', () => {
      const password = 'a'.repeat(SECURITY.PASSWORD_MIN_LENGTH);
      const result = CryptoService.validatePassword(password);

      expect(result.valid).toBe(true);
    });

    it('should accept password at maximum length (128)', () => {
      const password = 'a'.repeat(128);
      const result = CryptoService.validatePassword(password);

      expect(result.valid).toBe(true);
    });

    it('should handle null or undefined password', () => {
      const resultNull = CryptoService.validatePassword(null as any);
      const resultUndefined = CryptoService.validatePassword(undefined as any);

      expect(resultNull.valid).toBe(false);
      expect(resultUndefined.valid).toBe(false);
    });
  });

  describe('security properties', () => {
    it('should use PBKDF2 with SHA-256', async () => {
      const importKeySpy = vi.spyOn(crypto.subtle, 'importKey');
      const deriveBitsSpy = vi.spyOn(crypto.subtle, 'deriveBits');

      await CryptoService.hashPassword('test');

      expect(importKeySpy).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      expect(deriveBitsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          hash: 'SHA-256',
          iterations: SECURITY.PBKDF2_ITERATIONS,
        }),
        expect.anything(),
        256
      );
    });

    it('should use sufficient iteration count', async () => {
      const { iterations } = await CryptoService.hashPassword('test');
      expect(iterations).toBeGreaterThanOrEqual(100000);
    });
  });
});
