import { prisma } from "../database/prisma-client";
import type { Prisma } from "../../app/generated/prisma/client";
import type { SentinelAlert } from "./alert-types";

export async function saveAlert(
  alert: SentinelAlert,
): Promise<void> {
  await prisma.alert.create({
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

  await prisma.alertHistory.create({
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
}