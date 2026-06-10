import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReservationRefusedEmail } from '@/lib/email';
import { formatDateFr } from '@/lib/utils';
import { forbidden, getSessionUser, unauthorized } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return unauthorized();
  if (session.role !== 'Admin') return forbidden('Seul un administrateur peut refuser une réservation.');

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID réservation requis.' }, { status: 400 });

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { room: true, user: true },
    });

    await sendReservationRefusedEmail({
      to: reservation.user.email,
      userName: reservation.user.name,
      roomName: reservation.room.name,
      date: formatDateFr(reservation.date),
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      reason: reservation.reason,
    });

    return NextResponse.json({ reservation, ok: true });
  } catch (error) {
    console.error('POST /api/reservations/refuse failed', error);
    return NextResponse.json({ error: 'Impossible de refuser la réservation.' }, { status: 500 });
  }
}
