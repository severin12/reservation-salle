const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@reservation.dev' } });
  console.log('exists=' + !!user);
  console.log('passwordHashPrefix=' + (user && user.password ? user.password.slice(0, 30) : 'none'));
  console.log('compare=' + (user ? await bcrypt.compare('Admin123', user.password) : 'no-user'));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
