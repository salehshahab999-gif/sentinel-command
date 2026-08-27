import { prisma } from "../database/prisma-client";
import type { Prisma } from "../../app/generated/prisma-local/client";
import type { SentinelAlert } from "./alert-types";
import { markAlertEngineActivity } from "./alert-status";

export async function saveAlert(
  alert: SentinelAlert,
): Promise<void> {
  markAlertEngineActivity();

  await prisma.$transaction(async (tx) => {
    const existingAlert = await tx.alert.findFirst({
      where: {
        source: alert.source,
        type: alert.type,
        status: "NEW",
        resolvedAt: null,
      },
    });

    if (existingAlert) {
      return;
    }

    await tx.alert.create({
      data: {
        id: alert.id,
        eventId: alert.eventId,
        severity: alert.severity,
        status: alert.status,
        source: alert.source,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        createdAt: new Date(alert.createdAt),
        resolvedAt: null,
      },
    });

    const historyId = `HISTORY-${alert.id}`;

    await tx.alertHistory.create({
      data: {
        id: historyId,
        alertId: alert.id,
        action: "CREATED",
        severity: alert.severity,
        status: alert.status,
        source: alert.source,
        message: alert.description,
        data: alert.data as Prisma.InputJsonValue,
      },
    });

    await tx.syncQueue.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          entity: "Alert",
          operation: "CREATE",
          payload: JSON.stringify(alert),
        },
        {
          id: crypto.randomUUID(),
          entity: "AlertHistory",
          operation: "CREATE",
          payload: JSON.stringify({
            id: historyId,
            alertId: alert.id,
            action: "CREATED",
            timestamp: new Date().toISOString(),
            severity: alert.severity,
            status: alert.status,
            source: alert.source,
            message: alert.description,
            data: alert.data,
          }),
        },
      ],
    });
  });
}

export async function resolveAlert(
  source: string,
  type: string,
): Promise<void> {
  markAlertEngineActivity();

  await prisma.$transaction(async (tx) => {
    const activeAlert = await tx.alert.findFirst({
      where: {
        source,
        type,
        status: "NEW",
        resolvedAt: null,
      },
    });

    if (!activeAlert) {
      return;
    }

    const resolvedAt = new Date();
    const historyId = `HISTORY-RESOLVED-${activeAlert.id}`;

    await tx.alert.update({
      where: {
        id: activeAlert.id,
      },
      data: {
        status: "RESOLVED",
        resolvedAt,
      },
    });

    await tx.alertHistory.create({
      data: {
        id: historyId,
        alertId: activeAlert.id,
        action: "RESOLVED",
        severity: activeAlert.severity,
        status: "RESOLVED",
        source: activeAlert.source,
        message: `Alert resolved: ${activeAlert.type}`,
      },
    });

    await tx.syncQueue.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          entity: "Alert",
          operation: "UPDATE",
          payload: JSON.stringify({
            id: activeAlert.id,
            status: "RESOLVED",
            resolvedAt,
          }),
        },
        {
          id: crypto.randomUUID(),
          entity: "AlertHistory",
          operation: "CREATE",
          payload: JSON.stringify({
            id: historyId,
            alertId: activeAlert.id,
            action: "RESOLVED",
            timestamp: new Date().toISOString(),
            severity: activeAlert.severity,
            status: "RESOLVED",
            source: activeAlert.source,
            message: `Alert resolved: ${activeAlert.type}`,
          }),
        },
      ],
    });
  });
}