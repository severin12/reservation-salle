const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedAdminPassword = await bcrypt.hash('Admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@reservation.dev' },
    update: { password: hashedAdminPassword },
    create: {
      name: 'Admin',
      email: 'admin@reservation.dev',
      password: hashedAdminPassword,
      role: 'Admin',
      department: 'Direction',
    },
  });

  const rooms = [
    { name: 'Salle A101', capacity: 40, equipment: 'Projecteur, Tableau', building: 'Bloc A', isAvailable: true },
    { name: 'Salle B205', capacity: 25, equipment: 'Vidéo, Micro', building: 'Bloc B', isAvailable: true },
    { name: 'Salle C310', capacity: 60, equipment: 'Caméra, Wi-Fi', building: 'Bloc C', isAvailable: true },
    { name: 'Amphi Principal', capacity: 120, equipment: 'Sonorisation, Écran', building: 'Amphi', isAvailable: true },
  ];

  for (const room of rooms) {
    const existing = await prisma.room.findFirst({ where: { name: room.name } });
    if (!existing) {
      await prisma.room.create({ data: room });
    }
  }

  const roomA = await prisma.room.findFirst({ where: { name: 'Salle A101' } });
  const amphi = await prisma.room.findFirst({ where: { name: 'Amphi Principal' } });

  await prisma.reservation.createMany({
    data: [
      {
        roomId: roomA.id,
        userId: user.id,
        date: new Date('2026-06-07'),
        startTime: '09:00',
        endTime: '10:30',
        reason: 'Réunion équipe',
        status: 'confirmed',
      },
      {
        roomId: amphi.id,
        userId: user.id,
        date: new Date('2026-06-07'),
        startTime: '11:00',
        endTime: '12:00',
        reason: 'Formation',
        status: 'pending',
      },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
