import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJwt } from './auth';
import { prisma } from './prisma';
import type { JwtPayload, Role, SessionUser } from './types';
import { ROLES } from './types';

const TOKEN_COOKIE = 'reservation-token';

export async function getJwtPayload(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyJwt(token);
    if (!payload.sub || !payload.email || !payload.role) return null;
    if (!ROLES.includes(payload.role as Role)) return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await getJwtPayload();
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, department: true },
  });

  if (!user || !ROLES.includes(user.role as Role)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    department: user.department,
  };
}

export function getTokenFromRequest(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export async function getJwtPayloadFromRequest(request: Request): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value ?? getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = await verifyJwt(token);
    if (!payload.sub || !payload.email || !payload.role) return null;
    if (!ROLES.includes(payload.role as Role)) return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string, remember = false) {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function unauthorized(message = 'Non autorisé.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Accès refusé.') {
  return NextResponse.json({ error: message }, { status: 403 });
}
