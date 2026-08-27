import { prisma } from "./prisma-client";
import { remotePrisma } from "./remote-prisma-client";
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

export interface SyncRetryResult {
  retried: number;
  skipped: boolean;
}

const STALE_PROCESSING_MS = 5 * 60 * 1000;
const MAX_SYNC_ATTEMPTS = 3;

function parsePayload(payload: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(payload);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Sync payload must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}

function requireString(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = payload[field];

  if (typeof value !== "string") {
    throw new Error(`Missing or invalid string field: ${field}`);
  }

  return value;
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

export async function recoverStaleSyncQueue(): Promise<number> {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);

  const result = await prisma.syncQueue.updateMany({
    where: {
      status: "PROCESSING",
      updatedAt: {
        lt: staleBefore,
      },
    },
    data: {
      status: "PENDING",
      lastError: "Recovered stale PROCESSING item",
    },
  });

  return result.count;
}

export async function retryFailedSyncQueue(): Promise<SyncRetryResult> {
  const connectivity = await checkRemoteConnectivity();

  if (!connectivity.available) {
    return {
      retried: 0,
      skipped: true,
    };
  }

  const result = await prisma.syncQueue.updateMany({
    where: {
      status: "FAILED",
      attempts: {
        lt: MAX_SYNC_ATTEMPTS,
      },
    },
    data: {
      status: "PENDING",
      lastError: "Retry scheduled",
    },
  });

  return {
    retried: result.count,
    skipped: false,
  };
}

async function syncAlertCreate(
  payload: Record<string, unknown>,
): Promise<void> {
  const id = requireString(payload, "id");

  await remotePrisma.alert.upsert({
    where: { id },
    update: {
      eventId: requireString(payload, "eventId"),
      severity: requireString(payload, "severity"),
      status: requireString(payload, "status"),
      source: requireString(payload, "source"),
      type: requireString(payload, "type"),
      title: requireString(payload, "title"),
      description: requireString(payload, "description"),
      createdAt: new Date(requireString(payload, "createdAt")),
      resolvedAt: payload.resolvedAt
        ? new Date(requireString(payload, "resolvedAt"))
        : null,
    },
    create: {
      id,
      eventId: requireString(payload, "eventId"),
      severity: requireString(payload, "severity"),
      status: requireString(payload, "status"),
      source: requireString(payload, "source"),
      type: requireString(payload, "type"),
      title: requireString(payload, "title"),
      description: requireString(payload, "description"),
      createdAt: new Date(requireString(payload, "createdAt")),
      resolvedAt: payload.resolvedAt
        ? new Date(requireString(payload, "resolvedAt"))
        : null,
    },
  });
}

async function syncAlertUpdate(
  payload: Record<string, unknown>,
): Promise<void> {
  const id = requireString(payload, "id");

  await remotePrisma.alert.update({
    where: { id },
    data: {
      status: requireString(payload, "status"),
      resolvedAt: payload.resolvedAt
        ? new Date(requireString(payload, "resolvedAt"))
        : null,
    },
  });
}

async function syncAlertHistoryCreate(
  payload: Record<string, unknown>,
): Promise<void> {
  const id = requireString(payload, "id");

  await remotePrisma.alertHistory.upsert({
    where: { id },
    update: {
      alertId: requireString(payload, "alertId"),
      action: requireString(payload, "action"),
      timestamp: payload.timestamp
        ? new Date(requireString(payload, "timestamp"))
        : undefined,
      severity: requireString(payload, "severity"),
      status: requireString(payload, "status"),
      source: requireString(payload, "source"),
      message: requireString(payload, "message"),
      data: payload.data ?? undefined,
    },
    create: {
      id,
      alertId: requireString(payload, "alertId"),
      action: requireString(payload, "action"),
      timestamp: payload.timestamp
        ? new Date(requireString(payload, "timestamp"))
        : undefined,
      severity: requireString(payload, "severity"),
      status: requireString(payload, "status"),
      source: requireString(payload, "source"),
      message: requireString(payload, "message"),
      data: payload.data ?? undefined,
    },
  });
}

async function syncQueueItem(
  item: Awaited<ReturnType<typeof prisma.syncQueue.findFirstOrThrow>>,
): Promise<void> {
  const payload = parsePayload(item.payload);

  if (item.entity === "Alert" && item.operation === "CREATE") {
    await syncAlertCreate(payload);
    return;
  }

  if (item.entity === "Alert" && item.operation === "UPDATE") {
    await syncAlertUpdate(payload);
    return;
  }

  if (
    item.entity === "AlertHistory" &&
    item.operation === "CREATE"
  ) {
    await syncAlertHistoryCreate(payload);
    return;
  }

  throw new Error(
    `Unsupported sync operation: ${item.entity}/${item.operation}`,
  );
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

  await recoverStaleSyncQueue();
  await retryFailedSyncQueue();

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
    const claimed = await prisma.syncQueue.updateMany({
      where: {
        id: item.id,
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
        lastError: null,
      },
    });

    if (claimed.count !== 1) {
      continue;
    }

    try {
      await syncQueueItem(item);

      await prisma.syncQueue.update({
        where: {
          id: item.id,
        },
        data: {
          status: "COMPLETED",
          lastError: null,
        },
      });

      completed += 1;
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