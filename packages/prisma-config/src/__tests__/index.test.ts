import { describe, it, expect, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  const MockPrismaClient = class {
    constructor(public _opts?: any) {}
  };
  return { PrismaClient: MockPrismaClient };
});

import { createPrismaClient, PrismaClient } from '../index.js';

describe('prisma-config', () => {
  it('exports createPrismaClient function', () => {
    expect(typeof createPrismaClient).toBe('function');
  });

  it('exports PrismaClient class', () => {
    expect(PrismaClient).toBeDefined();
  });

  it('creates a PrismaClient instance', () => {
    const client = createPrismaClient();
    expect(client).toBeInstanceOf(PrismaClient);
  });

  it('creates a PrismaClient with schema parameter', () => {
    const client = createPrismaClient('auth');
    expect(client).toBeInstanceOf(PrismaClient);
  });
});
