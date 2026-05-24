import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const carts = await prisma.abandonedCart.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  
  if (carts.length > 0) {
    const contents = JSON.parse(carts[0].cartContents);
    console.log(JSON.stringify(contents, null, 2));
  } else {
    console.log("No carts found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
