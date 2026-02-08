import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

// Short-lived access tokens (15 minutes) - A07 Auth Failures mitigation
const ACCESS_TOKEN_EXPIRY = '15m';
// Refresh tokens (7 days)
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  phone: string;
  role: 'OWNER' | 'DEALER' | 'ADMIN';
}

export interface DecodedToken extends TokenPayload, JwtPayload {}

// Generate access token (short-lived for security)
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Generate refresh token (longer-lived)
export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

// Verify access token
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

// Token pair generation
export function generateTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: 900, // 15 minutes in seconds
  };
}
