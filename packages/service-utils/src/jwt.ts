import jwt from 'jsonwebtoken';
import * as fs from 'node:fs';
import * as path from 'node:path';

const KEYS_DIR = process.env.JWT_KEYS_DIR || '/app/keys';

function getPrivateKey(): string {
  if (process.env.JWT_PRIVATE_KEY) return process.env.JWT_PRIVATE_KEY;
  try {
    return fs.readFileSync(path.join(KEYS_DIR, 'private.pem'), 'utf-8');
  } catch {
    // Fallback to HMAC secret for dev
    return process.env.JWT_SECRET || 'dev-secret-change-me';
  }
}

function getPublicKey(): string {
  if (process.env.JWT_PUBLIC_KEY) return process.env.JWT_PUBLIC_KEY;
  try {
    return fs.readFileSync(path.join(KEYS_DIR, 'public.pem'), 'utf-8');
  } catch {
    return process.env.JWT_SECRET || 'dev-secret-change-me';
  }
}

// Fail fast in production if no keys are configured
if (process.env.NODE_ENV === 'production') {
  try {
    const key = getPrivateKey();
    if (key === 'dev-secret-change-me') {
      throw new Error('JWT_SECRET or JWT key files must be configured in production');
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('must be configured')) throw err;
    throw new Error('JWT_SECRET or JWT key files must be configured in production');
  }
}

const isRSA = () => {
  try {
    const key = getPrivateKey();
    return key.includes('BEGIN') && key.includes('PRIVATE KEY');
  } catch {
    return false;
  }
};

export interface TokenPayload {
  userId: string;
  phone: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const key = getPrivateKey();
  const algorithm = isRSA() ? 'RS256' : 'HS256';
  return jwt.sign(payload, key, { algorithm, expiresIn: '15m', issuer: 'safetag' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  const key = getPrivateKey();
  const algorithm = isRSA() ? 'RS256' : 'HS256';
  return jwt.sign(payload, key, { algorithm, expiresIn: '30d', issuer: 'safetag' });
}

export function verifyAccessToken(token: string): TokenPayload {
  const key = isRSA() ? getPublicKey() : getPrivateKey();
  const algorithm = isRSA() ? 'RS256' : 'HS256';
  return jwt.verify(token, key, { algorithms: [algorithm], issuer: 'safetag' }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const key = isRSA() ? getPublicKey() : getPrivateKey();
  const algorithm = isRSA() ? 'RS256' : 'HS256';
  return jwt.verify(token, key, { algorithms: [algorithm], issuer: 'safetag' }) as TokenPayload;
}
