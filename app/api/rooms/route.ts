import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forbidden, getSessionUser, unauthorized } from '@/lib/session';

async function requireAuth() {
  const session = await getSessionUser();
  if (!session) return { error: unauthorized() };
  return { session };
}

async function requireAdmin() {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (auth.session!.role !== 'Admin') return { error: forbidden('Action réservée aux administrateurs.') };
  return auth;
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'asc' },
      include: { reservations: true },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('GET /api/rooms failed', error);
    return NextResponse.json({ error: 'Impossible de charger les salles.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const room = await prisma.room.create({
      data: {
        name: body.name,
        capacity: Number(body.capacity),
        equipment: body.equipment ?? '',
        building: body.building ?? '',
        isAvailable: body.isAvailable !== false,
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('POST /api/rooms failed', error);
    return NextResponse.json({ error: 'Impossible de créer la salle.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'ID salle requis.' }, { status: 400 });

    const room = await prisma.room.update({
      where: { id: body.id },
      data: {
        name: body.name,
        capacity: Number(body.capacity),
        equipment: body.equipment ?? '',
        building: body.building ?? '',
        isAvailable: body.isAvailable !== false,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('PUT /api/rooms failed', error);
    return NextResponse.json({ error: 'Impossible de modifier la salle.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID salle requis.' }, { status: 400 });

    await prisma.reservation.deleteMany({ where: { roomId: id } });
    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/rooms failed', error);
    return NextResponse.json({ error: 'Impossible de supprimer la salle.' }, { status: 500 });
  }
}
