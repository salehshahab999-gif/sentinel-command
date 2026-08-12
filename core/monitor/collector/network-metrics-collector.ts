import os from "os";
import type { CollectorResult } from "./collector-types";

export function collectNetworkInfo(): CollectorResult {
  const interfaces = os.networkInterfaces();

  const addresses = Object.entries(interfaces).flatMap(
    ([name, values]) =>
      values?.map((item) => ({
        adapter: name,
        address: item.address,
        family: item.family,
        internal: item.internal,
      })) ?? []
  );

  return {
    name: "Network Info",
    status: "READY",
    value: addresses,
    timestamp: new Date().toISOString(),
  };
}