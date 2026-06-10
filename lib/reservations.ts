import { prisma } from './prisma';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

export async function findReservationConflict(params: {
  roomId: string;
  date: Date;
  startTime: string;
  endTime: string;
  excludeId?: string;
}) {
  const dayStart = new Date(params.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(params.date);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.reservation.findMany({
    where: {
      roomId: params.roomId,
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ['pending', 'confirmed'] },
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    include: { room: true, user: true },
  });

  return existing.find((item) =>
    timesOverlap(params.startTime, params.endTime, item.startTime, item.endTime),
  );
}

export function getWeekDayLabels(): string[] {
  return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
}

export function getStartOfWeek(date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
