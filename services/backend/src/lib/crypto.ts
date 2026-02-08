import crypto from 'crypto';
import bcrypt from 'bcrypt';

// AES-256-GCM encryption for session tokens (A02 Cryptographic Failures mitigation)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key (must be 32 bytes for AES-256)
function getEncryptionKey(): Buffer {
  const key = process.env.SESSION_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_ENCRYPTION_KEY is required in production');
    }
    // Dev fallback - NOT for production
    return crypto.scryptSync('dev-key-do-not-use-in-prod', 'salt', 32);
  }
  // If key is provided as hex (64 chars = 32 bytes)
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // Otherwise derive key from the secret
  return crypto.scryptSync(key, 'safetag-salt', 32);
}

// Encrypt payload to session token
export function encryptSessionToken<T extends object>(payload: T): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonPayload = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(jsonPayload, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV (16 bytes) + Auth Tag (16 bytes) + Encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted]);

  // Return as URL-safe base64
  return combined
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Decrypt session token to payload
export function decryptSessionToken<T>(token: string): T {
  const key = getEncryptionKey();

  // Convert from URL-safe base64
  const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
  const combined = Buffer.from(base64, 'base64');

  // Extract parts
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    throw new Error('Invalid or tampered session token');
  }
}

// Hash password with bcrypt-compatible format
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password against hash
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate OTP code (6 digits)
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate secure random string
export function generateSecureId(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// HMAC signature for webhook verification (A08 Data Integrity)
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
