import type { PntSourceId, PntSourceKind } from "./pnt-types";

export type PntSourceDefinition = {
  id: PntSourceId;
  kind: PntSourceKind;
  priority: number;
  enabled: boolean;
  independent: boolean;
  implementation: "WINDOWS_BRIDGE" | "FUTURE_GNSS" | "FUTURE_NETWORK";
};

export const PNT_SOURCE_REGISTRY: PntSourceDefinition[] = [
  {
    id: "WINDOWS_LOCATION",
    kind: "WINDOWS",
    priority: 60,
    enabled: true,
    independent: false,
    implementation: "WINDOWS_BRIDGE",
  },
  {
    id: "WINDOWS_SATELLITE",
    kind: "WINDOWS",
    priority: 100,
    enabled: true,
    independent: true,
    implementation: "WINDOWS_BRIDGE",
  },
  {
    id: "WINDOWS_WIFI",
    kind: "WINDOWS",
    priority: 35,
    enabled: true,
    independent: false,
    implementation: "WINDOWS_BRIDGE",
  },
  {
    id: "NETWORK_IP",
    kind: "NETWORK",
    priority: 10,
    enabled: true,
    independent: false,
    implementation: "FUTURE_NETWORK",
  },
  {
    id: "GNSS_RECEIVER_1",
    kind: "GNSS",
    priority: 100,
    enabled: true,
    independent: true,
    implementation: "FUTURE_GNSS",
  },
  {
    id: "GNSS_RECEIVER_2",
    kind: "GNSS",
    priority: 99,
    enabled: true,
    independent: true,
    implementation: "FUTURE_GNSS",
  },
];
