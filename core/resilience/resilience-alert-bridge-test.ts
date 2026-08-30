import {
  publishResilienceDecision,
} from "./resilience-alert-bridge";

import {
  prisma,
} from "../database/prisma-client";

import type {
  ResilienceDecision,
} from "./resilience-decision-engine";

function createDecision(
  mode: ResilienceDecision["mode"],
): ResilienceDecision {
  const riskByMode: Record<
    ResilienceDecision["mode"],
    number
  > = {
    NORMAL: 0,
    WATCH: 27,
    PRE_SURVIVAL: 59,
    LOCAL_SURVIVAL: 70,
    EMERGENCY: 100,
  };

  const severityDescription =
    mode === "NORMAL"
      ? "Normal resilience state"
      : `Synthetic ${mode} resilience state`;

  return {
    mode,

    riskScore:
      riskByMode[mode],

    warningLevel:
      mode === "NORMAL"
        ? "NORMAL"
        : mode === "WATCH"
          ? "WATCH"
          : "CRITICAL",

    historicalPatternMatched:
      mode !== "NORMAL",

    enableLocalAI:
      mode === "PRE_SURVIVAL" ||
      mode === "LOCAL_SURVIVAL",

    enableHeavyAnalysis:
      mode === "NORMAL",

    enableSourceRefresh:
      mode !== "EMERGENCY",

    enableNetworkProbes:
      mode !== "EMERGENCY",

    probeIntervalMs:
      mode === "NORMAL"
        ? 30000
        : mode === "WATCH"
          ? 15000
          : 5000,

    maxConcurrentJobs:
      mode === "EMERGENCY"
        ? 1
        : mode === "LOCAL_SURVIVAL"
          ? 2
          : mode === "PRE_SURVIVAL"
            ? 3
            : mode === "WATCH"
              ? 3
              : 4,

    reasons: [
      severityDescription,
    ],

    generatedAt:
      new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  const testModes: ResilienceDecision["mode"][] = [
    "NORMAL",
    "WATCH",
    "PRE_SURVIVAL",
    "LOCAL_SURVIVAL",
    "EMERGENCY",
  ];

  const createdAlertIds: string[] = [];

  console.log(
    "RESILIENCE ALERT BRIDGE TEST STARTED 🚨🧠",
  );

  for (const mode of testModes) {
    console.log(
      "--------------------------------",
    );

    console.log(
      `TEST MODE: ${mode}`,
    );

    const decision =
      createDecision(
        mode,
      );

    const result =
      await publishResilienceDecision(
        decision,
      );

    console.log({
      mode:
        result.mode,

      severity:
        result.severity,

      eventId:
        result.event.id,

      eventType:
        result.event.type,

      alertId:
        result.alertId,
    });

    if (
      result.mode !== mode
    ) {
      throw new Error(
        `Expected mode ${mode}, got ${result.mode}`,
      );
    }

    const expectedSeverity =
      mode === "NORMAL"
        ? "INFO"
        : mode === "WATCH"
          ? "WARNING"
          : mode === "PRE_SURVIVAL"
            ? "ERROR"
            : mode === "LOCAL_SURVIVAL"
              ? "ERROR"
              : "CRITICAL";

    if (
      result.severity !==
      expectedSeverity
    ) {
      throw new Error(
        `${mode}: expected severity ${expectedSeverity}, got ${result.severity}`,
      );
    }

    if (
      result.event.source !==
      "CORE"
    ) {
      throw new Error(
        `${mode}: unexpected event source`,
      );
    }

    if (
      result.event.type !==
      `RESILIENCE_${mode}`
    ) {
      throw new Error(
        `${mode}: unexpected event type`,
      );
    }

    if (
      result.event.status !==
      "NEW"
    ) {
      throw new Error(
        `${mode}: expected NEW event status`,
      );
    }

    if (
      result.alertId !==
      `ALERT-${result.event.id}`
    ) {
      throw new Error(
        `${mode}: alert ID does not match event ID`,
      );
    }

    const savedAlert =
      await prisma.alert.findUnique({
        where: {
          id: result.alertId,
        },
        include: {
          history: true,
        },
      });

    if (!savedAlert) {
      throw new Error(
        `${mode}: alert was not persisted`,
      );
    }

    if (
      savedAlert.source !==
      "CORE"
    ) {
      throw new Error(
        `${mode}: persisted source mismatch`,
      );
    }

    if (
      savedAlert.type !==
      `RESILIENCE_${mode}`
    ) {
      throw new Error(
        `${mode}: persisted alert type mismatch`,
      );
    }

    if (
      savedAlert.severity !==
      expectedSeverity
    ) {
      throw new Error(
        `${mode}: persisted severity mismatch`,
      );
    }

    if (
      savedAlert.history.length <
      1
    ) {
      throw new Error(
        `${mode}: alert history was not created`,
      );
    }

    createdAlertIds.push(
      result.alertId,
    );

    console.log(
      `${mode} ALERT BRIDGE VERIFIED ✅`,
    );
  }

  console.log(
    "--------------------------------",
  );

  console.log(
    "VERIFY SYNC QUEUE",
  );

  const syncEntries =
    await prisma.syncQueue.findMany({
      where: {
        entity: {
          in: [
            "Alert",
            "AlertHistory",
          ],
        },
        operation: {
          in: [
            "CREATE",
          ],
        },
        payload: {
          contains:
            "RESILIENCE_",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (
    syncEntries.length <
    testModes.length
  ) {
    throw new Error(
      `Expected at least ${testModes.length} resilience sync entries, got ${syncEntries.length}`,
    );
  }

  console.log(
    `RESILIENCE SYNC QUEUE VERIFIED ✅ (${syncEntries.length} entries)`,
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "CLEANUP TEST ALERTS",
  );

  for (const alertId of createdAlertIds) {
    await prisma.alertHistory.deleteMany({
      where: {
        alertId,
      },
    });

    await prisma.alert.delete({
      where: {
        id: alertId,
      },
    });
  }

  console.log(
    "TEST ALERT CLEANUP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "RESILIENCE ALERT BRIDGE VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "RESILIENCE ALERT BRIDGE TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);