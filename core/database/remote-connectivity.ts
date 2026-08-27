import { remotePrisma } from "./remote-prisma-client";

export interface RemoteConnectivityResult {
  available: boolean;
  checkedAt: string;
  error?: string;
}

export async function checkRemoteConnectivity(): Promise<RemoteConnectivityResult> {
  const checkedAt = new Date().toISOString();

  try {
    await remotePrisma.$queryRaw`SELECT 1`;

    return {
      available: true,
      checkedAt,
    };
  } catch (error) {
    return {
      available: false,
      checkedAt,
      error: error instanceof Error ? error.message : "Unknown remote error",
    };
  }
}