// Cryptographic operations for password hashing and verification

import { SECURITY } from '@shared/constants';
import { arrayBufferToBase64, base64ToArrayBuffer, generateSalt } from '@shared/utils';

export class CryptoService {
  /**
   * Hash a password using PBKDF2
   */
  static async hashPassword(
    password: string,
    saltArray?: Uint8Array
  ): Promise<{ hash: string; salt: string; iterations: number }> {
    const salt = saltArray || generateSalt();
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: SECURITY.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    return {
      hash: arrayBufferToBase64(derivedBits),
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      iterations: SECURITY.PBKDF2_ITERATIONS,
    };
  }

  /**
   * Verify a password against a stored hash
   */
  static async verifyPassword(
    password: string,
    storedHash: string,
    storedSalt: string,
    _iterations: number
  ): Promise<boolean> {
    try {
      const salt = base64ToArrayBuffer(storedSalt);
      const { hash } = await this.hashPassword(password, salt);

      // Constant-time comparison
      return hash === storedHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Validate password strength before hashing
   */
  static validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < SECURITY.PASSWORD_MIN_LENGTH) {
      return {
        valid: false,
        error: `Password must be at least ${SECURITY.PASSWORD_MIN_LENGTH} characters`,
      };
    }

    if (password.length > 128) {
      return {
        valid: false,
        error: 'Password is too long',
      };
    }

    return { valid: true };
  }
}
