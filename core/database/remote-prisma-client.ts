import { PrismaClient } from "../../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForRemotePrisma =
  globalThis as unknown as {
    remotePrisma:
      | PrismaClient
      | undefined;
  };

export function getRemotePrisma(): PrismaClient {
  const existing =
    globalForRemotePrisma.remotePrisma;

  if (existing) {
    return existing;
  }

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

  const client =
    new PrismaClient({
      adapter,
    });

  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    globalForRemotePrisma.remotePrisma =
      client;
  }

  return client;
}
