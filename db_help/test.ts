import 'dotenv/config';

import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { createListing } from './listing.service';
import { createUser } from './user.service';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const email = `farmer.test+${Date.now()}@example.com`;

  const user = await createUser({
    email,
    role: Role.FARMER,
  });

  const listing = await createListing({
    title: 'Fresh Organic Tomatoes',
    description: 'Organic tomatoes grown without pesticides.',
    productDescription: 'Heirloom variety picked at peak ripeness.',
    priceCents: 325,
    quantity: 100,
    unit: 'kg',
    category: 'Vegetables',
    location: 'Nairobi, Kenya',
    images: ['https://example.com/tomato.jpg'],
    sellerId: user.id,
    contractPrice: '3.25',
    contractStock: 100,
  });

  const fetched = await prisma.listing.findMany({
    where: { sellerId: user.id },
    include: { seller: true },
  });

  console.log({
    database: process.env.DATABASE_URL,
    user: user.email,
    listingId: listing.id,
    listingCount: fetched.length,
  });
}

main()
  .catch((error) => {
    console.error('DB helper test failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
