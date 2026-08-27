import { prisma } from "./prisma-client";

export type SyncQueueOperation = "CREATE" | "UPDATE" | "DELETE";

export interface SyncQueueItem {
  entity: string;
  operation: SyncQueueOperation;
  payload: unknown;
}

export async function enqueueSync(
  item: SyncQueueItem,
): Promise<string> {
  const id = crypto.randomUUID();

  await prisma.syncQueue.create({
    data: {
      id,
      entity: item.entity,
      operation: item.operation,
      payload: JSON.stringify(item.payload),
    },
  });

  return id;
}

export async function getPendingSyncQueue() {
  return prisma.syncQueue.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}