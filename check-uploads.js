
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.actionableItem.findMany({
    where: {
      OR: [
        { sourceText: { contains: 'upload', mode: 'insensitive' } },
        { metadata: { contains: 'upload', mode: 'insensitive' } },
        { type: { contains: 'exam', mode: 'insensitive' } }
      ]
    },
    include: {
      visit: {
        include: {
          patient: true
        }
      }
    }
  });

  console.log(JSON.stringify(items, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
