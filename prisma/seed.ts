import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed users
  await prisma.user.createMany({
    data: [
      // 5 farmers
      { email: "farmer1@demo.com", role: "FARMER" },
      { email: "farmer2@demo.com", role: "FARMER" },
      { email: "farmer3@demo.com", role: "FARMER" },
      { email: "farmer4@demo.com", role: "FARMER" },
      { email: "farmer5@demo.com", role: "FARMER" },
      // 5 buyers
      { email: "buyer1@demo.com", role: "BUYER" },
      { email: "buyer2@demo.com", role: "BUYER" },
      { email: "buyer3@demo.com", role: "BUYER" },
      { email: "buyer4@demo.com", role: "BUYER" },
      { email: "buyer5@demo.com", role: "BUYER" },
    ],
    skipDuplicates: true,
  });

  // Fetch Farmer users (by email)
  const farmers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "farmer1@demo.com",
          "farmer2@demo.com",
          "farmer3@demo.com",
          "farmer4@demo.com",
          "farmer5@demo.com",
        ],
      },
    },
  });

  // Create 10 products (listings), assign to farmers round-robin
  const products = [
    {
      title: "Organic Tomatoes",
      description: "Fresh organic tomatoes.",
      priceCents: 300,
      quantity: 100,
      category: "Vegetables",
    },
    {
      title: "Maize",
      description: "Quality maize for sale.",
      priceCents: 200,
      quantity: 200,
      category: "Grains",
    },
    {
      title: "Avocado",
      description: "Hass avocados directly from farm.",
      priceCents: 250,
      quantity: 150,
      category: "Fruits",
    },
    {
      title: "Potatoes",
      description: "Irish potatoes, farm-fresh.",
      priceCents: 180,
      quantity: 180,
      category: "Vegetables",
    },
    {
      title: "Honey",
      description: "Pure natural honey.",
      priceCents: 500,
      quantity: 60,
      category: "Produce",
    },
    {
      title: "Eggplant",
      description: "Organic eggplants.",
      priceCents: 220,
      quantity: 90,
      category: "Vegetables",
    },
    {
      title: "Cassava",
      description: "Healthy cassava tubers.",
      priceCents: 170,
      quantity: 250,
      category: "Roots",
    },
    {
      title: "Mango",
      description: "Juicy mangoes in season.",
      priceCents: 270,
      quantity: 80,
      category: "Fruits",
    },
    {
      title: "Cabbage",
      description: "Green cabbage heads.",
      priceCents: 190,
      quantity: 140,
      category: "Vegetables",
    },
    {
      title: "Rice",
      description: "Locally grown rice.",
      priceCents: 400,
      quantity: 160,
      category: "Grains",
    },
  ];

  // Assign to farmers in order
  for (let i = 0; i < products.length; i++) {
    const farmer = farmers[i % farmers.length];
    await prisma.listing.create({
      data: {
        sellerId: farmer.id,
        title: products[i].title,
        description: products[i].description,
        priceCents: products[i].priceCents,
        currency: "USD",
        quantity: products[i].quantity,
        unit: "kg",
        category: products[i].category,
      },
    });
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
