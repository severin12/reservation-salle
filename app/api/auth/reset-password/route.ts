import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'La confirmation ne correspond pas.' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: await hashPassword(password) },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({ ok: true, message: 'Mot de passe mis à jour.' });
  } catch (error) {
    console.error('POST /api/auth/reset-password failed', error);
    return NextResponse.json({ error: 'Réinitialisation impossible.' }, { status: 500 });
  }
}
