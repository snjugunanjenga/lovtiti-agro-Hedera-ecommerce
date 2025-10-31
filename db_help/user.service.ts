import prisma  from '../lib/prisma';
import type { Prisma } from '@prisma/client';
export async function createUser(data: Prisma.UserCreateInput) {
  try {
    return await prisma.user.create({ data });
  } catch (e: any) {
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      throw new Error('Email already registered'); // 409 conflict at the API layer
    }
    throw e;
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
