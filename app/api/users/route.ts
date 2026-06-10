import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/password';
import { forbidden, getSessionUser, unauthorized } from '@/lib/session';
import { ROLES } from '@/lib/types';

async function requireAdmin() {
  const session = await getSessionUser();
  if (!session) return { error: unauthorized() };
  if (session.role !== 'Admin') return { error: forbidden('Seul un administrateur peut gérer les utilisateurs.') };
  return { session };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return unauthorized();

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users failed', error);
    return NextResponse.json({ error: 'Impossible de charger les utilisateurs.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, email, password, role = 'Personnel', department } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nom, email et mot de passe requis.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const safeRole = ROLES.includes(role) ? role : 'Personnel';
    if (safeRole === 'Admin' && auth.session!.role !== 'Admin') {
      return forbidden();
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email déjà utilisé.' }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: safeRole,
        department: department || null,
      },
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /api/users failed', error);
    return NextResponse.json({ error: 'Impossible de créer l\'utilisateur.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, name, email, password, role, department } = body;

    if (!id) return NextResponse.json({ error: 'ID utilisateur requis.' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (department !== undefined) data.department = department || null;
    if (role && ROLES.includes(role)) data.role = role;
    if (password) {
      const passwordError = validatePassword(password);
      if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
      data.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT /api/users failed', error);
    return NextResponse.json({ error: 'Impossible de modifier l\'utilisateur.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID utilisateur requis.' }, { status: 400 });

    if (id === auth.session!.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 });
    }

    await prisma.reservation.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/users failed', error);
    return NextResponse.json({ error: 'Impossible de supprimer l\'utilisateur.' }, { status: 500 });
  }
}
