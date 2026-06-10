import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Créer l'admin
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

  console.log('✅ Admin créé:', user.email);

  // Créer les salles
  const roomsData = [
    { name: 'Salle A101', capacity: 40, equipment: 'Projecteur, Tableau', building: 'Bloc A', isAvailable: true },
    { name: 'Salle B205', capacity: 25, equipment: 'Vidéo, Micro', building: 'Bloc B', isAvailable: true },
    { name: 'Salle C310', capacity: 60, equipment: 'Caméra, Wi-Fi', building: 'Bloc C', isAvailable: true },
    { name: 'Amphi Principal', capacity: 120, equipment: 'Sonorisation, Écran', building: 'Amphi', isAvailable: true },
  ];

  const rooms = [];
  for (const roomData of roomsData) {
    const existing = await prisma.room.findFirst({ where: { name: roomData.name } });
    if (existing) {
      rooms.push(existing);
    } else {
      const room = await prisma.room.create({ data: roomData });
      rooms.push(room);
    }
  }

  console.log('✅ Salles créées:', rooms.length);

  // Créer des réservations
  const salleA101 = rooms.find(r => r.name === 'Salle A101')!;
  const amphi = rooms.find(r => r.name === 'Amphi Principal')!;

  const reservations = await prisma.reservation.createMany({
    data: [
      {
        roomId: salleA101.id,
        userId: user.id,
        date: new Date('2026-06-15'),
        startTime: '09:00',
        endTime: '10:30',
        reason: 'Réunion équipe',
        status: 'confirmed',
      },
      {
        roomId: amphi.id,
        userId: user.id,
        date: new Date('2026-06-15'),
        startTime: '11:00',
        endTime: '12:00',
        reason: 'Formation',
        status: 'pending',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Réservations créées:', reservations.count);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });