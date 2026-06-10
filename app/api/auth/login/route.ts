import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signJwt } from '@/lib/auth';
import { setAuthCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, remember = false } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    const token = signJwt(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      remember ? '30d' : '8h',
    );

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
    setAuthCookie(response, token, remember);
    return response;
  } catch (error) {
    console.error('POST /api/auth/login failed', error);
    return NextResponse.json({ error: 'Connexion impossible.' }, { status: 500 });
  }
}
