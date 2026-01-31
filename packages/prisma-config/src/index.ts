import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://safetag:safetag@localhost:5432/safetag';

export function createPrismaClient(schema?: string): PrismaClient {
  const url = schema
    ? `${DATABASE_URL}?schema=${schema}`
    : DATABASE_URL;

  const client = new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV !== 'production' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client;
}

export { PrismaClient };
