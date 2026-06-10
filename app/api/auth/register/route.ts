import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwt } from '@/lib/auth';
import { validatePassword } from '@/lib/password';
import { setAuthCookie } from '@/lib/session';
import { PUBLIC_ROLES } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, role = 'Personnel', department } = body;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'La confirmation du mot de passe ne correspond pas.' }, { status: 400 });
    }

    const safeRole = PUBLIC_ROLES.includes(role) ? role : 'Personnel';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: safeRole,
        department: department || null,
      },
    });

    const token = signJwt({ sub: user.id, email: user.email, role: user.role, name: user.name }, '8h');

    const response = NextResponse.json(
      {
        ok: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
      },
      { status: 201 },
    );
    setAuthCookie(response, token, false);
    return response;
  } catch (error) {
    console.error('POST /api/auth/register failed', error);
    return NextResponse.json({ error: 'Impossible de créer le compte.' }, { status: 500 });
  }
}
