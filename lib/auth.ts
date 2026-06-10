import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET ?? 'votre-secret-jwt-super-securise-2024';

export function signJwt(payload: object, expiresIn: string | number = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
  return payload as { sub?: string; email?: string; role?: string; name?: string };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
