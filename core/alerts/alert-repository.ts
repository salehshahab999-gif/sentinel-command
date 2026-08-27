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

    await tx.alertHistory.create({
      data: {
        id: `HISTORY-${alert.id}`,
        alertId: alert.id,
        action: "CREATED",
        severity: alert.severity,
        status: alert.status,
        source: alert.source,
        message: alert.description,
        data: alert.data as Prisma.InputJsonValue,
      },
    });

    await tx.syncQueue.create({
      data: {
        id: crypto.randomUUID(),
        entity: "Alert",
        operation: "CREATE",
        payload: JSON.stringify(alert),
      },
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
        id: `HISTORY-RESOLVED-${activeAlert.id}`,
        alertId: activeAlert.id,
        action: "RESOLVED",
        severity: activeAlert.severity,
        status: "RESOLVED",
        source: activeAlert.source,
        message: `Alert resolved: ${activeAlert.type}`,
      },
    });

    await tx.syncQueue.create({
      data: {
        id: crypto.randomUUID(),
        entity: "Alert",
        operation: "UPDATE",
        payload: JSON.stringify({
          id: activeAlert.id,
          status: "RESOLVED",
          resolvedAt,
        }),
      },
    });
  });
}