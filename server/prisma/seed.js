import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Home Cleaning", description: "Cleaning services for homes and apartments." },
    { name: "Plumbing", description: "Plumbing repairs, installation, and maintenance." },
    { name: "Electrical", description: "Electrical repair and installation services." },
    { name: "Gardening", description: "Garden maintenance and landscaping services." },
    { name: "IT & Networking", description: "Computer and network setup and repair." },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: category,
      });
    } else {
      await prisma.category.update({
        where: { id: existing.id },
        data: { description: category.description },
      });
    }
  }

  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
