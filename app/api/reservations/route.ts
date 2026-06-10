import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findReservationConflict } from '@/lib/reservations';
import { sendConflictEmail } from '@/lib/email';
import { formatDateFr } from '@/lib/utils';
import { forbidden, getSessionUser, unauthorized } from '@/lib/session';

async function requireAuth() {
  const session = await getSessionUser();
  if (!session) return { error: unauthorized() };
  return { session };
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { room: true, user: true },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('GET /api/reservations failed', error);
    return NextResponse.json({ error: 'Impossible de charger les réservations.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const userId = body.userId ?? auth.session!.id;

    if (!body.roomId || !body.date || !body.startTime || !body.endTime || !body.reason) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
    }

    const conflict = await findReservationConflict({
      roomId: body.roomId,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
    });

    if (conflict) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const room = await prisma.room.findUnique({ where: { id: body.roomId } });

      if (user && room) {
        await sendConflictEmail({
          to: user.email,
          userName: user.name,
          roomName: room.name,
          date: formatDateFr(body.date),
          startTime: body.startTime,
          endTime: body.endTime,
        });
      }

      return NextResponse.json(
        { error: 'Conflit détecté : la salle est déjà occupée sur ce créneau. Un email vous a été envoyé.' },
        { status: 409 },
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        roomId: body.roomId,
        userId,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        reason: body.reason,
        status: 'pending',
      },
      include: { room: true, user: true },
    });

    return NextResponse.json({ reservation, ok: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reservations failed', error);
    return NextResponse.json({ error: 'Impossible de créer la réservation.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'ID réservation requis.' }, { status: 400 });

    const existing = await prisma.reservation.findUnique({ where: { id: body.id } });
    if (!existing) return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });

    if (body.status && ['confirmed', 'refused'].includes(body.status) && auth.session!.role !== 'Admin') {
      return forbidden('Seul un administrateur peut confirmer ou refuser une réservation.');
    }

    const conflict = await findReservationConflict({
      roomId: body.roomId ?? existing.roomId,
      date: new Date(body.date ?? existing.date),
      startTime: body.startTime ?? existing.startTime,
      endTime: body.endTime ?? existing.endTime,
      excludeId: body.id,
    });

    if (conflict && body.status !== 'cancelled' && body.status !== 'refused') {
      return NextResponse.json({ error: 'Conflit détecté sur ce créneau.' }, { status: 409 });
    }

    const reservation = await prisma.reservation.update({
      where: { id: body.id },
      data: {
        roomId: body.roomId,
        userId: body.userId,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
        reason: body.reason,
        status: body.status,
      },
      include: { room: true, user: true },
    });

    return NextResponse.json({ reservation, ok: true });
  } catch (error) {
    console.error('PUT /api/reservations failed', error);
    return NextResponse.json({ error: 'Impossible de modifier la réservation.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID réservation requis.' }, { status: 400 });

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });

    if (auth.session!.role !== 'Admin' && existing.userId !== auth.session!.id) {
      return forbidden('Vous ne pouvez supprimer que vos propres réservations.');
    }

    await prisma.reservation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/reservations failed', error);
    return NextResponse.json({ error: 'Impossible de supprimer la réservation.' }, { status: 500 });
  }
}
