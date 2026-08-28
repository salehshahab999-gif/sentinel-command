import { getMonitorState } from "./monitor-engine";

import { MONITOR_RUNTIME } from "./monitor-runtime";

import {
  runCollectorsWithRuntime,
} from "./collector/collector-service";

import type {
  CollectorResult,
} from "./collector/collector-types";

import type {
  CollectorHealth,
} from "./collector/collector-health";

import { evaluateCollectors } from "./monitor-evaluation";

import { evaluateMonitorRules } from "./monitor-rules";

import {
  processEventPipeline,
} from "../events/event-pipeline";

import {
  reportAlertSignal,
  clearAlertSignal,
} from "../alerts/alert-signal";

import {
  resolveAlert,
} from "../alerts/alert-repository";

import { prisma } from "../database/prisma-client";

import {
  inspectSyncQueue,
} from "../database/sync-engine";

import {
  IncidentMemory,
} from "../resilience/incident-memory";

import {
  IncidentPersistence,
} from "../resilience/incident-persistence";

import {
  LiveResilienceCycle,
  type LiveResilienceCycleResult,
} from "../resilience/live-resilience-cycle";

import {
  NetworkBaselineTracker,
} from "../resilience/network-baseline";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "../resilience/reachability-matrix";

import type {
  ResourceSnapshot,
} from "../resilience/resource-governor";

const resilienceMemory =
  new IncidentMemory();

const resiliencePersistence =
  new IncidentPersistence();

const resilienceCycle =
  new LiveResilienceCycle();

const resilienceMatrix =
  new ReachabilityMatrix();

const resilienceBaselineTracker =
  new NetworkBaselineTracker();

let resilienceMemoryInitialized =
  false;

type MonitorTargetRow = {
  id: string;
  name: string;
  address: string | null;
};

function toReachabilityTarget(
  target: MonitorTargetRow,
): ReachabilityTarget | null {
  const rawAddress =
    target.address?.trim();

  if (!rawAddress) {
    return null;
  }

  let host =
    rawAddress;

  let port =
    443;

  try {
    const normalizedAddress =
      /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(
        rawAddress,
      )
        ? rawAddress
        : `https://${rawAddress}`;

    const url =
      new URL(
        normalizedAddress,
      );

    host =
      url.hostname;

    if (url.port) {
      port =
        Number(
          url.port,
        );
    }
  } catch {
    const ipv6Match =
      rawAddress.match(
        /^\[([^\]]+)\](?::(\d+))?$/,
      );

    if (ipv6Match) {
      host =
        ipv6Match[1];

      port =
        ipv6Match[2]
          ? Number(
              ipv6Match[2],
            )
          : 443;
    } else {
      const hostPortMatch =
        rawAddress.match(
          /^([^:\s/]+)(?::(\d+))?$/,
        );

      if (!hostPortMatch) {
        return null;
      }

      host =
        hostPortMatch[1];

      port =
        hostPortMatch[2]
          ? Number(
              hostPortMatch[2],
            )
          : 443;
    }
  }

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    return null;
  }

  return {
    id:
      target.id,

    name:
      target.name,

    host,

    port,

    protocol:
      "TCP",

    critical:
      false,
  };
}

function getCpuPercent(
  collectors: CollectorResult[],
): number {
  const cpu =
    collectors.find(
      (collector) =>
        collector.name ===
        "CPU Load",
    );

  return typeof cpu?.value ===
    "number"
    ? cpu.value
    : 0;
}

function getMemoryPercent(
  collectors: CollectorResult[],
): number {
  const memory =
    collectors.find(
      (collector) =>
        collector.name ===
        "Memory Usage",
    );

  if (
    !memory ||
    !memory.value ||
    typeof memory.value !==
      "object"
  ) {
    return 0;
  }

  const value =
    memory.value as {
      usedGB?: unknown;
      totalGB?: unknown;
    };

  if (
    typeof value.usedGB !==
      "number" ||
    typeof value.totalGB !==
      "number" ||
    value.totalGB <= 0
  ) {
    return 0;
  }

  return Number(
    (
      (value.usedGB /
        value.totalGB) *
      100
    ).toFixed(1),
  );
}

async function buildResourceSnapshot(
  collectors: CollectorResult[],
): Promise<ResourceSnapshot> {
  let queueDepth =
    0;

  let remoteAvailable =
    false;

  try {
    const sync =
      await inspectSyncQueue();

    queueDepth =
      sync.pendingCount;

    remoteAvailable =
      sync.remoteAvailable;
  } catch {
    queueDepth =
      0;

    remoteAvailable =
      false;
  }

  return {
    cpuPercent:
      getCpuPercent(
        collectors,
      ),

    memoryPercent:
      getMemoryPercent(
        collectors,
      ),

    queueDepth,

    networkHealthy:
      true,

    remoteAvailable,
  };
}

