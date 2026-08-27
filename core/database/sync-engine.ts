import { prisma } from "./prisma-client";
import { checkRemoteConnectivity } from "./remote-connectivity";

export type SyncQueueStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface SyncEngineResult {
  remoteAvailable: boolean;
  pendingCount: number;
}

export interface SyncProcessResult {
  processed: number;
  completed: number;
  failed: number;
  skipped: boolean;
}

export async function inspectSyncQueue(): Promise<SyncEngineResult> {
  const pendingCount = await prisma.syncQueue.count({
    where: {
      status: "PENDING",
    },
  });

  const connectivity = await checkRemoteConnectivity();

  return {
    remoteAvailable: connectivity.available,
    pendingCount,
  };
}

export async function processSyncQueue(): Promise<SyncProcessResult> {
  const connectivity = await checkRemoteConnectivity();

  if (!connectivity.available) {
    return {
      processed: 0,
      completed: 0,
      failed: 0,
      skipped: true,
    };
  }

  const items = await prisma.syncQueue.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let completed = 0;
  let failed = 0;

  for (const item of items) {
    await prisma.syncQueue.update({
      where: {
        id: item.id,
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
      },
    });

    try {
      // Remote sync will be implemented in the next step.
      // For now, leave the item in PROCESSING so no fake
      // success is reported before the actual remote write exists.

      completed += 0;
    } catch (error) {
      failed += 1;

      await prisma.syncQueue.update({
        where: {
          id: item.id,
        },
        data: {
          status: "FAILED",
          lastError:
            error instanceof Error
              ? error.message
              : "Unknown sync error",
        },
      });
    }
  }

  return {
    processed: items.length,
    completed,
    failed,
    skipped: false,
  };
}