import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('SETTINGS:', await prisma.merchantSettings.findMany());
  console.log('CARTS:', await prisma.abandonedCart.findMany());
  console.log('SCHEDULES:', await prisma.emailSchedule.findMany());
}

main().finally(() => prisma.$disconnect());