function buildCollectorHealth(
  runtimeResults: Array<{
    result: CollectorResult;
    durationMs: number;
  }>,
): CollectorHealth[] {
  return runtimeResults.map(
    ({
      result,
      durationMs,
    }) => {
      const failed =
        result.status ===
        "FAILED";

      return {
        name:
          result.name,

        status:
          failed
            ? "FAILED"
            : "HEALTHY",

        durationMs,
      };
    },
  );
}

async function runLiveResilience(
  collectors: CollectorResult[],
) {
  const databaseTargets =
    (await prisma.target.findMany({
      select: {
        id: true,
        name: true,
        address: true,
      },
    })) as MonitorTargetRow[];

  const targets =
    databaseTargets
      .map(
        toReachabilityTarget,
      )
      .filter(
        (
          target,
        ): target is ReachabilityTarget =>
          target !== null,
      );

  const skippedTargets =
    databaseTargets.filter(
      (target) =>
        !toReachabilityTarget(
          target,
        ),
    );

  if (
    targets.length ===
    0
  ) {
    const resources:
      ResourceSnapshot = {
      cpuPercent:
        getCpuPercent(
          collectors,
        ),

      memoryPercent:
        getMemoryPercent(
          collectors,
        ),

      queueDepth:
        0,

      networkHealthy:
        true,

      remoteAvailable:
        false,
    };

    return {
      status:
        databaseTargets.length ===
        0
          ? "NO_TARGETS"
          : "NO_VALID_TARGETS",

      targetCount:
        databaseTargets.length,

      validTargetCount:
        0,

      skippedTargetCount:
        skippedTargets.length,

      resources,

      cycle:
        null as
          | LiveResilienceCycleResult
          | null,

      memoryInitialized:
        resilienceMemoryInitialized,

      message:
        databaseTargets.length ===
        0
          ? "No resilience targets are configured"
          : "No valid resilience targets were found",
    };
  }

  const resources =
    await buildResourceSnapshot(
      collectors,
    );

  if (
    !resilienceMemoryInitialized
  ) {
    await resiliencePersistence.loadIntoMemory(
      resilienceMemory,
    );

    resilienceMemoryInitialized =
      true;
  }

  resilienceMatrix.clearRecords();

  const cycle =
    await resilienceCycle.run(
      targets,
      resources,
      resilienceMemory,
      resilienceBaselineTracker,
      resilienceMatrix,
    );

  return {
    status:
      "ACTIVE",

    targetCount:
      databaseTargets.length,

    validTargetCount:
      targets.length,

    skippedTargetCount:
      skippedTargets.length,

    resources,

    cycle,

    memoryInitialized:
      true,

    message:
      "Live resilience cycle executed",
  };
}

export async function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck =
    new Date().toISOString();

  const runtimeResults =
    await runCollectorsWithRuntime();

  const collectors =
    runtimeResults.map(
      ({
        result,
      }) => result,
    );

  const evaluationEvents =
    evaluateCollectors(
      collectors,
    );

  const ruleEvents =
    evaluateMonitorRules(
      collectors,
    );

  const events = [
    ...evaluationEvents,
    ...ruleEvents,
  ];

  for (const event of ruleEvents) {
    reportAlertSignal({
      source:
        "MONITOR",

      severity:
        event.severity,

      type:
        event.type,

      message:
        event.description,

      timestamp:
        event.timestamp,

      active:
        true,

      data:
        event.data,
    });
  }

  const monitorRules = [
    {
      source:
        "CPU Load",
      type:
        "CPU Warning",
    },
    {
      source:
        "CPU Load",
      type:
        "CPU Critical",
    },
    {
      source:
        "Memory Usage",
      type:
        "Memory Warning",
    },
    {
      source:
        "Memory Usage",
      type:
        "Memory Critical",
    },
    {
      source:
        "Disk Usage",
      type:
        "Disk Warning",
    },
    {
      source:
        "Disk Usage",
      type:
        "Disk Critical",
    },
  ];

  for (
    const rule of
    monitorRules
  ) {
    const active =
      ruleEvents.some(
        (event) =>
          event.type ===
          rule.type,
      );

    if (!active) {
      clearAlertSignal(
        "MONITOR",
        rule.type,
      );

      await resolveAlert(
        rule.source,
        rule.type,
      );
    }
  }

  const pipeline =
    await processEventPipeline(
      events,
    );

  const health =
    buildCollectorHealth(
      runtimeResults,
    );

  const resilience =
    await runLiveResilience(
      collectors,
    );

  return {
    state:
      getMonitorState(),

    runtime:
      MONITOR_RUNTIME,

    collectors,

    health,

    events:
      pipeline.events,

    alerts:
      pipeline.alerts,

    resilience,
  };
}