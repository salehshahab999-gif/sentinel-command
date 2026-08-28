import { PrismaClient } from "../../app/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured",
  );
}

const adapter =
  new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 3000,
  });

const globalForRemotePrisma =
  globalThis as unknown as {
    remotePrisma:
      | PrismaClient
      | undefined;
  };

export const remotePrisma =
  globalForRemotePrisma.remotePrisma ??
  new PrismaClient({
    adapter,
  });

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForRemotePrisma.remotePrisma =
    remotePrisma;
}