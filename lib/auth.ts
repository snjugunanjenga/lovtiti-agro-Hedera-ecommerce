import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const DEFAULT_JWT_EXPIRY = '7d';
export const AUTH_COOKIE = 'lovtiti_token';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.warn(
    '[auth] JWT_SECRET is not set. Set it in your environment to enable authentication.',
  );
}

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export function signAuthToken(payload: JwtPayload, options?: jwt.SignOptions) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: DEFAULT_JWT_EXPIRY,
    ...options,
  });
}

export function verifyAuthToken(token: string): JwtPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
